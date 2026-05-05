<?php
require_once 'config.php';

$dificultad = $_GET['dificultad'] ?? 'all';

try {
    if ($dificultad === 'all') {
        $stmt = $pdo->query("SELECT * FROM retos ORDER BY puntos ASC");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM retos WHERE dificultad = ? ORDER BY puntos ASC");
        $stmt->execute([$dificultad]);
    }
    
    $retos = $stmt->fetchAll();
    
    // Si el usuario está autenticado, agregar información de si ya resolvió el reto
    if (isAuthenticated()) {
        $userId = $_SESSION['user_id'];
        foreach ($retos as &$reto) {
            $check = $pdo->prepare("SELECT resuelto FROM soluciones_usuario WHERE usuario_id = ? AND reto_id = ?");
            $check->execute([$userId, $reto['id']]);
            $result = $check->fetch();
            $reto['resuelto'] = $result ? (bool)$result['resuelto'] : false;
        }
    }
    
    echo json_encode($retos);
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>