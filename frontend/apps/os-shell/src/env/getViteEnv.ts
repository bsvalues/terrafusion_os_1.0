/**
 * Safe environment access that works in Vite (ESM), Jest (CJS), and Node.
 *
 * Usage:
 * Instead of `import.meta.env.DEV`, use `getViteEnv().DEV`.
 */

// Vite statically replaces import.meta.env at build time.
// Capture it at module scope so it's always available and never blocked by CSP.
let _viteEnv: Record<string, unknown> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (import.meta?.env) {
    _viteEnv = import.meta.env as unknown as Record<string, unknown>;
  }
} catch {
  // CJS/Node: import.meta not available
}

export function getViteEnv(): Record<string, any> {
  // 1. Vite ESM (captured at module load — no eval/new Function)
  // Guard: Jest's import-meta transformer replaces `import.meta?.env` with `({})`,
  // which is truthy but empty. Skip it so we fall back to process.env in tests.
  if (_viteEnv && Object.keys(_viteEnv).length > 0) return _viteEnv;

  // 2. Fallback to process.env (Node/Jest/Electron)
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }

  // 3. Safe fallback to prevent crashes
  return {};
}
