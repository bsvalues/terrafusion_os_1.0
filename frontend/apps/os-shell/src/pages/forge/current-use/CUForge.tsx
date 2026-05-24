/**
 * CUForge — Current Use Program Module (RCW 84.33 / 84.34)
 * Full standalone OS window. Four tabs, live program stats, county-wide enrollment management.
 *
 * Architecture: Zustand workspace store + apiFetchJson (same as CostForge).
 * Data: TerraFusion CurrentUse API — classifications, rollback, interest, removals.
 *
 * Tabs:
 *   1. Classifications — DFL/CUFA/CUOS/CUTL enrollment registry
 *   2. Rollback — RCW 84.34.108 penalty calculator
 *   3. Interest — DOR-published interest rate table
 *   4. Removals — Removal proceedings & penalty exceptions
 */
import { useEffect, useRef, useState } from 'react';
import './CUForge.css';
import {
  useCUForgeWorkspaceStore,
  type CUForgeTab,
  type Classification,
  type InterestRate,
  type Removal,
  type RollbackYear,
} from './cuForgeWorkspaceStore';

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { id: CUForgeTab; label: string; title: string }[] = [
  { id: 'classifications', label: 'Classifications', title: 'DFL/CUFA/CUOS/CUTL enrollment registry — county-wide' },
  { id: 'rollback',        label: 'Rollback',        title: 'RCW 84.34.108 rollback penalty calculator' },
  { id: 'interest',        label: 'Interest',        title: 'DOR-published interest rates by year' },
  { id: 'removals',        label: 'Removals',        title: 'Removal proceedings & penalty exceptions' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtFull = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const programBadge = (code: string) => {
  const cls = code === 'DFL' ? 'forge-chip--success' :
              code === 'CUFA' ? 'forge-chip--info' :
              code === 'CUOS' ? 'forge-chip--accent' :
              code === 'CUTL' ? 'forge-chip--warn' : 'forge-chip--neutral';
  return <span className={`forge-chip ${cls}`}>{code}</span>;
};

// ── Main Component ───────────────────────────────────────────────────────────

export interface CUForgeProps {
  metadata?: Record<string, unknown>;
}

export default function CUForge({ metadata: _metadata }: CUForgeProps = {}) {
  const store = useCUForgeWorkspaceStore();
  const abortRef = useRef<AbortController>(new AbortController());

  // Fetch stats + initial tab data on mount
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    void store.fetchStats(ctrl.signal);
    void store.fetchClassifications(1, ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    switch (store.activeTab) {
      case 'classifications':
        void store.fetchClassifications(1, ctrl.signal);
        break;
      case 'interest':
        void store.fetchInterestRates(ctrl.signal);
        break;
      case 'removals':
        void store.fetchRemovals(ctrl.signal);
        break;
    }
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.activeTab]);

  return (
    <div className="cu-workspace tf-page">
      {/* Header */}
      <header className="cu-header">
        <div className="cu-header__row">
          <div>
            <p className="cu-header__eyebrow">TerraForge · Current Use Program</p>
            <h1 className="cu-header__title">CUForge</h1>
          </div>
          <div className="cu-header__badges">
            <span className="forge-chip forge-chip--neutral">{store.taxYear} tax year</span>
            <span className="forge-chip forge-chip--success">RCW 84.33 / 84.34</span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="cu-tabbar" aria-label="CUForge sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={store.activeTab === tab.id}
            className={`cu-tab ${store.activeTab === tab.id ? 'cu-tab--active' : ''}`}
            onClick={() => store.setActiveTab(tab.id)}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main layout: content + stats rail */}
      <div className="cu-layout">
        <main className="cu-main tf-section">
          {store.activeTab === 'classifications' && <ClassificationsPanel />}
          {store.activeTab === 'rollback'        && <RollbackPanel />}
          {store.activeTab === 'interest'        && <InterestPanel />}
          {store.activeTab === 'removals'        && <RemovalsPanel />}
        </main>
        <StatsRail />
      </div>
    </div>
  );
}

