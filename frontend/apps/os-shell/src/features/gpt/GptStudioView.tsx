import React, { useEffect, useState } from 'react';
import { explainContext } from '../../api/explainApi';
import {
  ConversationDto,
  createConversation,
  getMessages,
  getRagHealth,
  getSystemGpts,
  GPTConfigurationDto,
  GPTMessageDto,
  indexRagDataset,
  RagDatasetStatus,
  sendMessage,
} from '../../api/gptClient';
import { ExplainPanel, ExplainPanelState } from '../../components/common/ExplainPanel';

type LoadState = 'idle' | 'loading' | 'error';

export const GptStudioView: React.FC = () => {
  const [gpts, setGpts] = useState<GPTConfigurationDto[]>([]);
  const [gptsState, setGptsState] = useState<LoadState>('idle');
  const [gptsError, setGptsError] = useState<string | null>(null);

  const [selectedGpt, setSelectedGpt] = useState<GPTConfigurationDto | null>(null);
  const [conversation, setConversation] = useState<ConversationDto | null>(null);
  const [messages, setMessages] = useState<GPTMessageDto[]>([]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // RAG health state
  const [ragStatus, setRagStatus] = useState<RagDatasetStatus | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragIndexing, setRagIndexing] = useState(false);

  // Phase 11: Show Sources toggle for RAG traceability
  const [showSources, setShowSources] = useState(false);

  // Phase 13: ExplainGPT state
  const [explainState, setExplainState] = useState<ExplainPanelState>({ status: 'idle' });

  // Load system GPTs on mount
  useEffect(() => {
    const load = async () => {
      setGptsState('loading');
      setGptsError(null);
      try {
        const data = await getSystemGpts();
        setGpts(data);
        setGptsState('idle');
      } catch (err: unknown) {
        setGptsState('error');
        setGptsError(err instanceof Error ? err.message : 'Failed to load GPT configurations.');
      }
    };

    load().catch((err) => {
      setGptsState('error');
      setGptsError(err instanceof Error ? err.message : 'Failed to load GPT configurations.');
    });
  }, []);

  // Auto-select PropertyAssessmentGPT (or first) once GPTs are loaded
  useEffect(() => {
    if (gpts.length === 0 || selectedGpt) return;
    const propertyGpt = gpts.find((g) => g.key === 'PropertyAssessmentGPT') ?? gpts[0];
    if (propertyGpt) {
      void handleSelectGpt(propertyGpt);
    }
  }, [gpts, selectedGpt]);

  // Load RAG health when PropertyAssessmentGPT is selected
  useEffect(() => {
    if (!selectedGpt || selectedGpt.key !== 'PropertyAssessmentGPT') {
      setRagStatus(null);
      setRagError(null);
      setRagLoading(false);
      return;
    }

    const loadRag = async () => {
      setRagLoading(true);
      setRagError(null);
      try {
        const health = await getRagHealth();
        const ds = health.datasets.find((d) => d.id === 'benton_cama_basics') ?? null;
        setRagStatus(ds);
      } catch (err: unknown) {
        setRagError(err instanceof Error ? err.message : 'Failed to load RAG health.');
        setRagStatus(null);
      } finally {
        setRagLoading(false);
      }
    };

    void loadRag();
  }, [selectedGpt]);

  // Trigger RAG dataset indexing
  const handleIndexRag = async () => {
    setRagIndexing(true);
    setRagError(null);
    try {
      await indexRagDataset('benton_cama_basics');
      // Refresh RAG health after indexing
      const health = await getRagHealth();
      const ds = health.datasets.find((d) => d.id === 'benton_cama_basics') ?? null;
      setRagStatus(ds);
    } catch (err: unknown) {
      setRagError(err instanceof Error ? err.message : 'Failed to index RAG dataset.');
    } finally {
      setRagIndexing(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to load conversation messages.');
    }
  };

  const handleSelectGpt = async (gpt: GPTConfigurationDto) => {
    setSelectedGpt(gpt);
    setConversation(null);
    setMessages([]);
    setSendError(null);

    try {
      const convo = await createConversation(gpt.key);
      setConversation(convo);
      await loadMessages(convo.id);
    } catch (err: unknown) {
      setSendError(
        err instanceof Error ? err.message : 'Failed to create conversation for selected GPT.'
      );
    }
  };

  const handleSend = async () => {
    if (!conversation || !input.trim()) return;
    setSending(true);
    setSendError(null);

    const content = input.trim();
    setInput('');

    try {
      // optimistic user message
      const userMessage: GPTMessageDto = {
        id: crypto.randomUUID(),
        role: 'User',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const assistant = await sendMessage(conversation.id, content);
      setMessages((prev) => [...prev, assistant]);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  /**
   * Handle flow selection - pre-populate input with flow prompt
   */
  const handleSelectFlow = (flow: AssessorFlow) => {
    setInput(flow.prompt);
    // Optionally auto-send for a more streamlined UX
    // void handleSend(); // Uncomment to auto-send when flow is clicked
  };

  /**
   * Check if PropertyAssessmentGPT flows should be shown
   */
  const showAssessorFlows = selectedGpt?.key === 'PropertyAssessmentGPT' && conversation;

  /**
   * Handle "Explain this" action - fetch ExplainGPT context for GPTStudio
   */
  const handleExplainThis = async () => {
    setExplainState({ status: 'loading' });
    try {
      const response = await explainContext({
        contextType: 'View',
        contextId: 'GPTStudio',
        metadata: { activeGpt: selectedGpt?.key },
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

  /**
   * Close the ExplainPanel
   */
  const handleCloseExplain = () => {
    setExplainState({ status: 'idle' });
  };

  return (
    <div
      data-testid='gpt-studio-view'
      className='flex h-full w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/90 p-4 text-sm text-slate-50'
    >
      {/* Header / title bar */}
      <div className='mb-3 flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.60)] backdrop-blur-xl'>
        <div className='flex items-center gap-3'>
          {/* TerraSphere-style indicator */}
          <div className='relative h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-300 shadow-[0_0_25px_rgba(56,189,248,0.9)]'>
            <div className='absolute inset-[2px] rounded-full bg-slate-950/80 backdrop-blur' />
            <div className='absolute inset-[4px] rounded-full border border-cyan-300/40' />
          </div>
          <div>
            <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-300'>
              TerraFusion GPT Suite
            </div>
            <div className='text-[0.7rem] text-slate-400'>
              Interactive GPT workbench for system agents and valuation flows.
            </div>
          </div>
        </div>
        {selectedGpt && conversation && (
          <div className='flex items-center gap-2 text-[0.68rem] text-slate-400'>
            {/* RAG Status Pill for PropertyAssessmentGPT */}
            {selectedGpt.key === 'PropertyAssessmentGPT' && (
              <>
                {ragLoading && (
                  <span className='rounded-full border border-sky-500/50 bg-slate-950/80 px-2 py-0.5 text-[0.6rem] text-sky-300/80'>
                    RAG: Checking…
                  </span>
                )}
                {ragIndexing && (
                  <span className='rounded-full border border-violet-500/50 bg-violet-500/10 px-2 py-0.5 text-[0.6rem] text-violet-300'>
                    RAG: Indexing…
                  </span>
                )}
                {!ragLoading &&
                  !ragIndexing &&
                  ragStatus &&
                  ragStatus.indexed &&
                  ragStatus.embeddingCount > 0 && (
                    <span className='rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 text-[0.6rem] text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.6)]'>
                      RAG: Benton CAMA Online · {ragStatus.documentCount} docs
                    </span>
                  )}
                {!ragLoading &&
                  !ragIndexing &&
                  ragStatus &&
                  (!ragStatus.indexed || ragStatus.embeddingCount === 0) && (
                    <>
                      <span className='rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[0.6rem] text-amber-200'>
                        RAG: Not indexed
                      </span>
                      <button
                        onClick={() => void handleIndexRag()}
                        className='rounded-full border border-cyan-400/60 bg-cyan-500/10 px-2 py-0.5 text-[0.6rem] text-cyan-300 transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                      >
                        Index Now
                      </button>
                    </>
                  )}
                {!ragLoading && !ragIndexing && !ragStatus && !ragError && (
                  <span className='rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[0.6rem] text-amber-200'>
                    RAG: Dataset not found
                  </span>
                )}
                {ragError && (
                  <span className='rounded-full border border-rose-400/60 bg-rose-500/10 px-2 py-0.5 text-[0.6rem] text-rose-200'>
                    RAG: Error
                  </span>
                )}
              </>
            )}
            <span className='rounded-full bg-slate-900/80 px-2 py-0.5 font-mono text-[0.6rem] text-slate-300/80'>
              {selectedGpt.key}
            </span>
            <span className='rounded-full border border-slate-700/60 bg-slate-950/70 px-2 py-0.5'>
              Conversation {conversation.id.substring(0, 8)}…
            </span>
            {/* Explain This button (Phase 13) */}
            <button
              onClick={() => void handleExplainThis()}
              className='rounded-full border border-fuchsia-500/50 bg-fuchsia-500/10 px-2 py-0.5 text-[0.6rem] text-fuchsia-300 transition-all hover:bg-fuchsia-500/20 hover:shadow-[0_0_12px_rgba(217,70,239,0.4)]'
              title='Explain this view'
            >
              ❓ Explain
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className='flex min-h-0 flex-1 gap-4'>
        {/* Left column: GPT list */}
        <div className='flex w-72 flex-col rounded-2xl border border-slate-800/70 bg-slate-950/70 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.65)] backdrop-blur-xl'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400'>
              System GPTs
            </div>
            <div className='h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-400/70 via-sky-400/70 to-purple-400/70' />
          </div>
          {gptsState === 'loading' && (
            <div className='mt-2 text-xs text-slate-400'>Loading GPTs…</div>
          )}
          {gptsState === 'error' && <div className='mt-2 text-xs text-red-400'>{gptsError}</div>}
          {gptsState === 'idle' && gpts.length === 0 && (
            <div className='mt-2 text-xs text-slate-500'>No GPTs available.</div>
          )}

          <div className='mt-1 flex-1 space-y-1.5 overflow-y-auto'>
            {gpts.map((gpt) => {
              const isActive = selectedGpt?.key === gpt.key;
              return (
                <button
                  key={gpt.key}
                  type='button'
                  onClick={() => void handleSelectGpt(gpt)}
                  className={[
                    'group w-full rounded-xl px-3 py-2 text-left text-xs transition-all',
                    'border border-transparent bg-slate-900/70 backdrop-blur-sm',
                    'hover:border-sky-500/70 hover:bg-slate-900/90 hover:shadow-[0_10px_30px_rgba(56,189,248,0.35)]',
                    isActive
                      ? 'border-sky-400/80 bg-slate-900/95 shadow-[0_0_30px_rgba(56,189,248,0.85)]'
                      : '',
                  ].join(' ')}
                >
                  <div className='flex items-center justify-between'>
                    <div className='font-semibold text-slate-50'>{gpt.name}</div>
                    <div className='h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.9)] group-hover:bg-sky-400/90' />
                  </div>
                  <div className='mt-0.5 text-[0.7rem] leading-snug text-slate-300/90 line-clamp-2'>
                    {gpt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle column: Assessor Flows (only for PropertyAssessmentGPT) */}
        {showAssessorFlows && (
          <div className='flex w-64 flex-col rounded-2xl border border-slate-800/70 bg-slate-950/70 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.65)] backdrop-blur-xl'>
            <PropertyAssessmentFlows onSelectFlow={handleSelectFlow} isDisabled={sending} />
          </div>
        )}

        {/* Right column: conversation */}
        <div className='flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-800/70 bg-slate-950/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex flex-col'>
              <div className='text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400'>
                {selectedGpt ? selectedGpt.name : 'Select a GPT from the left'}
              </div>
              <div className='text-[0.7rem] text-slate-500'>
                {selectedGpt
                  ? "Messages are persisted as part of TerraFusion's GPT audit trail."
                  : 'Choose a system GPT to start a new conversation.'}
              </div>
            </div>
            {/* Phase 11: Show Sources Toggle */}
            {selectedGpt && (
              <button
                type='button'
                onClick={() => setShowSources((prev) => !prev)}
                className={[
                  'flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[0.65rem] font-medium transition-all',
                  showSources
                    ? 'border border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                    : 'border border-slate-700/50 bg-slate-900/60 text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300',
                ].join(' ')}
                title='Toggle RAG source visibility for audit traceability'
              >
                <span>{showSources ? '📚' : '📄'}</span>
                <span>{showSources ? 'Sources ON' : 'Show Sources'}</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className='flex-1 overflow-y-auto rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/80 p-3'>
            {messages.length === 0 && (
              <div className='flex h-full items-center justify-center text-xs text-slate-500'>
                Start typing below to talk to this GPT.
              </div>
            )}
            <div className='space-y-2'>
              {messages.map((msg) => {
                const role = msg.role.toLowerCase();
                const isUser = role === 'user' || role === 'human';
                const hasRagSources = msg.ragDocumentsUsed && msg.ragDocumentsUsed.length > 0;
                return (
                  <div
                    key={msg.id}
                    className={['flex w-full', isUser ? 'justify-end' : 'justify-start'].join(' ')}
                  >
                    <div
                      className={[
                        'max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed backdrop-blur',
                        'border border-slate-700/60',
                        isUser
                          ? 'bg-gradient-to-br from-sky-500/90 via-sky-400/90 to-cyan-400/90 text-white shadow-[0_14px_40px_rgba(56,189,248,0.65)]'
                          : 'bg-slate-900/90 text-slate-50 shadow-[0_8px_30px_rgba(15,23,42,0.80)]',
                      ].join(' ')}
                    >
                      <div className='mb-1 flex items-center gap-2'>
                        <span className='text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-200/80'>
                          {isUser ? 'You' : 'Assistant'}
                        </span>
                        {hasRagSources && (
                          <span
                            className='rounded-full border border-emerald-400/60 bg-emerald-500/10 px-1.5 py-0.5 text-[0.55rem] text-emerald-200'
                            title={`Grounded in: ${msg.ragDocumentsUsed?.join(', ')}`}
                          >
                            📚 RAG {msg.ragScore ? `(${(msg.ragScore * 100).toFixed(0)}%)` : ''}
                          </span>
                        )}
                      </div>
                      <div className='whitespace-pre-wrap'>{msg.content}</div>
                      {/* Phase 11: Conditional source display based on showSources toggle */}
                      {hasRagSources && showSources && (
                        <div className='mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-2'>
                          <div className='text-[0.6rem] text-emerald-300/90'>
                            <span className='font-semibold'>📄 Sources (RAG Trace):</span>
                          </div>
                          <div className='mt-1 space-y-0.5'>
                            {msg.ragDocumentsUsed?.map((doc, idx) => (
                              <div
                                key={doc}
                                className='flex items-center gap-1.5 text-[0.6rem] text-slate-300/80'
                              >
                                <span className='text-emerald-400'>•</span>
                                <span className='font-mono'>{doc}</span>
                              </div>
                            ))}
                          </div>
                          {msg.ragScore && (
                            <div className='mt-1.5 text-[0.55rem] text-slate-400/70'>
                              Relevance Score: {(msg.ragScore * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className='mt-3 border-t border-slate-800/70 pt-2'>
            {sendError && <div className='mb-1 text-xs text-red-400'>{sendError}</div>}
            <div className='flex items-end gap-2'>
              <textarea
                className='h-18 flex-1 resize-none rounded-2xl border border-slate-800/70 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 shadow-[0_10px_32px_rgba(0,0,0,0.75)] outline-none backdrop-blur-xl transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60 disabled:opacity-60'
                placeholder={
                  selectedGpt
                    ? `Ask ${selectedGpt.name} a question…`
                    : 'Select a GPT on the left to start.'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!selectedGpt || sending}
              />
              <button
                type='button'
                onClick={() => void handleSend()}
                disabled={!selectedGpt || sending || !input.trim()}
                className='mb-0.5 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-400 to-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_40px_rgba(56,189,248,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
            <div className='mt-1 text-[0.65rem] text-slate-500'>
              Press <span className='font-mono'>Enter</span> to send,{' '}
              <span className='font-mono'>Shift+Enter</span> for newline.
            </div>
          </div>
        </div>
      </div>

      {/* ExplainPanel overlay (Phase 13) */}
      <ExplainPanel state={explainState} onClose={handleCloseExplain} />
    </div>
  );
};
