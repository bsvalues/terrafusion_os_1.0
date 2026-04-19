// frontend/apps/os-shell/src/pages/forge/sales/audit/SaleScatterPlot.tsx
import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type { StratumSale } from '../../../services/forge/salesAuditApi';

interface Props {
  sales: StratumSale[];
  highlightedId?: string | null;
  onPointClick?: (id: string) => void;
}

function pointColor(sale: StratumSale, highlighted: string | null | undefined): string {
  if (sale.id === highlighted) return '#f0abfc';
  if (sale.qualificationDecision === 'disqualified') return '#ef4444';
  if (sale.aiFlag === 'AI_FLAGGED') return '#f97316';
  return '#38bdf8';
}

export function SaleScatterPlot({ sales, highlightedId, onPointClick }: Props) {
  const data = sales
    .filter(s => s.salePrice > 0 && s.ratio != null)
    .map(s => ({ id: s.id, x: s.salePrice / 1000, y: s.ratio! }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <XAxis
          dataKey="x" type="number" name="Sale Price ($k)"
          tick={{ fontSize: 10, fill: '#475569' }}
          tickFormatter={(v: number) => `$${v}k`}
        />
        <YAxis
          dataKey="y" type="number" name="Ratio" domain={[0.5, 1.5]}
          tick={{ fontSize: 10, fill: '#475569' }}
          width={36}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(val: number, name: string) =>
            name === 'Sale Price ($k)' ? [`$${val}k`, name] : [val.toFixed(3), 'Ratio']
          }
        />
        <ReferenceLine y={0.95} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
        <ReferenceLine y={1.05} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
        <Scatter
          data={data}
          onClick={(point: { id: string }) => onPointClick?.(point.id)}
          cursor="pointer"
        >
          {data.map(entry => (
            <Cell
              key={entry.id}
              fill={pointColor(sales.find(s => s.id === entry.id)!, highlightedId)}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
