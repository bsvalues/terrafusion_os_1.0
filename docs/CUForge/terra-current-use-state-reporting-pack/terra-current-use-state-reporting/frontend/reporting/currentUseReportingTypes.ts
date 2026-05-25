
export interface CurrentUseSubmissionRow {
  parcelId: string;
  classificationType: string;
  lifecycleState: string;
  classifiedAcres: number;
  rollbackAmount?: number;
}

export interface CurrentUseSubmissionBatch {
  submissionBatchId: string;
  countyId: string;
  stateCode: string;
  reportingYear: string;
  status: string;
  recordCount: number;
  rows: CurrentUseSubmissionRow[];
}
