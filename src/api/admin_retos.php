<?php
require_once 'config.php';
requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

// GET — listar todos los retos (activos e inactivos)
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT id, titulo, categoria, dificultad, puntos, tiempo_estimado,
               descripcion, completados, activo, created_at
        FROM retos
        ORDER BY dificultad ASC, puntos ASC
    ");
    $retos = $stmt->fetchAll();

    foreach ($retos as &$r) {
        $r['id']         = (int) $r['id'];
        $r['puntos']     = (int) $r['puntos'];
        $r['completados']= (int) $r['completados'];
        $r['activo']     = (bool) $r['activo'];
    }

    echo json_encode(['success' => true, 'retos' => $retos]);
    exit();
}

// POST — crear nuevo reto
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

    if (!in_array($dificultad, ['easy', 'medium', 'hard'])) {
        $dificultad = 'easy';
    }

    $stmt = $pdo->prepare(
        "INSERT INTO retos (titulo, categoria, dificultad, puntos, tiempo_estimado, descripcion, activo)
         VALUES (?, ?, ?, ?, ?, ?, 1)"
    );
    $stmt->execute([$titulo, $categoria, $dificultad, $puntos, $tiempo, $descripcion]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit();
}

// PUT — actualizar reto existente
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

// DELETE — eliminar reto (soft delete: activo=0)
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
