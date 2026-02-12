import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransformationSuggestions } from './transformation-suggestions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('TransformationSuggestions Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockData = {
    columns: ['id', 'name', 'age', 'email'],
    rows: [
      { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', age: 40, email: 'bob@example.com' }
    ]
  };

  const mockOnApply = vi.fn();

  const renderTransformationSuggestions = (data = mockData) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TransformationSuggestions data={data} onApply={mockOnApply} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the transformation suggestions component', () => {
    renderTransformationSuggestions();
    
    expect(screen.getByText(/AI-Suggested Transformations/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument();
  });

  it('fetches suggestions from the API', async () => {
    // Mock successful suggestions fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          name: 'Format Names',
          description: 'Convert names to title case',
          transformation: 'data.map(row => ({ ...row, name: row.name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") }))'
        },
        {
          name: 'Add Full Name',
          description: 'Create a full_name field from first and last name',
          transformation: 'data.map(row => ({ ...row, full_name: row.name }))'
        }
      ]),
    });
    
    renderTransformationSuggestions();
    
    await waitFor(() => {
      expect(screen.getByText('Format Names')).toBeInTheDocument();
      expect(screen.getByText('Add Full Name')).toBeInTheDocument();
      expect(screen.getByText('Convert names to title case')).toBeInTheDocument();
    });
    
    // Verify API call was made
    expect(global.fetch).toHaveBeenCalledWith('/api/ai/suggest-transformations', expect.any(Object));
  });

  it('handles no suggestions case', async () => {
    // Mock empty suggestions response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    
    renderTransformationSuggestions();
    
    await waitFor(() => {
      expect(screen.getByText(/No suggestions available/i)).toBeInTheDocument();
    });
  });

  it('displays error when suggestions fetch fails', async () => {
    // Mock failed suggestions fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Failed to fetch suggestions' }),
    });
    
    renderTransformationSuggestions();
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading suggestions/i)).toBeInTheDocument();
    });
  });

  it('calls onApply when a suggestion is applied', async () => {
    // Mock successful suggestions fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          name: 'Format Names',
          description: 'Convert names to title case',
          transformation: 'data.map(row => ({ ...row, name: row.name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") }))'
        }
      ]),
    });
    
    renderTransformationSuggestions();
    
    await waitFor(() => {
      expect(screen.getByText('Format Names')).toBeInTheDocument();
    });
    
    // Click on the Apply button
    const applyButton = screen.getByRole('button', { name: /Apply/i });
    fireEvent.click(applyButton);
    
    // Verify onApply was called with the correct transformation code
    expect(mockOnApply).toHaveBeenCalledWith(
      'data.map(row => ({ ...row, name: row.name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") }))'
    );
  });

  it('shows transformation code preview when hovering over a suggestion', async () => {
    // Mock successful suggestions fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          name: 'Format Names',
          description: 'Convert names to title case',
          transformation: 'data.map(row => ({ ...row, name: row.name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") }))'
        }
      ]),
    });
    
    renderTransformationSuggestions();
    
    await waitFor(() => {
      expect(screen.getByText('Format Names')).toBeInTheDocument();
    });
    
    // Mouse over the suggestion
    const suggestion = screen.getByText('Format Names').closest('div');
    if (suggestion) {
      fireEvent.mouseOver(suggestion);
    }
    
    // Verify code preview is shown
    await waitFor(() => {
      expect(screen.getByText(/data.map\(row =>/i)).toBeInTheDocument();
    });
  });
});