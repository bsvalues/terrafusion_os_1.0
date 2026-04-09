/**
 * CompsForge Module — Sales Comparison Approach
 * ===================================================================
 * Constitutional module of TerraForge (Article V Section 5.1).
 *
 * Provides comparable sales analysis for property valuation.
 * Uses Benton County comparable sale data with paired adjustments.
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
  BarChart3,
  MapPin,
  Calendar,
  Ruler,
  Home,
  ArrowUpDown,
  CheckCircle2,
  DollarSign,
  Search,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ComparableSale {
  id: string;
  parcelId: string;
  address: string;
  saleDate: string;
  salePrice: number;
  squareFeet: number;
  yearBuilt: number;
  quality: string;
  condition: string;
  bedrooms: number;
  bathrooms: number;
  garageSize: number;
  lotSize: number;
  distanceMiles: number;
  neighborhood: string;
}

interface AdjustmentItem {
  category: string;
  amount: number;
  percent: number;
}

type SortKey = 'distance' | 'price' | 'date' | 'size';

// ============================================================================
// Demo Comparable Sales (Benton County)
// ============================================================================

const DEMO_COMPS: ComparableSale[] = [
  {
    id: 'comp-1',
    parcelId: '1-0935-100-0001-001',
    address: '2341 Jadwin Ave, Richland',
    saleDate: '2024-11-15',
    salePrice: 385000,
    squareFeet: 2150,
    yearBuilt: 2008,
    quality: 'Good',
    condition: 'Good',
    bedrooms: 4,
    bathrooms: 2.5,
    garageSize: 480,
    lotSize: 7200,
    distanceMiles: 0.4,
    neighborhood: 'South Richland',
  },
  {
    id: 'comp-2',
    parcelId: '1-0935-200-0045-002',
    address: '1128 Thayer Dr, Richland',
    saleDate: '2024-09-22',
    salePrice: 342000,
    squareFeet: 1850,
    yearBuilt: 2003,
    quality: 'Standard',
    condition: 'Good',
    bedrooms: 3,
    bathrooms: 2,
    garageSize: 400,
    lotSize: 6500,
    distanceMiles: 0.8,
    neighborhood: 'South Richland',
  },
  {
    id: 'comp-3',
    parcelId: '1-1023-300-0012-003',
    address: '4520 Desert Plateau Ct, West Richland',
    saleDate: '2024-12-03',
    salePrice: 425000,
    squareFeet: 2400,
    yearBuilt: 2015,
    quality: 'Good',
    condition: 'Excellent',
    bedrooms: 4,
    bathrooms: 3,
    garageSize: 576,
    lotSize: 8500,
    distanceMiles: 2.1,
    neighborhood: 'West Richland',
  },
  {
    id: 'comp-4',
    parcelId: '1-0880-100-0078-004',
    address: '3015 Duportail St, Richland',
    saleDate: '2025-01-08',
    salePrice: 298000,
    squareFeet: 1680,
    yearBuilt: 1998,
    quality: 'Standard',
    condition: 'Average',
    bedrooms: 3,
    bathrooms: 2,
    garageSize: 400,
    lotSize: 6000,
    distanceMiles: 1.3,
    neighborhood: 'Central Richland',
  },
  {
    id: 'comp-5',
    parcelId: '1-1100-200-0023-005',
    address: '6012 W Canal Dr, Kennewick',
    saleDate: '2024-10-30',
    salePrice: 365000,
    squareFeet: 2050,
    yearBuilt: 2010,
    quality: 'Good',
    condition: 'Good',
    bedrooms: 4,
    bathrooms: 2.5,
    garageSize: 440,
    lotSize: 7000,
    distanceMiles: 3.5,
    neighborhood: 'South Kennewick',
  },
  {
    id: 'comp-6',
    parcelId: '1-0990-100-0056-006',
    address: '812 Meadow Hills Dr, Richland',
    saleDate: '2024-08-14',
    salePrice: 415000,
    squareFeet: 2300,
    yearBuilt: 2012,
    quality: 'High',
    condition: 'Good',
    bedrooms: 4,
    bathrooms: 3,
    garageSize: 528,
    lotSize: 8000,
    distanceMiles: 1.0,
    neighborhood: 'Meadow Hills',
  },
];

// ============================================================================
// Adjustment Engine
// ============================================================================

const SUBJECT_DEFAULTS = {
  squareFeet: 2000,
  yearBuilt: 2005,
  quality: 'Standard',
  condition: 'Good',
  garageSize: 400,
  lotSize: 7000,
};

function calculateAdjustments(comp: ComparableSale): AdjustmentItem[] {
  const adjustments: AdjustmentItem[] = [];

  // Time adjustment (0.3% per month from Jan 2025)
  const saleDate = new Date(comp.saleDate);
  const baseline = new Date('2025-01-01');
  const monthsDiff = (baseline.getTime() - saleDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
  if (Math.abs(monthsDiff) > 0.5) {
    const timeAdj = monthsDiff * 0.003 * comp.salePrice;
    adjustments.push({ category: 'Time', amount: timeAdj, percent: monthsDiff * 0.3 });
  }

  // Size adjustment ($75/sqft difference
  const sizeDiff = SUBJECT_DEFAULTS.squareFeet - comp.squareFeet;
  if (Math.abs(sizeDiff) > 50) {
    const sizeAdj = sizeDiff * 75;
    adjustments.push({ category: 'Size', amount: sizeAdj, percent: (sizeAdj / comp.salePrice) * 100 });
  }

  // Age adjustment ($1500/yr difference
  const ageDiff = comp.yearBuilt - SUBJECT_DEFAULTS.yearBuilt;
  if (Math.abs(ageDiff) > 1) {
    const ageAdj = -ageDiff * 1500;
    adjustments.push({ category: 'Age', amount: ageAdj, percent: (ageAdj / comp.salePrice) * 100 });
  }

  // Quality adjustment
  const qualityMap: Record<string, number> = { Economy: -2, Standard: 0, Good: 1, High: 2, Luxury: 3 };
  const qualDiff = (qualityMap[SUBJECT_DEFAULTS.quality] ?? 0) - (qualityMap[comp.quality] ?? 0);
  if (qualDiff !== 0) {
    const qualAdj = qualDiff * 12000;
    adjustments.push({ category: 'Quality', amount: qualAdj, percent: (qualAdj / comp.salePrice) * 100 });
  }

  // Condition adjustment
  const condMap: Record<string, number> = { Poor: -2, Fair: -1, Average: 0, Good: 1, Excellent: 2 };
  const condDiff = (condMap[SUBJECT_DEFAULTS.condition] ?? 0) - (condMap[comp.condition] ?? 0);
  if (condDiff !== 0) {
    const condAdj = condDiff * 8000;
    adjustments.push({ category: 'Condition', amount: condAdj, percent: (condAdj / comp.salePrice) * 100 });
  }

  // Location/distance adjustment (farther = less reliable, small penalty)
  if (comp.distanceMiles > 2) {
    const locAdj = -(comp.distanceMiles - 2) * 2000;
    adjustments.push({ category: 'Location', amount: locAdj, percent: (locAdj / comp.salePrice) * 100 });
  }

  // Garage adjustment ($40/sqft difference
  const garageDiff = SUBJECT_DEFAULTS.garageSize - comp.garageSize;
  if (Math.abs(garageDiff) > 20) {
    const garageAdj = garageDiff * 40;
    adjustments.push({ category: 'Garage', amount: garageAdj, percent: (garageAdj / comp.salePrice) * 100 });
  }

  // Lot size adjustment ($3/sqft lot
  const lotDiff = SUBJECT_DEFAULTS.lotSize - comp.lotSize;
  if (Math.abs(lotDiff) > 200) {
    const lotAdj = lotDiff * 3;
    adjustments.push({ category: 'Lot Size', amount: lotAdj, percent: (lotAdj / comp.salePrice) * 100 });
  }

  return adjustments;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// Component
// ============================================================================

export default function CompsForgeModule() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['comp-1', 'comp-2', 'comp-4']));
  const [sortKey, setSortKey] = useState<SortKey>('distance');
  const [maxDistance, setMaxDistance] = useState(5);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredComps = useMemo(() => {
    const filtered = DEMO_COMPS.filter((c) => c.distanceMiles <= maxDistance);
    return filtered.sort((a, b) => {
      switch (sortKey) {
        case 'distance': return a.distanceMiles - b.distanceMiles;
        case 'price': return a.salePrice - b.salePrice;
        case 'date': return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
        case 'size': return a.squareFeet - b.squareFeet;
        default: return 0;
      }
    });
  }, [sortKey, maxDistance]);

  const selectedComps = filteredComps.filter((c) => selectedIds.has(c.id));

  const reconciled = useMemo(() => {
    if (selectedComps.length === 0) return null;
    const adjustedValues = selectedComps.map((comp) => {
      const adjs = calculateAdjustments(comp);
      const totalAdj = adjs.reduce((sum, a) => sum + a.amount, 0);
      return comp.salePrice + totalAdj;
    });
    const sorted = [...adjustedValues].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const average = adjustedValues.reduce((s, v) => s + v, 0) / adjustedValues.length;
    return { median, average, low: sorted[0], high: sorted[sorted.length - 1], count: selectedComps.length };
  }, [selectedComps]);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <BarChart3 style={{ color: 'hsl(var(--tf-suite-forge))' }} size={28} />
          CompsForge — Sales Comparison
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Comparable sales analysis with paired adjustments — Benton County MLS data
        </p>
      </div>

      {/* Data source disclosure — remove when wired to real PACS comparable sales API */}
      <div
        role='status'
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid hsl(var(--tf-warning-amber) / 0.3)',
          background: 'hsl(var(--tf-warning-amber) / 0.08)',
          color: 'hsl(var(--tf-warning-amber))',
          fontSize: '12px',
        }}
      >
        Demo data — CompsForge is running on 6 hardcoded Benton County comparable sales. Real PACS comparable sales API is deferred to v1.1.
      </div>

      {/* Controls */}
      <div className='flex items-center gap-4 flex-wrap'>
        <div className='flex items-center gap-2'>
          <Label className='text-sm shrink-0' style={{ color: 'hsl(var(--tf-muted))' }}>Sort by</Label>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger
              className='w-[140px]'
              style={{
                background: 'hsl(var(--tf-bg))',
                borderColor: 'hsl(var(--tf-border))',
                color: 'hsl(var(--tf-fg))',
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='distance'>Distance</SelectItem>
              <SelectItem value='price'>Price</SelectItem>
              <SelectItem value='date'>Date</SelectItem>
              <SelectItem value='size'>Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-2'>
          <Label className='text-sm shrink-0' style={{ color: 'hsl(var(--tf-muted))' }}>Max distance</Label>
          <Input
            type='number'
            min={0.5}
            max={20}
            step={0.5}
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className='w-[80px]'
            style={{
              background: 'hsl(var(--tf-bg))',
              borderColor: 'hsl(var(--tf-border))',
              color: 'hsl(var(--tf-fg))',
            }}
          />
          <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>mi</span>
        </div>

        <Badge variant='outline' style={{ color: 'hsl(var(--tf-fg))' }}>
          {selectedIds.size} selected / {filteredComps.length} shown
        </Badge>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Comp Cards */}
        <div className='lg:col-span-2 space-y-3'>
          {filteredComps.map((comp) => {
            const isSelected = selectedIds.has(comp.id);
            const adjustments = calculateAdjustments(comp);
            const totalAdj = adjustments.reduce((sum, a) => sum + a.amount, 0);
            const adjustedPrice = comp.salePrice + totalAdj;

            return (
              <Card
                key={comp.id}
                className='cursor-pointer transition-all duration-200'
                onClick={() => toggleSelect(comp.id)}
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  borderColor: isSelected ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-border))',
                  borderWidth: isSelected ? '2px' : '1px',
                }}
              >
                <CardContent className='pt-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        {isSelected && (
                          <CheckCircle2 size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                        )}
                        <span className='font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {comp.address}
                        </span>
                      </div>
                      <p className='text-xs mt-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                        Parcel: {comp.parcelId}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {formatCurrency(comp.salePrice)}
                      </p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {formatCurrency(comp.salePrice / comp.squareFeet)}/sqft
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 mt-3 text-xs flex-wrap' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <span className='flex items-center gap-1'>
                      <Calendar size={12} />
                      {new Date(comp.saleDate).toLocaleDateString()}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Ruler size={12} />
                      {comp.squareFeet.toLocaleString()} sqft
                    </span>
                    <span className='flex items-center gap-1'>
                      <Home size={12} />
                      {comp.bedrooms}bd/{comp.bathrooms}ba • {comp.yearBuilt}
                    </span>
                    <span className='flex items-center gap-1'>
                      <MapPin size={12} />
                      {comp.distanceMiles} mi
                    </span>
                  </div>

                  {isSelected && adjustments.length > 0 && (
                    <div className='mt-3 pt-3' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                        {adjustments.map((adj) => (
                          <div key={adj.category} className='text-xs'>
                            <span style={{ color: 'hsl(var(--tf-muted))' }}>{adj.category}</span>
                            <span
                              className='ml-1 font-medium'
                              style={{
                                color: adj.amount >= 0
                                  ? 'hsl(var(--tf-success, 140 70% 50%))'
                                  : 'hsl(var(--tf-danger, 0 70% 60%))',
                              }}
                            >
                              {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className='flex justify-between mt-2 pt-2 text-sm' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                        <span style={{ color: 'hsl(var(--tf-muted))' }}>Adjusted Value</span>
                        <span className='font-semibold' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                          {formatCurrency(adjustedPrice)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Reconciliation Panel */}
        <div className='space-y-4'>
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-suite-forge) / 0.3)',
            }}
          >
            <CardHeader>
              <CardTitle
                className='text-lg flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                <DollarSign size={20} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Reconciliation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reconciled ? (
                <div className='space-y-4'>
                  <div className='text-center space-y-1'>
                    <p className='text-xs uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Indicated Value (Median)
                    </p>
                    <p
                      className='text-3xl font-bold'
                      style={{ color: 'hsl(var(--tf-fg))' }}
                    >
                      {formatCurrency(reconciled.median)}
                    </p>
                    <Badge className='bg-green-500/20 text-green-400 border-green-500/30' variant='outline'>
                      {reconciled.count} comps selected
                    </Badge>
                  </div>

                  <Separator style={{ background: 'hsl(var(--tf-border))' }} />

                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Average</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.average)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Low</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.low)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>High</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.high)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Range</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>
                        {formatCurrency(reconciled.high - reconciled.low)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Search size={32} className='mx-auto mb-3' style={{ color: 'hsl(var(--tf-muted) / 0.4)' }} />
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Select comparable sales to reconcile a value
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Property Summary */}
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
                <Home size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Subject Property
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 text-sm'>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Size</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{SUBJECT_DEFAULTS.squareFeet.toLocaleString()} sqft</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Year Built</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{SUBJECT_DEFAULTS.yearBuilt}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Quality</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{SUBJECT_DEFAULTS.quality}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Condition</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{SUBJECT_DEFAULTS.condition}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Garage</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{SUBJECT_DEFAULTS.garageSize} sqft</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Lot</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{SUBJECT_DEFAULTS.lotSize.toLocaleString()} sqft</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
