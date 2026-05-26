<?php
// ============================================================
// LOGOUT.PHP — Cierra la sesión del usuario.
// session_destroy() elimina todos los datos de la sesión en el servidor.
// ============================================================

require_once 'config.php';

session_destroy();
echo json_encode(['success' => true]);
?>
