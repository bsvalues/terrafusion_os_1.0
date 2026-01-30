/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🤖 TerraFusion AI Health Status Chip Tests
 * Phase 15.3: OS Surface Integration
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Mock the API module BEFORE any imports to avoid import.meta.env parsing
jest.mock('../../../api/systemDiagnosticsApi', () => ({
  getSystemDiagnostics: jest.fn(),
}));

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as api from '../../../api/systemDiagnosticsApi';
import { AIHealthStatusChip } from '../AIHealthStatusChip';

const mockDiagnosticsHealthy: api.SystemDiagnosticsResponse = {
  overallHealth: 'Healthy',
  timestamp: new Date().toISOString(),
  gptConfigs: [
    {
      key: 'TestGPT',
      name: 'Test GPT',
      enabled: true,
      model: 'gpt-4',
      ragEnabled: false,
      conversationCount: 10,
    },
  ],
  embeddingStatus: {
    mode: 'OpenAI',
    available: true,
    dimensions: 1536,
    provider: 'OpenAI',
  },
  ragDatasets: [
    {
      key: 'test',
      name: 'Test Dataset',
      indexed: true,
      documentCount: 5,
      embeddingCount: 100,
      status: 'Healthy',
    },
  ],
  explainGptStatus: { healthy: true, message: 'Ready' },
  statistics: {
    totalConversations: 100,
    totalMessages: 500,
    auditRecordCount: 1000,
    ragTraceCount: 200,
    messagesLast24h: 50,
    conversationsLast24h: 10,
  },
  heraldMessages: [],
};

const mockDiagnosticsDegraded: api.SystemDiagnosticsResponse = {
  ...mockDiagnosticsHealthy,
  overallHealth: 'Degraded',
  heraldMessages: [
    {
      level: 'Warning',
      message: 'RAG not indexed',
      timestamp: new Date().toISOString(),
      source: 'HealthEvaluator',
    },
  ],
};

describe('AIHealthStatusChip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    jest.mocked(api.getSystemDiagnostics).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AIHealthStatusChip />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders healthy status after successful fetch', async () => {
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsHealthy);

    render(<AIHealthStatusChip />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });
  });

  it('renders degraded status with warning styling', async () => {
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsDegraded);

    render(<AIHealthStatusChip />);

    await waitFor(() => {
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    jest.mocked(api.getSystemDiagnostics).mockRejectedValue(new Error('Network error'));

    render(<AIHealthStatusChip />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('calls onClick handler when clicked', async () => {
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsHealthy);
    const handleClick = jest.fn();

    render(<AIHealthStatusChip onClick={handleClick} />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows AI label in non-compact mode', async () => {
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsHealthy);

    render(<AIHealthStatusChip compact={false} />);

    await waitFor(() => {
      expect(screen.getByText('AI')).toBeInTheDocument();
    });
  });

  it('hides AI label in compact mode', async () => {
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsHealthy);

    render(<AIHealthStatusChip compact={true} />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    expect(screen.queryByText('AI')).not.toBeInTheDocument();
  });

  it('shows tooltip with summary on hover', async () => {
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsHealthy);

    render(<AIHealthStatusChip />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title');
    expect(button.getAttribute('title')).toContain('GPTs: 1/1 active');
  });

  it('auto-refreshes at specified interval', async () => {
    jest.useFakeTimers();
    jest.mocked(api.getSystemDiagnostics).mockResolvedValue(mockDiagnosticsHealthy);

    render(<AIHealthStatusChip refreshInterval={5000} />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    // Initial call
    expect(api.getSystemDiagnostics).toHaveBeenCalledTimes(1);

    // Advance time by refresh interval
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(api.getSystemDiagnostics).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
