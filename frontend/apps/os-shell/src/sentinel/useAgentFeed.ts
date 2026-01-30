import { useEffect, useRef } from 'react';
import { buildApiUrl } from '../lib/apiBase';
import { probeAgentEvents, probeAgentStatus } from './agentProbe';
import { useAgentStore } from './agentStore';

// Always use relative paths via centralized apiBase (governance requirement)
const statusEndpoint = buildApiUrl('/agents/status');
const eventsEndpoint = buildApiUrl('/agents/events');

let statusPollStarted = false;
let eventsPollStarted = false;

export function useAgentFeed(statusPollMs = 10000, eventsPollMs = 3000) {
  const {
    status,
    statusWarnings,
    events,
    eventsWarnings,
    cursor,
    gapDetected,
    paused,
    autoScroll,
    setStatus,
    appendEvents,
    setPaused,
    setAutoScroll,
    clearEvents,
    clearGap,
  } = useAgentStore();

  const statusInFlight = useRef(false);
  const eventsInFlight = useRef(false);

  useEffect(() => {
    if (statusPollStarted) return;
    statusPollStarted = true;

    const runStatus = async () => {
      if (statusInFlight.current) return;
      statusInFlight.current = true;

      const result = await probeAgentStatus(statusEndpoint, 1500);
      setStatus(result.status, result.warnings);

      statusInFlight.current = false;
    };

    runStatus();
    const id = window.setInterval(runStatus, statusPollMs);

    return () => {
      window.clearInterval(id);
      statusPollStarted = false;
    };
  }, [setStatus, statusPollMs]);

  useEffect(() => {
    if (eventsPollStarted) return;
    eventsPollStarted = true;

    const runEvents = async () => {
      if (eventsInFlight.current || paused) return;
      eventsInFlight.current = true;

      // Pass numeric cursor as string for API compatibility
      const cursorStr = cursor > 0 ? String(cursor) : null;
      const result = await probeAgentEvents(eventsEndpoint, cursorStr, 100, 1500);

      if (result.ok && result.response) {
        appendEvents(
          result.response.events,
          result.response.nextAfter,
          result.response.droppedBeforeSeq,
          result.warnings
        );
      } else {
        appendEvents([], cursor, 0, result.warnings);
      }

      eventsInFlight.current = false;
    };

    runEvents();
    const id = window.setInterval(runEvents, eventsPollMs);

    return () => {
      window.clearInterval(id);
      eventsPollStarted = false;
    };
  }, [appendEvents, cursor, eventsPollMs, paused]);

  return {
    status,
    statusWarnings,
    events,
    eventsWarnings,
    cursor,
    gapDetected,
    paused,
    autoScroll,
    setPaused,
    setAutoScroll,
    clearEvents,
    clearGap,
  };
}
