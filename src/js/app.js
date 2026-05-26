// ============================================================
// APP.JS — Núcleo principal de CodeArena.
// Gestiona: autenticación, navegación entre secciones, carga de retos,
// ranking, apertura del editor de código y todos los modales.
// Es una SPA: un solo HTML donde JS muestra/oculta secciones sin recargar.
// Orden de carga: utils.js → editor.js → evaluator.js → admin.js → app.js
// ============================================================

// ── Variables globales — estado compartido por todos los archivos JS ────────
let currentUser      = null;   // Usuario con sesión activa (o null si no hay sesión)
let currentRetos     = [];     // Retos cargados actualmente en el grid
let currentRetoId    = null;   // ID del reto abierto en el editor
let monacoEditor     = null;   // Instancia del editor Monaco (se crea en editor.js)
let monacoReady      = false;  // true cuando Monaco termina de cargar
let currentTestCases = [];     // Casos de prueba del reto abierto (los usa evaluator.js)

let adminSubmissionsData = [];  // Caché de envíos para el panel admin
let adminRetosData       = [];  // Caché de retos para el panel admin

// ── Arranque de la aplicación ───────────────────────────────────────────────
// Al cargar el DOM: inicia Monaco, comprueba si hay sesión activa y muestra la sección de retos.
document.addEventListener('DOMContentLoaded', async () => {
    initMonaco();
    await checkAuth();
    showSection('retos');
    setupEventListeners();
});

// ── Autenticación ───────────────────────────────────────────────────────────

// Comprueba si hay una sesión PHP activa. Si la hay, guarda el usuario y actualiza la navbar.
async function checkAuth() {
    try {
        const res  = await fetch('/api/check_auth.php');
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            updateNavForUser(currentUser);
        }
    } catch (e) { console.error('Auth check failed:', e); }
}

// Actualiza la navbar: oculta los botones de login/registro y muestra el nombre y puntos del usuario.
// Si es admin, muestra también el enlace al panel de administración.
function updateNavForUser(user) {
    document.getElementById('auth-buttons').style.display   = 'none';
    document.getElementById('user-menu').style.display      = 'flex';
    document.getElementById('username-display').textContent = user.username;
    document.getElementById('nav-pts').textContent          = user.puntos_total + ' pts';
    if (user.is_admin) document.getElementById('nav-admin').style.display = 'block';
}

// Envía las credenciales al servidor (POST /api/login.php). Si son correctas, guarda el usuario y cierra el modal.
async function login(username, password) {
    const btn = document.getElementById('login-submit');
    btn.textContent = 'Entrando...';
    btn.disabled    = true;
    try {
        const res  = await fetch('/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('loginModal');
            currentUser = data.user;
            updateNavForUser(currentUser);
            showToast('¡Bienvenido, ' + data.user.username + '!', 'success');
            loadRetos();
        } else {
            showFormError('login-error', data.error || 'Credenciales incorrectas');
        }
    } catch (e) { showFormError('login-error', 'Error de conexión'); }
    finally {
        btn.textContent = 'Entrar';
        btn.disabled    = false;
    }
}

