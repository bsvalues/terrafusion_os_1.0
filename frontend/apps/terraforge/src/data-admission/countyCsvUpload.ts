export type CountyCsvDataset = 'Parcels' | 'Sales';

export type CountyCsvApiFetch = (path: string, init?: RequestInit) => Promise<Response>;

export interface CountyCsvUploadBatchSummary {
  batchId: string;
  countyId: string;
  dataset: CountyCsvDataset;
  sourceFileName: string;
  contentSha256: string;
  contentByteLength: number;
  acceptedRowCount: number;
  status: 'Admitted';
  receivedAtUtc: string;
  rowStaging: CountyCsvUploadRowStagingSummary | null;
  promotion: CountyCsvUploadPromotionSummary | null;
}

export interface CountyCsvUploadPromotionSummary {
  batchId: string;
  countyId: string;
  contractId: 'wal.county-upload.terraforge-sales-promotion.v1';
  promotedRowCount: number;
  latestSaleDate: string;
  promotedAtUtc: string;
}

export interface CountyCsvQuarantineReasonCount {
  reasonCode: string;
  count: number;
}

export interface CountyCsvUploadRowStagingSummary {
  batchId: string;
  countyId: string;
  contractId: string;
  schemaVersion: string;
  totalRowCount: number;
  stagedRowCount: number;
  quarantinedRowCount: number;
  reasonCounts: CountyCsvQuarantineReasonCount[];
  validatedAtUtc: string;
}

export interface CountyCsvUploadHistory {
  contractId: string;
  countyId: string;
  countyKey: string;
  countyName: string;
  availability: 'row-validation-staging-not-promoted' | 'validated-sales-promoted-to-terraforge';
  batches: CountyCsvUploadBatchSummary[];
}

export interface CountyCsvPromotionReceipt {
  contractId: 'wal.county-upload.terraforge-sales-promotion.v1';
  countyKey: string;
  countyName: string;
  disposition: 'Promoted' | 'Duplicate';
  promotion: CountyCsvUploadPromotionSummary;
}

export interface CountyCsvPromotedSalesAvailability {
  contractId: 'wal.county-upload.terraforge-sales-promotion.v1';
  countyId: string;
  countyKey: string;
  countyName: string;
  promotedSales: number;
  latestSaleDate: string | null;
  recommendedStudyYear: number | null;
  salesReviewAvailable: boolean;
}

