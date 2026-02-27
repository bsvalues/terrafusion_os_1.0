/**
 * CostForge Module — Benton County Cost Approach Calculator
 * ===================================================================
 * Constitutional module of TerraForge (Article V Section 5.1).
 *
 * Lineage: BCBSCOSTApp → TerraBuild → TerraFusionBuild → CostForge → TerraForge
 *
 * ALL cost data is Benton County's OWN cost approach system.
 * Matrix data: 42 entries (14 building types × 3 regions) from Harris PACS 9.0.
 */

import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Hammer,
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Building2,
  MapPin,
  Database,
  Save,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import {
  BUILDING_TYPES,
  QUALITY_LEVELS,
  CONDITION_OPTIONS,
  REGIONS,
  calculateCost,
  getRegionalComparison,
  getMatrixRegion,
  saveScenario,
  loadScenarios,
  deleteScenario,
  type CostCalculationInput,
  type CostCalculationResult,
  type CostScenario,
} from '@/services/forgeService';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const CONFIDENCE_COLORS = {
  LOW: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  HIGH: 'bg-green-500/20 text-green-400 border-green-500/30',
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  institutional: 'Institutional',
  agricultural: 'Agricultural',
};

const DEFAULT_INPUTS: CostCalculationInput = {
  buildingType: '100',
  quality: 'STD',
  condition: 'AVG',
  region: 'BC-RICHLAND',
  squareFeet: 2000,
  yearBuilt: 2005,
  stories: 1,
  complexity: 50,
  basement: false,
  basementFinished: false,
  garageSize: 400,
};

