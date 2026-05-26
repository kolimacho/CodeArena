<?php
// ============================================================
// GET_RANKING.PHP — Devuelve el top 20 de usuarios ordenados por puntos. Solo acepta GET.
// Usa subconsultas correlacionadas para contar retos resueltos por usuario.
// Acceso público: no requiere sesión.
// ============================================================

require_once 'config.php';

try {
    // COALESCE devuelve 0 si la subconsulta no encuentra resultados (evita NULL en el JSON).
    // La subconsulta cuenta cuántos retos ha resuelto cada usuario (resuelto = TRUE).
    // Solo aparecen usuarios con puntos o con al menos un envío — evita mostrar cuentas vacías.
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

    // Añade las medallas emoji a los tres primeros puestos.
    if (count($ranking) > 0) $ranking[0]['medalla'] = '🥇';
    if (count($ranking) > 1) $ranking[1]['medalla'] = '🥈';
    if (count($ranking) > 2) $ranking[2]['medalla'] = '🥉';

    echo json_encode([
        'success' => true,
        'ranking' => $ranking,
        'total_usuarios' => $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn()
    ], JSON_UNESCAPED_UNICODE);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
