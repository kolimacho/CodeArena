// ============================================================
// EDITOR.JS — Inicialización y configuración de Monaco Editor.
// Monaco es el mismo editor de VS Code, cargado desde CDN.
// Se carga una sola vez al arrancar la app y queda listo para todos los retos.
// ============================================================

// Inicializa Monaco Editor: define el tema visual personalizado ('codearena') y crea la instancia en el div #monaco-container.
// Se llama una sola vez desde app.js en el evento DOMContentLoaded.
function initMonaco() {
    require(['vs/editor/editor.main'], () => {
        monacoReady = true;

        // Tema propio basado en 'vs-dark': fondo negro, keywords en verde, strings en amarillo, números en naranja.
        monaco.editor.defineTheme('codearena', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '666680', fontStyle: 'italic' },
                { token: 'keyword', foreground: '00e87a' },
                { token: 'string',  foreground: 'f5c542' },
                { token: 'number',  foreground: 'ff9f43' },
            ],
            colors: {
                'editor.background':                '#0a0a0e',
                'editor.foreground':                '#e0e0ec',
                'editor.lineHighlightBackground':   '#1a1a22',
                'editorLineNumber.foreground':       '#444460',
                'editorLineNumber.activeForeground': '#00e87a',
                'editor.selectionBackground':        '#00e87a33',
                'editorCursor.foreground':           '#00e87a',
            }
        });

        // Crea el editor dentro de #monaco-container con lenguaje JavaScript fijo y el tema personalizado.
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

// Genera la plantilla inicial que ve el usuario al abrir un reto.
// Los nombres de los parámetros se extraen automáticamente del primer test case del reto.
// Ejemplo: si el input es {"s":"hello"} → genera function solution(s) { ... }
function getStarterTemplate(params = []) {
    const paramStr = params.length ? params.join(', ') : '/* parámetros */';
    return `function solution(${paramStr}) {\n    // Escribe tu código aquí\n    \n}`;
}
