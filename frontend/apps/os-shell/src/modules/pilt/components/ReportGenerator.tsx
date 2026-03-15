/**
 * PILT Report Generator
 *
 * Client-side report generation and preview for PILT data.
 *
 * Owner Suite: TerraDais
 * @module modules/pilt/components/ReportGenerator
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { PiltEntityType, PiltPayment } from '../lib/types';
import { fetchPayments } from '../lib/data';

export interface ReportGeneratorProps {
  reportType: 'annual_summary' | 'entity_detail' | 'parcel_allocation';
  dateRange: { start: string; end: string };
  entityFilter: PiltEntityType | null;
}

interface ReportRow {
  label: string;
  count: number;
  total: number;
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function buildReport(
  payments: PiltPayment[],
  reportType: ReportGeneratorProps['reportType']
): ReportRow[] {
  const grouped = new Map<string, { count: number; total: number }>();

  for (const p of payments) {
    let key: string;
    switch (reportType) {
      case 'annual_summary':
        key = String(p.taxYear);
        break;
      case 'entity_detail':
        key = p.entityName;
        break;
      case 'parcel_allocation':
        key = p.parcelId;
        break;
    }
    const existing = grouped.get(key) ?? { count: 0, total: 0 };
    existing.count += 1;
    existing.total += p.amount;
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .map(([label, { count, total }]) => ({ label, count, total }))
    .sort((a, b) => b.total - a.total);
}

export function ReportGenerator({
  reportType,
  dateRange,
  entityFilter,
}: ReportGeneratorProps) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let payments = await fetchPayments();

      // Apply date range filter
      if (dateRange.start) {
        payments = payments.filter(
          (p) => (p.receivedDate ?? p.createdAt) >= dateRange.start
        );
      }
      if (dateRange.end) {
        payments = payments.filter(
          (p) => (p.receivedDate ?? p.createdAt) <= dateRange.end
        );
      }

      // Apply entity filter
      if (entityFilter) {
        payments = payments.filter((p) => p.entityType === entityFilter);
      }

      setRows(buildReport(payments, reportType));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, entityFilter]);

  useEffect(() => {
    void generate();
  }, [generate]);

  const reportTitle: Record<string, string> = {
    annual_summary: 'Annual PILT Summary',
    entity_detail: 'Entity Detail Report',
    parcel_allocation: 'Parcel Allocation Report',
  };

  const columnLabel: Record<string, string> = {
    annual_summary: 'Tax Year',
    entity_detail: 'Entity',
    parcel_allocation: 'Parcel ID',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-white/50">
        <span className="animate-pulse font-mono text-xs tracking-widest text-[var(--tf-transcend-cyan)]">
          GENERATING REPORT...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--tf-transcend-cyan)]">
          {reportTitle[reportType]}
        </h3>
        <span className="text-xs text-white/40 font-mono">
          {dateRange.start || '--'} to {dateRange.end || '--'}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">
          No records match the selected filters.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/50">
              <th className="py-2 pr-4">{columnLabel[reportType]}</th>
              <th className="py-2 pr-4 text-right">Payments</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 pr-4 text-white/80">{row.label}</td>
                <td className="py-2 pr-4 text-right font-mono text-white/60">
                  {row.count}
                </td>
                <td className="py-2 text-right font-mono text-white">
                  {currencyFmt.format(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20 font-bold">
              <td className="py-2 pr-4 text-white/60">Total</td>
              <td className="py-2 pr-4 text-right font-mono text-white/60">
                {rows.reduce((s, r) => s + r.count, 0)}
              </td>
              <td className="py-2 text-right font-mono text-[var(--tf-transcend-cyan)]">
                {currencyFmt.format(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
