<?php
// ============================================================
// ADMIN_SUBMISSIONS.PHP — Gestiona el listado y detalle de envíos. Solo acepta GET.
// Modo detalle:  ?id=X  → devuelve un envío concreto con JOIN de usuario y reto.
// Modo listado:  sin id  → top 100-500 envíos con filtro opcional por resultado.
// Solo accesible por administradores (requireAdmin).
// ============================================================

require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id) {
        // Detalle de un envío concreto: JOIN con usuarios y retos para mostrar nombres.
        $stmt = $pdo->prepare("
            SELECT e.*, u.username, r.titulo AS reto_titulo
            FROM envios e
            JOIN usuarios u ON e.usuario_id = u.id
            JOIN retos    r ON e.reto_id    = r.id
            WHERE e.id = ?
        ");
        $stmt->execute([$id]);
        $submission = $stmt->fetch();

        if (!$submission) {
            http_response_code(404);
            echo json_encode(['error' => 'Envío no encontrado']);
            exit();
        }

        echo json_encode(['success' => true, 'submission' => $submission]);
        exit();
    }

    // Listado: filtro opcional por resultado ('success' | 'failed').
    // min() limita el límite a 500 para evitar respuestas demasiado grandes.
    $resultado = $_GET['resultado'] ?? '';
    $limit     = min((int) ($_GET['limit'] ?? 100), 500);

    $where = $resultado ? "WHERE e.resultado = :resultado" : "";
    $stmt  = $pdo->prepare("
        SELECT e.id, e.lenguaje, e.resultado, e.puntos_obtenidos, e.tiempo_ejecucion,
               e.tests_pasados, e.tests_total, e.created_at,
               u.username, u.id AS usuario_id,
               r.titulo AS reto_titulo, r.id AS reto_id
        FROM envios e
        JOIN usuarios u ON e.usuario_id = u.id
        JOIN retos    r ON e.reto_id    = r.id
        $where
        ORDER BY e.created_at DESC
        LIMIT :limit
    ");

    if ($resultado) $stmt->bindValue(':resultado', $resultado);
    // PDO::PARAM_INT es necesario para LIMIT — PDO trata los parámetros como strings por defecto
    // y MySQL no acepta strings en LIMIT dentro de prepared statements.
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(['success' => true, 'submissions' => $stmt->fetchAll()]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
