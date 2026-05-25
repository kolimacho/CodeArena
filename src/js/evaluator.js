// ============================================================
// EVALUATOR.JS — Ejecución de código JS en el navegador
// ============================================================

function runTests() {
    if (!monacoReady || !monacoEditor) return;

    const codigo = monacoEditor.getValue().trim();
    if (!codigo) { showToast('Escribe tu solución primero', 'warning'); return; }

    if (!currentTestCases.length) {
        showToast('No hay casos de prueba disponibles para este reto', 'warning');
        return;
    }

    if (!/function\s+solution\s*\(/.test(codigo)) {
        showToast('Tu código debe definir una función llamada "solution"', 'warning');
        return;
    }

    const resultados = currentTestCases.map(tc => runSingleTest(codigo, tc));
    renderTestResults(resultados);
}

function runSingleTest(userCode, testCase) {
    let input, expected;

    try {
        input = JSON.parse(testCase.input);
    } catch (e) {
        return { passed: false, input: testCase.input, expected: null, actual: null,
                 error: 'Error al parsear el input: ' + e.message };
    }

    try {
        expected = JSON.parse(testCase.expected_output);
    } catch (e) {
        expected = testCase.expected_output;
    }

    const paramNames  = Object.keys(input);
    const paramValues = Object.values(input);

    try {
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

        if (actual === undefined) {
            return { passed: false, input, expected, actual: undefined,
                     error: 'Tu función devuelve undefined. ¿Te olvidaste del "return"?' };
        }

        return { passed: resultadosIguales(actual, expected), input, expected, actual, error: null };

    } catch (e) {
        return { passed: false, input, expected, actual: null, error: e.message };
    }
}

function resultadosIguales(actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) return true;
    if (String(actual) === String(expected)) return true;
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        return actual.every((v, i) => resultadosIguales(v, expected[i]));
    }
    return false;
}

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

    // Si hay fallos, mostramos el primer error útil
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

function closeTestPanel() {
    document.getElementById('test-panel').style.display = 'none';
}

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

    // Evaluar en el navegador antes de enviar
    const testResults = currentTestCases.map(tc => runSingleTest(codigo, tc));
    renderTestResults(testResults);

    btn.textContent = 'Enviando...';
    btn.disabled = true;

    try {
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
