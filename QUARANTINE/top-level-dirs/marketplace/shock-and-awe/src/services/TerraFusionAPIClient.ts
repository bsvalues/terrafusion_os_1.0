export interface RatioStudyRequest {
  countyId: string;
  cohortId: string;
  trims?: { low?: number; high?: number };
}

export interface RatioStudyResult {
  median: number;
  cod: number;
  prd: number;
  subgroups?: Array<{ name: string; median: number; cod: number; prd: number }>;
}

export interface LevyScenarioRequest {
  districtId: string;
  rate: number;
  caps?: Record<string, number>;
  exemptions?: Record<string, number>;
}

export interface LevyForecast {
  districtId: string;
  expected: number;
  lower: number;
  upper: number;
  assumptions: Record<string, unknown>;
}

declare global {
  interface Window {
    __TERRAFUSION_API__?: string;
  }
}

function resolveApiBase(explicit?: string): string {
  if (explicit) return explicit;
  const globalBase = (typeof window !== 'undefined' && window.__TERRAFUSION_API__) || undefined;
  let viteBase: string | undefined;
  try {
    viteBase = (import.meta as any)?.env?.VITE_API_BASE;
  } catch {}
  return globalBase || viteBase || 'http://localhost:5000';
}

export class TerraFusionAPIClient {
  constructor(private baseUrl: string = resolveApiBase()) {}

  async ratioStudy(req: RatioStudyRequest, signal?: AbortSignal): Promise<RatioStudyResult> {
    const init: RequestInit & { signal?: AbortSignal | null } = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    };
    if (typeof signal !== 'undefined') init.signal = signal ?? null;
    const res = await fetch(`${this.baseUrl}/api/statistics/iaao/ratio-study`, init);
    if (!res.ok) throw new Error(`RatioStudy failed: ${res.status}`);
    return res.json();
  }

  async levyForecast(req: LevyScenarioRequest, signal?: AbortSignal): Promise<LevyForecast> {
    const init: RequestInit & { signal?: AbortSignal | null } = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    };
    if (typeof signal !== 'undefined') init.signal = signal ?? null;
    const res = await fetch(`${this.baseUrl}/api/finance/levy/forecast`, init);
    if (!res.ok) throw new Error(`LevyForecast failed: ${res.status}`);
    return res.json();
  }
}
