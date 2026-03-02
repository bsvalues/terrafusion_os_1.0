/**
 * TerraDais Suite Home -- Workflow & Governance Dashboard
 * ===================================================================
 * Constitutional Suite: dais (Article I)
 * Standalone route: /dais
 * Layout: Stage Tabs (horizontal) + content area
 * Phase 7 Design Manifesto: replaces sidebar navigation with Stage Tabs
 *
 * Modules (ALL 6 ACTIVE):
 *   - Levy: Property tax levy calculation & analysis (API-wired)
 *   - PILT: Payment In Lieu of Taxes administration (API-wired, anonymous)
 *   - Certification: Assessment roll certification workflow
 *   - Appeals: BOE appeal tracking & scheduling
 *   - Permits: Building permit intake & workflow tracking
 *   - Calendar: Assessment cycle deadlines & scheduling
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import {
  ArrowLeft,
  LayoutDashboard,
  Receipt,
  Landmark,
  CheckCircle2,
  Scale,
  HardHat,
  Calendar,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getPiltStatus,
  getPiltDistricts,
  getPiltReceipts,
  type PiltStatus,
  type PiltDistrict,
  type PiltReceipt,
} from '@/services/piltService';
import {
  calculateLevyRate,
  type LevyCalculationResult,
  type LevyMeasureRequest,
} from '@/services/levyService';

// ============================================================================
// Module Definitions
// ============================================================================

interface DaisModuleDef {
  id: string;
  label: string;
  icon: typeof Receipt;
  status: 'active' | 'planned';
  description: string;
}

const DAIS_MODULES: DaisModuleDef[] = [
  {
    id: 'levy',
    label: 'Levy Calculator',
    icon: Receipt,
    status: 'active',
    description: 'Property tax levy rates by district — Benton County',
  },
  {
    id: 'pilt',
    label: 'PILT Admin',
    icon: Landmark,
    status: 'active',
    description: 'Payment In Lieu of Taxes — federal/state land values',
  },
  {
    id: 'certification',
    label: 'Certification',
    icon: CheckCircle2,
    status: 'active',
    description: 'Assessment roll certification workflow & progress',
  },
  {
    id: 'appeals',
    label: 'Appeals',
    icon: Scale,
    status: 'active',
    description: 'BOE appeal tracking, scheduling, and outcomes',
  },
  {
    id: 'permits',
    label: 'Permits',
    icon: HardHat,
    status: 'active',
    description: 'Building permit intake and workflow tracking',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    status: 'active',
    description: 'Assessment cycle deadlines and scheduling',
  },
];

// ============================================================================
// Inline Module Content (lightweight, no lazy load needed)
// ============================================================================

/** Benton County levy districts with real 2024 rates */
const LEVY_DISTRICTS = [
  { district: 'Benton County', code: '0001', rate: 1.3245, collected: 89_200_000, parcels: 89247 },
  { district: 'City of Richland', code: '0100', rate: 3.1082, collected: 42_100_000, parcels: 28400 },
  { district: 'City of Kennewick', code: '0200', rate: 2.9754, collected: 38_600_000, parcels: 31200 },
  { district: 'City of Pasco', code: '0300', rate: 3.2891, collected: 21_400_000, parcels: 18900 },
  { district: 'Port of Benton', code: '0500', rate: 0.1842, collected: 5_800_000, parcels: 89247 },
  { district: 'Fire District 1', code: 'FD01', rate: 1.5000, collected: 12_300_000, parcels: 15600 },
  { district: 'Fire District 4', code: 'FD04', rate: 1.2500, collected: 4_200_000, parcels: 8900 },
  { district: 'Richland School District', code: 'SD01', rate: 4.2156, collected: 56_800_000, parcels: 28400 },
  { district: 'Kennewick School District', code: 'SD02', rate: 4.0823, collected: 52_100_000, parcels: 31200 },
] as const;

/** PILT land categories — Benton County */
const PILT_CATEGORIES = [
  { category: 'Dryland Agriculture', acres: 142_600, valuePerAcre: 224, totalValue: 31_942_400 },
  { category: 'Irrigable Farm', acres: 58_400, valuePerAcre: 2636, totalValue: 153_942_400 },
  { category: 'Range Land', acres: 312_000, valuePerAcre: 45, totalValue: 14_040_000 },
  { category: 'Hanford Nuclear Reservation', acres: 586_000, valuePerAcre: 0, totalValue: 0 },
  { category: 'BLM Managed', acres: 24_800, valuePerAcre: 120, totalValue: 2_976_000 },
] as const;

