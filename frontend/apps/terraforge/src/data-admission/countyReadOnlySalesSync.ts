export type CountyReadOnlySalesSyncStatus =
  | 'not-configured'
  | 'ambiguous-connections'
  | 'read-only-authority-invalid'
  | 'source-identity-mismatch'
  | 'last-sync-failed'
  | 'connected-sales-available'
  | 'connected-no-sales';

export interface CountyReadOnlySalesSyncAvailability {
  contractId: 'wal.county-connected.readonly-sales-sync.v1';
  countyId: string;
  countyKey: string;
  countyName: string;
  connectionConfigured: boolean;
  sourceSystem: string | null;
  lastSuccessfulSyncAtUtc: string | null;
  availableSales: number;
  latestSaleDate: string | null;
  recommendedStudyYear: number | null;
  salesReviewAvailable: boolean;
  status: CountyReadOnlySalesSyncStatus;
}

export interface CountyReadOnlySalesSyncReceipt {
  countyKey: string;
  countyName: string;
  receipt: {
    contractId: 'wal.county-connected.readonly-sales-sync.v1';
    receiptId: string;
    countyId: string;
    connectionId: string;
    sourceSystem: string;
    sourceRows: number;
    addedSales: number;
    updatedSales: number;
    externalWrites: 0;
    availableSales: number;
    latestSaleDate: string | null;
    recommendedStudyYear: number | null;
    completedAtUtc: string;
  };
}

export type CountyReadOnlySalesSyncFetch = (path: string, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1]!;
}

function hasSafeReceiptCounts(receipt: Record<string, unknown>): boolean {
  return ['sourceRows', 'addedSales', 'updatedSales', 'availableSales'].every((field) => {
    const count = receipt[field];
    return typeof count === 'number' && Number.isSafeInteger(count) && count >= 0;
  });
}

const statuses = new Set<CountyReadOnlySalesSyncStatus>([
  'not-configured',
  'ambiguous-connections',
  'read-only-authority-invalid',
  'source-identity-mismatch',
  'last-sync-failed',
  'connected-sales-available',
  'connected-no-sales',
]);

function requireAvailability(value: unknown): CountyReadOnlySalesSyncAvailability {
  const expectedYear =
    isRecord(value) && isDate(value.latestSaleDate)
      ? Number(value.latestSaleDate.slice(0, 4)) + 1
      : null;
  if (
    !isRecord(value) ||
    value.contractId !== 'wal.county-connected.readonly-sales-sync.v1' ||
    typeof value.countyId !== 'string' ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    typeof value.connectionConfigured !== 'boolean' ||
    (value.sourceSystem !== null && typeof value.sourceSystem !== 'string') ||
    (value.lastSuccessfulSyncAtUtc !== null && typeof value.lastSuccessfulSyncAtUtc !== 'string') ||
    typeof value.availableSales !== 'number' ||
    !Number.isSafeInteger(value.availableSales) ||
    value.availableSales < 0 ||
    (value.latestSaleDate !== null && !isDate(value.latestSaleDate)) ||
    value.recommendedStudyYear !== expectedYear ||
    typeof value.salesReviewAvailable !== 'boolean' ||
    value.salesReviewAvailable !==
      (value.status === 'connected-sales-available' &&
        value.connectionConfigured &&
        value.availableSales > 0) ||
    typeof value.status !== 'string' ||
    !statuses.has(value.status as CountyReadOnlySalesSyncStatus)
  ) {
    throw new Error('The county sync service returned invalid availability.');
  }
  return value as unknown as CountyReadOnlySalesSyncAvailability;
}

function requireReceipt(value: unknown): CountyReadOnlySalesSyncReceipt {
  if (
    !isRecord(value) ||
    typeof value.countyKey !== 'string' ||
    typeof value.countyName !== 'string' ||
    !isRecord(value.receipt) ||
    value.receipt.contractId !== 'wal.county-connected.readonly-sales-sync.v1' ||
    typeof value.receipt.receiptId !== 'string' ||
    typeof value.receipt.countyId !== 'string' ||
    typeof value.receipt.connectionId !== 'string' ||
    typeof value.receipt.sourceSystem !== 'string' ||
    !hasSafeReceiptCounts(value.receipt) ||
    value.receipt.externalWrites !== 0 ||
    (value.receipt.latestSaleDate !== null && !isDate(value.receipt.latestSaleDate)) ||
    (value.receipt.recommendedStudyYear !== null &&
      (!Number.isSafeInteger(value.receipt.recommendedStudyYear) ||
        value.receipt.recommendedStudyYear !==
          Number(String(value.receipt.latestSaleDate).slice(0, 4)) + 1)) ||
    typeof value.receipt.completedAtUtc !== 'string'
  ) {
    throw new Error('The county sync service returned an invalid receipt.');
  }
  return value as unknown as CountyReadOnlySalesSyncReceipt;
}

async function requireOk(response: Response, fallback: string): Promise<unknown> {
  if (response.ok) return response.json() as Promise<unknown>;
  let code = '';
  try {
    const body = (await response.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? ` (${body.code})` : '';
  } catch {
    // Keep the stable status when the server did not return problem JSON.
  }
  throw new Error(`${fallback} HTTP ${response.status}${code}.`);
}

export async function fetchCountyReadOnlySalesSyncAvailability(
  apiFetch: CountyReadOnlySalesSyncFetch,
  signal?: AbortSignal
): Promise<CountyReadOnlySalesSyncAvailability> {
  const response = await apiFetch('/county-sync/sales', { signal });
  return requireAvailability(await requireOk(response, 'County read-only sync is unavailable.'));
}

export async function runCountyReadOnlySalesSync(
  apiFetch: CountyReadOnlySalesSyncFetch,
  signal?: AbortSignal
): Promise<CountyReadOnlySalesSyncReceipt> {
  const response = await apiFetch('/county-sync/sales/run', { method: 'POST', signal });
  return requireReceipt(await requireOk(response, 'County read-only Sales sync failed.'));
}
