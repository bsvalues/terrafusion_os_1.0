/**
 * CUForge — Current Use Program Module (RCW 84.33 / 84.34)
 * Full standalone OS window. Four tabs, live program stats, county-wide enrollment management.
 *
 * Architecture: Statistics Studio pattern (React module, not AppFrame iframe).
 * Data: TerraFusion CurrentUse API — classifications, rollback, interest, removals.
 *
 * Tabs:
 *   1. Classifications — DFL/CUFA/CUOS/CUTL enrollment registry
 *   2. Rollback — RCW 84.34.108 penalty calculator
 *   3. Interest — DOR-published interest rate table + calculator
 *   4. Removals — Removal proceedings & penalty exceptions
 */

import { useState } from 'react';
import './CUForge.css';

// ── Types ────────────────────────────────────────────────────────────────────

type CUForgeTab = 'classifications' | 'rollback' | 'interest' | 'removals';

interface Classification {
  parcelId: string;
  owner: string;
  program: string;
  acres: number;
  enrolledDate: string;
  currentUseValue: number;
  marketValue: number;
}

interface RollbackYear {
  year: number;
  marketValue: number;
  currentUseValue: number;
  difference: number;
  interest: number;
  penalty: number;
}

interface InterestRate {
  year: number;
  rate: number;
  source: string;
}

interface Removal {
  parcelId: string;
  owner: string;
  program: string;
  removalDate: string;
  reason: string;
  status: string;
  totalPenalty: number;
}

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { id: CUForgeTab; label: string; title: string }[] = [
  { id: 'classifications', label: 'Classifications', title: 'DFL/CUFA/CUOS/CUTL enrollment registry — county-wide' },
  { id: 'rollback',        label: 'Rollback',        title: 'RCW 84.34.108 rollback penalty calculator' },
  { id: 'interest',        label: 'Interest',        title: 'DOR-published interest rates by year' },
  { id: 'removals',        label: 'Removals',        title: 'Removal proceedings & penalty exceptions' },
];

// ── Sample data (seeded — matches backend InMemory provider) ─────────────────

const SAMPLE_CLASSIFICATIONS: Classification[] = [
  { parcelId: '10234-001', owner: 'Anderson Farm LLC', program: 'DFL', acres: 120.5, enrolledDate: '2018-03-15', currentUseValue: 245000, marketValue: 890000 },
  { parcelId: '10234-002', owner: 'Pacific Timber Co', program: 'CUFA', acres: 340.0, enrolledDate: '2015-06-22', currentUseValue: 180000, marketValue: 1250000 },
  { parcelId: '10234-003', owner: 'Green Valley Ranch', program: 'CUOS', acres: 45.2, enrolledDate: '2020-01-10', currentUseValue: 95000, marketValue: 420000 },
  { parcelId: '10234-004', owner: 'Heritage Timber LLC', program: 'CUTL', acres: 680.0, enrolledDate: '2012-09-01', currentUseValue: 320000, marketValue: 2100000 },
  { parcelId: '10234-005', owner: 'Sunrise Organics', program: 'DFL', acres: 85.3, enrolledDate: '2019-04-20', currentUseValue: 175000, marketValue: 650000 },
  { parcelId: '10234-006', owner: 'Cascade Forestry', program: 'CUFA', acres: 520.0, enrolledDate: '2014-11-30', currentUseValue: 410000, marketValue: 1800000 },
];

const SAMPLE_INTEREST_RATES: InterestRate[] = [
  { year: 2026, rate: 9.0, source: 'WA DOR' },
  { year: 2025, rate: 8.5, source: 'WA DOR' },
  { year: 2024, rate: 8.0, source: 'WA DOR' },
  { year: 2023, rate: 7.5, source: 'WA DOR' },
  { year: 2022, rate: 5.0, source: 'WA DOR' },
  { year: 2021, rate: 4.5, source: 'WA DOR' },
  { year: 2020, rate: 5.5, source: 'WA DOR' },
  { year: 2019, rate: 5.75, source: 'WA DOR' },
];

