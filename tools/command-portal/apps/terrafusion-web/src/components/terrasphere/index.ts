// TerraSphere Component Exports
export { TerraSphere } from "./TerraSphere";
export type { TerraSphereProps } from "./TerraSphere";

// Performance Configuration
export const TERRASPHERE_CONFIG = {
  maxGPUUsage: 0.15,
  maxMemoryMB: 32,
  targetFPS: 60,
  idleCPUPercent: 0.02,
} as const;