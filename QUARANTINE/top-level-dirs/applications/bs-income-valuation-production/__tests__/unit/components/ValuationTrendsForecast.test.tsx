import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ValuationTrendsForecast } from '@/components/ValuationTrendsForecast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { TrendForecastService } from '@/services/TrendForecastService';

// Mock TrendForecastService
vi.mock('@/services/TrendForecastService', () => ({
  TrendForecastService: vi.fn().mockImplementation(() => ({
    generateForecast: vi.fn().mockImplementation((data, periods) => ({
      predictions: [
        {
          date: new Date('2023-07-01'),
          value: 125000,
          lowerBound: 120000,
          upperBound: 130000,
        },
        {
          date: new Date('2023-08-01'),
          value: 130000,
          lowerBound: 123000,
          upperBound: 137000,
        },
        {
          date: new Date('2023-09-01'),
          value: 135000,
          lowerBound: 126000,
          upperBound: 144000,
        },
      ].slice(0, periods),
      confidenceScore: 0.85,
      growthRate: 0.04,
      volatility: 0.12,
      warnings: ['Sample warning for testing'],
      insights: ['Sample insight for testing'],
    })),
  })),
}));

// Mock data for testing
const mockValuations = [
  {
    id: 1,
    userId: 1,
    name: 'Test Valuation 1',
    createdAt: new Date('2023-01-01').toISOString(),
    valuationAmount: '100000',
    totalAnnualIncome: '20000',
    multiplier: '5.0',
    notes: 'Test notes',
  },
  {
    id: 2,
    userId: 1,
    name: 'Test Valuation 2',
    createdAt: new Date('2023-02-01').toISOString(),
    valuationAmount: '105000',
    totalAnnualIncome: '21000',
    multiplier: '5.0',
    notes: 'Another test',
  },
  {
    id: 3,
    userId: 1,
    name: 'Test Valuation 3',
    createdAt: new Date('2023-03-01').toISOString(),
    valuationAmount: '110000',
    totalAnnualIncome: '22000',
    multiplier: '5.0',
    notes: 'More test data',
  },
  {
    id: 4,
    userId: 1,
    name: 'Test Valuation 4',
    createdAt: new Date('2023-04-01').toISOString(),
    valuationAmount: '108000',
    totalAnnualIncome: '21600',
    multiplier: '5.0',
    notes: 'Another sample',
  },
  {
    id: 5,
    userId: 1,
    name: 'Test Valuation 5',
    createdAt: new Date('2023-05-01').toISOString(),
    valuationAmount: '115000',
    totalAnnualIncome: '23000',
    multiplier: '5.0',
    notes: 'Test data',
  },
  {
    id: 6,
    userId: 1,
    name: 'Test Valuation 6',
    createdAt: new Date('2023-06-01').toISOString(),
    valuationAmount: '120000',
    totalAnnualIncome: '24000',
    multiplier: '5.0',
    notes: 'Final test',
  },
];

// Setup query client for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ValuationTrendsForecast Component', () => {
  it('renders the forecast chart when data is available', () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <ValuationTrendsForecast valuations={mockValuations} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/Prediction Range/i)).toBeInTheDocument();
  });
  
  it('displays the forecast metrics correctly', async () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <ValuationTrendsForecast valuations={mockValuations} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Growth Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/4%/i)).toBeInTheDocument(); // From mock growthRate
    
    expect(screen.getByText(/Confidence Score/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/i)).toBeInTheDocument(); // From mock confidenceScore
  });
  
  it('allows changing the forecast periods', async () => {
    const testQueryClient = createTestQueryClient();
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <ValuationTrendsForecast valuations={mockValuations} />
      </QueryClientProvider>
    );
    
    // Find and interact with the periods slider
    const slider = screen.getByRole('slider');
    await user.click(slider);
    
    // Check if the forecast service was called
    expect(TrendForecastService).toHaveBeenCalled();
  });
  
  it('displays insights and warnings', () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <ValuationTrendsForecast valuations={mockValuations} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Sample insight for testing/i)).toBeInTheDocument();
    
    expect(screen.getByText(/Warnings/i)).toBeInTheDocument();
    expect(screen.getByText(/Sample warning for testing/i)).toBeInTheDocument();
  });
  
  it('handles empty valuation data gracefully', () => {
    const testQueryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <ValuationTrendsForecast valuations={[]} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Not enough data/i)).toBeInTheDocument();
  });
});