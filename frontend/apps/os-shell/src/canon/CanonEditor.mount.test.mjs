import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import nodeTest from 'node:test';

const test = process.env.VITEST ? (await import('vitest')).test : nodeTest;

// Runs in Vitest or node --test. Transpile in memory so the real component mount runs
// without Vite's global Monaco mock or a browser/worker/CDN dependency.
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

function mountEditor(actions = []) {
  let editorProps;
  let codeActionProvider;
  const disposable = () => ({ dispose() {} });
  // Monaco 0.52's public API has no languages.CodeActionKind object.
  // Only external editor/worker/network boundaries are doubled; CanonEditor,
  // its mount callback, React rendering, and action conversion remain real.
  const monaco = {
    editor: { defineTheme() {}, setTheme() {} },
    languages: {
      CompletionItemKind: {},
      registerFoldingRangeProvider: disposable,
      registerHoverProvider: disposable,
      registerDefinitionProvider: disposable,
      registerCompletionItemProvider: disposable,
      registerCodeActionProvider(_selector, provider) {
        codeActionProvider = provider;
        return disposable();
      },
      registerReferenceProvider: disposable,
      registerRenameProvider: disposable,
      registerSignatureHelpProvider: disposable,
      registerDocumentHighlightProvider: disposable,
      registerLinkProvider: disposable,
      registerInlayHintsProvider: disposable,
    },
  };
  const editor = { onDidChangeCursorPosition: disposable };
  const modules = new Map();
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    if (file.endsWith('.json')) return JSON.parse(readFileSync(new URL(file), 'utf8'));
    const module = { exports: {} };
    modules.set(file, module);
    const { outputText } = ts.transpileModule(readFileSync(new URL(file), 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      fileName: fileURLToPath(file),
    });
    runInNewContext(outputText, {
      module, exports: module.exports, self: {},
      require(id) {
        if (id === '@monaco-editor/react') return {
          default: (props) => { editorProps = props; return null; },
          loader: { config() {} }, __esModule: true,
        };
        if (id.endsWith('?worker')) return class Worker {};
        if (id.startsWith('monaco-editor')) return monaco;
        if (id === '../api/canonFs') return {
          fetchCodeActions: async () => ({ actions }),
        };
        if (id.startsWith('.')) return load(new URL(id.endsWith('.json') ? id : `${id}.ts`, file).href);
        return require(id);
      },
    }, { filename: fileURLToPath(file) });
    return module.exports;
  }
  const { CanonEditor } = load(new URL('./CanonEditor.tsx', import.meta.url).href);
  renderToStaticMarkup(React.createElement(CanonEditor, {
    fileName: 'README.md', value: '# Workspace',
  }));
  editorProps.onMount(editor, monaco);
  return codeActionProvider;
}

test('opening the editor registers code actions without a nonexistent Monaco enum', () => {
  let provider;
  assert.doesNotThrow(() => { provider = mountEditor(); });
  assert.equal(typeof provider?.provideCodeActions, 'function');
});

test('code actions preserve Monaco string kinds and preferred quick fixes', async () => {
  const provider = mountEditor([
    { title: 'Fix', kind: 'quickfix', isPreferred: true },
    { title: 'Refactor', kind: 'refactor' },
    { title: 'Extract', kind: 'refactor.extract' },
    { title: 'Source', kind: 'source' },
    { title: 'Organize', kind: 'source.organizeImports' },
  ]);
  const result = await provider.provideCodeActions(
    { getValue: () => '# Workspace', uri: { toString: () => 'file:///README.md' } },
    { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 },
  );
  assert.deepEqual(Array.from(result.actions, ({ title, kind, isPreferred }) => ({ title, kind, isPreferred })), [
    { title: 'Fix', kind: 'quickfix', isPreferred: true },
    { title: 'Refactor', kind: 'refactor', isPreferred: false },
    { title: 'Extract', kind: 'refactor.extract', isPreferred: false },
    { title: 'Source', kind: 'source', isPreferred: false },
    { title: 'Organize', kind: 'source.organizeImports', isPreferred: false },
  ]);
});
