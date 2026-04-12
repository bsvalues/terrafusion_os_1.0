// TerraFusion OS — Assessment Value Sparkline
// Mini area chart showing assessment value trend (recharts).
// Mined from terra-forge-rebuild src/components/workbench/AssessmentSparkline.tsx
// Self-contained: pure props, recharts only.

import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";

export interface AssessmentHistoryPoint {
  taxYear: number;
  landValue: number;
  improvementValue: number;
  totalValue: number | null;
}

export interface AssessmentSparklineProps {
  history: AssessmentHistoryPoint[];
}

export function AssessmentSparkline({ history }: AssessmentSparklineProps) {
  if (history.length < 2) return null;

  const data = [...history]
    .sort((a, b) => a.taxYear - b.taxYear)
    .map((h) => ({
      year: h.taxYear,
      value: h.totalValue ?? h.landValue + h.improvementValue,
    }));

  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const padding = (max - min) * 0.1 || 1000;

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as { year: number; value: number };
              return (
                <div className="bg-popover border border-border rounded-lg px-2 py-1 text-[10px] shadow-md">
                  <span className="text-muted-foreground">{d.year}:</span>{" "}
                  <span className="font-medium text-foreground">${d.value.toLocaleString()}</span>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-5))"
            strokeWidth={1.5}
            fill="url(#sparkFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
