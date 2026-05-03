/**
 * GptQuickChat — inline GPT conversation launcher
 *
 * Fetches system GPTs, lets user pick one, then embeds GPTChatInterface.
 * Used by GptSuiteHome as the live Studio panel.
 *
 * Write-lane: gpt suite only. No cross-suite state.
 */

import React, { useEffect, useState } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { gptAPI, type GPTConfiguration } from '@/services/gptAPI';
import { GPTChatInterface } from '@/components/gpt/GPTChatInterface';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export function GptQuickChat() {
  const [gpts, setGpts] = useState<GPTConfiguration[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [selectedGptId, setSelectedGptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');

    gptAPI
      .getSystemGPTs()
      .then((list) => {
        if (cancelled) return;
        if (list.length === 0) {
          setLoadState('empty');
          return;
        }
        setGpts(list);
        setSelectedGptId(list[0].id);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load GPT configurations');
        setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedGpt = gpts.find((g) => g.id === selectedGptId) ?? null;

  if (loadState === 'loading') {
    return (
      <div data-testid="gpt-quick-chat-loading" className="flex items-center justify-center py-16 gap-3">
        <div className="tf-spinner h-8 w-8" />
        <span className="tf-text-tertiary text-sm">Loading available GPTs&hellip;</span>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div data-testid="gpt-quick-chat-error" className="py-8 text-center">
        <p className="tf-text-secondary text-sm">{error}</p>
        <p className="tf-text-dim text-xs mt-1">Ensure the backend is reachable and a system GPT is configured.</p>
      </div>
    );
  }

  if (loadState === 'empty') {
    return (
      <div data-testid="gpt-quick-chat-empty" className="py-8 text-center space-y-2">
        <div
          className="inline-flex items-center justify-center rounded-full p-4"
          style={{ background: 'hsl(var(--tf-suite-gpt) / 0.12)' }}
        >
          <Bot size={32} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
        </div>
        <p className="tf-text-secondary text-sm font-medium">No system GPTs configured</p>
        <p className="tf-text-dim text-xs">Go to GPT Management to create or install a system GPT first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4" data-testid="gpt-quick-chat">
      {/* GPT selector — shown only when multiple system GPTs exist */}
      {gpts.length > 1 && (
        <div className="shrink-0 flex items-center gap-3">
          <label htmlFor="gpt-picker" className="tf-text-secondary text-xs whitespace-nowrap">
            Active GPT
          </label>
          <div className="relative flex-1 max-w-xs">
            <select
              id="gpt-picker"
              value={selectedGptId ?? ''}
              onChange={(e) => setSelectedGptId(Number(e.target.value))}
              className="w-full tf-input px-3 py-1.5 text-sm appearance-none pr-8"
              data-testid="gpt-picker"
            >
              {gpts.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.displayName || g.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'hsl(var(--tf-muted))' }}
            />
          </div>
          {selectedGpt && (
            <span
              className="text-xs rounded-full px-2 py-0.5 font-semibold"
              style={{ background: 'hsl(var(--tf-suite-gpt) / 0.12)', color: 'hsl(var(--tf-suite-gpt))' }}
            >
              {selectedGpt.modelName}
            </span>
          )}
        </div>
      )}

      {/* Embed the canonical GPT chat — fills remaining height */}
      {selectedGpt && (
        <div className="flex-1 min-h-0 overflow-hidden rounded-xl" data-testid="gpt-chat-embed">
          <GPTChatInterface
            gpt={selectedGpt}
            key={selectedGpt.id}
          />
        </div>
      )}
    </div>
  );
}
