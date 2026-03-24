/**
 * DataModeIndicator — TopBar system status chip
 *
 * Shows whether the OS is running on live backend data or falling back to
 * mock/fixture data. Belongs in TopBar Zone C alongside SentinelChip.
 *
 * Previously lived in Taskbar.tsx (wrong chrome surface).
 *
 * @module shell/desktop/DataModeIndicator
 */

import React from 'react';
import { useDataMode } from '../../hooks/useDataMode';

export const DataModeIndicator: React.FC = () => {
  const { mode, connected } = useDataMode();
  const hasBackendHealth = mode === 'live' && connected;

  return (
    <div
      title={hasBackendHealth ? 'Backend health responding' : 'Backend health unavailable; mock data active'}
      className='flex items-center gap-1.5 px-2 py-0.5 rounded-md cursor-default select-none'
      style={{
        background: hasBackendHealth
          ? 'hsl(142 71% 45% / 0.12)'
          : 'hsl(38 92% 50% / 0.12)',
      }}
    >
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: hasBackendHealth ? 'hsl(142 71% 45%)' : 'hsl(38 92% 50%)',
          boxShadow: hasBackendHealth
            ? '0 0 5px hsl(142 71% 45% / 0.6)'
            : '0 0 5px hsl(38 92% 50% / 0.6)',
          flexShrink: 0,
        }}
      />
      <span
        className='text-[10px] font-semibold tracking-wider'
        style={{
          color: hasBackendHealth ? 'hsl(142 71% 45%)' : 'hsl(38 92% 50%)',
        }}
      >
        {hasBackendHealth ? 'LIVE' : 'MOCK'}
      </span>
    </div>
  );
};

export default DataModeIndicator;
