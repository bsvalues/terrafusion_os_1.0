/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEMGPT CONSOLE VIEW
 * Phase 15: AI Control Center for County Tech Leads
 * Phase 17: Safe Mode & Kill Switch
 * Phase 18: Benton CAMA RAG Readiness Panel
 * Phase 19: AI Incident Timeline
 * Phase 20: Metrics & Telemetry Console
 * Phase 22: Multi-County Federation Layer
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { explainContext } from '../../api/explainApi';
import {
  BentonRagStatus,
  downloadBentonRagSnapshot,
  downloadHealthSnapshot,
  getCountyOption,
  getSystemDiagnostics,
  getSystemGptEvents,
  setSystemGptMode,
  SystemDiagnosticsResponse,
  SystemGptEvent,
  SystemGptEventKind,
  SystemHealthStatus,
  triggerRagIndex,
} from '../../api/systemDiagnosticsApi';
import { ExplainPanel, ExplainPanelState } from '../../components/common/ExplainPanel';
import { CountySelector, useCountySelection } from './components/CountySelector';
import { SystemGptMetricsPanel } from './components/SystemGptMetricsPanel';

type LoadState = 'idle' | 'loading' | 'error';

/**
 * SystemGPT Console - AI Control Center
 * Provides county tech leads with visibility into the TerraFusion AI subsystem.
 */
