/**
 * useLogger — typed, environment-aware logger for TerraFusion runtime surfaces.
 *
 * Rules:
 * - In production, only warn + error are emitted.
 * - In dev/test, all levels are emitted.
 * - The hook is safe to call in renders (no side effects outside the returned methods).
 * - The returned object is stable (does not change on re-render).
 */

import { useMemo } from 'react';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info:  (message: string, ...args: unknown[]) => void;
  warn:  (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/** Create a scoped logger bound to a component or module name. */
export function createLogger(scope: string): Logger {
  const prefix = `[TF:${scope}]`;
  const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;

  return {
    debug: (msg, ...args) => {
      if (!isProd) console.debug(prefix, msg, ...args);
    },
    info: (msg, ...args) => {
      if (!isProd) console.info(prefix, msg, ...args);
    },
    warn: (msg, ...args) => {
      const extra = args.length ? ` ${args.map(String).join(' ')}` : '';
      console.warn(`${prefix} ${msg}${extra}`);
    },
    error: (msg, ...args) => {
      console.error(prefix, msg, ...args);
    },
  };
}

/**
 * useLogger('MyComponent') → stable Logger bound to that scope.
 * Safe to call at the top of any React component.
 */
export function useLogger(scope: string): Logger {
  return useMemo(() => createLogger(scope), [scope]);
}
