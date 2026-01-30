// TerraFusionGPT Suite: Chat Interface Component
// Elite Government OS Engineering - Core User Experience

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, AlertCircle, DollarSign, Clock, Archive, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  gptAPI,
  GPTConfiguration,
  GPTConversation,
  GPTMessage,
  SendMessageRequest
} from '@/services/gptAPI';
import { gptHub, MessageChunk, TypingIndicator, CostUpdate } from '@/services/gptHub';

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
  // State
  const [conversation, setConversation] = useState<GPTConversation | null>(null);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Initialize conversation
   */
  useEffect(() => {
    const initConversation = async () => {
      try {
        if (initialConversationId) {
          // Load existing conversation
          const conv = await gptAPI.getConversation(initialConversationId);
          setConversation(conv);

          // Load message history
          const history = await gptAPI.getConversationHistory(initialConversationId);
          setMessages(history);

          // Update totals
          setTotalCost(conv.totalCost);
          setTotalTokens(conv.totalTokensUsed);
        } else {
          // Create new conversation
          const newConv = await gptAPI.createConversation({
            gptConfigId: gpt.id,
            title: `New conversation with ${gpt.displayName}`,
          });
          setConversation(newConv);
          onConversationChange?.(newConv);
        }
      } catch (err) {
        setError('Failed to initialize conversation');
        console.error(err);
      }
    };

    initConversation();
  }, [gpt.id, initialConversationId, onConversationChange]);

  /**
   * Connect to SignalR hub
   */
  useEffect(() => {
    if (!conversation) return;

    const connectHub = async () => {
      try {
        // Start connection if not connected
        if (!gptHub.isConnected()) {
          await gptHub.start({
            onMessageChunk: handleMessageChunk,
            onMessage: handleNewMessage,
            onTypingIndicator: handleTypingIndicator,
            onCostUpdate: handleCostUpdate,
            onError: (error) => console.error('GPT Hub error:', error),
          });
        }

        // Subscribe to conversation
        await gptHub.subscribeToConversation(conversation.id);
      } catch (err) {
        console.error('Failed to connect to GPT Hub:', err);
      }
    };

    connectHub();

    return () => {
      // Cleanup: unsubscribe from conversation
      if (conversation && gptHub.isConnected()) {
        gptHub.unsubscribeFromConversation(conversation.id).catch(console.error);
      }
    };
  }, [conversation]);

  /**
   * Auto-scroll to bottom when messages change
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  /**
   * Handle message chunk (streaming)
   */
  const handleMessageChunk = useCallback((chunk: MessageChunk) => {
    if (chunk.conversationId === conversation?.id) {
      setStreamingMessage((prev) => prev + chunk.chunk);
    }
  }, [conversation?.id]);

  /**
   * Handle new complete message
   */
  const handleNewMessage = useCallback((data: { conversationId: number; message: GPTMessage }) => {
    if (data.conversationId === conversation?.id) {
      setMessages((prev) => [...prev, data.message]);
      setStreamingMessage('');
      setIsLoading(false);
    }
  }, [conversation?.id]);

  /**
   * Handle typing indicator
   */
  const handleTypingIndicator = useCallback((indicator: TypingIndicator) => {
    if (indicator.conversationId === conversation?.id) {
      setIsTyping(indicator.isTyping);
    }
  }, [conversation?.id]);

  /**
   * Handle cost update
   */
  const handleCostUpdate = useCallback((update: CostUpdate) => {
    if (update.conversationId === conversation?.id) {
      setTotalCost(update.totalCost);
      setTotalTokens(update.totalTokens);
    }
  }, [conversation?.id]);

  /**
   * Send message
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to UI immediately
      const tempUserMessage: GPTMessage = {
        id: Date.now(),
        conversationId: conversation.id,
        role: 'user',
        content: userMessage,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Send message to backend
      const request: SendMessageRequest = {
        gptConfigId: gpt.id,
        message: userMessage,
      };

      const response = await gptAPI.sendMessage(conversation.id, request);

      // Replace temp message with actual response
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id).concat(response));
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
      setIsLoading(false);
      console.error(err);
    }
  };

  /**
   * Handle input change with typing indicator
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (conversation && gptHub.isConnected()) {
      gptHub.sendTypingIndicator(conversation.id).catch(console.error);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 1000);
  };

  /**
   * Handle key press
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Archive conversation
   */
  const handleArchive = async () => {
    if (!conversation) return;

    try {
      await gptAPI.archiveConversation(conversation.id);
      onClose?.();
    } catch (err) {
      console.error('Failed to archive conversation:', err);
    }
  };

  /**
   * Delete conversation
   */
  const handleDelete = async () => {
    if (!conversation) return;
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await gptAPI.deleteConversation(conversation.id);
      onClose?.();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  /**
   * Format cost display
   */
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(6)}`;
  };

  /**
   * Format tokens display
   */
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  /**
   * Render message
   */
  const renderMessage = (message: GPTMessage) => {
    const isUser = message.role === 'user';

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

          {!isUser && message.cost > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 flex items-center gap-3 text-xs opacity-70">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCost(message.cost)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {message.responseTime}ms
              </span>
              <span>{formatTokens(message.totalTokens)} tokens</span>
            </div>
          )}

          {message.ragDocumentsUsed && (
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-xs opacity-70">
              <Badge variant="outline" className="text-xs">
                RAG: {JSON.parse(message.ragDocumentsUsed).length} docs
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
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
            <Button variant="ghost" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Cost/Token Display */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Total Cost: {formatCost(totalCost)}
          </span>
          <span>Tokens: {formatTokens(totalTokens)}</span>
          <span>Messages: {messages.length}</span>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {messages.map(renderMessage)}

          {/* Streaming message */}
          {streamingMessage && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[70%] rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
                <div className="whitespace-pre-wrap break-words">{streamingMessage}</div>
                <Loader2 className="h-4 w-4 animate-spin mt-2 text-blue-600" />
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && !streamingMessage && (
            <div className="flex justify-start mb-4">
              <div className="rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <Separator />
      <CardContent className="p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${gpt.displayName}...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
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