// ── Stats Rail ───────────────────────────────────────────────────────────────

function StatsRail() {
  const { stats, statsLoading, statsError } = useCUForgeWorkspaceStore();

  if (statsLoading) return (
    <aside className="cu-stats-rail">
      <div className="cu-stat-card"><p className="cu-stat-card__label">Loading…</p></div>
    </aside>
  );

  if (statsError) return (
    <aside className="cu-stats-rail">
      <div className="cu-stat-card cu-stat-card--error"><p className="cu-stat-card__label">{statsError}</p></div>
    </aside>
  );

  if (!stats) return (
    <aside className="cu-stats-rail">
      <div className="cu-stat-card"><p className="cu-stat-card__label">No data</p></div>
    </aside>
  );

  const items = [
    { label: 'Total Enrolled', value: stats.totalEnrolled.toLocaleString() },
    { label: 'DFL Parcels', value: stats.dflCount.toLocaleString() },
    { label: 'CUFA Parcels', value: stats.cufaCount.toLocaleString() },
    { label: 'CUOS Parcels', value: stats.cuosCount.toLocaleString() },
    { label: 'CUTL Parcels', value: stats.cutlCount.toLocaleString() },
    { label: 'Tax Benefit (County)', value: `$${(stats.totalTaxBenefit / 1_000_000).toFixed(1)}M`, cls: 'cu-stat-card__value--success' },
    { label: 'Pending Removals', value: stats.pendingRemovals.toLocaleString(), cls: 'cu-stat-card__value--warn' },
    { label: 'Current Interest Rate', value: `${stats.currentInterestRate.toFixed(1)}%` },
  ];

  return (
    <aside className="cu-stats-rail">
      {items.map((item) => (
        <div key={item.label} className="cu-stat-card">
          <p className="cu-stat-card__label">{item.label}</p>
          <p className={`cu-stat-card__value ${item.cls || ''}`}>{item.value}</p>
        </div>
      ))}
    </aside>
  );
}

// ── Classifications Panel ────────────────────────────────────────────────────

