// ============================================================
// ESTADO GLOBAL
// ============================================================
let currentUser = null;
let currentRetos = [];
let currentRetoId = null;
let monacoEditor = null;
let monacoViewer = null;
let monacoReady = false;
let currentTestCases = [];
let adminSubmissionsData = [];
let adminUsersData = [];
let adminRetosData = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    initMonaco();
    await checkAuth();
    loadStats();
    showSection('retos');
    setupEventListeners();
});

// ============================================================
// MONACO EDITOR
// ============================================================
function initMonaco() {
    require(['vs/editor/editor.main'], () => {
        monacoReady = true;

        // Tema personalizado oscuro estilo CodeArena
        monaco.editor.defineTheme('codearena', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '666680', fontStyle: 'italic' },
                { token: 'keyword', foreground: '00e87a' },
                { token: 'string', foreground: 'f5c542' },
                { token: 'number', foreground: 'ff9f43' },
            ],
            colors: {
                'editor.background': '#0a0a0e',
                'editor.foreground': '#e0e0ec',
                'editor.lineHighlightBackground': '#1a1a22',
                'editorLineNumber.foreground': '#444460',
                'editorLineNumber.activeForeground': '#00e87a',
                'editor.selectionBackground': '#00e87a33',
                'editorCursor.foreground': '#00e87a',
            }
        });

        monacoEditor = monaco.editor.create(document.getElementById('monaco-container'), {
            value: '',
            language: 'javascript',
            theme: 'codearena',
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: true,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
        });
    });
}

function changeEditorLanguage(lang) {
    if (!monacoEditor || !monacoReady) return;
    const model = monacoEditor.getModel();
    monaco.editor.setModelLanguage(model, lang === 'cpp' ? 'cpp' : lang);

    if (!monacoEditor.getValue().trim()) {
        monacoEditor.setValue(getStarterTemplate(lang));
    }
}

function getStarterTemplate(lang, params = []) {
    const paramStr = params.length ? params.join(', ') : '/* parámetros */';
    const templates = {
        javascript: `function solution(${paramStr}) {\n    // Escribe tu código aquí\n    \n}`,
        python:     `def solution(${paramStr}):\n    # Escribe tu código aquí\n    pass`,
        java:       `class Solution {\n    public Object solution(${paramStr}) {\n        // Escribe tu código aquí\n        return null;\n    }\n}`,
        cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\n// Escribe tu solución aquí\n`,
    };
    return templates[lang] || templates.javascript;
}

// ============================================================
// AUTH
// ============================================================
async function checkAuth() {
    try {
        const res = await fetch('/api/check_auth.php');
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            updateNavForUser(currentUser);
        }
    } catch (e) {
        console.error('Auth check failed:', e);
    }
}

function updateNavForUser(user) {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
    document.getElementById('username-display').textContent = user.username;
    document.getElementById('nav-pts').textContent = user.puntos_total + ' pts';

    if (user.is_admin) {
        document.getElementById('nav-admin').style.display = 'block';
    }
}

async function login(username, password) {
    const btn = document.getElementById('login-submit');
    btn.textContent = 'Entrando...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('loginModal');
            currentUser = data.user;
            updateNavForUser(currentUser);
            showToast(`¡Bienvenido, ${data.user.username}!`, 'success');
            loadRetos();
        } else {
            showFormError('login-error', data.error || 'Credenciales incorrectas');
        }
    } catch (e) {
        showFormError('login-error', 'Error de conexión');
    } finally {
        btn.textContent = 'Entrar';
        btn.disabled = false;
    }
}

async function register(username, email, password) {
    const btn = document.getElementById('register-submit');
    btn.textContent = 'Creando cuenta...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('registerModal');
            currentUser = data.user;
            updateNavForUser(currentUser);
            showToast('¡Cuenta creada! Bienvenido/a.', 'success');
            loadRetos();
        } else {
            showFormError('register-error', data.error || 'Error al registrarse');
        }
    } catch (e) {
        showFormError('register-error', 'Error de conexión');
    } finally {
        btn.textContent = 'Crear cuenta';
        btn.disabled = false;
    }
}

