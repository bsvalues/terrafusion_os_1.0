import type { CurrentUseImportBatch } from './currentUseImportTypes';

export async function getCurrentUseImportBatchesMock(
  countyId: string,
): Promise<CurrentUseImportBatch[]> {
  return [
    {
      importBatchId: 'import-001',
      countyId,
      importType: 'CLASSIFICATION_INVENTORY',
      status: 'READY_TO_IMPORT',
      sourceFileName: 'current-use-inventory.csv',
      totalRows: 1248,
      validRows: 1239,
      warningRows: 9,
      errorRows: 0,
      issues: [
        {
          rowNumber: 42,
          fieldName: 'ContiguousGroupId',
          severity: 'WARNING',
          message: 'Contiguous group missing. Parcel can be imported but requires review.',
        },
      ],
      createdAt: '2026-03-15T18:00:00.000Z',
      createdBy: 'data.migration@county.gov',
    },
    {
      importBatchId: 'import-002',
      countyId,
      importType: 'ROLLBACK_WORKSHEET',
      status: 'VALIDATION_FAILED',
      sourceFileName: 'rollback-worksheets.xlsx',
      totalRows: 88,
      validRows: 84,
      warningRows: 0,
      errorRows: 4,
      issues: [
        {
          rowNumber: 17,
          fieldName: 'LevyRate',
          severity: 'ERROR',
          message: 'LevyRate must be numeric.',
        },
      ],
      createdAt: '2026-03-16T18:00:00.000Z',
      createdBy: 'data.migration@county.gov',
    },
  ];
}
