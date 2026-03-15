/**
 * PILT Reports Page
 *
 * Generate, preview, and download PILT reports.
 * Supports annual summary, entity detail, and parcel allocation report types.
 *
 * Owner Suite: TerraDais
 * @module modules/pilt/pages/Reports
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { PiltEntityType } from '../lib/types';
import { ReportGenerator } from '../components/ReportGenerator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPES = [
  { value: 'annual_summary' as const, label: 'Annual Summary' },
  { value: 'entity_detail' as const, label: 'Entity Detail' },
  { value: 'parcel_allocation' as const, label: 'Parcel Allocation' },
];

const ENTITY_OPTIONS: Array<{ value: PiltEntityType | ''; label: string }> = [
  { value: '', label: 'All Entities' },
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'municipal', label: 'Municipal' },
  { value: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--tf-transcend-cyan)]/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--tf-transcend-cyan)]/50"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PiltReports() {
  const [reportType, setReportType] = useState<
    'annual_summary' | 'entity_detail' | 'parcel_allocation'
  >('annual_summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entityFilter, setEntityFilter] = useState<PiltEntityType | ''>('');
  const [generationKey, setGenerationKey] = useState(0);

  const dateRange = useMemo(
    () => ({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const resolvedEntityFilter = entityFilter || null;

  const handleGenerate = useCallback(() => {
    setGenerationKey((k) => k + 1);
  }, []);

  const handleDownload = useCallback(() => {
    // Trigger browser print which captures the report preview area
    window.print();
  }, []);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-wide">PILT Reports</h1>
        <p className="text-xs text-white/50">
          Generate and download Payment In Lieu of Taxes reports -- TerraDais
        </p>
      </div>

      {/* Filter Controls */}
      <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)]">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
          Report Configuration
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="Report Type"
            value={reportType}
            options={REPORT_TYPES}
            onChange={(v) =>
              setReportType(
                v as 'annual_summary' | 'entity_detail' | 'parcel_allocation'
              )
            }
          />
          <DateField label="Start Date" value={startDate} onChange={setStartDate} />
          <DateField label="End Date" value={endDate} onChange={setEndDate} />
          <SelectField
            label="Entity Filter"
            value={entityFilter}
            options={ENTITY_OPTIONS}
            onChange={(v) => setEntityFilter(v as PiltEntityType | '')}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleGenerate}
            className="rounded-[var(--tf-radius-button)] border border-[var(--tf-transcend-cyan)]/50 bg-[var(--tf-transcend-cyan)]/10 px-6 py-2 text-xs font-bold uppercase tracking-wider text-[var(--tf-transcend-cyan)] transition-colors hover:bg-[var(--tf-transcend-cyan)] hover:text-black"
          >
            Generate Report
          </button>
          <button
            onClick={handleDownload}
            className="rounded-[var(--tf-radius-button)] border border-white/20 bg-white/5 px-6 py-2 text-xs font-bold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Download / Print
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)] print:border-none print:bg-white print:text-black">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40 print:text-black/40">
          Report Preview
        </h2>
        <ReportGenerator
          key={generationKey}
          reportType={reportType}
          dateRange={dateRange}
          entityFilter={resolvedEntityFilter}
        />
      </div>
    </div>
  );
}