async function logout() {
    await fetch('/api/logout.php', { method: 'POST' });
    currentUser = null;
    document.getElementById('auth-buttons').style.display = 'flex';
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('nav-admin').style.display = 'none';
    showToast('Sesión cerrada', 'info');
    showSection('retos');
    loadRetos();
}

// ============================================================
// NAVEGACIÓN
// ============================================================
function showSection(name) {
    const sections = ['hero', 'retos', 'ranking', 'admin'];
    sections.forEach(s => {
        const el = document.getElementById('section-' + s);
        if (el) el.style.display = (s === name) ? (s === 'hero' ? 'block' : 'block') : 'none';
    });

    if (name === 'retos' && currentRetos.length === 0) loadRetos();
    if (name === 'ranking') loadRanking();
    if (name === 'admin') {
        if (!currentUser?.is_admin) {
            showToast('Acceso restringido', 'error');
            showSection('retos');
            return;
        }
        loadAdminSubmissions();
    }
}

function toggleMobileNav() {
    document.querySelector('.nav-links').classList.toggle('nav-open');
}

// ============================================================
// STATS (hero)
// ============================================================
async function loadStats() {
    try {
        const res = await fetch('/api/get_stats.php');
        const data = await res.json();
        document.getElementById('stat-retos').textContent = data.retos ?? '—';
        document.getElementById('stat-usuarios').textContent = data.usuarios ?? '—';
        document.getElementById('stat-envios').textContent = data.envios ?? '—';
    } catch (e) {}
}

