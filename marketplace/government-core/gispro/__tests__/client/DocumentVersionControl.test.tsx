import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentVersionControl } from '@/components/documents/document-version-control';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

describe('DocumentVersionControl Component', () => {
  const mockDocument = {
    id: 1,
    name: 'Test Document.pdf',
    type: 'deed',
    contentType: 'application/pdf',
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockVersions = [
    {
      id: 2,
      documentId: 1,
      versionNumber: 2,
      contentHash: 'abc123',
      storageKey: 'documents/abc123/Test_Document_v2.pdf',
      createdAt: new Date().toISOString(),
      notes: 'Updated with new parcel information',
    },
    {
      id: 1,
      documentId: 1,
      versionNumber: 1,
      contentHash: 'def456',
      storageKey: 'documents/def456/Test_Document_v1.pdf',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      notes: 'Initial version',
    }
  ];

  beforeEach(() => {
    // Setup default mock implementations
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/versions`) {
        return {
          data: mockVersions,
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
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  test('should display version history', async () => {
    render(<DocumentVersionControl document={mockDocument} />);
    
    // Check if version history is displayed
    await waitFor(() => {
      expect(screen.getByText(/Version History/i)).toBeInTheDocument();
      expect(screen.getByText(/Version 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Updated with new parcel information/i)).toBeInTheDocument();
      expect(screen.getByText(/Initial version/i)).toBeInTheDocument();
    });
  });

  test('should allow viewing version details', async () => {
    render(<DocumentVersionControl document={mockDocument} />);
    
    // Click on a version to view details
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Version 2/i));
    });
    
    // Check if version details are displayed
    expect(screen.getByText(/Version Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Created:/i)).toBeInTheDocument();
    expect(screen.getByText(/Hash: abc123/i)).toBeInTheDocument();
  });

  test('should support version comparison', async () => {
    render(<DocumentVersionControl document={mockDocument} />);
    
    // Select two versions for comparison
    await waitFor(() => {
      fireEvent.click(screen.getByLabelText(/Compare Version 2/i));
      fireEvent.click(screen.getByLabelText(/Compare Version 1/i));
    });
    
    // Click compare button
    fireEvent.click(screen.getByText(/Compare Selected/i));
    
    // Check if comparison view is displayed
    expect(screen.getByText(/Version Comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Version 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
  });

  test('should allow reverting to previous version', async () => {
    const mockRevertMutation = jest.fn().mockResolvedValue({
      id: 3,
      documentId: 1,
      versionNumber: 3,
      contentHash: 'ghi789',
      storageKey: 'documents/ghi789/Test_Document_v3.pdf',
      createdAt: new Date().toISOString(),
      notes: 'Reverted to version 1',
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockRevertMutation,
      isPending: false,
    });
    
    render(<DocumentVersionControl document={mockDocument} />);
    
    // Open version details
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Version 1/i));
    });
    
    // Click revert button
    fireEvent.click(screen.getByText(/Revert to This Version/i));
    
    // Confirm revert
    fireEvent.click(screen.getByText(/Confirm/i));
    
    // Check if revert was called
    await waitFor(() => {
      expect(mockRevertMutation).toHaveBeenCalled();
    });
  });

  test('should capture metadata for version changes', async () => {
    const mockCreateVersionMutation = jest.fn().mockResolvedValue({
      id: 3,
      documentId: 1,
      versionNumber: 3,
      contentHash: 'jkl012',
      storageKey: 'documents/jkl012/Test_Document_v3.pdf',
      createdAt: new Date().toISOString(),
      notes: 'Added new survey information',
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockCreateVersionMutation,
      isPending: false,
    });
    
    render(<DocumentVersionControl document={mockDocument} />);
    
    // Click create new version button
    fireEvent.click(screen.getByText(/Create New Version/i));
    
    // Upload file and add notes
    const file = new File(['test content'], 'updated_document.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload new version/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    
    fireEvent.change(fileInput);
    
    // Add version notes
    fireEvent.change(screen.getByLabelText(/Version notes/i), {
      target: { value: 'Added new survey information' },
    });
    
    // Submit new version
    fireEvent.click(screen.getByText(/Save New Version/i));
    
    // Check if create version was called with the correct notes
    await waitFor(() => {
      expect(mockCreateVersionMutation).toHaveBeenCalledWith(expect.objectContaining({
        notes: 'Added new survey information',
      }));
    });
  });
});