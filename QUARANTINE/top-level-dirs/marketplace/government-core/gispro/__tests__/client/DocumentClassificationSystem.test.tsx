import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedDocumentManagement } from '@/components/documents/enhanced-document-management';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DocumentType } from '@shared/document-types';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock document classifier hook
jest.mock('@/hooks/use-document-classifier', () => ({
  useDocumentClassifier: jest.fn().mockReturnValue({
    uploadWithClassification: jest.fn().mockResolvedValue({
      document: {
        id: 3,
        name: 'new_document.pdf',
        type: 'deed',
      },
      classification: {
        documentType: DocumentType.DEED,
        confidence: 0.85,
        documentTypeLabel: 'Deed',
      }
    }),
    isUploading: false,
    isProcessing: false,
  }),
}));

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

describe('Document Classification System Integration', () => {
  const mockWorkflow = {
    id: 1,
    title: 'Test Workflow',
    type: 'bla',
    status: 'in_progress',
  };

  const mockDocuments = [
    {
      id: 1,
      workflowId: 1,
      name: 'Survey.pdf',
      type: 'survey',
      contentType: 'application/pdf',
      uploadedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      classification: {
        documentType: 'survey',
        confidence: 0.92,
        wasManuallyClassified: false,
        classifiedAt: new Date(Date.now() - 172800000).toISOString(),
      }
    },
    {
      id: 2,
      workflowId: 1,
      name: 'Deed.pdf',
      type: 'deed',
      contentType: 'application/pdf',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      classification: {
        documentType: 'deed',
        confidence: 0.78,
        wasManuallyClassified: false,
        classifiedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    }
  ];

  const mockVersions = {
    1: [
      {
        id: 1,
        documentId: 1,
        versionNumber: 1,
        contentHash: 'abc123',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        notes: 'Initial version',
      }
    ],
    2: [
      {
        id: 2,
        documentId: 2,
        versionNumber: 1,
        contentHash: 'def456',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        notes: 'Initial version',
      }
    ]
  };

  const mockParcels = {
    1: [
      {
        id: 1,
        parcelNumber: '123456-0001',
        address: '123 Main St',
        owner: 'Jane Smith',
      }
    ],
    2: [
      {
        id: 1,
        parcelNumber: '123456-0001',
        address: '123 Main St',
        owner: 'Jane Smith',
      },
      {
        id: 2,
        parcelNumber: '123456-0002',
        address: '125 Main St',
        owner: 'John Doe',
      }
    ]
  };

  beforeEach(() => {
    // Setup default mock implementations
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      // Mock documents for workflow
      if (queryKey[0] === `/api/workflows/${mockWorkflow.id}/documents`) {
        return {
          data: mockDocuments,
          isLoading: false,
          error: null,
        };
      }
      
      // Mock document versions
      if (queryKey[0]?.startsWith('/api/documents/') && queryKey[0]?.endsWith('/versions')) {
        const docId = parseInt(queryKey[0].split('/')[3]);
        return {
          data: mockVersions[docId] || [],
          isLoading: false,
          error: null,
        };
      }
      
      // Mock parcels linked to document
      if (queryKey[0]?.startsWith('/api/documents/') && queryKey[0]?.endsWith('/parcels')) {
        const docId = parseInt(queryKey[0].split('/')[3]);
        return {
          data: mockParcels[docId] || [],
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

    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      isPending: false,
    });
  });

  test('should complete end-to-end document management workflow', async () => {
    render(<EnhancedDocumentManagement workflow={mockWorkflow} />);
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText(/Survey\.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Deed\.pdf/i)).toBeInTheDocument();
    });
    
    // Open batch upload
    fireEvent.click(screen.getByText(/Batch Upload/i));
    
    // Add files to batch
    const file1 = new File(['test content'], 'new_document.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload files/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file1],
    });
    
    fireEvent.change(fileInput);
    
    // Process files
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Check if new document is added
    await waitFor(() => {
      expect(screen.getByText(/new_document\.pdf/i)).toBeInTheDocument();
    });
    
    // View document details
    fireEvent.click(screen.getByText(/Survey\.pdf/i));
    
    // Check if document details are displayed
    await waitFor(() => {
      expect(screen.getByText(/Document Details/i)).toBeInTheDocument();
      expect(screen.getByText(/survey/i)).toBeInTheDocument();
      expect(screen.getByText(/92%/i)).toBeInTheDocument();
    });
    
    // Check linked parcels
    await waitFor(() => {
      expect(screen.getByText(/Linked Parcels/i)).toBeInTheDocument();
      expect(screen.getByText(/123456-0001/i)).toBeInTheDocument();
    });
    
    // Check version history
    await waitFor(() => {
      expect(screen.getByText(/Version History/i)).toBeInTheDocument();
      expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Initial version/i)).toBeInTheDocument();
    });
  });

  test('should maintain data integrity across operations', async () => {
    // Mock version update mutation
    const mockCreateVersionMutation = jest.fn().mockResolvedValue({
      id: 3,
      documentId: 1,
      versionNumber: 2,
      contentHash: 'ghi789',
      createdAt: new Date().toISOString(),
      notes: 'Updated survey information',
    });
    
    // Mock first for version update
    (useMutation as jest.Mock).mockImplementationOnce(() => ({
      mutateAsync: mockCreateVersionMutation,
      isPending: false,
    }));
    
    render(<EnhancedDocumentManagement workflow={mockWorkflow} />);
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText(/Survey\.pdf/i)).toBeInTheDocument();
    });
    
    // View document details
    fireEvent.click(screen.getByText(/Survey\.pdf/i));
    
    // Open version control
    fireEvent.click(screen.getByText(/Version History/i));
    
    // Create new version
    fireEvent.click(screen.getByText(/Create New Version/i));
    
    // Upload file
    const file = new File(['updated content'], 'updated_survey.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload new version/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    
    fireEvent.change(fileInput);
    
    // Add version notes
    fireEvent.change(screen.getByLabelText(/Version notes/i), {
      target: { value: 'Updated survey information' },
    });
    
    // Save new version
    fireEvent.click(screen.getByText(/Save New Version/i));
    
    // Check if create version was called with correct params
    await waitFor(() => {
      expect(mockCreateVersionMutation).toHaveBeenCalledWith(expect.objectContaining({
        documentId: 1,
        notes: 'Updated survey information',
      }));
    });
    
    // Check that linked parcels are still displayed after version update
    await waitFor(() => {
      expect(screen.getByText(/Linked Parcels/i)).toBeInTheDocument();
      expect(screen.getByText(/123456-0001/i)).toBeInTheDocument();
    });
  });
});