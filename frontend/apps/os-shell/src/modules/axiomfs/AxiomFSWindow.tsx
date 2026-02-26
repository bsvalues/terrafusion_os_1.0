import { useEffect, useState } from 'react';
import { AxiomSpinner } from '@/fs/components/AxiomSpinner';
import { AxiomFSToolbar } from './AxiomFSToolbar';
import { useAxiomFsStore } from '@/fs/store/axiomFsStore';

interface Props {
  windowId: string;
  metadata?: Record<string, any>;
}

export const AxiomFSWindow = ({ windowId, metadata }: Props) => {
  // 1. Connect to the Sovereign Store
  const { selectedId, objects, loadObject } = useAxiomFsStore();

  // 2. Determine Target Identity
  // Priority: Window Payload > Store Selection > Default Hero
  const targetId = metadata?.objectId || selectedId || 'PARCEL-2026-001';

  // 3. Resolve State from Lattice
  const activeObject = objects.get(targetId);
  const [isLongLoad, setIsLongLoad] = useState(false);

  // 4. The Diplomat Trigger (Mount & Sync)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!activeObject && targetId) {
      console.log(`[Shell] Requesting Bridge Access for: ${targetId}`);
      loadObject(targetId);

      // UX: If bridge takes > 1s, we show a specialized "Connecting" message
      timer = setTimeout(() => setIsLongLoad(true), 1000);
    }

    return () => clearTimeout(timer);
  }, [targetId, activeObject, loadObject]);

  // 5. Render Strategy
  return (
    <div
      data-testid='axiomfs-surface-host'
      className='flex h-full w-full flex-col bg-[var(--tf-substrate)] text-[var(--tf-foreground)] relative overflow-hidden'
    >
      <AxiomFSToolbar />
      {/* A. Header: Identity Strip */}
      <header className='flex h-12 shrink-0 items-center justify-between border-b border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] px-4 backdrop-blur-md z-10'>
        <div className='flex items-center gap-3'>
          {/* Status Indicator Light */}
          <div
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              activeObject
                ? 'bg-[var(--tf-success-green)] shadow-[0_0_8px_var(--tf-success-green)]'
                : 'bg-[var(--tf-signal-amber)] animate-pulse'
            }`}
          />
          <span className='font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--tf-foreground-dim)]'>
            LATTICE // {targetId}
          </span>
        </div>

        {/* Source Badge */}
        {activeObject?.metadata?.source && (
          <div className='flex items-center gap-2 rounded border border-[var(--tf-glass-border)] bg-[var(--tf-surface-dark)] px-2 py-1'>
            <div className='h-1.5 w-1.5 rounded-full bg-[var(--tf-transcend-cyan)]' />
            <span className='text-[9px] font-bold text-[var(--tf-foreground-dim)] uppercase'>
              {activeObject.metadata.source}
            </span>
          </div>
        )}
      </header>

      {/* B. Main Viewport */}
      <main className='relative flex-1 overflow-y-auto p-8 scrollbar-hide'>
        {!activeObject ? (
          // STATE: ESTABLISHING CONNECTION
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-6'>
            <AxiomSpinner size='lg' />
            <div className='flex flex-col items-center gap-1'>
              <span className='font-mono text-xs text-[var(--tf-transcend-cyan)] animate-pulse tracking-widest'>
                ESTABLISHING SECURE BRIDGE
              </span>
              {isLongLoad && (
                <span className='text-[10px] text-[var(--tf-signal-amber)]'>
                  NEGOTIATING WITH LEGACY IRON...
                </span>
              )}
            </div>
          </div>
        ) : (
          // STATE: RESOLVED TRUTH
          <div className='animate-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto'>
            {/* 1. The Hero Label */}
            <h1 className='text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight drop-shadow-md'>
              {activeObject.label}
            </h1>

            {/* 2. Taxonomy Tags */}
            <div className='flex flex-wrap gap-2 mb-10'>
              <span className='rounded bg-[var(--tf-surface-highlight)] px-3 py-1 text-[10px] font-bold text-[var(--tf-transcend-cyan)] border border-[var(--tf-transcend-cyan)]/20 shadow-[0_0_10px_hsl(var(--tf-accent)_/_0.1)]'>
                {activeObject.type.toUpperCase()}
              </span>
              <span
                className={`rounded px-3 py-1 text-[10px] font-bold text-black border border-transparent ${
                  activeObject.status === 'verified'
                    ? 'bg-[var(--tf-success-green)]'
                    : 'bg-[var(--tf-signal-amber)]'
                }`}
              >
                {activeObject.status.toUpperCase()}
              </span>
              {activeObject.tags?.map((tag) => (
                <span
                  key={tag}
                  className='rounded border border-[var(--tf-glass-border)] bg-[var(--tf-glass-bg)] px-3 py-1 text-[10px] text-[var(--tf-foreground-dim)]'
                >
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>

            {/* 3. The Data Lattice (Grid) */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--tf-glass-border)] rounded-lg overflow-hidden border border-[var(--tf-glass-border)]'>
              {/* Cell: Legal Description */}
              <div className='bg-[var(--tf-surface-dark)] p-6 hover:bg-[var(--tf-surface-highlight)] transition-colors duration-300'>
                <label className='block text-[10px] font-bold tracking-widest text-[var(--tf-foreground-dim)] mb-2'>
                  LEGAL DESCRIPTION
                </label>
                <p className='font-mono text-sm leading-relaxed text-[var(--tf-foreground-bright)]'>
                  {activeObject.metadata?.legalDescription || 'NO LEGAL DESCRIPTION ON RECORD'}
                </p>
              </div>

              {/* Cell: PACS Identity */}
              <div className='bg-[var(--tf-surface-dark)] p-6 hover:bg-[var(--tf-surface-highlight)] transition-colors duration-300'>
                <label className='block text-[10px] font-bold tracking-widest text-[var(--tf-foreground-dim)] mb-2'>
                  PACS IDENTITY
                </label>
                <div className='flex items-center gap-3'>
                  <span className='font-mono text-xl text-[var(--tf-transcend-cyan)]'>
                    {activeObject.metadata?.pacsId || 'UNKNOWN'}
                  </span>
                  <div className='h-px flex-1 bg-[var(--tf-glass-border)]' />
                  <span className='text-[10px] text-[var(--tf-foreground-dim)]'>SQL_PK</span>
                </div>
              </div>

              {/* Cell: Neighborhood */}
              <div className='bg-[var(--tf-surface-dark)] p-6 hover:bg-[var(--tf-surface-highlight)] transition-colors duration-300'>
                <label className='block text-[10px] font-bold tracking-widest text-[var(--tf-foreground-dim)] mb-2'>
                  NEIGHBORHOOD
                </label>
                <p className='font-mono text-sm text-[var(--tf-foreground)]'>
                  {activeObject.metadata?.neighborhood || 'UNASSIGNED'}
                </p>
              </div>

              {/* Cell: Jurisdiction */}
              <div className='bg-[var(--tf-surface-dark)] p-6 hover:bg-[var(--tf-surface-highlight)] transition-colors duration-300'>
                <label className='block text-[10px] font-bold tracking-widest text-[var(--tf-foreground-dim)] mb-2'>
                  JURISDICTION
                </label>
                <p className='font-mono text-sm text-[var(--tf-foreground)]'>BENTON COUNTY, WA</p>
              </div>
            </div>

            {/* 4. Action Bar (Context Injection Placeholder) */}
            <div className='mt-8 flex gap-4 opacity-50 hover:opacity-100 transition-opacity'>
              <button className='text-[10px] uppercase tracking-widest text-[var(--tf-transcend-cyan)] hover:underline'>
                View Raw Record
              </button>
              <button className='text-[10px] uppercase tracking-widest text-[var(--tf-transcend-cyan)] hover:underline'>
                Simulate Levy Impact
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
