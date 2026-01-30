import { useEffect } from 'react';
import { useSentinelStore } from './sentinelStore';
import { useSentinel } from './useSentinel';

function statusColor(status: 'healthy' | 'degraded' | 'down') {
  if (status === 'healthy') return 'bg-emerald-400';
  if (status === 'degraded') return 'bg-amber-400';
  return 'bg-red-400';
}

function statusLabel(status: 'healthy' | 'degraded' | 'down') {
  if (status === 'healthy') return 'Healthy';
  if (status === 'degraded') return 'Degraded';
  return 'Down';
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
          variant === 'floating' ? 'fixed top-4 right-4 z-[100]' : 'relative'
        } glass-panel px-3 py-1.5 rounded-full text-[11px] font-mono text-slate-100 flex items-center gap-2 hover:bg-white/10 transition`}
        onClick={togglePanel}
        title='Sentinel diagnostics (Ctrl+Shift+S)'
      >
        <span className={`w-2 h-2 rounded-full ${statusColor(status)} animate-pulse`} />
        <span className='tracking-wide'>SENTINEL</span>
        <span className='text-white/60'>{statusLabel(status)}</span>
        {intentFilter && moduleCountActive !== null && moduleCountTotal !== null && (
          <span
            className='text-white/50'
            title={`Filtered by intent: ${intentFilter} (active/total)`}
          >
            · {moduleCountActive}/{moduleCountTotal}
          </span>
        )}
        {latencyMs !== null && <span className='text-white/50'>· {latencyMs}ms</span>}
      </button>
    </>
  );
}

export default SentinelChip;
