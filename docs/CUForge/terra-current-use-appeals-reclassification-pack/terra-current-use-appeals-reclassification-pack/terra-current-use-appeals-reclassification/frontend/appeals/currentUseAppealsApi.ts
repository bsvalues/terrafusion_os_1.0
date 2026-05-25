import type {
  CurrentUseAppeal,
  CurrentUseReclassificationOption,
} from './currentUseAppealTypes';

export async function getCurrentUseAppeals(parcelId: string): Promise<CurrentUseAppeal[]> {
  const response = await fetch(`/api/forge/current-use/appeals/parcels/${parcelId}`);
  if (!response.ok) throw new Error('Failed to load Current Use appeals.');
  return response.json();
}

export async function getCurrentUseReclassificationOptions(
  parcelId: string,
): Promise<CurrentUseReclassificationOption[]> {
  const response = await fetch(`/api/forge/current-use/appeals/parcels/${parcelId}/reclassification-options`);
  if (!response.ok) throw new Error('Failed to load Current Use reclassification options.');
  return response.json();
}

export async function getCurrentUseAppealsMock(parcelId: string): Promise<CurrentUseAppeal[]> {
  return [
    {
      appealId: 'appeal-001',
      countyId: 'benton-wa',
      parcelId,
      status: 'APPEAL_WINDOW_OPEN',
      noticeMailDate: '2026-03-15',
      appealDeadline: '2026-04-14',
      summary: 'Appeal window opened after notice of removal draft.',
      evidenceDocumentIds: ['doc-001', 'doc-002'],
      createdAt: '2026-03-15T18:10:00.000Z',
      createdBy: 'demo.assessor@county.gov',
      updatedAt: '2026-03-15T18:10:00.000Z',
      updatedBy: 'demo.assessor@county.gov',
    },
  ];
}

export async function getCurrentUseReclassificationOptionsMock(
  parcelId: string,
): Promise<CurrentUseReclassificationOption[]> {
  return [
    {
      reclassificationId: 'reclass-001',
      countyId: 'benton-wa',
      parcelId,
      fromClassification: 'FARM_AND_AGRICULTURAL',
      targetClassification: 'OPEN_SPACE',
      status: 'OPTION_AVAILABLE',
      noticeDate: '2026-03-15',
      applicationDeadline: '2026-04-14',
      summary: 'Owner may apply for reclassification within the applicable window.',
      createdAt: '2026-03-15T18:10:00.000Z',
      createdBy: 'demo.assessor@county.gov',
      updatedAt: '2026-03-15T18:10:00.000Z',
      updatedBy: 'demo.assessor@county.gov',
    },
  ];
}
