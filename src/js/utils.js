// ============================================================
// UTILS.JS — Funciones auxiliares compartidas por todos los archivos JS.
// No depende de ningún otro archivo. Se carga primero.
// Contiene: formateo de texto, fechas, notificaciones toast y escape de HTML.
// ============================================================

// Escapa caracteres peligrosos (<, >, &, ") para mostrar texto en HTML sin que se interprete como código (previene XSS).
// Si se pasa maxLen, trunca el texto antes de escapar.
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

// Elimina marcadores Markdown básicos (**, `código`, saltos de línea) para obtener texto plano.
function plainText(md) {
    return md.replace(/`[^`]*`/g, '').replace(/\*\*/g, '').replace(/\n/g, ' ');
}

// Convierte el valor interno de dificultad ('easy', 'medium', 'hard') a texto legible en español.
function difLabel(dif) {
    return { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }[dif] || dif;
}

// Devuelve el HTML del badge coloreado según el resultado de un envío (success, failed, pending).
function resultadoBadge(r) {
    const map = {
        success: '<span class="badge-success-sm">✅ Correcto</span>',
        failed:  '<span class="badge-error-sm">❌ Fallido</span>',
        pending: '<span class="badge-pending-sm">⏳ Pendiente</span>',
    };
    return map[r] || r;
}

// Formatea una fecha ISO del servidor a formato legible dd/mm/aa hh:mm en español.
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
        + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Convierte el input JSON de un test case a texto legible.
// Ejemplo: {"nums":[1,2],"k":3} → "nums = [1,2], k = 3"
function formatInput(inputJson) {
    try {
        const obj = JSON.parse(inputJson);
        return Object.entries(obj).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ');
    } catch {
        return escapeHtml(inputJson);
    }
}

// Convierte cualquier valor JS (array, objeto, undefined...) a string para mostrarlo en el panel de resultados.
function formatValor(v) {
    if (v === undefined) return 'undefined';
    if (v === null)      return 'null';
    return JSON.stringify(v);
}

// Convierte Markdown básico (**negrita** y `código`) a HTML seguro para mostrar la descripción de los retos.
function markdownBasico(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

// Muestra una notificación flotante en la esquina inferior derecha.
// type: 'success' | 'error' | 'warning' | 'info' — duration: milisegundos hasta que desaparece.
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
