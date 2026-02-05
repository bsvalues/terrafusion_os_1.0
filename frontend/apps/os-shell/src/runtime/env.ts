/**
 * env.ts
 *
 * Runtime environment adapter for Jest/Vite compatibility.
 * Abstracts environment detection to avoid direct import.meta.env references
 * which are not parseable by Jest.
 *
 * Usage:
 *   import { getEnv } from '../../runtime/env';
 *   if (getEnv().DEV) { ... }
 */

type Env = {
  DEV: boolean;
  PROD: boolean;
  MODE: string;
};

/**
 * Get environment configuration.
 * Works in both Vite (browser) and Jest (Node) contexts.
 *
 * In Vite: Uses process.env.NODE_ENV set at build time
 * In Jest: Uses process.env.NODE_ENV from test runner
 */
export function getEnv(): Env {
  // Use process.env.NODE_ENV which is available in both Vite and Jest
  // Vite defines this at build time, Jest sets it at runtime
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    DEV: nodeEnv === 'development' || nodeEnv === 'test',
    PROD: nodeEnv === 'production',
    MODE: nodeEnv,
  };
}
