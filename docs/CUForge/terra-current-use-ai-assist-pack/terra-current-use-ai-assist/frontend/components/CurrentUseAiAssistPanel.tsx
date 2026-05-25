import React, { useState } from 'react';
import type { CurrentUseParcelOverview } from '../types/currentUseTypes';
import type { RollbackCalculationResult } from '../domain/rollback/rollbackTypes';
import { requestCurrentUseAiAssistMock } from '../ai/currentUseAiClient';
import type { CurrentUseAiAction, CurrentUseAiResponse } from '../ai/currentUseAiTypes';
import { Panel } from './shared';

const ACTIONS: CurrentUseAiAction[] = [
  'EXPLAIN_CALCULATION',
  'IDENTIFY_MISSING_EVIDENCE',
  'SUMMARIZE_TIMELINE',
  'DRAFT_NOTICE_LANGUAGE',
  'FLAG_POSSIBLE_INCONSISTENCY',
];

export function CurrentUseAiAssistPanel({
  overview,
  rollbackResult,
}: {
  overview: CurrentUseParcelOverview;
  rollbackResult: RollbackCalculationResult | null;
}) {
  const [action, setAction] = useState<CurrentUseAiAction>('EXPLAIN_CALCULATION');
  const [response, setResponse] = useState<CurrentUseAiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAssist() {
    setLoading(true);
    try {
      const result = await requestCurrentUseAiAssistMock({
        action,
        parcelId: overview.parcelId,
        countyId: overview.countyId,
        requestedBy: 'demo.assessor@county.gov',
        promptContext: {
          overview,
          rollbackResult,
        },
      });
      setResponse(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="TerraPilot Current Use Assist">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Explain-only AI support for assessor review. This tool cannot approve, deny, waive penalty,
          finalize removal, or issue notices.
        </p>

        <div className="flex flex-col gap-3 md:flex-row">
          <select
            className="rounded-xl border p-2 text-sm"
            value={action}
            onChange={(event) => setAction(event.target.value as CurrentUseAiAction)}
          >
            {ACTIONS.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
            onClick={runAssist}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Run Assist'}
          </button>
        </div>

        {response && (
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              {response.action.replaceAll('_', ' ')} · Confidence {response.confidence}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-800">{response.text}</pre>
            <p className="mt-3 text-sm font-medium text-slate-900">{response.disclaimer}</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
