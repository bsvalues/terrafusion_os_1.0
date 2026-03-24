// ARCHIVED 2026-03-19: No live imports. Forge income authority is IncomeApproach.tsx + IncomeValuationPanel.tsx. See CP-35-C.

/**
 * IncomeForge Module — Income Approach (Direct Capitalization)
 * ===================================================================
 * Constitutional module of TerraForge (Article V Section 5.1).
 *
 * USPAP-aligned direct capitalization for commercial/rental properties.
 * Formula: Value = NOI / Cap Rate
 *
 * Benton County market cap rates from 2025 survey data.
 */

import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  DollarSign,
  Building2,
  AlertTriangle,
  ArrowRight,
  Percent,
  PieChart,
  CheckCircle2,
} from 'lucide-react';

import {
  BUILDING_TYPES,
  REGIONS,
  MARKET_CAP_RATES,
  calculateIncome,
  extractCapRate,
  type IncomeInput,
  type IncomeResult,
  type IncomeExpenses,
} from '../../../services/forgeService';

// Income-eligible building types (commercial/industrial/multi-family)
const INCOME_TYPES = BUILDING_TYPES.filter((t) =>
  ['200', '300', '310', '400', '450', '500', '510'].includes(t.id),
);

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';

// Default expense structure for demo
const DEFAULT_EXPENSES: IncomeExpenses = {
  taxes: 24000,
  insurance: 8500,
  utilities: 0,
  maintenance: 12000,
  management: 18000,
  reserves: 6000,
  other: 0,
};

// Demo comparable sales for cap rate extraction
const DEMO_COMPS = [
  { id: 'INC-COMP-1', address: '1450 George Washington Way, Richland', salePrice: 2850000, noi: 213750, extractedRate: 0.075 },
  { id: 'INC-COMP-2', address: '3200 W Kennewick Ave, Kennewick', salePrice: 1920000, noi: 153600, extractedRate: 0.080 },
  { id: 'INC-COMP-3', address: '525 N 4th Ave, Pasco', salePrice: 3100000, noi: 248000, extractedRate: 0.080 },
  { id: 'INC-COMP-4', address: '8890 Gage Blvd, Kennewick', salePrice: 4200000, noi: 315000, extractedRate: 0.075 },
];

