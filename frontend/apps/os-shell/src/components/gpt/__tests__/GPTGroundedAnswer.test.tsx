import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GPTChatInterface } from '../GPTChatInterface';
import { GptQuickChat } from '../GptQuickChat';
import {
  gptAPI,
  type GPTConfiguration,
  type GPTConversation,
  type GPTMessage,
} from '@/services/gptAPI';

vi.mock('@/services/gptAPI', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/gptAPI')>()),
  gptAPI: {
    getConversation: vi.fn(),
    getConversationHistory: vi.fn(),
    createConversation: vi.fn(),
    sendMessage: vi.fn(),
    getConversationTrace: vi.fn(),
    archiveConversation: vi.fn(),
    deleteConversation: vi.fn(),
    getAvailableGPTs: vi.fn(),
    getSystemGPTs: vi.fn(),
  },
}));

const gpt: GPTConfiguration = {
  id: 1,
  countyId: 42,
  name: 'Synthetic GPT',
  displayName: 'Synthetic GPT',
  isSystemGPT: true,
  isPublic: false,
  modelProvider: 'configured-provider',
  modelName: 'configured-model',
  systemPrompt: '',
  temperature: 0,
  maxTokens: 2000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  enableRAG: true,
  ragDatasetId: 7,
  ragTopK: 2,
  ragScoreThreshold: 0.7,
  enableFunctions: false,
  totalConversations: 1,
  totalMessages: 2,
  totalTokensUsed: 0,
  totalCost: 0,
  ratingCount: 0,
  installCount: 0,
  isFeatured: false,
  price: 0,
  status: 'Active',
  version: '1.0',
  createdAt: '2026-09-07T00:00:00Z',
  updatedAt: '2026-09-07T00:00:00Z',
  createdBy: 'test',
  updatedBy: 'test',
};
const conversation: GPTConversation = {
  id: 10,
  gptConfigurationId: 1,
  userId: 'test-user',
  countyId: 42,
  totalMessages: 2,
  totalTokensUsed: 0,
  totalCost: 0,
  status: 'Active',
  createdAt: '2026-09-07T00:00:00Z',
  updatedAt: '2026-09-07T00:00:00Z',
};
function message(status = 'ANSWERED'): GPTMessage {
  const answered = status === 'ANSWERED';
  const result = {
    schemaVersion: '1.0.0',
    countyId: '42',
    datasetKey: 'rag-dataset:7',
    traceId: 'trace-real-response',
    status,
    citations: answered ? [{ sourceId: 'rag-document:11', chunkId: 'rag-chunk:29' }] : [],
    ...(answered
      ? { answer: 'Synthetic supported answer', provider: 'ollama', model: 'actual-response-model' }
      : {}),
    ...(status === 'PROVIDER_UNAVAILABLE' ? { failureCode: 'UNREACHABLE' } : {}),
    ...(status === 'DENIED' ? { failureCode: 'DATASET_NOT_ALLOWED' } : {}),
  };
  return {
    id: 2,
    conversationId: 10,
    role: 'assistant',
    content: answered ? 'Synthetic supported answer' : '',
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cost: 0,
    createdAt: '2026-09-07T00:00:00Z',
    finishReason: status,
    functionName: 'gpt.grounded-answer@1.0.0',
    functionResult: JSON.stringify({
      context: {
        request: {
          schemaVersion: '1.0.0',
          countyId: '42',
          datasetKey: 'rag-dataset:7',
          queryText: 'Synthetic question',
          topK: 2,
          scoreThreshold: 0.7,
          traceId: 'trace-real-response',
        },
        result: {
          schemaVersion: '1.0.0',
          countyId: '42',
          datasetKey: 'rag-dataset:7',
          traceId: 'trace-real-response',
          status: answered || status === 'PROVIDER_UNAVAILABLE' ? 'GROUNDED' : status,
          citations:
            answered || status === 'PROVIDER_UNAVAILABLE'
              ? [
                  {
                    sourceId: 'rag-document:11',
                    chunkId: 'rag-chunk:29',
                    chunkIndex: 0,
                    score: 0.9,
                    excerpt: 'Admitted synthetic excerpt',
                  },
                ]
              : [],
          ...(status === 'DENIED' ? { denialCode: 'DATASET_NOT_ALLOWED' } : {}),
        },
      },
      result,
    }),
  };
}

