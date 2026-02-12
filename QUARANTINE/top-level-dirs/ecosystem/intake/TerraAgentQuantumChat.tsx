import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Select,
  SelectItem,
  Progress,
  Badge,
  Divider,
  TerraSphere
} from '@/components/terrafusion-design-system';
import { cn } from '@/lib/utils';

/**
 * TerraAgent Quantum Chat Interface
 *
 * Purpose: TerraFusion-themed React component replacing TerraAgent Flask chat interface
 * with quantum design system integration and government accessibility compliance.
 *
 * Features:
 * - Terra-cyan quantum theming
 * - Glass morphism design
 * - WCAG 2.1 AA accessibility
 * - Real-time chat functionality
 * - Government security compliance
 * - Seamless TerraAgent backend integration
 */

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  queryType?: string;
  metadata?: {
    county?: string;
    processingTime?: number;
    confidence?: number;
  };
}

interface QueryType {
  value: string;
  label: string;
  icon: string;
  quantumColor: string;
  description: string;
}

interface SystemStatus {
  terraAgent: {
    status: 'active' | 'inactive' | 'error';
    indicator: string;
    label: string;
    performance: string;
  };
  database: {
    status: 'active' | 'inactive' | 'error';
    indicator: string;
    label: string;
    connections: string;
  };
  aiSwarm: {
    status: 'active' | 'inactive' | 'error';
    indicator: string;
    label: string;
    quantum: string;
  };
}

