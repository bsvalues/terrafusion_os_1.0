/**
 * Safe environment access that works in Vite (ESM), Jest (CJS), and Node.
 * Prevents "SyntaxError: Cannot use 'import.meta' outside a module" in Jest.
 *
 * Usage:
 * Instead of `import.meta.env.DEV`, use `getViteEnv().DEV`.
 */
export function getViteEnv(): Record<string, any> {
  // 1. Try Vite ESM context via dynamic evaluation
  // This hides the 'import.meta' syntax from CJS parsers (Jest)
  try {
    const meta = new Function('return import.meta')();
    if (meta && meta.env) {
      // In development, freeze to prevent accidental mutation
      if (meta.env.DEV) {
        return Object.freeze({ ...meta.env });
      }
      return meta.env;
    }
  } catch {
    // SyntaxError or ReferenceError expected in CJS/Node
  }

  // 2. Fallback to process.env (Node/Jest/Electron)
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }

  // 3. Safe fallback to prevent crashes
  return {};
}
