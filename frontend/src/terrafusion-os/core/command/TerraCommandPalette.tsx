import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sendTerraCommand } from '../api/aiClient';
import { useOmniIntent } from '../state/OmniIntentContext';
import { useOSMode } from '../state/OSModeContext';
import { useWorkspace, WorkspaceId } from '../state/WorkspaceContext';

interface TerraCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TerraCommandPalette handles all user intent entry.
 * Step 4 wiring: integrates sendTerraCommand + context syncing.
 */
export const TerraCommandPalette: React.FC<TerraCommandPaletteProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [recentExamples] = useState<string[]>([
    'Open Property Workbench',
    'Show parcels near Yakima River with levy risk',
    'Open Quantum Lab',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { mode, setMode } = useOSMode();
  const { setActiveWorkspaceId } = useWorkspace();
  const { setIntent } = useOmniIntent();

  // Focus behavior
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }

    if (!isOpen) {
      setInput('');
      setError(null);
      abortRef.current?.abort();
    }
  }, [isOpen]);

  // Cleanup abort controller when component unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const hydrateContexts = (response: Awaited<ReturnType<typeof sendTerraCommand>>) => {
    const intentType = response.intentType || 'terra_command_generic';
    setIntent(intentType, {
      rawInput: input.trim(),
      response,
    });

    if (response.workspaceId) {
      const targetId = response.workspaceId as WorkspaceId;
      setActiveWorkspaceId(targetId);

      if (targetId === 'quantumLab') {
        setMode('L9');
      } else if (mode === 'L3') {
        setMode('L6');
      }
    } else if (mode === 'L3') {
      // Default escalate to L6 when TerraCommand executes
      setMode('L6');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendTerraCommand(input.trim(), controller.signal);

      console.log('[TerraCommandPalette] Response:', response);

      hydrateContexts(response);
      onClose();
    } catch (err: any) {
      console.error('[TerraCommandPalette] Error:', err);
      if (err?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const closePalette = () => {
    abortRef.current?.abort();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-start justify-center pt-24'
      onClick={closePalette}
      onKeyDown={handleKeyDown}
    >
      <div
        className='w-full max-w-2xl mx-4 rounded-3xl bg-slate-950/90 border border-cyan-500/20 shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='px-4 pt-3 pb-2 flex items-center justify-between border-b border-cyan-500/15'>
          <div className='flex flex-col'>
            <span className='text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-1'>
              TerraCommand
            </span>
            <span className='text-xs text-slate-400'>
              Ask a question or type an action. Press <span className='text-cyan-400'>Enter</span>{' '}
              to run.
            </span>
          </div>
          <div className='text-[10px] text-slate-500'>Esc to close</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='px-4 py-3 flex flex-col gap-2'>
            <div className='flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-[11px] text-slate-900 font-semibold'>
                ⌘
              </div>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className='flex-1 bg-transparent border-none outline-none text-sm text-slate-100 placeholder:text-slate-500'
                placeholder={
                  '"Open Property Workbench" or "Show parcels in Prosser with COD > 15%"'
                }
              />
              <button
                type='submit'
                className='px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.2em] bg-cyan-400 text-slate-900 hover:bg-cyan-300 transition disabled:opacity-40'
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? 'Running' : 'Run'}
              </button>
            </div>
            {error && <p className='text-xs text-rose-400'>{error}</p>}
          </div>
        </form>

        <div className='px-4 pb-4 pt-1'>
          <div className='text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2'>Examples</div>
          <div className='flex flex-wrap gap-2'>
            {recentExamples.map((ex) => (
              <button
                key={ex}
                type='button'
                className='px-3 py-1 rounded-full text-[11px] bg-slate-900/70 border border-cyan-500/30 text-slate-200 hover:bg-slate-800/80 transition'
                onClick={() => setInput(ex)}
                disabled={isLoading}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
