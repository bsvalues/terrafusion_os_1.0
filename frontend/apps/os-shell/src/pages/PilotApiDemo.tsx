import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    executeTool,
    listTools,
    type ExecuteToolResponse,
    type PilotApiHeaders,
    type PilotApiTool,
} from '../services/pilotClient';

const defaultHeaders: PilotApiHeaders = {
  userId: 'demo-user',
  countyId: 'benton',
  role: 'analyst',
  permissions: 'parcel:read,valuation:commit,parcel:write',
  mode: 'pilot',
  parcelId: '',
};

export function PilotApiDemo(): React.ReactElement {
  const [headers, setHeaders] = useState<PilotApiHeaders>(defaultHeaders);
  const [tools, setTools] = useState<PilotApiTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [params, setParams] = useState<string>('{}');
  const [loadingTools, setLoadingTools] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteToolResponse | null>(null);

  const permissionsValue = useMemo(() => {
    if (!headers.permissions) return '';
    return Array.isArray(headers.permissions) ? headers.permissions.join(',') : headers.permissions;
  }, [headers.permissions]);

  const loadTools = useCallback(async () => {
    setLoadingTools(true);
    setError(null);
    try {
      const response = await listTools(headers);
      setTools(response.tools);
      if (response.tools.length && !selectedTool) {
        setSelectedTool(response.tools[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoadingTools(false);
    }
  }, [headers, selectedTool]);

  const runExecute = useCallback(async () => {
    if (!selectedTool) return;
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const parsedParams = params.trim() ? JSON.parse(params) : {};
      const response = await executeTool(selectedTool, parsedParams, headers);
      setResult(response);
      if (!response.ok) {
        setError(response.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  }, [selectedTool, params, headers]);

  useEffect(() => {
    loadTools();
  }, []);

  return (
    <div className='min-h-screen bg-slate-950 text-white p-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex flex-col gap-2 mb-6'>
          <h1 className='text-2xl font-bold text-cyan-400'>Pilot API Demo</h1>
          <p className='text-slate-400 text-sm'>
            Thin HTTP client → pilot-api (no enforcement in renderer). Returns correlation IDs for
            audit.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-4'>
            <div className='bg-slate-900/60 border border-slate-700 rounded-lg p-4'>
              <h2 className='text-sm font-semibold text-slate-300 mb-3'>Context Headers</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-xs text-slate-400'>
                  x-user-id
                  <input
                    value={headers.userId}
                    onChange={(e) => setHeaders((prev) => ({ ...prev, userId: e.target.value }))}
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400'>
                  x-county-id
                  <input
                    value={headers.countyId}
                    onChange={(e) => setHeaders((prev) => ({ ...prev, countyId: e.target.value }))}
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400'>
                  x-role
                  <input
                    value={headers.role || ''}
                    onChange={(e) => setHeaders((prev) => ({ ...prev, role: e.target.value }))}
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400'>
                  x-mode
                  <select
                    value={headers.mode || 'pilot'}
                    onChange={(e) =>
                      setHeaders((prev) => ({
                        ...prev,
                        mode: e.target.value as 'pilot' | 'muse',
                      }))
                    }
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  >
                    <option value='pilot'>pilot</option>
                    <option value='muse'>muse</option>
                  </select>
                </label>
                <label className='text-xs text-slate-400 md:col-span-2'>
                  x-permissions (comma-separated)
                  <input
                    value={permissionsValue}
                    onChange={(e) =>
                      setHeaders((prev) => ({
                        ...prev,
                        permissions: e.target.value,
                      }))
                    }
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400 md:col-span-2'>
                  x-parcel-id (optional)
                  <input
                    value={headers.parcelId || ''}
                    onChange={(e) => setHeaders((prev) => ({ ...prev, parcelId: e.target.value }))}
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
              </div>
              <div className='mt-4 flex gap-2'>
                <button
                  onClick={loadTools}
                  disabled={loadingTools}
                  className='px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50'
                >
                  {loadingTools ? 'Loading...' : 'Reload Tools'}
                </button>
              </div>
            </div>

            <div className='bg-slate-900/60 border border-slate-700 rounded-lg p-4 space-y-3'>
              <div>
                <label className='block text-xs text-slate-400 mb-1'>Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className='w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-sm'
                >
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.id} ({tool.risk})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-xs text-slate-400 mb-1'>Params (JSON)</label>
                <textarea
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  className='w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-xs font-mono h-28'
                />
              </div>
              <button
                onClick={runExecute}
                disabled={!selectedTool || executing}
                className='px-4 py-2 bg-cyan-500 text-slate-900 font-semibold rounded hover:bg-cyan-400 transition-colors disabled:opacity-50'
              >
                {executing ? 'Executing...' : 'Execute Tool'}
              </button>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='bg-slate-900/60 border border-slate-700 rounded-lg p-4'>
              <h2 className='text-sm font-semibold text-slate-300 mb-2'>Result</h2>
              {error && <div className='text-red-400 text-xs mb-2'>Error: {error}</div>}
              {!result && !error && <div className='text-slate-500 text-xs'>No response yet.</div>}
              {result && (
                <div className='text-xs text-slate-300 space-y-2'>
                  <div>ok: {String(result.ok)}</div>
                  <div>correlationId: {result.correlationId || '—'}</div>
                  {result.error && <div>error: {result.error}</div>}
                  {result.result !== undefined && (
                    <pre className='bg-slate-800/80 border border-slate-700 rounded p-2 overflow-auto max-h-64'>
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
            <div className='text-xs text-slate-500'>
              Base URL: {import.meta.env?.VITE_PILOT_API_URL || 'http://localhost:3333'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PilotApiDemo;