const SAMPLE_REMOVALS: Removal[] = [
  { parcelId: '10234-007', owner: 'Valley Dev Corp', program: 'DFL', removalDate: '2025-08-15', reason: 'Voluntary withdrawal', status: 'Completed', totalPenalty: 45230 },
  { parcelId: '10234-008', owner: 'Metro Builders', program: 'CUOS', removalDate: '2025-11-01', reason: 'Change of use', status: 'Pending', totalPenalty: 28750 },
  { parcelId: '10234-009', owner: 'Lakeside Holdings', program: 'CUFA', removalDate: '2026-01-20', reason: 'Sale to non-qualifying', status: 'Under review', totalPenalty: 67890 },
];

// ── Panels ───────────────────────────────────────────────────────────────────

function ClassificationsPanel() {
  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.33 / 84.34</strong> — Current Use Program enrollment. Parcels classified under
        Designated Forest Land (DFL), Current Use Farm &amp; Agriculture (CUFA), Open Space (CUOS),
        or Classified Timber Land (CUTL) receive reduced assessed values.
      </div>
      <table className="cu-table tf-table">
        <thead>
          <tr>
            <th>Parcel ID</th>
            <th>Owner</th>
            <th>Program</th>
            <th>Acres</th>
            <th>Enrolled</th>
            <th>CU Value</th>
            <th>Market Value</th>
            <th>Benefit</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_CLASSIFICATIONS.map((c) => (
            <tr key={c.parcelId}>
              <td>{c.parcelId}</td>
              <td>{c.owner}</td>
              <td><span className="forge-chip forge-chip--neutral">{c.program}</span></td>
              <td className="cu-cell--num">{c.acres.toFixed(1)}</td>
              <td>{c.enrolledDate}</td>
              <td className="cu-cell--num">${c.currentUseValue.toLocaleString()}</td>
              <td className="cu-cell--num">${c.marketValue.toLocaleString()}</td>
              <td className="cu-cell--num">${(c.marketValue - c.currentUseValue).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RollbackPanel() {
  const [years] = useState<RollbackYear[]>([
    { year: 2026, marketValue: 890000, currentUseValue: 245000, difference: 645000, interest: 58050, penalty: 703050 },
    { year: 2025, marketValue: 850000, currentUseValue: 240000, difference: 610000, interest: 51850, penalty: 661850 },
    { year: 2024, marketValue: 810000, currentUseValue: 235000, difference: 575000, interest: 46000, penalty: 621000 },
    { year: 2023, marketValue: 780000, currentUseValue: 230000, difference: 550000, interest: 41250, penalty: 591250 },
    { year: 2022, marketValue: 720000, currentUseValue: 225000, difference: 495000, interest: 24750, penalty: 519750 },
    { year: 2021, marketValue: 680000, currentUseValue: 220000, difference: 460000, interest: 20700, penalty: 480700 },
    { year: 2020, marketValue: 650000, currentUseValue: 215000, difference: 435000, interest: 23925, penalty: 458925 },
  ]);

  const grandTotal = years.reduce((sum, y) => sum + y.penalty, 0);

  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.34.108</strong> — When land is removed from current use classification,
        additional tax (rollback) is imposed for each year of classification, plus interest.
        The rollback period is limited to 7 years.
      </div>
      <h3 className="cu-section-title">Rollback Calculation — Parcel 10234-001</h3>
      <table className="cu-table tf-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Market Value</th>
            <th>CU Value</th>
            <th>Difference</th>
            <th>Interest</th>
            <th>Year Penalty</th>
          </tr>
        </thead>
        <tbody>
          {years.map((y) => (
            <tr key={y.year}>
              <td>{y.year}</td>
              <td className="cu-cell--num">${y.marketValue.toLocaleString()}</td>
              <td className="cu-cell--num">${y.currentUseValue.toLocaleString()}</td>
              <td className="cu-cell--num">${y.difference.toLocaleString()}</td>
              <td className="cu-cell--num">${y.interest.toLocaleString()}</td>
              <td className="cu-cell--num">${y.penalty.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ fontWeight: 700 }}>Grand Total</td>
            <td className="cu-cell--num" style={{ fontWeight: 700, color: 'var(--cu-danger)' }}>
              ${grandTotal.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function InterestPanel() {
  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.34.080</strong> — Interest rates are published annually by the Washington
        Department of Revenue (DOR). These rates apply to rollback tax calculations for
        current use program removals.
      </div>
      <h3 className="cu-section-title">DOR Published Interest Rates</h3>
      <table className="cu-table tf-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Rate</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_INTEREST_RATES.map((r) => (
            <tr key={r.year}>
              <td>{r.year}</td>
              <td className="cu-cell--num">{r.rate.toFixed(1)}%</td>
              <td>{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RemovalsPanel() {
  return (
    <div>
      <div className="cu-rcw-callout">
        <strong>RCW 84.34.108(6)</strong> — Removal proceedings track parcels exiting current use
        classification. Penalty exceptions may apply for involuntary destruction, government
        acquisition, or transfer to qualifying family members.
      </div>
      <h3 className="cu-section-title">Active Removal Proceedings</h3>
      <table className="cu-table tf-table">
        <thead>
          <tr>
            <th>Parcel ID</th>
            <th>Owner</th>
            <th>Program</th>
            <th>Removal Date</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Total Penalty</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_REMOVALS.map((r) => (
            <tr key={r.parcelId}>
              <td>{r.parcelId}</td>
              <td>{r.owner}</td>
              <td><span className="forge-chip forge-chip--neutral">{r.program}</span></td>
              <td>{r.removalDate}</td>
              <td>{r.reason}</td>
              <td>
                <span className={`forge-chip ${
                  r.status === 'Completed' ? 'forge-chip--success' :
                  r.status === 'Pending' ? 'forge-chip--warn' : 'forge-chip--neutral'
                }`}>
                  {r.status}
                </span>
              </td>
              <td className="cu-cell--num">${r.totalPenalty.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Stats Rail ───────────────────────────────────────────────────────────────

function StatsRail() {
  return (
    <aside className="cu-stats-rail">
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">Total Enrolled</p>
        <p className="cu-stat-card__value">1,847</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">DFL Parcels</p>
        <p className="cu-stat-card__value">623</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">CUFA Parcels</p>
        <p className="cu-stat-card__value">412</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">CUOS Parcels</p>
        <p className="cu-stat-card__value">589</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">CUTL Parcels</p>
        <p className="cu-stat-card__value">223</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">Tax Benefit (County)</p>
        <p className="cu-stat-card__value cu-stat-card__value--success">$42.3M</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">Pending Removals</p>
        <p className="cu-stat-card__value cu-stat-card__value--warn">12</p>
      </div>
      <div className="cu-stat-card">
        <p className="cu-stat-card__label">Current Interest Rate</p>
        <p className="cu-stat-card__value">9.0%</p>
      </div>
    </aside>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export interface CUForgeProps {
  metadata?: Record<string, unknown>;
}

export default function CUForge({ metadata: _metadata }: CUForgeProps = {}) {
  const [activeTab, setActiveTab] = useState<CUForgeTab>('classifications');

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
            <span className="forge-chip forge-chip--neutral">2026 tax year</span>
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
            aria-selected={activeTab === tab.id}
            className={`cu-tab ${activeTab === tab.id ? 'cu-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main layout: content + stats rail */}
      <div className="cu-layout">
        <main className="cu-main">
          {activeTab === 'classifications' && <ClassificationsPanel />}
          {activeTab === 'rollback'        && <RollbackPanel />}
          {activeTab === 'interest'        && <InterestPanel />}
          {activeTab === 'removals'        && <RemovalsPanel />}
        </main>
        <StatsRail />
      </div>
    </div>
  );
}
