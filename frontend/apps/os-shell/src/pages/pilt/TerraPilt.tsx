/**
 * TerraPilt.tsx
 * PILT (Payment in Lieu of Taxes) surface — OS-native module.
 *
 * Canon: CostForge pattern (pages/forge/cost/CostForge.tsx).
 * - Lazy-imported from moduleComponents.tsx under case 'terra-pilt'.
 * - No iframe. No AppFrame. No external Express server. No port.
 * - All data comes from the TerraFusion Kernel (/api/pilt/*), which reads the
 *   TerraFusion DB with county scoping + audit logging.
 *
 * Backend endpoints consumed (see backend/.../Controllers/PiltController.cs):
 *   GET  /pilt/status
 *   GET  /pilt/districts
 *   GET  /pilt/receipts
 *
 * Honest scope:
 * - Read-only dashboard for now: status summary, district table, recent receipts.
 * - Create/calculate/approve flows are NOT wired yet — they will reuse the same
 *   apiFetch pattern once this surface is verified.
 */
import React, { useEffect, useState } from 'react';
import { apiFetchJson } from '@/lib/apiBase';
import { useAuth } from '../../auth/useAuth';
import { buildAuthHeaders } from '../../auth/buildAuthHeaders';

interface PiltStatus {
  status: string;
  fiscalYear: number;
  totalAssessedValue: number;
  totalPiltDue: number;
  totalPayments: number;
  districts: number;
  federalAcres: number;
  averageRate: number;
  calculationMethod: string;
  hanfordSiteAcres: number;
}

interface PiltDistrict {
  id: string;
  name: string;
  type: string;
  assessedValue: number;
  levyRatePer1000: number;
  piltDue: number;
}

interface PiltDistrictsResponse {
  count: number;
  totalAssessedValue: number;
  totalPiltDue: number;
  districts: PiltDistrict[];
}

interface PiltReceipt {
  id: string;
  fiscalYear: number;
  source: string;
  amount: number;
  status: string;
}

interface PiltReceiptsResponse {
  count: number;
  receipts: PiltReceipt[];
}

interface CreateReceiptResponse {
  receiptId: string;
  fiscalYear: number;
  source: string;
  amount: number;
}

interface CalculationDistribution {
  districtId: string;
  districtName: string;
  assessedValue: number;
  levyRate: number;
  amount: number;
}

interface CalculationResult {
  calculationId: string;
  receiptId: string;
  fiscalYear: number;
  totalAmount: number;
  distributions: CalculationDistribution[];
  method: string;
  status: string;
}

interface ApprovalResponse {
  calculationId: string;
  status: string;
  approvedBy: string;
  approvedAt: string;
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function fmtNumber(n: number | null | undefined, dec = 0): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export default function TerraPilt() {
  const auth = useAuth();
  const [status, setStatus] = useState<PiltStatus | null>(null);
  const [districts, setDistricts] = useState<PiltDistrictsResponse | null>(null);
  const [receipts, setReceipts] = useState<PiltReceiptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Write-flow state
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastCalc, setLastCalc] = useState<CalculationResult | null>(null);
  const [form, setForm] = useState({
    fiscalYear: new Date().getFullYear(),
    source: '',
    amount: '',
  });

  useEffect(() => {
    // Wait for auth to be ready before calling [Authorize] endpoints.
    if (!auth.token) return;
    const ctrl = new AbortController();
    const headers = buildAuthHeaders(auth);
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, d, r] = await Promise.all([
          apiFetchJson<PiltStatus>('/pilt/status', { signal: ctrl.signal, headers }),
          apiFetchJson<PiltDistrictsResponse>('/pilt/districts', { signal: ctrl.signal, headers }),
          apiFetchJson<PiltReceiptsResponse>('/pilt/receipts', { signal: ctrl.signal, headers }),
        ]);
        setStatus(s);
        setDistricts(d);
        setReceipts(r);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [auth.token, auth.countyId, auth.userId, reloadTick]);

