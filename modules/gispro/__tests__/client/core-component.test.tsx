import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportExporter } from '@/components/reporting/report-exporter';
import { ReportScheduler } from '@/components/reporting/report-scheduler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks and components that won't be directly tested
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock window.open for export tests
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen,
});

// Create a custom render function that includes providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Mock API responses for testing
const mockReport = {
  id: 1,
  name: "Test Report",
  templateId: 1,
  templateName: "Test Template",
  status: "completed" as const,
  createdAt: "2025-04-01T12:00:00Z",
  completedAt: "2025-04-01T12:05:00Z",
  totalRows: 100,
};

const mockExportStatus = {
  available: true,
  formats: ["pdf", "csv", "excel", "geojson"],
  lastExport: {
    format: "pdf",
    exportedAt: "2025-04-01T10:00:00Z",
  },
};

describe('ReportExporter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/exports/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExportStatus),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  test('renders export format options correctly', async () => {
    renderWithProviders(<ReportExporter report={mockReport} />);
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking export availability...')).not.toBeInTheDocument();
    });
    
    // Check if all format options are rendered
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('GeoJSON')).toBeInTheDocument();
  });

  test('handles export action correctly', async () => {
    renderWithProviders(<ReportExporter report={mockReport} />);
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking export availability...')).not.toBeInTheDocument();
    });
    
    // Click on the download button
    const downloadButton = screen.getByText(/Download PDF/i);
    fireEvent.click(downloadButton);
    
    // Verify window.open was called with correct URL
    expect(mockOpen).toHaveBeenCalledWith(`/api/reports/${mockReport.id}/exports/pdf`, '_blank');
  });

  test('shows appropriate UI when exports are not available', async () => {
    // Override fetch mock for this test
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ available: false }),
      });
    });
    
    renderWithProviders(<ReportExporter report={mockReport} />);
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking export availability...')).not.toBeInTheDocument();
    });
    
    // Check if unavailable message is shown
    expect(screen.getByText('Exports Not Available')).toBeInTheDocument();
  });
});

describe('ReportScheduler Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/report-templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: "Monthly Revenue", description: "Monthly revenue report" },
            { id: 2, name: "Quarterly Tax", description: "Quarterly tax analysis" }
          ]),
        });
      } else if (url.includes('/api/report-schedules')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              name: "Monthly Revenue Schedule",
              templateId: 1,
              templateName: "Monthly Revenue",
              frequency: "monthly",
              dayOfMonth: 1,
              hour: 9,
              minute: 0,
              parameters: {},
              active: true,
              nextRun: "2025-05-01T09:00:00Z",
              lastRun: "2025-04-01T09:00:00Z"
            }
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  test('renders schedules list correctly', async () => {
    renderWithProviders(<ReportScheduler />);
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });
    
    // Check if schedule is displayed
    expect(screen.getByText('Monthly Revenue Schedule')).toBeInTheDocument();
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
  });

  test('displays new schedule form when button is clicked', async () => {
    renderWithProviders(<ReportScheduler />);
    
    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });
    
    // Click new schedule button
    const newButton = screen.getByText('New Schedule');
    fireEvent.click(newButton);
    
    // Check if form is shown
    await waitFor(() => {
      expect(screen.getByText('Create Schedule')).toBeInTheDocument();
    });
    
    // Check form elements
    expect(screen.getByText('Schedule Name')).toBeInTheDocument();
    expect(screen.getByText('Report Template')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
  });
});

// Additional tests for checking improvements will be added here
describe('Core GIS Components Integration', () => {
  // This will test that components work together properly
  test('placeholder test for future integration tests', () => {
    expect(true).toBe(true);
  });
});