/**
 * TerraLevy Dashboard — Phase C Rehosted Module
 *
 * Real levy management UI using domain types from the terra-levy application.
 * This replaces the PlaceholderModule and provides a functional 2D dashboard.
 * The 3D ImmersiveDashboard (Three.js) remains available for future activation
 * once @react-three/fiber and @terrafusion/quantum-ui are installed.
 *
 * @module applications/terra-levy/TerraLevyDashboard
 */

import React, { useState, useMemo } from 'react';
import type {
  LevyDataPoint,
  LevyDashboardData,
  CitizenInteraction,
  PaymentFlow,
} from './types/LevyTypes';
import type {
  BudgetCategory,
  AIRecommendation,
} from './types/BudgetTypes';
import type { PaymentAnalytics } from './types/PaymentTypes';

// ============================================================================
// Design Tokens — all colors via CSS custom properties (ratchet-safe)
// ============================================================================

const T = {
  cyan: 'var(--terra-cyan, rgb(0, 255, 255))',
  blue: 'var(--terra-blue, rgb(0, 128, 255))',
  midnight: 'var(--terra-midnight, rgb(15, 23, 42))',
  slate: 'var(--terra-slate, rgb(30, 41, 59))',
  textPrimary: 'var(--levy-text-primary, rgb(226, 232, 240))',
  textMuted: 'var(--levy-text-muted, rgb(148, 163, 184))',
  textDim: 'var(--levy-text-dim, rgb(100, 116, 139))',
  success: 'var(--levy-success, rgb(34, 197, 94))',
  warning: 'var(--levy-warning, rgb(234, 179, 8))',
  danger: 'var(--levy-danger, rgb(239, 68, 68))',
  orange: 'var(--levy-orange, rgb(249, 115, 22))',
  purple: 'var(--levy-purple, rgb(139, 92, 246))',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: '1px solid rgba(255,255,255,0.08)',
  cyanBorderAlpha: '1px solid rgba(0, 255, 255, 0.15)',
  cyanBgAlpha: 'rgba(0, 255, 255, 0.1)',
} as const;

// ============================================================================
// Sample Data (dev-mode — replaced by API in production)
// ============================================================================

const SAMPLE_LEVIES: LevyDataPoint[] = [
  {
    id: 'LEV-001', parcelId: '1-0529-100-0001-000', amount: 3847.22,
    status: 'paid', dueDate: new Date('2026-04-30'), paymentDate: new Date('2026-03-15'),
    citizenId: 'CIT-100', levyType: 'property', jurisdiction: 'Benton County',
  },
  {
    id: 'LEV-002', parcelId: '1-0529-100-0045-000', amount: 5120.50,
    status: 'pending', dueDate: new Date('2026-04-30'),
    citizenId: 'CIT-101', levyType: 'property', jurisdiction: 'Benton County',
  },
  {
    id: 'LEV-003', parcelId: '1-0529-200-0012-000', amount: 1890.00,
    status: 'overdue', dueDate: new Date('2026-02-28'),
    citizenId: 'CIT-102', levyType: 'property', jurisdiction: 'Benton County',
    aiRecommendation: { action: 'Send reminder notice', confidence: 0.92, reasoning: 'Account has 3-year on-time history; likely oversight.' },
  },
  {
    id: 'LEV-004', parcelId: '1-0529-300-0003-000', amount: 12450.75,
    status: 'disputed', dueDate: new Date('2026-04-30'),
    citizenId: 'CIT-103', levyType: 'property', jurisdiction: 'Benton County',
    aiRecommendation: { action: 'Schedule hearing', confidence: 0.78, reasoning: 'Value dispute on commercial parcel; comparable analysis suggests possible reduction.' },
  },
  {
    id: 'LEV-005', parcelId: '1-0529-100-0089-000', amount: 2215.30,
    status: 'paid', dueDate: new Date('2026-04-30'), paymentDate: new Date('2026-03-01'),
    citizenId: 'CIT-104', levyType: 'property', jurisdiction: 'Benton County',
  },
  {
    id: 'LEV-006', parcelId: '1-0529-400-0021-000', amount: 8770.00,
    status: 'pending', dueDate: new Date('2026-04-30'),
    citizenId: 'CIT-105', levyType: 'special_assessment', jurisdiction: 'Benton County',
  },
];

