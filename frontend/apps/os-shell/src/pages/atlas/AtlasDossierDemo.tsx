/**
 * Atlas Property Dossier — Conference Demo
 * ===================================================================
 * Route: /atlas/dossier/demo
 *
 * "What should I know about this property?"
 *
 * This is the proof of the entire TerraFusion Intelligence vision.
 * Fully self-contained — no backend, no database, no API, no internet.
 * Hardcoded Benton County parcel with realistic data.
 *
 * Structure:
 *   1. Property Snapshot — What is this?
 *   2. Context — What surrounds it?
 *   3. Activity — What is happening nearby?
 *   4. Signals — What matters?
 *   5. Atlas Insight — What does it mean?
 *   6. Now What? — What should I do next?
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Home,
  MapPin,
  Layers,
  Activity,
  Zap,
  Lightbulb,
  ArrowRight,
  Building2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  FileText,
  BarChart3,
  ChevronRight,
  Eye,
} from 'lucide-react';

// ============================================================================
// Demo Parcel Data — Hardcoded Benton County Property
// ============================================================================

const DEMO_PARCEL = {
  parcelNumber: '1-0631-100-0017-000',
  address: '2847 Queensgate Dr',
  city: 'Richland',
  state: 'WA',
  zip: '99352',
  county: 'Benton County',
  neighborhood: 'Queensgate',
  neighborhoodCode: 'QG-04',
  subdivision: 'Queensgate Phase 12',
  legalDescription: 'LOT 17, BLOCK 1, QUEENSGATE PH 12, VOL 23, PG 147',
  propertyType: 'Residential — Single Family',
  useCode: '111',
  classCode: 'R1',
  zoning: 'R-1 (Low Density Residential)',
  acreage: 0.23,
  sqft: 10019,
  yearBuilt: 2019,
  totalSqft: 2847,
  stories: 2,
  bedrooms: 4,
  bathrooms: 3,
  garage: '3-car attached',
  foundation: 'Concrete slab',
  exterior: 'Fiber cement siding',
  roof: 'Architectural shingle',
  heating: 'Forced air — gas',
  cooling: 'Central AC',
  qualityClass: 'Good (Class 4 of 6)',
  condition: 'Good',
  pool: false,
  fireplace: true,
  owner: 'Martinez, Robert & Sarah',
  mailingAddress: '2847 Queensgate Dr, Richland WA 99352',
  taxYear: 2026,
  assessedValue: 548200,
  marketValue: 562000,
  landValue: 115000,
  improvementValue: 433200,
  priorYearAssessed: 521900,
  priorYearMarket: 535000,
  changePercent: 5.04,
  taxAmount: 5734.82,
  levyRate: 10.461,
  lastSaleDate: '2019-06-14',
  lastSalePrice: 425000,
  saleToAssessedRatio: 1.29,
};

const VALUATION_HISTORY = [
  { year: 2026, assessed: 548200, market: 562000, land: 115000 },
  { year: 2025, assessed: 521900, market: 535000, land: 110000 },
  { year: 2024, assessed: 498700, market: 510000, land: 105000 },
  { year: 2023, assessed: 482300, market: 495000, land: 102000 },
  { year: 2022, assessed: 461000, market: 472000, land: 98000 },
  { year: 2021, assessed: 438500, market: 449000, land: 92000 },
  { year: 2020, assessed: 425000, market: 425000, land: 88000 },
];

const LEVY_BREAKDOWN = [
  { district: 'Benton County', rate: 1.482, amount: 812.44 },
  { district: 'City of Richland', rate: 2.135, amount: 1170.42 },
  { district: 'Richland School District', rate: 4.623, amount: 2534.33 },
  { district: 'Fire District #4', rate: 0.982, amount: 538.47 },
  { district: 'Library District', rate: 0.489, amount: 268.09 },
  { district: 'Port of Benton', rate: 0.312, amount: 171.04 },
  { district: 'State Schools', rate: 0.438, amount: 240.13 },
];

const NEARBY_PERMITS = [
  { address: '2831 Queensgate Dr', type: 'Residential Addition', value: '$45,000', date: '2026-03-15', status: 'Under Construction' },
  { address: '2900 Queensgate Dr', type: 'New Residential', value: '$520,000', date: '2026-01-22', status: 'Final Inspection' },
  { address: '2755 Queensgate Dr', type: 'Solar Installation', value: '$18,500', date: '2026-04-08', status: 'Approved' },
  { address: '1200 Queensgate Blvd', type: 'Commercial — Retail', value: '$2,200,000', date: '2025-11-30', status: 'Under Construction' },
  { address: '1180 Queensgate Blvd', type: 'Commercial — Restaurant', value: '$850,000', date: '2026-02-14', status: 'Approved' },
];

const COMPARABLE_SALES = [
  { address: '2903 Queensgate Dr', date: '2026-01-18', price: 555000, sqft: 2720, priceSqft: 204, ratio: 0.99 },
  { address: '2684 Queensgate Dr', date: '2025-11-05', price: 538000, sqft: 2650, priceSqft: 203, ratio: 1.02 },
  { address: '2971 Belmont Blvd', date: '2025-09-22', price: 572000, sqft: 2910, priceSqft: 197, ratio: 0.98 },
  { address: '3015 Queensgate Dr', date: '2025-08-14', price: 549000, sqft: 2780, priceSqft: 197, ratio: 1.00 },
];

// ============================================================================
// Section Components
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: typeof Home;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className='flex items-center gap-4 mb-6'>
      <div className='p-3 rounded-xl' style={{ background: `${color}12` }}>
        <Icon size={26} style={{ color }} />
      </div>
      <div>
        <h2 className='text-xl sm:text-2xl font-bold tracking-tight' style={{ color: 'hsl(var(--tf-fg))' }}>
          {title}
        </h2>
        <p className='text-sm sm:text-base' style={{ color: 'hsl(var(--tf-muted))' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function DataRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className='flex justify-between items-baseline py-2' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.3)' }}>
      <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
        {label}
      </span>
      <span
        className={`text-sm ${accent ? 'font-semibold' : 'font-medium'}`}
        style={{ color: accent ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-fg) / 0.9)' }}
      >
        {value}
      </span>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  title,
  description,
  severity,
}: {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'watch';
}) {
  const colors = {
    positive: 'hsl(150 70% 45%)',
    neutral: 'hsl(210 70% 55%)',
    watch: 'hsl(35 90% 50%)',
  };
  const bgTints = {
    positive: 'hsl(150 70% 45% / 0.04)',
    neutral: 'hsl(210 70% 55% / 0.04)',
    watch: 'hsl(35 90% 50% / 0.04)',
  };
  const color = colors[severity];

  const decisionSplit = description.split(/Decision:\s*/);
  const hasDecision = decisionSplit.length > 1;

  return (
    <div
      className='p-5 rounded-xl'
      style={{
        background: bgTints[severity],
        border: '1px solid hsl(var(--tf-border))',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className='flex items-start gap-3'>
        <div className='p-1.5 rounded-lg shrink-0 mt-0.5' style={{ background: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div className='min-w-0'>
          <h4 className='text-base font-semibold leading-snug mb-2' style={{ color: 'hsl(var(--tf-fg))' }}>
            {title}
          </h4>
          <p className='text-sm leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
            {hasDecision ? decisionSplit[0] : description}
          </p>
          {hasDecision && (
            <p
              className='text-sm font-medium mt-2 px-3 py-2 rounded-lg leading-relaxed'
              style={{
                color,
                background: `${color}10`,
                border: `1px solid ${color}20`,
              }}
            >
              Decision: {decisionSplit[1]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AtlasDossierDemo() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const sections = [
    { id: 'snapshot', label: 'Snapshot', icon: Home },
    { id: 'context', label: 'Context', icon: Layers },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'insight', label: 'Insight', icon: Lightbulb },
    { id: 'now-what', label: 'Now What?', icon: ArrowRight },
  ];

  return (
    <div className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl shrink-0'
      >
        <div className='max-w-[1100px] mx-auto px-6 py-4 flex items-center gap-4'>
          <button
            onClick={() => navigate('/atlas')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
            aria-label='Back to Atlas'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className='p-2 rounded-lg' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.15)' }}>
            <Globe size={24} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
          </div>
          <div className='flex-1'>
            <p
              className='text-xs font-semibold uppercase tracking-widest'
              style={{ color: 'hsl(var(--tf-suite-atlas))' }}
            >
              Atlas Property Dossier
            </p>
            <h1 className='text-xl font-bold tracking-tight' style={{ color: 'hsl(var(--tf-fg))' }}>
              {DEMO_PARCEL.address}, {DEMO_PARCEL.city}
            </h1>
          </div>
          <div
            className='text-right hidden sm:block'
          >
            <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel</p>
            <p className='text-sm font-mono font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              {DEMO_PARCEL.parcelNumber}
            </p>
          </div>
        </div>

        {/* Section Nav */}
        <nav
          className='max-w-[1100px] mx-auto px-6 flex gap-1 overflow-x-auto pb-0'
          aria-label='Dossier sections'
        >
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#dossier-${s.id}`}
                className='flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap hover:bg-white/5'
                style={{
                  color: 'hsl(var(--tf-muted))',
                  borderBottom: '2px solid transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`dossier-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Icon size={16} />
                {s.label}
              </a>
            );
          })}
        </nav>
      </header>

      {/* Dossier Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <div className='max-w-[1100px] mx-auto px-6 py-10 space-y-16'>

          {/* ================================================================ */}
          {/* HEADLINE: Atlas Intelligence Summary */}
          {/* The one thing they remember when they leave the room. */}
          {/* ================================================================ */}
          <section
            className='rounded-2xl p-8 sm:p-10 relative overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, hsl(var(--tf-suite-atlas) / 0.12), hsl(270 80% 60% / 0.08), hsl(var(--tf-suite-atlas) / 0.04))',
              border: '2px solid hsl(var(--tf-suite-atlas) / 0.3)',
              boxShadow: '0 0 40px hsl(var(--tf-suite-atlas) / 0.08), inset 0 1px 0 hsl(var(--tf-suite-atlas) / 0.1)',
            }}
          >
            <div
              className='absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none'
              style={{ background: 'hsl(var(--tf-suite-atlas))' }}
            />
            <div className='relative'>
              <div className='flex items-center gap-3 mb-4'>
                <Lightbulb size={20} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                <p
                  className='text-sm font-bold uppercase tracking-widest'
                  style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                >
                  Atlas Intelligence Summary
                </p>
              </div>
              <p
                className='text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-6'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                A well-assessed property in an appreciating corridor — hold position, watch the
                commercial development on Queensgate Blvd for upside.
              </p>
              <div className='flex flex-wrap gap-3'>
                <span
                  className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium'
                  style={{
                    background: 'hsl(var(--tf-card-bg) / 0.6)',
                    border: '1px solid hsl(var(--tf-border))',
                    color: 'hsl(var(--tf-fg))',
                  }}
                >
                  Assessed: <strong>{fmt(DEMO_PARCEL.assessedValue)}</strong>
                </span>
                <span
                  className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium'
                  style={{
                    background: 'hsl(150 70% 45% / 0.1)',
                    border: '1px solid hsl(150 70% 45% / 0.2)',
                    color: 'hsl(150 70% 45%)',
                  }}
                >
                  Assessment Ratio: <strong>1.00</strong> (on target)
                </span>
                <span
                  className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium'
                  style={{
                    background: 'hsl(150 70% 45% / 0.1)',
                    border: '1px solid hsl(150 70% 45% / 0.2)',
                    color: 'hsl(150 70% 45%)',
                  }}
                >
                  Growth: <strong>+{DEMO_PARCEL.changePercent}% YoY</strong>
                </span>
                <span
                  className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium'
                  style={{
                    background: 'hsl(150 70% 45% / 0.1)',
                    border: '1px solid hsl(150 70% 45% / 0.2)',
                    color: 'hsl(150 70% 45%)',
                  }}
                >
                  Risk: <strong>Low</strong>
                </span>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 1: Property Snapshot — What is this? */}
          {/* ================================================================ */}
          <section id='dossier-snapshot' className='pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.4)' }}>
            <SectionHeader
              icon={Home}
              title='Property Snapshot'
              subtitle='What is this property?'
              color='hsl(var(--tf-suite-atlas))'
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              {/* Left: Identity */}
              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <h3
                  className='text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2'
                  style={{ color: 'hsl(var(--tf-muted))' }}
                >
                  <MapPin size={13} /> Identity
                </h3>
                <DataRow label='Address' value={`${DEMO_PARCEL.address}, ${DEMO_PARCEL.city} ${DEMO_PARCEL.state} ${DEMO_PARCEL.zip}`} accent />
                <DataRow label='Parcel' value={DEMO_PARCEL.parcelNumber} />
                <DataRow label='Type' value={DEMO_PARCEL.propertyType} />
                <DataRow label='Neighborhood' value={`${DEMO_PARCEL.neighborhood} (${DEMO_PARCEL.neighborhoodCode})`} />
                <DataRow label='Subdivision' value={DEMO_PARCEL.subdivision} />
                <DataRow label='Zoning' value={DEMO_PARCEL.zoning} />
                <DataRow label='Lot Size' value={`${DEMO_PARCEL.acreage} ac (${DEMO_PARCEL.sqft.toLocaleString()} SF)`} />
              </div>

              {/* Right: Improvements */}
              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <h3
                  className='text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2'
                  style={{ color: 'hsl(var(--tf-muted))' }}
                >
                  <Building2 size={13} /> Improvements
                </h3>
                <DataRow label='Year Built' value={String(DEMO_PARCEL.yearBuilt)} />
                <DataRow label='Living Area' value={`${DEMO_PARCEL.totalSqft.toLocaleString()} SF`} />
                <DataRow label='Stories' value={String(DEMO_PARCEL.stories)} />
                <DataRow label='Bedrooms / Bath' value={`${DEMO_PARCEL.bedrooms} BD / ${DEMO_PARCEL.bathrooms} BA`} />
                <DataRow label='Garage' value={DEMO_PARCEL.garage} />
                <DataRow label='Quality' value={DEMO_PARCEL.qualityClass} />
                <DataRow label='Condition' value={DEMO_PARCEL.condition} />
                <DataRow label='Exterior' value={DEMO_PARCEL.exterior} />
              </div>
            </div>

            {/* Valuation Summary — the eye-catcher */}
            <div
              className='mt-5 rounded-xl p-5'
              style={{
                background: 'linear-gradient(135deg, hsl(var(--tf-suite-atlas) / 0.06), hsl(var(--tf-card-bg)))',
                border: '1px solid hsl(var(--tf-suite-atlas) / 0.2)',
              }}
            >
              <h3
                className='text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-suite-atlas))' }}
              >
                <DollarSign size={13} /> Current Valuation — Tax Year {DEMO_PARCEL.taxYear}
              </h3>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div>
                  <p className='text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Assessed Value</p>
                  <p className='text-2xl sm:text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(DEMO_PARCEL.assessedValue)}</p>
                  <p className='text-xs font-semibold mt-0.5' style={{ color: 'hsl(150 70% 45%)' }}>
                    +{DEMO_PARCEL.changePercent}% from prior year
                  </p>
                </div>
                <div>
                  <p className='text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Market Value</p>
                  <p className='text-2xl sm:text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(DEMO_PARCEL.marketValue)}</p>
                </div>
                <div>
                  <p className='text-xs mb-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>Land</p>
                  <p className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(DEMO_PARCEL.landValue)}</p>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {((DEMO_PARCEL.landValue / DEMO_PARCEL.assessedValue) * 100).toFixed(0)}% of total
                  </p>
                </div>
                <div>
                  <p className='text-xs mb-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>Improvements</p>
                  <p className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(DEMO_PARCEL.improvementValue)}</p>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                    {((DEMO_PARCEL.improvementValue / DEMO_PARCEL.assessedValue) * 100).toFixed(0)}% of total
                  </p>
                </div>
              </div>

              {/* Value History Bars */}
              <div className='mt-5 pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                <p className='text-xs font-medium mb-3' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Assessment History
                </p>
                <div className='space-y-2'>
                  {VALUATION_HISTORY.map((v) => {
                    const maxVal = VALUATION_HISTORY[0].assessed;
                    const pct = (v.assessed / maxVal) * 100;
                    return (
                      <div key={v.year} className='flex items-center gap-3'>
                        <span className='text-xs w-8 text-right font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {String(v.year).slice(2)}
                        </span>
                        <div className='flex-1 h-5 rounded-md overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                          <div
                            className='h-full rounded-md transition-all'
                            style={{
                              width: `${pct}%`,
                              background: v.year === 2026
                                ? 'hsl(var(--tf-suite-atlas))'
                                : 'hsl(var(--tf-suite-atlas) / 0.3)',
                            }}
                          />
                        </div>
                        <span className='text-xs w-16 text-right font-mono' style={{ color: 'hsl(var(--tf-fg) / 0.7)' }}>
                          {fmt(v.assessed)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 2: Context — What surrounds it? */}
          {/* Tier 4 in Memory Report — reduced to compact summary. */}
          {/* Levy breakdown (Tier 2) kept prominent below. */}
          {/* ================================================================ */}
          <section id='dossier-context' className='pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.4)' }}>
            <SectionHeader
              icon={Layers}
              title='Context'
              subtitle="The environment that shapes this property's value"
              color='hsl(210 90% 55%)'
            />

            <div
              className='rounded-xl p-5'
              style={{
                background: 'hsl(var(--tf-card-bg))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2'>
                <DataRow label='Neighborhood' value='Suburban Residential (New, 2015-2026)' />
                <DataRow label='Median Home Value' value='$495,000' />
                <DataRow label='School District' value='Richland SD #400' />
                <DataRow label='Flood Zone' value='Zone X (Minimal Risk)' />
                <DataRow label='Fire Risk' value='Low' />
                <DataRow label='Annual Tax' value={fmt(DEMO_PARCEL.taxAmount)} accent />
                <DataRow label='Levy Rate' value={`$${DEMO_PARCEL.levyRate} / $1,000`} />
                <DataRow label='Exemptions' value='None' />
              </div>
            </div>

            {/* Levy Breakdown */}
            <div
              className='mt-5 rounded-xl overflow-hidden'
              style={{
                background: 'hsl(var(--tf-card-bg))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <div className='px-5 py-3' style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                <h3 className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Levy Distribution — Where Your Tax Dollars Go
                </h3>
              </div>
              <div className='px-5 py-2'>
                {LEVY_BREAKDOWN.map((levy) => {
                  const pct = (levy.amount / DEMO_PARCEL.taxAmount) * 100;
                  return (
                    <div key={levy.district} className='flex items-center gap-3 py-2'>
                      <span className='text-sm flex-1' style={{ color: 'hsl(var(--tf-fg) / 0.9)' }}>
                        {levy.district}
                      </span>
                      <div className='w-32 h-3 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-bg))' }}>
                        <div
                          className='h-full rounded-full'
                          style={{
                            width: `${pct}%`,
                            background: 'hsl(var(--tf-suite-atlas) / 0.5)',
                          }}
                        />
                      </div>
                      <span className='text-xs w-10 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {pct.toFixed(0)}%
                      </span>
                      <span className='text-sm w-20 text-right font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {fmt(levy.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 3: Activity — What is happening nearby? */}
          {/* ================================================================ */}
          <section id='dossier-activity' className='pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.4)' }}>
            <SectionHeader
              icon={Activity}
              title='Activity'
              subtitle='Investment and development that could affect this property'
              color='hsl(25 95% 55%)'
            />

            {/* Nearby Permits */}
            <div
              className='rounded-xl overflow-hidden'
              style={{
                background: 'hsl(var(--tf-card-bg))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <div className='px-5 py-3' style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                <h3 className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Permits Within 0.5 Miles — Last 12 Months
                </h3>
              </div>
              <div className='divide-y' style={{ borderColor: 'hsl(var(--tf-border) / 0.5)' }}>
                {NEARBY_PERMITS.map((p) => (
                  <div key={p.address} className='px-5 py-3 flex items-center gap-4'>
                    <Building2 size={16} className='shrink-0' style={{ color: 'hsl(25 95% 55%)' }} />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {p.address}
                      </p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {p.type} — {p.value}
                      </p>
                    </div>
                    <span
                      className='text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap'
                      style={{
                        background: p.status === 'Under Construction'
                          ? 'hsl(35 90% 50% / 0.15)'
                          : p.status === 'Final Inspection'
                            ? 'hsl(150 70% 45% / 0.15)'
                            : 'hsl(210 70% 55% / 0.15)',
                        color: p.status === 'Under Construction'
                          ? 'hsl(35 90% 50%)'
                          : p.status === 'Final Inspection'
                            ? 'hsl(150 70% 45%)'
                            : 'hsl(210 70% 55%)',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparable Sales */}
            <div
              className='mt-5 rounded-xl overflow-hidden'
              style={{
                background: 'hsl(var(--tf-card-bg))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <div className='px-5 py-3' style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                <h3 className='text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Comparable Sales — Last 12 Months
                </h3>
              </div>
              <table className='w-full text-sm'>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                    <th className='text-left px-5 py-2 text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>Address</th>
                    <th className='text-right px-3 py-2 text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>Date</th>
                    <th className='text-right px-3 py-2 text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>Price</th>
                    <th className='text-right px-3 py-2 text-xs font-medium hidden sm:table-cell' style={{ color: 'hsl(var(--tf-muted))' }}>$/SF</th>
                    <th className='text-right px-5 py-2 text-xs font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARABLE_SALES.map((s) => (
                    <tr key={s.address} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.3)' }}>
                      <td className='px-5 py-2.5' style={{ color: 'hsl(var(--tf-fg))' }}>{s.address}</td>
                      <td className='px-3 py-2.5 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </td>
                      <td className='px-3 py-2.5 text-right font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {fmt(s.price)}
                      </td>
                      <td className='px-3 py-2.5 text-right font-mono hidden sm:table-cell' style={{ color: 'hsl(var(--tf-muted))' }}>
                        ${s.priceSqft}
                      </td>
                      <td className='px-5 py-2.5 text-right'>
                        <span
                          className='font-mono font-medium'
                          style={{
                            color: Math.abs(s.ratio - 1.0) < 0.03
                              ? 'hsl(150 70% 45%)'
                              : 'hsl(35 90% 50%)',
                          }}
                        >
                          {s.ratio.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className='px-5 py-3' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Median ratio: <span className='font-mono font-medium' style={{ color: 'hsl(150 70% 45%)' }}>1.00</span> —
                  Assessment is well-calibrated to current market. Subject's sale-to-assessed ratio of {DEMO_PARCEL.saleToAssessedRatio.toFixed(2)} reflects
                  appreciation since {new Date(DEMO_PARCEL.lastSaleDate).getFullYear()} purchase at {fmt(DEMO_PARCEL.lastSalePrice)}.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 4: Signals — What matters? */}
          {/* ================================================================ */}
          <section id='dossier-signals' className='pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.4)' }}>
            <SectionHeader
              icon={Zap}
              title='Signals'
              subtitle='The forces acting on this property right now'
              color='hsl(35 90% 50%)'
            />

            <div className='space-y-4'>
              <SignalCard
                icon={TrendingUp}
                title='The appreciation trend appears sustainable, not speculative'
                description='3.7% annual compound growth over 7 years, tracking the neighborhood average of 3.5-4.2%. This is demand-driven appreciation in a supply-constrained corridor — not a price bubble. Decision: current assessed value of $548,200 is defensible and does not require adjustment.'
                severity='positive'
              />

              <SignalCard
                icon={Building2}
                title='$3.05M in nearby commercial investment signals growing residential demand'
                description='A retail center ($2.2M) and restaurant ($850K) are under development on Queensgate Blvd within 0.5 miles. In comparable Tri-Cities corridors, this level of commercial amenity investment has preceded 2-4% residential land value increases within 18 months. Decision: anticipate upward land value pressure at next cycle.'
                severity='positive'
              />

              <SignalCard
                icon={BarChart3}
                title='Assessment is well-calibrated — no appeal exposure'
                description='Four comparable sales produce a median ratio of 1.00 with only 4% spread (0.98-1.02). This is well within industry standards for uniformity (IAAO target: below 15). Decision: no Board of Equalization defense preparation needed. This assessment would survive challenge.'
                severity='positive'
              />

              <SignalCard
                icon={AlertTriangle}
                title='New construction at 2900 Queensgate could reset comparable baseline'
                description="A $520,000 new home nearing final inspection may sell below this property's assessed value. If it closes under $540K, it introduces a downward data point for the next assessment cycle. Decision: monitor this sale — if it closes low, investigate whether quality class or square footage differences justify the gap before adjusting."
                severity='watch'
              />

              <SignalCard
                icon={Eye}
                title='Subdivision is maturing — expect stability over volatility'
                description='Queensgate Phase 12 is nearly built out, transitioning from "new construction" to "established neighborhood." This shift typically reduces annual appreciation variance from ±3% to ±1%. Decision: future value changes will be market-driven rather than supply-driven. Model accordingly.'
                severity='neutral'
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 5: Atlas Insight — What does it mean? */}
          {/* ================================================================ */}
          <section id='dossier-insight' className='pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.4)' }}>
            <SectionHeader
              icon={Lightbulb}
              title='Atlas Insight'
              subtitle='The decision context you need before acting'
              color='hsl(270 80% 60%)'
            />

            <div
              className='rounded-xl p-6 sm:p-8'
              style={{
                background: 'linear-gradient(135deg, hsl(270 80% 60% / 0.06), hsl(210 90% 55% / 0.06))',
                border: '1px solid hsl(270 80% 60% / 0.2)',
              }}
            >
              <div className='space-y-5 text-sm sm:text-base leading-relaxed' style={{ color: 'hsl(var(--tf-fg) / 0.9)' }}>
                <p>
                  <strong style={{ color: 'hsl(var(--tf-fg))' }}>The current assessment is defensible, the market position is stable, and the only variable worth watching is the commercial corridor developing a quarter-mile south.</strong>
                </p>
                <p>
                  <strong style={{ color: 'hsl(270 80% 60%)' }}>Assessment confidence: High.</strong>{' '}
                  Four comparable sales produce a median ratio of 1.00 with a spread of only 4%.
                  An appeal would not succeed. A challenge would not survive.
                </p>
                <p>
                  <strong style={{ color: 'hsl(270 80% 60%)' }}>Why taxes are high here — and why that's the point.</strong>{' '}
                  The 44% share flowing to Richland School District is the primary reason
                  this neighborhood commands a price premium — the tax funds the amenity that drives the value.
                </p>
                <p
                  className='rounded-xl px-5 py-4 mt-3 text-base leading-relaxed'
                  style={{
                    background: 'hsl(270 80% 60% / 0.1)',
                    border: '1px solid hsl(270 80% 60% / 0.2)',
                    color: 'hsl(var(--tf-fg))',
                  }}
                >
                  <strong>Bottom line:</strong> Hold position. The assessment is accurate, the market is stable,
                  and the only upside catalyst (commercial development) requires no action from you until it
                  materializes. Revisit at the 2027 cycle or when Queensgate Blvd construction completes — whichever comes first.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 6: Now What? */}
          {/* ================================================================ */}
          <section id='dossier-now-what' className='pt-4' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.4)' }}>
            <SectionHeader
              icon={ArrowRight}
              title='Now What?'
              subtitle='Specific next actions for every stakeholder'
              color='hsl(120 60% 45%)'
            />

            <div
              className='rounded-xl overflow-hidden'
              style={{
                background: 'hsl(var(--tf-card-bg))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <div className='h-1' style={{ background: 'hsl(var(--tf-suite-atlas))' }} />
              <div className='p-5'>
                <div className='flex items-center gap-2.5 mb-4'>
                  <div className='p-1.5 rounded-lg' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.12)' }}>
                    <FileText size={18} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                  </div>
                  <h3 className='text-base font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    Next Actions
                  </h3>
                </div>
                <ul className='space-y-3 text-sm' style={{ color: 'hsl(var(--tf-fg) / 0.85)' }}>
                  <li className='flex gap-2.5'>
                    <ChevronRight size={16} className='mt-0.5 shrink-0' style={{ color: 'hsl(150 70% 45%)' }} />
                    <span><strong style={{ color: 'hsl(var(--tf-fg))' }}>No value adjustment needed</strong> — current assessment is within 2% of comparable sales median</span>
                  </li>
                  <li className='flex gap-2.5'>
                    <ChevronRight size={16} className='mt-0.5 shrink-0' style={{ color: 'hsl(35 90% 50%)' }} />
                    <span><strong style={{ color: 'hsl(var(--tf-fg))' }}>Monitor 2900 Queensgate sale price</strong> when finalized — may establish new comparable baseline</span>
                  </li>
                  <li className='flex gap-2.5'>
                    <ChevronRight size={16} className='mt-0.5 shrink-0' style={{ color: 'hsl(210 70% 55%)' }} />
                    <span><strong style={{ color: 'hsl(var(--tf-fg))' }}>Schedule commercial impact analysis</strong> when Queensgate Blvd development completes (est. Q4 2026)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* Dossier Footer */}
          {/* ================================================================ */}
          <div
            className='rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
            style={{
              background: 'hsl(var(--tf-card-bg) / 0.5)',
              border: '1px solid hsl(var(--tf-border))',
            }}
          >
            <div>
              <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                TerraFusion Atlas • Property Dossier • Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                Data sources: Benton County Assessor, PACS 9.0, Washington DOR, US Census
              </p>
            </div>
            <div className='flex gap-3 shrink-0'>
              <button
                onClick={() => navigate('/atlas/county-pulse/demo')}
                className='px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105'
                style={{
                  background: 'hsl(var(--tf-suite-atlas) / 0.12)',
                  color: 'hsl(var(--tf-suite-atlas))',
                  border: '1px solid hsl(var(--tf-suite-atlas) / 0.3)',
                }}
              >
                County Pulse →
              </button>
              <button
                onClick={() => navigate('/academy')}
                className='px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105'
                style={{
                  background: 'hsl(270 80% 60% / 0.12)',
                  color: 'hsl(270 80% 60%)',
                  border: '1px solid hsl(270 80% 60% / 0.3)',
                }}
              >
                Academy →
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
