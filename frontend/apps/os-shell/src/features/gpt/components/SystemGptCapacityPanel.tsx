/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTEMGPT CAPACITY PREDICTION PANEL
 * Phase 21: Capacity Prediction & Advisory
 * "Are we trending towards saturation?" "What should a county tech lead do?"
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import type { SystemGptCapacityPrediction } from '../../../api/systemDiagnosticsApi';

// ═══════════════════════════════════════════════════════════════
// RISK BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface RiskBadgeProps {
  risk: SystemGptCapacityPrediction['saturationRisk'];
}

function RiskBadge({ risk }: RiskBadgeProps) {
  const config = {
    Low: {
      bgClass: 'bg-emerald-500/20 border-emerald-500/40',
      textClass: 'text-emerald-400',
      icon: '✅',
      label: 'LOW RISK',
    },
    Medium: {
      bgClass: 'bg-amber-500/20 border-amber-500/40',
      textClass: 'text-amber-400',
      icon: '⚡',
      label: 'MODERATE',
    },
    High: {
      bgClass: 'bg-red-500/20 border-red-500/40',
      textClass: 'text-red-400',
      icon: '⚠️',
      label: 'HIGH RISK',
    },
  };

  const c = config[risk] ?? config.Low;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${c.bgClass}`}>
      <span className='text-sm'>{c.icon}</span>
      <span className={`text-xs font-semibold tracking-wider ${c.textClass}`}>{c.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TREND CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════

interface TrendChipProps {
  label: string;
  increasing: boolean;
}

function TrendChip({ label, increasing }: TrendChipProps) {
  if (increasing) {
    return (
      <span className='inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[0.65rem] text-amber-400'>
        <svg
          className='h-3 w-3'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={2}
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M5 10l7-7m0 0l7 7m-7-7v18' />
        </svg>
        {label}
      </span>
    );
  }

  return (
    <span className='inline-flex items-center gap-1 rounded-md bg-slate-500/15 border border-slate-500/30 px-2 py-0.5 text-[0.65rem] text-slate-500'>
      <svg
        className='h-3 w-3'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2}
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='M5 12h14' />
      </svg>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORECAST STAT COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ForecastStatProps {
  label: string;
  value: number;
  unit: string;
  subtext?: string;
}

function ForecastStat({ label, value, unit, subtext }: ForecastStatProps) {
  return (
    <div className='rounded-lg border border-cyan-500/20 bg-slate-900/60 px-3 py-2'>
      <div className='text-[0.6rem] uppercase tracking-wider text-slate-500'>{label}</div>
      <div className='flex items-baseline gap-1 mt-0.5'>
        <span className='text-lg font-semibold text-cyan-400'>{value.toFixed(1)}</span>
        <span className='text-xs text-slate-500'>{unit}</span>
      </div>
      {subtext && <div className='text-[0.55rem] text-slate-600 mt-0.5'>{subtext}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CAPACITY PANEL
// ═══════════════════════════════════════════════════════════════

interface SystemGptCapacityPanelProps {
  capacity: SystemGptCapacityPrediction | undefined | null;
  currentRpm?: number;
}

export function SystemGptCapacityPanel({ capacity, currentRpm = 0 }: SystemGptCapacityPanelProps) {
  // No capacity data available
  if (!capacity) {
    return (
      <div className='rounded-lg border border-slate-800/40 bg-slate-900/30 p-4'>
        <div className='flex items-center gap-2 text-slate-500'>
          <svg
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={1.5}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
          <span className='text-sm'>Capacity prediction unavailable - insufficient data</span>
        </div>
      </div>
    );
  }

  // Calculate RPM change
  const rpmChange = capacity.predictedRequestsPerMinuteIn5Min - currentRpm;
  const rpmChangePercent = currentRpm > 0 ? (rpmChange / currentRpm) * 100 : 0;
  const rpmTrending = rpmChangePercent > 10 ? 'up' : rpmChangePercent < -10 ? 'down' : 'stable';

  return (
    <div className='space-y-3'>
      {/* Header with Risk Badge */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-medium text-slate-300'>🔮 Capacity Forecast</h3>
          <p className='text-[0.65rem] text-slate-500'>5-minute prediction · Trend analysis</p>
        </div>
        <RiskBadge risk={capacity.saturationRisk} />
      </div>

      {/* Forecast Stats */}
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
        <ForecastStat
          label='Predicted RPM'
          value={capacity.predictedRequestsPerMinuteIn5Min}
          unit='req/min'
          subtext={
            rpmTrending === 'up'
              ? `↑ +${rpmChangePercent.toFixed(0)}% from now`
              : rpmTrending === 'down'
                ? `↓ ${rpmChangePercent.toFixed(0)}% from now`
                : 'Stable trend'
          }
        />
        <ForecastStat
          label='Current RPM'
          value={currentRpm}
          unit='req/min'
          subtext='Current load'
        />
        <div className='col-span-2 sm:col-span-1 flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-[0.6rem] uppercase tracking-wider text-slate-500 mb-1'>
              Trend Status
            </div>
            <div className='text-2xl'>
              {capacity.saturationRisk === 'High'
                ? '🔥'
                : capacity.saturationRisk === 'Medium'
                  ? '📈'
                  : '🌊'}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chips */}
      <div className='flex flex-wrap gap-2'>
        <TrendChip label='GPT Latency' increasing={capacity.latencyIncreasing} />
        <TrendChip label='Error Rate' increasing={capacity.errorRateIncreasing} />
        <TrendChip label='RAG Latency' increasing={capacity.ragLatencyIncreasing} />
      </div>

      {/* Advisory */}
      {capacity.advisory && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            capacity.saturationRisk === 'High'
              ? 'border-red-500/30 bg-red-900/20 text-red-300'
              : capacity.saturationRisk === 'Medium'
                ? 'border-amber-500/30 bg-amber-900/20 text-amber-300'
                : 'border-emerald-500/30 bg-emerald-900/20 text-emerald-300'
          }`}
        >
          <div className='text-[0.65rem] uppercase tracking-wider opacity-70 mb-1'>Advisory</div>
          <div className='text-sm leading-relaxed'>{capacity.advisory}</div>
        </div>
      )}
    </div>
  );
}

export default SystemGptCapacityPanel;
