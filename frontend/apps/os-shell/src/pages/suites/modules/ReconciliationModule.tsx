/**
 * Reconciliation Module — Three-Approach Value Reconciliation
 * ===================================================================
 * USPAP-aligned reconciliation: combines Cost, Sales, and Income approach
 * indications into a single final opinion of value.
 *
 * Three methods: Weighted Average | Bracketed (Midpoint) | Primary Approach
 * Default weights by property type (Benton County standards).
 *
 * Source: QUARANTINE/terraforge-suite/harness/src/approaches/reconcile.ts
 */

import { useCallback, useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  type ApproachValue,
  type ReconciliationMethod,
  type PropertyCategory,
  type ReconciliationOutput,
  DEFAULT_RECONCILIATION_WEIGHTS,
  runReconciliation,
  appendAuditEntry,
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

export default function ReconciliationModule() {
  const [propertyType, setPropertyType] = useState<PropertyCategory>('residential');
  const [method, setMethod] = useState<ReconciliationMethod>('weighted_average');
  const [subjectId, setSubjectId] = useState('1-0455-100-0001-001');
  const [forcedWeights, setForcedWeights] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Approach values
  const [costValue, setCostValue] = useState(325000);
  const [costConfidence, setCostConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [costWeight, setCostWeight] = useState(0.3);
  const [costEnabled, setCostEnabled] = useState(true);

  const [salesValue, setSalesValue] = useState(342000);
  const [salesConfidence, setSalesConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [salesWeight, setSalesWeight] = useState(0.6);
  const [salesEnabled, setSalesEnabled] = useState(true);

  const [incomeValue, setIncomeValue] = useState(310000);
  const [incomeConfidence, setIncomeConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [incomeWeight, setIncomeWeight] = useState(0.1);
  const [incomeEnabled, setIncomeEnabled] = useState(false);

  const approaches = useMemo(() => {
    const result: Record<string, ApproachValue> = {};
    if (costEnabled) result.cost = { indicatedValue: costValue, confidenceLevel: costConfidence, weight: forcedWeights ? costWeight : undefined };
    if (salesEnabled) result.sales = { indicatedValue: salesValue, confidenceLevel: salesConfidence, weight: forcedWeights ? salesWeight : undefined };
    if (incomeEnabled) result.income = { indicatedValue: incomeValue, confidenceLevel: incomeConfidence, weight: forcedWeights ? incomeWeight : undefined };
    return result;
  }, [costEnabled, costValue, costConfidence, costWeight, salesEnabled, salesValue, salesConfidence, salesWeight, incomeEnabled, incomeValue, incomeConfidence, incomeWeight, forcedWeights]);

  const result: ReconciliationOutput | null = useMemo(() => {
    const enabledCount = [costEnabled, salesEnabled, incomeEnabled].filter(Boolean).length;
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
  }, [approaches, propertyType, method, forcedWeights, subjectId, costEnabled, salesEnabled, incomeEnabled]);

  const defaultWeights = DEFAULT_RECONCILIATION_WEIGHTS[propertyType];

  const handleSaveToAudit = useCallback(() => {
    if (!result) return;
    appendAuditEntry({
      parcelId: subjectId,
      action: 'RECONCILIATION_COMPLETED',
      userId: 'appraiser-001',
      previousValue: null,
      newValue: result.finalOpinionOfValue,
      module: 'ReconciliationModule',
      details: {
        method,
        propertyType,
        approachCount: Object.keys(approaches).length,
        spreadPercentage: result.reconciliationAnalysis.spreadPercentage,
        primaryApproach: result.reconciliationAnalysis.primaryApproach,
      },
      notes: `Reconciled ${Object.keys(approaches).length} approaches via ${method}`,
    });
    alert('Reconciliation saved to audit trail');
  }, [result, subjectId, method, propertyType, approaches]);

  const agreementColor = (a: string) => a === 'strong' ? '#22c55e' : a === 'moderate' ? '#f59e0b' : '#ef4444';
  const confidenceColor = (c: string) => c === 'high' ? '#22c55e' : c === 'medium' ? '#f59e0b' : '#ef4444';

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
                type='text' value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
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

          {/* Default Weights */}
          <div className='rounded-lg p-4 space-y-2' style={{ background: 'hsl(var(--tf-card-bg))', border: '1px solid hsl(var(--tf-border))' }}>
            <p className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
              Default Weights ({propertyType})
            </p>
            {(['sales', 'income', 'cost'] as const).map(k => (
              <div key={k} className='flex items-center justify-between'>
                <span className='text-sm capitalize' style={{ color: 'hsl(var(--tf-fg))' }}>{k}</span>
                <div className='flex items-center gap-2'>
                  <div className='w-24 h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                    <div className='h-full rounded-full' style={{ width: `${defaultWeights[k] * 100}%`, background: 'hsl(var(--tf-suite-forge))' }} />
                  </div>
                  <span className='text-xs font-mono w-10 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {pct(defaultWeights[k])}
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
                        <div className='h-full rounded-full' style={{ width: `${result.approachSummary.cost.weight * 100}%`, background: '#3b82f6' }} />
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
                        <div className='h-full rounded-full' style={{ width: `${result.approachSummary.sales.weight * 100}%`, background: '#22c55e' }} />
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
                        <div className='h-full rounded-full' style={{ width: `${result.approachSummary.income.weight * 100}%`, background: '#f59e0b' }} />
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
                    <AlertTriangle size={14} className='mt-0.5 shrink-0' style={{ color: '#f59e0b' }} />
                    <span className='text-xs' style={{ color: '#f59e0b' }}>{w}</span>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveToAudit}
                className='w-full py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90'
                style={{ background: 'hsl(var(--tf-suite-forge))', color: '#000' }}
              >
                Save to Audit Trail
              </button>
            </>
          ) : (
            <div className='flex items-center justify-center min-h-[300px]'>
              <div className='text-center space-y-2'>
                <Scale size={48} className='mx-auto' style={{ color: 'hsl(var(--tf-suite-forge) / 0.3)' }} />
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Enable at least one approach to reconcile
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
