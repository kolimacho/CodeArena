<?php
// ============================================================
// REGISTER.PHP — Crea una cuenta nueva. Solo acepta POST.
// Valida los campos, hashea la contraseña con bcrypt e inicia sesión automáticamente.
// ============================================================

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Lee el JSON enviado por el formulario de registro.
$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validaciones de campos vacíos y longitudes.
if (empty($username) || empty($email) || empty($password)) {
    echo json_encode(['error' => 'Todos los campos son obligatorios']);
    exit();
}

if (strlen($username) < 3 || strlen($username) > 50) {
    echo json_encode(['error' => 'El usuario debe tener entre 3 y 50 caracteres']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit();
}

// filter_var con FILTER_VALIDATE_EMAIL comprueba que el email tiene formato válido.
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'El formato del email no es válido']);
    exit();
}

// password_hash() aplica bcrypt. Nunca se guarda la contraseña en texto plano.
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO usuarios (username, email, password_hash, is_admin) VALUES (?, ?, ?, 0)"
    );
    $stmt->execute([$username, $email, $password_hash]);

    // lastInsertId() devuelve el ID autoincremental generado por el INSERT.
    $user_id = $pdo->lastInsertId();

    // Inicia sesión automáticamente tras el registro.
    $_SESSION['user_id']  = $user_id;
    $_SESSION['username'] = $username;
    $_SESSION['is_admin'] = false;

    echo json_encode([
        'success' => true,
        'user'    => [
            'id'           => $user_id,
            'username'     => $username,
            'email'        => $email,
            'puntos_total' => 0,
            'is_admin'     => false,
        ]
    ]);
} catch (PDOException $e) {
    // Error 1062 = DUPLICATE ENTRY: username o email ya existe en la BD.
    if ($e->errorInfo[1] == 1062) {
        if (strpos($e->getMessage(), 'username') !== false) {
            echo json_encode(['error' => 'Ese nombre de usuario ya está en uso']);
        } else {
            echo json_encode(['error' => 'Ese email ya está registrado']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear la cuenta']);
    }
}
?>
