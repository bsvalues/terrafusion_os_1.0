/**
 * County Pulse Demo — County-Level Intelligence Dashboard
 * ===================================================================
 * Conference demo route: /atlas/county-pulse/demo
 *
 * "What's happening in my county right now?"
 *
 * Shows: Growth Signals, Permit Activity, Development Activity,
 * Risk Watch, Top 5 Things to Watch, Now What?
 *
 * Uses static demo data for conference reliability.
 */

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  TrendingUp,
  Building2,
  AlertTriangle,
  Eye,
  ArrowRight,
  MapPin,
  Activity,
  BarChart3,
  Shield,
} from 'lucide-react';

interface PulseMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

const GROWTH_SIGNALS: PulseMetric[] = [
  { label: 'Total Assessed Value', value: '$12.4B', change: '+4.2% YoY', trend: 'up' },
  { label: 'Median Sale Price', value: '$425,000', change: '+6.8% YoY', trend: 'up' },
  { label: 'Sales Volume (12mo)', value: '3,847', change: '-2.1% YoY', trend: 'down' },
  { label: 'New Parcels Added', value: '312', change: '+18% YoY', trend: 'up' },
];

const PERMIT_ACTIVITY: PulseMetric[] = [
  { label: 'Active Permits', value: '487', change: '+12% vs Q1', trend: 'up' },
  { label: 'New Residential', value: '234', change: '+8% YoY', trend: 'up' },
  { label: 'New Commercial', value: '43', change: '+22% YoY', trend: 'up' },
  { label: 'Avg. Days to Assessment', value: '38', change: '-5 days', trend: 'down' },
];

interface DevelopmentArea {
  name: string;
  permits: number;
  velocity: string;
  impact: string;
}

const DEVELOPMENT_AREAS: DevelopmentArea[] = [
  { name: 'Badger Mountain South', permits: 67, velocity: 'High', impact: '$48M new value' },
  { name: 'Horn Rapids Triangle', permits: 34, velocity: 'Medium', impact: '$22M new value' },
  { name: 'West Richland Gateway', permits: 28, velocity: 'Medium', impact: '$19M new value' },
  { name: 'Kennewick Downtown Core', permits: 15, velocity: 'Moderate', impact: '$31M new value' },
  { name: 'Prosser Wine Country', permits: 12, velocity: 'Low', impact: '$8M new value' },
];