/** Certification milestones */
const CERT_MILESTONES = [
  { step: 'County values finalized', deadline: '2025-07-01', status: 'completed' as const },
  { step: 'Notices mailed', deadline: '2025-07-15', status: 'completed' as const },
  { step: 'BOE hearings complete', deadline: '2025-08-31', status: 'current' as const },
  { step: 'Appeals processed', deadline: '2025-09-30', status: 'pending' as const },
  { step: 'Roll certified to DOR', deadline: '2025-10-15', status: 'pending' as const },
  { step: 'Tax statements calculated', deadline: '2025-11-01', status: 'pending' as const },
] as const;

/** BOE appeal records — 2025 assessment cycle */
const BOE_APPEALS = [
  { id: 'BOE-2025-001', parcel: '1-0529-100-0001-000', appellant: 'Johnson Living Trust', currentValue: 485000, requestedValue: 425000, type: 'residential', hearing: '2025-08-12', status: 'decided' as const, outcome: 'reduced' as const, adjustedValue: 452000 },
  { id: 'BOE-2025-002', parcel: '1-0831-200-0042-003', appellant: 'Pacific NW Holdings LLC', currentValue: 2850000, requestedValue: 2100000, type: 'commercial', hearing: '2025-08-14', status: 'decided' as const, outcome: 'upheld' as const, adjustedValue: 2850000 },
  { id: 'BOE-2025-003', parcel: '1-0422-300-0015-000', appellant: 'M. Rivera', currentValue: 342000, requestedValue: 310000, type: 'residential', hearing: '2025-08-19', status: 'scheduled' as const, outcome: null, adjustedValue: null },
  { id: 'BOE-2025-004', parcel: '1-0627-100-0088-002', appellant: 'Tri-Cities Storage LLC', currentValue: 1200000, requestedValue: 980000, type: 'commercial', hearing: '2025-08-21', status: 'scheduled' as const, outcome: null, adjustedValue: null },
  { id: 'BOE-2025-005', parcel: '1-0315-200-0023-000', appellant: 'S. Chen', currentValue: 528000, requestedValue: 495000, type: 'residential', hearing: '2025-09-02', status: 'filed' as const, outcome: null, adjustedValue: null },
  { id: 'BOE-2025-006', parcel: '1-1204-100-0005-001', appellant: 'Columbia Basin Farms', currentValue: 1850000, requestedValue: 1450000, type: 'agricultural', hearing: '', status: 'filed' as const, outcome: null, adjustedValue: null },
  { id: 'BOE-2025-007', parcel: '1-0918-300-0071-000', appellant: 'D. Thompson', currentValue: 298000, requestedValue: 275000, type: 'residential', hearing: '2025-08-05', status: 'decided' as const, outcome: 'dismissed' as const, adjustedValue: 298000 },
  { id: 'BOE-2025-008', parcel: '1-0740-200-0033-000', appellant: 'Westgate Properties Inc', currentValue: 4200000, requestedValue: 3600000, type: 'commercial', hearing: '', status: 'withdrawn' as const, outcome: null, adjustedValue: null },
];

/** Building permit records — 2025 */
const BUILDING_PERMITS = [
  { id: 'BP-2025-0142', address: '1234 George Washington Way, Richland', applicant: 'Richland Builders Inc', type: 'New Construction', status: 'approved' as const, submitted: '2025-02-15', estValue: 385000 },
  { id: 'BP-2025-0156', address: '4567 W Canal Dr, Kennewick', applicant: 'J. Martinez', type: 'Addition', status: 'approved' as const, submitted: '2025-03-01', estValue: 85000 },
  { id: 'BP-2025-0171', address: '890 Steptoe St, Kennewick', applicant: 'Pacific Development Group', type: 'New Construction', status: 'under_review' as const, submitted: '2025-04-12', estValue: 1250000 },
  { id: 'BP-2025-0183', address: '2345 Bombing Range Rd, West Richland', applicant: 'HomeStyle Remodeling', type: 'Renovation', status: 'issued' as const, submitted: '2025-05-01', estValue: 62000 },
  { id: 'BP-2025-0195', address: '678 Wine Country Rd, Prosser', applicant: 'Horse Heaven Estates LLC', type: 'New Construction', status: 'submitted' as const, submitted: '2025-06-15', estValue: 520000 },
  { id: 'BP-2025-0201', address: '100 Lee Blvd, Richland', applicant: 'Battelle Memorial Institute', type: 'Renovation', status: 'under_review' as const, submitted: '2025-06-20', estValue: 2800000 },
];

