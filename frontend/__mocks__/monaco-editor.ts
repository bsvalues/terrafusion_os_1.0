// Stub for monaco-editor in vitest — prevents Vite resolution failures in jsdom
export default {};
export const editor = {
  create: () => ({}),
  defineTheme: () => {},
  setTheme: () => {},
};
export const languages = {
  register: () => {},
  setMonarchTokensProvider: () => {},
  registerCompletionItemProvider: () => ({ dispose: () => {} }),
};
export const Uri = {
  parse: (s: string) => ({ toString: () => s }),
};
export const KeyMod = {};
export const KeyCode = {};
