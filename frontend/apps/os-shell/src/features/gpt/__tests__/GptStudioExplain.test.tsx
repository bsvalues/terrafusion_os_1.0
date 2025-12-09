/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GPT STUDIO EXPLAIN BUTTON TESTS
 * Phase 13.4: Lock ExplainGPT UI affordance with RTL tests
 * Constellation: Sentinel (testing) + Radiant (UX) + Arc (GPT)
 * ═══════════════════════════════════════════════════════════════
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the API module BEFORE importing the component
jest.mock('../../../api/explainApi', () => ({
  explainContext: jest.fn(),
}));

// Mock the GPT client to avoid network calls
jest.mock('../../../lib/api/gptClient', () => ({
  getSystemGpts: jest.fn().mockResolvedValue([
    {
      key: 'PropertyAssessmentGPT',
      name: 'Property Assessment GPT',
      description: 'Test GPT',
      systemPrompt: 'Test prompt',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      enabled: true,
    },
  ]),
  createConversation: jest.fn().mockResolvedValue({
    id: 'test-conv-123',
    gptKey: 'PropertyAssessmentGPT',
    messages: [],
  }),
  getMessages: jest.fn().mockResolvedValue([]),
  getRagHealth: jest.fn().mockResolvedValue({
    indexed: true,
    embeddingCount: 100,
    documentCount: 5,
    healthy: true,
  }),
  sendMessage: jest.fn(),
  indexRagDataset: jest.fn(),
}));

import { explainContext } from '../../../api/explainApi';
import { GptStudioView } from '../GptStudioView';

const mockExplainContext = explainContext as jest.MockedFunction<typeof explainContext>;

describe('GptStudioView Explain Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // EXPLAIN BUTTON VISIBILITY
  // ═══════════════════════════════════════════════════════════════

  describe('Explain button visibility', () => {
    it('renders explain button when GPT is selected and conversation exists', async () => {
      const user = userEvent.setup();

      render(<GptStudioView />);

      // Wait for GPTs to load and select one
      await waitFor(() => {
        expect(screen.getByText('Property Assessment GPT')).toBeInTheDocument();
      });

      // Click to select GPT (this creates conversation)
      await user.click(screen.getByText('Property Assessment GPT'));

      // Wait for conversation to be created
      await waitFor(() => {
        expect(screen.getByText(/Conversation test-conv/)).toBeInTheDocument();
      });

      // Now the explain button should be visible
      expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EXPLAIN FLOW - HAPPY PATH
  // ═══════════════════════════════════════════════════════════════

  describe('Explain flow - happy path', () => {
    it('shows explanation when explain button is clicked', async () => {
      const user = userEvent.setup();

      // Setup mock response
      mockExplainContext.mockResolvedValueOnce({
        explanation: 'GPT Studio is the AI workbench for TerraFusion OS.',
        summary: 'Interactive AI assistant interface',
        keyPoints: ['Chat with AI models', 'RAG-enhanced responses', 'Government-focused'],
        relatedActions: [],
        contextType: 'View',
        processingTimeMs: 50,
        confidence: 0.95,
      });

      render(<GptStudioView />);

      // Wait for GPTs to load
      await waitFor(() => {
        expect(screen.getByText('Property Assessment GPT')).toBeInTheDocument();
      });

      // Select GPT
      await user.click(screen.getByText('Property Assessment GPT'));

      // Wait for conversation
      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      // Click explain button
      await user.click(screen.getByTitle('Explain this view'));

      // Should show loading state first
      await waitFor(() => {
        expect(mockExplainContext).toHaveBeenCalledWith(
          expect.objectContaining({
            contextType: 'View',
            contextId: 'GPTStudio',
          })
        );
      });

      // Should show explanation
      await waitFor(() => {
        expect(
          screen.getByText('GPT Studio is the AI workbench for TerraFusion OS.')
        ).toBeInTheDocument();
      });
    });

    it('shows key points in explanation', async () => {
      const user = userEvent.setup();

      mockExplainContext.mockResolvedValueOnce({
        explanation: 'Test explanation',
        summary: 'Test summary',
        keyPoints: ['First key point', 'Second key point'],
        relatedActions: [],
        contextType: 'View',
        processingTimeMs: 25,
        confidence: 0.9,
      });

      render(<GptStudioView />);

      await waitFor(() => {
        expect(screen.getByText('Property Assessment GPT')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Property Assessment GPT'));

      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Explain this view'));

      await waitFor(() => {
        expect(screen.getByText('First key point')).toBeInTheDocument();
        expect(screen.getByText('Second key point')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EXPLAIN FLOW - ERROR PATH
  // ═══════════════════════════════════════════════════════════════

  describe('Explain flow - error path', () => {
    it('shows error message when explain fails', async () => {
      const user = userEvent.setup();

      mockExplainContext.mockRejectedValueOnce(new Error('API timeout'));

      render(<GptStudioView />);

      await waitFor(() => {
        expect(screen.getByText('Property Assessment GPT')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Property Assessment GPT'));

      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Explain this view'));

      await waitFor(() => {
        expect(screen.getByText('Unable to explain')).toBeInTheDocument();
        expect(screen.getByText('API timeout')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CLOSE INTERACTION
  // ═══════════════════════════════════════════════════════════════

  describe('close interaction', () => {
    it('closes explanation panel when close is clicked', async () => {
      const user = userEvent.setup();

      mockExplainContext.mockResolvedValueOnce({
        explanation: 'Test explanation',
        summary: 'Test',
        keyPoints: [],
        relatedActions: [],
        contextType: 'View',
        processingTimeMs: 10,
        confidence: 0.9,
      });

      render(<GptStudioView />);

      await waitFor(() => {
        expect(screen.getByText('Property Assessment GPT')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Property Assessment GPT'));

      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Explain this view'));

      await waitFor(() => {
        expect(screen.getByText('Test explanation')).toBeInTheDocument();
      });

      // Click close
      await user.click(screen.getByLabelText('Close explanation'));

      // Explanation should be gone
      await waitFor(() => {
        expect(screen.queryByText('Test explanation')).not.toBeInTheDocument();
      });
    });
  });
});
