/**
 * DemoDataBanner — visible indicator that a module is using sample/fixture data.
 *
 * Required by governance: any module rendering hardcoded sample data
 * must display this banner so operators never mistake it for production data.
 */

import React from 'react';

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
      background: 'rgba(234, 179, 8, 0.15)',
      borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
      color: 'rgb(234, 179, 8)',
      fontSize: 12,
      fontWeight: 600,
      textAlign: 'center',
      letterSpacing: '0.05em',
    }}
  >
    ⚠ DEMO DATA — {module} is displaying sample fixtures, not live county data
  </div>
);
