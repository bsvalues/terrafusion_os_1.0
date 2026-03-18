import React from 'react';

// TFR-016: Single VEI metric display with IAAO compliance status

interface VEIMetricCardProps {
  label: string;
  value: number;
  format: 'number' | 'ratio' | 'percent';
  iaaoThreshold?: number; // for single-threshold metrics like COD
  iaaoMin?: number; // for range-based metrics
  iaaoMax?: number;
  onClick?: () => void;
}

type Status = 'pass' | 'marginal' | 'fail';

function getStatus(
  value: number,
  threshold?: number,
  min?: number,
  max?: number,
): Status {
  if (threshold != null) {
    if (value <= threshold) return 'pass';
    if (value <= threshold * 1.33) return 'marginal';
    return 'fail';
  }
  if (min != null && max != null) {
    if (value >= min && value <= max) return 'pass';
    const margin = (max - min) * 0.5;
    if (value >= min - margin && value <= max + margin) return 'marginal';
    return 'fail';
  }
  return 'marginal';
}

const statusConfig: Record<Status, { color: string; label: string; bg: string }> = {
  pass: { color: '#22c55e', label: 'IAAO Pass', bg: '#22c55e10' },
  marginal: { color: '#eab308', label: 'Marginal', bg: '#eab30810' },
  fail: { color: '#ef4444', label: 'IAAO Fail', bg: '#ef444410' },
};

export default function VEIMetricCard({
  label,
  value,
  format,
  iaaoThreshold,
  iaaoMin,
  iaaoMax,
  onClick,
}: VEIMetricCardProps) {
  const status = getStatus(value, iaaoThreshold, iaaoMin, iaaoMax);
  const cfg = statusConfig[status];

  const formatted =
    format === 'ratio'
      ? value.toFixed(4)
      : format === 'percent'
        ? `${(value * 100).toFixed(2)}%`
        : value.toFixed(2);

  return (
    <div
      onClick={onClick}
      style={{
        flex: '1 1 140px',
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${cfg.color}33`,
        backgroundColor: cfg.bg,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{formatted}</div>
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          backgroundColor: cfg.color,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
