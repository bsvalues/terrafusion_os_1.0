import React from 'react';

// TFR-016: Tax year dropdown selector

interface TaxYearSelectorProps {
  years: number[];
  selected?: number;
  onChange: (year: number) => void;
}

export default function TaxYearSelector({ years, selected, onChange }: TaxYearSelectorProps) {
  const defaultSelected = selected ?? (years.length > 0 ? years[0] : undefined);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ fontSize: 12, color: '#94a3b8' }}>Tax Year</label>
      <select
        value={defaultSelected}
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
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
