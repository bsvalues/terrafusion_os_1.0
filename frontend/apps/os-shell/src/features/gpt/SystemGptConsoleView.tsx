/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEMGPT CONSOLE VIEW
 * Phase 15: AI Control Center for County Tech Leads
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { explainContext } from '../../api/explainApi';
import {
  getSystemDiagnostics,
  SystemDiagnosticsResponse,
  SystemHealthStatus,
  triggerRagIndex,
} from '../../api/systemDiagnosticsApi';
import { ExplainPanel, ExplainPanelState } from '../../components/common/ExplainPanel';

type LoadState = 'idle' | 'loading' | 'error';

/**
 * SystemGPT Console - AI Control Center
 * Provides county tech leads with visibility into the TerraFusion AI subsystem.
 */
export const SystemGptConsoleView: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticsResponse | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [explainState, setExplainState] = useState<ExplainPanelState>({ status: 'idle' });

  // Load diagnostics on mount and periodically
  useEffect(() => {
    const loadDiagnostics = async () => {
      setLoadState('loading');
      setLoadError(null);
      try {
        const data = await getSystemDiagnostics();
        setDiagnostics(data);
        setLoadState('idle');
      } catch (err) {
        setLoadState('error');
        setLoadError(err instanceof Error ? err.message : 'Failed to load diagnostics');
      }
    };

    loadDiagnostics();

    // Refresh every 30 seconds
    const interval = setInterval(loadDiagnostics, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handle RAG index button click
   */
  const handleIndexRag = async (datasetKey: string) => {
    setIndexing(true);
    try {
      await triggerRagIndex(datasetKey);
      // Reload diagnostics after indexing
      const data = await getSystemDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      console.error('Index failed:', err);
    } finally {
      setIndexing(false);
    }
  };

  /**
   * Handle "Explain this" action
   */
  const handleExplainThis = async () => {
    setExplainState({ status: 'loading' });
    try {
      const response = await explainContext({
        contextType: 'View',
        contextId: 'SystemGPTConsole',
        metadata: { overallHealth: diagnostics?.overallHealth },
      });
      setExplainState({
        status: 'ready',
        text: response.explanation,
        summary: response.summary,
        keyPoints: response.keyPoints,
      });
    } catch (err) {
      setExplainState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch explanation',
      });
    }
  };

  const handleCloseExplain = () => {
    setExplainState({ status: 'idle' });
  };

  /**
   * Download AI Health Snapshot - Phase 16
   */
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSnapshot = async () => {
    setDownloading(true);
    try {
      await downloadHealthSnapshot();
    } catch (err) {
      console.error('Download failed:', err);
      // Could add toast notification here
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Get health status color classes
   */
  const getHealthColor = (status: SystemHealthStatus) => {
    switch (status) {
      case 'Healthy':
        return 'text-emerald-400 border-emerald-400/60 bg-emerald-500/10';
      case 'Degraded':
        return 'text-amber-400 border-amber-400/60 bg-amber-500/10';
      case 'Unhealthy':
        return 'text-rose-400 border-rose-400/60 bg-rose-500/10';
      default:
        return 'text-slate-400 border-slate-400/60 bg-slate-500/10';
    }
  };

  /**
   * Get health status icon
   */
  const getHealthIcon = (status: SystemHealthStatus) => {
    switch (status) {
      case 'Healthy':
        return '✅';
      case 'Degraded':
        return '⚠️';
      case 'Unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div
      data-testid='system-gpt-console'
      className='flex h-full w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/90 p-4 text-sm text-slate-50'
    >
      {/* Header */}
      <div className='mb-4 flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.60)] backdrop-blur-xl'>
        <div className='flex items-center gap-3'>
          {/* Control Center icon */}
          <div className='relative h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 shadow-[0_0_25px_rgba(167,139,250,0.8)]'>
            <div className='absolute inset-[2px] rounded-full bg-slate-950/80 backdrop-blur' />
            <div className='absolute inset-[4px] flex items-center justify-center text-lg'>🎛️</div>
          </div>
          <div>
            <div className='text-sm font-semibold uppercase tracking-[0.15em] text-slate-200'>
              SystemGPT Console
            </div>
            <div className='text-[0.7rem] text-slate-400'>AI Control Center for TerraFusion OS</div>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* Overall Health Badge */}
          {diagnostics && (
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getHealthColor(diagnostics.overallHealth)}`}
            >
              <span>{getHealthIcon(diagnostics.overallHealth)}</span>
              <span>{diagnostics.overallHealth}</span>
            </div>
          )}

          {/* Download Snapshot button - Phase 16 */}
          <button
            onClick={() => void handleDownloadSnapshot()}
            disabled={downloading || !diagnostics}
            className='rounded-full border border-sky-500/50 bg-sky-500/10 px-3 py-1 text-xs text-sky-300 transition-all hover:bg-sky-500/20 hover:shadow-[0_0_12px_rgba(14,165,233,0.4)] disabled:cursor-not-allowed disabled:opacity-50'
            title='Download AI Health Snapshot (JSON)'
          >
            {downloading ? '⏳ Downloading…' : '📥 Download Snapshot'}
          </button>

          {/* Explain This button */}
          <button
            onClick={() => void handleExplainThis()}
            className='rounded-full border border-fuchsia-500/50 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-300 transition-all hover:bg-fuchsia-500/20 hover:shadow-[0_0_12px_rgba(217,70,239,0.4)]'
            title='Explain this view'
          >
            ❓ Explain
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loadState === 'loading' && !diagnostics && (
        <div className='flex flex-1 items-center justify-center'>
          <div className='flex items-center gap-3 text-slate-400'>
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent' />
            <span>Loading diagnostics…</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadState === 'error' && (
        <div className='flex flex-1 items-center justify-center'>
          <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-4 text-rose-200'>
            <div className='flex items-center gap-2 font-medium'>
              <span>⚠️</span>
              <span>Failed to load diagnostics</span>
            </div>
            <p className='mt-1 text-sm text-rose-300/80'>{loadError}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {diagnostics && (
        <div className='grid flex-1 gap-4 overflow-auto md:grid-cols-2 lg:grid-cols-3'>
          {/* Embedding Mode Card */}
          <div className='rounded-xl border border-slate-800/60 bg-slate-900/50 p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>🧬</span>
                <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-300'>
                  Embedding Service
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] font-medium ${diagnostics.embeddingStatus.available ? 'border border-emerald-400/50 bg-emerald-500/10 text-emerald-300' : 'border border-rose-400/50 bg-rose-500/10 text-rose-300'}`}
              >
                {diagnostics.embeddingStatus.available ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className='space-y-2'>
              <div className='flex justify-between text-xs'>
                <span className='text-slate-400'>Mode</span>
                <span className='font-mono text-cyan-300'>{diagnostics.embeddingStatus.mode}</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-slate-400'>Provider</span>
                <span className='text-slate-200'>{diagnostics.embeddingStatus.provider}</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-slate-400'>Dimensions</span>
                <span className='font-mono text-slate-200'>
                  {diagnostics.embeddingStatus.dimensions}
                </span>
              </div>
            </div>
          </div>

          {/* RAG Datasets Card */}
          {diagnostics.ragDatasets.map((dataset) => (
            <div
              key={dataset.key}
              className='rounded-xl border border-slate-800/60 bg-slate-900/50 p-4'
            >
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>📚</span>
                  <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-300'>
                    RAG Dataset
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.6rem] font-medium ${dataset.indexed ? 'border border-emerald-400/50 bg-emerald-500/10 text-emerald-300' : 'border border-amber-400/50 bg-amber-500/10 text-amber-300'}`}
                >
                  {dataset.status}
                </span>
              </div>
              <div className='space-y-2'>
                <div className='text-xs font-medium text-slate-200'>{dataset.name}</div>
                <div className='flex justify-between text-xs'>
                  <span className='text-slate-400'>Documents</span>
                  <span className='font-mono text-slate-200'>{dataset.documentCount}</span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-slate-400'>Embeddings</span>
                  <span className='font-mono text-slate-200'>{dataset.embeddingCount}</span>
                </div>
                {!dataset.indexed && (
                  <button
                    onClick={() => void handleIndexRag(dataset.key)}
                    disabled={indexing}
                    className='mt-2 w-full rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 transition-all hover:bg-cyan-500/20 disabled:opacity-50'
                  >
                    {indexing ? 'Indexing…' : 'Index Now'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* ExplainGPT Status Card */}
          <div className='rounded-xl border border-slate-800/60 bg-slate-900/50 p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>💡</span>
                <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-300'>
                  ExplainGPT
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] font-medium ${diagnostics.explainGptStatus.healthy ? 'border border-emerald-400/50 bg-emerald-500/10 text-emerald-300' : 'border border-rose-400/50 bg-rose-500/10 text-rose-300'}`}
              >
                {diagnostics.explainGptStatus.healthy ? 'Healthy' : 'Unhealthy'}
              </span>
            </div>
            <div className='space-y-2'>
              <div className='text-xs text-slate-300'>{diagnostics.explainGptStatus.message}</div>
              {diagnostics.explainGptStatus.responseTimeMs && (
                <div className='flex justify-between text-xs'>
                  <span className='text-slate-400'>Response Time</span>
                  <span className='font-mono text-slate-200'>
                    {diagnostics.explainGptStatus.responseTimeMs}ms
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* GPT Configurations Card */}
          <div className='rounded-xl border border-slate-800/60 bg-slate-900/50 p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <span className='text-lg'>🤖</span>
              <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-300'>
                GPT Configurations
              </span>
            </div>
            <div className='space-y-2'>
              {diagnostics.gptConfigs.map((gpt) => (
                <div
                  key={gpt.key}
                  className='flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/30 px-3 py-2'
                >
                  <div>
                    <div className='text-xs font-medium text-slate-200'>{gpt.name}</div>
                    <div className='text-[0.6rem] text-slate-400 font-mono'>{gpt.model}</div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {gpt.ragEnabled && (
                      <span className='rounded-full border border-cyan-400/40 bg-cyan-500/10 px-1.5 py-0.5 text-[0.55rem] text-cyan-300'>
                        RAG
                      </span>
                    )}
                    <span
                      className={`h-2 w-2 rounded-full ${gpt.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`}
                      title={gpt.enabled ? 'Enabled' : 'Disabled'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Statistics Card */}
          <div className='rounded-xl border border-slate-800/60 bg-slate-900/50 p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <span className='text-lg'>📊</span>
              <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-300'>
                Usage Statistics
              </span>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                <div className='text-lg font-bold text-cyan-300'>
                  {diagnostics.statistics.totalConversations}
                </div>
                <div className='text-[0.6rem] text-slate-400'>Conversations</div>
              </div>
              <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                <div className='text-lg font-bold text-cyan-300'>
                  {diagnostics.statistics.totalMessages}
                </div>
                <div className='text-[0.6rem] text-slate-400'>Messages</div>
              </div>
              <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                <div className='text-lg font-bold text-emerald-300'>
                  {diagnostics.statistics.auditRecordCount}
                </div>
                <div className='text-[0.6rem] text-slate-400'>Audit Records</div>
              </div>
              <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                <div className='text-lg font-bold text-emerald-300'>
                  {diagnostics.statistics.ragTraceCount}
                </div>
                <div className='text-[0.6rem] text-slate-400'>RAG Traces</div>
              </div>
            </div>
          </div>

          {/* Herald Log Card */}
          <div className='rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 md:col-span-2 lg:col-span-1'>
            <div className='mb-3 flex items-center gap-2'>
              <span className='text-lg'>📢</span>
              <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-300'>
                Herald Log
              </span>
            </div>
            <div className='space-y-2 max-h-48 overflow-y-auto'>
              {diagnostics.heraldMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
                    msg.level === 'Success'
                      ? 'bg-emerald-500/10'
                      : msg.level === 'Warning'
                        ? 'bg-amber-500/10'
                        : msg.level === 'Error'
                          ? 'bg-rose-500/10'
                          : 'bg-slate-800/30'
                  }`}
                >
                  <span
                    className={`${
                      msg.level === 'Success'
                        ? 'text-emerald-400'
                        : msg.level === 'Warning'
                          ? 'text-amber-400'
                          : msg.level === 'Error'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                    }`}
                  >
                    {msg.level === 'Success'
                      ? '✓'
                      : msg.level === 'Warning'
                        ? '⚠'
                        : msg.level === 'Error'
                          ? '✗'
                          : 'ℹ'}
                  </span>
                  <div className='flex-1'>
                    <div className='text-slate-200'>{msg.message}</div>
                    <div className='text-[0.6rem] text-slate-500'>
                      {msg.source} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className='mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[0.65rem] text-slate-500'>
        <span>Phase 15 · SystemGPT Console · TerraFusion OS</span>
        {diagnostics && (
          <span>Last updated: {new Date(diagnostics.timestamp).toLocaleTimeString()}</span>
        )}
      </div>

      {/* ExplainPanel overlay */}
      <ExplainPanel state={explainState} onClose={handleCloseExplain} />
    </div>
  );
};

export default SystemGptConsoleView;
