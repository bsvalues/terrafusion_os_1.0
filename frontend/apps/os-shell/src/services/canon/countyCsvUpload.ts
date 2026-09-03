import { apiFetch } from '@/lib/apiBase';

export type CountyCsvDataset = 'Parcels' | 'Sales';

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
}

export interface CountyCsvUploadHistory {
  contractId: string;
  countyId: string;
  countyKey: string;
  countyName: string;
  availability: 'admitted-not-staged';
  batches: CountyCsvUploadBatchSummary[];
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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
    typeof value.receivedAtUtc === 'string'
  );
}

function requireHistory(value: unknown): CountyCsvUploadHistory {
  if (
    !isRecord(value) ||
    typeof value.contractId !== 'string' ||
    typeof value.countyId !== 'string' ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    value.availability !== 'admitted-not-staged' ||
    !Array.isArray(value.batches) ||
    !value.batches.every(isBatch) ||
    value.batches.some((batch) => batch.countyId !== value.countyId)
  ) {
    throw new Error('The county upload service returned an invalid history response.');
  }
  return value as unknown as CountyCsvUploadHistory;
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
    (value.duplicateDisposition !== 'FirstSeen' && value.duplicateDisposition !== 'Duplicate')
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
  signal?: AbortSignal
): Promise<CountyCsvUploadHistory> {
  const response = await apiFetch('/upload/history', { signal });
  return requireHistory(await requireOk(response, 'County upload history is unavailable.'));
}

export async function uploadCountyCsv(
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
