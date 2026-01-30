/**
 * Environment utilities
 *
 * Provides Jest-compatible environment detection that works in both
 * Vite (import.meta.env) and Jest (process.env) environments.
 *
 * @module utils/env
 */

/**
 * Returns true if running in development mode.
 * Works in both Vite and Jest environments.
 */
export const isDev = (): boolean => {
  // Check process.env first (works in Jest and Node)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test') return true; // Tests run as "dev"
    if (process.env.NODE_ENV === 'development') return true;
    if (process.env.NODE_ENV === 'production') return false;
  }

  // Fallback: assume dev in non-production
  return true;
};

/**
 * Returns true if running in production mode.
 */
export const isProd = (): boolean => !isDev();

/**
 * Returns true if running in test mode (Jest, Vitest, etc.)
 */
export const isTest = (): boolean => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  }
  return false;
};
