export type CurrentUseImportType =
  | 'CLASSIFICATION_INVENTORY'
  | 'ROLLBACK_WORKSHEET'
  | 'EVIDENCE_INDEX'
  | 'NOTICE_HISTORY'
  | 'INSPECTION_HISTORY'
  | 'TREASURER_PAYMENT_HISTORY';

export type CurrentUseImportStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'VALIDATION_FAILED'
  | 'READY_TO_IMPORT'
  | 'IMPORTED'
  | 'IMPORT_FAILED'
  | 'CANCELED';

export interface CurrentUseImportValidationIssue {
  rowNumber: number;
  fieldName: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
}

export interface CurrentUseImportBatch {
  importBatchId: string;
  countyId: string;
  importType: CurrentUseImportType;
  status: CurrentUseImportStatus;
  sourceFileName: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  issues: CurrentUseImportValidationIssue[];
  createdAt: string;
  createdBy: string;
}