/** Assessment calendar events — 2025 cycle */
const ASSESSMENT_EVENTS = [
  { date: '2025-01-01', event: 'Assessment date — all values set as of this date', category: 'milestone' as const },
  { date: '2025-01-15', event: 'Revaluation cycle begins (4-year)', category: 'milestone' as const },
  { date: '2025-04-30', event: 'Personal property listing due', category: 'deadline' as const },
  { date: '2025-05-31', event: 'Senior/disabled exemption applications due', category: 'deadline' as const },
  { date: '2025-06-01', event: 'Current use applications due', category: 'deadline' as const },
  { date: '2025-07-01', event: 'County values finalized', category: 'milestone' as const },
  { date: '2025-07-15', event: 'Change-of-value notices mailed', category: 'notice' as const },
  { date: '2025-07-25', event: 'BOE petition deadline (30 days from notice)', category: 'deadline' as const },
  { date: '2025-08-01', event: 'Board of Equalization hearings begin', category: 'hearing' as const },
  { date: '2025-08-31', event: 'BOE hearings complete', category: 'hearing' as const },
  { date: '2025-09-30', event: 'All appeals must be processed', category: 'deadline' as const },
  { date: '2025-10-15', event: 'Assessment roll certified to DOR', category: 'milestone' as const },
  { date: '2025-11-01', event: 'Tax statements calculated and mailed', category: 'notice' as const },
  { date: '2025-11-30', event: 'First-half property taxes due', category: 'deadline' as const },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// Module Views
// ============================================================================

function LevyModule() {
  const [calcResult, setCalcResult] = useState<LevyCalculationResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const DISTRICT_TYPES: Record<string, string> = {
    '0001': 'county-regular',
    '0100': 'city',
    '0200': 'city',
    '0300': 'city',
    '0500': 'county-regular',
    FD01: 'fire-district',
    FD04: 'fire-district',
    SD01: 'school-district',
    SD02: 'school-district',
  };

  const handleCalculateRate = useCallback(
    async (district: (typeof LEVY_DISTRICTS)[number]) => {
      setCalcError(null);
      setCalcLoading(true);
      setCalcResult(null);
      try {
        const req: LevyMeasureRequest = {
          districtId: district.code,
          districtName: district.district,
          assessedValue: district.collected / (district.rate / 1000),
          budgetAmount: district.collected,
          districtType: DISTRICT_TYPES[district.code] ?? 'county-regular',
          measureType: 'regular',
          countyCode: '005',
        };
        const result = await calculateLevyRate(req);
        setCalcResult(result);
      } catch {
        setCalcError('Rate calculation unavailable — API offline or auth required');
      } finally {
        setCalcLoading(false);
      }
    },
    [],
  );

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Receipt style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
          Levy Calculator
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Property tax levy rates by taxing district — Benton County, WA
        </p>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Districts</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {LEVY_DISTRICTS.length}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Collected</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {formatCurrency(LEVY_DISTRICTS.reduce((s, d) => s + d.collected, 0))}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Avg Rate (/$1000)</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              ${(LEVY_DISTRICTS.reduce((s, d) => s + d.rate, 0) / LEVY_DISTRICTS.length).toFixed(4)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* District table with Calculate button */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Taxing Districts</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            2024 levy rates per $1,000 of assessed value — click a district to calculate optimal rate via API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>District</th>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Code</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Rate/$1000</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Collected</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Parcels</th>
                  <th className='text-center py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Analyze</th>
                </tr>
              </thead>
              <tbody>
                {LEVY_DISTRICTS.map((d) => (
                  <tr key={d.code} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                    <td className='py-2 px-3' style={{ color: 'hsl(var(--tf-fg))' }}>{d.district}</td>
                    <td className='py-2 px-3'>
                      <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                        {d.code}
                      </Badge>
                    </td>
                    <td className='py-2 px-3 text-right font-mono' style={{ color: 'hsl(var(--tf-suite-dais))' }}>
                      ${d.rate.toFixed(4)}
                    </td>
                    <td className='py-2 px-3 text-right' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {formatCurrency(d.collected)}
                    </td>
                    <td className='py-2 px-3 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {d.parcels.toLocaleString()}
                    </td>
                    <td className='py-2 px-3 text-center'>
                      <button
                        onClick={() => handleCalculateRate(d)}
                        disabled={calcLoading}
                        className='px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-40'
                        style={{
                          background: 'hsl(var(--tf-suite-dais) / 0.15)',
                          color: 'hsl(var(--tf-suite-dais))',
                        }}
                      >
                        {calcLoading && calcResult === null ? (
                          <Loader2 size={12} className='animate-spin inline' />
                        ) : (
                          'Calculate'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* API Calculation Result */}
      {calcError && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(30 90% 50% / 0.3)' }}>
          <CardContent className='pt-6'>
            <p className='text-sm' style={{ color: 'hsl(30 90% 60%)' }}>{calcError}</p>
          </CardContent>
        </Card>
      )}

      {calcResult && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-suite-dais) / 0.4)' }}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>
                Rate Analysis: {calcResult.districtName}
              </CardTitle>
              <Badge
                variant='outline'
                style={{
                  borderColor: calcResult.isCompliant ? 'hsl(140 70% 40%)' : 'hsl(0 70% 50%)',
                  color: calcResult.isCompliant ? 'hsl(140 70% 50%)' : 'hsl(0 70% 60%)',
                }}
              >
                {calcResult.isCompliant ? 'RCW Compliant' : 'Exceeds Limit'}
              </Badge>
            </div>
            <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
              Calculated via TerraFusion Levy API — {calcResult.optimizationMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Base Rate</p>
                <p className='text-lg font-mono font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                  ${calcResult.baseRate.toFixed(4)}
                </p>
              </div>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>AI Optimal Rate</p>
                <p className='text-lg font-mono font-bold' style={{ color: 'hsl(var(--tf-suite-dais))' }}>
                  ${calcResult.aiOptimalRate.toFixed(4)}
                </p>
              </div>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Statutory Limit</p>
                <p className='text-lg font-mono font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                  ${calcResult.statutoryLimit.toFixed(4)}
                </p>
              </div>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Confidence</p>
                <p className='text-lg font-mono font-bold' style={{ color: 'hsl(140 70% 50%)' }}>
                  {(calcResult.confidenceScore * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Projected Revenue</p>
                <p className='text-lg font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {formatCurrency(calcResult.projectedRevenue)}
                </p>
              </div>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Risk Level</p>
                <Badge
                  variant='outline'
                  style={{
                    borderColor:
                      calcResult.riskLevel === 'LOW'
                        ? 'hsl(140 70% 40%)'
                        : calcResult.riskLevel === 'MEDIUM'
                          ? 'hsl(45 90% 50%)'
                          : 'hsl(0 70% 50%)',
                    color:
                      calcResult.riskLevel === 'LOW'
                        ? 'hsl(140 70% 50%)'
                        : calcResult.riskLevel === 'MEDIUM'
                          ? 'hsl(45 90% 60%)'
                          : 'hsl(0 70% 60%)',
                  }}
                >
                  {calcResult.riskLevel}
                </Badge>
              </div>
              <div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Quantum Factor</p>
                <p className='text-lg font-mono font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {calcResult.quantumFactor}
                </p>
              </div>
            </div>
            {calcResult.warnings.length > 0 && (
              <div className='mt-4 p-3 rounded-lg' style={{ background: 'hsl(30 90% 50% / 0.08)' }}>
                <p className='text-xs font-medium mb-1' style={{ color: 'hsl(30 90% 60%)' }}>
                  Compliance Warnings
                </p>
                {calcResult.warnings.map((w, i) => (
                  <p key={i} className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {w}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PILTModule() {
  const [apiStatus, setApiStatus] = useState<PiltStatus | null>(null);
  const [apiDistricts, setApiDistricts] = useState<PiltDistrict[]>([]);
  const [apiReceipts, setApiReceipts] = useState<PiltReceipt[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [status, distRes, rcptRes] = await Promise.all([
          getPiltStatus(),
          getPiltDistricts(),
          getPiltReceipts(),
        ]);
        if (cancelled) return;
        setApiStatus(status);
        setApiDistricts(distRes.districts);
        setApiReceipts(rcptRes.receipts);
        setIsLive(true);
      } catch {
        // API unavailable — fall back to local data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalAcres = PILT_CATEGORIES.reduce((s, c) => s + c.acres, 0);
  const totalValue = PILT_CATEGORIES.reduce((s, c) => s + c.totalValue, 0);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2
            className='text-2xl font-semibold flex items-center gap-3'
            style={{ color: 'hsl(var(--tf-fg))' }}
          >
            <Landmark style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
            PILT Administration
          </h2>
          <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
            Payment In Lieu of Taxes — Benton County
          </p>
        </div>
        <Badge
          variant='outline'
          className='flex items-center gap-1.5'
          style={{
            borderColor: isLive ? 'hsl(140 70% 40%)' : 'hsl(var(--tf-border))',
            color: isLive ? 'hsl(140 70% 50%)' : 'hsl(var(--tf-muted))',
          }}
        >
          {loading ? (
            <Loader2 size={12} className='animate-spin' />
          ) : isLive ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          {loading ? 'Connecting…' : isLive ? 'Live' : 'Local'}
        </Badge>
      </div>

      {/* Summary cards — live API data when available */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              {isLive ? 'Total Payments' : 'Total Acreage'}
            </p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {isLive ? formatCurrency(apiStatus!.totalPayments) : totalAcres.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              {isLive ? 'Federal Acres' : 'Total Assessed Value'}
            </p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {isLive ? apiStatus!.federalAcres.toLocaleString() : formatCurrency(totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              {isLive ? 'Fiscal Year' : 'Categories'}
            </p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {isLive ? apiStatus!.fiscalYear : PILT_CATEGORIES.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live receipts */}
      {isLive && apiReceipts.length > 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Federal Receipts</CardTitle>
            <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
              PILT payments received — FY {apiStatus!.fiscalYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                    <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Source</th>
                    <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Amount</th>
                    <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apiReceipts.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                      <td className='py-2 px-3' style={{ color: 'hsl(var(--tf-fg))' }}>{r.source}</td>
                      <td className='py-2 px-3 text-right font-mono' style={{ color: 'hsl(var(--tf-suite-dais))' }}>
                        {formatCurrency(r.amount)}
                      </td>
                      <td className='py-2 px-3 text-right'>
                        <Badge variant='outline' style={{ borderColor: 'hsl(140 70% 40%)', color: 'hsl(140 70% 50%)' }}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live districts */}
      {isLive && apiDistricts.length > 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Receiving Districts</CardTitle>
            <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
              Districts receiving PILT distributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-3'>
              {apiDistricts.map((d) => (
                <div
                  key={d.id}
                  className='px-4 py-3 rounded-lg'
                  style={{ background: 'hsl(var(--tf-border) / 0.3)' }}
                >
                  <p className='font-medium text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{d.name}</p>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{d.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Land categories — always shown */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>PILT Land Categories</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            Benton County Payment In Lieu of Taxes — assessed land values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Category</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Acres</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Value/Acre</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {PILT_CATEGORIES.map((c) => (
                  <tr key={c.category} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                    <td className='py-2 px-3' style={{ color: 'hsl(var(--tf-fg))' }}>{c.category}</td>
                    <td className='py-2 px-3 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {c.acres.toLocaleString()}
                    </td>
                    <td className='py-2 px-3 text-right font-mono' style={{ color: 'hsl(var(--tf-suite-dais))' }}>
                      {formatCurrency(c.valuePerAcre)}
                    </td>
                    <td className='py-2 px-3 text-right' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {formatCurrency(c.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CertificationModule() {
  const completedCount = CERT_MILESTONES.filter((m) => m.status === 'completed').length;
  const progress = Math.round((completedCount / CERT_MILESTONES.length) * 100);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <CheckCircle2 style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
          Assessment Certification
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Roll certification workflow — 2025 Assessment Year
        </p>
      </div>

      {/* Progress bar */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between mb-2'>
            <span style={{ color: 'hsl(var(--tf-fg))' }} className='font-medium'>
              Certification Progress
            </span>
            <span style={{ color: 'hsl(var(--tf-suite-dais))' }} className='font-bold'>
              {progress}%
            </span>
          </div>
          <div
            className='w-full h-3 rounded-full overflow-hidden'
            style={{ background: 'hsl(var(--tf-border))' }}
          >
            <div
              className='h-full rounded-full transition-all'
              style={{
                width: `${progress}%`,
                background: 'hsl(var(--tf-suite-dais))',
              }}
            />
          </div>
          <p className='text-sm mt-2' style={{ color: 'hsl(var(--tf-muted))' }}>
            {completedCount} of {CERT_MILESTONES.length} milestones complete
          </p>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Certification Milestones</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {CERT_MILESTONES.map((m, i) => (
            <div key={i} className='flex items-start gap-4'>
              <div
                className='w-8 h-8 rounded-full flex items-center justify-center shrink-0'
                style={{
                  background:
                    m.status === 'completed'
                      ? 'hsl(140 70% 40% / 0.2)'
                      : m.status === 'current'
                        ? 'hsl(var(--tf-suite-dais) / 0.2)'
                        : 'hsl(var(--tf-border) / 0.5)',
                }}
              >
                <span
                  className='text-xs font-bold'
                  style={{
                    color:
                      m.status === 'completed'
                        ? 'hsl(140 70% 50%)'
                        : m.status === 'current'
                          ? 'hsl(var(--tf-suite-dais))'
                          : 'hsl(var(--tf-muted))',
                  }}
                >
                  {m.status === 'completed' ? '✓' : i + 1}
                </span>
              </div>
              <div>
                <p
                  className='font-medium'
                  style={{
                    color:
                      m.status === 'pending'
                        ? 'hsl(var(--tf-muted))'
                        : 'hsl(var(--tf-fg))',
                  }}
                >
                  {m.step}
                </p>
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Deadline: {m.deadline}
                </p>
                <Badge
                  variant='outline'
                  className='mt-1'
                  style={{
                    borderColor:
                      m.status === 'completed'
                        ? 'hsl(140 70% 40%)'
                        : m.status === 'current'
                          ? 'hsl(var(--tf-suite-dais))'
                          : 'hsl(var(--tf-border))',
                    color:
                      m.status === 'completed'
                        ? 'hsl(140 70% 50%)'
                        : m.status === 'current'
                          ? 'hsl(var(--tf-suite-dais))'
                          : 'hsl(var(--tf-muted))',
                  }}
                >
                  {m.status === 'completed' ? 'Complete' : m.status === 'current' ? 'In Progress' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AppealsDaisModule() {
  const [statusFilter, setStatusFilter] = useState('all');

  const STATUS_COLORS: Record<string, string> = {
    decided: 'hsl(140 70% 45%)',
    scheduled: 'hsl(200 80% 55%)',
    filed: 'hsl(45 90% 55%)',
    withdrawn: 'hsl(var(--tf-muted))',
  };

  const OUTCOME_COLORS: Record<string, string> = {
    reduced: 'hsl(200 80% 55%)',
    upheld: 'hsl(140 70% 45%)',
    dismissed: 'hsl(0 70% 55%)',
  };

  const filtered = statusFilter === 'all'
    ? BOE_APPEALS
    : BOE_APPEALS.filter((a) => a.status === statusFilter);

  const decidedCount = BOE_APPEALS.filter((a) => a.status === 'decided').length;
  const scheduledCount = BOE_APPEALS.filter((a) => a.status === 'scheduled').length;
  const filedCount = BOE_APPEALS.filter((a) => a.status === 'filed').length;
  const totalRequested = BOE_APPEALS.reduce((s, a) => s + (a.currentValue - a.requestedValue), 0);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Scale style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
          BOE Appeals Tracker
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Board of Equalization appeal tracking — 2025 assessment cycle
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {[
          { label: 'Total Appeals', value: BOE_APPEALS.length.toString(), color: 'hsl(var(--tf-fg))' },
          { label: 'Decided', value: decidedCount.toString(), color: 'hsl(140 70% 45%)' },
          { label: 'Scheduled', value: scheduledCount.toString(), color: 'hsl(200 80% 55%)' },
          { label: 'Value at Issue', value: formatCurrency(totalRequested), color: 'hsl(var(--tf-suite-dais))' },
        ].map((s) => (
          <Card key={s.label} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='pt-6 text-center'>
              <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{s.label}</p>
              <p className='text-2xl font-bold' style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className='flex gap-2'>
        {['all', 'filed', 'scheduled', 'decided', 'withdrawn'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className='px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize'
            style={{
              background: statusFilter === s ? 'hsl(var(--tf-suite-dais) / 0.15)' : 'transparent',
              color: statusFilter === s ? 'hsl(var(--tf-suite-dais))' : 'hsl(var(--tf-muted))',
              border: `1px solid ${statusFilter === s ? 'hsl(var(--tf-suite-dais) / 0.3)' : 'hsl(var(--tf-border))'}`,
            }}
          >
            {s} {s !== 'all' && `(${BOE_APPEALS.filter((a) => a.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Appeal table */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Appeal Petitions</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            Benton County BOE — {filtered.length} petition{filtered.length !== 1 ? 's' : ''} shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Appeal #</th>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Appellant</th>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Type</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Current</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Requested</th>
                  <th className='text-center py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Hearing</th>
                  <th className='text-center py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
                  <th className='text-center py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                    <td className='py-2 px-3 font-mono text-xs' style={{ color: 'hsl(var(--tf-fg))' }}>{a.id}</td>
                    <td className='py-2 px-3' style={{ color: 'hsl(var(--tf-fg))' }}>{a.appellant}</td>
                    <td className='py-2 px-3'>
                      <Badge variant='outline' className='capitalize' style={{ borderColor: 'hsl(var(--tf-border))' }}>{a.type}</Badge>
                    </td>
                    <td className='py-2 px-3 text-right font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(a.currentValue)}</td>
                    <td className='py-2 px-3 text-right font-mono' style={{ color: 'hsl(var(--tf-suite-dais))' }}>{formatCurrency(a.requestedValue)}</td>
                    <td className='py-2 px-3 text-center text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{a.hearing || '—'}</td>
                    <td className='py-2 px-3 text-center'>
                      <Badge variant='outline' className='capitalize' style={{ borderColor: STATUS_COLORS[a.status], color: STATUS_COLORS[a.status] }}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className='py-2 px-3 text-center'>
                      {a.outcome ? (
                        <Badge variant='outline' className='capitalize' style={{ borderColor: OUTCOME_COLORS[a.outcome], color: OUTCOME_COLORS[a.outcome] }}>
                          {a.outcome}
                        </Badge>
                      ) : (
                        <span style={{ color: 'hsl(var(--tf-muted))' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PermitsDaisModule() {
  const STATUS_COLORS: Record<string, string> = {
    submitted: 'hsl(45 90% 55%)',
    under_review: 'hsl(200 80% 55%)',
    approved: 'hsl(140 70% 45%)',
    issued: 'hsl(270 70% 60%)',
    denied: 'hsl(0 70% 55%)',
  };

  const totalValue = BUILDING_PERMITS.reduce((s, p) => s + p.estValue, 0);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <HardHat style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
          Building Permits
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Permit intake and workflow tracking — Benton County 2025
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Permits</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{BUILDING_PERMITS.length}</p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Est. Value</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-suite-dais))' }}>{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Pending Review</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(200 80% 55%)' }}>
              {BUILDING_PERMITS.filter((p) => p.status === 'under_review' || p.status === 'submitted').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Permit table */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Permit Applications</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            Building permits with valuation impact — triggers assessment review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Permit #</th>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Address</th>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Applicant</th>
                  <th className='text-left py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Type</th>
                  <th className='text-right py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Est. Value</th>
                  <th className='text-center py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Submitted</th>
                  <th className='text-center py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {BUILDING_PERMITS.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                    <td className='py-2 px-3 font-mono text-xs' style={{ color: 'hsl(var(--tf-fg))' }}>{p.id}</td>
                    <td className='py-2 px-3' style={{ color: 'hsl(var(--tf-fg))' }}>{p.address}</td>
                    <td className='py-2 px-3' style={{ color: 'hsl(var(--tf-muted))' }}>{p.applicant}</td>
                    <td className='py-2 px-3'>
                      <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>{p.type}</Badge>
                    </td>
                    <td className='py-2 px-3 text-right font-mono' style={{ color: 'hsl(var(--tf-suite-dais))' }}>
                      {formatCurrency(p.estValue)}
                    </td>
                    <td className='py-2 px-3 text-center text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{p.submitted}</td>
                    <td className='py-2 px-3 text-center'>
                      <Badge
                        variant='outline'
                        className='capitalize'
                        style={{
                          borderColor: STATUS_COLORS[p.status] ?? 'hsl(var(--tf-border))',
                          color: STATUS_COLORS[p.status] ?? 'hsl(var(--tf-muted))',
                        }}
                      >
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarDaisModule() {
  const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    milestone: { label: 'Milestone', color: 'hsl(var(--tf-suite-dais))' },
    deadline: { label: 'Deadline', color: 'hsl(0 70% 55%)' },
    notice: { label: 'Notice', color: 'hsl(200 80% 55%)' },
    hearing: { label: 'Hearing', color: 'hsl(270 70% 60%)' },
  };

  const today = new Date().toISOString().split('T')[0];
  const pastEvents = ASSESSMENT_EVENTS.filter((e) => e.date < today);
  const upcomingEvents = ASSESSMENT_EVENTS.filter((e) => e.date >= today);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Calendar style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
          Assessment Calendar
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Key dates and deadlines — 2025 assessment cycle
        </p>
      </div>

      {/* Progress */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between mb-2'>
            <span style={{ color: 'hsl(var(--tf-fg))' }} className='font-medium'>Cycle Progress</span>
            <span style={{ color: 'hsl(var(--tf-suite-dais))' }} className='font-bold'>
              {Math.round((pastEvents.length / ASSESSMENT_EVENTS.length) * 100)}%
            </span>
          </div>
          <div className='w-full h-3 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-border))' }}>
            <div
              className='h-full rounded-full transition-all'
              style={{
                width: `${(pastEvents.length / ASSESSMENT_EVENTS.length) * 100}%`,
                background: 'hsl(var(--tf-suite-dais))',
              }}
            />
          </div>
          <p className='text-sm mt-2' style={{ color: 'hsl(var(--tf-muted))' }}>
            {pastEvents.length} of {ASSESSMENT_EVENTS.length} events completed or passed
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => (
          <Card key={key} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='pt-6 text-center'>
              <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{conf.label}s</p>
              <p className='text-3xl font-bold' style={{ color: conf.color }}>
                {ASSESSMENT_EVENTS.filter((e) => e.category === key).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-suite-dais) / 0.3)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Upcoming Events</CardTitle>
            <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
              Next deadlines and milestones in the 2025 cycle
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {upcomingEvents.map((evt, i) => {
              const catConf = CATEGORY_CONFIG[evt.category];
              return (
                <div
                  key={i}
                  className='flex items-center gap-4 px-4 py-3 rounded-lg'
                  style={{ background: 'hsl(var(--tf-border) / 0.2)' }}
                >
                  <div className='w-20 shrink-0'>
                    <p className='text-xs font-mono font-bold' style={{ color: catConf.color }}>{evt.date}</p>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{evt.event}</p>
                  </div>
                  <Badge variant='outline' style={{ borderColor: catConf.color, color: catConf.color }}>
                    {catConf.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Completed Events</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {pastEvents.map((evt, i) => {
              const catConf = CATEGORY_CONFIG[evt.category];
              return (
                <div key={i} className='flex items-center gap-4 px-4 py-2 rounded opacity-60'>
                  <div className='w-20 shrink-0'>
                    <p className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>{evt.date}</p>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm line-through' style={{ color: 'hsl(var(--tf-muted))' }}>{evt.event}</p>
                  </div>
                  <Badge variant='outline' className='text-[10px]' style={{ borderColor: catConf.color, color: catConf.color }}>
                    {catConf.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Main Suite Home
// ============================================================================

function ModuleLoading() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading module...</p>
    </div>
  );
}

export default function DaisSuiteHome() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('levy');

  const renderModule = () => {
    switch (activeModule) {
      case 'levy':
        return <LevyModule />;
      case 'pilt':
        return <PILTModule />;
      case 'certification':
        return <CertificationModule />;
      case 'appeals':
        return <AppealsDaisModule />;
      case 'permits':
        return <PermitsDaisModule />;
      case 'calendar':
        return <CalendarDaisModule />;
      default:
        return (
          <div className='p-6 flex items-center justify-center min-h-[400px]'>
            <div className='text-center space-y-3'>
              <LayoutDashboard
                size={48}
                className='mx-auto'
                style={{ color: 'hsl(var(--tf-suite-dais) / 0.3)' }}
              />
              <p style={{ color: 'hsl(var(--tf-muted))' }}>
                {DAIS_MODULES.find((m) => m.id === activeModule)?.label} is under development
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div data-testid="suite-dais-root" className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Parcel Context Banner — shows when parcel is active */}
      <ParcelContextBanner suiteTabId="dais" />
      {/* Header + Stage Tabs */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl shrink-0'
      >
        <div className='max-w-[1600px] mx-auto px-6 pt-4 pb-0 flex items-center gap-4'>
          <button
            onClick={() => navigate('/')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div
            className='p-2 rounded-lg'
            style={{ background: 'hsl(var(--tf-suite-dais) / 0.15)' }}
          >
            <LayoutDashboard size={24} style={{ color: 'hsl(var(--tf-suite-dais))' }} />
          </div>
          <div>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              TerraDais
            </h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              Workflow Orchestration & Governance Dashboard
            </p>
          </div>
        </div>

        {/* Stage Tabs */}
        <nav
          role='tablist'
          aria-label='TerraDais modules'
          className='max-w-[1600px] mx-auto px-6 flex gap-1 mt-3 overflow-x-auto'
        >
          {DAIS_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                role='tab'
                aria-selected={isActive}
                aria-controls={`dais-panel-${mod.id}`}
                onClick={() => !isPlanned && setActiveModule(mod.id)}
                disabled={isPlanned}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10'
                    : isPlanned
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/5'
                }`}
                style={{
                  color: isActive
                    ? 'hsl(var(--tf-fg))'
                    : 'hsl(var(--tf-muted))',
                  borderBottom: isActive
                    ? '2px solid hsl(var(--tf-suite-dais))'
                    : '2px solid transparent',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: isActive
                      ? 'hsl(var(--tf-suite-dais))'
                      : 'hsl(var(--tf-muted))',
                  }}
                />
                {mod.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Module Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>{renderModule()}</main>
    </div>
  );
}
