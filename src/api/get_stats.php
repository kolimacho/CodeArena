<?php
require_once 'config.php';

try {
    $retos    = $pdo->query("SELECT COUNT(*) FROM retos WHERE activo = 1")->fetchColumn();
    $usuarios = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
    $envios   = $pdo->query("SELECT COUNT(*) FROM envios")->fetchColumn();

    echo json_encode([
        'retos'    => (int) $retos,
        'usuarios' => (int) $usuarios,
        'envios'   => (int) $envios,
    ]);
} catch (PDOException $e) {
    echo json_encode(['retos' => 0, 'usuarios' => 0, 'envios' => 0]);
}
?>
