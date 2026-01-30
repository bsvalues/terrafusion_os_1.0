export type ProbeResult = {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
  warnings: string[];
  intentFilter: string | null;
  moduleCountTotal: number | null;
  moduleCountActive: number | null;
  moduleCountFilteredOut: number | null;
  systemComponents: Record<string, boolean> | null;
};

export async function probeHealth(endpoint: string, timeoutMs = 1500): Promise<ProbeResult> {
  const warnings: string[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  let intentFilter: string | null = null;
  let moduleCountTotal: number | null = null;
  let moduleCountActive: number | null = null;
  let moduleCountFilteredOut: number | null = null;
  let systemComponents: Record<string, boolean> | null = null;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    const latencyMs = Math.round(performance.now() - start);

    if (!response.ok) {
      warnings.push(`Health probe returned ${response.status}`);
      return {
        ok: false,
        status: 'degraded',
        latencyMs,
        warnings,
        intentFilter,
        moduleCountTotal,
        moduleCountActive,
        moduleCountFilteredOut,
        systemComponents,
      };
    }

    let statusHint: string | null = null;
    let moduleCount: number | null = null;
    let healthyModules: number | null = null;
    try {
      const data = await response.json();
      if (typeof data?.status === 'string') statusHint = data.status;
      if (typeof data?.intentFilter === 'string') intentFilter = data.intentFilter;
      if (data?.systemComponents && typeof data.systemComponents === 'object') {
        const entries = Object.entries(data.systemComponents).filter(
          ([, value]) => typeof value === 'boolean'
        );
        systemComponents = Object.fromEntries(entries);
      }

      const asNumber = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '') {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      moduleCountTotal = asNumber(data?.moduleCountTotal);
      moduleCountActive = asNumber(data?.moduleCountActive ?? data?.moduleCount);
      moduleCountFilteredOut = asNumber(data?.moduleCountFilteredOut);
      moduleCount = asNumber(data?.moduleCount);
      healthyModules = asNumber(data?.healthyModules);
    } catch {
      // ignore non-JSON body
    }

    const normalized = statusHint ? statusHint.toLowerCase() : 'healthy';
    const status = normalized.includes('healthy') || normalized.includes('ok')
      ? 'healthy'
      : 'degraded';

    if (moduleCountActive !== null && moduleCountTotal !== null) {
      if (moduleCountActive > moduleCountTotal) {
        warnings.push(
          `Invariant violation: active modules (${moduleCountActive}) exceeds total (${moduleCountTotal})`
        );
      }
    }

    if (healthyModules !== null && moduleCount !== null) {
      if (healthyModules > moduleCount) {
        warnings.push(
          `Invariant violation: healthy modules (${healthyModules}) exceeds total (${moduleCount})`
        );
      }
    }

    if (status === 'healthy' && systemComponents) {
      const failed = Object.entries(systemComponents)
        .filter(([, ok]) => !ok)
        .map(([name]) => name);
      if (failed.length > 0) {
        warnings.push(
          `Integrity error: system reports healthy but components failed: ${failed.join(', ')}`
        );
      }
    }

    if (status !== 'healthy') {
      warnings.push(`Health status reported: ${statusHint || 'unknown'}`);
    }

    if (moduleCountActive === 0) {
      warnings.push('No active modules loaded (check TF_MODULE_INTENT_FILTER and module path)');
    }

    return {
      ok: true,
      status,
      latencyMs,
      warnings,
      intentFilter,
      moduleCountTotal,
      moduleCountActive,
      moduleCountFilteredOut,
      systemComponents,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    const reason = error instanceof Error ? error.message : String(error);
    warnings.push(`Health probe failed: ${reason}`);
    return {
      ok: false,
      status: 'down',
      latencyMs,
      warnings,
      intentFilter,
      moduleCountTotal,
      moduleCountActive,
      moduleCountFilteredOut,
      systemComponents,
    };
  } finally {
    clearTimeout(timeout);
  }
}
