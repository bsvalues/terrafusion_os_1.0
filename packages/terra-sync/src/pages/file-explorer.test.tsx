import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileExplorer from './file-explorer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock FileUpload and FilePreview components
vi.mock('../components/file-upload', () => ({
  FileUpload: () => <div data-testid="file-upload">File Upload Component</div>,
}));

vi.mock('../components/file-preview', () => ({
  FilePreview: ({ file }: { file: any }) => (
    <div data-testid="file-preview">
      File Preview for: {file.name}
    </div>
  ),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('FileExplorer Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderFileExplorer = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FileExplorer />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the file explorer with title and upload component', () => {
    renderFileExplorer();
    
    expect(screen.getByRole('heading', { name: /File Explorer/i })).toBeInTheDocument();
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('displays files when data is available', async () => {
    // Mock successful files fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'document.pdf', 
          type: 'application/pdf',
          path: '/uploads/document.pdf',
          size: 1024 * 1024,
          userId: 1,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          processingStatus: 'completed',
          metadata: {}
        },
        { 
          id: 2, 
          name: 'data.csv', 
          type: 'text/csv',
          path: '/uploads/data.csv',
          size: 512 * 1024,
          userId: 1,
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z',
          processingStatus: 'completed',
          metadata: {}
        }
      ]),
    });
    
    renderFileExplorer();
    
    await waitFor(() => {
      expect(screen.getByText(/document.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/data.csv/i)).toBeInTheDocument();
    });
  });

  it('handles empty files list', async () => {
    // Mock empty files response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    
    renderFileExplorer();
    
    await waitFor(() => {
      expect(screen.getByText(/No files found/i)).toBeInTheDocument();
    });
  });

  it('displays error message when files fetch fails', async () => {
    // Mock failed files fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Failed to fetch files' }),
    });
    
    renderFileExplorer();
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading files/i)).toBeInTheDocument();
    });
  });

  it('shows file details when file is selected', async () => {
    // Mock successful files fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'document.pdf', 
          type: 'application/pdf',
          path: '/uploads/document.pdf',
          size: 1024 * 1024,
          userId: 1,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          processingStatus: 'completed',
          metadata: {}
        },
        { 
          id: 2, 
          name: 'data.csv', 
          type: 'text/csv',
          path: '/uploads/data.csv',
          size: 512 * 1024,
          userId: 1,
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z',
          processingStatus: 'completed',
          metadata: {}
        }
      ]),
    });
    
    renderFileExplorer();
    
    await waitFor(() => {
      expect(screen.getByText(/document.pdf/i)).toBeInTheDocument();
    });
    
    // Click on the first file
    const firstFile = screen.getByText(/document.pdf/i);
    fireEvent.click(firstFile);
    
    // Check if file details are shown
    expect(screen.getByTestId('file-preview')).toBeInTheDocument();
    expect(screen.getByText(/File Preview for: document.pdf/i)).toBeInTheDocument();
  });

  it('allows file deletion', async () => {
    // Mock successful files fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'document.pdf', 
          type: 'application/pdf',
          path: '/uploads/document.pdf',
          size: 1024 * 1024,
          userId: 1,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          processingStatus: 'completed',
          metadata: {}
        }
      ]),
    });
    
    // Mock successful file deletion
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    
    // Mock successful files refresh after deletion
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    
    renderFileExplorer();
    
    await waitFor(() => {
      expect(screen.getByText(/document.pdf/i)).toBeInTheDocument();
    });
    
    // Click on the delete button for the file
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      // Verify the delete API was called
      expect(global.fetch).toHaveBeenCalledWith('/api/files/1', expect.objectContaining({
        method: 'DELETE'
      }));
      
      // Verify the empty state is shown after deletion
      expect(screen.getByText(/No files found/i)).toBeInTheDocument();
    });
  });
});