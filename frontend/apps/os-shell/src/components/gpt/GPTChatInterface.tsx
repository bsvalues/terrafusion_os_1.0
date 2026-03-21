// TerraFusionGPT Suite: Chat Interface Component
// Wave 2 canonical conversation surface using confirmed REST endpoints only.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, AlertCircle, Clock, DollarSign, Loader2, RefreshCw, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { GPTTraceDetails } from '@/components/gpt/GPTTraceDetails';
import {
  gptAPI,
  type GPTConfiguration,
  type GPTConversation,
  type GPTConversationTrace,
  type GPTMessage,
  type SendMessageRequest,
} from '@/services/gptAPI';

interface GPTChatInterfaceProps {
  gpt: GPTConfiguration;
  conversationId?: number;
  onConversationChange?: (conversation: GPTConversation) => void;
  onClose?: () => void;
}

/**
 * GPT Chat Interface - Core conversation component
 */
export const GPTChatInterface: React.FC<GPTChatInterfaceProps> = ({
  gpt,
  conversationId: initialConversationId,
  onConversationChange,
  onClose,
}) => {
  const [conversation, setConversation] = useState<GPTConversation | null>(null);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [conversationTrace, setConversationTrace] = useState<GPTConversationTrace | null>(null);
  const [expandedTraceMessageId, setExpandedTraceMessageId] = useState<number | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceLoadingMessageId, setTraceLoadingMessageId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isBusy = isInitializing || isSending || isRefreshing;

  const conversationNote = useMemo(
    () =>
      'Live in this slice: conversation create, load, history refresh, send, archive, delete, and manual trace fetch through the canonical GPT API. Streaming, typing indicators, live hub push, and live citations are not currently mapped by the backend.',
    [],
  );

  const resetTraceState = () => {
    setConversationTrace(null);
    setExpandedTraceMessageId(null);
    setTraceError(null);
    setTraceLoadingMessageId(null);
  };

  const getErrorMessage = (fallback: string, cause: unknown) => {
    if (typeof cause === 'object' && cause !== null) {
      const maybeError = cause as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      return (
        maybeError.response?.data?.error ||
        maybeError.response?.data?.message ||
        maybeError.message ||
        fallback
      );
    }
    return fallback;
  };

  const syncConversation = async (conversationId: number) => {
    const [nextConversation, nextMessages] = await Promise.all([
      gptAPI.getConversation(conversationId),
      gptAPI.getConversationHistory(conversationId),
    ]);

    setConversation(nextConversation);
    setMessages(nextMessages);
    setTotalCost(nextConversation.totalCost);
    setTotalTokens(nextConversation.totalTokensUsed);
    resetTraceState();
    return nextConversation;
  };

  useEffect(() => {
    let cancelled = false;

    const initializeConversation = async () => {
      setIsInitializing(true);
      setError(null);
      setInfoMessage(null);

      try {
        if (initialConversationId) {
          const existingConversation = await syncConversation(initialConversationId);
          if (!cancelled) {
            onConversationChange?.(existingConversation);
          }
        } else {
          const newConv = await gptAPI.createConversation({
            gptConfigId: gpt.id,
            title: `New conversation with ${gpt.displayName}`,
          });

          if (!cancelled) {
            setConversation(newConv);
            setMessages([]);
            setTotalCost(newConv.totalCost);
            setTotalTokens(newConv.totalTokensUsed);
            resetTraceState();
            onConversationChange?.(newConv);
          }
        }
      } catch (cause) {
        if (!cancelled) {
          setError(getErrorMessage('Failed to initialize conversation', cause));
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void initializeConversation();

    return () => {
      cancelled = true;
    };
  }, [gpt.id, initialConversationId, onConversationChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation || isBusy) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setError(null);
    setInfoMessage(null);

    const optimisticMessage: GPTMessage = {
      id: -Date.now(),
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const request: SendMessageRequest = {
        gptConfigId: gpt.id,
        message: userMessage,
      };

      const assistantMessage = await gptAPI.sendMessage(conversation.id, request);
      setMessages((prev) => [...prev, assistantMessage]);
      await syncConversation(conversation.id);
    } catch (cause) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
      setError(getErrorMessage('Failed to send message', cause));
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    if (!conversation || isBusy) return;

    setIsRefreshing(true);
    setError(null);

    try {
      await syncConversation(conversation.id);
      setInfoMessage('Conversation refreshed from the server.');
    } catch (cause) {
      setError(getErrorMessage('Failed to refresh conversation', cause));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTraceToggle = async (messageId: number) => {
    if (!conversation) return;

    if (expandedTraceMessageId === messageId && conversationTrace) {
      setExpandedTraceMessageId(null);
      setTraceError(null);
      return;
    }

    setExpandedTraceMessageId(messageId);
    setTraceError(null);

    if (conversationTrace?.conversationId === conversation.id) {
      return;
    }

    setTraceLoadingMessageId(messageId);

    try {
      const nextTrace = await gptAPI.getConversationTrace(conversation.id);
      setConversationTrace(nextTrace);
    } catch (cause) {
      setTraceError(getErrorMessage('Failed to load conversation trace', cause));
    } finally {
      setTraceLoadingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleArchive = async () => {
    if (!conversation) return;

    try {
      await gptAPI.archiveConversation(conversation.id);
      onClose?.();
    } catch (cause) {
      setError(getErrorMessage('Failed to archive conversation', cause));
    }
  };

  const handleDelete = async () => {
    if (!conversation) return;
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await gptAPI.deleteConversation(conversation.id);
      onClose?.();
    } catch (cause) {
      setError(getErrorMessage('Failed to delete conversation', cause));
    }
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(6)}`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const renderRagSummary = (message: GPTMessage) => {
    if (!message.ragDocumentsUsed) return null;

    try {
      const documents = JSON.parse(message.ragDocumentsUsed) as unknown[];
      return (
        <div className="mt-2 border-t border-gray-300 pt-2 text-xs opacity-70 dark:border-gray-600">
          <Badge variant="outline" className="text-xs">
            RAG: {documents.length} docs
          </Badge>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderMessage = (message: GPTMessage) => {
    const isUser = message.role === 'user';
    const traceMessage = conversationTrace?.messages.find((entry) => entry.id === message.id) ?? null;
    const traceExpanded = expandedTraceMessageId === message.id;
    const isTraceLoading = traceLoadingMessageId === message.id;

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-4 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {!isUser ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-gray-300 pt-2 text-xs opacity-70 dark:border-gray-600">
              {message.cost > 0 ? (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCost(message.cost)}
                </span>
              ) : null}
              {message.responseTime != null ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {message.responseTime}ms
                </span>
              ) : null}
              <span>{formatTokens(message.totalTokens)} tokens</span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                disabled={isBusy}
                onClick={() => void handleTraceToggle(message.id)}
              >
                {isTraceLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Loading trace...
                  </>
                ) : traceExpanded ? (
                  'Hide Trace & Sources'
                ) : (
                  'Trace & Sources'
                )}
              </Button>
            </div>
          ) : null}

          {renderRagSummary(message)}

          {!isUser && traceExpanded ? (
            <GPTTraceDetails
              traceMessage={traceMessage}
              traceLoaded={conversationTrace?.conversationId === conversation.id}
              traceError={traceError}
            />
          ) : null}
        </div>
      </div>
    );
  };

  if (isInitializing) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {gpt.iconUrl && (
                  <img src={gpt.iconUrl} alt={gpt.displayName} className="h-6 w-6 rounded" />
                )}
                {gpt.displayName}
              </CardTitle>
              <CardDescription className="mt-1">{gpt.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Conversation is unavailable.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {gpt.iconUrl && (
                <img src={gpt.iconUrl} alt={gpt.displayName} className="h-6 w-6 rounded" />
              )}
              {gpt.displayName}
            </CardTitle>
            <CardDescription className="mt-1">{gpt.description}</CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{gpt.modelProvider}</Badge>
              <Badge variant="outline">{gpt.modelName}</Badge>
              {gpt.enableRAG && <Badge variant="outline">RAG Enabled</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" aria-label="Refresh conversation" onClick={() => void handleRefresh()}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" aria-label="Archive conversation" onClick={() => void handleArchive()}>
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" aria-label="Delete conversation" onClick={() => void handleDelete()}>
              <Trash2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Total Cost: {formatCost(totalCost)}
          </span>
          <span>Tokens: {formatTokens(totalTokens)}</span>
          <span>Messages: {messages.length}</span>
        </div>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{conversationNote}</AlertDescription>
        </Alert>

        {infoMessage ? (
          <Alert className="mt-3">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        ) : null}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {messages.map(renderMessage)}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      <Separator />
      <CardContent className="p-4">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${gpt.displayName}...`}
            disabled={isBusy}
            className="flex-1"
          />
          <Button
            aria-label="Send message"
            onClick={() => void handleSendMessage()}
            disabled={!inputMessage.trim() || isBusy}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GPTChatInterface;
