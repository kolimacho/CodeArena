<?php
// ============================================================
// ADMIN_RETOS.PHP — CRUD completo de retos desde el panel de administración.
// GET    → lista todos los retos (activos e inactivos).
// POST   → crea un reto nuevo.
// PUT    → actualiza un reto existente.
// DELETE → soft delete (pone activo=0, no borra el registro físicamente).
// Solo accesible por administradores (requireAdmin).
// ============================================================

require_once 'config.php';
requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

// GET — lista todos los retos, incluyendo los inactivos (a diferencia de get_retos.php público).
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT id, titulo, categoria, dificultad, puntos, tiempo_estimado,
               descripcion, completados, activo, created_at
        FROM retos
        ORDER BY dificultad ASC, puntos ASC
    ");
    $retos = $stmt->fetchAll();

    // Cast de tipos para que el JSON tenga int y bool en lugar de strings.
    foreach ($retos as &$r) {
        $r['id']         = (int) $r['id'];
        $r['puntos']     = (int) $r['puntos'];
        $r['completados']= (int) $r['completados'];
        $r['activo']     = (bool) $r['activo'];
    }

    echo json_encode(['success' => true, 'retos' => $retos]);
    exit();
}

// POST — crea un reto nuevo; valida campos obligatorios y que la dificultad sea válida.
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $titulo         = trim($data['titulo'] ?? '');
    $categoria      = trim($data['categoria'] ?? '');
    $dificultad     = $data['dificultad'] ?? 'easy';
    $puntos         = (int) ($data['puntos'] ?? 0);
    $tiempo         = trim($data['tiempo_estimado'] ?? '');
    $descripcion    = trim($data['descripcion'] ?? '');

    if (!$titulo || !$categoria || !$descripcion || !$puntos) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        exit();
    }

    // Sanea la dificultad: si no es un valor válido se fuerza a 'easy'.
    if (!in_array($dificultad, ['easy', 'medium', 'hard'])) {
        $dificultad = 'easy';
    }

    $stmt = $pdo->prepare(
        "INSERT INTO retos (titulo, categoria, dificultad, puntos, tiempo_estimado, descripcion, activo)
         VALUES (?, ?, ?, ?, ?, ?, 1)"
    );
    $stmt->execute([$titulo, $categoria, $dificultad, $puntos, $tiempo, $descripcion]);

    // Devuelve el id generado para que el frontend pueda actualizar la lista sin recargar.
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit();
}

// PUT — actualiza todos los campos de un reto existente; requiere id en el cuerpo JSON.
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = (int) ($data['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID requerido']);
        exit();
    }

    $titulo         = trim($data['titulo'] ?? '');
    $categoria      = trim($data['categoria'] ?? '');
    $dificultad     = $data['dificultad'] ?? 'easy';
    $puntos         = (int) ($data['puntos'] ?? 0);
    $tiempo         = trim($data['tiempo_estimado'] ?? '');
    $descripcion    = trim($data['descripcion'] ?? '');
    $activo         = isset($data['activo']) ? (int) $data['activo'] : 1;

    if (!$titulo || !$categoria || !$descripcion || !$puntos) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos obligatorios']);
        exit();
    }

    if (!in_array($dificultad, ['easy', 'medium', 'hard'])) {
        $dificultad = 'easy';
    }

    $stmt = $pdo->prepare(
        "UPDATE retos SET titulo=?, categoria=?, dificultad=?, puntos=?, tiempo_estimado=?, descripcion=?, activo=?
         WHERE id=?"
    );
    $stmt->execute([$titulo, $categoria, $dificultad, $puntos, $tiempo, $descripcion, $activo, $id]);

    echo json_encode(['success' => true]);
    exit();
}

// DELETE — soft delete: pone activo=0. El reto desaparece para los usuarios pero no se pierde el historial.
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID requerido']);
        exit();
    }

    $pdo->prepare("UPDATE retos SET activo = 0 WHERE id = ?")->execute([$id]);

    echo json_encode(['success' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
