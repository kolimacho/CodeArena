<?php
require_once 'config.php';

$id = (int) ($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de reto requerido']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM retos WHERE id = ? AND activo = 1");
    $stmt->execute([$id]);
    $reto = $stmt->fetch();

    if (!$reto) {
        http_response_code(404);
        echo json_encode(['error' => 'Reto no encontrado']);
        exit();
    }

    // Casos de prueba (ejemplos visibles + ocultos para ejecutar en cliente)
    $casos = $pdo->prepare("SELECT id, input, expected_output, es_ejemplo, orden FROM casos_prueba WHERE reto_id = ? ORDER BY orden");
    $casos->execute([$id]);
    $reto['casos_prueba'] = $casos->fetchAll();

    // Cast de tipos
    $reto['id']          = (int) $reto['id'];
    $reto['puntos']      = (int) $reto['puntos'];
    $reto['completados'] = (int) $reto['completados'];
    $reto['activo']      = (bool) $reto['activo'];

    echo json_encode($reto, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>
