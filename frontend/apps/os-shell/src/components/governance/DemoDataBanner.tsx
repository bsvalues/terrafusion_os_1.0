/**
 * DemoDataBanner — visible indicator that a module is using non-live data.
 *
 * Required by governance: any module rendering simulated or cached review data
 * must disclose that it is not authoritative live county evidence.
 */

import React from 'react';

const WARNING_BACKGROUND = 'hsl(var(--tf-warning) / 0.15)';
const WARNING_BORDER = 'hsl(var(--tf-warning) / 0.3)';
const WARNING_TEXT = 'hsl(var(--tf-warning))';

export interface DemoDataBannerProps {
  module: string;
  className?: string;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ module, className = '' }) => (
  <div
    role="status"
    className={className}
    style={{
      padding: '6px 16px',
      background: WARNING_BACKGROUND,
      borderBottom: `1px solid ${WARNING_BORDER}`,
      color: WARNING_TEXT,
      fontSize: 12,
      fontWeight: 600,
      textAlign: 'center',
      letterSpacing: '0.05em',
    }}
  >
    ⚠ NON-LIVE DATA — {module} is displaying non-live or simulated data, not live county data
  </div>
);
