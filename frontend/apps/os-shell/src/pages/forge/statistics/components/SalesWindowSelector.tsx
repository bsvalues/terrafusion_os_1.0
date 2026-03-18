import React from 'react';

// TFR-016: Sales window dropdown selector (6/12/18/24 months)

interface SalesWindowSelectorProps {
  selected?: number;
  onChange: (months: number) => void;
}

const windowOptions = [
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
  { value: 18, label: '18 Months' },
  { value: 24, label: '24 Months' },
];

export default function SalesWindowSelector({ selected = 12, onChange }: SalesWindowSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ fontSize: 12, color: '#94a3b8' }}>Sales Window</label>
      <select
        value={selected}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #334155',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {windowOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
