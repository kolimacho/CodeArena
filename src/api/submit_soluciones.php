<?php
// ============================================================
// SUBMIT_SOLUCIONES.PHP — Registra un envío de código y actualiza puntos. Solo acepta POST.
// Para JS: usa los resultados evaluados en el cliente (no ejecuta código en servidor).
// Aplica lógica de primera resolución: los puntos solo se suman una vez por reto.
// Requiere sesión activa (requireAuth).
// ============================================================

require_once 'config.php';
requireAuth();

// Lee los campos del cuerpo JSON: reto_id, codigo, lenguaje y resultados ya evaluados en el cliente.
$data    = json_decode(file_get_contents('php://input'), true);
$reto_id = (int) ($data['reto_id'] ?? 0);
$codigo  = trim($data['codigo'] ?? '');
$lenguaje = $data['lenguaje'] ?? 'javascript';
$resultados_cliente = $data['resultados_cliente'] ?? [];

if (!$reto_id || empty($codigo)) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos obligatorios']);
    exit();
}

try {
    // Verifica que el reto existe y está activo; obtiene sus puntos.
    $reto = $pdo->prepare("SELECT id, puntos FROM retos WHERE id = ? AND activo = 1");
    $reto->execute([$reto_id]);
    $retoData = $reto->fetch();

    if (!$retoData) {
        echo json_encode(['error' => 'Reto no encontrado']);
        exit();
    }

    $puntos_reto = (int) $retoData['puntos'];

    // Carga los casos de prueba para saber el total esperado.
    $stmt = $pdo->prepare("SELECT * FROM casos_prueba WHERE reto_id = ? ORDER BY orden");
    $stmt->execute([$reto_id]);
    $casos = $stmt->fetchAll();

    $tests_total = count($casos);

    $todos_pasaron = false;
    $tests_pasados = 0;
    $tiempo_inicio = microtime(true);

    if ($lenguaje === 'javascript' && !empty($resultados_cliente)) {
        // JS se evalúa en el navegador con new Function(); el cliente manda los resultados ya hechos.
        // El servidor confía en ellos (el código también se guarda para revisión del admin).
        foreach ($resultados_cliente as $r) {
            if (!empty($r['passed'])) $tests_pasados++;
        }
        $todos_pasaron = ($tests_pasados === $tests_total && $tests_total > 0);
    } else {
        // Para otros lenguajes: simulación (en producción usaría Judge0 o sandbox externo).
        foreach ($casos as $caso) {
            $resultado = simularEvaluacion($codigo, $caso['input'], $caso['expected_output']);
            if ($resultado) $tests_pasados++;
            else break;
        }
        $todos_pasaron = ($tests_pasados === $tests_total && $tests_total > 0);
    }

    $tiempo_ejecucion = microtime(true) - $tiempo_inicio;
    $estado = $todos_pasaron ? 'success' : 'failed';

    // Comprueba ANTES del INSERT si el usuario ya había resuelto este reto.
    // Es crucial hacerlo antes porque el upsert siguiente cambia el estado.
    $checkPrevio = $pdo->prepare(
        "SELECT resuelto FROM soluciones_usuario WHERE usuario_id = ? AND reto_id = ?"
    );
    $checkPrevio->execute([$_SESSION['user_id'], $reto_id]);
    $previo = $checkPrevio->fetch();
    $ya_resuelto = $previo && (bool) $previo['resuelto'];

    // Guarda el envío completo en la tabla envios (historial de todos los intentos).
    $insert = $pdo->prepare(
        "INSERT INTO envios (usuario_id, reto_id, codigo, lenguaje, resultado, puntos_obtenidos, tiempo_ejecucion, tests_pasados, tests_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $insert->execute([
        $_SESSION['user_id'],
        $reto_id,
        $codigo,
        $lenguaje,
        $estado,
        $todos_pasaron ? $puntos_reto : 0,
        round($tiempo_ejecucion, 4),
        $tests_pasados,
        $tests_total,
    ]);

    // ON DUPLICATE KEY UPDATE: si ya existe el par (usuario, reto) incrementa intentos.
    // Solo pone resuelto=TRUE y la fecha si antes era FALSE y ahora sí pasa — nunca retrocede.
    $upsert = $pdo->prepare(
        "INSERT INTO soluciones_usuario (usuario_id, reto_id, resuelto, intentos, completado_at)
         VALUES (?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
             intentos = intentos + 1,
             resuelto = IF(resuelto = FALSE AND VALUES(resuelto) = TRUE, TRUE, resuelto),
             completado_at = IF(resuelto = FALSE AND VALUES(resuelto) = TRUE, NOW(), completado_at)"
    );
    $upsert->execute([
        $_SESSION['user_id'],
        $reto_id,
        $todos_pasaron ? 1 : 0,
        $todos_pasaron ? date('Y-m-d H:i:s') : null,
    ]);

    $puntos_ganados = 0;

    if ($todos_pasaron && !$ya_resuelto) {
        // Suma puntos al usuario y actualiza el contador de completados del reto,
        // solo si es la primera vez que lo resuelve (evita puntos duplicados en reintentos).
        $pdo->prepare("UPDATE usuarios SET puntos_total = puntos_total + ? WHERE id = ?")
            ->execute([$puntos_reto, $_SESSION['user_id']]);

        $pdo->prepare("UPDATE retos SET completados = completados + 1 WHERE id = ?")
            ->execute([$reto_id]);

        $puntos_ganados = $puntos_reto;
    }

    echo json_encode([
        'success'       => true,
        'passed'        => $todos_pasaron,
        'tests_pasados' => $tests_pasados,
        'tests_total'   => $tests_total,
        'puntos_ganados'=> $puntos_ganados,
        'ya_resuelto'   => $ya_resuelto,
        'time'          => round($tiempo_ejecucion, 3) . 's',
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}

// Placeholder para lenguajes no-JS. En producción: llamada a Judge0 API o sandbox Docker.
function simularEvaluacion(string $codigo, string $input, string $expected): bool {
    return rand(0, 100) > 30;
}
?>
