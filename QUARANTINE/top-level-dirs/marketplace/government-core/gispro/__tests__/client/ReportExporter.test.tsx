import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportExporter } from '@/components/reporting/report-exporter';

describe('ReportExporter', () => {
  const mockReport = {
    id: 1,
    name: 'Q1 Property Assessment Report',
    templateId: 1,
    templateName: 'Property Assessment Summary',
    status: 'completed',
    createdAt: '2025-03-31T16:30:00Z',
    completedAt: '2025-03-31T16:35:00Z',
    totalRows: 250
  };

  test('renders export options for a completed report', () => {
    render(<ReportExporter report={mockReport} />);
    
    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  test('does not render for non-completed reports', () => {
    const pendingReport = { ...mockReport, status: 'pending', completedAt: undefined };
    render(<ReportExporter report={pendingReport} />);
    
    expect(screen.queryByText('Export Report')).not.toBeInTheDocument();
  });

  test('shows format-specific options when format is selected', () => {
    render(<ReportExporter report={mockReport} />);
    
    const formatSelect = screen.getByLabelText('Export Format');
    
    // Test PDF options
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });
    expect(screen.getByText('PDF Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Page Size')).toBeInTheDocument();
    expect(screen.getByLabelText('Include Page Numbers')).toBeInTheDocument();
    
    // Test Excel options
    fireEvent.change(formatSelect, { target: { value: 'excel' } });
    expect(screen.getByText('Excel Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Include Formulas')).toBeInTheDocument();
  });

  test('validates export options before submission', async () => {
    render(<ReportExporter report={mockReport} />);
    
    // Try to export without selecting any options
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(await screen.findByText('Please select an export format')).toBeInTheDocument();
  });

  test('handles export submission', async () => {
    const mockExport = jest.fn().mockImplementation(() => 
      Promise.resolve({ downloadUrl: '/api/reports/exports/123', filename: 'report.pdf' })
    );
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url === '/api/reports/1/export' && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => mockExport()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.Blob = jest.fn(() => ({}));
    
    const mockAnchorElement = {
      href: '',
      download: '',
      click: jest.fn(),
      remove: jest.fn()
    };
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'a') return mockAnchorElement;
      return {};
    });
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    render(<ReportExporter report={mockReport} />);
    
    const formatSelect = screen.getByLabelText('Export Format');
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });
    
    // Configure some PDF options
    const pageSizeSelect = screen.getByLabelText('Page Size');
    fireEvent.change(pageSizeSelect, { target: { value: 'letter' } });
    
    const pageNumbersCheckbox = screen.getByLabelText('Include Page Numbers');
    fireEvent.click(pageNumbersCheckbox);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith({
        format: 'pdf',
        options: {
          pageSize: 'letter',
          includePageNumbers: true
        }
      });
      expect(mockAnchorElement.click).toHaveBeenCalled();
    });
  });

  test('shows error message when export fails', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Export generation failed' })
      });
    });

    render(<ReportExporter report={mockReport} />);
    
    const formatSelect = screen.getByLabelText('Export Format');
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(await screen.findByText('Export failed: Export generation failed')).toBeInTheDocument();
  });
});