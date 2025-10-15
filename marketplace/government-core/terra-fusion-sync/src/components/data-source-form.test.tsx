import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSourceForm } from './data-source-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Mock API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

const renderForm = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <DataSourceForm />
    </QueryClientProvider>
  );
};

describe('DataSourceForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderForm();

    // Try to submit without filling any fields
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Check for validation error messages
    expect(await screen.findByText('Source name is required')).toBeInTheDocument();
    expect(await screen.findByText('Server name/IP is required')).toBeInTheDocument();
    expect(await screen.findByText('Database name is required')).toBeInTheDocument();
  });

  it('validates SQL credentials when not using trusted connection', async () => {
    const user = userEvent.setup();
    renderForm();

    // Fill required fields except credentials
    await user.type(screen.getByTestId('name-input'), 'Test DB');
    await user.type(screen.getByTestId('host-input'), 'localhost');
    await user.type(screen.getByTestId('database-input'), 'testdb');

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Check for credential validation error
    expect(await screen.findByText('Username and password are required when not using Windows Authentication')).toBeInTheDocument();
  });

  it('validates port number range', async () => {
    const user = userEvent.setup();
    renderForm();

    // Try invalid port number
    const portInput = screen.getByTestId('port-input');
    await user.clear(portInput);
    await user.type(portInput, '999999');

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Check for port validation error
    expect(await screen.findByText('Port must be between 1 and 65535')).toBeInTheDocument();
  });

  it('accepts valid form submission', async () => {
    const mockApiResponse = { ok: true, json: () => Promise.resolve({ id: 1 }) };
    (apiRequest as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockApiResponse);

    const user = userEvent.setup();
    renderForm();

    // Fill all required fields with valid data
    await user.type(screen.getByTestId('name-input'), 'Test DB');
    await user.type(screen.getByTestId('host-input'), 'localhost');
    await user.type(screen.getByTestId('database-input'), 'testdb');
    await user.type(screen.getByTestId('username-input'), 'testuser');
    await user.type(screen.getByTestId('password-input'), 'testpass');

    const portInput = screen.getByTestId('port-input');
    await user.clear(portInput);
    await user.type(portInput, '1433');

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Verify API call with valid data
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/data-sources',
        expect.objectContaining({
          name: 'Test DB',
          type: 'sql',
          config: {
            type: 'sql',
            config: expect.objectContaining({
              host: 'localhost',
              database: 'testdb',
              port: 1433,
              username: 'testuser',
              password: 'testpass',
              trustedConnection: false
            })
          }
        })
      );
    });

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
});