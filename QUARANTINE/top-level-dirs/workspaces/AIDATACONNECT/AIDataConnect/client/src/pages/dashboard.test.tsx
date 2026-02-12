import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the component dependencies
vi.mock('../components/analytics/metrics-cards', () => ({
  MetricsCards: () => <div data-testid="metrics-cards">Metrics Cards</div>,
}));

vi.mock('../components/analytics/usage-chart', () => ({
  UsageChart: () => <div data-testid="usage-chart">Usage Chart</div>,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('Dashboard Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the dashboard with title and components', () => {
    renderDashboard();
    
    expect(screen.getByRole('heading', { name: /Analytics Dashboard/i })).toBeInTheDocument();
    expect(screen.getByTestId('metrics-cards')).toBeInTheDocument();
    expect(screen.getByTestId('usage-chart')).toBeInTheDocument();
  });

  it('displays recent activity when data is available', async () => {
    // Mock successful activity fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          type: 'file_upload', 
          details: { fileName: 'document.pdf' },
          timestamp: '2023-01-01T12:00:00.000Z'
        },
        { 
          id: 2, 
          type: 'data_source_created', 
          details: { name: 'SQL Database' },
          timestamp: '2023-01-02T15:30:00.000Z'
        }
      ]),
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
      expect(screen.getByText(/File Upload/i)).toBeInTheDocument();
      expect(screen.getByText(/document.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Source Created/i)).toBeInTheDocument();
      expect(screen.getByText(/SQL Database/i)).toBeInTheDocument();
    });
  });

  it('handles empty recent activity', async () => {
    // Mock empty activity response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
    });
  });

  it('displays error message when activity fetch fails', async () => {
    // Mock failed activity fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Failed to fetch activity' }),
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading recent activity/i)).toBeInTheDocument();
    });
  });

  it('shows correct formatting for timestamps', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Mock activity with different timestamps
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          type: 'file_upload', 
          details: { fileName: 'recent.pdf' },
          timestamp: oneHourAgo.toISOString()
        },
        { 
          id: 2, 
          type: 'data_source_created', 
          details: { name: 'Old Source' },
          timestamp: oneDayAgo.toISOString()
        }
      ]),
    });
    
    renderDashboard();
    
    await waitFor(() => {
      // Check for relative time formats (exact text may vary in testing environment)
      expect(screen.getByText(/recent.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Old Source/i)).toBeInTheDocument();
      
      // The actual time strings will be something like "1 hour ago" or "yesterday"
      // We can't check for exact strings in a test as they depend on the test execution time
      const timeElements = screen.getAllByTestId('activity-time');
      expect(timeElements.length).toBe(2);
    });
  });
});