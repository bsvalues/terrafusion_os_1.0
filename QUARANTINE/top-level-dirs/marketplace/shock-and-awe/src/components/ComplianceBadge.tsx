import React from 'react';

export interface ComplianceBadgeProps {
  label: string;
  pass: boolean;
  detail?: string;
}

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({ label, pass, detail }) => {
  const bg = pass ? '#dcfce7' : '#fee2e2';
  const border = pass ? '#16a34a' : '#dc2626';
  const color = pass ? '#166534' : '#7f1d1d';
  return (
    <span title={detail}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        border: `1px solid ${border}`,
        color,
        background: bg,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600
      }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: border }} />
      {label}: {pass ? 'Pass' : 'Fail'}
    </span>
  );
};

export default ComplianceBadge;
