import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DATA: Array<{ name: string; value: number }> = [];

export const StrategyDashboard = () => {
  // 1. EXTRACT TOKENS AS STRINGS
  // We use the direct token values for JS-heavy libs that can't parse CSS vars
  // Assuming TF_TOKENS.colors.brand.transcend[500] exists, or we use a helper.
  // For safety in v1, we can use the hex from the token definition if available,
  // OR use a CSS variable resolver if the lib supports it.

  // Safe approach: If tokens.ts exports hex strings, use them.
  // If tokens.ts only exports CSS vars, use the fallback pattern you provided:

  const axisColor = 'var(--tf-foreground-dim)'; // SVG/HTML accepts vars
  const gridColor = 'var(--tf-glass-border)';

  // For Line stroke, Recharts usually accepts CSS vars in modern browsers,
  // but let's be safe and use the token map if available.
  const lineColor = 'var(--tf-transcend-cyan)';

  return (
    <div className='h-64 w-full rounded-[var(--tf-radius-panel)] border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] p-4'>
      <h3 className='mb-4 text-xs font-bold tracking-widest text-[var(--tf-transcend-cyan)]'>
        VALUATION VELOCITY
      </h3>

      {DATA.length > 0 ? (
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={DATA}>
          <CartesianGrid strokeDasharray='3 3' stroke={gridColor} />
          <XAxis
            dataKey='name'
            stroke={axisColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={axisColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tf-substrate)',
              borderColor: 'var(--tf-glass-border)',
              color: 'var(--tf-foreground)',
            }}
            itemStyle={{ color: 'var(--tf-transcend-cyan)' }}
          />
          <Line
            type='monotone'
            dataKey='value'
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, stroke: 'var(--tf-substrate)', strokeWidth: 2 }}
          />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className='flex h-full items-center justify-center text-xs text-[var(--tf-foreground-muted)]'>
          No governed valuation velocity data loaded.
        </div>
      )}
    </div>
  );
};
