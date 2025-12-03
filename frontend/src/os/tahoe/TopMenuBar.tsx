/**
 * Top Menu Bar Component
 * Uses existing TerraFusion brand tokens
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { useEffect, useState } from 'react';
import type { UserMode } from './Desktop';

interface TopMenuBarProps {
  mode: UserMode;
  activeWindowTitle?: string;
  onModeToggle: () => void;
  onSpotlightOpen: () => void;
}

export function TopMenuBar({
  mode,
  activeWindowTitle,
  onModeToggle,
  onSpotlightOpen,
}: TopMenuBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className='tahoe-menubar'>
      <div className='tahoe-menubar-left'>
        <div className='tahoe-menubar-logo'>
          <TerraSphere size='sm' variant='glow' />
          <span>TerraFusion OS</span>
        </div>
      </div>

      <div className='tahoe-menubar-center'>
        {activeWindowTitle && <div className='tahoe-menubar-title'>{activeWindowTitle}</div>}
      </div>

      <div className='tahoe-menubar-right'>
        <button
          className='tahoe-menubar-mode'
          onClick={onModeToggle}
          title={mode === 'county' ? 'Switch to Power User' : 'Switch to County Staff'}
        >
          {mode === 'county' ? '👥 County Staff' : '⚡ Power User'}
        </button>

        <button
          onClick={onSpotlightOpen}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px 8px',
            transition: 'all 200ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
          title='Spotlight (Cmd+Space)'
        >
          🔍
        </button>

        <div className='tahoe-menubar-time'>{formatTime(time)}</div>
      </div>
    </div>
  );
}