// Crea una cuenta nueva (POST /api/register.php). Si tiene éxito, inicia sesión automáticamente.
async function register(username, email, password) {
    const btn = document.getElementById('register-submit');
    btn.textContent = 'Creando cuenta...';
    btn.disabled    = true;
    try {
        const res  = await fetch('/api/register.php', {
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
    } catch (e) { showFormError('register-error', 'Error de conexión'); }
    finally {
        btn.textContent = 'Crear cuenta';
        btn.disabled    = false;
    }
}

// Cierra la sesión en el servidor (POST /api/logout.php) y restaura la navbar al estado de invitado.
async function logout() {
    await fetch('/api/logout.php', { method: 'POST' });
    currentUser = null;
    document.getElementById('auth-buttons').style.display = 'flex';
    document.getElementById('user-menu').style.display    = 'none';
    document.getElementById('nav-admin').style.display    = 'none';
    showToast('Sesión cerrada', 'info');
    showSection('retos');
    loadRetos();
}

// ── Navegación SPA ──────────────────────────────────────────────────────────

// Muestra la sección indicada y oculta todas las demás. Carga los datos si es necesario.
// Secciones disponibles: 'hero', 'retos', 'ranking', 'admin'.
function showSection(name) {
    ['hero', 'retos', 'ranking', 'admin'].forEach(s => {
        const el = document.getElementById('section-' + s);
        if (el) el.style.display = (s === name) ? 'block' : 'none';
    });
    if (name === 'retos'   && currentRetos.length === 0) loadRetos();
    if (name === 'ranking') loadRanking();
    if (name === 'admin') {
        if (!currentUser?.is_admin) { showToast('Acceso restringido', 'error'); showSection('retos'); return; }
        loadAdminSubmissions();
    }
}

// ── Retos ───────────────────────────────────────────────────────────────────

// Pide los retos al servidor (GET /api/get_retos.php) y los pinta en el grid.
async function loadRetos(dificultad = 'all') {
    const grid = document.getElementById('grid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando retos...</div>';
    try {
        const res  = await fetch('/api/get_retos.php?dificultad=' + dificultad);
        const data = await res.json();
        currentRetos = Array.isArray(data) ? data : [];
        renderRetos(currentRetos);
        document.getElementById('retos-count').textContent =
            currentRetos.length + ' reto' + (currentRetos.length !== 1 ? 's' : '');
    } catch (e) { grid.innerHTML = '<p class="error-msg">Error al cargar los retos.</p>'; }
}

// Genera el HTML de las tarjetas de retos y las inserta en el div #grid.
function renderRetos(retos) {
    const grid = document.getElementById('grid');
    if (!retos.length) { grid.innerHTML = '<p class="empty-msg">No hay retos en esta categoría.</p>'; return; }
    grid.innerHTML = retos.map(r => `
        <div class="card" onclick="abrirReto(${r.id})">
            <div class="card-top">
                <span class="categoria">${escapeHtml(r.categoria)}</span>
                <div style="display:flex;gap:0.4rem;align-items:center">
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
        </div>`).join('');
}

// Cambia el filtro de dificultad activo y recarga los retos con el nuevo filtro.
function filtrarRetos(dificultad, btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    loadRetos(dificultad);
}

// ── Ranking ─────────────────────────────────────────────────────────────────

// Pide el ranking al servidor (GET /api/get_ranking.php) y lo pinta en la tabla.
async function loadRanking() {
    const tabla = document.getElementById('ranking-tabla');
    tabla.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando ranking...</div>';
    try {
        const res  = await fetch('/api/get_ranking.php');
        const data = await res.json();
        if (data.success) renderRanking(data.ranking);
    } catch (e) { tabla.innerHTML = '<p class="error-msg">Error al cargar el ranking.</p>'; }
}

// Genera el HTML de la tabla de ranking con medallas para los 3 primeros. Resalta la fila del usuario actual.
function renderRanking(ranking) {
    const tabla = document.getElementById('ranking-tabla');
    if (!ranking.length) {
        tabla.innerHTML = '<p class="empty-msg" style="padding:2rem">Sin datos aún. ¡Sé el primero!</p>';
        return;
    }
    const header = `<div class="lb-fila lb-header">
        <span>#</span><span>Usuario</span>
        <span class="lb-pts">Puntos</span><span class="lb-resueltos">Resueltos</span>
    </div>`;
    const rows = ranking.map((u, i) => {
        const isMe = currentUser && currentUser.id == u.id;
        return `<div class="lb-fila ${isMe ? 'lb-me' : ''}">
            <span class="lb-pos">${u.medalla || (i + 1)}</span>
            <div class="lb-usuario">
                <span>${escapeHtml(u.username)}${isMe ? ' <span class="tu-badge">tú</span>' : ''}</span>
            </div>
            <span class="lb-pts">${u.puntos_total.toLocaleString()}</span>
            <span class="lb-resueltos">${u.resueltos} retos</span>
        </div>`;
    }).join('');
    tabla.innerHTML = header + rows;
}

// ── Modal del editor de reto ────────────────────────────────────────────────

// Abre el modal a pantalla completa con el editor. Carga los datos del reto desde la API
// y prepara Monaco con la plantilla correcta (parámetros extraídos del primer test case).
async function abrirReto(retoId) {
    currentRetoId = retoId;
    document.getElementById('retoModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('reto-header-info').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    document.getElementById('reto-desc-body').innerHTML   = '';

    try {
        const res  = await fetch('/api/get_reto.php?id=' + retoId);
        const reto = await res.json();
        if (reto.error) throw new Error(reto.error);

        currentTestCases = reto.casos_prueba || [];
        renderRetoPanel(reto);

        // Extrae los nombres de los parámetros del primer test case para la plantilla.
        const params = currentTestCases.length ? Object.keys(JSON.parse(currentTestCases[0].input)) : [];
        if (monacoReady && monacoEditor) {
            monacoEditor.setValue(getStarterTemplate(params));
            monacoEditor.setPosition({ lineNumber: 2, column: 5 });
            monacoEditor.focus();
        }
        closeTestPanel();
    } catch (e) {
        document.getElementById('reto-desc-body').innerHTML = '<p class="error-msg">Error al cargar el reto.</p>';
    }
}

// Rellena el panel izquierdo del editor con la descripción, ejemplos e info del reto.
function renderRetoPanel(reto) {
    document.getElementById('reto-header-info').innerHTML = `
        <span class="dif dif-${reto.dificultad}">${difLabel(reto.dificultad)}</span>
        <strong>${escapeHtml(reto.titulo)}</strong>
        <span class="reto-pts-badge">+${reto.puntos} pts</span>
        <span class="reto-cat">${escapeHtml(reto.categoria)}</span>`;

    // Solo muestra los test cases marcados como ejemplo (es_ejemplo = 1).
    const ejemplos = (reto.casos_prueba || []).filter(c => c.es_ejemplo == 1);
    const ejemplosHtml = ejemplos.length ? `
        <div class="ejemplos"><h4>Ejemplos</h4>
            ${ejemplos.map((c, i) => `
                <div class="ejemplo">
                    <div class="ejemplo-label">Ejemplo ${i + 1}</div>
                    <div class="ejemplo-row"><span class="ejemplo-key">Input:</span>
                        <code class="ejemplo-val">${formatInput(c.input)}</code></div>
                    <div class="ejemplo-row"><span class="ejemplo-key">Output:</span>
                        <code class="ejemplo-val">${escapeHtml(c.expected_output)}</code></div>
                </div>`).join('')}
        </div>` : '';

    document.getElementById('reto-desc-body').innerHTML = `
        <div class="reto-info-bar">
            <span>⏱ ${escapeHtml(reto.tiempo_estimado || '—')}</span>
            <span>✅ ${reto.completados || 0} resueltos</span>
        </div>
        <div class="reto-descripcion">${markdownBasico(reto.descripcion)}</div>
        ${ejemplosHtml}
        <div class="reto-nota"><strong>Nota:</strong> Solo JavaScript se evalúa en el navegador.</div>`;
}

// Cierra el modal del editor y resetea el estado del reto actual.
function closeRetoModal() {
    document.getElementById('retoModal').style.display = 'none';
    document.body.style.overflow = '';
    currentRetoId    = null;
    currentTestCases = [];
    closeTestPanel();
}

// ── Modales ─────────────────────────────────────────────────────────────────

// Abre el modal de login y enfoca el campo de usuario.
window.showLoginModal = function () {
    document.getElementById('loginModal').style.display  = 'flex';
    document.getElementById('login-error').style.display = 'none';
    setTimeout(() => document.getElementById('login-username').focus(), 100);
};

// Abre el modal de registro y enfoca el campo de nombre de usuario.
window.showRegisterModal = function () {
    document.getElementById('registerModal').style.display  = 'flex';
    document.getElementById('register-error').style.display = 'none';
    setTimeout(() => document.getElementById('reg-username').focus(), 100);
};

// Oculta el modal con el id indicado.
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Cierra un modal y abre otro (usado para pasar de login a registro y viceversa).
function switchModal(from, to) {
    closeModal(from);
    document.getElementById(to).style.display = 'flex';
}

// Muestra un mensaje de error dentro de un formulario (login o registro).
function showFormError(id, msg) {
    const el = document.getElementById(id);
    el.textContent   = msg;
    el.style.display = 'block';
}

// ── Eventos ─────────────────────────────────────────────────────────────────

// Registra todos los event listeners: formularios de login/registro, cierre de modales con ESC o clic fuera.
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('login-error').style.display = 'none';
        login(document.getElementById('login-username').value,
              document.getElementById('login-password').value);
    });

    document.getElementById('registerForm').addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('register-error').style.display = 'none';
        register(document.getElementById('reg-username').value,
                 document.getElementById('reg-email').value,
                 document.getElementById('reg-password').value);
    });

    document.getElementById('retoAdminForm').addEventListener('submit', guardarReto);

    // Clic en el fondo oscuro del modal lo cierra.
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal.id); });
    });

    // Tecla ESC cierra el editor de reto o cualquier modal abierto.
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (document.getElementById('retoModal').style.display === 'flex') closeRetoModal();
        document.querySelectorAll('.modal').forEach(m => {
            if (m.style.display === 'flex') closeModal(m.id);
        });
    });
}

// ── Exposición global ────────────────────────────────────────────────────────
// Las funciones usadas en atributos onclick del HTML deben estar en window.
// De lo contrario, el HTML no puede encontrarlas porque están en scope de módulo.
window.abrirReto          = abrirReto;
window.filtrarRetos        = filtrarRetos;
window.closeRetoModal      = closeRetoModal;
window.closeTestPanel      = closeTestPanel;
window.runTests            = runTests;
window.enviarSolucion      = enviarSolucion;
window.switchAdminTab      = switchAdminTab;
window.verCodigo           = verCodigo;
window.toggleAdmin         = toggleAdmin;
window.editarReto          = editarReto;
window.eliminarReto        = eliminarReto;
window.showRetoAdminModal  = showRetoAdminModal;
window.closeModal          = closeModal;
window.switchModal         = switchModal;
window.showSection         = showSection;
window.logout              = logout;
