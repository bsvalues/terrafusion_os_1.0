import { create } from 'zustand';
import type { AgentEvent, AgentExecutionMode, AgentSystemStatusResponse } from './agentTypes';

type AgentFeedState = {
  status: AgentSystemStatusResponse | null;
  statusWarnings: string[];
  events: AgentEvent[];
  eventsWarnings: string[];
  /** Numeric cursor for cursor-driven polling (nextAfter from last response) */
  cursor: number;
  /** True if a gap was detected (droppedBeforeSeq > previous cursor) */
  gapDetected: boolean;
  paused: boolean;
  autoScroll: boolean;
  setStatus: (status: AgentSystemStatusResponse | null, warnings: string[]) => void;
  appendEvents: (
    events: AgentEvent[],
    nextAfter: number,
    droppedBeforeSeq: number,
    warnings: string[]
  ) => void;
  setPaused: (paused: boolean) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  clearEvents: () => void;
  clearGap: () => void;
};

const MAX_EVENTS = 500;

export const useAgentStore = create<AgentFeedState>((set, get) => ({
  status: null,
  statusWarnings: [],
  events: [],
  eventsWarnings: [],
  cursor: 0,
  gapDetected: false,
  paused: false,
  autoScroll: true,
  setStatus: (status, warnings) => set({ status, statusWarnings: warnings }),
  appendEvents: (incoming, nextAfter, droppedBeforeSeq, warnings) =>
    set((state) => {
      const existing = new Map(state.events.map((event) => [event.id, event]));
      for (const event of incoming) existing.set(event.id, event);

      const merged = Array.from(existing.values()).sort((a, b) => {
        // Sort by seq (monotonic), fallback to tsUtc
        if (a.seq !== b.seq) return a.seq - b.seq;
        const at = Date.parse(a.tsUtc);
        const bt = Date.parse(b.tsUtc);
        if (Number.isNaN(at) || Number.isNaN(bt)) return a.id.localeCompare(b.id);
        if (at === bt) return a.id.localeCompare(b.id);
        return at - bt;
      });

      const trimmed = merged.slice(-MAX_EVENTS);

      // Gap detection: if droppedBeforeSeq > previous cursor, we missed events
      // Only signal once (don't spam if already gapDetected)
      const hadGap = state.cursor > 0 && droppedBeforeSeq > 0 && state.cursor < droppedBeforeSeq;
      const newGapDetected = hadGap && !state.gapDetected;

      return {
        events: trimmed,
        eventsWarnings: warnings,
        cursor: nextAfter,
        gapDetected: state.gapDetected || newGapDetected,
      };
    }),
  setPaused: (paused) => set({ paused }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  clearEvents: () => set({ events: [], cursor: 0, gapDetected: false }),
  clearGap: () => set({ gapDetected: false }),
}));

export type { AgentExecutionMode };

