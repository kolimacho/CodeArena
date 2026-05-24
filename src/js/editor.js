// ============================================================
// EDITOR.JS — Monaco Editor: inicialización y configuración
// ============================================================
// Depende de: utils.js (para showToast)
// Variables globales que modifica: monacoEditor, monacoReady
// ============================================================

/**
 * Inicializa Monaco Editor con el tema personalizado de CodeArena.
 * Se llama una sola vez al cargar la página.
 */
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
 * Cambia el lenguaje del editor y carga la plantilla correspondiente
 * si el editor está vacío.
 */
function changeEditorLanguage(lang) {
    if (!monacoEditor || !monacoReady) return;
    const model = monacoEditor.getModel();
    monaco.editor.setModelLanguage(model, lang === 'cpp' ? 'cpp' : lang);

    if (!monacoEditor.getValue().trim()) {
        monacoEditor.setValue(getStarterTemplate(lang));
    }
}

/**
 * Devuelve la plantilla de código inicial para el lenguaje dado.
 * @param {string} lang - javascript | python | java | cpp
 * @param {string[]} params - nombres de los parámetros extraídos del primer test case
 */
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
