/**
 * TerraFusion Feature Flags
 * Law: All flags default to FALSE unless explicitly enabled by the environment.
 */
interface FeatureFlags {
  // Core Modules
  ENABLE_AXIOM_FS: boolean;
  ENABLE_DASHBOARD: boolean;

  // Advanced Capabilities
  ENABLE_SIMULATION_ENGINE: boolean; // The Costforge AI
  ENABLE_REDUCED_MOTION: boolean; // Accessibility Override

  // Debug / Dev
  ENABLE_DEBUG_OVERLAYS: boolean;
  USE_MOCK_DATA: boolean;
}

const getEnvBool = (key: string, defaultVal: boolean = false): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- globalThis.import.meta is a Jest test mock shim, not in TypeScript lib
  const env =
    (globalThis as any).import?.meta?.env ??
    (globalThis as any).importMeta?.env ??
    {};
  if (env[key] === 'true') return true;
  if (env[key] === 'false') return false;
  return defaultVal;
};

export const FEATURES: FeatureFlags = {
  ENABLE_AXIOM_FS: getEnvBool('VITE_ENABLE_AXIOM_FS', true),
  ENABLE_DASHBOARD: getEnvBool('VITE_ENABLE_DASHBOARD', true),
  ENABLE_SIMULATION_ENGINE: getEnvBool('VITE_ENABLE_SIMULATION_ENGINE', true),
  ENABLE_REDUCED_MOTION: getEnvBool('VITE_ENABLE_REDUCED_MOTION', false),
  ENABLE_DEBUG_OVERLAYS: getEnvBool('VITE_ENABLE_DEBUG_OVERLAYS', false),
  USE_MOCK_DATA: getEnvBool('VITE_USE_MOCK_DATA', false), // Explicitly enable via VITE_USE_MOCK_DATA=true for demos
};
