import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValuationComparison } from '@/components/ValuationComparison';
import { render, screen, waitFor } from '@testing-library/react';
import { apiRequest } from '@/lib/queryClient';
import userEvent from '@testing-library/user-event';

// Mock the apiRequest function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn()
  }
}));

// Mock the TanStack Query hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey, queryFn, enabled }) => {
    if (enabled === false) {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        error: null
      };
    }
    
    if (queryKey[0] === 'valuationComparison' && queryKey[1] && queryKey[2]) {
      return {
        data: {
          valuations: mockComparisonValuations,
          comparison: mockComparisonResults
        },
        isLoading: false,
        isFetching: false,
        error: null
      };
    }
    
    return {
      data: null,
      isLoading: false,
      isFetching: false,
      error: null
    };
  }),
  useMutation: vi.fn().mockImplementation(({ onSuccess }) => ({
    mutate: vi.fn(),
    isPending: false
  }))
}));

// Mock formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatPercentage: (amount: number) => `${(amount * 100).toFixed(2)}%`,
  formatDate: (date: Date) => date.toISOString()
}));

const mockValuations = [
  {
    id: 1,
    userId: 1,
    name: 'January 2025 Valuation',
    totalAnnualIncome: '75000.00',
    multiplier: '3.5',
    valuationAmount: '262500.00',
    incomeBreakdown: '{"rental": 50000, "business": 25000}',
    notes: 'Initial valuation',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    isActive: true
  },
  {
    id: 2,
    userId: 1,
    name: 'March 2025 Valuation',
    totalAnnualIncome: '85000.00',
    multiplier: '3.8',
    valuationAmount: '323000.00',
    incomeBreakdown: '{"rental": 55000, "business": 30000}',
    notes: 'Updated after property improvements',
    createdAt: new Date('2025-03-10'),
    updatedAt: new Date('2025-03-10'),
    isActive: true
  }
];

const mockComparisonValuations = [
  mockValuations[0],
  mockValuations[1]
];

const mockComparisonResults = {
  incomeDifference: '10000.00',
  multiplierDifference: '0.30',
  valuationDifference: '60500.00',
  percentageChange: '23.05',
  incomeChanges: {
    rental: '5000.00',
    business: '5000.00'
  }
};

describe('ValuationComparison component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the component with selection dropdowns', () => {
    render(<ValuationComparison valuations={mockValuations} />);
    
    expect(screen.getByText('Valuation Comparison')).toBeInTheDocument();
    expect(screen.getByText('Base Valuation')).toBeInTheDocument();
    expect(screen.getByText('Comparison Valuation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compare Valuations/i })).toBeInTheDocument();
  });
  
  it('displays a message when no valuations are available', () => {
    render(<ValuationComparison valuations={[]} />);
    
    expect(screen.getByText('No valuations available')).toBeInTheDocument();
    expect(screen.getByText('No valuations available for comparison. Create at least two valuations to use this feature.')).toBeInTheDocument();
  });
  
  it('displays a message when only one valuation is available', () => {
    render(<ValuationComparison valuations={[mockValuations[0]]} />);
    
    expect(screen.getByText('Insufficient valuations')).toBeInTheDocument();
    expect(screen.getByText(/You need at least two valuations to perform a comparison/i)).toBeInTheDocument();
  });
  
  it('performs a comparison when valuations are selected and the button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<ValuationComparison valuations={mockValuations} />);
    
    // Select base valuation
    const baseDropdown = screen.getByLabelText('Base Valuation');
    await user.click(baseDropdown);
    await user.click(screen.getByText('January 2025 Valuation'));
    
    // Select comparison valuation
    const compareDropdown = screen.getByLabelText('Comparison Valuation');
    await user.click(compareDropdown);
    await user.click(screen.getByText('March 2025 Valuation'));
    
    // Click the compare button
    const compareButton = screen.getByRole('button', { name: /Compare Valuations/i });
    await user.click(compareButton);
    
    // Verify comparison results are displayed
    await waitFor(() => {
      expect(screen.getByText('Valuation Comparison Results')).toBeInTheDocument();
      expect(screen.getByText('Income Difference')).toBeInTheDocument();
      expect(screen.getByText('Multiplier Difference')).toBeInTheDocument();
      expect(screen.getByText('Valuation Difference')).toBeInTheDocument();
      expect(screen.getByText('Percentage Change')).toBeInTheDocument();
    });
  });
});