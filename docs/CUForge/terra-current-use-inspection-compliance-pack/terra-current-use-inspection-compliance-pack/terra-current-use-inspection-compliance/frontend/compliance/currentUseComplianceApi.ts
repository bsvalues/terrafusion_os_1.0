import type { CurrentUseComplianceSummary } from './currentUseComplianceTypes';

export async function getCurrentUseComplianceSummary(
  parcelId: string,
): Promise<CurrentUseComplianceSummary> {
  const response = await fetch(`/api/forge/current-use/compliance/parcels/${parcelId}/summary`);

  if (!response.ok) {
    throw new Error('Failed to load Current Use compliance summary.');
  }

  return response.json();
}

export async function getCurrentUseComplianceSummaryMock(
  parcelId: string,
): Promise<CurrentUseComplianceSummary> {
  return {
    countyId: 'benton-wa',
    parcelId,
    status: 'AT_RISK',
    lastInspectionDate: '2025-10-15',
    nextInspectionDueDate: '2026-10-15',
    lastIncomeAuditDate: '2024-12-31',
    nextIncomeAuditDueDate: '2027-12-31',
    riskScore: 45,
    riskReasons: [
      'Income proof is missing or stale.',
      'Lease agreement required because owner and operator differ.',
    ],
    recentInspections: [
      {
        inspectionId: 'insp-001',
        countyId: 'benton-wa',
        parcelId,
        status: 'REQUIRES_FOLLOWUP',
        scheduledDate: '2025-10-15',
        completedDate: '2025-10-15',
        inspectorId: 'inspector-001',
        inspectorName: 'Field Appraiser',
        findings: [
          {
            findingType: 'CropActivityObserved',
            summary: 'Crop rows observed on classified acreage.',
            riskFlag: false,
          },
          {
            findingType: 'HomesiteIssueObserved',
            summary: 'Homesite exclusion should be reviewed against current use area.',
            riskFlag: true,
          },
        ],
        notes: 'Follow-up documentation required.',
        createdAt: '2025-10-01T00:00:00.000Z',
        createdBy: 'current.use.desk@county.gov',
        updatedAt: '2025-10-15T00:00:00.000Z',
        updatedBy: 'field.appraiser@county.gov',
      },
    ],
  };
}