interface RiskItem {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

const RISK_WATCH: RiskItem[] = [
  {
    severity: 'high',
    title: 'Ratio drift in Badger Mountain neighborhoods',
    detail: 'Uniformity score (COD) of 18.2 in BM-South (target: below 15). Rapid appreciation outpacing assessed values. 234 properties need revaluation review. Decision: deploy field team to BM-South this cycle — if ratios are not corrected before the Dept. of Revenue study, the entire county risks a compliance finding.',
  },
  {
    severity: 'medium',
    title: 'Senior exemption backlog growing',
    detail: '312 exemptions unverified for 3+ years. Cross-reference with vital statistics pending — estimated 15-20% may be ineligible. Decision: batch-send 50 verification letters per week starting now — clearing this backlog recovers an estimated $180K-$240K in levy capacity.',
  },
  {
    severity: 'medium',
    title: 'Commercial income data gap',
    detail: 'Income questionnaire response rate at 28% (target: 35%). 47 commercial properties valued above $1M have no current income data. Decision: issue follow-up questionnaires with penalty notice for non-response — every 1% improvement in response rate improves income-approach accuracy by ~$2M in assessed value.',
  },
  {
    severity: 'low',
    title: 'Agricultural land conversion in west corridor',
    detail: '8 parcels rezoned from agricultural to residential in Q1. Land values need reclassification from current use to market value. Decision: reclassify before Q3 assessment roll — delay means underassessment of ~$4.2M and potential equity complaints from neighboring residential owners.',
  },
];

const TOP_5_WATCH = [
  {
    title: 'Badger Mountain South — Fastest Growth Corridor',
    detail: 'Why it matters: 67 permits in 6 months represent $48M in new construction value that must be captured before the assessment roll closes. Every month of delay is uncaptured value flowing through to the levy base. Prioritize field resources here first.',
  },
  {
    title: 'Industrial Market Shift Near I-82',
    detail: 'Why it matters: Three major warehouse permits signal a potential market reclassification for the interchange area. If all three build, $15M+ enters the commercial roll — but infrastructure bonds tied to the interchange could offset levy gains. Model both scenarios before the next commissioner briefing.',
  },
  {
    title: 'BOE Appeal Season Approaching',
    detail: 'Why it matters: 87 appeals filed (23% above last year) means your defense workload just increased by a quarter. Commercial properties account for 61% of total appealed value — a single lost commercial appeal can shift more value than 50 residential wins. Pre-build defense packets for the top 20 by dollar value now.',
  },
  {
    title: 'Legislative Session — HB 2147',
    detail: 'Why it matters: If the senior exemption income threshold rises from $40,000 to $55,000, an estimated 340 additional Benton County properties qualify — creating a $2.1M hole in the levy base that other taxpayers absorb. Model the shifted burden now so commissioners have the data before the vote.',
  },
  {
    title: 'Ratio Study Due in 90 Days',
    detail: 'Why it matters: Preliminary median is 0.94 with uniformity score (COD) of 13.8 — passing, but three neighborhoods are dragging the numbers. If those neighborhoods slip further, the county risks a conditional finding from Dept. of Revenue. Targeted review of those three areas is the highest-ROI use of analyst time this quarter.',
  },
];

const SEVERITY_COLORS = {
  high: 'hsl(0 70% 55%)',
  medium: 'hsl(35 90% 50%)',
  low: 'hsl(210 70% 55%)',
};

function MetricCard({ metric }: { metric: PulseMetric }) {
  const trendColor =
    metric.trend === 'up'
      ? 'hsl(150 70% 45%)'
      : metric.trend === 'down'
        ? 'hsl(0 70% 55%)'
        : 'hsl(var(--tf-muted))';

  return (
    <div
      className='p-4 rounded-xl'
      style={{
        background: 'hsl(var(--tf-card-bg))',
        border: '1px solid hsl(var(--tf-border))',
      }}
    >
      <p className='text-xs mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>
        {metric.label}
      </p>
      <p className='text-2xl font-semibold mb-1' style={{ color: 'hsl(var(--tf-fg))' }}>
        {metric.value}
      </p>
      <p className='text-xs font-medium' style={{ color: trendColor }}>
        {metric.change}
      </p>
    </div>
  );
}

export default function CountyPulseDemo() {
  const navigate = useNavigate();

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
        <div className='max-w-[1600px] mx-auto px-6 py-5 flex items-center gap-4'>
          <button
            onClick={() => navigate('/atlas')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
            aria-label='Back to Atlas'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div
            className='p-2 rounded-lg'
            style={{ background: 'hsl(var(--tf-suite-atlas) / 0.15)' }}
          >
            <Activity size={24} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
          </div>
          <div className='flex-1'>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
              County Pulse — Benton County
            </h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
              What's happening in your county right now
            </p>
          </div>
          <div
            className='px-3 py-1.5 rounded-full text-xs font-medium'
            style={{
              background: 'hsl(150 70% 45% / 0.15)',
              color: 'hsl(150 70% 45%)',
            }}
          >
            Live Data • Q2 2026
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <div className='max-w-[1600px] mx-auto px-6 py-6 space-y-8'>
          <div className='rounded-xl p-5 mb-8' style={{
            background: 'linear-gradient(135deg, hsl(var(--tf-suite-atlas) / 0.08), hsl(210 90% 55% / 0.04))',
            border: '1px solid hsl(var(--tf-suite-atlas) / 0.2)',
          }}>
            <p className='text-xs font-medium uppercase tracking-wider mb-2' style={{ color: 'hsl(var(--tf-suite-atlas))' }}>
              County Intelligence Summary
            </p>
            <p className='text-lg font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
              Benton County is growing faster than its assessment infrastructure can keep up — the south corridors are adding $128M in new value while ratio compliance is slipping in exactly those neighborhoods. Fix the ratios first, then ride the growth.
            </p>
          </div>

          {/* Growth Signals */}
          <section>
            <div className='flex items-center gap-2 mb-1'>
              <TrendingUp size={18} style={{ color: 'hsl(150 70% 45%)' }} />
              <h2 className='text-base font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Growth Signals
              </h2>
            </div>
            <p className='text-sm mb-4 ml-7' style={{ color: 'hsl(var(--tf-muted))' }}>
              Where growth is concentrated and what it means for assessments
            </p>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              {GROWTH_SIGNALS.map((m) => (
                <MetricCard key={m.label} metric={m} />
              ))}
            </div>
          </section>

          {/* Permit Activity */}
          <section>
            <div className='flex items-center gap-2 mb-1'>
              <Building2 size={18} style={{ color: 'hsl(210 90% 55%)' }} />
              <h2 className='text-base font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Permit Activity
              </h2>
            </div>
            <p className='text-sm mb-4 ml-7' style={{ color: 'hsl(var(--tf-muted))' }}>
              Construction patterns that signal future value changes
            </p>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              {PERMIT_ACTIVITY.map((m) => (
                <MetricCard key={m.label} metric={m} />
              ))}
            </div>
          </section>

          {/* Development Activity */}
          <section>
            <div className='flex items-center gap-2 mb-1'>
              <MapPin size={18} style={{ color: 'hsl(25 95% 55%)' }} />
              <h2 className='text-base font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Development Activity — Growth Corridors
              </h2>
            </div>
            <p className='text-sm mb-4 ml-7' style={{ color: 'hsl(var(--tf-muted))' }}>
              Where to allocate field resources for maximum value capture
            </p>
            <div
              className='rounded-xl overflow-hidden'
              style={{
                background: 'hsl(var(--tf-card-bg))',
                border: '1px solid hsl(var(--tf-border))',
              }}
            >
              <table className='w-full text-sm'>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                    <th
                      className='text-left px-5 py-3 text-xs font-medium uppercase tracking-wider'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      Corridor
                    </th>
                    <th
                      className='text-right px-5 py-3 text-xs font-medium uppercase tracking-wider'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      Permits (6mo)
                    </th>
                    <th
                      className='text-center px-5 py-3 text-xs font-medium uppercase tracking-wider'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      Velocity
                    </th>
                    <th
                      className='text-right px-5 py-3 text-xs font-medium uppercase tracking-wider'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      Estimated Impact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEVELOPMENT_AREAS.map((area, i) => (
                    <tr
                      key={area.name}
                      style={{
                        borderBottom:
                          i < DEVELOPMENT_AREAS.length - 1
                            ? '1px solid hsl(var(--tf-border) / 0.5)'
                            : undefined,
                      }}
                    >
                      <td className='px-5 py-3' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {area.name}
                      </td>
                      <td
                        className='px-5 py-3 text-right font-medium'
                        style={{ color: 'hsl(var(--tf-fg))' }}
                      >
                        {area.permits}
                      </td>
                      <td className='px-5 py-3 text-center'>
                        <span
                          className='px-2 py-0.5 rounded-full text-xs font-medium'
                          style={{
                            background:
                              area.velocity === 'High'
                                ? 'hsl(150 70% 45% / 0.15)'
                                : area.velocity === 'Medium'
                                  ? 'hsl(35 90% 50% / 0.15)'
                                  : 'hsl(var(--tf-fg) / 0.05)',
                            color:
                              area.velocity === 'High'
                                ? 'hsl(150 70% 45%)'
                                : area.velocity === 'Medium'
                                  ? 'hsl(35 90% 50%)'
                                  : 'hsl(var(--tf-muted))',
                          }}
                        >
                          {area.velocity}
                        </span>
                      </td>
                      <td
                        className='px-5 py-3 text-right font-medium'
                        style={{ color: 'hsl(150 70% 45%)' }}
                      >
                        {area.impact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Risk Watch */}
          <section>
            <div className='flex items-center gap-2 mb-1'>
              <Shield size={18} style={{ color: 'hsl(0 70% 55%)' }} />
              <h2 className='text-base font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Risk Watch
              </h2>
            </div>
            <p className='text-sm mb-4 ml-7' style={{ color: 'hsl(var(--tf-muted))' }}>
              Issues that cost money if ignored and what to do about each one
            </p>
            <div className='space-y-3'>
              {RISK_WATCH.map((risk) => (
                <div
                  key={risk.title}
                  className='p-4 rounded-xl flex items-start gap-4'
                  style={{
                    background: 'hsl(var(--tf-card-bg))',
                    border: '1px solid hsl(var(--tf-border))',
                    borderLeft: `3px solid ${SEVERITY_COLORS[risk.severity]}`,
                  }}
                >
                  <AlertTriangle
                    size={18}
                    className='mt-0.5 shrink-0'
                    style={{ color: SEVERITY_COLORS[risk.severity] }}
                  />
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <h3
                        className='text-sm font-medium'
                        style={{ color: 'hsl(var(--tf-fg))' }}
                      >
                        {risk.title}
                      </h3>
                      <span
                        className='text-xs px-2 py-0.5 rounded-full uppercase font-medium'
                        style={{
                          background: `${SEVERITY_COLORS[risk.severity]}15`,
                          color: SEVERITY_COLORS[risk.severity],
                        }}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {risk.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top 5 Things to Watch */}
          <section>
            <div className='flex items-center gap-2 mb-1'>
              <Eye size={18} style={{ color: 'hsl(270 80% 60%)' }} />
              <h2 className='text-base font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Top 5 Things to Watch
              </h2>
            </div>
            <p className='text-sm mb-4 ml-7' style={{ color: 'hsl(var(--tf-muted))' }}>
              The items with the highest potential to change your assessment roll this cycle
            </p>
            <div className='space-y-3'>
              {TOP_5_WATCH.map((item, i) => (
                <div
                  key={item.title}
                  className='p-4 rounded-xl flex items-start gap-4'
                  style={{
                    background: 'hsl(var(--tf-card-bg))',
                    border: '1px solid hsl(var(--tf-border))',
                  }}
                >
                  <div
                    className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold'
                    style={{
                      background: 'hsl(270 80% 60% / 0.15)',
                      color: 'hsl(270 80% 60%)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3
                      className='text-sm font-medium mb-1'
                      style={{ color: 'hsl(var(--tf-fg))' }}
                    >
                      {item.title}
                    </h3>
                    <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Now What? */}
          <section
            className='rounded-xl p-6'
            style={{
              background: 'linear-gradient(135deg, hsl(var(--tf-suite-atlas) / 0.08), hsl(270 80% 60% / 0.08))',
              border: '1px solid hsl(var(--tf-suite-atlas) / 0.2)',
            }}
          >
            <div className='flex items-center gap-2 mb-1'>
              <ArrowRight size={18} style={{ color: 'hsl(120 60% 45%)' }} />
              <h2 className='text-base font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Now What?
              </h2>
            </div>
            <p className='text-sm mb-4 ml-7' style={{ color: 'hsl(var(--tf-muted))' }}>
              Prioritized actions by timeframe — each tied to a specific risk or opportunity above
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                  This Week
                </h3>
                <ul className='text-sm space-y-1.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <li>• Assign 2 field appraisers to Badger Mountain South — pull the 234-parcel revaluation list from PACS and split by neighborhood code</li>
                  <li>• Mail first batch of 50 senior exemption verification letters — start with exemptions oldest by verification date</li>
                  <li>• Pull comparable data for top 20 BOE appeals by dollar value and assign defense packets to senior staff</li>
                </ul>
              </div>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                  This Month
                </h3>
                <ul className='text-sm space-y-1.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <li>• Finalize ratio study — run targeted reviews on the three flagged neighborhoods to bring uniformity score below 15 before Dept. of Revenue submission deadline</li>
                  <li>• Send Q2 commercial income questionnaires with penalty notice — target the 47 properties over $1M with no current income data first</li>
                  <li>• Complete new-construction assessments for 43 commercial permits nearing occupancy — $31M+ in value to capture</li>
                </ul>
              </div>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                  This Quarter
                </h3>
                <ul className='text-sm space-y-1.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                  <li>• Reclassify 8 ag-to-residential parcels in the west corridor — file with Dept. of Revenue before Q3 roll to avoid underassessment of ~$4.2M</li>
                  <li>• Build HB 2147 impact model showing $2.1M levy shift if passed — deliver to commissioners before legislative session vote</li>
                  <li>• Prepare quarterly commissioner briefing with growth corridor analysis, BOE outcomes, and ratio study results as a single decision package</li>
                </ul>
              </div>
            </div>
          </section>

          <div className='rounded-xl p-5 flex items-center justify-between' style={{
            background: 'hsl(var(--tf-card-bg) / 0.5)',
            border: '1px solid hsl(var(--tf-border))',
          }}>
            <div>
              <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                TerraFusion Atlas • County Pulse • Benton County, WA
              </p>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => navigate('/atlas/dossier/demo')}
                className='px-3 py-2 rounded-lg text-xs font-medium transition-colors'
                style={{
                  background: 'hsl(var(--tf-suite-atlas) / 0.1)',
                  color: 'hsl(var(--tf-suite-atlas))',
                  border: '1px solid hsl(var(--tf-suite-atlas) / 0.2)',
                }}
              >
                Atlas Dossier →
              </button>
              <button
                onClick={() => navigate('/demo')}
                className='px-3 py-2 rounded-lg text-xs font-medium transition-colors'
                style={{
                  background: 'hsl(270 80% 60% / 0.1)',
                  color: 'hsl(270 80% 60%)',
                  border: '1px solid hsl(270 80% 60% / 0.2)',
                }}
              >
                Demo Landing →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
