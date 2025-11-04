import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/components/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock data for testing
const mockValuations = [
  {
    id: 1,
    userId: 1,
    name: 'Test Valuation 1',
    createdAt: new Date('2023-01-01').toISOString(),
    valuationAmount: '500000',
    totalAnnualIncome: '100000',
    multiplier: '5.0',
    notes: 'Test notes',
  },
  {
    id: 2,
    userId: 1,
    name: 'Test Valuation 2',
    createdAt: new Date('2023-02-01').toISOString(),
    valuationAmount: '750000',
    totalAnnualIncome: '150000',
    multiplier: '5.0',
    notes: 'Another test',
  },
];

const mockIncomes = [
  {
    id: 1,
    userId: 1,
    source: 'Rental',
    amount: '5000',
    frequency: 'monthly',
    category: 'Passive',
    isRecurring: true,
    startDate: new Date('2022-01-01').toISOString(),
    notes: 'Test rental income',
  },
  {
    id: 2,
    userId: 1,
    source: 'Dividends',
    amount: '2000',
    frequency: 'monthly',
    category: 'Investment',
    isRecurring: true,
    startDate: new Date('2022-02-01').toISOString(),
    notes: 'Test dividend income',
  },
];

// Mock the agent responses
const mockIncomeAnalysis = {
  analysis: {
    findings: ['Finding 1', 'Finding 2'],
    recommendations: ['Recommendation 1', 'Recommendation 2'],
    distribution: [
      { source: 'Rental', percentage: 70 },
      { source: 'Dividends', percentage: 30 },
    ],
    metrics: {
      averageMonthlyIncome: 7000,
      totalAnnualIncome: 84000,
      diversificationScore: 0.7,
      stabilityScore: 0.85,
      growthPotential: 0.6,
      seasonalImpact: 'low',
    },
  },
  suggestedValuation: {
    amount: '420000',
    multiplier: '5.0',
    considerations: ['Consideration 1', 'Consideration 2'],
    rangeMin: '400000',
    rangeMax: '450000',
    confidenceScore: 0.8,
  },
};

const mockDataQuality = {
  qualityScore: 95,
  totalRecords: 2,
  issues: [],
  suggestedFixes: [],
  potentialDuplicates: [],
};

const mockAnomalyDetection = {
  anomalies: [],
  insights: ['Insight 1', 'Insight 2'],
  summary: 'No anomalies detected',
};

// Setup query client for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock API responses
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/valuations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockValuations),
        });
      }
      if (url.includes('/api/incomes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIncomes),
        });
      }
      if (url.includes('/api/agents/analyze-income')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIncomeAnalysis),
        });
      }
      if (url.includes('/api/agents/analyze-data-quality')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDataQuality),
        });
      }
      if (url.includes('/api/agents/detect-anomalies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnomalyDetection),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders all dashboard metric cards', async () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <Dashboard valuations={mockValuations} incomes={mockIncomes} />
      </QueryClientProvider>
    );

    // Check for key dashboard elements
    await waitFor(() => {
      expect(screen.getByText(/Portfolio Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/Latest Valuation/i)).toBeInTheDocument();
      expect(screen.getByText(/Income Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText(/Key Performance Indicators/i)).toBeInTheDocument();
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    });
  });

  it('displays correct summary metrics', async () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <Dashboard valuations={mockValuations} incomes={mockIncomes} />
      </QueryClientProvider>
    );

    // Check for correct summary metrics
    await waitFor(() => {
      expect(screen.getByText(/Total Portfolio Value/i)).toBeInTheDocument();
      expect(screen.getByText(/\$750,000/)).toBeInTheDocument(); // Latest valuation amount
      expect(screen.getByText(/\$7,000/)).toBeInTheDocument(); // Monthly income
      expect(screen.getByText(/\$84,000/)).toBeInTheDocument(); // Annual income
    });
  });

  it('displays growth indicators correctly', async () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <Dashboard valuations={mockValuations} incomes={mockIncomes} />
      </QueryClientProvider>
    );

    // Check for growth indicators
    await waitFor(() => {
      expect(screen.getByText(/Valuation Growth/i)).toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument(); // Growth from 500k to 750k
    });
  });

  it('handles empty data states gracefully', async () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <Dashboard valuations={[]} incomes={[]} />
      </QueryClientProvider>
    );

    // Check for empty state messaging
    await waitFor(() => {
      expect(screen.getByText(/No valuations available/i)).toBeInTheDocument();
      expect(screen.getByText(/No income sources available/i)).toBeInTheDocument();
    });
  });

  it('displays loading states while data is being fetched', async () => {
    // Mock slow responses
    global.fetch = vi.fn().mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }, 100);
    }));
    
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <Dashboard valuations={[]} incomes={[]} />
      </QueryClientProvider>
    );

    // Check for loading indicators
    expect(screen.getAllByText(/Loading/i).length).toBeGreaterThan(0);
  });

  it('updates when refresh button is clicked', async () => {
    const testQueryClient = createTestQueryClient();
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <Dashboard valuations={mockValuations} incomes={mockIncomes} />
      </QueryClientProvider>
    );

    // Find and click refresh button
    const refreshButton = await screen.findByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Verify fetch was called again
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(expect.any(Number));
    });
  });
});