export default function CostForgeModule() {
  const [inputs, setInputs] = useState<CostCalculationInput>(DEFAULT_INPUTS);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [scenarios, setScenarios] = useState<CostScenario[]>(() => loadScenarios());
  const [scenarioName, setScenarioName] = useState('');
  const [compareId, setCompareId] = useState<string | null>(null);

  const result: CostCalculationResult = useMemo(() => calculateCost(inputs), [inputs]);

  const regional = useMemo(
    () => getRegionalComparison(inputs.buildingType),
    [inputs.buildingType],
  );

  const currentMatrixRegion = useMemo(
    () => getMatrixRegion(inputs.region),
    [inputs.region],
  );

  const updateInput = useCallback(
    <K extends keyof CostCalculationInput>(key: K, value: CostCalculationInput[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;
    const s = saveScenario(scenarioName.trim(), inputs, result);
    setScenarios((prev) => [...prev, s]);
    setScenarioName('');
  }, [scenarioName, inputs, result]);

  const handleDeleteScenario = useCallback((id: string) => {
    deleteScenario(id);
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    setCompareId((prev) => (prev === id ? null : prev));
  }, []);

  const compareScenario = scenarios.find((s) => s.id === compareId);

  // Group building types by category
  const groupedTypes = useMemo(() => {
    const groups: Record<string, typeof BUILDING_TYPES[number][]> = {};
    for (const t of BUILDING_TYPES) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return groups;
  }, []);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h2
            className='text-2xl font-semibold flex items-center gap-3'
            style={{ color: 'hsl(var(--tf-fg))' }}
          >
            <Hammer style={{ color: 'hsl(var(--tf-suite-forge))' }} size={28} />
            CostForge Calculator
          </h2>
          <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
            Benton County Cost Approach — 89,247 parcels • Matrix Year 2025 • 14 building types × 3 regions
          </p>
        </div>
        {result.matrixSource && (
          <Badge
            variant='outline'
            className='flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border-blue-500/30'
          >
            <Database size={12} />
            Matrix #{result.matrixSource.sourceMatrixId} • {result.matrixSource.dataPoints} pts
          </Badge>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Input Panel */}
        <div className='lg:col-span-2 space-y-4'>
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-border))',
            }}
          >
            <CardHeader>
              <CardTitle
                className='text-lg flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                <Building2 size={20} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Property Details
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Enter property characteristics for cost estimation
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Row 1: Type + Quality + Condition */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Building Type</Label>
                  <Select
                    value={inputs.buildingType}
                    onValueChange={(v) => updateInput('buildingType', v)}
                  >
                    <SelectTrigger
                      style={{
                        background: 'hsl(var(--tf-bg))',
                        borderColor: 'hsl(var(--tf-border))',
                        color: 'hsl(var(--tf-fg))',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupedTypes).map(([cat, types]) => (
                        <SelectGroup key={cat}>
                          <SelectLabel>{CATEGORY_LABELS[cat] ?? cat}</SelectLabel>
                          {types.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              [{t.code}] {t.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Quality</Label>
                  <Select
                    value={inputs.quality}
                    onValueChange={(v) => updateInput('quality', v)}
                  >
                    <SelectTrigger
                      style={{
                        background: 'hsl(var(--tf-bg))',
                        borderColor: 'hsl(var(--tf-border))',
                        color: 'hsl(var(--tf-fg))',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALITY_LEVELS.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.label} ({'\u00d7'}{q.factor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Condition</Label>
                  <Select
                    value={inputs.condition}
                    onValueChange={(v) => updateInput('condition', v)}
                  >
                    <SelectTrigger
                      style={{
                        background: 'hsl(var(--tf-bg))',
                        borderColor: 'hsl(var(--tf-border))',
                        color: 'hsl(var(--tf-fg))',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label} ({'\u00d7'}{c.factor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Region */}
              <div className='space-y-2'>
                <Label
                  className='flex items-center gap-2'
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  <MapPin size={14} /> Region
                  <span className='text-xs ml-2' style={{ color: 'hsl(var(--tf-muted))' }}>
                    (Matrix: {currentMatrixRegion})
                  </span>
                </Label>
                <Select
                  value={inputs.region}
                  onValueChange={(v) => updateInput('region', v)}
                >
                  <SelectTrigger
                    style={{
                      background: 'hsl(var(--tf-bg))',
                      borderColor: 'hsl(var(--tf-border))',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label} ({'\u00d7'}{r.factor.toFixed(2)}) — {r.matrixRegion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} />

              {/* Row 3: Sq Ft, Year Built, Stories */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Square Footage</Label>
                  <Input
                    type='number'
                    min={100}
                    max={100000}
                    value={inputs.squareFeet}
                    onChange={(e) => updateInput('squareFeet', Number(e.target.value))}
                    style={{
                      background: 'hsl(var(--tf-bg))',
                      borderColor: 'hsl(var(--tf-border))',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                </div>

                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Year Built</Label>
                  <Input
                    type='number'
                    min={1850}
                    max={new Date().getFullYear()}
                    value={inputs.yearBuilt}
                    onChange={(e) => updateInput('yearBuilt', Number(e.target.value))}
                    style={{
                      background: 'hsl(var(--tf-bg))',
                      borderColor: 'hsl(var(--tf-border))',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                </div>

                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Stories</Label>
                  <Input
                    type='number'
                    min={1}
                    max={10}
                    value={inputs.stories}
                    onChange={(e) => updateInput('stories', Number(e.target.value))}
                    style={{
                      background: 'hsl(var(--tf-bg))',
                      borderColor: 'hsl(var(--tf-border))',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Complexity Slider */}
              <div className='space-y-2'>
                <Label style={{ color: 'hsl(var(--tf-fg))' }}>
                  Complexity Factor: {inputs.complexity}%
                </Label>
                <input
                  type='range'
                  min={0}
                  max={100}
                  value={inputs.complexity}
                  onChange={(e) => updateInput('complexity', Number(e.target.value))}
                  className='w-full'
                />
                <div
                  className='flex justify-between text-xs'
                  style={{ color: 'hsl(var(--tf-muted))' }}
                >
                  <span>Simple ({'\u00d7'}0.80)</span>
                  <span>Average ({'\u00d7'}1.00)</span>
                  <span>Complex ({'\u00d7'}1.20)</span>
                </div>
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} />

              {/* Row 5: Basement + Garage */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <Switch
                      checked={inputs.basement}
                      onCheckedChange={(v) => updateInput('basement', v)}
                    />
                    <Label style={{ color: 'hsl(var(--tf-fg))' }}>Basement</Label>
                  </div>
                  {inputs.basement && (
                    <div className='flex items-center gap-3 ml-10'>
                      <Switch
                        checked={inputs.basementFinished}
                        onCheckedChange={(v) => updateInput('basementFinished', v)}
                      />
                      <Label style={{ color: 'hsl(var(--tf-muted))' }}>
                        Finished ({inputs.basementFinished ? '90%' : '50%'} value)
                      </Label>
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label style={{ color: 'hsl(var(--tf-fg))' }}>Garage (sq ft)</Label>
                  <Input
                    type='number'
                    min={0}
                    max={2000}
                    value={inputs.garageSize}
                    onChange={(e) => updateInput('garageSize', Number(e.target.value))}
                    style={{
                      background: 'hsl(var(--tf-bg))',
                      borderColor: 'hsl(var(--tf-border))',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Comparison Card */}
          {regional.eastern && regional.central && regional.western && (
            <Card
              style={{
                background: 'hsl(var(--tf-card-bg))',
                borderColor: 'hsl(var(--tf-border))',
              }}
            >
              <CardHeader className='pb-2'>
                <CardTitle
                  className='text-sm flex items-center gap-2'
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  <MapPin size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                  Regional Cost Comparison — {BUILDING_TYPES.find((t) => t.id === inputs.buildingType)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {(['Eastern', 'Central', 'Western'] as const).map((region) => {
                  const entry = regional[region.toLowerCase() as 'eastern' | 'central' | 'western'];
                  if (!entry) return null;
                  const isActive = currentMatrixRegion === region;
                  const max = Math.max(
                    regional.eastern?.baseCost ?? 0,
                    regional.central?.baseCost ?? 0,
                    regional.western?.baseCost ?? 0,
                  );
                  const pct = max > 0 ? (entry.baseCost / max) * 100 : 0;
                  return (
                    <div key={region} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span
                          style={{
                            color: isActive ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-muted))',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {region} {isActive && '(selected)'}
                        </span>
                        <span style={{ color: 'hsl(var(--tf-fg))' }}>
                          {formatCurrency(entry.baseCost)}
                        </span>
                      </div>
                      <div
                        className='h-2 rounded-full overflow-hidden'
                        style={{ background: 'hsl(var(--tf-border))' }}
                      >
                        <div
                          className='h-full rounded-full transition-all duration-500'
                          style={{
                            width: `${pct}%`,
                            background: isActive
                              ? 'hsl(var(--tf-suite-forge))'
                              : 'hsl(var(--tf-muted) / 0.4)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Save Scenario */}
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-border))',
            }}
          >
            <CardContent className='pt-4'>
              <div className='flex items-center gap-3'>
                <Input
                  placeholder='Scenario name...'
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveScenario()}
                  style={{
                    background: 'hsl(var(--tf-bg))',
                    borderColor: 'hsl(var(--tf-border))',
                    color: 'hsl(var(--tf-fg))',
                  }}
                />
                <Button
                  onClick={handleSaveScenario}
                  disabled={!scenarioName.trim()}
                  size='sm'
                  className='shrink-0'
                >
                  <Save size={14} className='mr-1.5' />
                  Save
                </Button>
              </div>
              {scenarios.length > 0 && (
                <div className='mt-3 space-y-2'>
                  <p className='text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>
                    Saved Scenarios ({scenarios.length})
                  </p>
                  {scenarios.map((s) => (
                    <div
                      key={s.id}
                      className='flex items-center justify-between text-sm rounded-lg px-3 py-2'
                      style={{
                        background: compareId === s.id ? 'hsl(var(--tf-suite-forge) / 0.1)' : 'hsl(var(--tf-bg))',
                        borderColor: compareId === s.id ? 'hsl(var(--tf-suite-forge) / 0.3)' : 'transparent',
                        border: '1px solid',
                      }}
                    >
                      <button
                        onClick={() => setCompareId(compareId === s.id ? null : s.id)}
                        className='flex-1 text-left'
                      >
                        <span style={{ color: 'hsl(var(--tf-fg))' }}>{s.name}</span>
                        <span className='ml-2' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {formatCurrency(s.result.rcnld)}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(s.id)}
                        className='p-1 rounded hover:bg-white/10 transition-colors'
                      >
                        <Trash2 size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className='space-y-4'>
          {/* RCN Pipeline Card */}
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-suite-forge) / 0.3)',
            }}
          >
            <CardContent className='pt-6 space-y-4'>
              <div className='text-center space-y-1'>
                <DollarSign
                  size={28}
                  className='mx-auto'
                  style={{ color: 'hsl(var(--tf-suite-forge))' }}
                />
                <p className='text-xs uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                  RCNLD (Final Value)
                </p>
                <p
                  className='text-3xl font-bold'
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  {formatCurrency(result.rcnld)}
                </p>
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {formatCurrency(result.costPerSqFt)}/sqft
                </p>
                <Badge className={CONFIDENCE_COLORS[result.confidence]} variant='outline'>
                  {result.confidence} Confidence
                </Badge>
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} />

              {/* RCN Pipeline */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='flex items-center gap-1.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <TrendingUp size={14} /> RCN (New)
                  </span>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(result.rcnNew)}</span>
                </div>
                <div className='flex items-center justify-center'>
                  <ArrowRight size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='flex items-center gap-1.5' style={{ color: 'hsl(var(--tf-danger, 0 70% 60%))' }}>
                    <TrendingDown size={14} /> Depreciation
                  </span>
                  <span style={{ color: 'hsl(var(--tf-danger, 0 70% 60%))' }}>
                    -{formatCurrency(result.depreciation)}
                  </span>
                </div>
                <div className='flex items-center justify-center'>
                  <ArrowRight size={14} style={{ color: 'hsl(var(--tf-muted))' }} />
                </div>
                <div className='flex items-center justify-between text-sm font-semibold'>
                  <span style={{ color: 'hsl(var(--tf-suite-forge))' }}>RCNLD</span>
                  <span style={{ color: 'hsl(var(--tf-suite-forge))' }}>{formatCurrency(result.rcnld)}</span>
                </div>
              </div>

              {/* Compare overlay */}
              {compareScenario && (
                <>
                  <Separator style={{ background: 'hsl(var(--tf-border))' }} />
                  <div className='space-y-1'>
                    <p className='text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>
                      vs. {compareScenario.name}
                    </p>
                    <div className='flex items-center justify-between text-sm'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Saved RCNLD</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>
                        {formatCurrency(compareScenario.result.rcnld)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm font-semibold'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Difference</span>
                      <span
                        style={{
                          color:
                            result.rcnld > compareScenario.result.rcnld
                              ? 'hsl(var(--tf-success, 140 70% 50%))'
                              : 'hsl(var(--tf-danger, 0 70% 60%))',
                        }}
                      >
                        {result.rcnld > compareScenario.result.rcnld ? '+' : ''}
                        {formatCurrency(result.rcnld - compareScenario.result.rcnld)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Factors Card */}
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-border))',
            }}
          >
            <CardHeader className='pb-2'>
              <CardTitle
                className='text-sm flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                <BarChart3 size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Applied Factors
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {Object.entries(result.factors).map(([key, value]) => (
                <div key={key} className='flex justify-between text-sm'>
                  <span
                    className='capitalize'
                    style={{ color: 'hsl(var(--tf-muted))' }}
                  >
                    {key}
                  </span>
                  <span
                    style={{
                      color:
                        value < 1
                          ? 'hsl(var(--tf-danger, 0 70% 60%))'
                          : value > 1
                            ? 'hsl(var(--tf-success, 140 70% 50%))'
                            : 'hsl(var(--tf-fg))',
                    }}
                  >
                    {'\u00d7'}{value.toFixed(3)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Breakdown Card */}
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-border))',
            }}
          >
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center justify-between'>
                <span
                  className='flex items-center gap-2'
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  <Calculator size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                  Cost Breakdown
                </span>
                <Switch checked={showBreakdown} onCheckedChange={setShowBreakdown} />
              </CardTitle>
            </CardHeader>
            {showBreakdown && (
              <CardContent className='space-y-1'>
                {result.breakdown.map((item) => (
                  <div key={item.category} className='flex justify-between text-sm'>
                    <span style={{ color: 'hsl(var(--tf-muted))' }}>{item.category}</span>
                    <span
                      style={{
                        color:
                          item.amount < 0
                            ? 'hsl(var(--tf-danger, 0 70% 60%))'
                            : 'hsl(var(--tf-fg))',
                      }}
                    >
                      {item.amount < 0 ? '-' : ''}
                      {formatCurrency(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
                <Separator style={{ background: 'hsl(var(--tf-border))' }} />
                <div className='flex justify-between text-sm font-semibold'>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>Total (RCNLD)</span>
                  <span style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                    {formatCurrency(result.rcnld)}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Matrix Source Card */}
          {result.matrixSource && (
            <Card
              style={{
                background: 'hsl(var(--tf-card-bg))',
                borderColor: 'hsl(var(--tf-border))',
              }}
            >
              <CardHeader className='pb-2'>
                <CardTitle
                  className='text-sm flex items-center gap-2'
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  <Database size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                  Matrix Provenance
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <div className='flex justify-between'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Source Matrix ID</span>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>#{result.matrixSource.sourceMatrixId}</span>
                </div>
                <div className='flex justify-between'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Data Points</span>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>{result.matrixSource.dataPoints.toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Region</span>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>{result.matrixSource.region}</span>
                </div>
                <div className='flex justify-between'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Matrix Year</span>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>{result.matrixSource.matrixYear}</span>
                </div>
                <div className='flex justify-between'>
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Cost Range</span>
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>
                    {formatCurrency(result.matrixSource.minCost)} — {formatCurrency(result.matrixSource.maxCost)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
