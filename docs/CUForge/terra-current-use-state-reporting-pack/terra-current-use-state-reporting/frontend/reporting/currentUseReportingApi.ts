
import type { CurrentUseSubmissionBatch } from './currentUseReportingTypes';

export async function getCurrentUseSubmissionBatchMock():
  Promise<CurrentUseSubmissionBatch> {
  return {
    submissionBatchId: 'submission-001',
    countyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    stateCode: 'WA',
    reportingYear: '2026',
    status: 'VALIDATED',
    recordCount: 2,
    rows: [
      {
        parcelId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        classificationType: 'FARM_AND_AGRICULTURAL',
        lifecycleState: 'ACTIVE_MONITORING',
        classifiedAcres: 18.42,
        rollbackAmount: 11240.55,
      }
    ]
  };
}
