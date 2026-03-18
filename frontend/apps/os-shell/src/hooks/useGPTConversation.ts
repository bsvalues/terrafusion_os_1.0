import { useState, useEffect, useCallback } from 'react';
import { useAuthContext, toOsActor } from '@/auth/useAuthContext';
import { gptAPI } from '@/services/gptAPI';
import type { GPTConversation, GPTMessage } from '@/services/gptAPI';
import { resolveGptActor } from '@/services/gptActorBridge';
import type { GptActorError, GptActorResult } from '@/services/gptActorBridge';

export function useGPTConversation(gptConfigId: number): {
  conversation: GPTConversation | null;
  messages: GPTMessage[];
  actorError: GptActorError | null;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<GptActorResult<GPTMessage>>;
  createConversation: () => Promise<GptActorResult<GPTConversation>>;
} {
  const auth = useAuthContext();
  const actor = toOsActor(auth);
  const actorResult = resolveGptActor(actor);

  const [conversation, setConversation] = useState<GPTConversation | null>(null);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const actorError: GptActorError | null = actorResult.ok ? null : actorResult.error;

  const createConversation = useCallback(async (): Promise<GptActorResult<GPTConversation>> => {
    if (!actorResult.ok) return { ok: false, error: actorResult.error };
    try {
      setIsLoading(true);
      const conv = await gptAPI.createConversation({ gptConfigId, title: 'New Conversation' });
      setConversation(conv);
      return { ok: true, data: conv };
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status: number; data?: { message?: string } } };
      if (e?.code === 'ECONNABORTED') return { ok: false, error: { kind: 'timeout' } };
      return {
        ok: false,
        error: {
          kind: 'api_error',
          status: e?.response?.status ?? 0,
          message: e?.response?.data?.message ?? 'Unknown error',
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, [actorResult, gptConfigId]);

  const sendMessage = useCallback(async (text: string): Promise<GptActorResult<GPTMessage>> => {
    if (!actorResult.ok) return { ok: false, error: actorResult.error };
    if (!conversation) {
      return { ok: false, error: { kind: 'api_error', status: 0, message: 'No active conversation' } };
    }
    try {
      setIsLoading(true);
      const msg = await gptAPI.sendMessage(conversation.id, { gptConfigId, message: text });
      setMessages(prev => [...prev, msg]);
      return { ok: true, data: msg };
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status: number; data?: { message?: string } } };
      if (e?.code === 'ECONNABORTED') return { ok: false, error: { kind: 'timeout' } };
      return {
        ok: false,
        error: {
          kind: 'api_error',
          status: e?.response?.status ?? 0,
          message: e?.response?.data?.message ?? 'Unknown error',
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, [actorResult, conversation, gptConfigId]);

  useEffect(() => {
    setConversation(null);
    setMessages([]);
  }, [gptConfigId]);

  return { conversation, messages, actorError, isLoading, sendMessage, createConversation };
}
