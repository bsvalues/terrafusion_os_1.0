import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MetricsCards } from './metrics-cards';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('MetricsCards', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders metrics cards with initial values', () => {
    renderWithProviders(<MetricsCards />);

    // Check if all metric cards are rendered with correct titles
    expect(screen.getByText('Processed Files')).toBeInTheDocument();
    expect(screen.getByText('Avg RAG Score')).toBeInTheDocument();
    expect(screen.getByText('Transformations')).toBeInTheDocument();
  });

  it('displays loading state initially', async () => {
    // Mock successful response
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          totalProcessedFiles: 0,
          avgRagScore: 0,
          transformationCount: 0
        })
      })
    );

    renderWithProviders(<MetricsCards />);

    // Check initial values using test IDs
    await waitFor(() => {
      expect(screen.getByTestId('processed-files-value')).toHaveTextContent('0');
      expect(screen.getByTestId('rag-score-value')).toHaveTextContent('0.00');
      expect(screen.getByTestId('transformations-value')).toHaveTextContent('0');
    }, { timeout: 2000 });
  });

  it('handles API error gracefully', async () => {
    // Mock console.error to prevent error logging in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch to simulate an error
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    renderWithProviders(<MetricsCards />);

    // Verify that default values are shown when API fails
    await waitFor(() => {
      expect(screen.getByTestId('processed-files-value')).toHaveTextContent('0');
      expect(screen.getByTestId('rag-score-value')).toHaveTextContent('0.00');
      expect(screen.getByTestId('transformations-value')).toHaveTextContent('0');
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });
});