export const SystemGptConsoleView: React.FC = () => {
  // Phase 22: County selection state
  const [selectedCounty, setSelectedCounty] = useCountySelection();
  const countyInfo = getCountyOption(selectedCounty);

  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticsResponse | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [explainState, setExplainState] = useState<ExplainPanelState>({ status: 'idle' });

  // Load diagnostics on mount, periodically, and when county changes
  useEffect(() => {
    const loadDiagnostics = async () => {
      setLoadState('loading');
      setLoadError(null);
      try {
        const data = await getSystemDiagnostics(selectedCounty);
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
  }, [selectedCounty]); // Phase 22: Reload when county changes

  /**
   * Handle RAG index button click
   */
  const handleIndexRag = async (datasetKey: string) => {
    setIndexing(true);
    try {
      await triggerRagIndex(datasetKey);
      // Reload diagnostics after indexing
      const data = await getSystemDiagnostics(selectedCounty);
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
   * AI Incident Timeline - Phase 19
   */
  const [events, setEvents] = useState<SystemGptEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<'all' | 'warnings' | 'safemode' | 'rag'>('all');

  // Load events on mount and when county changes
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await getSystemGptEvents(selectedCounty, undefined, 50);
        setEvents(data);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setEventsLoading(false);
      }
    };

    void loadEvents();
    // Refresh events every 60 seconds
    const interval = setInterval(() => void loadEvents(), 60000);
    return () => clearInterval(interval);
  }, [selectedCounty]); // Phase 22: Reload when county changes

  const getFilteredEvents = () => {
    if (eventFilter === 'all') return events;
    if (eventFilter === 'warnings')
      return events.filter((e) => e.severity === 'warning' || e.severity === 'error');
    if (eventFilter === 'safemode') return events.filter((e) => e.kind === 'SafeModeChanged');
    if (eventFilter === 'rag')
      return events.filter(
        (e) =>
          e.kind === 'RagReindexed' ||
          e.kind === 'RagHealthChanged' ||
          e.kind === 'BentonRagSnapshotDownloaded'
      );
    return events;
  };

  const getEventIcon = (kind: SystemGptEventKind) => {
    switch (kind) {
      case 'SafeModeChanged':
        return '🛑';
      case 'RagReindexed':
        return '🔄';
      case 'RagHealthChanged':
        return '📊';
      case 'HealthSnapshotDownloaded':
        return '📥';
      case 'BentonRagSnapshotDownloaded':
        return '🏛️';
      case 'HeraldWarning':
        return '⚠️';
      case 'HeraldError':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getEventSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'border-rose-500/50 bg-rose-500/10 text-rose-300';
      case 'warning':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-300';
      case 'info':
      default:
        return 'border-slate-600/50 bg-slate-700/20 text-slate-300';
    }
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
   * Safe Mode Toggle - Phase 17
   */
  const [safeModeLoading, setSafeModeLoading] = useState(false);
  const [safeModeError, setSafeModeError] = useState<string | null>(null);
  const [showSafeModeDialog, setShowSafeModeDialog] = useState(false);
  const [safeModeReason, setSafeModeReason] = useState('');

  const handleToggleSafeMode = async () => {
    const isCurrentlySafe = diagnostics?.mode === 'SafeMode';

    if (!isCurrentlySafe) {
      // Show dialog to get reason before enabling Safe Mode
      setShowSafeModeDialog(true);
      return;
    }

    // Disabling Safe Mode - no reason needed
    setSafeModeLoading(true);
    setSafeModeError(null);
    try {
      await setSystemGptMode({ enabled: false });
      // Reload diagnostics to reflect new mode
      const data = await getSystemDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      setSafeModeError(err instanceof Error ? err.message : 'Failed to disable Safe Mode');
    } finally {
      setSafeModeLoading(false);
    }
  };

  const handleConfirmSafeMode = async () => {
    if (!safeModeReason.trim()) {
      setSafeModeError('Please provide a reason for enabling Safe Mode');
      return;
    }

    setSafeModeLoading(true);
    setSafeModeError(null);
    try {
      await setSystemGptMode({ enabled: true, reason: safeModeReason.trim() });
      // Reload diagnostics to reflect new mode
      const data = await getSystemDiagnostics();
      setDiagnostics(data);
      setShowSafeModeDialog(false);
      setSafeModeReason('');
    } catch (err) {
      setSafeModeError(err instanceof Error ? err.message : 'Failed to enable Safe Mode');
    } finally {
      setSafeModeLoading(false);
    }
  };

  const handleCancelSafeMode = () => {
    setShowSafeModeDialog(false);
    setSafeModeReason('');
    setSafeModeError(null);
  };

  /**
   * Benton CAMA RAG Readiness - Phase 18
   */
  const [bentonReindexing, setBentonReindexing] = useState(false);
  const [bentonDownloading, setBentonDownloading] = useState(false);

  const handleReindexBentonCama = async () => {
    setBentonReindexing(true);
    try {
      await triggerRagIndex('benton_cama_basics');
      // Reload diagnostics to reflect new status
      const data = await getSystemDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      console.error('Benton CAMA reindex failed:', err);
    } finally {
      setBentonReindexing(false);
    }
  };

  const handleDownloadBentonSnapshot = async () => {
    setBentonDownloading(true);
    try {
      await downloadBentonRagSnapshot();
    } catch (err) {
      console.error('Benton RAG snapshot download failed:', err);
    } finally {
      setBentonDownloading(false);
    }
  };

  /**
   * Get Benton RAG status color classes - Phase 18
   */
  const getBentonRagStatusColor = (status: BentonRagStatus) => {
    switch (status) {
      case 'Ready':
        return 'text-emerald-400 border-emerald-400/60 bg-emerald-500/10';
      case 'Stale':
        return 'text-amber-400 border-amber-400/60 bg-amber-500/10';
      case 'Partial':
        return 'text-amber-400 border-amber-400/60 bg-amber-500/10';
      case 'Unindexed':
        return 'text-rose-400 border-rose-400/60 bg-rose-500/10';
      default:
        return 'text-slate-400 border-slate-400/60 bg-slate-500/10';
    }
  };

  const getBentonRagStatusIcon = (status: BentonRagStatus) => {
    switch (status) {
      case 'Ready':
        return '✅';
      case 'Stale':
        return '⏰';
      case 'Partial':
        return '⚠️';
      case 'Unindexed':
        return '❌';
      default:
        return '❓';
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

          {/* Phase 22: County Selector */}
          <div className='ml-4 border-l border-slate-700 pl-4'>
            <CountySelector
              selectedCountyId={selectedCounty}
              onCountyChange={setSelectedCounty}
              disabled={loadState === 'loading'}
            />
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

          {/* Mode Badge - Phase 17 */}
          {diagnostics && (
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                diagnostics.mode === 'SafeMode'
                  ? 'border-rose-500/60 bg-rose-500/10 text-rose-300'
                  : 'border-slate-600/60 bg-slate-700/30 text-slate-400'
              }`}
              title={
                diagnostics.mode === 'SafeMode'
                  ? `Safe Mode active: ${diagnostics.modeReason || 'No reason provided'}`
                  : 'Normal operation'
              }
            >
              <span>{diagnostics.mode === 'SafeMode' ? '🛑' : '✨'}</span>
              <span>Mode: {diagnostics.mode === 'SafeMode' ? 'Safe' : 'Normal'}</span>
            </div>
          )}

          {/* Safe Mode Toggle Button - Phase 17 */}
          <button
            onClick={() => void handleToggleSafeMode()}
            disabled={safeModeLoading || !diagnostics}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              diagnostics?.mode === 'SafeMode'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]'
            }`}
            title={
              diagnostics?.mode === 'SafeMode'
                ? 'Disable Safe Mode and return to normal operation'
                : 'Enable Safe Mode to restrict AI operations'
            }
          >
            {safeModeLoading
              ? '⏳ Updating...'
              : diagnostics?.mode === 'SafeMode'
                ? '✅ Disable Safe Mode'
                : '🛑 Enable Safe Mode'}
          </button>

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

          {/* Benton CAMA RAG Readiness - Phase 18 */}
          <div className='rounded-xl border border-violet-800/40 bg-gradient-to-br from-slate-900/80 via-violet-900/10 to-slate-900/80 p-4 md:col-span-2'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>🏛️</span>
                <span className='text-xs font-semibold uppercase tracking-[0.12em] text-violet-300'>
                  Benton CAMA RAG Readiness
                </span>
              </div>
              {diagnostics.bentonRag && (
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBentonRagStatusColor(diagnostics.bentonRag.overallStatus)}`}
                >
                  <span>{getBentonRagStatusIcon(diagnostics.bentonRag.overallStatus)}</span>
                  <span>{diagnostics.bentonRag.overallStatus}</span>
                </div>
              )}
            </div>

            {!diagnostics.bentonRag ? (
              <div className='flex items-center gap-2 rounded-lg bg-slate-800/30 px-3 py-2 text-xs text-slate-400'>
                <span>❓</span>
                <span>No Benton CAMA RAG dataset found.</span>
              </div>
            ) : (
              <div className='space-y-3'>
                {/* Status reason */}
                <div className='rounded-lg bg-slate-800/30 px-3 py-2 text-xs text-slate-300'>
                  {diagnostics.bentonRag.statusReason}
                </div>

                {/* Stats row */}
                <div className='grid grid-cols-4 gap-2'>
                  <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                    <div className='text-base font-bold text-violet-300'>
                      {diagnostics.bentonRag.documentCount}
                    </div>
                    <div className='text-[0.6rem] text-slate-400'>Documents</div>
                  </div>
                  <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                    <div className='text-base font-bold text-violet-300'>
                      {diagnostics.bentonRag.embeddingCount}
                    </div>
                    <div className='text-[0.6rem] text-slate-400'>Embeddings</div>
                  </div>
                  <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                    <div className='truncate text-[0.65rem] font-medium text-violet-200'>
                      {diagnostics.bentonRag.lastIngestAt
                        ? new Date(diagnostics.bentonRag.lastIngestAt).toLocaleDateString()
                        : '—'}
                    </div>
                    <div className='text-[0.55rem] text-slate-400'>Last Ingest</div>
                  </div>
                  <div className='rounded-lg border border-slate-700/40 bg-slate-800/30 p-2 text-center'>
                    <div className='truncate text-[0.65rem] font-medium text-violet-200'>
                      {diagnostics.bentonRag.lastIndexAt
                        ? new Date(diagnostics.bentonRag.lastIndexAt).toLocaleDateString()
                        : '—'}
                    </div>
                    <div className='text-[0.55rem] text-slate-400'>Last Index</div>
                  </div>
                </div>

                {/* Active GPTs */}
                {diagnostics.bentonRag.activeGptConfigs.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    <span className='text-[0.6rem] text-slate-500'>Used by:</span>
                    {diagnostics.bentonRag.activeGptConfigs.map((gpt) => (
                      <span
                        key={gpt}
                        className='rounded-full border border-violet-600/40 bg-violet-500/10 px-2 py-0.5 text-[0.6rem] text-violet-300'
                      >
                        {gpt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className='flex gap-2 pt-1'>
                  <button
                    onClick={() => void handleReindexBentonCama()}
                    disabled={bentonReindexing}
                    className='flex items-center gap-1.5 rounded-lg border border-violet-600/50 bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-200 transition-all hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {bentonReindexing ? '⏳' : '🔄'}{' '}
                    {bentonReindexing ? 'Reindexing...' : 'Reindex Benton CAMA'}
                  </button>
                  <button
                    onClick={() => void handleDownloadBentonSnapshot()}
                    disabled={bentonDownloading}
                    className='flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-700/30 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {bentonDownloading ? '⏳' : '📥'}{' '}
                    {bentonDownloading ? 'Downloading...' : 'Download RAG Snapshot'}
                  </button>
                </div>
              </div>
            )}
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

          {/* AI Incident Timeline - Phase 19 */}
          <div
            data-testid='ai-incident-timeline'
            className='rounded-xl border border-cyan-800/40 bg-gradient-to-br from-slate-900/80 via-cyan-900/10 to-slate-900/80 p-4 md:col-span-2 lg:col-span-3'
          >
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>📜</span>
                <span className='text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300'>
                  AI Incident Timeline
                </span>
              </div>
              {/* Filter buttons */}
              <div className='flex gap-1'>
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'warnings' as const, label: '⚠ Warnings' },
                  { key: 'safemode' as const, label: '🛑 Safe Mode' },
                  { key: 'rag' as const, label: '📚 RAG' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setEventFilter(f.key)}
                    className={`rounded-full px-2 py-0.5 text-[0.6rem] font-medium transition-all ${
                      eventFilter === f.key
                        ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                        : 'border border-slate-600/40 bg-slate-800/30 text-slate-400 hover:bg-slate-700/40'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {eventsLoading ? (
              <div className='flex items-center justify-center py-8 text-slate-400'>
                <span className='animate-pulse'>Loading events...</span>
              </div>
            ) : getFilteredEvents().length === 0 ? (
              <div className='flex items-center gap-2 rounded-lg bg-slate-800/30 px-3 py-4 text-xs text-slate-400'>
                <span>📭</span>
                <span>No events to display.</span>
              </div>
            ) : (
              <div className='max-h-64 space-y-2 overflow-y-auto'>
                {getFilteredEvents().map((evt, idx) => (
                  <div
                    key={`${evt.timestampUtc}-${idx}`}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${getEventSeverityColor(evt.severity)}`}
                  >
                    <span className='mt-0.5 text-sm'>{getEventIcon(evt.kind)}</span>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='font-medium truncate'>{evt.summary}</span>
                        <span className='text-[0.55rem] text-slate-500 whitespace-nowrap'>
                          {new Date(evt.timestampUtc).toLocaleString()}
                        </span>
                      </div>
                      {evt.details && (
                        <div className='mt-1 text-[0.65rem] text-slate-400 truncate'>
                          {evt.details}
                        </div>
                      )}
                      {evt.actor && (
                        <div className='mt-0.5 text-[0.55rem] text-slate-500'>by {evt.actor}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Metrics & Telemetry - Phase 20 */}
          <div
            data-testid='ai-metrics-panel'
            className='rounded-xl border border-cyan-800/40 bg-gradient-to-br from-slate-900/80 via-cyan-900/10 to-slate-900/80 p-4 md:col-span-2 lg:col-span-3'
          >
            <SystemGptMetricsPanel
              countyId={selectedCounty}
              windowMinutes={15}
              maxSeriesPoints={40}
              refreshIntervalMs={30000}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className='mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[0.65rem] text-slate-500'>
        <span>Phase 15-22 · SystemGPT Console · {countyInfo.displayName} · TerraFusion OS</span>
        {diagnostics && (
          <span>Last updated: {new Date(diagnostics.timestamp).toLocaleTimeString()}</span>
        )}
      </div>

      {/* Safe Mode Confirmation Dialog - Phase 17 */}
      {showSafeModeDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-2xl border border-rose-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/30 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-2xl'>
                🛑
              </div>
              <div>
                <h3 className='text-lg font-semibold text-rose-300'>Enable Safe Mode</h3>
                <p className='text-xs text-slate-400'>
                  This will restrict AI operations for all users
                </p>
              </div>
            </div>

            <div className='mb-4'>
              <label className='mb-2 block text-xs font-medium text-slate-300'>
                Reason for Safe Mode <span className='text-rose-400'>*</span>
              </label>
              <textarea
                value={safeModeReason}
                onChange={(e) => setSafeModeReason(e.target.value)}
                placeholder='e.g., "Investigating unexpected AI responses on property valuations"'
                className='w-full rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50'
                rows={3}
                autoFocus
              />
              {safeModeError && <p className='mt-2 text-xs text-rose-400'>{safeModeError}</p>}
            </div>

            <div className='mb-4 rounded-lg border border-amber-700/50 bg-amber-500/10 p-3'>
              <p className='text-xs text-amber-300'>
                <strong>⚠️ Warning:</strong> While Safe Mode is active:
              </p>
              <ul className='mt-2 list-inside list-disc text-xs text-amber-200/80'>
                <li>New AI conversations will be blocked</li>
                <li>RAG indexing operations will be disabled</li>
                <li>Users will see Safe Mode notices</li>
              </ul>
            </div>

            <div className='flex justify-end gap-3'>
              <button
                onClick={handleCancelSafeMode}
                disabled={safeModeLoading}
                className='rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-all hover:bg-slate-700 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmSafeMode()}
                disabled={safeModeLoading || !safeModeReason.trim()}
                className='rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {safeModeLoading ? '⏳ Enabling...' : '🛑 Enable Safe Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ExplainPanel overlay */}
      <ExplainPanel state={explainState} onClose={handleCloseExplain} />
    </div>
  );
};

export default SystemGptConsoleView;
