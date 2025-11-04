import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchReportGenerator } from '@/components/BatchReportGenerator';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the DataExportService
vi.mock('@/services/DataExportService', () => ({
  DataExportService: {
    batchExport: vi.fn().mockResolvedValue(true)
  }
}));

describe('BatchReportGenerator Component', () => {
  let queryClient: QueryClient;
  
  const mockValuations = [
    {
      id: 1,
      name: 'Valuation 1',
      valuationAmount: '500000',
      totalAnnualIncome: '100000',
      multiplier: '5',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: 2,
      name: 'Valuation 2',
      valuationAmount: '750000',
      totalAnnualIncome: '150000',
      multiplier: '5',
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-02')
    },
    {
      id: 3,
      name: 'Valuation 3',
      valuationAmount: '1000000',
      totalAnnualIncome: '200000',
      multiplier: '5',
      createdAt: new Date('2023-03-01'),
      updatedAt: new Date('2023-03-02')
    }
  ];
  
  const mockIncomes = [
    { id: 1, userId: 1, source: 'salary', amount: '60000', frequency: 'monthly' },
    { id: 2, userId: 1, source: 'business', amount: '30000', frequency: 'annual' },
    { id: 3, userId: 1, source: 'investment', amount: '10000', frequency: 'annual' }
  ];

  // Setup query client for each test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Mock the fetch calls
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === '/api/valuations') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockValuations })
        } as Response);
      }
      if (url === '/api/incomes') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIncomes)
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

  it('should render a list of valuations to select from', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BatchReportGenerator />
      </QueryClientProvider>
    );

    // Wait for valuations to load
    await waitFor(() => {
      expect(screen.getByText('Valuation 1')).toBeInTheDocument();
      expect(screen.getByText('Valuation 2')).toBeInTheDocument();
      expect(screen.getByText('Valuation 3')).toBeInTheDocument();
    });
  });

  it('should allow selecting multiple valuations for batch reporting', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BatchReportGenerator />
      </QueryClientProvider>
    );

    // Wait for valuations to load
    await waitFor(() => {
      expect(screen.getByText('Valuation 1')).toBeInTheDocument();
    });

    // Check the checkboxes for valuations 1 and 3
    const checkbox1 = screen.getByLabelText('Select Valuation 1');
    const checkbox3 = screen.getByLabelText('Select Valuation 3');
    
    await userEvent.click(checkbox1);
    await userEvent.click(checkbox3);
    
    // Verify selected count is updated
    expect(screen.getByText('2 valuations selected')).toBeInTheDocument();
  });

  it('should allow configuring report options', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BatchReportGenerator />
      </QueryClientProvider>
    );

    // Wait for valuations to load
    await waitFor(() => {
      expect(screen.getByText('Valuation 1')).toBeInTheDocument();
    });

    // Select a valuation
    const checkbox1 = screen.getByLabelText('Select Valuation 1');
    await userEvent.click(checkbox1);
    
    // Open report options
    const optionsButton = screen.getByText('Configure Report Options');
    await userEvent.click(optionsButton);
    
    // Check some options
    const includeChartsCheckbox = screen.getByLabelText('Include Charts');
    const includeInsightsCheckbox = screen.getByLabelText('Include Insights');
    
    await userEvent.click(includeChartsCheckbox);
    
    // Uncheck insights
    if (includeInsightsCheckbox.checked) {
      await userEvent.click(includeInsightsCheckbox);
    }
    
    // Save options
    const saveButton = screen.getByText('Save Options');
    await userEvent.click(saveButton);
    
    // Verify options are applied
    expect(screen.getByText('Charts: Yes')).toBeInTheDocument();
    expect(screen.getByText('Insights: No')).toBeInTheDocument();
  });

  it('should allow scheduling batch report generation', async () => {
    // Mock Date.now() to return a fixed timestamp
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => new Date('2023-03-15T10:00:00Z').getTime());
    
    render(
      <QueryClientProvider client={queryClient}>
        <BatchReportGenerator />
      </QueryClientProvider>
    );

    // Wait for valuations to load
    await waitFor(() => {
      expect(screen.getByText('Valuation 1')).toBeInTheDocument();
    });

    // Select valuations
    const checkbox1 = screen.getByLabelText('Select Valuation 1');
    const checkbox2 = screen.getByLabelText('Select Valuation 2');
    await userEvent.click(checkbox1);
    await userEvent.click(checkbox2);
    
    // Schedule for later
    const scheduleOption = screen.getByLabelText('Schedule for later');
    await userEvent.click(scheduleOption);
    
    // Set date and time
    const dateInput = screen.getByLabelText('Schedule Date');
    const timeInput = screen.getByLabelText('Schedule Time');
    
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2023-03-16');
    
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '14:00');
    
    // Generate reports
    const generateButton = screen.getByText('Schedule Reports');
    await userEvent.click(generateButton);
    
    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText(/Reports scheduled for/)).toBeInTheDocument();
    });
    
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should generate reports immediately when requested', async () => {
    const { DataExportService } = require('@/services/DataExportService');
    
    render(
      <QueryClientProvider client={queryClient}>
        <BatchReportGenerator />
      </QueryClientProvider>
    );

    // Wait for valuations to load
    await waitFor(() => {
      expect(screen.getByText('Valuation 1')).toBeInTheDocument();
    });

    // Select a valuation
    const checkbox1 = screen.getByLabelText('Select Valuation 1');
    await userEvent.click(checkbox1);
    
    // Generate immediately
    const generateNowOption = screen.getByLabelText('Generate now');
    await userEvent.click(generateNowOption);
    
    // Generate reports
    const generateButton = screen.getByText('Generate Reports');
    await userEvent.click(generateButton);
    
    // Should call batchExport
    await waitFor(() => {
      expect(DataExportService.batchExport).toHaveBeenCalled();
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Reports generated successfully!')).toBeInTheDocument();
    });
  });

  it('should handle errors during report generation', async () => {
    const { DataExportService } = require('@/services/DataExportService');
    DataExportService.batchExport.mockRejectedValueOnce(new Error('Export failed'));
    
    render(
      <QueryClientProvider client={queryClient}>
        <BatchReportGenerator />
      </QueryClientProvider>
    );

    // Wait for valuations to load
    await waitFor(() => {
      expect(screen.getByText('Valuation 1')).toBeInTheDocument();
    });

    // Select a valuation
    const checkbox1 = screen.getByLabelText('Select Valuation 1');
    await userEvent.click(checkbox1);
    
    // Generate reports
    const generateButton = screen.getByText('Generate Reports');
    await userEvent.click(generateButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Error generating reports: Export failed')).toBeInTheDocument();
    });
  });
});