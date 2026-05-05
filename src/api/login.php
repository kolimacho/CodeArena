<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Usuario y contraseña son obligatorios']);
    exit();
}

$stmt = $pdo->prepare(
    "SELECT id, username, email, password_hash, puntos_total, is_admin FROM usuarios WHERE username = ? OR email = ?"
);
$stmt->execute([$username, $username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    $_SESSION['user_id']  = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['is_admin'] = (bool) $user['is_admin'];

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
