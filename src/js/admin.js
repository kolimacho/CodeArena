// ============================================================
// ADMIN.JS — Panel de administración
// ============================================================

// ── Envíos ──────────────────────────────────────────────────

async function loadAdminSubmissions() {
    const container = document.getElementById('submissions-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const resultado = document.getElementById('filter-resultado').value;
    const url = '/api/admin_submissions.php' + (resultado ? '?resultado=' + resultado : '');

    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        adminSubmissionsData = data.submissions;
        renderAdminSubmissions(data.submissions);
    } catch (e) {
        container.innerHTML = '<p class="error-msg">' + (e.message || 'Error al cargar') + '</p>';
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
            <thead><tr>
                <th>#</th><th>Usuario</th><th>Reto</th><th>Lenguaje</th>
                <th>Resultado</th><th>Tests</th><th>Puntos</th><th>Fecha</th><th></th>
            </tr></thead>
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
                        <td><button class="btn-table" onclick="verCodigo(${s.id})">Ver código</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

async function verCodigo(envioId) {
    document.getElementById('codigoModal').style.display = 'flex';
    document.getElementById('codigo-meta').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    document.getElementById('codigo-viewer').innerHTML = '';

    try {
        const res  = await fetch('/api/admin_submissions.php?id=' + envioId);
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
            </div>`;

        // Mostrar el código en un <pre> simple (sin Monaco)
        document.getElementById('codigo-viewer').innerHTML =
            '<pre class="codigo-pre">' + escapeHtml(s.codigo) + '</pre>';

    } catch (e) {
        document.getElementById('codigo-meta').innerHTML = '<p class="error-msg">' + e.message + '</p>';
    }
}

// ── Usuarios ─────────────────────────────────────────────────

async function loadAdminUsers() {
    const container = document.getElementById('users-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const res  = await fetch('/api/admin_users.php');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        renderAdminUsers(data.users);
    } catch (e) {
        container.innerHTML = '<p class="error-msg">' + e.message + '</p>';
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
            <thead><tr>
                <th>#</th><th>Usuario</th><th>Email</th><th>Puntos</th>
                <th>Retos</th><th>Rol</th><th>Registro</th><th></th>
            </tr></thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td class="td-muted">${u.id}</td>
                        <td><strong>${escapeHtml(u.username)}</strong></td>
                        <td class="td-muted td-small">${escapeHtml(u.email)}</td>
                        <td class="td-green">${u.puntos_total}</td>
                        <td class="td-muted">${u.resueltos}</td>
                        <td>${u.is_admin ? '<span class="badge-admin">Admin</span>' : '<span class="badge-user">User</span>'}</td>
                        <td class="td-muted td-small">${formatDate(u.created_at)}</td>
                        <td>
                            <button class="btn-table ${u.is_admin ? 'btn-danger' : ''}"
                                onclick="toggleAdmin(${u.id}, ${u.is_admin})">
                                ${u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

async function toggleAdmin(userId, isAdmin) {
    if (!confirm('¿Cambiar el rol de este usuario?')) return;
    try {
        const res  = await fetch('/api/admin_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_admin: isAdmin ? 0 : 1 })
        });
        const data = await res.json();
        if (data.success) { showToast('Rol actualizado', 'success'); loadAdminUsers(); }
        else showToast(data.error || 'Error', 'error');
    } catch (e) { showToast('Error de conexión', 'error'); }
}

// ── Retos ─────────────────────────────────────────────────────

async function loadAdminRetos() {
    const container = document.getElementById('challenges-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const res  = await fetch('/api/admin_retos.php');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        adminRetosData = data.retos;
        renderAdminRetos(data.retos);
    } catch (e) {
        container.innerHTML = '<p class="error-msg">' + e.message + '</p>';
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
            <thead><tr>
                <th>#</th><th>Título</th><th>Dificultad</th>
                <th>Puntos</th><th>Resueltos</th><th>Estado</th><th></th>
            </tr></thead>
            <tbody>
                ${retos.map(r => `
                    <tr>
                        <td class="td-muted">${r.id}</td>
                        <td><strong>${escapeHtml(r.titulo)}</strong></td>
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
        </table>`;
}

function showRetoAdminModal(reto = null) {
    document.getElementById('admin-reto-modal-title').textContent = reto ? 'Editar reto' : 'Nuevo reto';
    document.getElementById('admin-reto-id').value          = reto?.id          ?? '';
    document.getElementById('admin-reto-titulo').value      = reto?.titulo      ?? '';
    document.getElementById('admin-reto-categoria').value   = reto?.categoria   ?? '';
    document.getElementById('admin-reto-dificultad').value  = reto?.dificultad  ?? 'easy';
    document.getElementById('admin-reto-puntos').value      = reto?.puntos      ?? '';
    document.getElementById('admin-reto-tiempo').value      = reto?.tiempo_estimado ?? '';
    document.getElementById('admin-reto-descripcion').value = reto?.descripcion ?? '';
    document.getElementById('retoAdminModal').style.display = 'flex';
}

function editarReto(id) {
    const reto = adminRetosData.find(r => r.id === id);
    if (reto) showRetoAdminModal(reto);
}

async function eliminarReto(id) {
    if (!confirm('¿Eliminar este reto?')) return;
    try {
        const res  = await fetch('/api/admin_retos.php?id=' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Reto eliminado', 'success'); loadAdminRetos(); }
        else showToast(data.error || 'Error', 'error');
    } catch (e) { showToast('Error de conexión', 'error'); }
}

async function guardarReto(e) {
    e.preventDefault();
    const id = document.getElementById('admin-reto-id').value;
    const payload = {
        titulo:          document.getElementById('admin-reto-titulo').value,
        categoria:       document.getElementById('admin-reto-categoria').value,
        dificultad:      document.getElementById('admin-reto-dificultad').value,
        puntos:          parseInt(document.getElementById('admin-reto-puntos').value),
        tiempo_estimado: document.getElementById('admin-reto-tiempo').value,
        descripcion:     document.getElementById('admin-reto-descripcion').value,
    };
    if (id) payload.id = parseInt(id);

    try {
        const res  = await fetch('/api/admin_retos.php', {
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
    } catch (e) { showToast('Error de conexión', 'error'); }
}

function switchAdminTab(tab, btn) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    document.querySelectorAll('.admin-content').forEach(el => el.style.display = 'none');
    document.getElementById('admin-tab-' + tab).style.display = 'block';

    if (tab === 'submissions') loadAdminSubmissions();
    if (tab === 'users')       loadAdminUsers();
    if (tab === 'challenges')  loadAdminRetos();
}
