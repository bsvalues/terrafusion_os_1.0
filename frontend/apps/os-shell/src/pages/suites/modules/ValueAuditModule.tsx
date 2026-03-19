/**
 * Value Audit Module — Valuation Change Audit Trail
 * ===================================================================
 * FISMA-compliant audit trail for all valuation activities.
 *
 * Tracks: cost calculations, income analyses, comp selections,
 * reconciliations, appeal filings/decisions, manual overrides.
 *
 * Source: Harris PACS change_of_value_report + TerraTrace audit spine
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileSearch,
  Clock,
  Filter,
  Trash2,
  Download,
  ChevronRight,
  Calculator,
  TrendingUp,
  BarChart3,
  Scale,
  Gavel,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { TactileButton } from '@/ui/materials';
import {
  type AuditAction,
  type ValuationAuditEntry,
  loadAuditEntries,
  clearAuditEntries,
  appendAuditEntry,
} from '../../../services/forgeService';

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: typeof Calculator; color: string }> = {
  COST_CALCULATED: { label: 'Cost Calculated', icon: Calculator, color: 'hsl(var(--tf-network-blue-hs) 55%)' },
  INCOME_CALCULATED: { label: 'Income Calculated', icon: TrendingUp, color: 'hsl(var(--tf-success-hs) 45%)' },
  COMPS_ANALYZED: { label: 'Comps Analyzed', icon: BarChart3, color: 'hsl(var(--tf-info-hs) 60%)' },
  RECONCILIATION_COMPLETED: { label: 'Reconciliation', icon: Scale, color: 'hsl(var(--tf-warning-hs) 50%)' },
  APPEAL_FILED: { label: 'Appeal Filed', icon: Gavel, color: 'hsl(var(--tf-error-hs) 55%)' },
  APPEAL_DECIDED: { label: 'Appeal Decided', icon: Gavel, color: 'hsl(var(--tf-transcend-cyan-hs) 50%)' },
  VALUE_CHANGED: { label: 'Value Changed', icon: RefreshCw, color: 'hsl(var(--tf-error-hs) 50%)' },
  MANUAL_OVERRIDE: { label: 'Manual Override', icon: AlertTriangle, color: 'hsl(var(--tf-warning-hs) 55%)' },
};

const DEMO_ENTRIES: ValuationAuditEntry[] = [
  {
    id: 'demo-1', parcelId: '1-0455-100-0001-001', action: 'COST_CALCULATED',
    timestamp: '2026-02-20T09:15:00Z', userId: 'appraiser-001',
    previousValue: null, newValue: 325000, module: 'CostForgeModule',
    details: { buildingType: '100', region: 'BC-RICHLAND', squareFeet: 2200, confidence: 'HIGH' },
    notes: 'Initial cost approach for SFR in Richland',
  },
  {
    id: 'demo-2', parcelId: '1-0455-100-0001-001', action: 'COMPS_ANALYZED',
    timestamp: '2026-02-20T09:32:00Z', userId: 'appraiser-001',
    previousValue: null, newValue: 342000, module: 'CompsForgeModule',
    details: { compsUsed: 4, adjustmentRange: '$-8,500 to $12,000', medianAdjusted: 342000 },
    notes: 'Sales comparison with 4 Richland comps',
  },
  {
    id: 'demo-3', parcelId: '1-0455-100-0001-001', action: 'RECONCILIATION_COMPLETED',
    timestamp: '2026-02-20T10:05:00Z', userId: 'appraiser-001',
    previousValue: null, newValue: 337800, module: 'ReconciliationModule',
    details: { method: 'weighted_average', costWeight: 0.3, salesWeight: 0.6, incomeWeight: 0.1, spread: '5.2%' },
    notes: 'Reconciled cost ($325K) + sales ($342K) — residential weighted average',
  },
  {
    id: 'demo-4', parcelId: '1-0935-200-0004-002', action: 'INCOME_CALCULATED',
    timestamp: '2026-02-21T14:20:00Z', userId: 'appraiser-002',
    previousValue: null, newValue: 1925000, module: 'IncomeApproachModule',
    details: { noi: 154000, capRate: 0.08, propertyType: 'Multi-Family', units: 12 },
    notes: 'Direct cap for 12-unit apartment complex',
  },
  {
    id: 'demo-5', parcelId: '1-0935-200-0004-002', action: 'APPEAL_FILED',
    timestamp: '2026-02-22T08:45:00Z', userId: 'property-owner',
    previousValue: 2100000, newValue: 1925000, module: 'AppealForgeModule',
    details: { appealType: 'VALUATION', currentAssessed: 2100000, requestedValue: 1925000, evidenceCount: 3 },
    notes: 'Owner appeal on market value for multi-family property',
  },
  {
    id: 'demo-6', parcelId: '1-0935-200-0004-002', action: 'APPEAL_DECIDED',
    timestamp: '2026-02-25T16:00:00Z', userId: 'boe-panel',
    previousValue: 2100000, newValue: 1975000, module: 'AppealForgeModule',
    details: { decision: 'PARTIAL', reduction: 125000, hearingDate: '2026-02-25' },
    notes: 'BOE granted partial reduction to $1,975,000',
  },
  {
    id: 'demo-7', parcelId: '1-1250-300-0002-000', action: 'VALUE_CHANGED',
    timestamp: '2026-02-24T11:30:00Z', userId: 'appraiser-001',
    previousValue: 890000, newValue: 875000, module: 'CostForgeModule',
    details: { reason: 'Updated depreciation rate for commercial office', adjustmentType: 'depreciation' },
    notes: 'Adjusted depreciation from 15% to 18% after inspection',
  },
  {
    id: 'demo-8', parcelId: '1-0455-100-0001-001', action: 'MANUAL_OVERRIDE',
    timestamp: '2026-02-26T09:00:00Z', userId: 'chief-appraiser',
    previousValue: 337800, newValue: 340000, module: 'ReconciliationModule',
    details: { reason: 'Rounded to nearest $5K per office policy', approvedBy: 'chief-appraiser' },
    notes: 'Chief appraiser approved rounding for final value',
  },
];

const fmt = (n: number | null) => n !== null ? '$' + n.toLocaleString('en-US') : '—';
const fmtDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function ValueAuditModule() {
  const [entries, setEntries] = useState<ValuationAuditEntry[]>([]);
  const [filterAction, setFilterAction] = useState<AuditAction | 'ALL'>('ALL');
  const [filterParcel, setFilterParcel] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ValuationAuditEntry | null>(null);

  // Load entries on mount
  useEffect(() => {
    const stored = loadAuditEntries();
    // Merge demo + stored, dedupe by id
    const all = [...DEMO_ENTRIES, ...stored];
    const seen = new Set<string>();
    const deduped = all.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
    deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEntries(deduped);
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterAction !== 'ALL' && e.action !== filterAction) return false;
      if (filterParcel && !e.parcelId.includes(filterParcel)) return false;
      return true;
    });
  }, [entries, filterAction, filterParcel]);

  // Stats
  const stats = useMemo(() => {
    const parcels = new Set(entries.map(e => e.parcelId));
    const valueChanges = entries.filter(e => e.previousValue !== null && e.newValue !== null);
    const totalAdjustment = valueChanges.reduce((sum, e) => sum + ((e.newValue ?? 0) - (e.previousValue ?? 0)), 0);
    const appeals = entries.filter(e => e.action === 'APPEAL_FILED' || e.action === 'APPEAL_DECIDED');
    return {
      totalEntries: entries.length,
      uniqueParcels: parcels.size,
      totalAdjustment,
      appealCount: appeals.length,
    };
  }, [entries]);

  const handleClearUserEntries = useCallback(() => {
    clearAuditEntries();
    setEntries(DEMO_ENTRIES.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setSelectedEntry(null);
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Parcel ID', 'Action', 'Previous Value', 'New Value', 'Module', 'User', 'Notes'];
    const rows = filteredEntries.map(e => [
      e.timestamp, e.parcelId, e.action,
      e.previousValue?.toString() ?? '', e.newValue?.toString() ?? '',
      e.module, e.userId, e.notes,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `forge-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [filteredEntries]);

  const handleAddTestEntry = useCallback(() => {
    const entry = appendAuditEntry({
      parcelId: '1-0455-100-0001-001',
      action: 'COST_CALCULATED',
      userId: 'appraiser-001',
      previousValue: null,
      newValue: Math.round(300000 + Math.random() * 100000),
      module: 'CostForgeModule',
      details: { source: 'test-entry', buildingType: '100' },
      notes: 'Test audit entry',
    });
    setEntries(prev => [entry, ...prev]);
  }, []);

  return (
    <div className='p-6 space-y-6'>
      {/* Title */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <FileSearch size={24} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          <div>
            <h2 className='text-lg font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              Value Audit Trail
            </h2>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              FISMA-compliant append-only audit trail for all valuation activities
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={handleAddTestEntry} className='px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors' style={{ border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
            + Test Entry
          </button>
          <TactileButton size='sm' onClick={handleExportCSV} leftIcon={<Download size={12} />}>
            Export CSV
          </TactileButton>
          <button onClick={handleClearUserEntries} className='flex items-center gap-1.5 px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors' style={{ border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
            <Trash2 size={12} /> Clear User Entries
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className='grid grid-cols-4 gap-4'>
        {[
          { label: 'Total Entries', value: stats.totalEntries.toString(), icon: FileText },
          { label: 'Unique Parcels', value: stats.uniqueParcels.toString(), icon: FileSearch },
          { label: 'Net Adjustment', value: fmt(stats.totalAdjustment), icon: RefreshCw },
          { label: 'Appeal Activity', value: stats.appealCount.toString(), icon: Gavel },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className='rounded-lg p-3' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
            <div className='flex items-center gap-2'>
              <Icon size={14} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
              <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
            </div>
            <p className='text-lg font-bold mt-1' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className='flex gap-6'>
        {/* LEFT: Filters + Entry List */}
        <div className='w-2/3 space-y-4'>
          {/* Filters */}
          <div className='flex items-center gap-3'>
            <Filter size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
            <select
              value={filterAction} onChange={(e) => setFilterAction(e.target.value as AuditAction | 'ALL')}
              className='px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
            >
              <option value='ALL'>All Actions</option>
              {(Object.keys(ACTION_CONFIG) as AuditAction[]).map(a => (
                <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
              ))}
            </select>
            <input
              type='text' placeholder='Filter by parcel ID...' value={filterParcel}
              onChange={(e) => setFilterParcel(e.target.value)}
              className='px-3 py-1.5 rounded text-sm flex-1' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
            />
            <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
              {filteredEntries.length} of {entries.length}
            </span>
          </div>

          {/* Entry List */}
          <div className='space-y-1'>
            {filteredEntries.map(entry => {
              const cfg = ACTION_CONFIG[entry.action];
              const Icon = cfg.icon;
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(isSelected ? null : entry)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <div className='p-1.5 rounded' style={{ background: `${cfg.color}20` }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{cfg.label}</span>
                      <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>{entry.parcelId}</span>
                    </div>
                    <p className='text-xs truncate' style={{ color: 'hsl(var(--tf-muted))' }}>{entry.notes}</p>
                  </div>
                  <div className='text-right shrink-0'>
                    {entry.newValue !== null && (
                      <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(entry.newValue)}</p>
                    )}
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{fmtDate(entry.timestamp)}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'hsl(var(--tf-muted))', opacity: isSelected ? 1 : 0.3 }} />
                </button>
              );
            })}
            {filteredEntries.length === 0 && (
              <div className='text-center py-12'>
                <FileSearch size={32} className='mx-auto mb-2' style={{ color: 'hsl(var(--tf-muted) / 0.3)' }} />
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>No audit entries match filters</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className='w-1/3'>
          {selectedEntry ? (
            <div className='rounded-lg p-5 space-y-4 sticky top-6' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
              <div className='flex items-center gap-2'>
                {(() => { const cfg = ACTION_CONFIG[selectedEntry.action]; const I = cfg.icon; return <I size={18} style={{ color: cfg.color }} />; })()}
                <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {ACTION_CONFIG[selectedEntry.action].label}
                </span>
              </div>

              <div className='space-y-2'>
                <DetailRow label='Parcel' value={selectedEntry.parcelId} />
                <DetailRow label='Date' value={`${fmtDate(selectedEntry.timestamp)} at ${fmtTime(selectedEntry.timestamp)}`} />
                <DetailRow label='User' value={selectedEntry.userId} />
                <DetailRow label='Module' value={selectedEntry.module} />
                <DetailRow label='Entry ID' value={selectedEntry.id} mono />
              </div>

              {/* Value Change */}
              {(selectedEntry.previousValue !== null || selectedEntry.newValue !== null) && (
                <div className='rounded-lg p-3 space-y-1' style={{ background: 'hsl(var(--tf-bg))' }}>
                  <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Value</p>
                  {selectedEntry.previousValue !== null && (
                    <div className='flex items-center justify-between text-sm'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Previous</span>
                      <span className='font-mono' style={{ color: 'hsl(var(--tf-error-hs) 55%)' }}>{fmt(selectedEntry.previousValue)}</span>
                    </div>
                  )}
                  {selectedEntry.newValue !== null && (
                    <div className='flex items-center justify-between text-sm'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>New</span>
                      <span className='font-mono' style={{ color: 'hsl(var(--tf-success-hs) 45%)' }}>{fmt(selectedEntry.newValue)}</span>
                    </div>
                  )}
                  {selectedEntry.previousValue !== null && selectedEntry.newValue !== null && (
                    <div className='flex items-center justify-between text-sm pt-1' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Change</span>
                      <span className='font-mono font-medium' style={{ color: (selectedEntry.newValue - selectedEntry.previousValue) >= 0 ? 'hsl(var(--tf-success-hs) 45%)' : 'hsl(var(--tf-error-hs) 55%)' }}>
                        {(selectedEntry.newValue - selectedEntry.previousValue) >= 0 ? '+' : ''}{fmt(selectedEntry.newValue - selectedEntry.previousValue)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              {Object.keys(selectedEntry.details).length > 0 && (
                <div className='space-y-1'>
                  <p className='text-xs font-medium uppercase' style={{ color: 'hsl(var(--tf-muted))' }}>Details</p>
                  {Object.entries(selectedEntry.details).map(([k, v]) => (
                    <div key={k} className='flex items-center justify-between text-xs'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>{k}</span>
                      <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {selectedEntry.notes && (
                <div>
                  <p className='text-xs font-medium uppercase mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Notes</p>
                  <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedEntry.notes}</p>
                </div>
              )}

              {/* Timeline position */}
              <div className='pt-2' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                <div className='flex items-center gap-2'>
                  <Clock size={12} style={{ color: 'hsl(var(--tf-muted))' }} />
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Append-only audit entry — immutable once created
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='rounded-lg p-8 flex items-center justify-center min-h-[400px]' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
              <div className='text-center space-y-2'>
                <FileSearch size={36} className='mx-auto' style={{ color: 'hsl(var(--tf-suite-forge) / 0.3)' }} />
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Select an entry to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''} style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
    </div>
  );
}
