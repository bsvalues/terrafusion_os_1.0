import { useEffect } from 'react';
import { useSentinelStore } from './sentinelStore';
import { useSentinel } from './useSentinel';
import { Z } from '../shell/desktop/zIndex';
import { NeonSignal, type NeonSignalStatus } from '@/ui/materials';

function toNeonStatus(status: 'healthy' | 'degraded' | 'down'): NeonSignalStatus {
  return status;
}

type SentinelChipProps = {
  variant?: 'floating' | 'tray';
};

export function SentinelChip({ variant = 'floating' }: SentinelChipProps) {
  const { status, latencyMs, intentFilter, moduleCountActive, moduleCountTotal } = useSentinel();
  const { togglePanel } = useSentinelStore();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button
        type='button'
        data-testid='system-health-indicator'
        className={`${
          variant === 'floating' ? 'fixed top-4 right-4' : 'relative'
        } hover:bg-white/10 transition`}
        style={variant === 'floating' ? { zIndex: Z.topbar } : undefined}
        onClick={togglePanel}
        title='Sentinel diagnostics (Ctrl+Shift+S)'
      >
        <NeonSignal status={toNeonStatus(status)} pulse size='sm'>
          SENTINEL
          {intentFilter && moduleCountActive !== null && moduleCountTotal !== null && (
            <span style={{ opacity: 0.6 }}>
              · {moduleCountActive}/{moduleCountTotal}
            </span>
          )}
          {latencyMs !== null && <span style={{ opacity: 0.6 }}>· {latencyMs}ms</span>}
        </NeonSignal>
      </button>
    </>
  );
}

export default SentinelChip;
