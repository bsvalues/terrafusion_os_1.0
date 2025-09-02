import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentVersionComparison } from '@/components/documents/document-version-comparison';
import { useQuery } from '@tanstack/react-query';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

describe('Document Version Comparison', () => {
  // Sample document versions for testing
  const mockVersion1 = {
    id: 1,
    documentId: 100,
    versionNumber: 1,
    contentHash: 'abc123',
    storageKey: 'documents/abc123',
    content: 'This is the original content with some text.',
    createdAt: '2025-01-15T12:00:00Z',
    notes: 'Initial version'
  };
  
  const mockVersion2 = {
    id: 2,
    documentId: 100,
    versionNumber: 2,
    contentHash: 'def456',
    storageKey: 'documents/def456',
    content: 'This is the updated content with some modified text.',
    createdAt: '2025-02-01T14:30:00Z',
    notes: 'Updated with minor changes'
  };
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock query responses
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/versions/${mockVersion1.id}/content`) {
        return {
          data: mockVersion1.content,
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === `/api/documents/versions/${mockVersion2.id}/content`) {
        return {
          data: mockVersion2.content,
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
  });
  
  test('should render side-by-side version comparison', async () => {
    render(
      <DocumentVersionComparison 
        version1={mockVersion1} 
        version2={mockVersion2} 
        onClose={jest.fn()}
      />
    );
    
    // Check header information
    expect(screen.getByText('Version 1 vs Version 2')).toBeInTheDocument();
    
    // Check version metadata display
    expect(screen.getByText(/Version 1/)).toBeInTheDocument();
    expect(screen.getByText(/Initial version/)).toBeInTheDocument();
    expect(screen.getByText(/Version 2/)).toBeInTheDocument();
    expect(screen.getByText(/Updated with minor changes/)).toBeInTheDocument();
    
    // Wait for content to load
    await waitFor(() => {
      // Check both version contents are displayed
      expect(screen.getByText(/original content/)).toBeInTheDocument();
      expect(screen.getByText(/updated content/)).toBeInTheDocument();
    });
    
    // Check for highlighted differences
    const highlightedElements = screen.getAllByTestId('diff-highlight');
    expect(highlightedElements.length).toBeGreaterThan(0);
  });
  
  test('should handle content loading state', () => {
    // Override the mock to simulate loading
    (useQuery as jest.Mock).mockImplementation(() => ({
      data: null,
      isLoading: true,
      error: null,
    }));
    
    render(
      <DocumentVersionComparison 
        version1={mockVersion1} 
        version2={mockVersion2} 
        onClose={jest.fn()}
      />
    );
    
    // Check loading indicators
    expect(screen.getByText(/Loading version content/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('should handle content loading errors', () => {
    // Override the mock to simulate error
    (useQuery as jest.Mock).mockImplementation(() => ({
      data: null,
      isLoading: false,
      error: 'Failed to load document content',
    }));
    
    render(
      <DocumentVersionComparison 
        version1={mockVersion1} 
        version2={mockVersion2} 
        onClose={jest.fn()}
      />
    );
    
    // Check error message
    expect(screen.getByText(/Error loading document content/)).toBeInTheDocument();
  });
  
  test('should provide navigation controls between versions', async () => {
    const mockOnVersionChange = jest.fn();
    
    render(
      <DocumentVersionComparison 
        version1={mockVersion1} 
        version2={mockVersion2} 
        onClose={jest.fn()}
        onVersionChange={mockOnVersionChange}
        availableVersions={[mockVersion1, mockVersion2, { ...mockVersion2, id: 3, versionNumber: 3 }]}
      />
    );
    
    // Navigate to next version
    fireEvent.click(screen.getByText(/Next Version/));
    
    expect(mockOnVersionChange).toHaveBeenCalledWith(3, 2); // Version 3 vs Version 2
  });
  
  test('should highlight specific differences between versions', async () => {
    // Mock versions with specific differences to test highlighting
    const oldContent = 'Line 1\nThis is unchanged\nThis will be removed\nThis stays the same';
    const newContent = 'Line 1\nThis is unchanged\nThis is new content\nThis stays the same';
    
    // Override the mock for specific content
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/versions/${mockVersion1.id}/content`) {
        return {
          data: oldContent,
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === `/api/documents/versions/${mockVersion2.id}/content`) {
        return {
          data: newContent,
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
    
    render(
      <DocumentVersionComparison 
        version1={mockVersion1} 
        version2={mockVersion2} 
        onClose={jest.fn()}
      />
    );
    
    // Wait for content to load and diff to be calculated
    await waitFor(() => {
      // Check for removed content highlighted in red
      const removedElements = screen.getAllByTestId('diff-removed');
      expect(removedElements.length).toBe(1);
      expect(removedElements[0]).toHaveTextContent('This will be removed');
      
      // Check for added content highlighted in green
      const addedElements = screen.getAllByTestId('diff-added');
      expect(addedElements.length).toBe(1);
      expect(addedElements[0]).toHaveTextContent('This is new content');
    });
  });
  
  test('should close comparison view when close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <DocumentVersionComparison 
        version1={mockVersion1} 
        version2={mockVersion2} 
        onClose={mockOnClose}
      />
    );
    
    // Click close button
    fireEvent.click(screen.getByText('Close'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});