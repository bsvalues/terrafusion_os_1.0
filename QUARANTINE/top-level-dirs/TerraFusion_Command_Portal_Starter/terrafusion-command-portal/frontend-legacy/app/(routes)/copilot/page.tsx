'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedNext?: string[];
}

export default function Copilot(){
  const params = useSearchParams();
  const ws = params.get('ws') || 'terra-levy';
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI assistant for the **${ws}** workspace. I can help you with:\n\n• Testing calculations and workflows\n• Reviewing configuration and data\n• Generating reports\n• Explaining how features work\n\nWhat would you like to know?`,
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8787/api/portal/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspace: ws, query }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'I understand you\'re asking about the TerraFusion ecosystem. As your AI assistant, I can help with workspace management, health monitoring, and development tasks. Could you be more specific about what you need help with?',
        timestamp: new Date().toLocaleTimeString(),
        suggestedNext: data.suggested_next || [
          'Check workspace health status',
          'Show me workspace configuration', 
          'Explain TerraFusion architecture',
          'Help with development workflow'
        ],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered a connection error. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function selectSuggestion(suggestion: string) {
    setQuery(suggestion);
  }

  return (
    <section style={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        borderBottom: '2px solid #e1e4e8', 
        paddingBottom: 12,
        marginBottom: 16 
      }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>🤖 AI Assistant</h1>
        <p style={{ margin: '4px 0 0 0', color: '#586069' }}>
          Workspace: <code style={{ 
            background: '#f6f8fa', 
            padding: '2px 6px', 
            borderRadius: 3,
            fontSize: 13
          }}>{ws}</code>
        </p>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: 16,
        padding: '0 8px'
      }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            style={{ 
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: 12,
              borderRadius: 8,
              background: msg.role === 'user' ? '#0366d6' : '#f6f8fa',
              color: msg.role === 'user' ? 'white' : '#24292e',
            }}>
              <div style={{ 
                fontSize: 11, 
                opacity: 0.7, 
                marginBottom: 4,
                fontWeight: 600,
              }}>
                {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'} • {msg.timestamp}
              </div>
              <div style={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}>
                {msg.content}
              </div>
              
              {/* Suggested Next Actions */}
              {msg.suggestedNext && msg.suggestedNext.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e1e4e8' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
                    💡 Suggested next:
                  </div>
                  {msg.suggestedNext.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(suggestion)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 10px',
                        margin: '4px 0',
                        background: 'white',
                        border: '1px solid #e1e4e8',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f6f8fa';
                        e.currentTarget.style.borderColor = '#0366d6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e1e4e8';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#586069' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div>AI is thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ 
        borderTop: '2px solid #e1e4e8', 
        paddingTop: 16 
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about this workspace..."
            disabled={isLoading}
            rows={3} 
            style={{
              flex: 1,
              padding: 12,
              border: '1px solid #e1e4e8',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'none',
            }} 
          />
          <button 
            onClick={sendMessage}
            disabled={!query.trim() || isLoading}
            style={{
              padding: '0 24px',
              background: query.trim() && !isLoading ? '#0366d6' : '#e1e4e8',
              color: query.trim() && !isLoading ? 'white' : '#959da5',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: query.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#586069' }}>
          💡 Press <kbd style={{ background: '#fafbfc', padding: '2px 6px', border: '1px solid #e1e4e8', borderRadius: 3 }}>Enter</kbd> to send, <kbd style={{ background: '#fafbfc', padding: '2px 6px', border: '1px solid #e1e4e8', borderRadius: 3 }}>Shift+Enter</kbd> for new line
        </div>
      </div>
    </section>
  );
}