// ============================================================
// RETOS
// ============================================================
async function loadRetos(dificultad = 'all') {
    const grid = document.getElementById('grid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando retos...</div>';

    try {
        const res = await fetch(`/api/get_retos.php?dificultad=${dificultad}`);
        const data = await res.json();
        currentRetos = Array.isArray(data) ? data : [];
        renderRetos(currentRetos);
        document.getElementById('retos-count').textContent =
            currentRetos.length + ' reto' + (currentRetos.length !== 1 ? 's' : '');
    } catch (e) {
        grid.innerHTML = '<p class="error-msg">Error al cargar los retos.</p>';
    }
}

function renderRetos(retos) {
    const grid = document.getElementById('grid');
    if (!retos.length) {
        grid.innerHTML = '<p class="empty-msg">No hay retos en esta categoría.</p>';
        return;
    }

    grid.innerHTML = retos.map(r => `
        <div class="card" onclick="abrirReto(${r.id})">
            <div class="card-top">
                <span class="categoria">${escapeHtml(r.categoria)}</span>
                <div style="display:flex;gap:0.4rem;align-items:center">
                    ${r.resuelto ? '<span class="resuelto-badge">✓</span>' : ''}
                    <span class="dif dif-${r.dificultad}">${difLabel(r.dificultad)}</span>
                </div>
            </div>
            <div class="card-title">${escapeHtml(r.titulo)}</div>
            <div class="card-desc">${escapeHtml(plainText(r.descripcion), 120)}</div>
            <div class="card-footer">
                <span>⏱ ${escapeHtml(r.tiempo_estimado || '—')}</span>
                <span class="card-footer-right">
                    <span class="completados">${r.completados || 0} resueltos</span>
                    <span class="puntos">+${r.puntos} pts</span>
                </span>
            </div>
        </div>
    `).join('');
}

function filtrarRetos(dificultad, btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    loadRetos(dificultad);
}

// ============================================================
// RANKING
// ============================================================
async function loadRanking() {
    const tabla = document.getElementById('ranking-tabla');
    tabla.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando ranking...</div>';

    try {
        const res = await fetch('/api/get_ranking.php');
        const data = await res.json();
        if (data.success) renderRanking(data.ranking);
    } catch (e) {
        tabla.innerHTML = '<p class="error-msg">Error al cargar el ranking.</p>';
    }
}

function renderRanking(ranking) {
    const tabla = document.getElementById('ranking-tabla');
    if (!ranking.length) {
        tabla.innerHTML = '<p class="empty-msg" style="padding:2rem">Sin datos aún. ¡Sé el primero!</p>';
        return;
    }

    const header = `
        <div class="lb-fila lb-header">
            <span>#</span>
            <span>Usuario</span>
            <span class="lb-pts">Puntos</span>
            <span class="lb-resueltos">Resueltos</span>
        </div>`;

    const rows = ranking.map((u, i) => {
        const pos = u.medalla || (i + 1);
        const isMe = currentUser && currentUser.id == u.id;
        return `
            <div class="lb-fila ${isMe ? 'lb-me' : ''}">
                <span class="lb-pos">${pos}</span>
                <div class="lb-usuario">
                    <div class="avatar">${u.iniciales}</div>
                    <span>${escapeHtml(u.username)}${isMe ? ' <span class="tu-badge">tú</span>' : ''}</span>
                </div>
                <span class="lb-pts">${u.puntos_total.toLocaleString()}</span>
                <span class="lb-resueltos">${u.resueltos} retos</span>
            </div>`;
    }).join('');

    tabla.innerHTML = header + rows;
}

// ============================================================
// MODAL EDITOR DE RETO
// ============================================================
async function abrirReto(retoId) {
    currentRetoId = retoId;

    const modal = document.getElementById('retoModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    document.getElementById('reto-header-info').innerHTML =
        '<div class="loading"><div class="spinner"></div></div>';
    document.getElementById('reto-desc-body').innerHTML = '';

    try {
        const res = await fetch(`/api/get_reto.php?id=${retoId}`);
        const reto = await res.json();
        if (reto.error) throw new Error(reto.error);

        currentTestCases = reto.casos_prueba || [];
        renderRetoPanel(reto);

        // Plantilla inicial en el editor
        const lang = document.getElementById('lang-selector').value;
        const params = currentTestCases.length
            ? Object.keys(JSON.parse(currentTestCases[0].input))
            : [];

        if (monacoReady && monacoEditor) {
            monacoEditor.setValue(getStarterTemplate(lang, params));
            monacoEditor.setPosition({ lineNumber: 2, column: 5 });
            monacoEditor.focus();
        }

        closeTestPanel();
    } catch (e) {
        document.getElementById('reto-desc-body').innerHTML =
            '<p class="error-msg">Error al cargar el reto.</p>';
    }
}

function renderRetoPanel(reto) {
    document.getElementById('reto-header-info').innerHTML = `
        <span class="dif dif-${reto.dificultad}">${difLabel(reto.dificultad)}</span>
        <strong>${escapeHtml(reto.titulo)}</strong>
        <span class="reto-pts-badge">+${reto.puntos} pts</span>
        <span class="reto-cat">${escapeHtml(reto.categoria)}</span>
    `;

    const ejemplos = (reto.casos_prueba || []).filter(c => c.es_ejemplo == 1);

    const ejemplosHtml = ejemplos.length ? `
        <div class="ejemplos">
            <h4>Ejemplos</h4>
            ${ejemplos.map((c, i) => `
                <div class="ejemplo">
                    <div class="ejemplo-label">Ejemplo ${i + 1}</div>
                    <div class="ejemplo-row">
                        <span class="ejemplo-key">Input:</span>
                        <code class="ejemplo-val">${formatInput(c.input)}</code>
                    </div>
                    <div class="ejemplo-row">
                        <span class="ejemplo-key">Output:</span>
                        <code class="ejemplo-val">${escapeHtml(c.expected_output)}</code>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';

    document.getElementById('reto-desc-body').innerHTML = `
        <div class="reto-info-bar">
            <span>⏱ ${escapeHtml(reto.tiempo_estimado || '—')}</span>
            <span>✅ ${reto.completados || 0} resueltos</span>
            ${reto.resuelto ? '<span class="resuelto-tag">✓ Ya resuelto</span>' : ''}
        </div>
        <div class="reto-descripcion">${markdownBasico(reto.descripcion)}</div>
        ${ejemplosHtml}
        <div class="reto-nota">
            <strong>Nota:</strong> La ejecución de JavaScript funciona en el navegador.
            Python, Java y C++ requieren un servidor de evaluación (Judge0).
        </div>
    `;
}

function closeRetoModal() {
    document.getElementById('retoModal').style.display = 'none';
    document.body.style.overflow = '';
    currentRetoId = null;
    currentTestCases = [];
    closeTestPanel();
}

// ============================================================
// EJECUCIÓN DE CÓDIGO (JS en browser)
// ============================================================
function runTests() {
    if (!monacoReady || !monacoEditor) return;
    const codigo = monacoEditor.getValue().trim();
    if (!codigo) { showToast('Escribe tu solución primero', 'warning'); return; }

    const lang = document.getElementById('lang-selector').value;
    if (lang !== 'javascript') {
        showToast('La ejecución en el navegador sólo soporta JavaScript', 'warning');
        return;
    }

    if (!currentTestCases.length) {
        showToast('No hay casos de prueba disponibles', 'warning');
        return;
    }

    const resultados = currentTestCases.map(tc => runSingleTest(codigo, tc));
    renderTestResults(resultados);
}

function runSingleTest(userCode, testCase) {
    const input = JSON.parse(testCase.input);
    const expectedRaw = testCase.expected_output;
    let expected;
    try { expected = JSON.parse(expectedRaw); } catch { expected = expectedRaw; }

    try {
        // Crear función con timeout básico usando un límite de iteraciones
        const fn = new Function(
            ...Object.keys(input),
            `"use strict";\n${userCode}\nreturn solution(${Object.keys(input).join(',')});`
        );
        const actual = fn(...Object.values(input));
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        return { passed, input, expected, actual, error: null };
    } catch (e) {
        return { passed: false, input, expected, actual: null, error: e.message };
    }
}

function renderTestResults(resultados) {
    const panel = document.getElementById('test-panel');
    const resultsDiv = document.getElementById('test-results');
    const summary = document.getElementById('test-summary');

    const pasados = resultados.filter(r => r.passed).length;
    const total = resultados.length;

    summary.innerHTML = pasados === total
        ? `<span class="badge-success">✅ ${pasados}/${total} tests pasados</span>`
        : `<span class="badge-error">❌ ${pasados}/${total} tests pasados</span>`;

    resultsDiv.innerHTML = resultados.map((r, i) => `
        <div class="test-case ${r.passed ? 'test-pass' : 'test-fail'}">
            <div class="test-case-header">
                <span>${r.passed ? '✅' : '❌'} Test ${i + 1}</span>
            </div>
            <div class="test-case-body">
                <div class="test-row">
                    <span class="test-label">Input:</span>
                    <code>${escapeHtml(JSON.stringify(r.input))}</code>
                </div>
                <div class="test-row">
                    <span class="test-label">Esperado:</span>
                    <code>${escapeHtml(JSON.stringify(r.expected))}</code>
                </div>
                <div class="test-row">
                    <span class="test-label">Obtenido:</span>
                    <code class="${r.passed ? '' : 'val-wrong'}">${r.error ? '⚠ ' + escapeHtml(r.error) : escapeHtml(JSON.stringify(r.actual))}</code>
                </div>
            </div>
        </div>
    `).join('');

    panel.style.display = 'flex';
}

function closeTestPanel() {
    document.getElementById('test-panel').style.display = 'none';
}

// ============================================================
// ENVIAR SOLUCIÓN
// ============================================================
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
    const btn = document.getElementById('btn-submit');

    // Para JS: ejecutar en browser y enviar resultados
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
                    error: r.error
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

// ============================================================
// ADMIN — ENVÍOS
// ============================================================
async function loadAdminSubmissions() {
    const container = document.getElementById('submissions-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const resultado = document.getElementById('filter-resultado').value;
    const url = `/api/admin_submissions.php${resultado ? '?resultado=' + resultado : ''}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        adminSubmissionsData = data.submissions;
        renderAdminSubmissions(adminSubmissionsData);
    } catch (e) {
        container.innerHTML = `<p class="error-msg">${e.message || 'Error al cargar'}</p>`;
    }
}

function renderAdminSubmissions(submissions) {
    const container = document.getElementById('submissions-container');
    if (!submissions.length) {
        container.innerHTML = '<p class="empty-msg">No hay envíos.</p>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Reto</th>
                    <th>Lenguaje</th>
                    <th>Resultado</th>
                    <th>Tests</th>
                    <th>Puntos</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${submissions.map(s => `
                    <tr>
                        <td class="td-muted">${s.id}</td>
                        <td><strong>${escapeHtml(s.username)}</strong></td>
                        <td>${escapeHtml(s.reto_titulo)}</td>
                        <td><span class="lang-badge">${escapeHtml(s.lenguaje)}</span></td>
                        <td>${resultadoBadge(s.resultado)}</td>
                        <td class="td-muted">${s.tests_pasados ?? '—'}/${s.tests_total ?? '—'}</td>
                        <td class="${s.puntos_obtenidos > 0 ? 'td-green' : 'td-muted'}">${s.puntos_obtenidos}</td>
                        <td class="td-muted td-small">${formatDate(s.created_at)}</td>
                        <td>
                            <button class="btn-table" onclick="verCodigo(${s.id})">Ver código</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function filterSubmissionsTable(query) {
    const q = query.toLowerCase();
    const filtered = adminSubmissionsData.filter(s =>
        s.username.toLowerCase().includes(q) ||
        s.reto_titulo.toLowerCase().includes(q)
    );
    renderAdminSubmissions(filtered);
}

async function verCodigo(envioId) {
    document.getElementById('codigoModal').style.display = 'flex';
    document.getElementById('codigo-meta').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    document.getElementById('codigo-viewer').innerHTML = '';

    try {
        const res = await fetch(`/api/admin_submissions.php?id=${envioId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        const s = data.submission;

        document.getElementById('codigo-meta').innerHTML = `
            <div class="codigo-meta-grid">
                <span><strong>Usuario:</strong> ${escapeHtml(s.username)}</span>
                <span><strong>Reto:</strong> ${escapeHtml(s.reto_titulo)}</span>
                <span><strong>Lenguaje:</strong> ${escapeHtml(s.lenguaje)}</span>
                <span>${resultadoBadge(s.resultado)}</span>
                <span><strong>Fecha:</strong> ${formatDate(s.created_at)}</span>
            </div>
        `;

        const viewerDiv = document.getElementById('codigo-viewer');
        viewerDiv.innerHTML = '';
        viewerDiv.style.height = '350px';
        viewerDiv.style.border = '1px solid var(--border)';
        viewerDiv.style.borderRadius = '8px';
        viewerDiv.style.overflow = 'hidden';

        if (monacoReady) {
            if (monacoViewer) monacoViewer.dispose();
            monacoViewer = monaco.editor.create(viewerDiv, {
                value: s.codigo,
                language: s.lenguaje === 'cpp' ? 'cpp' : s.lenguaje,
                theme: 'codearena',
                readOnly: true,
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
            });
        } else {
            viewerDiv.innerHTML = `<pre style="padding:1rem;overflow:auto;height:100%;color:var(--text);font-size:0.85rem">${escapeHtml(s.codigo)}</pre>`;
        }
    } catch (e) {
        document.getElementById('codigo-meta').innerHTML = `<p class="error-msg">${e.message}</p>`;
    }
}

// ============================================================
// ADMIN — USUARIOS
// ============================================================
async function loadAdminUsers() {
    const container = document.getElementById('users-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const res = await fetch('/api/admin_users.php');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        adminUsersData = data.users;
        renderAdminUsers(adminUsersData);
    } catch (e) {
        container.innerHTML = `<p class="error-msg">${e.message}</p>`;
    }
}

function renderAdminUsers(users) {
    const container = document.getElementById('users-container');
    if (!users.length) {
        container.innerHTML = '<p class="empty-msg">No hay usuarios.</p>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Puntos</th>
                    <th>Retos</th>
                    <th>Rol</th>
                    <th>Registro</th>
                    <th>Último acceso</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td class="td-muted">${u.id}</td>
                        <td><strong>${escapeHtml(u.username)}</strong></td>
                        <td class="td-muted td-small">${escapeHtml(u.email)}</td>
                        <td class="td-green">${u.puntos_total.toLocaleString()}</td>
                        <td class="td-muted">${u.resueltos}</td>
                        <td>${u.is_admin ? '<span class="badge-admin">Admin</span>' : '<span class="badge-user">User</span>'}</td>
                        <td class="td-muted td-small">${formatDate(u.created_at)}</td>
                        <td class="td-muted td-small">${u.last_login ? formatDate(u.last_login) : 'Nunca'}</td>
                        <td>
                            <button class="btn-table ${u.is_admin ? 'btn-danger' : ''}"
                                onclick="toggleAdmin(${u.id}, ${u.is_admin})">
                                ${u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function filterUsersTable(query) {
    const q = query.toLowerCase();
    const filtered = adminUsersData.filter(u =>
        u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    renderAdminUsers(filtered);
}

async function toggleAdmin(userId, isAdmin) {
    const accion = isAdmin ? 'quitar permisos de admin a' : 'hacer admin a';
    if (!confirm(`¿Seguro que quieres ${accion} este usuario?`)) return;

    try {
        const res = await fetch('/api/admin_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_admin: isAdmin ? 0 : 1 })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Rol actualizado', 'success');
            loadAdminUsers();
        } else {
            showToast(data.error || 'Error', 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
}

// ============================================================
// ADMIN — RETOS
// ============================================================
async function loadAdminRetos() {
    const container = document.getElementById('challenges-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const res = await fetch('/api/admin_retos.php');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        adminRetosData = data.retos;
        renderAdminRetos(adminRetosData);
    } catch (e) {
        container.innerHTML = `<p class="error-msg">${e.message}</p>`;
    }
}

function renderAdminRetos(retos) {
    const container = document.getElementById('challenges-container');
    if (!retos.length) {
        container.innerHTML = '<p class="empty-msg">No hay retos.</p>';
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Título</th>
                    <th>Categoría</th>
                    <th>Dificultad</th>
                    <th>Puntos</th>
                    <th>Resueltos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${retos.map(r => `
                    <tr>
                        <td class="td-muted">${r.id}</td>
                        <td><strong>${escapeHtml(r.titulo)}</strong></td>
                        <td class="td-muted">${escapeHtml(r.categoria)}</td>
                        <td><span class="dif dif-${r.dificultad}">${difLabel(r.dificultad)}</span></td>
                        <td class="td-green">${r.puntos}</td>
                        <td class="td-muted">${r.completados}</td>
                        <td>${r.activo ? '<span class="badge-success-sm">Activo</span>' : '<span class="badge-error-sm">Inactivo</span>'}</td>
                        <td style="display:flex;gap:0.5rem">
                            <button class="btn-table" onclick="editarReto(${r.id})">Editar</button>
                            <button class="btn-table btn-danger" onclick="eliminarReto(${r.id})">Eliminar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showRetoAdminModal(reto = null) {
    document.getElementById('admin-reto-modal-title').textContent = reto ? 'Editar reto' : 'Nuevo reto';
    document.getElementById('admin-reto-id').value = reto?.id ?? '';
    document.getElementById('admin-reto-titulo').value = reto?.titulo ?? '';
    document.getElementById('admin-reto-categoria').value = reto?.categoria ?? '';
    document.getElementById('admin-reto-dificultad').value = reto?.dificultad ?? 'easy';
    document.getElementById('admin-reto-puntos').value = reto?.puntos ?? '';
    document.getElementById('admin-reto-tiempo').value = reto?.tiempo_estimado ?? '';
    document.getElementById('admin-reto-descripcion').value = reto?.descripcion ?? '';
    document.getElementById('retoAdminModal').style.display = 'flex';
}

function editarReto(id) {
    const reto = adminRetosData.find(r => r.id === id);
    if (reto) showRetoAdminModal(reto);
}

async function eliminarReto(id) {
    if (!confirm('¿Seguro que quieres eliminar este reto? Esta acción no se puede deshacer.')) return;
    try {
        const res = await fetch(`/api/admin_retos.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Reto eliminado', 'success');
            loadAdminRetos();
        } else {
            showToast(data.error || 'Error', 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
}

async function guardarReto(e) {
    e.preventDefault();
    const id = document.getElementById('admin-reto-id').value;
    const payload = {
        titulo: document.getElementById('admin-reto-titulo').value,
        categoria: document.getElementById('admin-reto-categoria').value,
        dificultad: document.getElementById('admin-reto-dificultad').value,
        puntos: parseInt(document.getElementById('admin-reto-puntos').value),
        tiempo_estimado: document.getElementById('admin-reto-tiempo').value,
        descripcion: document.getElementById('admin-reto-descripcion').value,
    };
    if (id) payload.id = parseInt(id);

    try {
        const res = await fetch('/api/admin_retos.php', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast(id ? 'Reto actualizado' : 'Reto creado', 'success');
            closeModal('retoAdminModal');
            loadAdminRetos();
            loadRetos();
        } else {
            showToast(data.error || 'Error', 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
}

// ============================================================
// ADMIN — TABS
// ============================================================
function switchAdminTab(tab, btn) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');

    document.querySelectorAll('.admin-content').forEach(el => el.style.display = 'none');
    document.getElementById(`admin-tab-${tab}`).style.display = 'block';

    if (tab === 'submissions') loadAdminSubmissions();
    if (tab === 'users') loadAdminUsers();
    if (tab === 'challenges') loadAdminRetos();
}

// ============================================================
// MODALS
// ============================================================
window.showLoginModal = function () {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('login-error').style.display = 'none';
    setTimeout(() => document.getElementById('login-username').focus(), 100);
};

window.showRegisterModal = function () {
    document.getElementById('registerModal').style.display = 'flex';
    document.getElementById('register-error').style.display = 'none';
    setTimeout(() => document.getElementById('reg-username').focus(), 100);
};

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    if (id === 'codigoModal' && monacoViewer) {
        monacoViewer.dispose();
        monacoViewer = null;
    }
}

function switchModal(from, to) {
    closeModal(from);
    document.getElementById(to).style.display = 'flex';
}

function showFormError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('login-error').style.display = 'none';
        login(
            document.getElementById('login-username').value,
            document.getElementById('login-password').value
        );
    });

    document.getElementById('registerForm').addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('register-error').style.display = 'none';
        register(
            document.getElementById('reg-username').value,
            document.getElementById('reg-email').value,
            document.getElementById('reg-password').value
        );
    });

    document.getElementById('retoAdminForm').addEventListener('submit', guardarReto);

    // Cerrar modales al hacer clic en el fondo
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // Tecla ESC cierra modales y editor
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (document.getElementById('retoModal').style.display === 'flex') {
                closeRetoModal();
            }
            document.querySelectorAll('.modal').forEach(m => {
                if (m.style.display === 'flex') closeModal(m.id);
            });
        }
    });
}

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(str, maxLen) {
    if (str == null) return '';
    const s = String(str);
    const truncated = maxLen ? s.substring(0, maxLen) + (s.length > maxLen ? '…' : '') : s;
    return truncated
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function plainText(md) {
    return md.replace(/`[^`]*`/g, '').replace(/\*\*/g, '').replace(/\n/g, ' ');
}

function difLabel(dif) {
    return { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }[dif] || dif;
}

function resultadoBadge(r) {
    const map = {
        success: '<span class="badge-success-sm">✅ Correcto</span>',
        failed:  '<span class="badge-error-sm">❌ Fallido</span>',
        pending: '<span class="badge-pending-sm">⏳ Pendiente</span>',
    };
    return map[r] || r;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
        + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatInput(inputJson) {
    try {
        const obj = JSON.parse(inputJson);
        return Object.entries(obj).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ');
    } catch {
        return escapeHtml(inputJson);
    }
}

function markdownBasico(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

// Exponer funciones globales necesarias para onclick en HTML
window.abrirReto = abrirReto;
window.filtrarRetos = filtrarRetos;
window.closeRetoModal = closeRetoModal;
window.closeTestPanel = closeTestPanel;
window.runTests = runTests;
window.enviarSolucion = enviarSolucion;
window.changeEditorLanguage = changeEditorLanguage;
window.switchAdminTab = switchAdminTab;
window.verCodigo = verCodigo;
window.toggleAdmin = toggleAdmin;
window.editarReto = editarReto;
window.eliminarReto = eliminarReto;
window.showRetoAdminModal = showRetoAdminModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.showSection = showSection;
window.logout = logout;
window.filterSubmissionsTable = filterSubmissionsTable;
window.filterUsersTable = filterUsersTable;
