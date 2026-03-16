/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GPT STUDIO EXPLAIN BUTTON TESTS
 * Phase 13.4: Lock ExplainGPT UI affordance with RTL tests
 * Constellation: Sentinel (testing) + Radiant (UX) + Arc (GPT)
 * ═══════════════════════════════════════════════════════════════
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock the API module BEFORE importing the component
vi.mock('../../../api/explainApi', () => ({
  explainContext: vi.fn(),
}));

// Mock PropertyAssessmentFlows to avoid undefined errors
vi.mock('../components/PropertyAssessmentFlows', () => ({
  PropertyAssessmentFlows: () => <div data-testid='mock-flows'>Mock Flows</div>,
}));

// Mock the GPT client to avoid network calls and import.meta.env issues
vi.mock('../../../api/gptClient', () => ({
  getSystemGpts: vi.fn().mockResolvedValue([
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
  createConversation: vi.fn().mockResolvedValue({
    id: 'test-conv-123',
    gptKey: 'PropertyAssessmentGPT',
    messages: [],
  }),
  getMessages: vi.fn().mockResolvedValue([]),
  getRagHealth: vi.fn().mockResolvedValue({
    indexed: true,
    embeddingCount: 100,
    documentCount: 5,
    healthy: true,
  }),
  sendMessage: vi.fn(),
  indexRagDataset: vi.fn(),
}));

import { explainContext } from '../../../api/explainApi';
import { GptStudioView } from '../GptStudioView';

const mockExplainContext = explainContext as vi.MockedFunction<typeof explainContext>;

describe('GptStudioView Explain Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // EXPLAIN BUTTON VISIBILITY
  // ═══════════════════════════════════════════════════════════════

  describe('Explain button visibility', () => {
    it('renders explain button when GPT is selected and conversation exists', async () => {
      render(<GptStudioView />);

      // Wait for GPTs to load (text appears multiple times in UI)
      await waitFor(() => {
        expect(screen.getAllByText('Property Assessment GPT').length).toBeGreaterThan(0);
      });

      // Wait for conversation indicator to appear (text may be truncated in UI)
      await waitFor(() => {
        // The conversation text may be split across elements with truncation,
        // so we check for partial text or the explain button appearing
        expect(screen.getByText(/Conversation/)).toBeInTheDocument();
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

      // Wait for GPTs to load (text appears multiple times in UI)
      await waitFor(() => {
        expect(screen.getAllByText('Property Assessment GPT').length).toBeGreaterThan(0);
      });

      // Wait for conversation (auto-selected)
      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      // Click explain button
      fireEvent.click(screen.getByTitle('Explain this view'));

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
        expect(screen.getAllByText('Property Assessment GPT').length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Explain this view'));

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
      mockExplainContext.mockRejectedValueOnce(new Error('API timeout'));

      render(<GptStudioView />);

      await waitFor(() => {
        expect(screen.getAllByText('Property Assessment GPT').length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Explain this view'));

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
        expect(screen.getAllByText('Property Assessment GPT').length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(screen.getByTitle('Explain this view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Explain this view'));

      await waitFor(() => {
        expect(screen.getByText('Test explanation')).toBeInTheDocument();
      });

      // Click close
      fireEvent.click(screen.getByLabelText('Close explanation'));

      // Explanation should be gone
      await waitFor(() => {
        expect(screen.queryByText('Test explanation')).not.toBeInTheDocument();
      });
    });
  });
});
