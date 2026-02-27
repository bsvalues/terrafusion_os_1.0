// frontend/apps/os-shell/src/features/gpt/__tests__/GptStudioView.test.tsx
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock all API modules to avoid import.meta.env issues
vi.mock('../../../api/explainApi', () => ({
  explainContext: vi.fn(),
}));

// Mock PropertyAssessmentFlows to avoid undefined errors
vi.mock('../components/PropertyAssessmentFlows', () => ({
  PropertyAssessmentFlows: () => <div data-testid='mock-flows'>Mock Flows</div>,
}));

vi.mock('../../../api/gptClient', () => ({
  getSystemGpts: vi.fn(),
  createConversation: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  getRagHealth: vi.fn().mockResolvedValue({ healthy: true }),
  indexRagDataset: vi.fn(),
}));

import * as gptClient from '../../../api/gptClient';
import { GptStudioView } from '../GptStudioView';

const mockGpts = [
  {
    key: 'PropertyAssessmentGPT',
    name: 'Property Assessment GPT',
    description: 'Helps with property valuation.',
  },
];

const mockConversation = {
  id: 'convo-1',
  title: 'Property Assessment GPT',
};

describe('GptStudioView Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders GPT Suite header', () => {
    (gptClient.getSystemGpts as vi.Mock).mockReturnValue(new Promise(() => {}));
    render(<GptStudioView />);
    expect(screen.getByText(/TerraFusion GPT Suite/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (gptClient.getSystemGpts as vi.Mock).mockReturnValue(new Promise(() => {}));
    render(<GptStudioView />);
    expect(screen.getByText(/Loading GPTs/i)).toBeInTheDocument();
  });

  it('auto-selects PropertyAssessmentGPT and creates conversation', async () => {
    (gptClient.getSystemGpts as vi.Mock).mockResolvedValue(mockGpts);
    (gptClient.createConversation as vi.Mock).mockResolvedValue(mockConversation);
    (gptClient.getMessages as vi.Mock).mockResolvedValue([]);

    render(<GptStudioView />);

    // Wait for the auto-selection to trigger createConversation
    await waitFor(() => {
      expect(gptClient.createConversation).toHaveBeenCalledWith('PropertyAssessmentGPT');
    });
  });

  it('renders send button when conversation is active', async () => {
    (gptClient.getSystemGpts as vi.Mock).mockResolvedValue(mockGpts);
    (gptClient.createConversation as vi.Mock).mockResolvedValue(mockConversation);
    (gptClient.getMessages as vi.Mock).mockResolvedValue([]);

    render(<GptStudioView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  it('renders textarea for message input', async () => {
    (gptClient.getSystemGpts as vi.Mock).mockResolvedValue(mockGpts);
    (gptClient.createConversation as vi.Mock).mockResolvedValue(mockConversation);
    (gptClient.getMessages as vi.Mock).mockResolvedValue([]);

    render(<GptStudioView />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Ask Property Assessment GPT a question/i)
      ).toBeInTheDocument();
    });
  });

  it('calls sendMessage when user sends a message', async () => {
    (gptClient.getSystemGpts as vi.Mock).mockResolvedValue(mockGpts);
    (gptClient.createConversation as vi.Mock).mockResolvedValue(mockConversation);
    (gptClient.getMessages as vi.Mock).mockResolvedValue([]);
    (gptClient.sendMessage as vi.Mock).mockResolvedValue({
      id: 'assistant-1',
      role: 'Assistant',
      content: 'Stubbed assistant reply',
      createdAt: new Date().toISOString(),
    });

    render(<GptStudioView />);

    // Wait for conversation to be ready
    await waitFor(() => {
      expect(gptClient.createConversation).toHaveBeenCalled();
    });

    // Type a message
    const textarea = screen.getByPlaceholderText(/Ask Property Assessment GPT a question/i);
    fireEvent.change(textarea, { target: { value: 'Hello GPT' } });

    // Click send
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Assert sendMessage was called
    await waitFor(() => {
      expect(gptClient.sendMessage).toHaveBeenCalledWith('convo-1', 'Hello GPT');
    });
  });

  it('shows error state when API fails', async () => {
    (gptClient.getSystemGpts as vi.Mock).mockRejectedValue(new Error('API unavailable'));

    render(<GptStudioView />);

    await waitFor(() => {
      expect(screen.getByText(/API unavailable/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no GPTs available', async () => {
    (gptClient.getSystemGpts as vi.Mock).mockResolvedValue([]);

    render(<GptStudioView />);

    await waitFor(() => {
      expect(screen.getByText(/No GPTs available/i)).toBeInTheDocument();
    });
  });
});
