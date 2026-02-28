import { getViteEnv } from '@/env/getViteEnv';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { clearDevSession, getSession, setDevSession, type Session } from '../auth/session';
import {
    checkHealth,
    executeTool,
    listTools,
    type ExecuteToolResponse,
    type PilotApiTool,
    type PilotMode,
} from '../services/pilotClient';

type ContextOverrides = {
  userId: string;
  countyId: string;
  role: string;
  permissions: string;
  mode: '' | PilotMode;
  parcelId: string;
};

const defaultOverrides: ContextOverrides = {
  userId: '',
  countyId: '',
  role: '',
  permissions: '',
  mode: '',
  parcelId: '',
};

export function PilotApiDemo(): React.ReactElement {
  const [overrides, setOverrides] = useState<ContextOverrides>(defaultOverrides);
  const [session, setSession] = useState<Session | null>(null);
  const [tools, setTools] = useState<PilotApiTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [params, setParams] = useState<string>('{}');
  const [loadingTools, setLoadingTools] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteToolResponse | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    const env = getViteEnv();
    return env.VITE_PILOT_API_URL || env.PILOT_API_URL || '';
  }, []);

  const permissionsValue = overrides.permissions;

  const effectiveContext = useMemo(() => {
    const base: Session = session
      ? { ...session }
      : {
          userId: '',
          countyId: '',
          role: undefined,
          permissions: undefined,
          mode: 'pilot',
          parcelId: undefined,
        };

    if (overrides.userId.trim()) base.userId = overrides.userId.trim();
    if (overrides.countyId.trim()) base.countyId = overrides.countyId.trim();
    if (overrides.role.trim()) base.role = overrides.role.trim();
    if (overrides.permissions.trim()) {
      base.permissions = overrides.permissions
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (overrides.mode) base.mode = overrides.mode;
    if (overrides.parcelId.trim()) base.parcelId = overrides.parcelId.trim();

    return base;
  }, [session, overrides]);

  const hasRequiredContext = Boolean(effectiveContext.userId && effectiveContext.countyId);

  const loadTools = useCallback(async () => {
    setLoadingTools(true);
    setError(null);
    try {
      const response = await listTools({ headers: effectiveContext });
      setTools(response.tools);
      if (response.tools.length && !selectedTool) {
        setSelectedTool(response.tools[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoadingTools(false);
    }
  }, [effectiveContext, selectedTool]);

  const runExecute = useCallback(async () => {
    if (!selectedTool || !hasRequiredContext) return;
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const parsedParams = params.trim() ? JSON.parse(params) : {};
      const response = await executeTool(selectedTool, parsedParams, effectiveContext);
      setResult(response);
      if (!response.ok) {
        setError(response.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  }, [selectedTool, params, effectiveContext, hasRequiredContext]);

  const runHealthCheck = useCallback(async () => {
    const response = await checkHealth(baseUrl);
    setLastChecked(new Date().toLocaleString());
    if (response.ok) {
      setHealthOk(true);
      setLastError(null);
    } else {
      setHealthOk(false);
      setLastError(response.error);
    }
  }, [baseUrl]);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    if (!hasRequiredContext) return;
    loadTools();
  }, [loadTools, hasRequiredContext]);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <div className='min-h-screen bg-slate-950 text-white p-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex flex-col gap-3 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3'>
            <div>
              <h1 className='text-2xl font-bold text-cyan-400'>Pilot API Demo</h1>
              <p className='text-slate-400 text-sm'>
                Thin HTTP client → pilot-api (no enforcement in renderer). Returns correlation IDs
                for audit.
              </p>
            </div>
            <button
              onClick={runHealthCheck}
              className='px-3 py-2 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 hover:border-cyan-500/50 transition-colors'
            >
              Check now
            </button>
          </div>
          <div className='text-xs text-slate-400'>
            {healthOk === null && <span>Checking health…</span>}
            {healthOk === true && (
              <span className='text-green-400'>
                Healthy ✅ {lastChecked ? `• Last checked ${lastChecked}` : ''}
              </span>
            )}
            {healthOk === false && (
              <span className='text-red-400'>
                Unreachable ❌ {lastChecked ? `• Last checked ${lastChecked}` : ''} • {baseUrl}
                {lastError ? ` • ${lastError}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-4'>
            {!hasRequiredContext && (
              <div className='bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg p-3'>
                Set dev session (userId + countyId) to use Pilot API.
              </div>
            )}
            <div className='bg-slate-900/60 border border-slate-700 rounded-lg p-4'>
              <h2 className='text-sm font-semibold text-slate-300 mb-3'>Context Headers</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-xs text-slate-400'>
                  x-user-id
                  <input
                    value={overrides.userId}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, userId: e.target.value }))}
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400'>
                  x-county-id
                  <input
                    value={overrides.countyId}
                    onChange={(e) =>
                      setOverrides((prev) => ({ ...prev, countyId: e.target.value }))
                    }
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400'>
                  x-role
                  <input
                    value={overrides.role}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, role: e.target.value }))}
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
                <label className='text-xs text-slate-400'>
                  x-mode
                  <select
                    value={overrides.mode}
                    onChange={(e) =>
                      setOverrides((prev) => ({
                        ...prev,
                        mode: e.target.value as '' | PilotMode,
                      }))
                    }
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  >
                    <option value=''>auto</option>
                    <option value='pilot'>pilot</option>
                    <option value='muse'>muse</option>
                  </select>
                </label>
                <label className='text-xs text-slate-400 md:col-span-2'>
                  x-permissions (comma-separated)
                  <input
                    value={permissionsValue}
                    onChange={(e) =>
                      setOverrides((prev) => ({
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
                    value={overrides.parcelId}
                    onChange={(e) =>
                      setOverrides((prev) => ({ ...prev, parcelId: e.target.value }))
                    }
                    className='mt-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm'
                  />
                </label>
              </div>
              <div className='mt-4 flex flex-wrap gap-2'>
                <button
                  onClick={loadTools}
                  disabled={loadingTools || !hasRequiredContext}
                  className='px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50'
                >
                  {loadingTools ? 'Loading...' : 'Reload Tools'}
                </button>
                <button
                  onClick={() => {
                    if (!effectiveContext.userId || !effectiveContext.countyId) return;
                    setDevSession(effectiveContext);
                    setSession(effectiveContext);
                  }}
                  disabled={!hasRequiredContext}
                  className='px-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-cyan-500/50 transition-colors disabled:opacity-50'
                >
                  Save as dev session
                </button>
                <button
                  onClick={() => {
                    clearDevSession();
                    setSession(null);
                  }}
                  className='px-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-red-500/50 transition-colors'
                >
                  Clear dev session
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
                disabled={!selectedTool || executing || !hasRequiredContext}
                className='px-4 py-2 bg-cyan-500 text-slate-900 font-semibold rounded hover:bg-cyan-400 transition-colors disabled:opacity-50'
              >
                {executing ? 'Executing...' : 'Execute Tool'}
              </button>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='bg-slate-900/60 border border-slate-700 rounded-lg p-4'>
              <h2 className='text-sm font-semibold text-slate-300 mb-2'>Active Identity</h2>
              {!session && <div className='text-xs text-slate-500'>No dev session loaded.</div>}
              {session && (
                <div className='text-xs text-slate-300 space-y-1'>
                  <div className='font-mono'>
                    {session.userId}@{session.countyId}
                  </div>
                  <div>role: {session.role || '—'}</div>
                  <div>mode: {session.mode || 'pilot'}</div>
                  <div>permissions: {session.permissions?.length ?? 0}</div>
                </div>
              )}
            </div>
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
            <div className='text-xs text-slate-500'>Base URL: {baseUrl}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PilotApiDemo;
