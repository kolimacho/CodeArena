<?php
// ============================================================
// GET_RETOS.PHP — Devuelve la lista de retos activos. Solo acepta GET.
// Parámetro opcional: ?dificultad=easy|medium|hard  (sin parámetro = todos).
// Acceso público: no requiere sesión.
// ============================================================

require_once 'config.php';

$dificultad = $_GET['dificultad'] ?? 'all';

try {
    if ($dificultad === 'all') {
        // Sin filtro: devuelve todos los retos activos ordenados de menor a mayor puntuación.
        $stmt = $pdo->query("SELECT * FROM retos WHERE activo = 1 ORDER BY puntos ASC");
    } else {
        // Con filtro: prepared statement para evitar SQL Injection con el valor de dificultad.
        $stmt = $pdo->prepare(
            "SELECT * FROM retos WHERE activo = 1 AND dificultad = ? ORDER BY puntos ASC"
        );
        $stmt->execute([$dificultad]);
    }

    $retos = $stmt->fetchAll();

    // Cast de tipos: PHP devuelve todo como string desde MySQL; los convertimos a int para el JSON.
    foreach ($retos as &$reto) {
        $reto['id']         = (int) $reto['id'];
        $reto['puntos']     = (int) $reto['puntos'];
        $reto['completados']= (int) $reto['completados'];
    }
    unset($reto); // Elimina la referencia para evitar efectos secundarios.

    // JSON_UNESCAPED_UNICODE evita que los caracteres especiales (tildes, ñ) se escapen como ó.
    echo json_encode($retos, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al cargar los retos']);
}
?>
