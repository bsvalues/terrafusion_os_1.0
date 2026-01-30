import { useEffect, useMemo, useRef, useState } from 'react';
import { useAgentFeed } from './useAgentFeed';
import { useSentinel } from './useSentinel';

type SentinelPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SentinelPanel({ open, onClose }: SentinelPanelProps) {
  const [tab, setTab] = useState<'health' | 'feed'>('health');
  const [copied, setCopied] = useState<null | 'human' | 'audit'>(null);
  const [shiftDown, setShiftDown] = useState(false);
  const {
    status,
    lastPingAt,
    latencyMs,
    endpoint,
    buildSha,
    env,
    warnings,
    intentFilter,
    moduleCountTotal,
    moduleCountActive,
    moduleCountFilteredOut,
    systemComponents,
  } = useSentinel();
  const {
    status: agentStatus,
    statusWarnings,
    events,
    eventsWarnings,
    paused,
    autoScroll,
    setPaused,
    setAutoScroll,
    clearEvents,
  } = useAgentFeed();

  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!autoScroll || !feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [autoScroll, events]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setShiftDown(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setShiftDown(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const mode = event.shiftKey ? 'audit' : 'human';
    const text = events
      .map((entry) => `[${entry.tsUtc}] [${entry.agent}/${entry.topic}] ${entry.message}`)
      .join('\n');
    try {
      if (mode === 'audit') {
        await navigator.clipboard.writeText(JSON.stringify(events, null, 2));
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(mode);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  const LevelDot = ({ level }: { level: string }) => {
    const color =
      level === 'Error'
        ? 'bg-red-500'
        : level === 'Warn'
          ? 'bg-amber-400'
          : level === 'Action'
            ? 'bg-green-400'
            : level === 'Thinking'
              ? 'bg-blue-400 animate-pulse'
              : 'bg-slate-400';
    return (
      <div className='flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5'>
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className='text-[9px] font-mono uppercase text-slate-300'>{level}</span>
      </div>
    );
  };

  const feedSummary = useMemo(() => {
    if (!agentStatus) return null;
    const lastActivity = agentStatus.lastActivityUtc
      ? new Date(agentStatus.lastActivityUtc).toLocaleTimeString()
      : '-';
    return {
      executionMode: agentStatus.executionMode,
      totalAgents: agentStatus.totalAgents,
      activeAgents: agentStatus.activeAgents,
      queueDepth: agentStatus.queueDepth,
      lastActivity,
    };
  }, [agentStatus]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[9998] transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden='true'
      >
        <div className='absolute inset-0 bg-black/20 backdrop-blur-[2px]' />
      </div>

      <aside
        data-testid='system-health-panel'
        className={`fixed top-0 right-0 z-[9999] h-screen w-96 max-w-[90vw] border-l border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-2xl shadow-black/30 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role='dialog'
        aria-modal='false'
        aria-label='Sentinel Console'
      >
        <div className='flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-bold tracking-wider text-slate-200'>
              SENTINEL CONSOLE
            </span>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition'
            aria-label='Close Sentinel'
          >
            ✕
          </button>
        </div>

        <div className='p-5 space-y-6 overflow-y-auto h-[calc(100vh-60px)] text-xs text-slate-100'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setTab('health')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                tab === 'health'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HEALTH
            </button>
            <button
              type='button'
              onClick={() => setTab('feed')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                tab === 'feed'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NEURAL FEED
            </button>
          </div>

          {tab === 'health' && (
            <>
              <div className='grid grid-cols-2 gap-3'>
                <div className='p-3 rounded-lg bg-white/5 border border-white/5'>
                  <div className='text-[10px] uppercase text-slate-500 font-bold mb-1'>
                    System Status
                  </div>
                  <div
                    className={`font-mono text-sm ${
                      status === 'healthy' ? 'text-green-400' : 'text-amber-400'
                    }`}
                  >
                    {status}
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-white/5 border border-white/5'>
                  <div className='text-[10px] uppercase text-slate-500 font-bold mb-1'>Latency</div>
                  <div className='font-mono text-sm text-slate-300'>{latencyMs ?? '-'} ms</div>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='text-[10px] uppercase text-slate-500 font-bold'>Modules</div>
                <div className='rounded-lg border border-white/5 bg-white/5 divide-y divide-white/5 text-xs text-slate-300'>
                  <div className='flex justify-between px-3 py-2'>
                    <span>Active</span>
                    <span className='font-mono text-white'>{moduleCountActive ?? '-'}</span>
                  </div>
                  <div className='flex justify-between px-3 py-2'>
                    <span>Total Detected</span>
                    <span className='font-mono text-white'>{moduleCountTotal ?? '-'}</span>
                  </div>
                  {intentFilter && (
                    <div className='flex justify-between px-3 py-2 bg-indigo-500/10'>
                      <span className='text-indigo-300'>Filtered Out</span>
                      <span className='font-mono text-indigo-300'>
                        {moduleCountFilteredOut ?? '-'}
                      </span>
                    </div>
                  )}
                  {intentFilter && (
                    <div className='px-3 py-1.5 text-[10px] text-indigo-400/60 bg-indigo-500/5 font-mono text-center'>
                      Filter: "{intentFilter}"
                    </div>
                  )}
                </div>
              </div>

              {systemComponents && Object.keys(systemComponents).length > 0 && (
                <div className='space-y-2'>
                  {(() => {
                    const entries = Object.entries(systemComponents);
                    const failComponents = entries.filter(([, ok]) => !ok);
                    const okComponents = entries.filter(([, ok]) => ok);
                    const failCount = failComponents.length;
                    const okCount = okComponents.length;

                    return (
                      <>
                        <div className='flex items-center justify-between'>
                          <div className='text-[10px] uppercase text-slate-500 font-bold tracking-wider'>
                            Components
                          </div>
                          <div className='text-[10px] font-mono font-bold flex items-center gap-2'>
                            {failCount > 0 && (
                              <span className='text-red-400'>{failCount} FAIL</span>
                            )}
                            {failCount > 0 && okCount > 0 && (
                              <span className='text-slate-600'>·</span>
                            )}
                            {okCount > 0 && <span className='text-green-500/80'>{okCount} OK</span>}
                            {(failCount > 0 || okCount > 0) && (
                              <span className='text-slate-600'>·</span>
                            )}
                            {failCount + okCount > 0 && (
                              <span className='text-slate-500'>{failCount + okCount} TOTAL</span>
                            )}
                            {failCount === 0 && okCount === 0 && (
                              <span className='text-slate-500/70'>—</span>
                            )}
                          </div>
                        </div>

                        {failCount > 0 && (
                          <div className='rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden'>
                            {failComponents.map(([name]) => (
                              <div
                                key={name}
                                className='flex items-center justify-between px-3 py-2 border-b border-red-500/10 last:border-0'
                              >
                                <div className='flex items-center gap-2'>
                                  <div className='w-2 h-2 rounded-full bg-red-500 animate-pulse' />
                                  <span className='text-xs font-medium text-red-200'>{name}</span>
                                </div>
                                <span className='text-[10px] font-bold text-red-400'>FAIL</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {okCount > 0 && (
                          <div className='rounded-lg border border-white/5 bg-white/5 overflow-hidden'>
                            {okComponents.map(([name]) => (
                              <div
                                key={name}
                                className='flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-0'
                              >
                                <div className='flex items-center gap-2'>
                                  <div className='w-1.5 h-1.5 rounded-full bg-green-500/80' />
                                  <span className='text-xs text-slate-300'>{name}</span>
                                </div>
                                <span className='text-[10px] text-green-500/60'>OK</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className='space-y-2 pt-4 border-t border-white/5 text-[10px] font-mono text-slate-600'>
                <div className='truncate'>SHA: {buildSha}</div>
                <div className='truncate'>API: {endpoint}</div>
                <div>Last Ping: {lastPingAt ? new Date(lastPingAt).toLocaleTimeString() : '-'}</div>
              </div>

              {warnings.length > 0 && (
                <div className='rounded-md bg-amber-500/10 border border-amber-500/20 p-3'>
                  <div className='flex items-center gap-2 text-amber-400 mb-2'>
                    <span className='text-[10px] font-bold uppercase'>Warnings Detected</span>
                  </div>
                  <ul className='list-disc list-inside text-xs text-amber-200/80 space-y-1 font-mono'>
                    {warnings.map((warning) => (
                      <li key={warning} className='break-all'>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {tab === 'feed' && (
            <>
              <div className='grid grid-cols-2 gap-3'>
                <div className='p-3 rounded-lg bg-white/5 border border-white/5'>
                  <div className='text-[10px] uppercase text-slate-500 font-bold mb-1'>Mode</div>
                  <div className='font-mono text-sm text-slate-300'>
                    {feedSummary?.executionMode ?? '—'}
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-white/5 border border-white/5'>
                  <div className='text-[10px] uppercase text-slate-500 font-bold mb-1'>Agents</div>
                  <div className='font-mono text-sm text-slate-300'>
                    {feedSummary ? `${feedSummary.activeAgents}/${feedSummary.totalAgents}` : '—'}
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-white/5 border border-white/5'>
                  <div className='text-[10px] uppercase text-slate-500 font-bold mb-1'>Queue</div>
                  <div className='font-mono text-sm text-slate-300'>
                    {feedSummary?.queueDepth ?? '—'}
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-white/5 border border-white/5'>
                  <div className='text-[10px] uppercase text-slate-500 font-bold mb-1'>
                    Last Activity
                  </div>
                  <div className='font-mono text-sm text-slate-300'>
                    {feedSummary?.lastActivity ?? '—'}
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between text-[10px] text-slate-400'>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setPaused(!paused)}
                    className='px-2 py-1 rounded border border-white/10 hover:border-white/20'
                  >
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setAutoScroll(!autoScroll)}
                    className='px-2 py-1 rounded border border-white/10 hover:border-white/20'
                  >
                    Auto-scroll: {autoScroll ? 'On' : 'Off'}
                  </button>
                  <button
                    type='button'
                    onClick={clearEvents}
                    className='px-2 py-1 rounded border border-white/10 hover:border-white/20'
                  >
                    Clear
                  </button>
                  <button
                    type='button'
                    onClick={handleCopy}
                    className='px-2 py-1 rounded border border-white/10 hover:border-white/20'
                    title='Click: Copy log | Shift+Click: Copy JSON'
                  >
                    <span className='inline-flex items-center gap-2'>
                      <span>
                        {copied === 'audit'
                          ? 'AUDIT COPIED'
                          : copied === 'human'
                            ? 'COPIED'
                            : shiftDown
                              ? 'AUDIT COPY'
                              : 'Copy'}
                      </span>
                      {shiftDown && copied === null && (
                        <span className='text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 rounded-full'>
                          AUDIT
                        </span>
                      )}
                    </span>
                  </button>
                </div>
                <div className='font-mono'>{events.length} events</div>
              </div>

              {autoScroll && (
                <div className='inline-flex items-center gap-1 text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 w-fit'>
                  LIVE
                </div>
              )}

              <div
                ref={feedRef}
                className='rounded-lg border border-white/10 bg-black/20 h-80 overflow-y-auto p-3 font-mono text-[11px] space-y-2'
              >
                {events.length === 0 && <div className='text-slate-500'>No events yet.</div>}
                {events.map((event) => {
                  const ts = new Date(event.tsUtc).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  return (
                    <div
                      key={event.id}
                      className='flex gap-3 group hover:bg-white/5 p-1.5 rounded-md transition-colors border border-transparent hover:border-white/5'
                    >
                      <span className='text-slate-600 shrink-0 w-16 select-none text-right'>
                        {ts}
                      </span>
                      <div className='flex flex-col gap-1 w-full min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='text-indigo-300 font-bold tracking-tight'>
                            {event.agent}
                          </span>
                          <span className='text-slate-500'>/</span>
                          <span className='text-slate-400'>{event.topic}</span>
                          <LevelDot level={event.level} />
                        </div>
                        <span className='text-slate-300/90 break-words leading-relaxed'>
                          {event.message}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(statusWarnings.length > 0 || eventsWarnings.length > 0) && (
                <div className='rounded-md bg-amber-500/10 border border-amber-500/20 p-3'>
                  <div className='flex items-center gap-2 text-amber-400 mb-2'>
                    <span className='text-[10px] font-bold uppercase'>Feed Warnings</span>
                  </div>
                  <ul className='list-disc list-inside text-xs text-amber-200/80 space-y-1 font-mono'>
                    {[...statusWarnings, ...eventsWarnings].map((warning) => (
                      <li key={warning} className='break-all'>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default SentinelPanel;
