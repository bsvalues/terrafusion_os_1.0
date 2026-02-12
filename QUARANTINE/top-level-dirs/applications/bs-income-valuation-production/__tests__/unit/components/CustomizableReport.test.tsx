import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomizableReport } from '@/components/CustomizableReport';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the usePDF hook
vi.mock('react-to-pdf', () => ({
  usePDF: () => ({
    toPDF: vi.fn().mockResolvedValue(),
    targetRef: { current: document.createElement('div') }
  })
}));

// Mock formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (val: number) => `$${val.toFixed(2)}`,
  formatDate: (date: Date) => date.toISOString().split('T')[0],
  formatPercentage: (val: number) => `${(val * 100).toFixed(2)}%`
}));

describe('CustomizableReport Component', () => {
  let queryClient: QueryClient;
  
  const mockValuation = {
    id: 1,
    name: 'Test Valuation',
    valuationAmount: '500000',
    totalAnnualIncome: '100000',
    multiplier: '5',
    incomeBreakdown: JSON.stringify({
      'salary': 60000,
      'business': 30000,
      'investment': 10000
    }),
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockValuations = [mockValuation];
  const mockIncomes = [
    { id: 1, source: 'salary', amount: '60000' },
    { id: 2, source: 'business', amount: '30000' },
    { id: 3, source: 'investment', amount: '10000' }
  ];

  // Setup queryClient for each test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Mock API responses
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === '/api/agents/analyze-income') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            analysis: {
              findings: ['Good income diversity'],
              recommendations: ['Continue diversification'],
              metrics: {
                diversificationScore: 0.8,
                stabilityScore: 0.75,
                growthPotential: 0.6,
                seasonalImpact: 'low'
              }
            }
          })
        } as Response);
      }
      if (url === '/api/agents/detect-anomalies') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            summary: 'No significant anomalies detected',
            insights: ['Steady growth pattern'],
            anomalies: []
          })
        } as Response);
      }
      if (url === '/api/agents/valuation-summary') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            text: 'Valuation shows positive trends',
            highlights: ['Strong income growth'],
            trends: ['Upward trajectory']
          })
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.reject(new Error('Not found'))
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render all report sections by default', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CustomizableReport
          valuation={mockValuation}
          valuations={mockValuations}
          incomes={mockIncomes}
        />
      </QueryClientProvider>
    );

    // Verify all default sections are displayed
    expect(screen.getByText('Valuation Summary')).toBeInTheDocument();
    expect(screen.getByText('Income Analysis')).toBeInTheDocument();
    expect(screen.getByText('Historical Performance')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('should allow toggling report sections', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CustomizableReport
          valuation={mockValuation}
          valuations={mockValuations}
          incomes={mockIncomes}
        />
      </QueryClientProvider>
    );

    // Toggle off the Notes section
    const notesToggle = screen.getByLabelText('Include Notes');
    await userEvent.click(notesToggle);

    // Customize report
    const customizeButton = screen.getByText('Customize Report');
    await userEvent.click(customizeButton);

    // Verify Notes section is hidden after customization
    await waitFor(() => {
      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  it('should call toPDF when Export as PDF button is clicked', async () => {
    const { toPDF } = usePDF();
    
    render(
      <QueryClientProvider client={queryClient}>
        <CustomizableReport
          valuation={mockValuation}
          valuations={mockValuations}
          incomes={mockIncomes}
        />
      </QueryClientProvider>
    );

    const exportButton = screen.getByText('Export as PDF');
    await userEvent.click(exportButton);

    expect(toPDF).toHaveBeenCalled();
  });

  it('should apply title and description customizations', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CustomizableReport
          valuation={mockValuation}
          valuations={mockValuations}
          incomes={mockIncomes}
        />
      </QueryClientProvider>
    );

    // Open customization dialog
    const customizeButton = screen.getByText('Customize Report');
    await userEvent.click(customizeButton);

    // Change title and description
    const titleInput = screen.getByLabelText('Report Title');
    const descriptionInput = screen.getByLabelText('Report Description');
    
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Custom Report Title');
    
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Custom Report Description');

    // Apply changes
    const applyButton = screen.getByText('Apply Changes');
    await userEvent.click(applyButton);

    // Verify custom title and description are displayed
    expect(screen.getByText('Custom Report Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Report Description')).toBeInTheDocument();
  });

  it('should allow selecting specific metrics to include', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CustomizableReport
          valuation={mockValuation}
          valuations={mockValuations}
          incomes={mockIncomes}
        />
      </QueryClientProvider>
    );

    // Open customization dialog
    const customizeButton = screen.getByText('Customize Report');
    await userEvent.click(customizeButton);

    // Deselect valuation amount
    const valuationAmountToggle = screen.getByLabelText('Include Valuation Amount');
    await userEvent.click(valuationAmountToggle);

    // Apply changes
    const applyButton = screen.getByText('Apply Changes');
    await userEvent.click(applyButton);

    // Verification will depend on implementation details,
    // but we should not see the valuation amount section
    expect(screen.queryByText('Valuation Amount')).not.toBeInTheDocument();
  });
});