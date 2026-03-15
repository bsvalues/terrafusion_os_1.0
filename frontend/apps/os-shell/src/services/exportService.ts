/**
 * TFR-035: CSV / JSON Export Service
 *
 * Generates downloadable CSV or JSON files from in-memory datasets.
 * Supports parcels, assessments, sales, appeals, exemptions, and notices.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportDataset =
  | 'parcels'
  | 'assessments'
  | 'sales'
  | 'appeals'
  | 'exemptions'
  | 'notices';

export interface ExportColumn {
  /** Internal field key (dot-notation supported for nested access). */
  key: string;
  /** Human-readable column header. */
  label: string;
}

export interface ExportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'between';
  value: unknown;
  /** Second value for "between" operator. */
  valueTo?: unknown;
}

export interface ExportOptions {
  dataset: ExportDataset;
  columns: ExportColumn[];
  filters?: ExportFilter[];
  filename?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function escapeCSV(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function applyFilter(row: Record<string, unknown>, filter: ExportFilter): boolean {
  const val = resolveValue(row, filter.field);

  switch (filter.operator) {
    case 'eq':
      return val === filter.value;
    case 'neq':
      return val !== filter.value;
    case 'gt':
      return (val as number) > (filter.value as number);
    case 'gte':
      return (val as number) >= (filter.value as number);
    case 'lt':
      return (val as number) < (filter.value as number);
    case 'lte':
      return (val as number) <= (filter.value as number);
    case 'contains':
      return String(val).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'between':
      return (val as number) >= (filter.value as number) && (val as number) <= (filter.valueTo as number);
    default:
      return true;
  }
}

function applyFilters(data: Record<string, unknown>[], filters?: ExportFilter[]): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return data;
  return data.filter((row) => filters.every((f) => applyFilter(row, f)));
}

function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Export dataset as CSV and trigger a browser download.
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename = 'export.csv',
  filters?: ExportFilter[],
): void {
  const filtered = applyFilters(data, filters);

  const header = columns.map((c) => escapeCSV(c.label)).join(',');
  const rows = filtered.map((row) =>
    columns.map((col) => escapeCSV(resolveValue(row, col.key))).join(','),
  );

  const csv = [header, ...rows].join('\n');
  triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export dataset as JSON and trigger a browser download.
 */
export function exportToJson(
  data: Record<string, unknown>[],
  filename = 'export.json',
  filters?: ExportFilter[],
): void {
  const filtered = applyFilters(data, filters);
  const json = JSON.stringify(filtered, null, 2);
  triggerDownload(json, filename, 'application/json;charset=utf-8;');
}
