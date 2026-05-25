import type { ClassificationType, RollbackInput, RollbackResult } from '../domain/rollback/rollbackTypes';

const API_BASE = `/api/forge/current-use/alpha`;

export interface CurrentUseOverview {
  parcelId: string;
  classificationType: string | null;
  programStatus: string;
  enrollmentDate: string | null;
  engineVersion: string;
}

export async function getCurrentUseOverview(parcelId: string): Promise<CurrentUseOverview> {
  const res = await fetch(`${API_BASE}/parcels/${parcelId}/overview`);
  if (!res.ok) throw new Error(`CurrentUse overview failed: ${res.status}`);
  return res.json() as Promise<CurrentUseOverview>;
}

export async function runRollback(input: RollbackInput): Promise<RollbackResult> {
  const body = {
    parcelId: input.parcelId,
    classificationType: input.classificationType as ClassificationType,
    removalDate: input.removalDate,
    taxYearOfRemoval: input.taxYearOfRemoval,
  };

  const res = await fetch(`${API_BASE}/rollback/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Rollback calculation failed: ${res.status}`);
  return res.json() as Promise<RollbackResult>;
}