function ClassificationsPanel() {
  const { classifications, classificationsTotal, classificationsLoading, classificationsError } = useCUForgeWorkspaceStore();

  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.33 / 84.34</strong> — Current Use Program enrollment. Parcels classified under
        Designated Forest Land (DFL), Current Use Farm &amp; Agriculture (CUFA), Open Space (CUOS),
        or Classified Timber Land (CUTL) receive reduced assessed values.
      </div>

      {classificationsLoading && <div className="cu-loading">Loading classifications…</div>}
      {classificationsError && <div className="cu-error">{classificationsError}</div>}

      {!classificationsLoading && classifications.length > 0 && (
        <table className="cu-table tf-table">
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Program</th>
              <th>Description</th>
              <th>Acres</th>
              <th>Enrolled</th>
              <th>CU Value</th>
              <th>Market Value</th>
              <th>Tax Savings</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {classifications.map((c: Classification) => (
              <tr key={c.id}>
                <td className="cu-cell--mono">{c.parcelId}</td>
                <td>{programBadge(c.classificationCode)}</td>
                <td>{c.description}</td>
                <td className="cu-cell--num">{(c.acreage ?? 0).toFixed(1)}</td>
                <td>{c.enrollmentDate}</td>
                <td className="cu-cell--num">{fmt(c.currentUseValue ?? 0)}</td>
                <td className="cu-cell--num">{fmt(c.currentMarketValue ?? 0)}</td>
                <td className="cu-cell--num cu-cell--positive">{fmt(c.taxSavings ?? 0)}</td>
                <td>
                  <span className={`forge-chip ${c.status === 'Active' ? 'forge-chip--success' : 'forge-chip--neutral'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!classificationsLoading && classifications.length === 0 && !classificationsError && (
        <div className="cu-empty">No classifications found.</div>
      )}

      <div className="cu-table-footer">
        <span>{classificationsTotal} total enrollment{classificationsTotal !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// ── Rollback Panel ───────────────────────────────────────────────────────────

function RollbackPanel() {
  const { rollbackResult, rollbackLoading, rollbackError, calculateRollback } = useCUForgeWorkspaceStore();
  const [parcelId, setParcelId] = useState('1-0234-100-0001');
  const [classificationCode, setClassificationCode] = useState('DFL');
  const [enrollmentYear, setEnrollmentYear] = useState(2015);
  const [removalYear, setRemovalYear] = useState(2026);

  // Generate sample market/CU values for the lookback window
  const handleCalculate = () => {
    const startYear = Math.max(enrollmentYear, removalYear - 6);
    const marketValues: Record<string, number> = {};
    const currentUseValues: Record<string, number> = {};
    for (let y = startYear; y <= removalYear; y++) {
      marketValues[y.toString()] = 450000 + (y - startYear) * 25000;
      currentUseValues[y.toString()] = 52000 + (y - startYear) * 2000;
    }
    void calculateRollback(parcelId, classificationCode, enrollmentYear, removalYear, marketValues, currentUseValues);
  };

  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.34.108</strong> — When land is removed from current use classification,
        additional tax (rollback) is imposed for each year of classification, plus interest.
        The rollback period is limited to 7 years.
      </div>

      <div className="cu-form-row">
        <div className="cu-form-group">
          <label className="cu-label">Parcel ID</label>
          <input className="cu-input" value={parcelId} onChange={(e) => setParcelId(e.target.value)} />
        </div>
        <div className="cu-form-group">
          <label className="cu-label">Program</label>
          <select className="cu-input" value={classificationCode} onChange={(e) => setClassificationCode(e.target.value)}>
            <option value="DFL">DFL</option>
            <option value="CUFA">CUFA</option>
            <option value="CUOS">CUOS</option>
            <option value="CUTL">CUTL</option>
          </select>
        </div>
        <div className="cu-form-group">
          <label className="cu-label">Enrollment Year</label>
          <input className="cu-input" type="number" value={enrollmentYear} onChange={(e) => setEnrollmentYear(+e.target.value)} />
        </div>
        <div className="cu-form-group">
          <label className="cu-label">Removal Year</label>
          <input className="cu-input" type="number" value={removalYear} onChange={(e) => setRemovalYear(+e.target.value)} />
        </div>
        <button className="cu-btn cu-btn--primary" onClick={handleCalculate} disabled={rollbackLoading}>
          {rollbackLoading ? 'Calculating…' : 'Calculate Rollback'}
        </button>
      </div>

      {rollbackError && <div className="cu-error">{rollbackError}</div>}

      {rollbackResult && (
        <>
          <h3 className="cu-section-title">Rollback Calculation — Parcel {parcelId}</h3>
          <table className="cu-table tf-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Market Value</th>
                <th>CU Value</th>
                <th>Difference</th>
                <th>Rate</th>
                <th>Interest</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rollbackResult.yearBreakdowns.map((y: RollbackYear) => (
                <tr key={y.year}>
                  <td>{y.year}</td>
                  <td className="cu-cell--num">{fmt(y.marketValue)}</td>
                  <td className="cu-cell--num">{fmt(y.currentUseValue)}</td>
                  <td className="cu-cell--num">{fmt(y.difference)}</td>
                  <td className="cu-cell--num">{(y.interestRate * 100).toFixed(2)}%</td>
                  <td className="cu-cell--num">{fmtFull(y.interestAmount)}</td>
                  <td className="cu-cell--num">{fmtFull(y.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ fontWeight: 700 }}>Totals</td>
                <td></td>
                <td className="cu-cell--num" style={{ fontWeight: 700 }}>{fmtFull(rollbackResult.totalInterest)}</td>
                <td className="cu-cell--num" style={{ fontWeight: 700 }}>{fmtFull(rollbackResult.totalRollbackTax + rollbackResult.totalInterest)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ fontWeight: 700 }}>20% Penalty</td>
                <td colSpan={2} className="cu-cell--num" style={{ fontWeight: 700, color: 'var(--cu-danger)' }}>
                  {fmtFull(rollbackResult.totalPenalty)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} style={{ fontWeight: 700, fontSize: '1.1em' }}>Grand Total</td>
                <td colSpan={2} className="cu-cell--num" style={{ fontWeight: 700, fontSize: '1.1em', color: 'var(--cu-danger)' }}>
                  {fmtFull(rollbackResult.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </div>
  );
}

// ── Interest Panel ───────────────────────────────────────────────────────────

function InterestPanel() {
  const { interestRates, interestRatesLoading, interestRatesError } = useCUForgeWorkspaceStore();

  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.34.080</strong> — Interest rates are published annually by the Washington
        Department of Revenue (DOR). These rates apply to rollback tax calculations for
        current use program removals.
      </div>

      {interestRatesLoading && <div className="cu-loading">Loading interest rates…</div>}
      {interestRatesError && <div className="cu-error">{interestRatesError}</div>}

      {!interestRatesLoading && interestRates.length > 0 && (
        <>
          {/* Bar chart visualization */}
          <div className="cu-chart">
            {interestRates.map((r: InterestRate) => (
              <div key={r.year} className="cu-chart-bar-group">
                <div className="cu-chart-bar" style={{ height: `${(r.rate * 100 / 8) * 100}%` }}>
                  <span className="cu-chart-bar__label">{(r.rate * 100).toFixed(1)}%</span>
                </div>
                <span className="cu-chart-bar__year">{r.year}</span>
              </div>
            ))}
          </div>

          <h3 className="cu-section-title">DOR Published Interest Rates</h3>
          <table className="cu-table tf-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Rate</th>
                <th>Source</th>
                <th>Effective Date</th>
              </tr>
            </thead>
            <tbody>
              {interestRates.map((r: InterestRate) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td className="cu-cell--num">{(r.rate * 100).toFixed(2)}%</td>
                  <td>{r.source}</td>
                  <td>{r.effectiveDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ── Removals Panel ───────────────────────────────────────────────────────────

function RemovalsPanel() {
  const { removals, removalsLoading, removalsError } = useCUForgeWorkspaceStore();

  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.34.108(6)</strong> — Removal proceedings track parcels exiting current use
        classification. Penalty exceptions may apply for involuntary destruction, government
        acquisition, or transfer to qualifying family members.
      </div>

      {removalsLoading && <div className="cu-loading">Loading removals…</div>}
      {removalsError && <div className="cu-error">{removalsError}</div>}

      {!removalsLoading && removals.length > 0 && (
        <>
          <h3 className="cu-section-title">Active Removal Proceedings</h3>
          <table className="cu-table tf-table">
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Program</th>
                <th>Removal Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Penalty</th>
                <th>Interest</th>
                <th>Total Owed</th>
              </tr>
            </thead>
            <tbody>
              {removals.map((r: Removal) => (
                <tr key={r.id}>
                  <td className="cu-cell--mono">{r.parcelId}</td>
                  <td>{programBadge(r.classificationCode)}</td>
                  <td>{r.removalDate ?? r.initiatedDate}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span className={`forge-chip ${
                      r.status === 'Completed' ? 'forge-chip--success' :
                      r.status === 'Pending' ? 'forge-chip--warn' : 'forge-chip--neutral'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="cu-cell--num">{fmtFull(r.penaltyAmount ?? 0)}</td>
                  <td className="cu-cell--num">{fmtFull(r.interestAmount ?? 0)}</td>
                  <td className="cu-cell--num cu-cell--negative">{fmtFull(r.totalDue ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {!removalsLoading && removals.length === 0 && !removalsError && (
        <div className="cu-empty">No removal proceedings found.</div>
      )}
    </div>
  );
}
