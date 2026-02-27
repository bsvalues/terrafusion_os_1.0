/**
 * CostForge Module — Benton County Cost Approach Calculator
 * ===================================================================
 * Constitutional module of TerraForge (Article V Section 5.1).
 *
 * Lineage: BCBSCOSTApp → TerraBuild → TerraFusionBuild → CostForge → TerraForge
 *
 * ALL cost data is Benton County's OWN cost approach system.
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Hammer, Calculator, TrendingUp, BarChart3, DollarSign, Building2, MapPin } from 'lucide-react';
import {
  BUILDING_TYPES,
  QUALITY_LEVELS,
  CONDITION_OPTIONS,
  REGIONS,
  calculateCost,
  type CostCalculationInput,
  type CostCalculationResult,
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

const DEFAULT_INPUTS: CostCalculationInput = {
  buildingType: 'RES',
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

  const result: CostCalculationResult = useMemo(() => calculateCost(inputs), [inputs]);

  const updateInput = useCallback(<K extends keyof CostCalculationInput>(
    key: K,
    value: CostCalculationInput[K],
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Hammer style={{ color: 'hsl(var(--tf-suite-forge))' }} size={28} />
          CostForge Calculator
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Benton County Cost Approach — 89,247 parcels • Matrix Year 2025
        </p>
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
                      {BUILDING_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label} (${t.baseRate}/sqft)
                        </SelectItem>
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
                          {q.label} (×{q.factor})
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
                          {c.label} (×{c.factor})
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
                        {r.label} (×{r.factor.toFixed(2)})
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
                  <span>Simple (×0.80)</span>
                  <span>Average (×1.00)</span>
                  <span>Complex (×1.20)</span>
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
        </div>

        {/* Results Panel */}
        <div className='space-y-4'>
          {/* Total Value Card */}
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-suite-forge) / 0.3)',
            }}
          >
            <CardContent className='pt-6'>
              <div className='text-center space-y-2'>
                <DollarSign
                  size={32}
                  className='mx-auto'
                  style={{ color: 'hsl(var(--tf-suite-forge))' }}
                />
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Estimated Replacement Cost
                </p>
                <p
                  className='text-3xl font-bold'
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  {formatCurrency(result.totalCost)}
                </p>
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {formatCurrency(result.costPerSqFt)}/sqft
                </p>
                <Badge className={CONFIDENCE_COLORS[result.confidence]} variant='outline'>
                  {result.confidence} Confidence
                </Badge>
              </div>
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
                    ×{value.toFixed(3)}
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
                  <TrendingUp size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
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
                  <span style={{ color: 'hsl(var(--tf-fg))' }}>Total</span>
                  <span style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                    {formatCurrency(result.totalCost)}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
