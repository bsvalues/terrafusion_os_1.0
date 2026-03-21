import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GPTChatInterface } from '../../components/gpt/GPTChatInterface';

const {
  mockCreateConversation,
  mockGetConversation,
  mockGetConversationHistory,
  mockGetConversationTrace,
  mockSendMessage,
  mockArchiveConversation,
  mockDeleteConversation,
} = vi.hoisted(() => ({
  mockCreateConversation: vi.fn(),
  mockGetConversation: vi.fn(),
  mockGetConversationHistory: vi.fn(),
  mockGetConversationTrace: vi.fn(),
  mockSendMessage: vi.fn(),
  mockArchiveConversation: vi.fn(),
  mockDeleteConversation: vi.fn(),
}));

vi.mock('@/services/gptAPI', () => ({
  gptAPI: {
    createConversation: mockCreateConversation,
    getConversation: mockGetConversation,
    getConversationHistory: mockGetConversationHistory,
    getConversationTrace: mockGetConversationTrace,
    sendMessage: mockSendMessage,
    archiveConversation: mockArchiveConversation,
    deleteConversation: mockDeleteConversation,
  },
}));

function makeGpt(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'county-valuation-helper',
    displayName: 'County Valuation Helper',
    description: 'Assists assessors with county valuation review.',
    iconUrl: undefined,
    category: 'Assessment',
    isSystemGPT: false,
    isPublic: false,
    createdByUserId: 'u1',
    countyId: 33,
    modelProvider: 'OpenAI',
    modelName: 'gpt-4.1-mini',
    systemPrompt: 'Review county assessment records carefully.',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    enableRAG: true,
    ragDatasetId: 12,
    ragTopK: 5,
    ragScoreThreshold: 0.7,
    enableFunctions: false,
    functionsJson: undefined,
    requiredRole: 'assessor',
    allowedCounties: undefined,
    totalConversations: 8,
    totalMessages: 40,
    totalTokensUsed: 1200,
    totalCost: 12.34,
    averageRating: 4.5,
    ratingCount: 6,
    installCount: 3,
    isFeatured: false,
    price: 0,
    status: 'Active',
    version: '1.0',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
    createdBy: 'u1',
    updatedBy: 'u1',
    ...overrides,
  };
}

function makeConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 55,
    gptConfigurationId: 1,
    userId: 'u1',
    countyId: 33,
    title: 'New conversation with County Valuation Helper',
    totalMessages: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    duration: undefined,
    rating: undefined,
    feedback: undefined,
    status: 'Active',
    createdAt: '2026-03-18T12:00:00.000Z',
    updatedAt: '2026-03-18T12:00:00.000Z',
    lastMessageAt: undefined,
    ...overrides,
  };
}

function makeMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    conversationId: 55,
    role: 'assistant',
    content: 'Here is the county valuation summary.',
    promptTokens: 24,
    completionTokens: 46,
    totalTokens: 70,
    cost: 0.0123,
    modelUsed: 'gpt-4.1-mini',
    provider: 'OpenAI',
    functionName: undefined,
    functionArgs: undefined,
    functionResult: undefined,
    ragDocumentsUsed: '["doc-1","doc-2"]',
    ragScore: 0.88,
    responseTime: 1450,
    finishReason: 'stop',
    createdAt: '2026-03-18T12:01:00.000Z',
    ...overrides,
  };
}

function makeConversationTraceMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    role: 'assistant',
    content: 'Here is the county valuation summary.',
    createdAt: '2026-03-18T12:01:00.000Z',
    tokensUsed: 70,
    cost: 0.0123,
    ragUsed: true,
    ragDocuments: ['doc-1', 'doc-2'],
    ragScore: 0.88,
    ragChunkDetails: [
      {
        chunkId: 'chunk-1',
        documentTitle: 'Parcel Record 1234',
        sourceUrl: 'https://county.example/parcel/1234',
        textSnippet: 'Parcel 1234 assessment reflects the latest Benton County adjustments.',
        score: 0.91,
        chunkIndex: 3,
      },
    ],
    ...overrides,
  };
}

function makeConversationTrace(overrides: Record<string, unknown> = {}) {
  return {
    conversationId: 55,
    gptKey: 'county-valuation-helper',
    gptDisplayName: 'County Valuation Helper',
    title: 'New conversation with County Valuation Helper',
    messageCount: 2,
    totalTokensUsed: 70,
    totalCost: 0.0123,
    messages: [makeConversationTraceMessage()],
    createdAt: '2026-03-18T12:00:00.000Z',
    lastMessageAt: '2026-03-18T12:01:00.000Z',
    ...overrides,
  };
}

