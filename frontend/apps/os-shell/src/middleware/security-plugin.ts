import type { Plugin } from 'vite';

type SecurityPluginOptions = {
  /**
   * Force-disable the plugin (falls back to no-op).
   */
  enabled?: boolean;
};

// Lightweight placeholder to keep dev/build working until the real plugin is restored.
// Adds a no-op hook and a warning in production when the real implementation is missing.
export function securityPlugin(options: SecurityPluginOptions = {}): Plugin {
  const enabled = options.enabled ?? true;

  return {
    name: 'security-plugin-stub',
    apply: 'serve',
    configResolved() {
      if (enabled && process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line no-console
        console.warn('[security-plugin] Stub in use. Replace with real implementation for production.');
      }
    },
  };
}
