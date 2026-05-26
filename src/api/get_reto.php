<?php
// ============================================================
// GET_RETO.PHP — Devuelve el detalle completo de un reto. Solo acepta GET.
// Parámetro requerido: ?id=X
// Devuelve: datos del reto + todos sus casos de prueba (ejemplos y ocultos).
// Acceso público: no requiere sesión.
// ============================================================

require_once 'config.php';

// Casteo a int para evitar inyección a través del parámetro id.
$id = (int) ($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de reto requerido']);
    exit();
}

try {
    // Busca el reto solo si está activo (activo = 1). Los inactivos son "borrados" de cara al usuario.
    $stmt = $pdo->prepare("SELECT * FROM retos WHERE id = ? AND activo = 1");
    $stmt->execute([$id]);
    $reto = $stmt->fetch();

    if (!$reto) {
        http_response_code(404);
        echo json_encode(['error' => 'Reto no encontrado']);
        exit();
    }

    // Carga los casos de prueba del reto: tanto los ejemplos visibles (es_ejemplo=1)
    // como los ocultos que se usan para la evaluación en el cliente.
    $casos = $pdo->prepare("SELECT id, input, expected_output, es_ejemplo, orden FROM casos_prueba WHERE reto_id = ? ORDER BY orden");
    $casos->execute([$id]);
    $reto['casos_prueba'] = $casos->fetchAll();

    // Cast de tipos para que el JSON tenga los tipos correctos (int, bool en vez de string).
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