export const TerraAgentQuantumChat: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  // Refs for accessibility and functionality
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch query types from UI bridge service
  const { data: queryTypes = [] } = useQuery<QueryType[]>({
    queryKey: ['queryTypes'],
    queryFn: async () => {
      const response = await fetch('/bridge/query-types');
      const data = await response.json();
      return data.queryTypes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch system status with real-time polling
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['systemStatus'],
    queryFn: async () => {
      const response = await fetch('/bridge/system-status');
      const data = await response.json();
      return data.systemHealth;
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000, // 25 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, queryType }: { message: string; queryType: string }) => {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TerraFusion-County-ID': 'system', // TODO: Get from auth context
        },
        body: JSON.stringify({
          message,
          query_type: queryType,
          quantum: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.response || data.answer,
        timestamp: new Date(),
        queryType: selectedQueryType,
        metadata: {
          processingTime: data.processing_time,
          confidence: data.confidence,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setIsLoading(false);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: 'Quantum algorithms are processing. Please retry your query.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Document ingestion mutation
  const ingestDocumentMutation = useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const response = await fetch('/bridge/ingest-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TerraFusion-County-ID': 'system',
        },
        body: JSON.stringify({ url, title }),
      });

      if (!response.ok) {
        throw new Error('Failed to ingest document');
      }

      return response.json();
    },
    onSuccess: () => {
      setDocumentUrl('');
      setDocumentTitle('');

      // Add success message
      const successMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: 'Document successfully added to knowledge base.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
    },
  });

  // Handle message send
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
      queryType: selectedQueryType,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Send to backend
    sendMessageMutation.mutate({
      message: currentMessage,
      queryType: selectedQueryType,
    });

    setCurrentMessage('');
  };

  // Handle document ingestion
  const handleIngestDocument = () => {
    if (!documentUrl.trim()) return;

    ingestDocumentMutation.mutate({
      url: documentUrl,
      title: documentTitle || undefined,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Focus input with '/' key
      if (e.key === '/' && document.activeElement !== messageInputRef.current) {
        e.preventDefault();
        messageInputRef.current?.focus();
      }

      // Send with Ctrl+Enter or Alt+S
      if ((e.ctrlKey && e.key === 'Enter') || (e.altKey && e.key === 's')) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentMessage, selectedQueryType, isLoading]);

  // Reset chat function
  const resetChat = () => {
    setMessages([]);
    setCurrentMessage('');
    setSelectedQueryType('general');
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
                   bg-terra-cyan text-terra-midnight px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <TerraSphere size="lg" variant="quantum" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-terra-cyan via-terra-blue to-terra-green
                           bg-clip-text text-transparent">
                TerraAgent
              </h1>
              <p className="text-terra-slate text-lg">
                AI-powered assistant for property assessment and CAMA data analysis
              </p>
            </div>
          </div>
          <Button
            variant="quantum"
            href="/dashboard"
            className="terra-quantum-lift"
          >
            <i className="fas fa-chart-line mr-2" />
            Dashboard
          </Button>
        </div>
      </header>

      <main id="main-content" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Query Type Selector */}
          <Card variant="glass" glow className="terra-glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-terra-cyan flex items-center">
                <i className="fas fa-filter mr-2" />
                Query Type
              </h3>
            </CardHeader>
            <CardBody>
              <Select
                value={selectedQueryType}
                onValueChange={setSelectedQueryType}
                aria-label="Select query type"
              >
                {queryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <i className={`${type.icon} text-${type.quantumColor}`} />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </CardBody>
          </Card>

          {/* Document Management */}
          <Card variant="glass" glow className="terra-glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-terra-cyan flex items-center">
                <i className="fas fa-file-upload mr-2" />
                Add Document
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                type="url"
                placeholder="Document URL"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                pattern="https?://.+\..+"
                title="Please enter a valid URL starting with http:// or https://"
                glow
              />
              <Input
                type="text"
                placeholder="Optional title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                maxLength={100}
                glow
              />
              <Button
                variant="primary"
                onClick={handleIngestDocument}
                disabled={!documentUrl.trim() || ingestDocumentMutation.isPending}
                className="w-full"
              >
                <i className="fas fa-plus-circle mr-2" />
                Add to Knowledge Base
              </Button>
              {ingestDocumentMutation.isPending && (
                <div className="text-sm text-terra-cyan animate-pulse">
                  Quantum algorithms processing document...
                </div>
              )}
            </CardBody>
          </Card>

          {/* System Status */}
          <Card variant="glass" glow className="terra-glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-terra-cyan flex items-center">
                <i className="fas fa-server mr-2" />
                System Status
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3" aria-live="polite" aria-atomic="true">
                {systemStatus && Object.entries(systemStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          status.status === 'active' ? 'bg-terra-green' : 'bg-red-500'
                        )}
                      />
                      <span className="text-sm text-terra-slate">{status.label}</span>
                    </div>
                    <Badge variant="quantum" size="sm">
                      {status.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-terra-slate">
                <i className="fas fa-info-circle mr-1" />
                Status updates every 30 seconds
              </div>
            </CardBody>
          </Card>

          {/* Help Panel */}
          <Card variant="glass" glow className="terra-glass">
            <CardHeader>
              <h3 className="text-lg font-semibold text-terra-cyan flex items-center">
                <i className="fas fa-question-circle mr-2" />
                Help
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 text-sm text-terra-slate">
                <h4 className="font-medium text-terra-cyan">Example Queries:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Show all parcels in precinct 12 with value &gt; $200K</li>
                  <li>• Calculate levy for parcel A12345 with homestead exemption</li>
                  <li>• What's the average sale price trend in zone 5?</li>
                  <li>• List the largest tables in the database</li>
                </ul>
                <Divider className="my-4" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetChat}
                  className="w-full"
                >
                  <i className="fas fa-redo mr-2" />
                  Reset Chat
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card variant="glass" glow className="terra-glass h-[600px] flex flex-col">
            <CardHeader>
              <h2 className="text-xl font-semibold text-terra-cyan flex items-center">
                <i className="fas fa-comments mr-2" />
                Chat
              </h2>
            </CardHeader>

            <CardBody className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-terra-midnight/30 rounded-lg"
                role="log"
                aria-live="polite"
                aria-label="Chat conversation history"
              >
                {messages.length === 0 && (
                  <div className="text-center text-terra-slate py-8">
                    <i className="fas fa-robot text-4xl text-terra-cyan mb-4 block" />
                    <p>Welcome to TerraAgent. Start a conversation!</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[80%] p-4 rounded-lg",
                      message.type === 'user'
                        ? "ml-auto bg-terra-cyan text-terra-midnight"
                        : message.type === 'system'
                        ? "bg-terra-blue/20 text-terra-cyan border border-terra-blue/40"
                        : "bg-terra-slate/20 text-terra-cyan"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.metadata && (
                      <div className="text-xs mt-2 opacity-70">
                        {message.metadata.processingTime && (
                          <span>Processing: {message.metadata.processingTime}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="bg-terra-slate/20 text-terra-cyan p-4 rounded-lg max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-terra-cyan rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-terra-cyan rounded-full animate-pulse animation-delay-200" />
                      <div className="w-2 h-2 bg-terra-cyan rounded-full animate-pulse animation-delay-400" />
                      <span className="ml-2">Quantum algorithms computing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="mt-4 flex space-x-2" role="form" aria-label="Message input form">
                <Input
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type your question here..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  minLength={2}
                  maxLength={500}
                  aria-label="Your question"
                  className="flex-1"
                  glow
                />
                <Button
                  variant="quantum"
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  title="Send message"
                  aria-label="Send message"
                  className="px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <i className="fas fa-paper-plane" />
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-terra-slate/20 text-center text-terra-slate">
        <div className="flex justify-between items-center">
          <p>TerraAgent © 2025 | Government. Transcended.</p>
          <details className="text-sm">
            <summary className="cursor-pointer text-terra-cyan hover:text-terra-blue">
              <i className="fas fa-universal-access mr-1" />
              Accessibility
            </summary>
            <div className="mt-2 p-4 bg-terra-slate/10 rounded-lg text-left">
              <h5 className="font-medium text-terra-cyan mb-2">Keyboard Shortcuts</h5>
              <ul className="space-y-1 text-xs">
                <li><kbd className="bg-terra-slate/30 px-1 rounded">/</kbd> - Focus the message input</li>
                <li><kbd className="bg-terra-slate/30 px-1 rounded">Enter</kbd> - Send message</li>
                <li><kbd className="bg-terra-slate/30 px-1 rounded">Ctrl</kbd>+<kbd className="bg-terra-slate/30 px-1 rounded">Enter</kbd> - Send message (alternative)</li>
                <li><kbd className="bg-terra-slate/30 px-1 rounded">Alt</kbd>+<kbd className="bg-terra-slate/30 px-1 rounded">S</kbd> - Send message (alternative)</li>
              </ul>
            </div>
          </details>
        </div>
      </footer>
    </div>
  );
};

export default TerraAgentQuantumChat;
