import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportGenerator } from '@/components/reporting/report-generator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('ReportGenerator', () => {
  const queryClient = new QueryClient();
  const mockTemplates = [
    { id: 1, name: 'Property Assessment Summary', description: 'Summary of property assessments' },
    { id: 2, name: 'Parcel Activity Report', description: 'Recent activity on parcels' }
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/reports/templates') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTemplates)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  test('renders report generator interface', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportGenerator />
      </QueryClientProvider>
    );
    
    expect(await screen.findByText('Generate Report')).toBeInTheDocument();
    expect(await screen.findByText('Select Template')).toBeInTheDocument();
    expect(await screen.findByText('Configure Parameters')).toBeInTheDocument();
  });

  test('loads available report templates', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportGenerator />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Property Assessment Summary')).toBeInTheDocument();
      expect(screen.getByText('Parcel Activity Report')).toBeInTheDocument();
    });
  });

  test('displays template-specific parameters when template is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportGenerator />
      </QueryClientProvider>
    );

    const templateSelect = await screen.findByLabelText('Report Template');
    fireEvent.change(templateSelect, { target: { value: '1' } });
    
    expect(await screen.findByText('Report Parameters')).toBeInTheDocument();
  });

  test('validates required parameters before submission', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportGenerator />
      </QueryClientProvider>
    );

    const templateSelect = await screen.findByLabelText('Report Template');
    fireEvent.change(templateSelect, { target: { value: '1' } });
    
    const submitButton = screen.getByText('Generate Report');
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('Required parameters missing')).toBeInTheDocument();
  });

  test('successfully submits report generation request', async () => {
    const mockGenerate = jest.fn().mockImplementation(() => 
      Promise.resolve({ id: 123, status: 'pending' })
    );
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url === '/api/reports' && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => mockGenerate()
        });
      }
      if (url === '/api/reports/templates') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTemplates)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ReportGenerator />
      </QueryClientProvider>
    );
    
    const templateSelect = await screen.findByLabelText('Report Template');
    fireEvent.change(templateSelect, { target: { value: '1' } });
    
    // Fill in required parameters
    const nameInput = screen.getByLabelText('Report Name');
    fireEvent.change(nameInput, { target: { value: 'Test Report' } });
    
    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
    
    const endDateInput = screen.getByLabelText('End Date');
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } });
    
    const submitButton = screen.getByText('Generate Report');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalled();
      expect(screen.getByText('Report generation started')).toBeInTheDocument();
    });
  });
});