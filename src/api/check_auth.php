<?php
require_once 'config.php';

if (isAuthenticated()) {
    // Refrescar datos del usuario desde DB
    $stmt = $pdo->prepare(
        "SELECT id, username, email, puntos_total, is_admin FROM usuarios WHERE id = ?"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        $_SESSION['is_admin'] = (bool) $user['is_admin'];
        echo json_encode([
            'authenticated' => true,
            'user'          => [
                'id'           => $user['id'],
                'username'     => $user['username'],
                'email'        => $user['email'],
                'puntos_total' => (int) $user['puntos_total'],
                'is_admin'     => (bool) $user['is_admin'],
            ]
        ]);
    } else {
        session_destroy();
        echo json_encode(['authenticated' => false]);
    }
} else {
    echo json_encode(['authenticated' => false]);
}
?>
