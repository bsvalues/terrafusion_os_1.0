/**
 * IncomeForge - OS Shell TerraForge income evidence readiness desk.
 *
 * This surface intentionally does not produce final income value conclusions.
 * It uses the existing live IncomeForge reference feeds to help staff decide
 * whether a parcel has enough income evidence to support the income approach.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIncomeForgeStore } from './incomeForgeStore';

type IncomeTab = 'desk' | 'cap-rates' | 'market' | 'expenses' | 'locations';
type ReviewerDecision = 'Needs Data' | 'Ready for Review' | 'Chief Review Hold';

interface IncomeCase {
  id: string;
  title: string;
  status: string;
  owner: string;
  propertyType: string;
  reasonOpen: string;
}

interface IncomeWorkflowState {
  selectedCaseId: string;
  decision: ReviewerDecision;
  reasonCode: string;
}

const TABS: { id: IncomeTab; label: string }[] = [
  { id: 'desk', label: 'Review Desk' },
  { id: 'cap-rates', label: 'Cap Rates' },
  { id: 'market', label: 'Market Data' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'locations', label: 'Locations' },
];

const WORKFLOW_STORAGE_KEY = 'terrafusion.incomeForge.caseDesk.workflowState.v1';

const INCOME_CASES: IncomeCase[] = [
  {
    id: 'IF-2026-001',
    title: 'Medical office income support',
    status: 'Evidence hold',
    owner: 'Commercial Appraisal',
    propertyType: 'Office',
    reasonOpen: 'Rent roll and expense support are required before NOI review.',
  },
  {
    id: 'IF-2026-002',
    title: 'Restaurant lease review',
    status: 'Expense review',
    owner: 'Income Review',
    propertyType: 'Retail / Restaurant',
    reasonOpen: 'Expense support must be normalized before chief review.',
  },
  {
    id: 'IF-2026-003',
    title: 'Small industrial vacancy support',
    status: 'Vacancy support',
    owner: 'Assigned Appraiser',
    propertyType: 'Industrial',
    reasonOpen: 'Vacancy and collection loss evidence is incomplete.',
  },
];

const DECISIONS: ReviewerDecision[] = ['Needs Data', 'Ready for Review', 'Chief Review Hold'];
const REASON_CODES = ['Missing rent roll', 'Expense support incomplete', 'Vacancy support missing', 'Cap-rate support only'];
const DEFAULT_WORKFLOW_STATE: IncomeWorkflowState = {
  selectedCaseId: INCOME_CASES[0].id,
  decision: 'Needs Data',
  reasonCode: 'Missing rent roll',
};

const fmtCurrency = (value: number | undefined | null) =>
  value == null || !Number.isFinite(value)
    ? '-'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

const fmtNumber = (value: number | undefined | null, digits = 0) =>
  value == null || !Number.isFinite(value) ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: digits });

const fmtPct = (value: number | undefined | null, digits = 2) =>
  value == null || !Number.isFinite(value) ? '-' : `${value.toFixed(digits)}%`;

function readWorkflowState(): IncomeWorkflowState {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOW_STATE;

  try {
    const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) return DEFAULT_WORKFLOW_STATE;
    const parsed = JSON.parse(raw) as Partial<IncomeWorkflowState>;
    const selectedCaseId = INCOME_CASES.some((incomeCase) => incomeCase.id === parsed.selectedCaseId)
      ? parsed.selectedCaseId
      : DEFAULT_WORKFLOW_STATE.selectedCaseId;
    const decision = DECISIONS.includes(parsed.decision as ReviewerDecision)
      ? (parsed.decision as ReviewerDecision)
      : DEFAULT_WORKFLOW_STATE.decision;
    const reasonCode = parsed.reasonCode && REASON_CODES.includes(parsed.reasonCode)
      ? parsed.reasonCode
      : DEFAULT_WORKFLOW_STATE.reasonCode;

    return { selectedCaseId, decision, reasonCode };
  } catch {
    return DEFAULT_WORKFLOW_STATE;
  }
}

function writeWorkflowState(state: IncomeWorkflowState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local workflow state is convenience persistence only; the readiness block remains authoritative.
  }
}

function StatsRail() {
  const stats = useIncomeForgeStore((s) => s.stats);
  const items = [
    { label: 'Property Types', value: fmtNumber(stats.propertyTypes) },
    { label: 'Locations', value: fmtNumber(stats.locations) },
    { label: 'Market Cap Rate', value: fmtPct(stats.marketCapRate) },
    { label: 'Median Home', value: fmtCurrency(stats.medianHomePrice) },
    { label: 'Median Income', value: fmtCurrency(stats.medianIncome) },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border bg-background/70 px-3 py-2">
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="text-lg font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ children, tone = 'neutral' }: { children: string; tone?: 'neutral' | 'warning' | 'hold' }) {
  const classes =
    tone === 'hold'
      ? 'border-red-400/40 bg-red-950/60 text-red-100'
      : tone === 'warning'
        ? 'border-amber-400/40 bg-amber-950/40 text-amber-100'
        : 'border-slate-500/40 bg-slate-900/80 text-slate-200';

  return <span className={`inline-flex shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${classes}`}>{children}</span>;
}

function ReviewRow({ label, status, owner }: { label: string; status: string; owner: string }) {
  return (
    <div className="rounded-md border border-slate-700/70 bg-slate-950/50 px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 break-words font-medium text-slate-100">{label}</span>
        <span className="shrink-0 text-slate-300">{status}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500">{owner}</div>
    </div>
  );
}

function IncomeCaseButton({
  incomeCase,
  selected,
  onSelect,
}: {
  incomeCase: IncomeCase;
  selected: boolean;
  onSelect: (caseId: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${incomeCase.id} ${incomeCase.title}`}
      className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
        selected
          ? 'border-cyan-400/50 bg-cyan-950/60 text-cyan-100'
          : 'border-slate-700/70 bg-slate-950/50 text-slate-100 hover:bg-slate-900'
      }`}
      onClick={() => onSelect(incomeCase.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 break-words font-semibold">{incomeCase.id}</span>
        <span className="shrink-0 text-xs text-slate-300">{incomeCase.status}</span>
      </div>
      <div className="mt-1 break-words">{incomeCase.title}</div>
      <div className="mt-1 text-xs text-slate-500">{incomeCase.owner}</div>
    </button>
  );
}

function EvidenceChecklist({
  title,
  items,
}: {
  title: string;
  items: { label: string; status: string; blocker?: boolean }[];
}) {
  return (
    <Card className="border-slate-700/70 bg-slate-950/70 text-slate-100">
      <CardHeader className="border-b border-slate-800 pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"
          >
            <span className="min-w-0 break-words text-slate-200">{item.label}</span>
            <StatusPill tone={item.blocker ? 'hold' : 'warning'}>{item.status}</StatusPill>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewDeskTab() {
  const [workflowState, setWorkflowState] = useState<IncomeWorkflowState>(() => readWorkflowState());
  const stats = useIncomeForgeStore((s) => s.stats);
  const referenceSource = useIncomeForgeStore((s) => s.referenceSource);
  const activeCase = INCOME_CASES.find((incomeCase) => incomeCase.id === workflowState.selectedCaseId) ?? INCOME_CASES[0];

  useEffect(() => {
    writeWorkflowState(workflowState);
  }, [workflowState]);

  const readinessBlockers = useMemo(
    () => [
      'Parcel-level rent roll or income statement is not loaded.',
      'Operating expenses have not been normalized against source documents.',
      'Vacancy and collection loss support is not attached.',
      'Cap-rate support is reference-only until property risk is reviewed.',
      'NOI cannot be locked until the evidence set is complete.',
    ],
    []
  );

const updateSelectedCase = (selectedCaseId: string) => {
  setWorkflowState((current) =>
    current.selectedCaseId === selectedCaseId
      ? current
      : {
          ...current,
          selectedCaseId,
          decision: DEFAULT_WORKFLOW_STATE.decision,
          reasonCode: DEFAULT_WORKFLOW_STATE.reasonCode,
        }
  );
};

  const updateDecision = (decision: ReviewerDecision) => {
    setWorkflowState((current) => ({ ...current, decision }));
  };

  const updateReasonCode = (reasonCode: string) => {
    setWorkflowState((current) => ({ ...current, reasonCode }));
  };

  return (
    <div data-testid="income-readiness-desk" className="max-w-full overflow-x-hidden">
      <div
        data-testid="income-workbench-shell"
        className="rounded-lg border border-slate-700/80 bg-slate-950 text-slate-100 shadow-2xl"
      >
        <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Income Evidence Readiness Desk</div>
              <div className="mt-1 text-2xl font-semibold leading-tight text-slate-50">{activeCase.title}</div>
              <div className="mt-1 text-sm text-slate-400">
                Case Desk derived from live IncomeForge reference records and staff evidence state.
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <StatusPill tone="hold">Final value blocked</StatusPill>
              <StatusPill tone="hold">Not income-ready</StatusPill>
              <StatusPill>Local decision state</StatusPill>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-xs text-slate-500">Active case</div>
              <div className="text-sm font-semibold text-slate-100">Active case: {activeCase.id}</div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-xs text-slate-500">Property type</div>
              <div className="text-sm font-semibold text-slate-100">{activeCase.propertyType}</div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-xs text-slate-500">Assigned owner</div>
              <div className="text-sm font-semibold text-slate-100">{activeCase.owner}</div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-xs text-slate-500">Queue status</div>
              <div className="text-sm font-semibold text-slate-100">{activeCase.status}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[280px_minmax(420px,1fr)_340px]">
          <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queue</div>
              <h2 className="mt-1 text-base font-semibold text-slate-100">Work Queue</h2>
            </div>
            <div className="space-y-2 p-3">
              {INCOME_CASES.map((incomeCase) => (
                <IncomeCaseButton
                  key={incomeCase.id}
                  incomeCase={incomeCase}
                  selected={incomeCase.id === activeCase.id}
                  onSelect={updateSelectedCase}
                />
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Income Case</div>
              <h2 className="mt-1 text-base font-semibold text-slate-100">Evidence Binder</h2>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-md border border-red-900/60 bg-red-950/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-red-100">Can this parcel support an income approach?</div>
                    <p className="mt-1 text-sm text-slate-300">
                      Not yet. IncomeForge has live Benton reference support, but parcel income evidence is not complete enough
                      to support direct reliance or a final value conclusion.
                    </p>
                    <p className="mt-2 text-sm text-slate-400">{activeCase.reasonOpen}</p>
                  </div>
                  <StatusPill tone="hold">Not income-ready</StatusPill>
                </div>
              </div>

              <div className="grid gap-2">
                {readinessBlockers.map((blocker) => (
                  <div
                    key={blocker}
                    className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                  >
                    {blocker}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 2xl:grid-cols-2">
                <EvidenceChecklist
                  title="Rent Roll / Income Evidence"
                  items={[
                    { label: 'Current rent roll or income statement', status: 'Missing', blocker: true },
                    { label: 'Lease terms / unit mix / tenant income support', status: 'Missing', blocker: true },
                    { label: 'Other income support', status: 'Needed' },
                  ]}
                />
                <EvidenceChecklist
                  title="Expense Normalization"
                  items={[
                    { label: 'Actual operating expense statement', status: 'Missing', blocker: true },
                    { label: 'Taxes, insurance, utilities, repairs, reserves separated', status: 'Needed' },
                    { label: 'Non-operating or owner-specific costs identified', status: 'Needed' },
                  ]}
                />
                <EvidenceChecklist
                  title="Vacancy / Collection Loss"
                  items={[
                    { label: 'Subject vacancy support', status: 'Missing', blocker: true },
                    { label: 'Collection loss history', status: 'Missing', blocker: true },
                    { label: 'Market vacancy reference', status: stats.marketCapRate > 0 ? 'Reference loaded' : 'Needed' },
                  ]}
                />
                <EvidenceChecklist
                  title="NOI Reconciliation Readiness"
                  items={[
                    { label: 'Rent, vacancy, expenses, and cap-rate support tied to sources', status: 'Blocked', blocker: true },
                    { label: 'NOI worksheet lock/review', status: 'Not available', blocker: true },
                    { label: 'Chief review package', status: 'Not ready', blocker: true },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness Inspector</div>
              <h2 className="mt-1 text-base font-semibold text-slate-100">Decision Inspector</h2>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewer Decision State</div>
                <div className="mt-2 grid gap-2">
                  {DECISIONS.map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      className={`rounded-md border px-3 py-2 text-left text-sm ${
                        workflowState.decision === decision
                          ? 'border-cyan-400/50 bg-cyan-950/70 text-cyan-100'
                          : 'border-slate-700 bg-slate-950/70 text-slate-200 hover:bg-slate-800'
                      }`}
                      onClick={() => updateDecision(decision)}
                    >
                      {decision}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-200">Current decision: {workflowState.decision}</div>
                  <div className="mt-1 text-slate-300">Reason code: {workflowState.reasonCode}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Local workstation state only. Backend persistence belongs in the next evidence-state slice.
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason Code</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REASON_CODES.map((reasonCode) => (
                    <button
                      key={reasonCode}
                      type="button"
                      className={`rounded-md border px-2.5 py-1 text-xs ${
                        workflowState.reasonCode === reasonCode
                          ? 'border-amber-400/50 bg-amber-950/60 text-amber-100'
                          : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                      }`}
                      onClick={() => updateReasonCode(reasonCode)}
                    >
                      {reasonCode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-500">Reference market cap rate</div>
                <div className="text-3xl font-semibold text-slate-100">{fmtPct(stats.marketCapRate)}</div>
                <div className="mt-2 text-slate-400">
                  Reference support only. Final cap-rate selection requires parcel risk, income durability, expense
                  support, and reviewer approval.
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-800 bg-slate-900/60 p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 rounded-md border border-slate-800 bg-slate-950/60">
              <div className="border-b border-slate-800 px-4 py-3">
                <h2 className="text-base font-semibold text-slate-100">Evidence Trail</h2>
              </div>
              <div className="grid gap-2 p-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-100">
                  {activeCase.id} {'->'} {workflowState.decision} {'->'} {workflowState.reasonCode}
                  <div className="mt-1 text-xs text-slate-500">Local reviewer state preserved on this workstation.</div>
                </div>
                <ReviewRow label="Reference income feeds loaded" status={referenceSource ? 'Loaded' : 'Pending'} owner="IncomeForge" />
                <ReviewRow label="Reliance posture set" status="Blocked" owner="Reviewer" />
                <ReviewRow label="Required evidence path" status="Open" owner="Assigned Appraiser" />
              </div>
            </section>

            <section className="min-w-0 rounded-md border border-slate-800 bg-slate-950/60">
              <div className="border-b border-slate-800 px-4 py-3">
                <h2 className="text-base font-semibold text-slate-100">Live Reference Coverage</h2>
              </div>
              <div className="p-3">
                <StatsRail />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? 'text-xl font-semibold' : 'text-base font-medium'}>{value}</div>
    </div>
  );
}

function CapRatesTab() {
  const capRates = useIncomeForgeStore((s) => s.capRates);
  const loading = useIncomeForgeStore((s) => s.capRatesLoading);
  const error = useIncomeForgeStore((s) => s.capRatesError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading cap rates...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3">Property Type</th>
            <th className="py-2 pr-3">Label</th>
            <th className="py-2 pr-3 text-right">Min</th>
            <th className="py-2 pr-3 text-right">Typical</th>
            <th className="py-2 text-right">Max</th>
          </tr>
        </thead>
        <tbody>
          {capRates.map((entry) => (
            <tr key={entry.propertyType} className="border-b last:border-0">
              <td className="py-2 pr-3 font-mono text-xs">{entry.propertyType}</td>
              <td className="py-2 pr-3">{entry.label}</td>
              <td className="py-2 pr-3 text-right">{fmtPct(entry.min)}</td>
              <td className="py-2 pr-3 text-right font-semibold">{fmtPct(entry.typical)}</td>
              <td className="py-2 text-right">{fmtPct(entry.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarketDataTab() {
  const marketData = useIncomeForgeStore((s) => s.marketData);
  const loading = useIncomeForgeStore((s) => s.marketLoading);
  const error = useIncomeForgeStore((s) => s.marketError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading market data...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!marketData) return <div className="text-sm text-muted-foreground">No market data loaded.</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">County Indicators</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <ResultMetric label="Median Household Income" value={fmtCurrency(marketData.medianHouseholdIncome)} />
          <ResultMetric label="Unemployment" value={fmtPct(marketData.unemploymentRate, 1)} />
          <ResultMetric label="Population Growth" value={fmtPct(marketData.populationGrowthRate, 1)} />
          <ResultMetric label="Median Home Price" value={fmtCurrency(marketData.medianHomePrice)} />
          <ResultMetric label="Median Price / Sqft" value={fmtCurrency(marketData.medianPricePerSqft)} />
          <ResultMetric label="Months Inventory" value={fmtNumber(marketData.monthsOfInventory, 1)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Employment Sectors</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {marketData.employmentSectors.map((sector) => (
            <div key={sector.sector} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>{sector.sector}</span>
              <span className="font-semibold">{fmtPct(sector.percentOfTotal, 1)}</span>
            </div>
          ))}
          <div className="pt-2 text-xs text-muted-foreground">Source: {marketData.source}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpensesTab() {
  const ratios = useIncomeForgeStore((s) => s.expenseRatios);
  const categories = useIncomeForgeStore((s) => s.expenseCategories);
  const loading = useIncomeForgeStore((s) => s.expensesLoading);
  const error = useIncomeForgeStore((s) => s.expensesError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading expense ratios...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">Property Type</th>
              <th className="py-2 pr-3">Label</th>
              <th className="py-2 pr-3 text-right">Low</th>
              <th className="py-2 pr-3 text-right">Typical</th>
              <th className="py-2 text-right">High</th>
            </tr>
          </thead>
          <tbody>
            {ratios.map((entry) => (
              <tr key={entry.propertyType} className="border-b last:border-0">
                <td className="py-2 pr-3 font-mono text-xs">{entry.propertyType}</td>
                <td className="py-2 pr-3">{entry.label}</td>
                <td className="py-2 pr-3 text-right">{fmtPct(entry.lowPct, 1)}</td>
                <td className="py-2 pr-3 text-right font-semibold">{fmtPct(entry.typicalPct, 1)}</td>
                <td className="py-2 text-right">{fmtPct(entry.highPct, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Expense Categories</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="outline">{category}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LocationsTab() {
  const premiums = useIncomeForgeStore((s) => s.locationPremiums);
  const loading = useIncomeForgeStore((s) => s.locationsLoading);
  const error = useIncomeForgeStore((s) => s.locationsError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading locations...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {premiums.map((premium) => (
        <Card key={premium.location}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{premium.location}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{premium.multiplier.toFixed(2)}x</div>
            <div className="mt-1 text-sm text-muted-foreground">{premium.note}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export interface IncomeForgeProps {
  metadata?: Record<string, unknown>;
}

export default function IncomeForge(_props: IncomeForgeProps = {}) {
  const [activeTab, setActiveTab] = useState<IncomeTab>('desk');
  const fetchReferenceData = useIncomeForgeStore((s) => s.fetchReferenceData);
  const referenceSource = useIncomeForgeStore((s) => s.referenceSource);
  const countyScope = useIncomeForgeStore((s) => s.countyScope);

  useEffect(() => {
    void fetchReferenceData();
  }, [fetchReferenceData]);

  return (
    <div data-testid="income-forge" className="h-full overflow-auto overflow-x-hidden bg-background p-5 text-foreground">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TerraForge · Income Approach</p>
          <h1 className="text-2xl font-semibold">IncomeForge</h1>
          <p className="text-sm text-muted-foreground">
            Income evidence readiness, case review, and reliance containment for income-producing parcels.
          </p>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          <Badge>Live API</Badge>
          <Badge variant="outline">CostForge income endpoints</Badge>
          <Badge variant="outline">No final value in this slice</Badge>
        </div>
      </header>

      {!countyScope.supported && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-900">Benton-certified data required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            {countyScope.message}
            {countyScope.countyId && <span> Active county: {countyScope.countyId}.</span>}
          </CardContent>
        </Card>
      )}

      {referenceSource && (
        <div className="mb-4 rounded border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Source: {referenceSource}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded border px-3 py-1.5 text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-background hover:bg-muted'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'desk' && <ReviewDeskTab />}
      {activeTab === 'cap-rates' && <CapRatesTab />}
      {activeTab === 'market' && <MarketDataTab />}
      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'locations' && <LocationsTab />}
    </div>
  );
}
