/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — TRACE PROJECTION SERVICE
 * Phase I: Queries TerraTrace events for parcel activity feed
 *
 * Provides useParcelActivityFeed(parcelId) hook.
 * Currently uses mock data — wire to real backend later.
 *
 * @see 03_TERRATRACE_SPEC_v3.1.md — Append-only event model
 * @see contracts/trace.ts — TraceEvent type
 * ═══════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useState } from 'react';
import type { TraceEvent, TraceEventType, TraceSuite } from '../contracts/trace';

// ============================================================================
// Types
// ============================================================================

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  actorName: string;
  actionDescription: string;
  suite: TraceSuite | 'os';
  eventType: TraceEventType;
  isRestricted: boolean;
}

// ============================================================================
// Mock Data (Replace with real API)
// ============================================================================

function generateMockActivity(parcelId: string): ActivityFeedItem[] {
  const now = Date.now();
  return [
    {
      id: `trace-${parcelId}-1`,
      timestamp: new Date(now - 3600000).toISOString(),
      actorName: 'System',
      actionDescription: 'Property record accessed',
      suite: 'os',
      eventType: 'tool_invoked',
      isRestricted: false,
    },
    {
      id: `trace-${parcelId}-2`,
      timestamp: new Date(now - 7200000).toISOString(),
      actorName: 'Appraiser Smith',
      actionDescription: 'Valuation model executed',
      suite: 'forge',
      eventType: 'tool_succeeded',
      isRestricted: false,
    },
    {
      id: `trace-${parcelId}-3`,
      timestamp: new Date(now - 86400000).toISOString(),
      actorName: 'GIS Analyst',
      actionDescription: 'Boundary verification completed',
      suite: 'atlas',
      eventType: 'tool_succeeded',
      isRestricted: false,
    },
    {
      id: `trace-${parcelId}-4`,
      timestamp: new Date(now - 172800000).toISOString(),
      actorName: 'Admin',
      actionDescription: 'Certification status checked',
      suite: 'dais',
      eventType: 'tool_invoked',
      isRestricted: false,
    },
  ];
}

// ============================================================================
// Hook
// ============================================================================

export function useParcelActivityFeed(parcelId: string | null) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parcelId) {
      setItems([]);
      return;
    }

    setLoading(true);
    // Simulate async fetch
    const timer = setTimeout(() => {
      setItems(generateMockActivity(parcelId));
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [parcelId]);

  const refresh = useCallback(() => {
    if (parcelId) {
      setItems(generateMockActivity(parcelId));
    }
  }, [parcelId]);

  return { items, loading, refresh };
}
