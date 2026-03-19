/**
 * TerraPilotPanel — Muse Mode read-only explain UI.
 * Renders in the Property Workbench as a tab.
 * NO mutations — explain only.
 */

import { useState, useCallback } from 'react';
import { useAuthContext, toOsActor } from '@/auth/useAuthContext';
import { buildPilotContext } from '@/services/pilotBridge';
import { explain } from '@/services/pilotApi';
import type { ExplainResponse } from '@/services/pilotApi';
import { emitToolInvoked, emitToolSucceeded, emitToolFailed, generateCorrelationId } from '@/services/terraTrace';

interface TerraPilotPanelProps {
  parcelId: string | null;
  parcelData?: Record<string, unknown>;
}

export function TerraPilotPanel({ parcelId, parcelData }: TerraPilotPanelProps) {
  const auth = useAuthContext();
  const actor = toOsActor(auth);
  const pilotContext = buildPilotContext(actor, parcelId, parcelData);

  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<ExplainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = useCallback(async () => {
    if (!pilotContext || !query.trim() || !actor) return;

    setIsLoading(true);
    setError(null);

    const correlationId = generateCorrelationId();
    emitToolInvoked({
      suite: 'pilot',
      correlationId,
      countyId: pilotContext.countyId,
      actor: { userId: pilotContext.actorId },
    });

    try {
      const result = await explain({
        query,
        parcelId: parcelId ?? undefined,
        countyId: pilotContext.countyId,
        actorId: pilotContext.actorId,
        source: 'TerraPilotPanel',
        parcelSummary: pilotContext.parcelSummary,
        statutes: pilotContext.statutes,
      });
      emitToolSucceeded({
        suite: 'pilot',
        correlationId,
        countyId: pilotContext.countyId,
        actor: { userId: pilotContext.actorId },
      });
      setResponse(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Explain failed';
      emitToolFailed({
        suite: 'pilot',
        correlationId,
        countyId: pilotContext.countyId,
        actor: { userId: pilotContext.actorId },
        outputSummary: message,
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [actor, parcelId, pilotContext, query]);

  if (!actor) {
    return <div data-testid="pilot-unauthenticated">Authentication required for TerraPilot.</div>;
  }

  if (!parcelId) {
    return <div data-testid="pilot-no-parcel">Select a parcel to use TerraPilot Muse Mode.</div>;
  }

  return (
    <div data-testid="terra-pilot-panel">
      <h2>TerraPilot — Muse Mode</h2>
      <p>Ask questions about the active parcel. Read-only — no changes are made.</p>
      <div>
        <textarea
          aria-label="Property question"
          data-testid="pilot-query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What would you like to understand about this parcel?"
          rows={3}
        />
        <button
          data-testid="pilot-explain-button"
          onClick={handleExplain}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? 'Explaining...' : 'Explain'}
        </button>
      </div>
      {error && <div role="alert" data-testid="pilot-error">{error}</div>}
      {response && (
        <div data-testid="pilot-response">
          <div data-testid="pilot-explanation">{response.explanation}</div>
          {response.sources.length > 0 && (
            <div data-testid="pilot-sources">
              <h3>Sources</h3>
              <ul>
                {response.sources.map((s) => (
                  <li key={`${s.type}-${s.reference}`}>{s.type}: {s.reference}</li>
                ))}
              </ul>
            </div>
          )}
          <div data-testid="pilot-trace-id">Trace: {response.traceId}</div>
        </div>
      )}
    </div>
  );
}