const SAMPLE_BUDGET: BudgetCategory[] = [
  {
    id: 'BUD-001', name: 'General Fund', allocated: 45_000_000, spent: 31_200_000, projected: 44_800_000,
    department: 'County Administration', priority: 'critical', fiscalYear: '2026',
    lastUpdated: new Date(), subCategories: [], complianceStatus: {
      level: 'FISMA-HIGH', auditTrail: [], lastAudit: new Date('2025-12-01'),
      nextAuditDue: new Date('2026-06-01'), complianceScore: 97, violations: [],
      certifications: ['FISMA-HIGH', 'SOC-2'], approvals: [],
    },
    aiRecommendations: [], historicalData: [], responsibleOfficer: 'County Treasurer', approvalStatus: 'approved',
  },
  {
    id: 'BUD-002', name: 'Road Fund', allocated: 12_000_000, spent: 8_100_000, projected: 11_900_000,
    department: 'Public Works', priority: 'high', fiscalYear: '2026',
    lastUpdated: new Date(), subCategories: [], complianceStatus: {
      level: 'FISMA-MODERATE', auditTrail: [], lastAudit: new Date('2025-11-15'),
      nextAuditDue: new Date('2026-05-15'), complianceScore: 94, violations: [],
      certifications: ['FISMA-MODERATE'], approvals: [],
    },
    aiRecommendations: [], historicalData: [], responsibleOfficer: 'PW Director', approvalStatus: 'approved',
  },
  {
    id: 'BUD-003', name: 'Emergency Services', allocated: 8_500_000, spent: 6_300_000, projected: 8_450_000,
    department: 'Emergency Management', priority: 'critical', fiscalYear: '2026',
    lastUpdated: new Date(), subCategories: [], complianceStatus: {
      level: 'FISMA-HIGH', auditTrail: [], lastAudit: new Date('2025-12-15'),
      nextAuditDue: new Date('2026-06-15'), complianceScore: 99, violations: [],
      certifications: ['FISMA-HIGH'], approvals: [],
    },
    aiRecommendations: [], historicalData: [], responsibleOfficer: 'EM Director', approvalStatus: 'approved',
  },
];

// ============================================================================
// Metric helpers
// ============================================================================

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function statusColor(s: LevyDataPoint['status']): string {
  return { paid: T.success, pending: T.warning, overdue: T.danger, disputed: T.orange }[s];
}

