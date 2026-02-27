/**
 * TerraDais Suite Home -- Workflow & Governance Dashboard
 * ===================================================================
 * Constitutional Suite: dais (Article I)
 * Standalone route: /dais
 *
 * Modules:
 *   - Levy: Property tax levy calculation & analysis
 *   - PILT: Payment In Lieu of Taxes administration
 *   - Certification: Assessment roll certification workflow
 *   - Appeals: BOE appeal tracking & scheduling
 *   - Permits: Building permit workflow (planned)
 */

import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Receipt,
  Landmark,
  CheckCircle2,
  Scale,
  HardHat,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    status: 'planned',
    description: 'BOE appeal tracking, scheduling, and outcomes',
  },
  {
    id: 'permits',
    label: 'Permits',
    icon: HardHat,
    status: 'planned',
    description: 'Building permit intake and workflow tracking',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    status: 'planned',
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

      {/* District table */}
      <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--tf-fg))' }}>Taxing Districts</CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            2024 levy rates per $1,000 of assessed value
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

function PILTModule() {
  const totalAcres = PILT_CATEGORIES.reduce((s, c) => s + c.acres, 0);
  const totalValue = PILT_CATEGORIES.reduce((s, c) => s + c.totalValue, 0);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Landmark style={{ color: 'hsl(var(--tf-suite-dais))' }} size={28} />
          PILT Administration
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Payment In Lieu of Taxes — Federal & State land values, Benton County
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Acreage</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {totalAcres.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Assessed Value</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {formatCurrency(totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Categories</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {PILT_CATEGORIES.length}
            </p>
          </CardContent>
        </Card>
      </div>

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
    <div className='min-h-screen' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl'
      >
        <div className='max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4'>
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
      </header>

      <div className='flex'>
        {/* Module Sidebar */}
        <nav
          className='w-64 shrink-0 p-4 space-y-1'
          style={{ borderRight: '1px solid hsl(var(--tf-border))' }}
        >
          <p
            className='text-xs font-medium uppercase tracking-wider px-3 py-2'
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            Modules
          </p>
          {DAIS_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                onClick={() => !isPlanned && setActiveModule(mod.id)}
                disabled={isPlanned}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-white/10'
                    : isPlanned
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/5'
                }`}
              >
                <Icon
                  size={18}
                  style={{
                    color: isActive
                      ? 'hsl(var(--tf-suite-dais))'
                      : 'hsl(var(--tf-muted))',
                  }}
                />
                <div>
                  <span
                    className='text-sm font-medium'
                    style={{
                      color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                    }}
                  >
                    {mod.label}
                  </span>
                  {isPlanned && (
                    <span
                      className='block text-xs'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Module Content */}
        <main className='flex-1 min-w-0'>{renderModule()}</main>
      </div>
    </div>
  );
}
