<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Validaciones
if (empty($username) || empty($email) || empty($password)) {
    echo json_encode(['error' => 'All fields are required']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Invalid email format']);
    exit();
}

// Hash de contraseña
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO usuarios (username, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, $password_hash]);
    
    $user_id = $pdo->lastInsertId();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user_id,
            'username' => $username,
            'email' => $email
        ]
    ]);
} catch(PDOException $e) {
    if ($e->errorInfo[1] == 1062) {
        echo json_encode(['error' => 'Username or email already exists']);
    } else {
        echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    }
}
?>