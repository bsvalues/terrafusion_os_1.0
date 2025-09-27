import React from 'react';

type CardProps = { title: string; value: string | number; hint?: string };
const StatCard = ({title, value, hint}: CardProps) => (
  <div className="rounded-xl border p-4">
    <div className="text-sm opacity-70">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
    {hint && <div className="text-xs opacity-60 mt-1">{hint}</div>}
  </div>
);

export default function GoldenThreadDashboard({metrics}:{metrics:any}){
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="φ" value={metrics?.phi ?? '1.618'} hint="Golden ratio constant"/>
      <StatCard title="Requests/min" value={metrics?.rpm ?? 0} hint="Service throughput"/>
      <StatCard title="SNR↑ (graph)" value={metrics?.snr ?? '--'} hint="Golden filter impact"/>
    </div>
  );
}
