import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { radarNormalize } from '../utils/bentonMethodCalcs';
import type { BentonMethodStats } from '../types/geoforge.types';

interface Props {
  stats: BentonMethodStats;
  label?: string;
}

const AXIS_LABELS: Record<string, string> = {
  medianRatio: 'Median Ratio',
  cod: 'COD',
  prd: 'PRD',
  prb: 'PRB',
  vei: 'VEI',
  aad: 'AAD',
};

export function EquitySignatureRadar({ stats, label }: Props) {
  const normalized = radarNormalize(stats);
  const data = Object.entries(normalized).map(([key, value]) => ({
    axis: AXIS_LABELS[key] ?? key,
    score: Math.round(value * 100),
    fullMark: 100,
  }));

  return (
    <div className="w-full">
      {label && (
        <p className="text-xs text-muted-foreground text-center mb-1">{label}</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            name="Equity Score"
            dataKey="score"
            stroke="#00FFFF"
            fill="#00FFFF"
            fillOpacity={0.12}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: '#0A0E1A',
              border: '1px solid #334155',
              fontSize: 12,
              borderRadius: 6,
            }}
            formatter={(v: number) => [`${v}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
