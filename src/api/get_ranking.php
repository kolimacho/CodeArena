<?php
require_once 'config.php';

try {
    // Obtener ranking con información detallada
    $stmt = $pdo->query("
        SELECT 
            id,
            username, 
            puntos_total,
            COALESCE(
                (SELECT COUNT(*) FROM soluciones_usuario WHERE usuario_id = usuarios.id AND resuelto = TRUE),
                0
            ) as resueltos,
            created_at as miembro_desde,
            last_login
        FROM usuarios 
        WHERE puntos_total > 0 OR EXISTS (SELECT 1 FROM soluciones_usuario WHERE usuario_id = usuarios.id)
        ORDER BY puntos_total DESC, resueltos DESC
        LIMIT 20
    ");
    
    $ranking = $stmt->fetchAll();
    
    // Agregar iniciales para avatar
    foreach ($ranking as &$user) {
        $user['iniciales'] = strtoupper(substr($user['username'], 0, 2));
        $user['medalla'] = false;
    }
    
    // Agregar medallas a los top 3
    if (count($ranking) > 0) $ranking[0]['medalla'] = '🥇';
    if (count($ranking) > 1) $ranking[1]['medalla'] = '🥈';
    if (count($ranking) > 2) $ranking[2]['medalla'] = '🥉';
    
    echo json_encode([
        'success' => true,
        'ranking' => $ranking,
        'total_usuarios' => $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn()
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>