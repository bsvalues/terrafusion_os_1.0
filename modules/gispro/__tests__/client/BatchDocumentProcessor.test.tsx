import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchDocumentProcessor } from '@/components/documents/batch-document-processor';
import { useDocumentClassifier } from '@/hooks/use-document-classifier';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Mock document classifier hook
jest.mock('@/hooks/use-document-classifier', () => ({
  useDocumentClassifier: jest.fn(),
}));

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

// Mock query client
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('BatchDocumentProcessor Component', () => {
  const mockWorkflowId = 123;
  const mockOnComplete = jest.fn();
  
  // Mock files
  const createMockFiles = (count: number) => {
    const files: File[] = [];
    for (let i = 0; i < count; i++) {
      files.push(
        new File(['test content'], `document-${i + 1}.pdf`, { type: 'application/pdf' })
      );
    }
    return files;
  };
  
  // Setup mocks
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock document classifier hook
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn().mockImplementation((file) => 
        Promise.resolve({
          id: Math.floor(Math.random() * 1000),
          name: file.name,
          documentType: 'boundary_line_adjustment',
          confidence: 0.85,
        })
      ),
      isUploading: false,
    });
    
    // Mock batch tag mutation
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });
  
  test('should allow selecting multiple files for batch processing', async () => {
    render(
      <BatchDocumentProcessor 
        workflowId={mockWorkflowId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Get file input
    const fileInput = screen.getByLabelText(/Select files/i);
    
    // Create mock files
    const mockFiles = createMockFiles(3);
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: mockFiles,
    });
    
    fireEvent.change(fileInput);
    
    // Check if files are displayed in the queue
    await waitFor(() => {
      expect(screen.getByText(/document-1.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/document-2.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/document-3.pdf/i)).toBeInTheDocument();
    });
  });
  
  test('should process files in batch and show progress', async () => {
    const uploadWithClassificationMock = jest.fn()
      .mockResolvedValueOnce({
        id: 1,
        name: 'document-1.pdf',
        documentType: 'boundary_line_adjustment',
        confidence: 0.85,
      })
      .mockResolvedValueOnce({
        id: 2,
        name: 'document-2.pdf',
        documentType: 'plat_map',
        confidence: 0.92,
      });
    
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: uploadWithClassificationMock,
      isUploading: false,
    });
    
    render(
      <BatchDocumentProcessor 
        workflowId={mockWorkflowId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Get file input and select files
    const fileInput = screen.getByLabelText(/Select files/i);
    const mockFiles = createMockFiles(2);
    
    Object.defineProperty(fileInput, 'files', {
      value: mockFiles,
    });
    
    fireEvent.change(fileInput);
    
    // Start processing
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Check for processing state
    await waitFor(() => {
      expect(screen.getByText(/Processing/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Verify all files were processed
    await waitFor(() => {
      expect(uploadWithClassificationMock).toHaveBeenCalledTimes(2);
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
  
  test('should handle file processing errors', async () => {
    // Mock one file failing
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn()
        .mockResolvedValueOnce({
          id: 1,
          name: 'document-1.pdf',
          documentType: 'deed',
          confidence: 0.85,
        })
        .mockRejectedValueOnce(new Error('Upload failed')),
      isUploading: false,
    });
    
    render(
      <BatchDocumentProcessor 
        workflowId={mockWorkflowId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Get file input and select files
    const fileInput = screen.getByLabelText(/Select files/i);
    const mockFiles = createMockFiles(2);
    
    Object.defineProperty(fileInput, 'files', {
      value: mockFiles,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Verify error state
    await waitFor(() => {
      expect(screen.getByText(/document-2.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    });
  });
  
  test('should allow batch tagging of processed documents', async () => {
    const batchTagMutationMock = jest.fn().mockResolvedValue({});
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: batchTagMutationMock,
      isPending: false,
    });
    
    // Mock successful uploads
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn().mockImplementation((file) => 
        Promise.resolve({
          id: Math.floor(Math.random() * 1000),
          name: file.name,
          documentType: 'plat_map',
          confidence: 0.85,
        })
      ),
      isUploading: false,
    });
    
    render(
      <BatchDocumentProcessor 
        workflowId={mockWorkflowId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Get file input and select files
    const fileInput = screen.getByLabelText(/Select files/i);
    const mockFiles = createMockFiles(3);
    
    Object.defineProperty(fileInput, 'files', {
      value: mockFiles,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText(/Apply Tags/i)).toBeInTheDocument();
    });
    
    // Apply batch tags
    fireEvent.click(screen.getByText(/Apply Tags/i));
    
    await waitFor(() => {
      expect(batchTagMutationMock).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});