/**
 * PILT Dashboard Page
 *
 * Summary view of Payment In Lieu of Taxes data including
 * totals, entity breakdown, recent payments, and trend chart.
 *
 * Owner Suite: TerraDais
 * @module modules/pilt/pages/Dashboard
 */

import React, { useEffect, useState } from 'react';
import type { PiltPayment, PiltPaymentStatus, PiltSummary } from '../lib/types';
import { fetchPayments, fetchSummary } from '../lib/data';
import { DistributionPieChart } from '../components/DistributionPieChart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<PiltPaymentStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  received: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  allocated: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
  void: 'bg-white/10 text-white/40 border-white/20',
};

function StatusBadge({ status }: { status: PiltPaymentStatus }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PiltDashboard() {
  const [summary, setSummary] = useState<PiltSummary | null>(null);
  const [payments, setPayments] = useState<PiltPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [s, p] = await Promise.all([fetchSummary(), fetchPayments()]);
        if (!cancelled) {
          setSummary(s);
          setPayments(p);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PILT data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ------- Loading / Error states -------

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="animate-pulse font-mono text-xs tracking-widest text-[var(--tf-transcend-cyan)]">
          LOADING PILT DATA...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-8 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  // ------- Derived data -------

  const entityDistribution = summary
    ? Object.entries(summary.byEntityType).map(([entityType, v]) => ({
        entityType,
        amount: v.amount,
      }))
    : [];

  const taxYears = summary
    ? Object.entries(summary.byTaxYear)
        .sort(([a], [b]) => Number(b) - Number(a))
        .slice(0, 5)
    : [];

  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  // ------- Render -------

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-wide">
            PILT Dashboard
          </h1>
          <p className="text-xs text-white/50">
            Payment In Lieu of Taxes -- TerraDais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--tf-transcend-cyan)]" />
          <span className="font-mono text-[10px] text-[var(--tf-transcend-cyan)]">LIVE</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Payments"
          value={String(summary?.totalPayments ?? 0)}
        />
        <SummaryCard
          label="Total Amount"
          value={currencyFmt.format(summary?.totalAmount ?? 0)}
        />
        <SummaryCard
          label="Entity Types"
          value={String(entityDistribution.length)}
          sub="federal, state, tribal, etc."
        />
        <SummaryCard
          label="Tax Years Covered"
          value={String(taxYears.length)}
          sub={
            taxYears.length
              ? `${taxYears[taxYears.length - 1][0]} - ${taxYears[0][0]}`
              : '--'
          }
        />
      </div>

      {/* Distribution Chart + Year Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)]">
          <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Distribution by Entity Type
          </h2>
          <DistributionPieChart data={entityDistribution} />
        </div>

        {/* Payment Trend Placeholder */}
        <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)]">
          <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Payment Trend by Tax Year
          </h2>
          {taxYears.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-white/30">
              No trend data available.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {taxYears.map(([year, { count, amount }]) => (
                <div
                  key={year}
                  className="flex items-center justify-between border-b border-white/5 py-2"
                >
                  <span className="font-mono text-sm text-white/70">{year}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-white/40">{count} payments</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {currencyFmt.format(amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-5 backdrop-blur-[var(--tf-blur-substrate)]">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
          Recent Payments
        </h2>
        {recentPayments.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/30">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-white/40">
                  <th className="py-2 pr-4">Entity</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Parcel</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-2 pr-4 text-white/80">{p.entityName}</td>
                    <td className="py-2 pr-4 capitalize text-white/60">
                      {p.entityType}
                    </td>
                    <td className="py-2 pr-4 font-mono text-white/60">
                      {p.parcelId}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-white">
                      {currencyFmt.format(p.amount)}
                    </td>
                    <td className="py-2 pr-4 font-mono text-white/60">
                      {p.taxYear}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
