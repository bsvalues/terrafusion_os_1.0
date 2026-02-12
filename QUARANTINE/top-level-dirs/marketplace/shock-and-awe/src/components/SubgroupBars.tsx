import React from 'react';

export interface SubgroupItem { name: string; value: number }
export interface SubgroupBarsProps {
  title: string;
  items: SubgroupItem[];
  min?: number;
  max?: number;
  format?: (v: number) => string;
}

export const SubgroupBars: React.FC<SubgroupBarsProps> = ({ title, items, min = 0, max = 1.5, format }) => {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <strong>{title}</strong>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((it) => {
          const pct = Math.max(0, Math.min(1, (it.value - min) / (max - min)));
          const width = 240;
          const height = 8;
          const w = Math.max(2, Math.round(width * pct));
          const label = format ? format(it.value) : it.value.toFixed(3);
          return (
            <div key={it.name} style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{it.name}</span>
                <span>{label}</span>
              </div>
              <svg width={width} height={height} role="img" aria-label={`${it.name} ${label}`}>
                <rect x={0} y={0} width={width} height={height} fill="#e5e7eb" rx={4} />
                <rect x={0} y={0} width={w} height={height} fill="#60a5fa" rx={4} />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubgroupBars;
