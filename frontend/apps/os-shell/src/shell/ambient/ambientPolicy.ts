export type AmbientMode = 'off' | 'css' | 'canvas2d' | 'webgl';

type GovPolicy = { allowGpu: boolean; defaultMode: AmbientMode };

function getGovPolicy(): GovPolicy {
  return { allowGpu: false, defaultMode: 'css' };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    : true;
}

function isLowPowerDevice(): boolean {
  const cores = (navigator as any)?.hardwareConcurrency ?? 4;
  return cores <= 4;
}

export function resolveAmbientMode(): AmbientMode {
  const policy = getGovPolicy();

  if (prefersReducedMotion()) return 'css';
  if (!policy.allowGpu) return policy.defaultMode;
  if (isLowPowerDevice()) return 'canvas2d';
  return 'webgl';
}
