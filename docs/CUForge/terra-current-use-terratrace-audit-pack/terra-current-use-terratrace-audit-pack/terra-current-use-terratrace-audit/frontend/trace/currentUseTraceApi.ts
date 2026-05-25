import type { CurrentUseTraceEvent } from './currentUseTraceTypes';

export async function getCurrentUseTrace(parcelId: string): Promise<CurrentUseTraceEvent[]> {
  const response = await fetch(`/api/trace/current-use/parcels/${parcelId}`);

  if (!response.ok) {
    throw new Error('Failed to load Current Use trace.');
  }

  return response.json();
}

export async function verifyCurrentUseTrace(parcelId: string): Promise<{ parcelId: string; valid: boolean }> {
  const response = await fetch(`/api/trace/current-use/parcels/${parcelId}/verify`);

  if (!response.ok) {
    throw new Error('Failed to verify Current Use trace.');
  }

  return response.json();
}

export async function getCurrentUseTraceMock(parcelId: string): Promise<CurrentUseTraceEvent[]> {
  return [
    {
      id: 'trace-003',
      countyId: 'benton-wa',
      parcelId,
      action: 'RollbackCalculationRun',
      actorId: 'demo.assessor@county.gov',
      actorDisplayName: 'Demo Assessor',
      timestamp: '2026-03-15T18:10:00.000Z',
      calculationVersion: 'CU_ROLLBACK_ENGINE_v2026_03_01',
      documentIds: [],
      summary: 'Rollback calculation generated. Total due: $0.00 due to voluntary withdrawal penalty suppression demo.',
      hash: 'hash003',
      previousHash: 'hash002',
    },
    {
      id: 'trace-002',
      countyId: 'benton-wa',
      parcelId,
      action: 'DocumentLinked',
      actorId: 'current.use.desk@county.gov',
      actorDisplayName: 'Current Use Desk',
      timestamp: '2026-03-08T12:00:00.000Z',
      documentIds: ['doc-002'],
      summary: 'Income proof linked to Current Use evidence packet.',
      hash: 'hash002',
      previousHash: 'hash001',
    },
    {
      id: 'trace-001',
      countyId: 'benton-wa',
      parcelId,
      action: 'ClassificationCreated',
      actorId: 'assessor.staff@county.gov',
      actorDisplayName: 'Assessor Staff',
      timestamp: '2019-04-17T12:00:00.000Z',
      documentIds: [],
      summary: 'Farm & Agricultural classification approved.',
      hash: 'hash001',
    },
  ];
}
