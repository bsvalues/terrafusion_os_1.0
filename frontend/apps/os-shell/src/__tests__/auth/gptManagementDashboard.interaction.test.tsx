import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { GPTManagementDashboard } from '../../components/gpt/GPTManagementDashboard';

const {
  mockGetAvailableGPTs,
  mockCreateGPT,
  mockUpdateGPT,
  mockDeleteGPT,
  mockGetGPTStatistics,
  mockHubIsConnected,
  mockHubStart,
  mockUseSession,
} = vi.hoisted(() => ({
  mockGetAvailableGPTs: vi.fn(),
  mockCreateGPT: vi.fn(),
  mockUpdateGPT: vi.fn(),
  mockDeleteGPT: vi.fn(),
  mockGetGPTStatistics: vi.fn(),
  mockHubIsConnected: vi.fn(),
  mockHubStart: vi.fn(),
  mockUseSession: vi.fn(),
}));

vi.mock('@/services/gptAPI', () => ({
  gptAPI: {
    getAvailableGPTs: mockGetAvailableGPTs,
    createGPT: mockCreateGPT,
    updateGPT: mockUpdateGPT,
    deleteGPT: mockDeleteGPT,
    getGPTStatistics: mockGetGPTStatistics,
  },
}));

vi.mock('@/services/gptHub', () => ({
  gptHub: {
    isConnected: mockHubIsConnected,
    start: mockHubStart,
  },
}));

vi.mock('@/auth/useSession', () => ({
  useSession: mockUseSession,
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
    enableRAG: false,
    ragDatasetId: undefined,
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

describe('GPTManagementDashboard interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHubIsConnected.mockReturnValue(true);
    mockHubStart.mockResolvedValue(undefined);
    mockUseSession.mockReturnValue({ userId: 'u1' });
    mockGetAvailableGPTs.mockResolvedValue([
      makeGpt(),
      makeGpt({
        id: 2,
        name: 'county-compliance-guide',
        displayName: 'County Compliance Guide',
        createdByUserId: 'u2',
        category: 'Compliance',
      }),
    ]);
    mockCreateGPT.mockImplementation(async (payload) => makeGpt({ id: 3, ...payload }));
    mockUpdateGPT.mockImplementation(async (id, payload) => makeGpt({ id, ...payload }));
    mockDeleteGPT.mockResolvedValue(undefined);
    mockGetGPTStatistics.mockResolvedValue({
      gptConfigId: 1,
      gptName: 'County Valuation Helper',
      totalConversations: 8,
      totalMessages: 40,
      totalTokens: 1200,
      totalCost: 12.34,
      uniqueUsers: 4,
      averageRating: 4.5,
      ratingCount: 6,
      periodStart: '2026-03-01T00:00:00.000Z',
      periodEnd: '2026-03-18T00:00:00.000Z',
    });
  });

  it('renders session-split GPT lists and keeps chat explicitly deferred', async () => {
    render(<GPTManagementDashboard />);

    await screen.findByText('Created by Me');

    expect(screen.getByText('Installed (1)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chat queued for County Valuation Helper' })).toBeDisabled();
    expect(screen.getByText(/chat remains deferred until CP-W2-5/i)).toBeInTheDocument();
  });

  it('creates a GPT through the canonical management dialog', async () => {
    render(<GPTManagementDashboard />);

    await screen.findByText('Created by Me');
    fireEvent.click(screen.getByRole('button', { name: 'Create GPT' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('GPT name'), {
      target: { value: 'appeal-draft-assistant' },
    });
    fireEvent.change(within(dialog).getByLabelText('GPT display name'), {
      target: { value: 'Appeal Draft Assistant' },
    });
    fireEvent.change(within(dialog).getByLabelText('GPT system prompt'), {
      target: { value: 'Draft assessor appeal responses with county-safe language.' },
    });

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Create GPT' })[0]);

    await waitFor(() => {
      expect(mockCreateGPT).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'appeal-draft-assistant',
          displayName: 'Appeal Draft Assistant',
          modelProvider: 'OpenAI',
          modelName: 'gpt-4.1-mini',
          systemPrompt: 'Draft assessor appeal responses with county-safe language.',
          status: 'Active',
          version: '1.0',
        }),
      );
    });

    expect(await screen.findByText('GPT "Appeal Draft Assistant" created successfully')).toBeInTheDocument();
  });

  it('edits an existing GPT through the canonical update dialog without renaming name', async () => {
    render(<GPTManagementDashboard />);

    await screen.findByText('Created by Me');
    fireEvent.click(screen.getByRole('button', { name: 'Edit GPT County Valuation Helper' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('GPT name')).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('GPT display name'), {
      target: { value: 'County Valuation Helper Updated' },
    });
    fireEvent.change(within(dialog).getByLabelText('GPT description'), {
      target: { value: 'Updated management description.' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mockUpdateGPT).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'county-valuation-helper',
          displayName: 'County Valuation Helper Updated',
          description: 'Updated management description.',
        }),
      );
    });

    expect(await screen.findByText('GPT "County Valuation Helper Updated" updated successfully')).toBeInTheDocument();
  });

  it('loads GPT statistics from the canonical statistics endpoint', async () => {
    render(<GPTManagementDashboard />);

    await screen.findByText('Created by Me');
    fireEvent.click(screen.getByRole('button', { name: 'View statistics for County Valuation Helper' }));

    await waitFor(() => {
      expect(mockGetGPTStatistics).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('GPT Statistics: County Valuation Helper')).toBeInTheDocument();
    expect(screen.getByText('Unique Users')).toBeInTheDocument();
  });

  it('surfaces truthful load errors from the canonical list endpoint', async () => {
    mockGetAvailableGPTs.mockRejectedValueOnce(new Error('backend unavailable'));

    render(<GPTManagementDashboard />);

    expect(await screen.findByText('backend unavailable')).toBeInTheDocument();
  });
});
