import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValuationAnalytics } from '@/components/ValuationAnalytics';
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
    if (queryKey[0] === '/api/agents/analyze-data-quality') {
      return {
        data: mockDataQualityAnalysis,
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

const mockDataQualityAnalysis = {
  qualityScore: 92,
  totalRecords: 12,
  issues: [
    {
      type: 'missingData',
      description: 'Some income records are missing detailed descriptions',
      severity: 'low',
      affectedRecords: 2,
      suggestions: ['Add detailed descriptions to improve data quality']
    }
  ],
  suggestedFixes: [
    {
      type: 'addDescription',
      description: 'Add missing descriptions to income records',
      automaticFix: false,
      affectedRecords: [5, 8]
    }
  ],
  potentialDuplicates: []
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

describe('ValuationAnalytics component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the analytics component with tabs', () => {
    render(<ValuationAnalytics valuations={mockValuations} incomes={mockIncomes} />);
    
    expect(screen.getByText('Valuation Analytics')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Income Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Valuation Trends/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Data Quality/i })).toBeInTheDocument();
  });
  
  it('displays overview tab with summary and key metrics', async () => {
    render(<ValuationAnalytics valuations={mockValuations} incomes={mockIncomes} />);
    
    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    await userEvent.click(overviewTab);
    
    await waitFor(() => {
      expect(screen.getByText('Valuation Summary')).toBeInTheDocument();
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
      
      // Check that summary text is rendered (not the raw object)
      expect(screen.getByText(/Valuation performance has been strong/)).toBeInTheDocument();
      
      // Check for highlights
      expect(screen.getByText(/Property value increased by/)).toBeInTheDocument();
      
      // Check for metrics
      expect(screen.getByText('Latest Valuation')).toBeInTheDocument();
      expect(screen.getByText('Growth Rate')).toBeInTheDocument();
    });
  });
  
  it('displays income analysis tab with findings and charts', async () => {
    render(<ValuationAnalytics valuations={mockValuations} incomes={mockIncomes} />);
    
    const incomeTab = screen.getByRole('tab', { name: /Income Analysis/i });
    await userEvent.click(incomeTab);
    
    await waitFor(() => {
      expect(screen.getByText('Income Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Income Analysis Findings')).toBeInTheDocument();
      
      // Check for findings
      expect(screen.getByText(/Total annual income of \$75,000/)).toBeInTheDocument();
      
      // Check for charts
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      
      // Check for recommendations
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/Consider increasing rental income/)).toBeInTheDocument();
    });
  });
  
  it('displays valuation trends tab with historical data', async () => {
    render(<ValuationAnalytics valuations={mockValuations} incomes={mockIncomes} />);
    
    const trendsTab = screen.getByRole('tab', { name: /Valuation Trends/i });
    await userEvent.click(trendsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Valuation History')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      
      // Check for charts
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Check for insights
      expect(screen.getByText(/Valuation growth is consistent/)).toBeInTheDocument();
    });
  });
  
  it('displays data quality tab with analysis', async () => {
    render(<ValuationAnalytics valuations={mockValuations} incomes={mockIncomes} />);
    
    const qualityTab = screen.getByRole('tab', { name: /Data Quality/i });
    await userEvent.click(qualityTab);
    
    await waitFor(() => {
      expect(screen.getByText('Data Quality Score')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument(); // Score from mock
      
      // Check for issues
      expect(screen.getByText('Issues Detected')).toBeInTheDocument();
      expect(screen.getByText(/Some income records are missing/)).toBeInTheDocument();
      
      // Check for suggested fixes
      expect(screen.getByText('Suggested Fixes')).toBeInTheDocument();
      expect(screen.getByText(/Add missing descriptions/)).toBeInTheDocument();
    });
  });
  
  it('handles empty valuations and incomes gracefully', () => {
    render(<ValuationAnalytics valuations={[]} incomes={[]} />);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText(/You don't have any valuations yet/)).toBeInTheDocument();
  });
});