/**
 * Reconciliation Module — Three-Approach Value Reconciliation
 * ===================================================================
 * USPAP-aligned reconciliation: combines Cost, Sales, and Income approach
 * indications into a single final opinion of value.
 *
 * Three methods: Weighted Average | Bracketed (Midpoint) | Primary Approach
 * Policy weights by property type (Benton County standards).
 *
 * Source: QUARANTINE/terraforge-suite/harness/src/approaches/reconcile.ts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { invokeTool } from '@/api/pilotApi';
import { usePropertyStore } from '@/stores/propertyStore';
import {
  Scale,
  Calculator,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { TactileButton } from '@/ui/materials';
import {
  type ApproachValue,
  type ReconciliationMethod,
  type PropertyCategory,
  type ReconciliationOutput,
  RECONCILIATION_WEIGHT_POLICY,
  runReconciliation,
} from '../../../services/forgeService';

const PROPERTY_CATEGORIES: { id: PropertyCategory; label: string }[] = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'agricultural', label: 'Agricultural' },
  { id: 'special_purpose', label: 'Special Purpose' },
];

const METHODS: { id: ReconciliationMethod; label: string; description: string }[] = [
  { id: 'weighted_average', label: 'Weighted Average', description: 'Weight each approach by reliability and property type' },
  { id: 'bracketed', label: 'Bracketed (Midpoint)', description: 'Use midpoint of min/max approach values' },
  { id: 'primary_approach', label: 'Primary Approach', description: 'Rely on the single most reliable approach' },
];

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(1) + '%';

interface BoePacketResult {
  caseId: string;
  packetRef: string;
  sections: string[];
  payloadRef: string;
}

function mapPropertyCategory(propertyType: string | undefined): PropertyCategory {
  switch (propertyType) {
    case 'commercial':
    case 'mixed-use':
    case 'multi-family':
      return 'commercial';
    case 'industrial':
      return 'industrial';
    case 'agricultural':
      return 'agricultural';
    default:
      return 'residential';
  }
}

export default function ReconciliationModule() {
  const activeParcel = usePropertyStore((state) => state.activeParcel);
  const [propertyType, setPropertyType] = useState<PropertyCategory>('residential');
  const [method, setMethod] = useState<ReconciliationMethod>('weighted_average');
  const [subjectId, setSubjectId] = useState('');
  const [forcedWeights, setForcedWeights] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Approach values
  const [costValue, setCostValue] = useState(0);
  const [costConfidence, setCostConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [costWeight, setCostWeight] = useState(0.3);
  const [costEnabled, setCostEnabled] = useState(false);

  const [salesValue, setSalesValue] = useState(0);
  const [salesConfidence, setSalesConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [salesWeight, setSalesWeight] = useState(0.6);
  const [salesEnabled, setSalesEnabled] = useState(false);

  const [incomeValue, setIncomeValue] = useState(0);
  const [incomeConfidence, setIncomeConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [incomeWeight, setIncomeWeight] = useState(0.1);
  const [incomeEnabled, setIncomeEnabled] = useState(false);

  // Human-gated reconciliation commit state
  const [commitConfirmed, setCommitConfirmed] = useState(false);
  const [commitState, setCommitState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: BoePacketResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    setSubjectId(activeParcel?.parcelId ?? '');
    if (activeParcel?.propertyType) {
      setPropertyType(mapPropertyCategory(activeParcel.propertyType));
    }
  }, [activeParcel]);

  const approaches = useMemo(() => {
    const result: Record<string, ApproachValue> = {};
    if (costEnabled && costValue > 0) result.cost = { indicatedValue: costValue, confidenceLevel: costConfidence, weight: forcedWeights ? costWeight : undefined };
    if (salesEnabled && salesValue > 0) result.sales = { indicatedValue: salesValue, confidenceLevel: salesConfidence, weight: forcedWeights ? salesWeight : undefined };
    if (incomeEnabled && incomeValue > 0) result.income = { indicatedValue: incomeValue, confidenceLevel: incomeConfidence, weight: forcedWeights ? incomeWeight : undefined };
    return result;
  }, [costEnabled, costValue, costConfidence, costWeight, salesEnabled, salesValue, salesConfidence, salesWeight, incomeEnabled, incomeValue, incomeConfidence, incomeWeight, forcedWeights]);

  const result: ReconciliationOutput | null = useMemo(() => {
    if (!subjectId) return null;
    const enabledCount = Object.keys(approaches).length;
    if (enabledCount === 0) return null;
    try {
      return runReconciliation({
        subjectId,
        effectiveDate: new Date().toISOString().split('T')[0],
        approaches,
        propertyType,
        reconciliationMethod: method,
        forcedWeights,
      });
    } catch {
      return null;
    }
  }, [approaches, propertyType, method, forcedWeights, subjectId]);

  const policyWeights = RECONCILIATION_WEIGHT_POLICY[propertyType];

  const handleCommitReconciliation = useCallback(async () => {
    if (!result || !commitConfirmed || !subjectId) return;
    setCommitState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'assemble_boe_packet',
        params: {
          county: 'benton',
          caseId: subjectId,
          include: ['evidence', 'valuation_history', 'comps'],
        },
      });
      if (response.success && response.result) {
        const raw = response.result.output;
        const parsed: BoePacketResult =
          typeof raw === 'string' ? (JSON.parse(raw) as BoePacketResult) : (raw as BoePacketResult);
        setCommitState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setCommitState({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to assemble BOE packet.',
        });
      }
    } catch (err) {
      setCommitState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: err instanceof Error ? err.message : 'Failed to assemble BOE packet.',
      });
    }
  }, [result, commitConfirmed, subjectId]);

  const agreementColor = (a: string) => a === 'strong' ? 'hsl(var(--tf-success-hs) 45%)' : a === 'moderate' ? 'hsl(var(--tf-warning-hs) 50%)' : 'hsl(var(--tf-error-hs) 55%)';
  const confidenceColor = (c: string) => c === 'high' ? 'hsl(var(--tf-success-hs) 45%)' : c === 'medium' ? 'hsl(var(--tf-warning-hs) 50%)' : 'hsl(var(--tf-error-hs) 55%)';

  return (
    <div className='p-6 space-y-6'>
      {/* Title */}
      <div className='flex items-center gap-3'>
        <Scale size={24} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
        <div>
          <h2 className='text-lg font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
            Value Reconciliation
          </h2>
          <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            USPAP-aligned three-approach reconciliation for final opinion of value
          </p>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-6'>
        {/* LEFT: Configuration */}
        <div className='space-y-4'>
          {/* Subject & Property Type */}
          <div className='rounded-lg p-4 space-y-3' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
            <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Configuration</p>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID</label>
              <input
                type='text'
                value={subjectId || 'Select a parcel to reconcile'}
                readOnly
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              />
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Property Type</label>
              <select
                value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyCategory)}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              >
                {PROPERTY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Reconciliation Method</label>
              <select
                value={method} onChange={(e) => setMethod(e.target.value as ReconciliationMethod)}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              >
                {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                {METHODS.find(m => m.id === method)?.description}
              </p>
            </div>
          </div>

          {/* Policy Weights */}
          <div className='rounded-lg p-4 space-y-2' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
            <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
              Policy Weights ({propertyType})
            </p>
            {(['sales', 'income', 'cost'] as const).map(k => (
              <div key={k} className='flex items-center justify-between'>
                <span className='text-sm capitalize' style={{ color: 'hsl(var(--tf-fg))' }}>{k}</span>
                <div className='flex items-center gap-2'>
                  <div className='w-24 h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                    <div className='h-full rounded-full' style={{ width: `${policyWeights[k] * 100}%`, background: 'hsl(var(--tf-suite-forge))' }} />
                  </div>
                  <span className='text-xs font-mono w-10 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {pct(policyWeights[k])}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced: Force Weights */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className='flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg hover:bg-white/5'
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced: Override Weights
          </button>
          {showAdvanced && (
            <div className='rounded-lg p-4 space-y-3' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
              <label className='flex items-center gap-2'>
                <input type='checkbox' checked={forcedWeights} onChange={(e) => setForcedWeights(e.target.checked)} />
                <span className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>Force manual weights</span>
              </label>
              {forcedWeights && (
                <div className='space-y-2'>
                  {costEnabled && (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-14' style={{ color: 'hsl(var(--tf-muted))' }}>Cost</span>
                      <input type='range' min={0} max={100} value={costWeight * 100} onChange={(e) => setCostWeight(Number(e.target.value) / 100)} className='flex-1' />
                      <span className='text-xs font-mono w-10' style={{ color: 'hsl(var(--tf-fg))' }}>{pct(costWeight)}</span>
                    </div>
                  )}
                  {salesEnabled && (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-14' style={{ color: 'hsl(var(--tf-muted))' }}>Sales</span>
                      <input type='range' min={0} max={100} value={salesWeight * 100} onChange={(e) => setSalesWeight(Number(e.target.value) / 100)} className='flex-1' />
                      <span className='text-xs font-mono w-10' style={{ color: 'hsl(var(--tf-fg))' }}>{pct(salesWeight)}</span>
                    </div>
                  )}
                  {incomeEnabled && (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs w-14' style={{ color: 'hsl(var(--tf-muted))' }}>Income</span>
                      <input type='range' min={0} max={100} value={incomeWeight * 100} onChange={(e) => setIncomeWeight(Number(e.target.value) / 100)} className='flex-1' />
                      <span className='text-xs font-mono w-10' style={{ color: 'hsl(var(--tf-fg))' }}>{pct(incomeWeight)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER: Approach Inputs */}
        <div className='space-y-4'>
          <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Approach Indications</p>

          {/* Cost Approach */}
          <div className='rounded-lg p-4 space-y-3' style={{ background: 'hsl(var(--tf-card-bg))', border: `1px solid ${costEnabled ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-border))'}`, opacity: costEnabled ? 1 : 0.5 }}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Calculator size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Cost Approach</span>
              </div>
              <label className='flex items-center gap-1'>
                <input type='checkbox' checked={costEnabled} onChange={(e) => setCostEnabled(e.target.checked)} />
                <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Include</span>
              </label>
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Indicated Value</label>
              <input
                type='number' value={costValue} onChange={(e) => setCostValue(Number(e.target.value))}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              />
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Confidence</label>
              <select
                value={costConfidence} onChange={(e) => setCostConfidence(e.target.value as 'high' | 'medium' | 'low')}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              >
                <option value='high'>High</option><option value='medium'>Medium</option><option value='low'>Low</option>
              </select>
            </div>
          </div>

          {/* Sales Approach */}
          <div className='rounded-lg p-4 space-y-3' style={{ background: 'hsl(var(--tf-card-bg))', border: `1px solid ${salesEnabled ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-border))'}`, opacity: salesEnabled ? 1 : 0.5 }}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <BarChart3 size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Sales Comparison</span>
              </div>
              <label className='flex items-center gap-1'>
                <input type='checkbox' checked={salesEnabled} onChange={(e) => setSalesEnabled(e.target.checked)} />
                <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Include</span>
              </label>
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Indicated Value</label>
              <input
                type='number' value={salesValue} onChange={(e) => setSalesValue(Number(e.target.value))}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              />
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Confidence</label>
              <select
                value={salesConfidence} onChange={(e) => setSalesConfidence(e.target.value as 'high' | 'medium' | 'low')}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              >
                <option value='high'>High</option><option value='medium'>Medium</option><option value='low'>Low</option>
              </select>
            </div>
          </div>

          {/* Income Approach */}
          <div className='rounded-lg p-4 space-y-3' style={{ background: 'hsl(var(--tf-card-bg))', border: `1px solid ${incomeEnabled ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-border))'}`, opacity: incomeEnabled ? 1 : 0.5 }}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <TrendingUp size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Income Approach</span>
              </div>
              <label className='flex items-center gap-1'>
                <input type='checkbox' checked={incomeEnabled} onChange={(e) => setIncomeEnabled(e.target.checked)} />
                <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Include</span>
              </label>
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Indicated Value</label>
              <input
                type='number' value={incomeValue} onChange={(e) => setIncomeValue(Number(e.target.value))}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              />
            </div>
            <div>
              <label className='block text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Confidence</label>
              <select
                value={incomeConfidence} onChange={(e) => setIncomeConfidence(e.target.value as 'high' | 'medium' | 'low')}
                className='w-full px-3 py-1.5 rounded text-sm' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
              >
                <option value='high'>High</option><option value='medium'>Medium</option><option value='low'>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className='space-y-4'>
          {result ? (
            <>
              {/* Final Value */}
              <div className='rounded-lg p-5 text-center' style={{ background: 'hsl(var(--tf-card-bg))', border: '2px solid hsl(var(--tf-suite-forge))' }}>
                <p className='text-xs font-medium uppercase tracking-wider mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Final Opinion of Value</p>
                <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                  {fmt(result.finalOpinionOfValue)}
                </p>
                <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Method: {METHODS.find(m => m.id === result.reconciliationAnalysis.method)?.label}
                </p>
              </div>

              {/* Weight Breakdown */}
              <div className='rounded-lg p-4 space-y-3' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
                <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Approach Breakdown</p>
                {result.approachSummary.cost && (
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>Cost</span>
                      <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(result.approachSummary.cost.contributedValue)}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                        <div className='h-full rounded-full' style={{ width: `${result.approachSummary.cost.weight * 100}%`, background: 'hsl(var(--tf-network-blue-hs) 55%)' }} />
                      </div>
                      <span className='text-xs font-mono w-12 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>{pct(result.approachSummary.cost.weight)}</span>
                    </div>
                  </div>
                )}
                {result.approachSummary.sales && (
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>Sales</span>
                      <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(result.approachSummary.sales.contributedValue)}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                        <div className='h-full rounded-full' style={{ width: `${result.approachSummary.sales.weight * 100}%`, background: 'hsl(var(--tf-success-hs) 45%)' }} />
                      </div>
                      <span className='text-xs font-mono w-12 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>{pct(result.approachSummary.sales.weight)}</span>
                    </div>
                  </div>
                )}
                {result.approachSummary.income && (
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>Income</span>
                      <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(result.approachSummary.income.contributedValue)}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                        <div className='h-full rounded-full' style={{ width: `${result.approachSummary.income.weight * 100}%`, background: 'hsl(var(--tf-warning-hs) 50%)' }} />
                      </div>
                      <span className='text-xs font-mono w-12 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>{pct(result.approachSummary.income.weight)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Range Analysis */}
              <div className='rounded-lg p-4 space-y-2' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
                <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Range Analysis</p>
                <div className='flex items-center justify-between text-sm'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Min</span>
                  <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(result.reconciliationAnalysis.valueRange.min)}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Max</span>
                  <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(result.reconciliationAnalysis.valueRange.max)}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Spread</span>
                  <span className='font-mono' style={{ color: agreementColor(result.qualityIndicators.approachAgreement) }}>
                    {result.reconciliationAnalysis.spreadPercentage.toFixed(1)}%
                  </span>
                </div>
                {result.reconciliationAnalysis.primaryApproach && (
                  <div className='flex items-center justify-between text-sm'>
                    <span style={{ color: 'hsl(var(--tf-muted))' }}>Primary</span>
                    <span className='capitalize font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {result.reconciliationAnalysis.primaryApproach}
                    </span>
                  </div>
                )}
              </div>

              {/* Quality Indicators */}
              <div className='rounded-lg p-4 space-y-2' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
                <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Quality Indicators</p>
                <div className='flex items-center gap-2'>
                  <CheckCircle size={14} style={{ color: confidenceColor(result.qualityIndicators.confidenceLevel) }} />
                  <span className='text-sm capitalize' style={{ color: 'hsl(var(--tf-fg))' }}>
                    Confidence: {result.qualityIndicators.confidenceLevel}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Info size={14} style={{ color: agreementColor(result.qualityIndicators.approachAgreement) }} />
                  <span className='text-sm capitalize' style={{ color: 'hsl(var(--tf-fg))' }}>
                    Agreement: {result.qualityIndicators.approachAgreement}
                  </span>
                </div>
                {result.qualityIndicators.warnings.map((w, i) => (
                  <div key={i} className='flex items-start gap-2'>
                    <AlertTriangle size={14} className='mt-0.5 shrink-0' style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }} />
                    <span className='text-xs' style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }}>{w}</span>
                  </div>
                ))}
              </div>

              {/* Governed Reconciliation Commit Gate */}
              <div
                className='rounded-lg p-4 space-y-4'
                style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}
                data-testid='reconciliation-commit-gate'
                data-material='bento'
              >
                <div className='flex items-center gap-2'>
                  <Lock size={14} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                  <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Commit Reconciliation</p>
                </div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Once confirmed, TerraPilot assembles the BOE packet including evidence, valuation history, and comps. This action records the final opinion of value and cannot be undone without a new reconciliation.
                </p>

                {commitState.status !== 'success' && (
                  <label className='flex items-start gap-2 cursor-pointer' data-testid='reconciliation-commit-label'>
                    <input
                      type='checkbox'
                      checked={commitConfirmed}
                      onChange={(e) => setCommitConfirmed(e.target.checked)}
                      className='mt-0.5'
                      data-testid='reconciliation-commit-checkbox'
                    />
                    <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                      I have reviewed all three approach indications and confirm {fmt(result.finalOpinionOfValue)} as the final opinion of value for parcel {subjectId}.
                    </span>
                  </label>
                )}

                {commitState.status !== 'success' && (
                  <TactileButton
                    onClick={handleCommitReconciliation}
                    fullWidth
                    disabled={!commitConfirmed || !subjectId || commitState.status === 'loading'}
                    data-testid='reconciliation-commit-btn'
                  >
                    {commitState.status === 'loading' ? 'Assembling BOE Packet…' : 'Commit Reconciliation + Assemble BOE Packet'}
                  </TactileButton>
                )}

                {commitState.status === 'error' && (
                  <div
                    className='rounded-md px-3 py-2 text-xs'
                    style={{ background: 'hsl(var(--tf-error-hs) 55% / 0.12)', color: 'hsl(var(--tf-error-hs) 65%)' }}
                    data-testid='reconciliation-commit-error'
                  >
                    <span className='font-semibold'>Commit failed:</span> {commitState.error}
                    {commitState.correlationId && (
                      <span className='ml-2 opacity-60 font-mono text-xs'>{commitState.correlationId}</span>
                    )}
                  </div>
                )}

                {commitState.status === 'success' && commitState.result && (
                  <div
                    className='rounded-lg p-3 space-y-2'
                    style={{ background: 'hsl(var(--tf-suite-forge) / 0.08)', border: '1px solid hsl(var(--tf-suite-forge) / 0.25)' }}
                    data-testid='reconciliation-commit-success'
                  >
                    <div className='flex items-center gap-2'>
                      <CheckCircle size={14} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                      <span className='text-xs font-semibold' style={{ color: 'hsl(var(--tf-suite-forge))' }}>BOE Packet Assembled</span>
                      {commitState.correlationId && (
                        <span className='ml-auto font-mono text-xs opacity-50'>{commitState.correlationId}</span>
                      )}
                    </div>
                    <div className='grid grid-cols-1 gap-1 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                      <div><span className='uppercase tracking-wider'>Packet Ref</span><p className='font-mono mt-0.5' style={{ color: 'hsl(var(--tf-fg))' }}>{commitState.result.packetRef}</p></div>
                      <div><span className='uppercase tracking-wider'>Sections</span><p className='mt-0.5' style={{ color: 'hsl(var(--tf-fg))' }}>{commitState.result.sections.join(', ')}</p></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className='flex items-center justify-center min-h-[300px]'>
              <div className='text-center space-y-2'>
                <Scale size={48} className='mx-auto' style={{ color: 'hsl(var(--tf-suite-forge) / 0.3)' }} />
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Select a parcel and enter at least one positive approach indication to reconcile.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
