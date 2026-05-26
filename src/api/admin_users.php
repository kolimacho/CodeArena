<?php
// ============================================================
// ADMIN_USERS.PHP — Gestiona usuarios desde el panel de administración.
// GET  → devuelve todos los usuarios con estadísticas (resueltos, envíos totales).
// POST → cambia el rol is_admin de un usuario.
// Solo accesible por administradores (requireAdmin).
// ============================================================

require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // COALESCE en subconsultas correlacionadas para evitar NULL si el usuario no tiene datos.
    // Devuelve todos los usuarios (también los sin actividad), ordenados por puntos.
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

    // Cast de tipos: PHP devuelve todo como string desde MySQL.
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

    // Protección: un admin no puede quitarse sus propios permisos (quedaría bloqueado).
    if ($user_id === (int) $_SESSION['user_id'] && $is_admin === 0) {
        echo json_encode(['error' => 'No puedes quitarte tus propios permisos de admin']);
        exit();
    }

    // Actualiza el rol del usuario si se proporcionó el campo is_admin.
    if ($is_admin !== null) {
        $pdo->prepare("UPDATE usuarios SET is_admin = ? WHERE id = ?")->execute([$is_admin, $user_id]);
    }

    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
