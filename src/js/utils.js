// ============================================================
// UTILS.JS — Funciones auxiliares puras (sin dependencias)
// ============================================================

/**
 * Escapa caracteres HTML para prevenir XSS.
 * Si se pasa maxLen, trunca el texto antes de escapar.
 */
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

/** Elimina marcadores Markdown básicos para texto plano */
function plainText(md) {
    return md.replace(/`[^`]*`/g, '').replace(/\*\*/g, '').replace(/\n/g, ' ');
}

/** Etiqueta legible para el nivel de dificultad */
function difLabel(dif) {
    return { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }[dif] || dif;
}

/** Badge HTML para el resultado de un envío */
function resultadoBadge(r) {
    const map = {
        success: '<span class="badge-success-sm">✅ Correcto</span>',
        failed:  '<span class="badge-error-sm">❌ Fallido</span>',
        pending: '<span class="badge-pending-sm">⏳ Pendiente</span>',
    };
    return map[r] || r;
}

/** Formatea una fecha ISO a dd/mm/aa hh:mm en español */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
        + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formatea un input JSON de test a texto legible.
 * Ejemplo: {"nums":[1,2],"k":3} → "nums = [1,2], k = 3"
 */
function formatInput(inputJson) {
    try {
        const obj = JSON.parse(inputJson);
        return Object.entries(obj).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ');
    } catch {
        return escapeHtml(inputJson);
    }
}

/** Convierte un valor JS a string legible para mostrar en el panel de tests */
function formatValor(v) {
    if (v === undefined) return 'undefined';
    if (v === null)      return 'null';
    return JSON.stringify(v);
}

/**
 * Renderiza Markdown básico a HTML seguro:
 * **negrita**, `código` y saltos de línea.
 */
function markdownBasico(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

/** Muestra un toast de notificación en pantalla */
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
