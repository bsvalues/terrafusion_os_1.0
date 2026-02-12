/**
 * ProjectionsChart - lightweight SVG line chart
 * Inputs: points with year, net, levy
 */

import React, { useMemo } from 'react';

export type ProjectionPoint = { year: number; net: number; levy: number };

interface ProjectionsChartProps {
  points: ProjectionPoint[];
  width?: number;
  height?: number;
  descriptionId?: string;
}

export const ProjectionsChart: React.FC<ProjectionsChartProps> = ({ points, width = 800, height = 300, descriptionId }) => {
  const padding = { top: 16, right: 24, bottom: 28, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const { xScale, yScale, years, maxVal, minYear, maxYear } = useMemo(() => {
    const ys = points.map((p) => p.year);
    const minYear = Math.min(...ys);
    const maxYear = Math.max(...ys);
    const years = Array.from(new Set(ys)).sort((a, b) => a - b);
    const maxVal = Math.max(...points.map((p) => Math.max(p.net, p.levy)), 1);
    const xScale = (year: number) => {
      if (maxYear === minYear) return padding.left + innerW / 2;
      return padding.left + ((year - minYear) / (maxYear - minYear)) * innerW;
    };
    const yScale = (val: number) => padding.top + innerH - (val / maxVal) * innerH;
    return { xScale, yScale, years, maxVal, minYear, maxYear };
  }, [points, innerW, innerH]);

  const pathFor = (key: keyof ProjectionPoint) => {
    if (points.length === 0) return '';
    return points
      .sort((a, b) => a.year - b.year)
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year)} ${yScale(p[key] as number)}`)
      .join(' ');
  };

  const ticks = useMemo(() => {
    const t = years.length <= 8 ? years : years.filter((_, i) => i % Math.ceil(years.length / 8) === 0);
    return t;
  }, [years]);

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label="Revenue projections chart"
      aria-describedby={descriptionId}
    >
      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill="#0A0E1A" />

      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#1E293B" />
      <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#1E293B" />

      {/* X ticks */}
      {ticks.map((y) => (
        <g key={y}>
          <line x1={xScale(y)} y1={padding.top + innerH} x2={xScale(y)} y2={padding.top + innerH + 6} stroke="#334155" />
          <text x={xScale(y)} y={padding.top + innerH + 20} fill="#94a3b8" fontSize={10} textAnchor="middle">
            {y}
          </text>
        </g>
      ))}

      {/* Y ticks (4) */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const vy = padding.top + innerH - r * innerH;
        const val = Math.round(maxVal * r);
        return (
          <g key={i}>
            <line x1={padding.left - 6} y1={vy} x2={padding.left} y2={vy} stroke="#334155" />
            <text x={padding.left - 8} y={vy + 3} fill="#94a3b8" fontSize={10} textAnchor="end">
              ${val.toLocaleString()}
            </text>
            <line x1={padding.left} y1={vy} x2={padding.left + innerW} y2={vy} stroke="#0b1220" />
          </g>
        );
      })}

      {/* Lines */}
      <path d={pathFor('levy')} fill="none" stroke="#00FFFF" strokeWidth={2} />
      <path d={pathFor('net')} fill="none" stroke="#00FFAA" strokeWidth={2} />

      {/* Legend */}
      <g>
        <rect x={padding.left} y={padding.top - 10} width={12} height={2} fill="#00FFFF" />
        <text x={padding.left + 18} y={padding.top - 6} fill="#94a3b8" fontSize={10}>
          Levy Amount
        </text>
        <rect x={padding.left + 100} y={padding.top - 10} width={12} height={2} fill="#00FFAA" />
        <text x={padding.left + 118} y={padding.top - 6} fill="#94a3b8" fontSize={10}>
          Net Revenue
        </text>
      </g>
    </svg>
  );
};
