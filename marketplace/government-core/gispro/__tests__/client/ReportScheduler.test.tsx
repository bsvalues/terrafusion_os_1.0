import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportScheduler } from '@/components/reporting/report-scheduler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('ReportScheduler', () => {
  const queryClient = new QueryClient();
  const mockTemplates = [
    { id: 1, name: 'Property Assessment Summary', description: 'Summary of property assessments' },
    { id: 2, name: 'Parcel Activity Report', description: 'Recent activity on parcels' }
  ];
  
  const mockSchedules = [
    { 
      id: 1, 
      name: 'Monthly Assessment Report', 
      templateId: 1, 
      frequency: 'monthly',
      dayOfMonth: 1,
      hour: 8,
      minute: 0,
      active: true,
      parameters: { format: 'pdf' },
      createdAt: '2025-01-01T00:00:00Z',
      nextRunAt: '2025-04-01T08:00:00Z'
    }
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/reports/templates') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTemplates)
        });
      }
      if (url === '/api/reports/schedules') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSchedules)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  test('renders report scheduler interface', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportScheduler />
      </QueryClientProvider>
    );
    
    expect(await screen.findByText('Scheduled Reports')).toBeInTheDocument();
    expect(await screen.findByText('Create Schedule')).toBeInTheDocument();
  });

  test('displays existing scheduled reports', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportScheduler />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Monthly Assessment Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Apr 1, 2025')).toBeInTheDocument();
    });
  });

  test('opens create schedule form when button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportScheduler />
      </QueryClientProvider>
    );

    const createButton = await screen.findByText('Create Schedule');
    fireEvent.click(createButton);
    
    expect(await screen.findByText('New Scheduled Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Schedule Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Report Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
  });

  test('validates schedule form inputs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportScheduler />
      </QueryClientProvider>
    );

    const createButton = await screen.findByText('Create Schedule');
    fireEvent.click(createButton);
    
    const saveButton = screen.getByText('Save Schedule');
    fireEvent.click(saveButton);
    
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Template selection is required')).toBeInTheDocument();
  });

  test('handles frequency-specific form fields', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportScheduler />
      </QueryClientProvider>
    );

    const createButton = await screen.findByText('Create Schedule');
    fireEvent.click(createButton);
    
    const frequencySelect = screen.getByLabelText('Frequency');
    
    // Test for monthly options
    fireEvent.change(frequencySelect, { target: { value: 'monthly' } });
    expect(await screen.findByLabelText('Day of Month')).toBeInTheDocument();
    
    // Test for weekly options
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });
    expect(await screen.findByLabelText('Day of Week')).toBeInTheDocument();
    
    // Test for daily options - shouldn't have extra fields
    fireEvent.change(frequencySelect, { target: { value: 'daily' } });
    expect(screen.queryByLabelText('Day of Month')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Day of Week')).not.toBeInTheDocument();
  });

  test('successfully creates a new scheduled report', async () => {
    const mockCreate = jest.fn().mockImplementation(() => 
      Promise.resolve({ id: 2, name: 'New Weekly Report' })
    );
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url === '/api/reports/schedules' && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => mockCreate()
        });
      }
      if (url === '/api/reports/templates') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTemplates)
        });
      }
      if (url === '/api/reports/schedules') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSchedules)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ReportScheduler />
      </QueryClientProvider>
    );
    
    const createButton = await screen.findByText('Create Schedule');
    fireEvent.click(createButton);
    
    // Fill required fields
    const nameInput = screen.getByLabelText('Schedule Name');
    fireEvent.change(nameInput, { target: { value: 'New Weekly Report' } });
    
    const templateSelect = screen.getByLabelText('Report Template');
    fireEvent.change(templateSelect, { target: { value: '2' } });
    
    const frequencySelect = screen.getByLabelText('Frequency');
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });
    
    const daySelect = screen.getByLabelText('Day of Week');
    fireEvent.change(daySelect, { target: { value: '1' } });
    
    const hourInput = screen.getByLabelText('Hour');
    fireEvent.change(hourInput, { target: { value: '9' } });
    
    const minuteInput = screen.getByLabelText('Minute');
    fireEvent.change(minuteInput, { target: { value: '30' } });
    
    const saveButton = screen.getByText('Save Schedule');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(screen.getByText('Schedule created successfully')).toBeInTheDocument();
    });
  });
});