export interface CountyCsvUploadReceipt {
  contractId: string;
  ledgerContractId: string;
  batchId: string;
  countyId: string;
  countyKey: string;
  countyName: string;
  dataset: CountyCsvDataset;
  contentSha256: string;
  contentLength: number;
  acceptedRowCount: number;
  duplicateDisposition: 'FirstSeen' | 'Duplicate';
  rowStagingContractId: string;
  validationSchemaVersion: string;
  stagedRowCount: number;
  quarantinedRowCount: number;
  quarantineReasonCounts: CountyCsvQuarantineReasonCount[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReasonCount(value: unknown): value is CountyCsvQuarantineReasonCount {
  return (
    isRecord(value) &&
    typeof value.reasonCode === 'string' &&
    /^[A-Z][A-Z0-9_]{0,63}$/.test(value.reasonCode) &&
    typeof value.count === 'number' &&
    Number.isSafeInteger(value.count) &&
    value.count > 0
  );
}

function isRowStaging(
  value: unknown,
  batchId: string,
  countyId: string,
  acceptedRowCount: number
): boolean {
  return (
    isRecord(value) &&
    value.batchId === batchId &&
    value.countyId === countyId &&
    value.contractId === 'wal.county-upload.durable-row-staging.v1' &&
    value.schemaVersion === 'wa-county-csv-v1' &&
    typeof value.totalRowCount === 'number' &&
    Number.isSafeInteger(value.totalRowCount) &&
    value.totalRowCount >= 0 &&
    value.totalRowCount === acceptedRowCount &&
    typeof value.stagedRowCount === 'number' &&
    Number.isSafeInteger(value.stagedRowCount) &&
    value.stagedRowCount >= 0 &&
    typeof value.quarantinedRowCount === 'number' &&
    Number.isSafeInteger(value.quarantinedRowCount) &&
    value.quarantinedRowCount >= 0 &&
    value.stagedRowCount + value.quarantinedRowCount === value.totalRowCount &&
    Array.isArray(value.reasonCounts) &&
    value.reasonCounts.every(isReasonCount) &&
    value.reasonCounts.reduce((sum, reason) => sum + reason.count, 0) ===
      value.quarantinedRowCount &&
    typeof value.validatedAtUtc === 'string'
  );
}

function isBatch(value: unknown): value is CountyCsvUploadBatchSummary {
  return (
    isRecord(value) &&
    typeof value.batchId === 'string' &&
    typeof value.countyId === 'string' &&
    (value.dataset === 'Parcels' || value.dataset === 'Sales') &&
    typeof value.sourceFileName === 'string' &&
    typeof value.contentSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(value.contentSha256) &&
    typeof value.contentByteLength === 'number' &&
    Number.isSafeInteger(value.contentByteLength) &&
    value.contentByteLength > 0 &&
    typeof value.acceptedRowCount === 'number' &&
    Number.isSafeInteger(value.acceptedRowCount) &&
    value.acceptedRowCount >= 0 &&
    value.status === 'Admitted' &&
    typeof value.receivedAtUtc === 'string' &&
    (value.rowStaging === null ||
      isRowStaging(value.rowStaging, value.batchId, value.countyId, value.acceptedRowCount)) &&
    (value.promotion === undefined ||
      value.promotion === null ||
      isPromotion(value.promotion, value.batchId, value.countyId))
  );
}

function isCanonicalDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPromotion(
  value: unknown,
  batchId: string,
  countyId: string
): value is CountyCsvUploadPromotionSummary {
  return (
    isRecord(value) &&
    value.batchId === batchId &&
    value.countyId === countyId &&
    value.contractId === 'wal.county-upload.terraforge-sales-promotion.v1' &&
    typeof value.promotedRowCount === 'number' &&
    Number.isSafeInteger(value.promotedRowCount) &&
    value.promotedRowCount >= 0 &&
    isCanonicalDate(value.latestSaleDate) &&
    typeof value.promotedAtUtc === 'string'
  );
}

function requireHistory(value: unknown): CountyCsvUploadHistory {
  if (
    !isRecord(value) ||
    typeof value.contractId !== 'string' ||
    typeof value.countyId !== 'string' ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    (value.availability !== 'row-validation-staging-not-promoted' &&
      value.availability !== 'validated-sales-promoted-to-terraforge') ||
    !Array.isArray(value.batches) ||
    !value.batches.every(isBatch) ||
    value.batches.some((batch) => batch.countyId !== value.countyId)
  ) {
    throw new Error('The county upload service returned an invalid history response.');
  }
  return value as unknown as CountyCsvUploadHistory;
}

function requirePromotionReceipt(value: unknown): CountyCsvPromotionReceipt {
  if (
    !isRecord(value) ||
    value.contractId !== 'wal.county-upload.terraforge-sales-promotion.v1' ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    (value.disposition !== 'Promoted' && value.disposition !== 'Duplicate') ||
    !isRecord(value.promotion) ||
    typeof value.promotion.batchId !== 'string' ||
    typeof value.promotion.countyId !== 'string' ||
    !isPromotion(value.promotion, value.promotion.batchId, value.promotion.countyId)
  ) {
    throw new Error('The county upload service returned an invalid promotion receipt.');
  }
  return value as unknown as CountyCsvPromotionReceipt;
}

function requireAvailability(value: unknown): CountyCsvPromotedSalesAvailability {
  const expectedStudyYear =
    isRecord(value) && typeof value.latestSaleDate === 'string'
      ? Number(value.latestSaleDate.slice(0, 4)) + 1
      : null;
  if (
    !isRecord(value) ||
    value.contractId !== 'wal.county-upload.terraforge-sales-promotion.v1' ||
    typeof value.countyId !== 'string' ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    typeof value.promotedSales !== 'number' ||
    !Number.isSafeInteger(value.promotedSales) ||
    value.promotedSales < 0 ||
    (value.latestSaleDate !== null && !isCanonicalDate(value.latestSaleDate)) ||
    (value.recommendedStudyYear !== null &&
      (typeof value.recommendedStudyYear !== 'number' ||
        !Number.isSafeInteger(value.recommendedStudyYear))) ||
    value.recommendedStudyYear !== expectedStudyYear ||
    typeof value.salesReviewAvailable !== 'boolean' ||
    value.salesReviewAvailable !== value.promotedSales > 0
  ) {
    throw new Error('The county upload service returned invalid promoted-sales availability.');
  }
  return value as unknown as CountyCsvPromotedSalesAvailability;
}

function requireReceipt(value: unknown): CountyCsvUploadReceipt {
  if (
    !isRecord(value) ||
    typeof value.contractId !== 'string' ||
    typeof value.ledgerContractId !== 'string' ||
    typeof value.batchId !== 'string' ||
    typeof value.countyId !== 'string' ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    (value.dataset !== 'Parcels' && value.dataset !== 'Sales') ||
    typeof value.contentSha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.contentSha256) ||
    typeof value.contentLength !== 'number' ||
    !Number.isSafeInteger(value.contentLength) ||
    value.contentLength <= 0 ||
    typeof value.acceptedRowCount !== 'number' ||
    !Number.isSafeInteger(value.acceptedRowCount) ||
    value.acceptedRowCount < 0 ||
    (value.duplicateDisposition !== 'FirstSeen' && value.duplicateDisposition !== 'Duplicate') ||
    value.rowStagingContractId !== 'wal.county-upload.durable-row-staging.v1' ||
    value.validationSchemaVersion !== 'wa-county-csv-v1' ||
    typeof value.stagedRowCount !== 'number' ||
    !Number.isSafeInteger(value.stagedRowCount) ||
    value.stagedRowCount < 0 ||
    typeof value.quarantinedRowCount !== 'number' ||
    !Number.isSafeInteger(value.quarantinedRowCount) ||
    value.quarantinedRowCount < 0 ||
    value.stagedRowCount + value.quarantinedRowCount !== value.acceptedRowCount ||
    !Array.isArray(value.quarantineReasonCounts) ||
    !value.quarantineReasonCounts.every(isReasonCount) ||
    value.quarantineReasonCounts.reduce((sum, reason) => sum + reason.count, 0) !==
      value.quarantinedRowCount
  ) {
    throw new Error('The county upload service returned an invalid admission receipt.');
  }
  return value as unknown as CountyCsvUploadReceipt;
}

async function requireOk(response: Response, fallback: string): Promise<unknown> {
  if (response.ok) return response.json() as Promise<unknown>;
  let code = '';
  try {
    const body = (await response.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? ` (${body.code})` : '';
  } catch {
    // The stable HTTP status still communicates the protected failure.
  }
  throw new Error(`${fallback} HTTP ${response.status}${code}.`);
}

export async function fetchCountyCsvUploadHistory(
  apiFetch: CountyCsvApiFetch,
  signal?: AbortSignal
): Promise<CountyCsvUploadHistory> {
  const response = await apiFetch('/upload/history', { signal });
  return requireHistory(await requireOk(response, 'County upload history is unavailable.'));
}

export async function uploadCountyCsv(
  apiFetch: CountyCsvApiFetch,
  file: File,
  dataset: CountyCsvDataset,
  signal?: AbortSignal
): Promise<CountyCsvUploadReceipt> {
  const form = new FormData();
  form.append('file', file);
  form.append('dataset', dataset);
  const response = await apiFetch('/upload', {
    method: 'POST',
    body: form,
    signal,
  });
  return requireReceipt(await requireOk(response, 'County CSV upload was denied.'));
}

export async function promoteCountyCsvSales(
  apiFetch: CountyCsvApiFetch,
  batchId: string,
  signal?: AbortSignal
): Promise<CountyCsvPromotionReceipt> {
  const response = await apiFetch(`/upload/${encodeURIComponent(batchId)}/promote`, {
    method: 'POST',
    signal,
  });
  return requirePromotionReceipt(await requireOk(response, 'County Sales promotion was denied.'));
}

export async function fetchCountyCsvPromotedSalesAvailability(
  apiFetch: CountyCsvApiFetch,
  signal?: AbortSignal
): Promise<CountyCsvPromotedSalesAvailability> {
  const response = await apiFetch('/upload/promoted-sales', { signal });
  return requireAvailability(
    await requireOk(response, 'Promoted county Sales availability is unavailable.')
  );
}
