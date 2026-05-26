<?php
// ============================================================
// LOGIN.PHP — Autenticación de usuarios. Solo acepta POST.
// Recibe username/email + password, verifica con bcrypt y crea la sesión.
// ============================================================

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Lee el JSON del cuerpo de la petición (lo que envió fetch() desde el cliente).
$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Usuario y contraseña son obligatorios']);
    exit();
}

// Busca por username O email para que el usuario pueda identificarse con cualquiera de los dos.
// Prepared statement: los ? evitan SQL Injection.
$stmt = $pdo->prepare(
    "SELECT id, username, email, password_hash, puntos_total, is_admin FROM usuarios WHERE username = ? OR email = ?"
);
$stmt->execute([$username, $username]);
$user = $stmt->fetch();

// password_verify() compara la contraseña enviada con el hash bcrypt guardado en la BD.
// Si coinciden: crea la sesión y devuelve los datos del usuario.
// Si no: mismo mensaje de error — no se indica si el usuario existe o no (previene enumeración).
if ($user && password_verify($password, $user['password_hash'])) {
    $_SESSION['user_id']  = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['is_admin'] = (bool) $user['is_admin'];

    // Actualiza la fecha de último acceso del usuario.
    $pdo->prepare("UPDATE usuarios SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

    echo json_encode([
        'success' => true,
        'user'    => [
            'id'           => $user['id'],
            'username'     => $user['username'],
            'email'        => $user['email'],
            'puntos_total' => (int) $user['puntos_total'],
            'is_admin'     => (bool) $user['is_admin'],
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario o contraseña incorrectos']);
}
?>
