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
  TrendingDown,
  AlertTriangle,
  Shield,
  TreePine,
  Droplets,
  GraduationCap,
  DollarSign,
  Calendar,
  Ruler,
  Tag,
  Users,
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
  qualityClass: 'Good (Class 4)',
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
    <div className='flex items-center gap-3 mb-5'>
      <div className='p-2.5 rounded-xl' style={{ background: `${color}12` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <h2 className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
          {title}
        </h2>
        <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function DataRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className='flex justify-between items-baseline py-1.5'>
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
  const color = colors[severity];

  return (
    <div
      className='p-4 rounded-xl'
      style={{
        background: 'hsl(var(--tf-card-bg))',
        border: '1px solid hsl(var(--tf-border))',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className='flex items-start gap-3'>
        <Icon size={18} className='mt-0.5 shrink-0' style={{ color }} />
        <div>
          <h4 className='text-sm font-medium mb-1' style={{ color: 'hsl(var(--tf-fg))' }}>
            {title}
          </h4>
          <p className='text-sm leading-relaxed' style={{ color: 'hsl(var(--tf-muted))' }}>
            {description}
          </p>
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
              className='text-xs font-medium uppercase tracking-wider'
              style={{ color: 'hsl(var(--tf-suite-atlas))' }}
            >
              Atlas Property Dossier
            </p>
            <h1 className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
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
                className='flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap hover:bg-white/5'
                style={{
                  color: 'hsl(var(--tf-muted))',
                  borderBottom: '2px solid transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`dossier-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Icon size={14} />
                {s.label}
              </a>
            );
          })}
        </nav>
      </header>

      {/* Dossier Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <div className='max-w-[1100px] mx-auto px-6 py-8 space-y-10'>

          {/* ================================================================ */}
          {/* SECTION 1: Property Snapshot — What is this? */}
          {/* ================================================================ */}
          <section id='dossier-snapshot'>
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
                  <p className='text-xs mb-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>Assessed Value</p>
                  <p className='text-xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(DEMO_PARCEL.assessedValue)}</p>
                  <p className='text-xs font-medium' style={{ color: 'hsl(150 70% 45%)' }}>
                    +{DEMO_PARCEL.changePercent}% from prior year
                  </p>
                </div>
                <div>
                  <p className='text-xs mb-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>Market Value</p>
                  <p className='text-xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{fmt(DEMO_PARCEL.marketValue)}</p>
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
          {/* ================================================================ */}
          <section id='dossier-context'>
            <SectionHeader
              icon={Layers}
              title='Context'
              subtitle='What surrounds this property?'
              color='hsl(210 90% 55%)'
            />

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {/* Context cards */}
              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <MapPin size={16} style={{ color: 'hsl(210 90% 55%)' }} />
                  <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Location</h3>
                </div>
                <DataRow label='Latitude' value='46.2567° N' />
                <DataRow label='Longitude' value='119.3012° W' />
                <DataRow label='Elevation' value='407 ft' />
                <DataRow label='Census Tract' value='010702' />
                <DataRow label='Tax Area' value='310' />
              </div>

              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <GraduationCap size={16} style={{ color: 'hsl(270 80% 60%)' }} />
                  <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Schools</h3>
                </div>
                <DataRow label='District' value='Richland SD #400' />
                <DataRow label='Elementary' value='White Bluffs Elementary' />
                <DataRow label='Middle' value='Enterprise Middle School' />
                <DataRow label='High' value='Richland High School' />
                <DataRow label='Distance' value='0.8 mi (elementary)' />
              </div>

              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <Droplets size={16} style={{ color: 'hsl(200 80% 50%)' }} />
                  <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Environmental</h3>
                </div>
                <DataRow label='Flood Zone' value='Zone X (Minimal Risk)' />
                <DataRow label='Wetlands' value='None Identified' />
                <DataRow label='Seismic Zone' value='Zone 2B' />
                <DataRow label='Fire Risk' value='Low' />
                <DataRow label='Soil Type' value='Quincy fine sand' />
              </div>

              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <TreePine size={16} style={{ color: 'hsl(150 70% 45%)' }} />
                  <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Neighborhood Profile</h3>
                </div>
                <DataRow label='Type' value='Suburban Residential' />
                <DataRow label='Age Range' value='2015-2026 (New)' />
                <DataRow label='Median Home Value' value='$495,000' />
                <DataRow label='Median Lot Size' value='0.20 ac' />
                <DataRow label='HOA' value='Queensgate HOA ($85/mo)' />
              </div>

              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <Shield size={16} style={{ color: 'hsl(25 95% 55%)' }} />
                  <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Services</h3>
                </div>
                <DataRow label='Water' value='City of Richland' />
                <DataRow label='Sewer' value='City of Richland' />
                <DataRow label='Fire' value='Richland Fire Dept' />
                <DataRow label='Police' value='Richland PD' />
                <DataRow label='Trash' value='City collection' />
              </div>

              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <DollarSign size={16} style={{ color: 'hsl(35 90% 50%)' }} />
                  <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Tax Burden</h3>
                </div>
                <DataRow label='Annual Tax' value={fmt(DEMO_PARCEL.taxAmount)} accent />
                <DataRow label='Levy Rate' value={`$${DEMO_PARCEL.levyRate} / $1,000`} />
                <DataRow label='Exemptions' value='None' />
                <DataRow label='Special Assessments' value='LID #2019-04 ($0)' />
                <DataRow label='Delinquent' value='No' />
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
          <section id='dossier-activity'>
            <SectionHeader
              icon={Activity}
              title='Activity'
              subtitle='What is happening around this property?'
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
                      className='text-xs px-2 py-0.5 rounded-full whitespace-nowrap'
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
          <section id='dossier-signals'>
            <SectionHeader
              icon={Zap}
              title='Signals'
              subtitle='What should you pay attention to?'
              color='hsl(35 90% 50%)'
            />

            <div className='space-y-3'>
              <SignalCard
                icon={TrendingUp}
                title='Appreciation Trend: Steady Growth'
                description='This property has appreciated 28.9% since purchase in 2019 ($425,000 → $548,200 assessed). Annual compound growth rate of 3.7%. This is consistent with the Queensgate neighborhood average of 3.5-4.2% and reflects sustained demand for newer construction in south Richland.'
                severity='positive'
              />

              <SignalCard
                icon={Building2}
                title='Commercial Development Pressure'
                description='Two commercial permits totaling $3.05M have been issued within 0.5 miles on Queensgate Blvd (retail center and restaurant). This development activity typically signals 1-3% additional land value appreciation within a 1-mile radius over the following 18 months as amenity access improves.'
                severity='positive'
              />

              <SignalCard
                icon={BarChart3}
                title='Assessment Ratio: Well-Calibrated'
                description='Four comparable sales within the neighborhood show a median assessment-to-sale ratio of 1.00 with a tight range (0.98-1.02). This property is neither over- nor under-assessed relative to current market activity. No BOE appeal risk.'
                severity='positive'
              />

              <SignalCard
                icon={AlertTriangle}
                title='Watch: New Construction Competition'
                description='One new residential permit at 2900 Queensgate Dr ($520,000) may establish a comparable data point slightly below this property\'s assessed value. If the sale closes below $540,000, it could introduce downward pressure on the next assessment cycle. Monitor for 6 months.'
                severity='watch'
              />

              <SignalCard
                icon={Eye}
                title='Neighborhood Maturation Phase'
                description='Queensgate Phase 12 is transitioning from "new construction" to "established neighborhood" — the subdivision is nearly built out. Historically, this transition stabilizes appreciation rates but reduces volatility. Land value share (21%) is typical for a 5-7 year-old suburban development.'
                severity='neutral'
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 5: Atlas Insight — What does it mean? */}
          {/* ================================================================ */}
          <section id='dossier-insight'>
            <SectionHeader
              icon={Lightbulb}
              title='Atlas Insight'
              subtitle='What does all of this mean?'
              color='hsl(270 80% 60%)'
            />

            <div
              className='rounded-xl p-6'
              style={{
                background: 'linear-gradient(135deg, hsl(270 80% 60% / 0.06), hsl(210 90% 55% / 0.06))',
                border: '1px solid hsl(270 80% 60% / 0.15)',
              }}
            >
              <div className='space-y-4 text-sm leading-relaxed' style={{ color: 'hsl(var(--tf-fg) / 0.9)' }}>
                <p>
                  <strong style={{ color: 'hsl(var(--tf-fg))' }}>This is a well-positioned residential property in an appreciating market with low assessment risk.</strong>
                </p>
                <p>
                  The Queensgate neighborhood continues to attract buyer demand driven by newer housing stock,
                  proximity to Richland amenities, and quality schools (Richland SD #400). The property's assessed
                  value of {fmt(DEMO_PARCEL.assessedValue)} is well-supported by four recent comparable sales averaging
                  ${Math.round((555000 + 538000 + 572000 + 549000) / 4 / DEMO_PARCEL.totalSqft)}/SF — the subject at
                  ${Math.round(DEMO_PARCEL.assessedValue / DEMO_PARCEL.totalSqft)}/SF is within 3% of the market median.
                </p>
                <p>
                  The emerging commercial corridor on Queensgate Blvd ($3.05M in active permits) is the most significant
                  development signal. Retail and dining amenities within walking distance typically add 2-4% to
                  residential land values once operational. This property should benefit directly.
                </p>
                <p>
                  At a levy rate of ${DEMO_PARCEL.levyRate}/$1,000, the annual tax burden of {fmt(DEMO_PARCEL.taxAmount)} is
                  proportionate to services received. The largest share (44%) flows to Richland School District —
                  a key driver of the neighborhood's desirability.
                </p>
                <p style={{ color: 'hsl(var(--tf-muted))' }}>
                  <em>
                    No immediate action required. This property is accurately assessed, well-maintained, and
                    in a stable-to-appreciating market position. Next review recommended at the 2027 assessment cycle
                    or upon completion of the Queensgate Blvd commercial development.
                  </em>
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 6: Now What? */}
          {/* ================================================================ */}
          <section id='dossier-now-what'>
            <SectionHeader
              icon={ArrowRight}
              title='Now What?'
              subtitle='What should you do with this intelligence?'
              color='hsl(120 60% 45%)'
            />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
              {/* For the Assessor */}
              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-4'>
                  <FileText size={18} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                  <h3 className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    For the Assessor
                  </h3>
                </div>
                <ul className='space-y-2.5 text-sm' style={{ color: 'hsl(var(--tf-fg) / 0.85)' }}>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(150 70% 45%)' }} />
                    <span>No value adjustment needed — current assessment is within 2% of comparable sales median</span>
                  </li>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(35 90% 50%)' }} />
                    <span>Monitor 2900 Queensgate sale price when finalized — may establish new comparable baseline</span>
                  </li>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(210 70% 55%)' }} />
                    <span>Schedule Queensgate Blvd commercial impact analysis when development completes (est. Q4 2026)</span>
                  </li>
                </ul>
              </div>

              {/* For the Investor */}
              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-4'>
                  <TrendingUp size={18} style={{ color: 'hsl(150 70% 45%)' }} />
                  <h3 className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    For the Investor
                  </h3>
                </div>
                <ul className='space-y-2.5 text-sm' style={{ color: 'hsl(var(--tf-fg) / 0.85)' }}>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(150 70% 45%)' }} />
                    <span>Stable appreciation (3.7% CAGR) with commercial amenity upside in 12-18 months</span>
                  </li>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(150 70% 45%)' }} />
                    <span>Owner equity: ~{fmt(DEMO_PARCEL.marketValue - DEMO_PARCEL.lastSalePrice)} since 2019 purchase ({((DEMO_PARCEL.marketValue - DEMO_PARCEL.lastSalePrice) / DEMO_PARCEL.lastSalePrice * 100).toFixed(0)}% gain)</span>
                  </li>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(35 90% 50%)' }} />
                    <span>Tax-to-value ratio of {((DEMO_PARCEL.taxAmount / DEMO_PARCEL.marketValue) * 100).toFixed(2)}% — in line with Benton County average</span>
                  </li>
                </ul>
              </div>

              {/* For the Developer */}
              <div
                className='rounded-xl p-5'
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                }}
              >
                <div className='flex items-center gap-2 mb-4'>
                  <Building2 size={18} style={{ color: 'hsl(25 95% 55%)' }} />
                  <h3 className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                    For the Developer
                  </h3>
                </div>
                <ul className='space-y-2.5 text-sm' style={{ color: 'hsl(var(--tf-fg) / 0.85)' }}>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(150 70% 45%)' }} />
                    <span>Proven buyer demand: ${Math.round((555000 + 538000 + 572000 + 549000) / 4).toLocaleString()} average sale price for 2,700+ SF homes in Queensgate</span>
                  </li>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(210 70% 55%)' }} />
                    <span>Zoning: R-1 supports single-family. Remaining buildable lots in Phase 12 are limited — check Phase 13 availability</span>
                  </li>
                  <li className='flex gap-2'>
                    <ChevronRight size={14} className='mt-1 shrink-0' style={{ color: 'hsl(35 90% 50%)' }} />
                    <span>Land cost basis: ~$115,000/lot at current assessment — factor into pro forma</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* Dossier Footer */}
          {/* ================================================================ */}
          <div
            className='rounded-xl p-5 flex items-center justify-between'
            style={{
              background: 'hsl(var(--tf-card-bg) / 0.5)',
              border: '1px solid hsl(var(--tf-border))',
            }}
          >
            <div>
              <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                TerraFusion Atlas • Property Dossier • Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className='text-xs mt-0.5' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                Data sources: Benton County Assessor, PACS 9.0, Washington DOR, US Census
              </p>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => navigate('/atlas/county-pulse/demo')}
                className='px-3 py-2 rounded-lg text-xs font-medium transition-colors'
                style={{
                  background: 'hsl(var(--tf-suite-atlas) / 0.1)',
                  color: 'hsl(var(--tf-suite-atlas))',
                  border: '1px solid hsl(var(--tf-suite-atlas) / 0.2)',
                }}
              >
                County Pulse →
              </button>
              <button
                onClick={() => navigate('/academy')}
                className='px-3 py-2 rounded-lg text-xs font-medium transition-colors'
                style={{
                  background: 'hsl(270 80% 60% / 0.1)',
                  color: 'hsl(270 80% 60%)',
                  border: '1px solid hsl(270 80% 60% / 0.2)',
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
