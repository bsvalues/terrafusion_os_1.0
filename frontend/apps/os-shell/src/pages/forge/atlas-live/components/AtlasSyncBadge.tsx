import React from 'react';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import type { AtlasSyncState } from '../types/atlasLive.types';

const SYNC_CONFIG: Record<AtlasSyncState, { color: string; label: string; title: string }> = {
  LIVE: {
    color: '#22c55e',
    label: 'LIVE',
    title: 'All channels active — co-present with County Studio',
  },
  STAGED: {
    color: '#f59e0b',
    label: 'STAGED',
    title: 'Commit channel paused — edits staged for review',
  },
  SNAPSHOT: {
    color: '#3b82f6',
    label: 'SNAPSHOT',
    title: 'Showing pinned projection — not tracking live changes',
  },
  DISCONNECTED: {
    color: '#6b7280',
    label: 'DISCONNECTED',
    title: 'County Studio not connected — open a study to link',
  },
};

export function AtlasSyncBadge() {
  const { syncState } = useAtlasLiveStore();
  const cfg = SYNC_CONFIG[syncState];

  return (
    <div
      data-testid="atlas-sync-badge"
      title={cfg.title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 12,
        background: cfg.color + '22',
        border: `1px solid ${cfg.color}55`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: cfg.color,
          boxShadow: syncState === 'LIVE' ? `0 0 6px ${cfg.color}` : 'none',
          animation: syncState === 'LIVE' ? 'pulse 2s infinite' : 'none',
        }}
      />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}