describe('canonical grounded answer presentation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(gptAPI.getConversation).mockResolvedValue(conversation);
    vi.mocked(gptAPI.getConversationHistory).mockResolvedValue([message()]);
    vi.mocked(gptAPI.createConversation).mockResolvedValue({
      ...conversation,
      id: 11,
      totalMessages: 0,
    });
    vi.mocked(gptAPI.getAvailableGPTs).mockResolvedValue([gpt]);
    vi.mocked(gptAPI.getSystemGPTs).mockResolvedValue([gpt]);
  });
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, '', '/');
  });

  it('shows actual response model, CID and supplied citation source/chunk/excerpt after reload', async () => {
    render(<GPTChatInterface gpt={gpt} conversationId={10} />);
    expect(await screen.findByText('Synthetic supported answer')).toBeInTheDocument();
    expect(screen.getByText('actual-response-model')).toBeInTheDocument();
    expect(screen.getByText(/trace-real-response/)).toBeInTheDocument();
    expect(screen.getByText(/rag-document:11/)).toBeInTheDocument();
    expect(screen.getByText(/rag-chunk:29/)).toBeInTheDocument();
    expect(screen.getByText('Admitted synthetic excerpt')).toBeInTheDocument();
    expect(screen.queryByText(/^0 tokens$/)).not.toBeInTheDocument();
    expect(screen.getByText(/usage not returned/i)).toBeInTheDocument();
  });

  for (const [status, label] of [
    ['NO_RELEVANT_CONTEXT', /no relevant context/i],
    ['DENIED', /access denied/i],
    ['PROVIDER_UNAVAILABLE', /provider unavailable/i],
  ] as const) {
    it(`shows ${status} without substituting model content`, async () => {
      vi.mocked(gptAPI.getConversationHistory).mockResolvedValue([message(status)]);
      render(<GPTChatInterface gpt={gpt} conversationId={10} />);
      expect(await screen.findByText(label)).toBeInTheDocument();
      expect(screen.queryByText('Synthetic supported answer')).not.toBeInTheDocument();
      expect(screen.queryByText('actual-response-model')).not.toBeInTheDocument();
      expect(screen.getByText(/trace-real-response/)).toBeInTheDocument();
    });
  }

  it('clears previous county and dataset content on a scope switch', async () => {
    const view = render(<GPTChatInterface gpt={gpt} conversationId={10} />);
    await screen.findByText('Synthetic supported answer');
    vi.mocked(gptAPI.getConversation).mockRejectedValue(new Error('Conversation scope denied'));
    vi.mocked(gptAPI.getConversationHistory).mockRejectedValue(
      new Error('Conversation scope denied')
    );
    view.rerender(
      <GPTChatInterface gpt={{ ...gpt, countyId: 99, ragDatasetId: 8 }} conversationId={10} />
    );
    await screen.findByText('Conversation scope denied');
    await waitFor(() =>
      expect(screen.queryByText('Synthetic supported answer')).not.toBeInTheDocument()
    );
    expect(screen.queryByText(/rag-chunk:29/)).not.toBeInTheDocument();
  });

  it('reopens the persisted conversation from the actual quick-chat route without creating another', async () => {
    window.history.replaceState(null, '', '/gpt?view=studio&gptId=1&conversationId=10');
    render(<GptQuickChat />);
    expect(await screen.findByText('Synthetic supported answer')).toBeInTheDocument();
    expect(gptAPI.getAvailableGPTs).toHaveBeenCalled();
    expect(gptAPI.getConversation).toHaveBeenCalledWith(10);
    expect(gptAPI.createConversation).not.toHaveBeenCalled();
  });

  it('shows the server CID on runtime-unavailable HTTP failure without inventing an answer', async () => {
    vi.mocked(gptAPI.getConversationHistory).mockResolvedValue([]);
    vi.mocked(gptAPI.sendMessage).mockRejectedValue({
      response: {
        data: { error: 'Grounded answer unavailable or rejected.', traceId: 'trace-unavailable' },
      },
    });
    render(<GPTChatInterface gpt={gpt} conversationId={10} />);
    fireEvent.change(await screen.findByPlaceholderText('Message Synthetic GPT...'), {
      target: { value: 'Synthetic question' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText(/trace-unavailable/)).toBeInTheDocument();
    expect(screen.queryByTestId('gpt-grounded-answer')).not.toBeInTheDocument();
  });
});