  async function handleCreateReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.token) return;
    const amountNum = Number(form.amount);
    if (!form.source.trim() || !Number.isFinite(amountNum) || amountNum <= 0) {
      setActionError('Enter a source and positive amount.');
      return;
    }
    setBusyAction('create');
    setActionError(null);
    setActionNotice(null);
    try {
      const created = await apiFetchJson<CreateReceiptResponse>('/pilt/receipts', {
        method: 'POST',
        headers: { ...buildAuthHeaders(auth), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYear: form.fiscalYear,
          source: form.source,
          amount: amountNum,
        }),
      });
      setActionNotice(`Receipt created: ${created.receiptId}`);
      setForm({ ...form, source: '', amount: '' });
      setReloadTick((t) => t + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCalculate(receiptId: string) {
    if (!auth.token) return;
    setBusyAction(`calc:${receiptId}`);
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await apiFetchJson<CalculationResult>(
        `/pilt/calculate/${encodeURIComponent(receiptId)}`,
        {
          method: 'POST',
          headers: { ...buildAuthHeaders(auth), 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptId }),
        },
      );
      setLastCalc(result);
      setActionNotice(
        `Calculated ${result.calculationId} — ${result.distributions.length} distributions, total ${fmtCurrency(result.totalAmount)}`,
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleApprove(calculationId: string) {
    if (!auth.token) return;
    setBusyAction(`approve:${calculationId}`);
    setActionError(null);
    setActionNotice(null);
    try {
      const approved = await apiFetchJson<ApprovalResponse>(
        `/pilt/approve/${encodeURIComponent(calculationId)}`,
        {
          method: 'POST',
          headers: buildAuthHeaders(auth),
        },
      );
      setActionNotice(
        `Approved ${approved.calculationId} by ${approved.approvedBy} at ${approved.approvedAt}`,
      );
      setLastCalc((prev) => (prev ? { ...prev, status: approved.status } : prev));
      setReloadTick((t) => t + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-slate-950 p-6 text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-50">TerraPILT</h1>
        <p className="mt-1 text-sm text-slate-400">
          Payment in Lieu of Taxes — federal property (Hanford site) calculations,
          district distribution, and receipts. Data sourced from TerraFusion Kernel.
        </p>
      </header>

      {loading && (
        <div className="rounded border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Loading PILT data from Kernel…
        </div>
      )}

      {error && !loading && (
        <div className="rounded border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-300">
          Failed to load PILT data: {error}
        </div>
      )}

      {actionError && (
        <div className="mb-3 rounded border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300">
          {actionError}
        </div>
      )}
      {actionNotice && (
        <div className="mb-3 rounded border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">
          {actionNotice}
        </div>
      )}

      {!loading && !error && status && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Fiscal Year" value={String(status.fiscalYear)} />
            <MetricCard label="Total PILT Due" value={fmtCurrency(status.totalPiltDue)} />
            <MetricCard label="Total Payments" value={fmtCurrency(status.totalPayments)} />
            <MetricCard label="Federal Acres" value={fmtNumber(status.federalAcres)} />
            <MetricCard label="Total Assessed Value" value={fmtCurrency(status.totalAssessedValue)} />
            <MetricCard label="Districts" value={String(status.districts)} />
            <MetricCard label="Average Levy Rate" value={fmtNumber(status.averageRate, 4)} />
            <MetricCard label="Hanford Acres" value={fmtNumber(status.hanfordSiteAcres)} />
          </section>

          {districts && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Levy Districts ({districts.count})
              </h2>
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">District</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Assessed Value</th>
                      <th className="px-3 py-2 text-right font-medium">Rate / $1k</th>
                      <th className="px-3 py-2 text-right font-medium">PILT Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.districts.map((d) => (
                      <tr key={d.id} className="border-t border-slate-800">
                        <td className="px-3 py-2 text-slate-200">{d.name}</td>
                        <td className="px-3 py-2 text-slate-400">{d.type}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtCurrency(d.assessedValue)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNumber(d.levyRatePer1000, 4)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-100">
                          {fmtCurrency(d.piltDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {receipts && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Receipts ({receipts.count})
              </h2>

              <form
                onSubmit={handleCreateReceipt}
                className="mb-3 grid grid-cols-1 gap-2 rounded border border-slate-800 bg-slate-900/50 p-3 md:grid-cols-[auto_1fr_auto_auto]"
              >
                <input
                  type="number"
                  aria-label="Fiscal year"
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                  value={form.fiscalYear}
                  onChange={(e) =>
                    setForm({ ...form, fiscalYear: Number(e.target.value) || form.fiscalYear })
                  }
                  min={1900}
                  max={2100}
                />
                <input
                  type="text"
                  aria-label="Source"
                  placeholder="Source (e.g. Federal PILT Base Disbursement)"
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
                <input
                  type="number"
                  aria-label="Amount"
                  placeholder="Amount"
                  className="w-32 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-sm text-slate-100"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min={0}
                  step="0.01"
                />
                <button
                  type="submit"
                  disabled={busyAction === 'create'}
                  className="rounded bg-sky-700 px-3 py-1 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                >
                  {busyAction === 'create' ? 'Creating…' : 'Create Receipt'}
                </button>
              </form>

              {receipts.receipts.length === 0 ? (
                <p className="text-sm text-slate-500">No receipts recorded.</p>
              ) : (
                <div className="overflow-x-auto rounded border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">FY</th>
                        <th className="px-3 py-2 text-left font-medium">Source</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.receipts.map((r) => (
                        <tr key={r.id} className="border-t border-slate-800">
                          <td className="px-3 py-2 tabular-nums">{r.fiscalYear}</td>
                          <td className="px-3 py-2 text-slate-200">{r.source}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {fmtCurrency(r.amount)}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{r.status}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleCalculate(r.id)}
                              disabled={busyAction === `calc:${r.id}`}
                              className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                            >
                              {busyAction === `calc:${r.id}` ? 'Calculating…' : 'Calculate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {lastCalc && (
                <div className="mt-4 rounded border border-slate-800 bg-slate-900/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm text-slate-300">
                      <span className="font-semibold">Calculation</span>{' '}
                      <span className="text-slate-500">{lastCalc.calculationId}</span>{' '}
                      <span className="text-slate-500">— receipt {lastCalc.receiptId}</span>{' '}
                      <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        {lastCalc.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApprove(lastCalc.calculationId)}
                      disabled={
                        busyAction === `approve:${lastCalc.calculationId}` ||
                        lastCalc.status === 'approved'
                      }
                      className="rounded bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {busyAction === `approve:${lastCalc.calculationId}`
                        ? 'Approving…'
                        : lastCalc.status === 'approved'
                          ? 'Approved'
                          : 'Approve'}
                    </button>
                  </div>
                  <div className="text-xs text-slate-400">
                    Method: {lastCalc.method} · Total: {fmtCurrency(lastCalc.totalAmount)} ·
                    Distributions: {lastCalc.distributions.length}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/50 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}
