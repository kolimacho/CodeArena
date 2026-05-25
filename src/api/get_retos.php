<?php
require_once 'config.php';

$dificultad = $_GET['dificultad'] ?? 'all';

try {
    if ($dificultad === 'all') {
        $stmt = $pdo->query("SELECT * FROM retos WHERE activo = 1 ORDER BY puntos ASC");
    } else {
        $stmt = $pdo->prepare(
            "SELECT * FROM retos WHERE activo = 1 AND dificultad = ? ORDER BY puntos ASC"
        );
        $stmt->execute([$dificultad]);
    }

    $retos = $stmt->fetchAll();

    // Cast de tipos
    foreach ($retos as &$reto) {
        $reto['id']         = (int) $reto['id'];
        $reto['puntos']     = (int) $reto['puntos'];
        $reto['completados']= (int) $reto['completados'];
    }
    unset($reto);

    echo json_encode($retos, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al cargar los retos']);
}
?>
