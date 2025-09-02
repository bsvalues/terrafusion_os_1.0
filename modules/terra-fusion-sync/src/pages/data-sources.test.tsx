import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DataSources from './data-sources';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock the DataSourceForm component
vi.mock('../components/data-source-form', () => ({
  DataSourceForm: () => <div data-testid="data-source-form">Data Source Form</div>,
}));

describe('DataSources Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderDataSourcesPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DataSources />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the data sources page with title and form', () => {
    renderDataSourcesPage();
    
    expect(screen.getByRole('heading', { name: /Data Sources/i })).toBeInTheDocument();
    expect(screen.getByTestId('data-source-form')).toBeInTheDocument();
  });

  it('displays the data sources list when data is available', async () => {
    // Mock successful data sources fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'SQL Database', 
          type: 'sql', 
          config: { 
            host: 'localhost', 
            port: '5432',
            database: 'testdb',
            username: 'user'
          }, 
          userId: 1,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        { 
          id: 2, 
          name: 'API Endpoint', 
          type: 'api', 
          config: { 
            url: 'https://api.example.com',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }, 
          userId: 1,
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      ]),
    });
    
    renderDataSourcesPage();
    
    await waitFor(() => {
      expect(screen.getByText('SQL Database')).toBeInTheDocument();
      expect(screen.getByText('API Endpoint')).toBeInTheDocument();
    });
  });

  it('handles empty data sources', async () => {
    // Mock empty data sources response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    
    renderDataSourcesPage();
    
    await waitFor(() => {
      expect(screen.getByText(/No data sources found/i)).toBeInTheDocument();
    });
  });

  it('displays error message when data sources fetch fails', async () => {
    // Mock failed data sources fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Failed to fetch data sources' }),
    });
    
    renderDataSourcesPage();
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading data sources/i)).toBeInTheDocument();
    });
  });
});