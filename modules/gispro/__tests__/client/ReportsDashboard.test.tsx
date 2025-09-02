import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportsDashboard } from '@/components/reporting/reports-dashboard';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn().mockReturnValue({
    invalidateQueries: jest.fn()
  })
}));

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

describe('ReportsDashboard Integration', () => {
  const mockReports = [
    {
      id: 1001,
      name: 'SM00 Report - Jan 2023',
      templateId: 1,
      templateName: 'SM00 Report',
      createdAt: new Date('2023-01-15T10:30:00Z').toISOString(),
      parameters: {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      },
      status: 'completed',
      generatedBy: 'admin'
    },
    {
      id: 1002,
      name: 'Parcel Changes Report - Q1 2023',
      templateId: 2,
      templateName: 'Parcel Changes Report',
      createdAt: new Date('2023-04-05T14:20:00Z').toISOString(),
      parameters: {
        startDate: '2023-01-01',
        endDate: '2023-03-31'
      },
      status: 'completed',
      generatedBy: 'admin'
    },
    {
      id: 1003,
      name: 'Document Classification Report - Mar 2023',
      templateId: 3,
      templateName: 'Document Classification Report',
      createdAt: new Date('2023-04-01T09:15:00Z').toISOString(),
      parameters: {
        startDate: '2023-03-01',
        endDate: '2023-03-31'
      },
      status: 'failed',
      generatedBy: 'manager',
      error: 'Database connection error'
    }
  ];

  const mockTemplates = [
    { id: 1, name: 'SM00 Report', description: 'Summary of workflow activities' },
    { id: 2, name: 'Parcel Changes Report', description: 'Tracks boundary adjustments and ownership changes' },
    { id: 3, name: 'Document Classification Report', description: 'Statistics on document types processed' }
  ];

  const mockSchedules = [
    { 
      id: 101, 
      templateId: 1, 
      templateName: 'SM00 Report',
      schedule: 'WEEKLY', 
      dayOfWeek: 1, // Monday
      hour: 8, 
      minute: 0,
      parameters: { 
        range: 'LAST_WEEK' 
      },
      active: true,
      recipients: ['admin@example.com']
    }
  ];

  beforeEach(() => {
    // Setup default mock implementations
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      // Mock reports data
      if (queryKey[0] === '/api/reports') {
        return {
          data: mockReports,
          isLoading: false,
          error: null,
        };
      }
      
      // Mock report templates data
      if (queryKey[0] === '/api/reports/templates') {
        return {
          data: mockTemplates,
          isLoading: false,
          error: null,
        };
      }
      
      // Mock report schedules data
      if (queryKey[0] === '/api/reports/schedules') {
        return {
          data: mockSchedules,
          isLoading: false,
          error: null,
        };
      }
      
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    // Mock mutations
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      isPending: false,
    });
  });

  test('renders all dashboard tabs correctly', async () => {
    render(<ReportsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Reports Dashboard')).toBeInTheDocument();
    });
    
    // Verify tabs exist
    expect(screen.getByText('Recent Reports')).toBeInTheDocument();
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
  });

  test('displays recent reports in the reports list', async () => {
    render(<ReportsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('SM00 Report - Jan 2023')).toBeInTheDocument();
      expect(screen.getByText('Parcel Changes Report - Q1 2023')).toBeInTheDocument();
      expect(screen.getByText('Document Classification Report - Mar 2023')).toBeInTheDocument();
    });
    
    // Verify status indicators
    expect(screen.getAllByText('Completed').length).toBe(2);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  test('allows viewing a report', async () => {
    render(<ReportsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('SM00 Report - Jan 2023')).toBeInTheDocument();
    });
    
    // Click view button for first report
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    // Verify report viewer is shown
    await waitFor(() => {
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });
  });

  test('navigates to generate report tab and shows form', async () => {
    render(<ReportsDashboard />);
    
    // Click on Generate Report tab
    fireEvent.click(screen.getByText('Generate Report'));
    
    // Verify report generator form is shown
    await waitFor(() => {
      expect(screen.getByText('Create New Report')).toBeInTheDocument();
      expect(screen.getByText('Select a report template to begin')).toBeInTheDocument();
    });
    
    // Verify templates are available
    expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    expect(screen.getByText('Parcel Changes Report')).toBeInTheDocument();
    expect(screen.getByText('Document Classification Report')).toBeInTheDocument();
  });

  test('navigates to scheduled reports tab and shows schedules', async () => {
    render(<ReportsDashboard />);
    
    // Click on Scheduled Reports tab
    fireEvent.click(screen.getByText('Scheduled Reports'));
    
    // Verify scheduled reports are shown
    await waitFor(() => {
      expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Monday at 08:00')).toBeInTheDocument();
    });
    
    // Verify create schedule button is available
    expect(screen.getByText('Create New Schedule')).toBeInTheDocument();
  });

  test('end-to-end flow: generate and view a report', async () => {
    const mockGenerateReport = jest.fn().mockResolvedValue({
      id: 1004,
      name: 'SM00 Report - Current Month',
      templateId: 1,
      templateName: 'SM00 Report',
      createdAt: new Date().toISOString(),
      parameters: {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      },
      status: 'completed',
      generatedBy: 'admin'
    });
    
    (useMutation as jest.Mock).mockReturnValueOnce({
      mutateAsync: mockGenerateReport,
      isPending: false,
    });
    
    render(<ReportsDashboard />);
    
    // Click on Generate Report tab
    fireEvent.click(screen.getByText('Generate Report'));
    
    // Wait for report generator to load
    await waitFor(() => {
      expect(screen.getByText('Create New Report')).toBeInTheDocument();
    });
    
    // Select a template
    fireEvent.click(screen.getByText('SM00 Report'));
    
    // Fill in parameters
    await waitFor(() => {
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Start Date'), { 
      target: { value: '2023-01-01' }
    });
    
    fireEvent.change(screen.getByLabelText('End Date'), { 
      target: { value: '2023-01-31' }
    });
    
    // Generate report
    fireEvent.click(screen.getByText('Generate Report'));
    
    // Verify report generation was called with correct params
    await waitFor(() => {
      expect(mockGenerateReport).toHaveBeenCalledWith({
        templateId: 1,
        parameters: {
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      });
    });
    
    // Verify success message and redirection to view newly created report
    await waitFor(() => {
      expect(screen.getByText('Report Generated Successfully')).toBeInTheDocument();
    });
    
    // System should navigate to report viewer
    await waitFor(() => {
      expect(screen.getByText('Report Details')).toBeInTheDocument();
      expect(screen.getByText('SM00 Report - Current Month')).toBeInTheDocument();
    });
  });

  test('allows exporting a report in different formats', async () => {
    // Create spy for window.open for export download
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<ReportsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('SM00 Report - Jan 2023')).toBeInTheDocument();
    });
    
    // Click export button for first report
    const exportButtons = screen.getAllByText('Export');
    fireEvent.click(exportButtons[0]);
    
    // Verify export options are shown
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });
    
    // Select PDF export
    fireEvent.click(screen.getByText('PDF'));
    
    // Verify export was triggered
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled();
    });
    
    // Restore the spy
    openSpy.mockRestore();
  });

  test('handles failed reports appropriately', async () => {
    render(<ReportsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Document Classification Report - Mar 2023')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
    
    // Find and click the failed report
    fireEvent.click(screen.getByText('Document Classification Report - Mar 2023'));
    
    // Verify error details are shown
    await waitFor(() => {
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText('Database connection error')).toBeInTheDocument();
    });
    
    // Verify retry option is available
    expect(screen.getByText('Retry Report')).toBeInTheDocument();
  });

  test('allows filtering reports by date range and status', async () => {
    render(<ReportsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Filter Reports')).toBeInTheDocument();
    });
    
    // Open filter menu
    fireEvent.click(screen.getByText('Filter Reports'));
    
    // Fill in date filters
    await waitFor(() => {
      expect(screen.getByLabelText('From')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('From'), { 
      target: { value: '2023-01-01' }
    });
    
    fireEvent.change(screen.getByLabelText('To'), { 
      target: { value: '2023-02-01' }
    });
    
    // Select status filter
    fireEvent.click(screen.getByLabelText('Completed'));
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Verify filtered results (mock would be updated in real component)
    await waitFor(() => {
      // In a real component, this would verify the filtered list
      expect(screen.getByText('Filtered Reports')).toBeInTheDocument();
    });
  });
});