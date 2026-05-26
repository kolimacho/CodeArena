// ============================================================
// EVALUATOR.JS — Ejecución y envío de código JavaScript.
// Todo ocurre en el navegador: el código nunca se ejecuta en el servidor.
// El mecanismo central es new Function(), que construye y llama una función
// dinámica con el código del usuario y los datos de cada test case.
// ============================================================

// Punto de entrada del botón "▶ Ejecutar".
// Valida que haya código y que defina una función 'solution', luego ejecuta todos los test cases.
function runTests() {
    if (!monacoReady || !monacoEditor) return;

    const codigo = monacoEditor.getValue().trim();
    if (!codigo) { showToast('Escribe tu solución primero', 'warning'); return; }

    if (!currentTestCases.length) {
        showToast('No hay casos de prueba disponibles para este reto', 'warning');
        return;
    }

    // Verifica que el código contiene la función 'solution' antes de intentar ejecutarla.
    if (!/function\s+solution\s*\(/.test(codigo)) {
        showToast('Tu código debe definir una función llamada "solution"', 'warning');
        return;
    }

    const resultados = currentTestCases.map(tc => runSingleTest(codigo, tc));
    renderTestResults(resultados);
}

// Ejecuta el código del usuario contra UN test case usando new Function().
// new Function() construye una función JS dinámica en tiempo real con el código del usuario dentro,
// la llama con los parámetros del test y devuelve el resultado.
function runSingleTest(userCode, testCase) {
    let input, expected;

    // El input viene como string JSON desde la API: '{"s":"hello"}' → { s: "hello" }
    try {
        input = JSON.parse(testCase.input);
    } catch (e) {
        return { passed: false, input: testCase.input, expected: null, actual: null,
                 error: 'Error al parsear el input: ' + e.message };
    }

    // El output esperado también viene como string: '"2"' → 2
    try {
        expected = JSON.parse(testCase.expected_output);
    } catch (e) {
        expected = testCase.expected_output;
    }

    const paramNames  = Object.keys(input);   // ['s']
    const paramValues = Object.values(input);  // ['hello']

    try {
        // Construye el cuerpo de una función que inyecta el código del usuario y llama a solution().
        const body = `
            "use strict";
            ${userCode}
            if (typeof solution !== 'function') {
                throw new Error('No se encontró la función "solution".');
            }
            return solution(${paramNames.join(', ')});
        `;

        const fn     = new Function(...paramNames, body);
        const actual = fn(...paramValues);

        // Si la función no hace return, devuelve undefined — error muy común.
        if (actual === undefined) {
            return { passed: false, input, expected, actual: undefined,
                     error: 'Tu función devuelve undefined. ¿Te olvidaste del "return"?' };
        }

        return { passed: resultadosIguales(actual, expected), input, expected, actual, error: null };

    } catch (e) {
        // Captura errores de sintaxis o runtime del código del usuario.
        return { passed: false, input, expected, actual: null, error: e.message };
    }
}

// Compara el resultado obtenido con el esperado de forma flexible.
// Usa JSON.stringify para comparar arrays y objetos (en JS, [1,2] === [1,2] es false).
// También cubre el caso número vs string ("2" == 2).
function resultadosIguales(actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) return true;
    if (String(actual) === String(expected)) return true;
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        return actual.every((v, i) => resultadosIguales(v, expected[i]));
    }
    return false;
}

// Dibuja el panel de resultados en la parte inferior del editor.
// Si todo pasó: muestra ✅ con mensaje de correcto.
// Si hay fallos: muestra ❌ con el primer error encontrado (esperado vs obtenido).
function renderTestResults(resultados) {
    const panel      = document.getElementById('test-panel');
    const resultsDiv = document.getElementById('test-results');
    const summary    = document.getElementById('test-summary');

    const pasados = resultados.filter(r => r.passed).length;
    const total   = resultados.length;
    const allPass = pasados === total;

    summary.innerHTML = allPass
        ? `<span class="badge-success">✅ ¡Correcto! Todos los tests pasados.</span>`
        : `<span class="badge-error">❌ ${pasados}/${total} tests pasados</span>`;

    if (!allPass) {
        const primeroFallido = resultados.find(r => !r.passed);
        const msg = primeroFallido.error
            ? `<span style="color:var(--yellow)">⚠ ${escapeHtml(primeroFallido.error)}</span>`
            : `Esperado: <code>${escapeHtml(formatValor(primeroFallido.expected))}</code> — Obtenido: <code class="val-wrong">${escapeHtml(formatValor(primeroFallido.actual))}</code>`;
        resultsDiv.innerHTML = `<div class="test-case test-fail"><div class="test-case-body"><div class="test-row">${msg}</div></div></div>`;
    } else {
        resultsDiv.innerHTML = '';
    }

    panel.style.display = 'flex';
}

// Oculta el panel de resultados (botón ✕ del panel).
function closeTestPanel() {
    document.getElementById('test-panel').style.display = 'none';
}

// Punto de entrada del botón "Enviar solución".
// Primero evalúa el código localmente (igual que runTests), luego hace un POST al servidor
// con el código y los resultados. El servidor guarda el envío y suma puntos si pasó todos los tests.
async function enviarSolucion() {
    if (!currentUser) {
        showToast('Debes iniciar sesión para enviar', 'warning');
        showLoginModal();
        return;
    }
    if (!monacoReady || !monacoEditor) return;

    const codigo = monacoEditor.getValue().trim();
    if (!codigo) { showToast('Escribe tu solución primero', 'warning'); return; }

    const btn = document.getElementById('btn-submit');

    const testResults = currentTestCases.map(tc => runSingleTest(codigo, tc));
    renderTestResults(testResults);

    btn.textContent = 'Enviando...';
    btn.disabled = true;

    try {
        // POST a submit_soluciones.php con el código y los resultados ya calculados en el cliente.
        const res = await fetch('/api/submit_soluciones.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reto_id: currentRetoId,
                codigo,
                lenguaje: 'javascript',
                resultados_cliente: testResults.map(r => ({ passed: r.passed, error: r.error }))
            })
        });
        const data = await res.json();

        if (data.success) {
            if (data.passed) {
                // Si pasó todos los tests: muestra los puntos ganados y actualiza la navbar sin recargar.
                showToast(`🏆 ¡Correcto! +${data.puntos_ganados} puntos`, 'success', 4000);
                if (currentUser) {
                    currentUser.puntos_total += data.puntos_ganados;
                    document.getElementById('nav-pts').textContent = currentUser.puntos_total + ' pts';
                }
                loadRetos();
            } else {
                showToast('❌ Algunos tests fallaron. Revisa tu código.', 'error');
            }
        } else {
            showToast('Error: ' + (data.error || 'desconocido'), 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    } finally {
        // finally se ejecuta siempre, haya error o no — restaura el botón.
        btn.textContent = 'Enviar solución';
        btn.disabled = false;
    }
}
