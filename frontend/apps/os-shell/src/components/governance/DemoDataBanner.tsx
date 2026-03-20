/**
 * DemoDataBanner — visible indicator that a module is using sample/fixture data.
 *
 * Required by governance: any module rendering hardcoded sample data
 * must display this banner so operators never mistake it for production data.
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
    ⚠ DEMO DATA — {module} is displaying sample fixtures, not live county data
  </div>
);