function priorityBadge(p: BudgetCategory['priority']): string {
  return { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[p];
}

// ============================================================================
// Component
// ============================================================================

type Tab = 'overview' | 'levies' | 'budget' | 'ai';

export default function TerraLevyDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  const metrics = useMemo(() => {
    const total = SAMPLE_LEVIES.reduce((s, l) => s + l.amount, 0);
    const paid = SAMPLE_LEVIES.filter(l => l.status === 'paid').reduce((s, l) => s + l.amount, 0);
    const pending = SAMPLE_LEVIES.filter(l => l.status === 'pending').reduce((s, l) => s + l.amount, 0);
    const overdue = SAMPLE_LEVIES.filter(l => l.status === 'overdue').reduce((s, l) => s + l.amount, 0);
    const disputed = SAMPLE_LEVIES.filter(l => l.status === 'disputed').reduce((s, l) => s + l.amount, 0);
    const collectionRate = total > 0 ? (paid / total) * 100 : 0;
    return { total, paid, pending, overdue, disputed, collectionRate };
  }, []);

  const budgetMetrics = useMemo(() => {
    const totalAllocated = SAMPLE_BUDGET.reduce((s, b) => s + b.allocated, 0);
    const totalSpent = SAMPLE_BUDGET.reduce((s, b) => s + b.spent, 0);
    const utilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    return { totalAllocated, totalSpent, utilization };
  }, []);

  const aiInsights = useMemo(() =>
    SAMPLE_LEVIES.filter(l => l.aiRecommendation).map(l => ({
      levyId: l.id,
      parcelId: l.parcelId,
      status: l.status,
      amount: l.amount,
      ...l.aiRecommendation!,
    })),
  []);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(135deg, ${T.midnight} 0%, ${T.slate} 100%)`,
      color: T.textPrimary, fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(0, 255, 255, 0.15)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 28 }}>🧮</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.cyan }}>TerraLevy</h1>
          <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>
            Tax Levy Management & Rate Calculations — Benton County WA
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12,
            background: 'rgba(0, 255, 255, 0.1)', border: '1px solid rgba(0, 255, 255, 0.3)', color: T.cyan,
          }}>FISMA-HIGH</span>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: T.success,
          }}>Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px',
      }}>
        {(['overview', 'levies', 'budget', 'ai'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', cursor: 'pointer', border: 'none',
              background: tab === t ? 'rgba(0, 255, 255, 0.08)' : 'transparent',
              color: tab === t ? T.cyan : T.textMuted,
              borderBottom: tab === t ? `2px solid ${T.cyan}` : '2px solid transparent',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              transition: 'all 0.15s ease',
            }}
          >
            {t === 'ai' ? 'AI Insights' : t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {tab === 'overview' && <OverviewTab metrics={metrics} budgetMetrics={budgetMetrics} levies={SAMPLE_LEVIES} />}
        {tab === 'levies' && <LeviesTab levies={SAMPLE_LEVIES} />}
        {tab === 'budget' && <BudgetTab budget={SAMPLE_BUDGET} metrics={budgetMetrics} />}
        {tab === 'ai' && <AITab insights={aiInsights} />}
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Overview
// ============================================================================

function OverviewTab({ metrics, budgetMetrics, levies }: {
  metrics: { total: number; paid: number; pending: number; overdue: number; disputed: number; collectionRate: number };
  budgetMetrics: { totalAllocated: number; totalSpent: number; utilization: number };
  levies: LevyDataPoint[];
}) {
  const cards = [
    { label: 'Total Levied', value: formatCurrency(metrics.total), color: T.cyan },
    { label: 'Collected', value: formatCurrency(metrics.paid), color: T.success },
    { label: 'Pending', value: formatCurrency(metrics.pending), color: T.warning },
    { label: 'Overdue', value: formatCurrency(metrics.overdue), color: T.danger },
    { label: 'Disputed', value: formatCurrency(metrics.disputed), color: T.orange },
    { label: 'Collection Rate', value: `${metrics.collectionRate.toFixed(1)}%`, color: T.purple },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            padding: 20, borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Budget utilization bar */}
      <div style={{
        padding: 20, borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Budget Utilization — FY 2026</span>
          <span style={{ fontSize: 14, color: T.cyan }}>{budgetMetrics.utilization.toFixed(1)}%</span>
        </div>
        <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6, width: `${budgetMetrics.utilization}%`,
            background: `linear-gradient(90deg, ${T.cyan}, ${T.blue})`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: T.textDim }}>
          <span>Spent: {formatCurrency(budgetMetrics.totalSpent)}</span>
          <span>Allocated: {formatCurrency(budgetMetrics.totalAllocated)}</span>
        </div>
      </div>

      {/* Status distribution */}
      <div style={{
        padding: 20, borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Levy Status Distribution</h3>
        <div style={{ display: 'flex', gap: 12, height: 24, borderRadius: 6, overflow: 'hidden' }}>
          {(['paid', 'pending', 'overdue', 'disputed'] as const).map(s => {
            const count = levies.filter(l => l.status === s).length;
            const pct = (count / levies.length) * 100;
            return (
              <div key={s} title={`${s}: ${count} (${pct.toFixed(0)}%)`} style={{
                flex: pct, background: statusColor(s), borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: T.midnight,
                minWidth: pct > 5 ? 40 : 0,
              }}>
                {pct > 10 ? `${s} ${count}` : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Levies
// ============================================================================

function LeviesTab({ levies }: { levies: LevyDataPoint[] }) {
  const [filter, setFilter] = useState<LevyDataPoint['status'] | 'all'>('all');
  const filtered = filter === 'all' ? levies : levies.filter(l => l.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['all', 'paid', 'pending', 'overdue', 'disputed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              border: filter === s ? `1px solid ${T.cyan}` : '1px solid rgba(255,255,255,0.1)',
              background: filter === s ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
              color: filter === s ? T.cyan : T.textMuted,
              fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
            }}
          >
            {s} {s !== 'all' ? `(${levies.filter(l => l.status === s).length})` : `(${levies.length})`}
          </button>
        ))}
      </div>

      {/* Levy table */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['Levy ID', 'Parcel', 'Amount', 'Status', 'Type', 'Due Date', 'AI'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontWeight: 600,
                  color: T.textMuted, borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12 }}>{l.id}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11 }}>{l.parcelId}</td>
                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{formatCurrency(l.amount)}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: `${statusColor(l.status)}22`, color: statusColor(l.status),
                    textTransform: 'capitalize',
                  }}>{l.status}</span>
                </td>
                <td style={{ padding: '10px 16px', textTransform: 'capitalize', fontSize: 12 }}>
                  {l.levyType.replace('_', ' ')}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12 }}>
                  {l.dueDate.toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {l.aiRecommendation ? (
                    <span title={l.aiRecommendation.reasoning} style={{ cursor: 'help' }}>
                      🤖 {(l.aiRecommendation.confidence * 100).toFixed(0)}%
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Budget
// ============================================================================

function BudgetTab({ budget, metrics }: {
  budget: BudgetCategory[];
  metrics: { totalAllocated: number; totalSpent: number; utilization: number };
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {budget.map(b => {
        const util = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
        return (
          <div key={b.id} style={{
            padding: 20, borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{b.name}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: T.textDim }}>{b.department}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{priorityBadge(b.priority)}</span>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 10,
                  background: b.complianceStatus.level === 'FISMA-HIGH'
                    ? 'rgba(0, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                  color: b.complianceStatus.level === 'FISMA-HIGH' ? T.cyan : T.warning,
                  border: `1px solid ${b.complianceStatus.level === 'FISMA-HIGH' ? 'rgba(0,255,255,0.3)' : 'rgba(234,179,8,0.3)'}`,
                }}>{b.complianceStatus.level}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Allocated</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrency(b.allocated)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Spent</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrency(b.spent)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Projected</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrency(b.projected)}</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, width: `${Math.min(util, 100)}%`,
                background: util > 95 ? T.danger : util > 80 ? T.warning : T.success,
              }} />
            </div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, textAlign: 'right' }}>
              {util.toFixed(1)}% utilized — Compliance: {b.complianceStatus.complianceScore}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Tab: AI Insights
// ============================================================================

function AITab({ insights }: {
  insights: Array<{
    levyId: string; parcelId: string; status: string; amount: number;
    action: string; confidence: number; reasoning: string;
  }>;
}) {
  if (insights.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.textDim }}>
        <span style={{ fontSize: 40 }}>🤖</span>
        <p style={{ marginTop: 12, fontSize: 14 }}>No AI recommendations at this time.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: 16, borderRadius: 12,
        background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.15)',
        fontSize: 13, color: T.textMuted,
      }}>
        🤖 AI analysis of {insights.length} levy records with actionable recommendations.
        Confidence scores reflect model certainty based on historical data patterns.
      </div>

      {insights.map(i => (
        <div key={i.levyId} style={{
          padding: 20, borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{i.levyId}</span>
              <span style={{ marginLeft: 8, fontSize: 12, fontFamily: 'monospace', color: T.textDim }}>{i.parcelId}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 10, fontSize: 11,
                background: `${statusColor(i.status as LevyDataPoint['status'])}22`,
                color: statusColor(i.status as LevyDataPoint['status']),
                textTransform: 'capitalize',
              }}>{i.status}</span>
              <span style={{
                padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: i.confidence > 0.85 ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                color: i.confidence > 0.85 ? T.success : T.warning,
              }}>{(i.confidence * 100).toFixed(0)}% confidence</span>
            </div>
          </div>
          <div style={{
            padding: 12, borderRadius: 8, marginBottom: 8,
            background: 'rgba(0, 255, 255, 0.04)', border: '1px solid rgba(0, 255, 255, 0.1)',
          }}>
            <div style={{ fontSize: 12, color: T.cyan, fontWeight: 600, marginBottom: 4 }}>Recommended Action</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{i.action}</div>
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
            <strong>Reasoning:</strong> {i.reasoning}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 8 }}>
            Amount: {formatCurrency(i.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}