export default function IncomeForgeModule() {
  const [propertyType, setPropertyType] = useState('300');
  const [region, setRegion] = useState('BC-RICHLAND');
  const [pgi, setPgi] = useState(240000);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [otherIncome, setOtherIncome] = useState(0);
  const [expenses, setExpenses] = useState<IncomeExpenses>(DEFAULT_EXPENSES);
  const [capRate, setCapRate] = useState(7.5);
  const [capRateSource, setCapRateSource] = useState<'market_extraction' | 'band_of_investment' | 'provided'>('market_extraction');
  const [selectedComps, setSelectedComps] = useState<string[]>(['INC-COMP-1', 'INC-COMP-2', 'INC-COMP-3']);

  const updateExpense = useCallback((key: keyof IncomeExpenses, value: number) => {
    setExpenses((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleComp = useCallback((id: string) => {
    setSelectedComps((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }, []);

  // Market cap rate range for selected property type
  const marketRange = MARKET_CAP_RATES[propertyType];

  // Extract cap rate from selected comps
  const extractedRate = useMemo(() => {
    const comps = DEMO_COMPS.filter((c) => selectedComps.includes(c.id));
    if (comps.length === 0) return null;
    return extractCapRate(comps);
  }, [selectedComps]);

  // Auto-apply extracted rate when using market extraction
  const effectiveCapRate = capRateSource === 'market_extraction' && extractedRate
    ? extractedRate * 100
    : capRate;

  // Run income calculation
  const result: IncomeResult = useMemo(() => {
    const input: IncomeInput = {
      propertyType,
      region,
      potentialGrossIncome: pgi,
      vacancyRate: vacancyRate / 100,
      otherIncome,
      expenses,
      capRate: effectiveCapRate / 100,
      capRateSource,
      comparables: DEMO_COMPS.filter((c) => selectedComps.includes(c.id)),
    };
    return calculateIncome(input);
  }, [propertyType, region, pgi, vacancyRate, otherIncome, expenses, effectiveCapRate, capRateSource, selectedComps]);

  const confidenceColor = result.confidence === 'HIGH'
    ? 'hsl(var(--tf-success-hs) 45%)'
    : result.confidence === 'MEDIUM'
      ? 'hsl(var(--tf-warning-hs) 50%)'
      : 'hsl(var(--tf-error-hs) 60%)';

  return (
    <div className='p-6 space-y-6 max-w-[1400px] mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <TrendingUp size={24} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          <div>
            <h2 className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
              Income Approach — Direct Capitalization
            </h2>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              USPAP-aligned NOI / Cap Rate valuation for commercial properties
            </p>
          </div>
        </div>
        <Badge
          style={{
            background: `${confidenceColor}20`,
            color: confidenceColor,
            borderColor: `${confidenceColor}40`,
          }}
        >
          {result.confidence} Confidence
        </Badge>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* LEFT COLUMN — Inputs */}
        <div className='space-y-4'>
          {/* Property Info */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Building2 size={16} /> Property
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.code} — {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Income */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <DollarSign size={16} /> Gross Income
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Potential Gross Income (Annual)</Label>
                <Input
                  type='number'
                  value={pgi}
                  onChange={(e) => setPgi(Number(e.target.value))}
                  style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Vacancy Rate (%)</Label>
                  <Input
                    type='number'
                    value={vacancyRate}
                    onChange={(e) => setVacancyRate(Number(e.target.value))}
                    min={0}
                    max={100}
                    step={0.5}
                    style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                  />
                </div>
                <div>
                  <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Other Income</Label>
                  <Input
                    type='number'
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                    style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Expenses */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <PieChart size={16} /> Operating Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {(Object.keys(expenses) as Array<keyof IncomeExpenses>).map((key) => (
                <div key={key} className='flex items-center gap-2'>
                  <Label className='text-xs w-24 capitalize' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {key}
                  </Label>
                  <Input
                    type='number'
                    value={expenses[key]}
                    onChange={(e) => updateExpense(key, Number(e.target.value))}
                    className='flex-1'
                    style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                  />
                </div>
              ))}
              <Separator style={{ background: 'hsl(var(--tf-border))' }} />
              <div className='flex justify-between text-sm'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Total Expenses</span>
                <span className='font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {fmt(result.totalExpenses)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Expense Ratio</span>
                <span
                  className='font-medium'
                  style={{
                    color: result.expenseRatio >= 0.3 && result.expenseRatio <= 0.5
                      ? 'hsl(var(--tf-success-hs) 45%)'
                      : 'hsl(var(--tf-warning-hs) 50%)',
                  }}
                >
                  {fmtPct(result.expenseRatio)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN — Cap Rate & Comps */}
        <div className='space-y-4'>
          {/* Cap Rate */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Percent size={16} /> Capitalization Rate
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Source</Label>
                <Select value={capRateSource} onValueChange={(v) => setCapRateSource(v as typeof capRateSource)}>
                  <SelectTrigger style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='market_extraction'>Market Extraction</SelectItem>
                    <SelectItem value='band_of_investment'>Band of Investment</SelectItem>
                    <SelectItem value='provided'>Appraiser Provided</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {capRateSource !== 'market_extraction' && (
                <div>
                  <Label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Cap Rate (%)</Label>
                  <Input
                    type='number'
                    value={capRate}
                    onChange={(e) => setCapRate(Number(e.target.value))}
                    min={0.1}
                    max={25}
                    step={0.1}
                    style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
                  />
                </div>
              )}

              {capRateSource === 'market_extraction' && extractedRate && (
                <div
                  className='p-3 rounded-lg'
                  style={{ background: 'hsl(var(--tf-suite-forge) / 0.1)', border: '1px solid hsl(var(--tf-suite-forge) / 0.3)' }}
                >
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Extracted Rate</p>
                  <p className='text-xl font-bold' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                    {(extractedRate * 100).toFixed(2)}%
                  </p>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    from {selectedComps.length} comparable{selectedComps.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Market range */}
              {marketRange && (
                <div className='space-y-1'>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Market Range (Benton County)</p>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {fmtPct(marketRange.low)}
                    </span>
                    <div className='flex-1 h-2 rounded-full relative' style={{ background: 'hsl(var(--tf-border))' }}>
                      <div
                        className='absolute h-full rounded-full'
                        style={{
                          background: 'hsl(var(--tf-suite-forge))',
                          left: '0%',
                          width: '100%',
                          opacity: 0.3,
                        }}
                      />
                      {/* Marker for current rate */}
                      <div
                        className='absolute w-3 h-3 rounded-full -top-0.5'
                        style={{
                          background: 'hsl(var(--tf-suite-forge))',
                          left: `${Math.min(100, Math.max(0, ((effectiveCapRate / 100 - marketRange.low) / (marketRange.high - marketRange.low)) * 100))}%`,
                          transform: 'translateX(-50%)',
                        }}
                      />
                    </div>
                    <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {fmtPct(marketRange.high)}
                    </span>
                  </div>
                </div>
              )}

              <Badge
                style={{
                  background: result.capRateSupport === 'strong'
                    ? 'hsl(var(--tf-success-hs) 45% / 0.15)'
                    : result.capRateSupport === 'moderate'
                      ? 'hsl(var(--tf-warning-hs) 50% / 0.15)'
                      : 'hsl(0 84% 60% / 0.15)',
                  color: result.capRateSupport === 'strong'
                    ? 'hsl(var(--tf-success-hs) 45%)'
                    : result.capRateSupport === 'moderate'
                      ? 'hsl(var(--tf-warning-hs) 50%)'
                      : 'hsl(var(--tf-error-hs) 60%)',
                }}
              >
                {result.capRateSupport} cap rate support
              </Badge>
            </CardContent>
          </Card>

          {/* Comparable Sales for Cap Rate */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Cap Rate Comparables
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {DEMO_COMPS.map((comp) => {
                const isSelected = selectedComps.includes(comp.id);
                return (
                  <button
                    key={comp.id}
                    onClick={() => toggleComp(comp.id)}
                    className='w-full text-left p-3 rounded-lg transition-colors'
                    style={{
                      background: isSelected ? 'hsl(var(--tf-suite-forge) / 0.1)' : 'hsl(var(--tf-bg))',
                      border: `1px solid ${isSelected ? 'hsl(var(--tf-suite-forge) / 0.4)' : 'hsl(var(--tf-border))'}`,
                    }}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs truncate' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {comp.address}
                        </p>
                        <div className='flex items-center gap-3 mt-1'>
                          <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                            Sale: {fmt(comp.salePrice)}
                          </span>
                          <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                            NOI: {fmt(comp.noi)}
                          </span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <span
                          className='text-sm font-mono font-bold'
                          style={{ color: isSelected ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-muted))' }}
                        >
                          {fmtPct(comp.extractedRate)}
                        </span>
                        {isSelected && (
                          <CheckCircle2
                            size={14}
                            className='ml-1 inline'
                            style={{ color: 'hsl(var(--tf-suite-forge))' }}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — Results */}
        <div className='space-y-4'>
          {/* NOI Waterfall */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                NOI Waterfall
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {[
                { label: 'Potential Gross Income (PGI)', value: result.potentialGrossIncome, positive: true },
                { label: 'Less: Vacancy & Collection', value: -result.vacancyLoss, positive: false },
                { label: 'Plus: Other Income', value: result.otherIncome, positive: true },
              ].map((row, i) => (
                <div key={i} className='flex justify-between text-sm'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>{row.label}</span>
                  <span
                    className='font-mono'
                    style={{ color: row.positive ? 'hsl(var(--tf-success-hs) 45%)' : 'hsl(var(--tf-error-hs) 60%)' }}
                  >
                    {row.value < 0 ? `(${fmt(Math.abs(row.value))})` : fmt(row.value)}
                  </span>
                </div>
              ))}

              <Separator style={{ background: 'hsl(var(--tf-border))' }} />

              <div className='flex justify-between text-sm font-medium'>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>Effective Gross Income (EGI)</span>
                <span className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {fmt(result.effectiveGrossIncome)}
                </span>
              </div>

              <div className='flex justify-between text-sm'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Less: Operating Expenses</span>
                <span className='font-mono' style={{ color: 'hsl(var(--tf-error-hs) 60%)' }}>
                  ({fmt(result.totalExpenses)})
                </span>
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} />

              <div className='flex justify-between text-sm font-bold'>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>Net Operating Income (NOI)</span>
                <span
                  className='font-mono'
                  style={{ color: result.netOperatingIncome > 0 ? 'hsl(var(--tf-success-hs) 45%)' : 'hsl(var(--tf-error-hs) 60%)' }}
                >
                  {fmt(result.netOperatingIncome)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Capitalization Pipeline */}
          <Card
            style={{
              background: 'hsl(var(--tf-suite-forge) / 0.05)',
              borderColor: 'hsl(var(--tf-suite-forge) / 0.3)',
            }}
          >
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Direct Capitalization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-center gap-3'>
                <div className='text-center'>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>NOI</p>
                  <p className='text-lg font-bold font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                    {fmt(result.netOperatingIncome)}
                  </p>
                </div>
                <span className='text-lg' style={{ color: 'hsl(var(--tf-muted))' }}>/</span>
                <div className='text-center'>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Cap Rate</p>
                  <p className='text-lg font-bold font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                    {fmtPct(result.capRate)}
                  </p>
                </div>
                <ArrowRight size={20} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                <div className='text-center'>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Indicated Value</p>
                  <p className='text-2xl font-bold font-mono' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                    {fmt(result.indicatedValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card style={{ background: 'hsl(var(--tf-warning-hs) 50% / 0.05)', borderColor: 'hsl(var(--tf-warning-hs) 50% / 0.3)' }}>
              <CardContent className='pt-4 space-y-2'>
                {result.warnings.map((w, i) => (
                  <div key={i} className='flex items-start gap-2'>
                    <AlertTriangle size={14} className='mt-0.5 shrink-0' style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }} />
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }}>{w}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quality Metrics */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Analysis Quality
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {[
                { label: 'Expense Ratio', value: fmtPct(result.expenseRatio), ok: result.expenseRatio >= 0.3 && result.expenseRatio <= 0.5 },
                { label: 'Cap Rate Support', value: result.capRateSupport, ok: result.capRateSupport !== 'weak' },
                { label: 'NOI Positive', value: result.netOperatingIncome > 0 ? 'Yes' : 'No', ok: result.netOperatingIncome > 0 },
                { label: 'Comparables Used', value: `${selectedComps.length} of ${DEMO_COMPS.length}`, ok: selectedComps.length >= 3 },
              ].map((metric, i) => (
                <div key={i} className='flex items-center justify-between text-sm'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>{metric.label}</span>
                  <span
                    className='font-medium'
                    style={{ color: metric.ok ? 'hsl(var(--tf-success-hs) 45%)' : 'hsl(var(--tf-warning-hs) 50%)' }}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
