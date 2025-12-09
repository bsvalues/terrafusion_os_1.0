/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GPT STUDIO
 * Elite Government AI Assistant Interface
 * THE TERRAFUSION WAY - Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 *
 * Features:
 * - System GPT catalog (PropertyAssessmentGPT, etc.)
 * - Real-time chat interface
 * - Conversation history
 * - RAG-enhanced responses
 *
 * @module GptStudioView
 * @version 1.0.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    checkAPIHealth,
    createConversation,
    getSystemGPTs,
    sendMessage,
    type GPTConfiguration,
    type GPTConversation,
    type GPTMessage
} from '../../api/gptClient';

// ═══════════════════════════════════════════════════════════════
// COMPONENT STATE TYPES
// ═══════════════════════════════════════════════════════════════

interface GptStudioState {
  gpts: GPTConfiguration[];
  selectedGpt: GPTConfiguration | null;
  conversation: GPTConversation | null;
  messages: GPTMessage[];
  inputValue: string;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  apiHealthy: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GPT STUDIO COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function GptStudioView() {
  const [state, setState] = useState<GptStudioState>({
    gpts: [],
    selectedGpt: null,
    conversation: null,
    messages: [],
    inputValue: '',
    isLoading: true,
    isSending: false,
    error: null,
    apiHealthy: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  // Initialize: check API health and load system GPTs
  useEffect(() => {
    async function initialize() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Check API health
        const healthy = await checkAPIHealth();
        if (!healthy) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            apiHealthy: false,
            error: 'API is not available. Please ensure the backend is running on port 5000.',
          }));
          return;
        }

        // Load system GPTs
        const gpts = await getSystemGPTs();
        setState((prev) => ({
          ...prev,
          gpts,
          isLoading: false,
          apiHealthy: true,
          error: gpts.length === 0 ? 'No system GPTs available. Check backend seeding.' : null,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          apiHealthy: false,
          error: err instanceof Error ? err.message : 'Failed to initialize GPT Studio',
        }));
      }
    }

    initialize();
  }, []);

  // Select a GPT and create a conversation
  const handleSelectGpt = async (gpt: GPTConfiguration) => {
    setState((prev) => ({ ...prev, selectedGpt: gpt, isLoading: true, error: null }));

    try {
      const conversation = await createConversation(
        gpt.name,
        `Chat with ${gpt.displayName}`,
        'anonymous',
        1
      );

      setState((prev) => ({
        ...prev,
        conversation,
        messages: [],
        isLoading: false,
      }));

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create conversation',
      }));
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    const { inputValue, conversation, isSending } = state;

    if (!inputValue.trim() || !conversation || isSending) return;

    const userMessage: GPTMessage = {
      id: Date.now(),
      conversationId: conversation.id,
      role: 'user',
      content: inputValue,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      ragContextUsed: null,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputValue: '',
      isSending: true,
      error: null,
    }));

    try {
      const response = await sendMessage(conversation.id, inputValue, 'anonymous', 1);

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, response],
        isSending: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSending: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      }));
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Back to GPT selection
  const handleBackToList = () => {
    setState((prev) => ({
      ...prev,
      selectedGpt: null,
      conversation: null,
      messages: [],
      inputValue: '',
    }));
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div
      className="gpt-studio"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(10, 14, 26, 0.95)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 2rem',
          background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 153, 255, 0.1))',
          borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {state.selectedGpt && (
          <button
            onClick={handleBackToList}
            style={{
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#00ffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              color: '#00ffff',
              letterSpacing: '1px',
            }}
          >
            🤖 GPT Studio
          </h1>
          <p
            style={{
              margin: '0.25rem 0 0',
              fontSize: '0.9rem',
              color: 'rgba(0, 255, 255, 0.7)',
            }}
          >
            {state.selectedGpt
              ? state.selectedGpt.displayName
              : 'Elite Government AI Assistants'}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: state.apiHealthy ? '#00ff88' : '#ff4444',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: state.apiHealthy ? '#00ff88' : '#ff4444',
            }}
          />
          {state.apiHealthy ? 'API Connected' : 'API Offline'}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Loading State */}
        {state.isLoading && !state.selectedGpt && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00ffff',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
              <div>Loading GPT Studio...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.error && !state.isLoading && !state.selectedGpt && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff4444',
              padding: '2rem',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
              <div style={{ marginBottom: '1rem' }}>{state.error}</div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255, 68, 68, 0.2)',
                  border: '1px solid #ff4444',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: '#ff4444',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* GPT Selection List */}
        {!state.selectedGpt && !state.isLoading && state.gpts.length > 0 && (
          <div
            style={{
              flex: 1,
              padding: '2rem',
              overflowY: 'auto',
            }}
          >
            <h2
              style={{
                margin: '0 0 1.5rem',
                fontSize: '1.2rem',
                color: '#00ffaa',
              }}
            >
              Available System GPTs
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {state.gpts.map((gpt) => (
                <button
                  key={gpt.id}
                  onClick={() => handleSelectGpt(gpt)}
                  style={{
                    background: 'rgba(0, 255, 255, 0.05)',
                    border: '2px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.2)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>
                      {gpt.category === 'Property' ? '🏠' : '🤖'}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        color: '#00ffff',
                      }}
                    >
                      {gpt.displayName}
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: '0 0 1rem',
                      fontSize: '0.85rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      lineHeight: '1.5',
                    }}
                  >
                    {gpt.description || 'No description available'}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        background: 'rgba(0, 255, 170, 0.2)',
                        color: '#00ffaa',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      {gpt.modelName}
                    </span>
                    {gpt.enableRAG && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(0, 153, 255, 0.2)',
                          color: '#0099ff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        RAG Enabled
                      </span>
                    )}
                    {gpt.isSystemGPT && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(255, 170, 0, 0.2)',
                          color: '#ffaa00',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        System
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {state.selectedGpt && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Welcome message */}
              {state.messages.length === 0 && !state.isLoading && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {state.selectedGpt.category === 'Property' ? '🏠' : '🤖'}
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#00ffff' }}>
                    {state.selectedGpt.displayName}
                  </h3>
                  <p style={{ margin: 0 }}>
                    Start a conversation by typing a message below.
                  </p>
                </div>
              )}

              {/* Messages */}
              {state.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      background:
                        msg.role === 'user'
                          ? 'linear-gradient(135deg, #0099ff, #00ffff)'
                          : 'rgba(0, 255, 255, 0.1)',
                      color: msg.role === 'user' ? '#0a0e1a' : '#ffffff',
                      border:
                        msg.role === 'assistant'
                          ? '1px solid rgba(0, 255, 255, 0.3)'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {msg.role === 'user' ? 'You' : state.selectedGpt?.displayName}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && msg.latencyMs > 0 && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          opacity: 0.5,
                          marginTop: '0.5rem',
                        }}
                      >
                        {msg.latencyMs}ms • {msg.totalTokens} tokens
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {state.isSending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      background: 'rgba(0, 255, 255, 0.1)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      color: '#00ffff',
                    }}
                  >
                    <span style={{ animation: 'pulse 1.5s infinite' }}>
                      Thinking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '2px solid rgba(0, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              {state.error && (
                <div
                  style={{
                    marginBottom: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ff4444',
                    fontSize: '0.85rem',
                  }}
                >
                  {state.error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={state.inputValue}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, inputValue: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={state.isSending || !state.conversation}
                  style={{
                    flex: 1,
                    padding: '0.875rem 1rem',
                    background: 'rgba(0, 255, 255, 0.05)',
                    border: '2px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={
                    state.isSending ||
                    !state.inputValue.trim() ||
                    !state.conversation
                  }
                  style={{
                    padding: '0.875rem 1.5rem',
                    background:
                      state.isSending || !state.inputValue.trim()
                        ? 'rgba(0, 255, 255, 0.2)'
                        : 'linear-gradient(135deg, #00ffff, #0099ff)',
                    border: 'none',
                    borderRadius: '8px',
                    color:
                      state.isSending || !state.inputValue.trim()
                        ? 'rgba(0, 255, 255, 0.5)'
                        : '#0a0e1a',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor:
                      state.isSending || !state.inputValue.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {state.isSending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
