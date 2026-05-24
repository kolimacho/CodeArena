// ============================================================
// EVALUATOR.JS — Ejecución de código JS en el navegador
// ============================================================
// Depende de: utils.js (escapeHtml, formatInput, formatValor, showToast)
// Variables globales que lee: monacoEditor, monacoReady,
//                             currentTestCases, currentRetoId, currentUser
// ============================================================

/**
 * Punto de entrada para ejecutar el código del usuario contra
 * todos los casos de prueba del reto actual.
 * Solo soporta JavaScript (ejecución en browser).
 */
function runTests() {
    if (!monacoReady || !monacoEditor) return;

    const codigo = monacoEditor.getValue().trim();
    if (!codigo) { showToast('Escribe tu solución primero', 'warning'); return; }

    const lang = document.getElementById('lang-selector').value;
    if (lang !== 'javascript') {
        showToast('La ejecución en el navegador solo soporta JavaScript por ahora', 'warning');
        return;
    }

    if (!currentTestCases.length) {
        showToast('No hay casos de prueba disponibles para este reto', 'warning');
        return;
    }

    // Verificar que el código define la función "solution"
    if (!/function\s+solution\s*\(/.test(codigo)) {
        showToast('Tu código debe definir una función llamada "solution"', 'warning');
        return;
    }

    const resultados = currentTestCases.map(tc => runSingleTest(codigo, tc));
    renderTestResults(resultados);
}

/**
 * Ejecuta el código del usuario contra un único caso de prueba.
 * Usa new Function() para ejecutar JS dinámico en el navegador.
 *
 * @param {string} userCode - Código fuente del usuario
 * @param {Object} testCase - { input, expected_output }
 * @returns {{ passed, input, expected, actual, error }}
 */
function runSingleTest(userCode, testCase) {
    let input, expected;

    // Parsear input (siempre debe ser JSON con clave → valor)
    try {
        input = JSON.parse(testCase.input);
    } catch (e) {
        return {
            passed: false,
            input: testCase.input,
            expected: null,
            actual: null,
            error: 'Error al parsear el input del test: ' + e.message
        };
    }

    // Parsear expected (puede ser JSON o string plano)
    try {
        expected = JSON.parse(testCase.expected_output);
    } catch (e) {
        expected = testCase.expected_output;
    }

    const paramNames  = Object.keys(input);
    const paramValues = Object.values(input);

    try {
        // Inyectamos el código del usuario en una función dinámica
        // y llamamos a solution() con los parámetros del test case
        const body = `
            "use strict";
            ${userCode}
            if (typeof solution !== 'function') {
                throw new Error('No se encontró la función "solution". Asegúrate de que está definida.');
            }
            return solution(${paramNames.join(', ')});
        `;

        const fn     = new Function(...paramNames, body);
        const actual = fn(...paramValues);

        // Detectar return olvidado
        if (actual === undefined) {
            return {
                passed: false, input, expected, actual: undefined,
                error: 'Tu función devuelve undefined. ¿Te has olvidado del "return"?'
            };
        }

        const passed = resultadosIguales(actual, expected);
        return { passed, input, expected, actual, error: null };

    } catch (e) {
        return { passed: false, input, expected, actual: null, error: e.message };
    }
}

/**
 * Compara dos valores de forma flexible:
 * - JSON.stringify directo (caso más común)
 * - Número vs string ("2" === 2 → true)
 * - Arrays comparados elemento a elemento recursivamente
 *
 * @param {*} actual   - Valor devuelto por la función del usuario
 * @param {*} expected - Valor esperado del test case
 * @returns {boolean}
 */
function resultadosIguales(actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) return true;
    if (String(actual) === String(expected)) return true;
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        return actual.every((v, i) => resultadosIguales(v, expected[i]));
    }
    return false;
}

/**
 * Renderiza los resultados de los tests en el panel lateral.
 * Muestra un resumen general y el detalle de cada test case.
 */
function renderTestResults(resultados) {
    const panel      = document.getElementById('test-panel');
    const resultsDiv = document.getElementById('test-results');
    const summary    = document.getElementById('test-summary');

    const pasados = resultados.filter(r => r.passed).length;
    const total   = resultados.length;
    const allPass = pasados === total;

    summary.innerHTML = allPass
        ? `<span class="badge-success">✅ ${pasados}/${total} tests pasados — ¡Correcto!</span>`
        : `<span class="badge-error">❌ ${pasados}/${total} tests pasados</span>`;

    resultsDiv.innerHTML = resultados.map((r, i) => {
        const actualStr = r.error
            ? `<span style="color:var(--yellow)">⚠ ${escapeHtml(r.error)}</span>`
            : `<code class="${r.passed ? '' : 'val-wrong'}">${escapeHtml(formatValor(r.actual))}</code>`;

        return `
        <div class="test-case ${r.passed ? 'test-pass' : 'test-fail'}">
            <div class="test-case-header">
                <span>${r.passed ? '✅' : '❌'} Test ${i + 1}</span>
            </div>
            <div class="test-case-body">
                <div class="test-row">
                    <span class="test-label">Input:</span>
                    <code>${escapeHtml(formatInput(JSON.stringify(r.input)))}</code>
                </div>
                <div class="test-row">
                    <span class="test-label">Esperado:</span>
                    <code>${escapeHtml(formatValor(r.expected))}</code>
                </div>
                <div class="test-row">
                    <span class="test-label">Obtenido:</span>
                    ${actualStr}
                </div>
            </div>
        </div>`;
    }).join('');

    panel.style.display = 'flex';
}

/** Oculta el panel de resultados de tests */
function closeTestPanel() {
    document.getElementById('test-panel').style.display = 'none';
}

/**
 * Envía la solución al servidor.
 * Para JS: ejecuta primero en el navegador y manda los resultados al backend.
 * Para otros lenguajes: el backend los gestiona (requiere Judge0 en producción).
 */
async function enviarSolucion() {
    if (!currentUser) {
        showToast('Debes iniciar sesión para enviar', 'warning');
        showLoginModal();
        return;
    }
    if (!monacoReady || !monacoEditor) return;

    const codigo = monacoEditor.getValue().trim();
    if (!codigo) { showToast('Escribe tu solución primero', 'warning'); return; }

    const lang = document.getElementById('lang-selector').value;
    const btn  = document.getElementById('btn-submit');

    // Para JS: evaluar en browser y enviar resultados al backend
    let testResults = [];
    if (lang === 'javascript' && currentTestCases.length) {
        testResults = currentTestCases.map(tc => runSingleTest(codigo, tc));
        renderTestResults(testResults);
    }

    btn.textContent = 'Enviando...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/submit_soluciones.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reto_id: currentRetoId,
                codigo,
                lenguaje: lang,
                resultados_cliente: testResults.map(r => ({
                    passed: r.passed,
                    error:  r.error
                }))
            })
        });
        const data = await res.json();

        if (data.success) {
            if (data.passed) {
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
        btn.textContent = 'Enviar solución';
        btn.disabled = false;
    }
}
