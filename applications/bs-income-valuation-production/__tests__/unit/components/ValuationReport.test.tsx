import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValuationReport } from '@/components/ValuationReport';
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
  useQuery: vi.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === '/api/agents/analyze-income') {
      return {
        data: mockIncomeAnalysis,
        isLoading: false,
        isFetching: false,
        error: null
      };
    }
    if (queryKey[0] === '/api/agents/detect-anomalies') {
      return {
        data: mockAnomalyDetection,
        isLoading: false,
        isFetching: false,
        error: null
      };
    }
    if (queryKey[0] === '/api/agents/valuation-summary') {
      return {
        data: mockValuationSummary,
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
  })
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Label: () => <div data-testid="label" />
}));

// Mock react-to-pdf
vi.mock('react-to-pdf', () => ({
  usePDF: vi.fn().mockReturnValue([
    { loading: false, error: null, url: 'blob:test-url' },
    vi.fn(),
    { instance: { current: { outerHTML: '<div>Mock PDF Content</div>' } } }
  ])
}));

// Mock formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number | string) => 
    typeof amount === 'string' ? `$${amount}` : `$${amount.toFixed(2)}`,
  formatPercentage: (amount: number | string) => 
    typeof amount === 'string' ? `${amount}%` : `${(amount * 100).toFixed(2)}%`,
  formatDate: (date: Date | string) => 
    typeof date === 'string' ? date : date.toISOString().split('T')[0]
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

const mockIncomes = [
  {
    id: 1,
    userId: 1,
    source: 'rental',
    amount: '4000.00',
    frequency: 'monthly',
    description: 'Rental income from property at 123 Main St',
    createdAt: new Date('2025-01-01')
  },
  {
    id: 2,
    userId: 1,
    source: 'business',
    amount: '3000.00',
    frequency: 'monthly',
    description: 'Business profit distributions',
    createdAt: new Date('2025-01-01')
  }
];

const mockIncomeAnalysis = {
  analysis: {
    findings: [
      'Total annual income of $75,000 is above average for Benton County',
      'Income diversification is good with multiple sources'
    ],
    recommendations: [
      'Consider increasing rental income by 10-15% based on local market conditions',
      'Look for opportunities to add passive income streams'
    ],
    distribution: [
      { source: 'rental', percentage: 0.66 },
      { source: 'business', percentage: 0.34 }
    ],
    metrics: {
      averageMonthlyIncome: 6250,
      totalAnnualIncome: 75000,
      diversificationScore: 0.75,
      stabilityScore: 0.80,
      growthPotential: 0.65,
      seasonalImpact: 'low'
    }
  },
  suggestedValuation: {
    amount: '285000.00',
    multiplier: '3.8',
    considerations: [
      'Local real estate market trends',
      'Property condition and improvements',
      'Potential for income growth'
    ],
    rangeMin: '270000.00',
    rangeMax: '300000.00',
    confidenceScore: 0.85
  }
};

const mockAnomalyDetection = {
  anomalies: [],
  insights: [
    'Valuation growth is consistent with market trends',
    'Income growth rate is sustainable',
    'Multiplier is within normal range for property type'
  ],
  summary: 'No significant anomalies detected in the valuation history. Data appears consistent and reliable.'
};

const mockValuationSummary = {
  text: 'Valuation performance has been strong with consistent growth. Current valuation of $323,000 represents a 23% increase over initial valuation.',
  highlights: [
    'Property value increased by $60,500',
    'Income growth contributed to 45% of valuation increase',
    'Multiplier improvement accounts for 55% of valuation increase'
  ],
  trends: [
    'Steady income growth trajectory',
    'Multiplier improvement reflecting property enhancement',
    'Above-market growth rate'
  ],
  period: 'monthly'
};

describe('ValuationReport component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the report component with sections', async () => {
    render(<ValuationReport 
      valuation={mockValuations[1]} 
      valuations={mockValuations} 
      incomes={mockIncomes} 
    />);
    
    expect(screen.getByText('Valuation Report')).toBeInTheDocument();
    expect(screen.getByText('Report for March 2025 Valuation')).toBeInTheDocument();
    
    // Check for main sections
    expect(screen.getByText('Valuation Summary')).toBeInTheDocument();
    expect(screen.getByText('Income Analysis')).toBeInTheDocument();
    expect(screen.getByText('Historical Performance')).toBeInTheDocument();
    
    // Check for PDF export button
    expect(screen.getByRole('button', { name: /Export as PDF/i })).toBeInTheDocument();
  });
  
  it('displays summary section with correct data', async () => {
    render(<ValuationReport 
      valuation={mockValuations[1]} 
      valuations={mockValuations} 
      incomes={mockIncomes} 
    />);
    
    // Wait for summary data to load
    await waitFor(() => {
      // Check for valuation amount
      expect(screen.getByText('$323000.00')).toBeInTheDocument();
      
      // Check for income data
      expect(screen.getByText('Total Annual Income')).toBeInTheDocument();
      expect(screen.getByText('$85000.00')).toBeInTheDocument();
      
      // Check for multiplier
      expect(screen.getByText('Income Multiplier')).toBeInTheDocument();
      expect(screen.getByText('3.8')).toBeInTheDocument();
    });
  });
  
  it('displays income analysis section with charts and findings', async () => {
    render(<ValuationReport 
      valuation={mockValuations[1]} 
      valuations={mockValuations} 
      incomes={mockIncomes} 
    />);
    
    // Wait for income analysis data to load
    await waitFor(() => {
      // Check for income breakdown
      expect(screen.getByText('Income Breakdown')).toBeInTheDocument();
      
      // Check for chart
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      
      // Check for findings
      expect(screen.getByText('Key Findings')).toBeInTheDocument();
      expect(screen.getByText(/Total annual income of \$75,000/)).toBeInTheDocument();
    });
  });
  
  it('displays historical performance section with trends', async () => {
    render(<ValuationReport 
      valuation={mockValuations[1]} 
      valuations={mockValuations} 
      incomes={mockIncomes} 
    />);
    
    // Wait for historical data to load
    await waitFor(() => {
      // Check for valuation history chart
      expect(screen.getByText('Valuation History')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Check for insights
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText(/Valuation growth is consistent/)).toBeInTheDocument();
    });
  });
  
  it('generates PDF when export button is clicked', async () => {
    const { usePDF } = require('react-to-pdf');
    const mockToPDF = vi.fn();
    
    usePDF.mockReturnValue([
      { loading: false, error: null, url: 'blob:test-url' },
      mockToPDF,
      { instance: { current: null } }
    ]);
    
    render(<ValuationReport 
      valuation={mockValuations[1]} 
      valuations={mockValuations} 
      incomes={mockIncomes} 
    />);
    
    const exportButton = screen.getByRole('button', { name: /Export as PDF/i });
    await userEvent.click(exportButton);
    
    expect(mockToPDF).toHaveBeenCalled();
  });
  
  it('handles empty data gracefully', () => {
    render(<ValuationReport 
      valuation={null} 
      valuations={[]} 
      incomes={[]}
    />);
    
    expect(screen.getByText('No Valuation Selected')).toBeInTheDocument();
    expect(screen.getByText(/Please select a valuation to generate a report/)).toBeInTheDocument();
  });
});