<?php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("
        SELECT
            u.id, u.username, u.email, u.puntos_total, u.is_admin,
            u.created_at, u.last_login,
            COALESCE(
                (SELECT COUNT(*) FROM soluciones_usuario WHERE usuario_id = u.id AND resuelto = TRUE),
                0
            ) AS resueltos,
            COALESCE(
                (SELECT COUNT(*) FROM envios WHERE usuario_id = u.id),
                0
            ) AS total_envios
        FROM usuarios u
        ORDER BY u.puntos_total DESC, u.created_at ASC
    ");
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['id']           = (int) $u['id'];
        $u['puntos_total'] = (int) $u['puntos_total'];
        $u['is_admin']     = (bool) $u['is_admin'];
        $u['resueltos']    = (int) $u['resueltos'];
        $u['total_envios'] = (int) $u['total_envios'];
    }

    echo json_encode(['success' => true, 'users' => $users]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data    = json_decode(file_get_contents('php://input'), true);
    $user_id = (int) ($data['user_id'] ?? 0);
    $is_admin = isset($data['is_admin']) ? (int) $data['is_admin'] : null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id requerido']);
        exit();
    }

    // Evitar que el admin se quite sus propios permisos
    if ($user_id === (int) $_SESSION['user_id'] && $is_admin === 0) {
        echo json_encode(['error' => 'No puedes quitarte tus propios permisos de admin']);
        exit();
    }

    if ($is_admin !== null) {
        $pdo->prepare("UPDATE usuarios SET is_admin = ? WHERE id = ?")->execute([$is_admin, $user_id]);
    }

    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
