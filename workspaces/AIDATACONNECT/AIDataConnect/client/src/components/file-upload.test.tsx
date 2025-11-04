import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from './file-upload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('FileUpload Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderFileUpload = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FileUpload />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the file upload component', () => {
    renderFileUpload();
    
    expect(screen.getByText(/Upload Files/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop files here or click to browse/i)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    renderFileUpload();
    
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
    const dropzone = screen.getByText(/Drag and drop files here or click to browse/i).closest('div');
    
    // Mock the FormData used in the upload
    const formDataMock = {
      append: vi.fn(),
    };
    global.FormData = vi.fn(() => formDataMock as any);
    
    // Mock successful file upload
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'test-file.txt', success: true }),
    });
    
    // Add file to dropzone
    if (dropzone) {
      const inputEl = dropzone.querySelector('input');
      if (inputEl) {
        await userEvent.upload(inputEl, file);
      }
    }
    
    await waitFor(() => {
      expect(formDataMock.append).toHaveBeenCalledWith('file', file);
      expect(global.fetch).toHaveBeenCalledWith('/api/files/upload', expect.any(Object));
    });
  });

  it('shows error when uploading invalid file type', async () => {
    renderFileUpload();
    
    const file = new File(['file content'], 'test-file.exe', { type: 'application/x-msdownload' });
    const dropzone = screen.getByText(/Drag and drop files here or click to browse/i).closest('div');
    
    // Add file to dropzone
    if (dropzone) {
      const inputEl = dropzone.querySelector('input');
      if (inputEl) {
        await userEvent.upload(inputEl, file);
      }
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('shows error when file is too large', async () => {
    renderFileUpload();
    
    // Create a large file (11MB)
    const largeFileContent = new ArrayBuffer(11 * 1024 * 1024);
    const file = new File([largeFileContent], 'large-file.txt', { type: 'text/plain' });
    
    // Mock file.size to return a large size
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    
    const dropzone = screen.getByText(/Drag and drop files here or click to browse/i).closest('div');
    
    // Add file to dropzone
    if (dropzone) {
      const inputEl = dropzone.querySelector('input');
      if (inputEl) {
        await userEvent.upload(inputEl, file);
      }
    }
    
    await waitFor(() => {
      expect(screen.getByText(/File size exceeds the 10MB limit/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('handles server error during upload', async () => {
    renderFileUpload();
    
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
    const dropzone = screen.getByText(/Drag and drop files here or click to browse/i).closest('div');
    
    // Mock the FormData used in the upload
    const formDataMock = {
      append: vi.fn(),
    };
    global.FormData = vi.fn(() => formDataMock as any);
    
    // Mock fetch to return error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });
    
    // Add file to dropzone
    if (dropzone) {
      const inputEl = dropzone.querySelector('input');
      if (inputEl) {
        await userEvent.upload(inputEl, file);
      }
    }
    
    await waitFor(() => {
      expect(formDataMock.append).toHaveBeenCalledWith('file', file);
      expect(global.fetch).toHaveBeenCalledWith('/api/files/upload', expect.any(Object));
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });
});