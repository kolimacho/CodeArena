<?php
// ============================================================
// CHECK_AUTH.PHP — Comprueba si hay sesión activa al cargar la app.
// app.js lo llama nada más arrancar para saber si el usuario ya estaba logueado.
// Refresca los datos del usuario desde la BD por si cambiaron (ej: puntos, rol).
// ============================================================

require_once 'config.php';

if (isAuthenticated()) {
    // Refresca los datos del usuario desde la BD para que siempre estén actualizados
    // (los puntos o el rol pueden haber cambiado desde el último login).
    $stmt = $pdo->prepare(
        "SELECT id, username, email, puntos_total, is_admin FROM usuarios WHERE id = ?"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        // Sincroniza el rol en la sesión por si un admin lo cambió desde el panel.
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
        // El usuario fue eliminado de la BD pero la sesión seguía activa — la destruimos.
        session_destroy();
        echo json_encode(['authenticated' => false]);
    }
} else {
    echo json_encode(['authenticated' => false]);
}
?>
