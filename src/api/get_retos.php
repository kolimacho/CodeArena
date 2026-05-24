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

    // Si el usuario está autenticado, marcar cuáles ha resuelto
    if (isAuthenticated()) {
        $userId = $_SESSION['user_id'];
        foreach ($retos as &$reto) {
            $check = $pdo->prepare(
                "SELECT resuelto FROM soluciones_usuario WHERE usuario_id = ? AND reto_id = ?"
            );
            $check->execute([$userId, $reto['id']]);
            $result = $check->fetch();
            $reto['resuelto'] = $result ? (bool) $result['resuelto'] : false;
        }
        unset($reto);
    } else {
        foreach ($retos as &$reto) {
            $reto['resuelto'] = false;
        }
        unset($reto);
    }

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
