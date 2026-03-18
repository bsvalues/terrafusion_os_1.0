/**
 * TFR-106: Export Center
 *
 * UI for selecting datasets, choosing CSV/JSON format,
 * picking columns, applying filters, and triggering a browser download.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  exportToCsv,
  exportToJson,
  type ExportColumn,
  type ExportDataset,
  type ExportFilter,
} from '../../services/exportService';

// ---------------------------------------------------------------------------
// Dataset column definitions
// ---------------------------------------------------------------------------

const DATASET_COLUMNS: Record<ExportDataset, ExportColumn[]> = {
  parcels: [
    { key: 'parcelNumber', label: 'Parcel Number' },
    { key: 'ownerName', label: 'Owner Name' },
    { key: 'situs', label: 'Situs Address' },
    { key: 'propertyClass', label: 'Property Class' },
    { key: 'landArea', label: 'Land Area' },
    { key: 'assessedValue', label: 'Assessed Value' },
    { key: 'taxableValue', label: 'Taxable Value' },
    { key: 'neighborhood', label: 'Neighborhood' },
  ],
  assessments: [
    { key: 'parcelNumber', label: 'Parcel Number' },
    { key: 'assessmentYear', label: 'Year' },
    { key: 'landValue', label: 'Land Value' },
    { key: 'improvementValue', label: 'Improvement Value' },
    { key: 'totalValue', label: 'Total Value' },
    { key: 'method', label: 'Method' },
  ],
  sales: [
    { key: 'parcelNumber', label: 'Parcel Number' },
    { key: 'saleDate', label: 'Sale Date' },
    { key: 'salePrice', label: 'Sale Price' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'seller', label: 'Seller' },
    { key: 'qualified', label: 'Qualified' },
  ],
  appeals: [
    { key: 'parcelNumber', label: 'Parcel Number' },
    { key: 'filedDate', label: 'Filed Date' },
    { key: 'status', label: 'Status' },
    { key: 'requestedValue', label: 'Requested Value' },
    { key: 'determinedValue', label: 'Determined Value' },
  ],
  exemptions: [
    { key: 'parcelNumber', label: 'Parcel Number' },
    { key: 'exemptionType', label: 'Type' },
    { key: 'effectiveDate', label: 'Effective Date' },
    { key: 'expirationDate', label: 'Expiration Date' },
    { key: 'amount', label: 'Amount' },
  ],
  notices: [
    { key: 'parcelNumber', label: 'Parcel Number' },
    { key: 'noticeType', label: 'Type' },
    { key: 'sentDate', label: 'Sent Date' },
    { key: 'status', label: 'Status' },
  ],
};

const DATASETS: ExportDataset[] = ['parcels', 'assessments', 'sales', 'appeals', 'exemptions', 'notices'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExportCenter() {
  const [dataset, setDataset] = useState<ExportDataset>('parcels');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(DATASET_COLUMNS.parcels.map((c) => c.key)),
  );

  // Filters
  const [filterField, setFilterField] = useState('');
  const [filterOperator, setFilterOperator] = useState<ExportFilter['operator']>('eq');
  const [filterValue, setFilterValue] = useState('');
  const [filters, setFilters] = useState<ExportFilter[]>([]);

  const columns = useMemo(() => DATASET_COLUMNS[dataset], [dataset]);

  // Reset column selection when dataset changes
  const handleDatasetChange = useCallback(
    (ds: ExportDataset) => {
      setDataset(ds);
      setSelectedColumns(new Set(DATASET_COLUMNS[ds].map((c) => c.key)));
      setFilters([]);
    },
    [],
  );

  const toggleColumn = useCallback((key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedColumns(new Set(columns.map((c) => c.key)));
  }, [columns]);

  const selectNone = useCallback(() => {
    setSelectedColumns(new Set());
  }, []);

  const addFilter = useCallback(() => {
    if (!filterField) return;
    setFilters((prev) => [...prev, { field: filterField, operator: filterOperator, value: filterValue }]);
    setFilterValue('');
  }, [filterField, filterOperator, filterValue]);

  const removeFilter = useCallback((idx: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleExport = useCallback(() => {
    // In production, data would come from an API call.
    // This is the UI shell — the export service handles download mechanics.
    const activeColumns = columns.filter((c) => selectedColumns.has(c.key));
    const filename = `${dataset}_export_${new Date().toISOString().slice(0, 10)}`;

    // Placeholder empty data — callers wire this to their data source.
    const data: Record<string, unknown>[] = [];

    if (format === 'csv') {
      exportToCsv(data, activeColumns, `${filename}.csv`, filters);
    } else {
      exportToJson(data, `${filename}.json`, filters);
    }
  }, [columns, dataset, filters, format, selectedColumns]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Center</h1>
        <p className="mt-1 text-sm text-white/60">
          Select a dataset, choose columns, apply filters, and download.
        </p>
      </div>

      {/* Dataset selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-white/50">Dataset</label>
        <div className="flex flex-wrap gap-2">
          {DATASETS.map((ds) => (
            <button
              key={ds}
              onClick={() => handleDatasetChange(ds)}
              className={`rounded-md px-4 py-2 text-sm capitalize ${
                ds === dataset
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {ds}
            </button>
          ))}
        </div>
      </div>

      {/* Format toggle */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-white/50">Format</label>
        <div className="flex gap-2">
          {(['csv', 'json'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`rounded-md px-4 py-2 text-sm uppercase ${
                f === format
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Column picker */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <label className="text-xs uppercase tracking-wider text-white/50">Columns</label>
          <button onClick={selectAll} className="text-xs text-blue-400 hover:underline">
            Select All
          </button>
          <button onClick={selectNone} className="text-xs text-blue-400 hover:underline">
            Select None
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <label
              key={col.key}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                selectedColumns.has(col.key)
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedColumns.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="sr-only"
              />
              {col.label}
            </label>
          ))}
        </div>
      </div>

      {/* Filter builder */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-white/50">Filters</label>
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="">Field...</option>
            {columns.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterOperator}
            onChange={(e) => setFilterOperator(e.target.value as ExportFilter['operator'])}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="eq">=</option>
            <option value="neq">!=</option>
            <option value="gt">&gt;</option>
            <option value="gte">&gt;=</option>
            <option value="lt">&lt;</option>
            <option value="lte">&lt;=</option>
            <option value="contains">contains</option>
          </select>
          <input
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Value"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <button
            onClick={addFilter}
            className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Add Filter
          </button>
        </div>

        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                {f.field} {f.operator} {String(f.value)}
                <button
                  onClick={() => removeFilter(i)}
                  className="ml-1 text-red-400 hover:text-red-300"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={selectedColumns.size === 0}
        className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Export {format.toUpperCase()}
      </button>
    </div>
  );
}
