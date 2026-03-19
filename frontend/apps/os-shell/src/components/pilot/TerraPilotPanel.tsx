/**
 * TerraPilotPanel — Muse Mode read-only explain UI.
 * Renders in the Property Workbench as a tab.
 * NO mutations — explain only.
 */

import { useState, useCallback } from 'react';
import { useAuthContext, toOsActor } from '@/auth/useAuthContext';
import { buildPilotContext, buildExplainRequest } from '@/services/pilotBridge';
import type { PilotExplainResponse } from '@/services/pilotBridge';
import { emitIntent, emitResult } from '@/services/terraTrace';

interface TerraPilotPanelProps {
  parcelId: string | null;
  parcelData?: Record<string, unknown>;
}

export function TerraPilotPanel({ parcelId, parcelData }: TerraPilotPanelProps) {
  const auth = useAuthContext();
  const actor = toOsActor(auth);
  const pilotContext = buildPilotContext(actor, parcelId, parcelData);

  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<PilotExplainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = useCallback(async () => {
    if (!pilotContext || !query.trim()) return;

    const intentId = `pilot-${Date.now()}`;
    const traceId = `trace-${Date.now()}`;
    const startTime = Date.now();

    emitIntent({
      intentId,
      source: 'AI_PILOT',
      intent: 'EXPLAIN',
      countyId: pilotContext.countyId,
      actorId: pilotContext.actorId,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);
    setError(null);

    try {
      const req = buildExplainRequest(query, pilotContext);
      // In production, this calls the explain API endpoint.
      // For Phase 9, we emit the trace pair and show the context was assembled correctly.
      void req; // context assembled; backend wiring in Phase 9 backend integration
      const mockResponse: PilotExplainResponse = {
        explanation: `Muse Mode: Context assembled for parcel ${parcelId ?? 'none'} in county ${pilotContext.countyId}. Query: "${query}". Full explain pipeline connects in Phase 9 backend integration.`,
        sources: [{ type: 'parcel_data', reference: parcelId ?? 'no-parcel' }],
        confidence: 0.0, // Placeholder until backend wired
        traceId,
      };
      setResponse(mockResponse);

      emitResult({
        intentId,
        outcome: 'EXECUTED',
        traceId,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Explain failed';
      setError(message);

      emitResult({
        intentId,
        outcome: 'BLOCKED',
        reason: message,
        traceId,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [pilotContext, query, parcelId]);

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
      {error && <div data-testid="pilot-error">{error}</div>}
      {response && (
        <div data-testid="pilot-response">
          <div data-testid="pilot-explanation">{response.explanation}</div>
          {response.sources.length > 0 && (
            <div data-testid="pilot-sources">
              <h3>Sources</h3>
              <ul>
                {response.sources.map((s, i) => (
                  <li key={i}>{s.type}: {s.reference}</li>
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
