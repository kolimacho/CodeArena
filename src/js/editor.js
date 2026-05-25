// ============================================================
// EDITOR.JS — Monaco Editor: inicialización y configuración
// ============================================================

function initMonaco() {
    require(['vs/editor/editor.main'], () => {
        monacoReady = true;

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

/**
 * Devuelve la plantilla inicial de JavaScript con los parámetros del reto.
 * @param {string[]} params - nombres de los parámetros extraídos del primer test case
 */
function getStarterTemplate(params = []) {
    const paramStr = params.length ? params.join(', ') : '/* parámetros */';
    return `function solution(${paramStr}) {\n    // Escribe tu código aquí\n    \n}`;
}