describe('GPTChatInterface interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('creates a conversation, sends a message through the canonical DTO, and refreshes manually', async () => {
    const gpt = makeGpt();
    const createdConversation = makeConversation();
    const syncedConversation = makeConversation({ totalMessages: 2, totalTokensUsed: 70, totalCost: 0.0123 });
    const userMessage = makeMessage({
      id: 101,
      role: 'user',
      content: 'Summarize Benton County valuation shifts.',
      totalTokens: 12,
      cost: 0,
      ragDocumentsUsed: undefined,
      responseTime: undefined,
    });
    const assistantMessage = makeMessage();

    let history = [userMessage, assistantMessage];

    mockCreateConversation.mockResolvedValue(createdConversation);
    mockSendMessage.mockResolvedValue(assistantMessage);
    mockGetConversation.mockResolvedValue(syncedConversation);
    mockGetConversationHistory.mockImplementation(async () => history);
    mockGetConversationTrace.mockResolvedValue(makeConversationTrace());

    const onConversationChange = vi.fn();
    render(<GPTChatInterface gpt={gpt} onConversationChange={onConversationChange} />);

    expect(await screen.findByText('County Valuation Helper')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockCreateConversation).toHaveBeenCalledWith({
        gptConfigId: 1,
        title: 'New conversation with County Valuation Helper',
      });
      expect(onConversationChange).toHaveBeenCalledWith(createdConversation);
    });

    expect(
      screen.getByText(/manual trace fetch through the canonical GPT API/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Message County Valuation Helper...'), {
      target: { value: 'Summarize Benton County valuation shifts.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Summarize Benton County valuation shifts.')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(55, {
        gptConfigId: 1,
        message: 'Summarize Benton County valuation shifts.',
      });
    });

    expect(await screen.findByText('Here is the county valuation summary.')).toBeInTheDocument();
    expect(screen.getByText('RAG: 2 docs')).toBeInTheDocument();

    const traceButton = await screen.findByRole('button', { name: 'Trace & Sources' });

    await waitFor(() => {
      expect(traceButton).toBeEnabled();
    });

    fireEvent.click(traceButton);

    await waitFor(() => {
      expect(mockGetConversationTrace).toHaveBeenCalledWith(55);
    });

    expect(await screen.findByText('Source documents')).toBeInTheDocument();
    expect(screen.getByText('Parcel Record 1234')).toBeInTheDocument();
    expect(screen.getByText('https://county.example/parcel/1234')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh conversation' }));

    await waitFor(() => {
      expect(mockGetConversation).toHaveBeenCalledWith(55);
      expect(mockGetConversationHistory).toHaveBeenCalledWith(55);
    });
  });

  it('loads an existing conversation and history through confirmed endpoints', async () => {
    const gpt = makeGpt();
    const existingConversation = makeConversation({ id: 77, totalMessages: 2, totalTokensUsed: 88, totalCost: 0.015 });
    const existingHistory = [
      makeMessage({ id: 201, conversationId: 77, role: 'user', content: 'What changed this week?', totalTokens: 11, cost: 0, ragDocumentsUsed: undefined, responseTime: undefined }),
      makeMessage({ id: 202, conversationId: 77, content: 'County valuation deltas stayed within expected thresholds.', conversationId: 77 }),
    ];

    mockGetConversation.mockResolvedValue(existingConversation);
    mockGetConversationHistory.mockResolvedValue(existingHistory);

    render(<GPTChatInterface gpt={gpt} conversationId={77} />);

    expect(await screen.findByText('What changed this week?')).toBeInTheDocument();
    expect(await screen.findByText('County valuation deltas stayed within expected thresholds.')).toBeInTheDocument();
    expect(mockGetConversation).toHaveBeenCalledWith(77);
    expect(mockGetConversationHistory).toHaveBeenCalledWith(77);
    expect(screen.getByText('Tokens: 88')).toBeInTheDocument();
  });

  it('labels empty trace states honestly when a response has no source details', async () => {
    const gpt = makeGpt();
    const existingConversation = makeConversation({ id: 77, totalMessages: 2 });
    const existingHistory = [
      makeMessage({ id: 301, conversationId: 77, role: 'user', content: 'Show trace status.', totalTokens: 8, cost: 0, ragDocumentsUsed: undefined, responseTime: undefined }),
      makeMessage({ id: 302, conversationId: 77, content: 'No supporting documents were returned for this answer.', conversationId: 77, ragDocumentsUsed: undefined }),
    ];

    mockGetConversation.mockResolvedValue(existingConversation);
    mockGetConversationHistory.mockResolvedValue(existingHistory);
    mockGetConversationTrace.mockResolvedValue(
      makeConversationTrace({
        conversationId: 77,
        messages: [
          makeConversationTraceMessage({
            id: 302,
            content: 'No supporting documents were returned for this answer.',
            ragDocuments: [],
            ragChunkDetails: [],
          }),
        ],
      }),
    );

    render(<GPTChatInterface gpt={gpt} conversationId={77} />);

    expect(await screen.findByText('No supporting documents were returned for this answer.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trace & Sources' }));

    expect(await screen.findByText('Trace is present, but this response did not return source or chunk details.')).toBeInTheDocument();
  });

  it('surfaces initialization errors truthfully', async () => {
    const gpt = makeGpt();
    mockCreateConversation.mockRejectedValueOnce(new Error('conversation bootstrap failed'));

    render(<GPTChatInterface gpt={gpt} />);

    expect(await screen.findByText('conversation bootstrap failed')).toBeInTheDocument();
  });
});