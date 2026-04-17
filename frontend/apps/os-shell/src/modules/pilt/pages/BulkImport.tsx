/**
 * PILT Bulk Import Page
 *
 * Upload CSV/Excel files of PILT payment data, preview and validate
 * parsed records, then import in bulk.
 *
 * Owner Suite: TerraDais
 * @module modules/pilt/pages/BulkImport
 */

import React, { useCallback, useRef, useState } from 'react';
import type {
  PiltEntityType,
  PiltImportRow,
  PiltValidationResult,
} from '../lib/types';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_ENTITY_TYPES: PiltEntityType[] = [
  'federal',
  'state',
  'tribal',
  'municipal',
  'other',
];

function validateRow(row: PiltImportRow): PiltValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.entityName?.trim()) errors.push('Entity name is required.');
  if (!VALID_ENTITY_TYPES.includes(row.entityType))
    errors.push(`Invalid entity type "${row.entityType}".`);
  if (!row.parcelId?.trim()) errors.push('Parcel ID is required.');
  if (!row.taxYear || row.taxYear < 1900 || row.taxYear > 2100)
    errors.push('Tax year must be between 1900 and 2100.');
  if (row.amount == null || row.amount <= 0)
    errors.push('Amount must be greater than zero.');
  if (!row.receivedDate) warnings.push('Received date is empty.');

  return {
    rowNumber: row.rowNumber,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// CSV parser (simple, handles quoted fields)
// ---------------------------------------------------------------------------

function parseCsv(text: string): PiltImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Skip header row
  return lines.slice(1).map((line, idx) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return {
      rowNumber: idx + 2, // 1-based, header is row 1
      entityName: cols[0] ?? '',
      entityType: (cols[1]?.toLowerCase() ?? '') as PiltEntityType,
      parcelId: cols[2] ?? '',
      taxYear: Number(cols[3]) || 0,
      amount: Number(cols[4]) || 0,
      receivedDate: cols[5] ?? '',
      notes: cols[6] ?? '',
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ValidationBadge({ result }: { result: PiltValidationResult }) {
  if (result.valid && result.warnings.length === 0) {
    return (
      <span className="inline-block rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        Valid
      </span>
    );
  }
  if (result.valid && result.warnings.length > 0) {
    return (
      <span
        className="inline-block rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400"
        title={result.warnings.join('; ')}
      >
        Warning
      </span>
    );
  }
  return (
    <span
      className="inline-block rounded border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400"
      title={result.errors.join('; ')}
    >
      Invalid
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PiltBulkImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PiltImportRow[]>([]);
  const [validations, setValidations] = useState<PiltValidationResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<string | null>(null);

  // ------- File handling -------

  const handleFile = useCallback((file: File) => {
    setImportResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;
      const parsed = parseCsv(text);
      setRows(parsed);
      setValidations(parsed.map(validateRow));
    };
    reader.readAsText(file);
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ------- Import -------

  const validCount = validations.filter((v) => v.valid).length;

  const handleImport = useCallback(async () => {
    if (validCount === 0) return;

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const validRows = rows.filter((_, i) => validations[i]?.valid);
      const res = await fetch('/api/pilt/payments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || res.statusText);
      }

      setImportProgress(100);
      setImportResult(`Successfully imported ${validCount} payment(s).`);
    } catch (err) {
      setImportResult(
        `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setImporting(false);
    }
  }, [rows, validations, validCount]);

  // ------- Render -------

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-wide">PILT Bulk Import</h1>
        <p className="text-xs text-white/50">
          Upload CSV files with PILT payment data -- TerraDais
        </p>
      </div>

      {/* File Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--tf-radius-panel)] border-2 border-dashed border-white/20 bg-[var(--tf-glass-bg)] px-8 py-12 text-center backdrop-blur-[var(--tf-blur-substrate)] transition-colors hover:border-[var(--tf-transcend-cyan)]/40"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={onFileChange}
        />
        <div className="text-3xl text-white/30">&#8593;</div>
        <p className="text-sm text-white/60">
          Drag and drop a CSV file here, or click to browse
        </p>
        <p className="text-[10px] text-white/30">
          Expected columns: entityName, entityType, parcelId, taxYear, amount,
          receivedDate, notes
        </p>
        {fileName && (
          <p className="mt-2 font-mono text-xs text-[var(--tf-transcend-cyan)]">
            {fileName}
          </p>
        )}
      </div>

      {/* Preview Table */}
      {rows.length > 0 && (
        <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Preview ({rows.length} rows, {validCount} valid)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-white/40">
                  <th className="py-2 pr-3">Row</th>
                  <th className="py-2 pr-3">Entity</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Parcel</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const v = validations[idx];
                  return (
                    <tr
                      key={row.rowNumber}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-2 pr-3 font-mono text-white/40">
                        {row.rowNumber}
                      </td>
                      <td className="py-2 pr-3 text-white/80">{row.entityName}</td>
                      <td className="py-2 pr-3 capitalize text-white/60">
                        {row.entityType}
                      </td>
                      <td className="py-2 pr-3 font-mono text-white/60">
                        {row.parcelId}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-white">
                        {row.amount > 0
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(row.amount)
                          : '--'}
                      </td>
                      <td className="py-2 pr-3 font-mono text-white/60">
                        {row.taxYear || '--'}
                      </td>
                      <td className="py-2">
                        {v && <ValidationBadge result={v} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Controls */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            disabled={importing || validCount === 0}
            className={`rounded-[var(--tf-radius-button)] px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              importing || validCount === 0
                ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
                : 'border border-[var(--tf-transcend-cyan)]/50 bg-[var(--tf-transcend-cyan)]/10 text-[var(--tf-transcend-cyan)] hover:bg-[var(--tf-transcend-cyan)] hover:text-black'
            }`}
          >
            {importing ? 'Importing...' : `Import ${validCount} Valid Row(s)`}
          </button>

          {importing && (
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--tf-transcend-cyan)] transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {importResult && (
            <p
              className={`text-xs ${
                importResult.startsWith('Successfully')
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {importResult}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
