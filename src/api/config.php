<?php
// ============================================================
// CONFIG.PHP — Base de toda la API. Se incluye con require_once en cada endpoint.
// Hace tres cosas: cabeceras HTTP, conexión PDO a MySQL y funciones de autenticación.
// ============================================================

// Cabeceras JSON y CORS — le dicen al navegador que la respuesta es JSON
// y que acepta peticiones fetch() desde cualquier origen.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responde OK a las peticiones de preflight (OPTIONS) que el navegador manda antes de un fetch real.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Inicia la sesión PHP para poder leer/escribir $_SESSION en todos los endpoints.
session_start();

// Credenciales de la BD desde variables de entorno definidas en docker-compose.yml.
$host   = getenv('DB_HOST')     ?: 'db';
$dbname = getenv('DB_NAME')     ?: 'codearena';
$user   = getenv('DB_USER')     ?: 'codearena_user';
$pass   = getenv('DB_PASSWORD') ?: 'codearena_pass';

// Conexión PDO con modo excepción (lanza PDOException si algo falla) y filas como array asociativo.
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Devuelve true si hay un usuario logueado (existe user_id en la sesión).
function isAuthenticated(): bool {
    return isset($_SESSION['user_id']);
}

// Devuelve true si el usuario de la sesión tiene rol de administrador.
function isAdmin(): bool {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'];
}

// Aborta la petición con 401 si no hay sesión. Se llama al principio de endpoints protegidos.
function requireAuth(): void {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
}

// Aborta con 403 si el usuario no es admin. Llama a requireAuth() primero.
function requireAdmin(): void {
    requireAuth();
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: se requieren permisos de administrador']);
        exit();
    }
}
?>
