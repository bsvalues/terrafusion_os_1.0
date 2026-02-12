import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentParcelManager } from '@/components/documents/document-parcel-manager';
import { DocumentParcelRelationshipVisualization } from '@/components/documents/document-parcel-relationship-visualization';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
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

describe('Document-Parcel Relationship Management', () => {
  const mockDocument = {
    id: 1,
    name: 'Test Document.pdf',
    type: 'deed',
    contentType: 'application/pdf',
    workflowId: 123,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockParcels = [
    {
      id: 101,
      parcelNumber: '12345-67-89',
      address: '123 Main St',
      owner: 'John Doe',
      county: 'Benton',
      state: 'WA',
    },
    {
      id: 102,
      parcelNumber: '98765-43-21',
      address: '456 Oak Ave',
      owner: 'Jane Smith',
      county: 'Benton',
      state: 'WA',
    },
    {
      id: 103,
      parcelNumber: '55555-55-55',
      address: '789 Pine Ln',
      owner: 'Bob Johnson',
      county: 'Benton',
      state: 'WA',
    }
  ];
  
  const mockLinks = [
    {
      id: 1001,
      documentId: 1,
      parcelId: 101,
      linkType: 'reference',
      notes: null,
      createdAt: new Date().toISOString(),
    }
  ];

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock query responses
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: mockParcels.slice(0, 1), // Document is linked to the first parcel
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === `/api/documents/${mockDocument.id}/parcel-links`) {
        return {
          data: mockLinks,
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === '/api/parcels') {
        return {
          data: mockParcels,
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
    
    // Mock mutations
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  test('should display currently linked parcels', async () => {
    render(<DocumentParcelManager document={mockDocument} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Linked Parcels/i)).toBeInTheDocument();
      expect(screen.getByText('12345-67-89')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  test('should allow searching for parcels', async () => {
    // Mock search mutation
    const searchMock = jest.fn().mockResolvedValue([
      mockParcels[2], // Returning the third parcel as search result
    ]);
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: searchMock,
      isPending: false,
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Find search input and perform search
    const searchInput = screen.getByPlaceholderText(/Search parcels/i);
    fireEvent.change(searchInput, { target: { value: '789 Pine' } });
    fireEvent.click(screen.getByText(/Search/i));
    
    // Check if search results are displayed
    await waitFor(() => {
      expect(screen.getByText('789 Pine Ln')).toBeInTheDocument();
      expect(screen.getByText('55555-55-55')).toBeInTheDocument();
    });
  });

  test('should allow linking and unlinking parcels', async () => {
    const linkMutationMock = jest.fn().mockResolvedValue({});
    const unlinkMutationMock = jest.fn().mockResolvedValue({});
    
    (useMutation as jest.Mock).mockImplementation(({ mutationFn }) => {
      // Different mocks based on the mutation type
      if (mutationFn && mutationFn.toString().includes('link')) {
        return {
          mutateAsync: linkMutationMock,
          isPending: false,
        };
      } else {
        return {
          mutateAsync: unlinkMutationMock,
          isPending: false,
        };
      }
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Check linked parcels initially
    await waitFor(() => {
      expect(screen.getByText('12345-67-89')).toBeInTheDocument();
    });
    
    // Unlink parcel
    fireEvent.click(screen.getByText(/Unlink/i));
    
    // Confirm unlink
    await waitFor(() => {
      expect(unlinkMutationMock).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
    
    // Simulate new parcel search results after query invalidation
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: [], // Document now has no linked parcels
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === '/api/parcels') {
        return {
          data: mockParcels,
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
    
    // Now link a new parcel (first we need to search)
    const searchMock = jest.fn().mockResolvedValue([mockParcels[1]]);
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: searchMock,
      isPending: false,
    });
    
    // Search for a parcel
    const searchInput = screen.getByPlaceholderText(/Search parcels/i);
    fireEvent.change(searchInput, { target: { value: 'Oak' } });
    fireEvent.click(screen.getByText(/Search/i));
    
    // Link a parcel from search results
    await waitFor(() => {
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    });
    
    // Reset mutation mock for linking
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: linkMutationMock,
      isPending: false,
    });
    
    // Click link button
    fireEvent.click(screen.getByText(/Link/i));
    
    // Verify link was called
    await waitFor(() => {
      expect(linkMutationMock).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });

  test('should handle bulk linking operations', async () => {
    const bulkLinkMutationMock = jest.fn().mockResolvedValue({});
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: bulkLinkMutationMock,
      isPending: false,
    });
    
    // Mock search returning multiple parcels
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: [],
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === '/api/parcels/search') {
        return {
          data: mockParcels.slice(1), // Return parcels 2 and 3
          isLoading: false,
          error: null,
        };
      }
      return {
        data: mockParcels,
        isLoading: false,
        error: null,
      };
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Trigger search
    fireEvent.click(screen.getByText(/Advanced Search/i));
    
    // Select multiple parcels from results (simulate checkboxes)
    await waitFor(() => {
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('789 Pine Ln')).toBeInTheDocument();
    });
    
    // Select both parcels (find checkboxes)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    
    // Click bulk link button
    fireEvent.click(screen.getByText(/Link Selected/i));
    
    // Verify bulk link mutation was called with both parcel IDs
    await waitFor(() => {
      expect(bulkLinkMutationMock).toHaveBeenCalledWith({
        documentId: mockDocument.id,
        parcelIds: [102, 103],
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
  
  test('should create a new document-parcel link with specific link type', async () => {
    const createLinkMutationMock = jest.fn().mockResolvedValue({
      id: 2001,
      documentId: 1,
      parcelId: 102,
      linkType: 'legal_description',
      notes: 'Contains legal description for this parcel',
      createdAt: new Date().toISOString(),
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: createLinkMutationMock,
      isPending: false,
    });
    
    render(<DocumentParcelManager document={mockDocument} showLinkTypeOptions={true} />);
    
    // Open add link dialog
    fireEvent.click(screen.getByText(/Add Parcel Link/i));
    
    // Search for a parcel
    const searchInput = screen.getByPlaceholderText(/Search parcels/i);
    fireEvent.change(searchInput, { target: { value: 'Oak' } });
    fireEvent.click(screen.getByText(/Search/i));
    
    // Mock search results
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey.includes('search')) {
        return {
          data: [mockParcels[1]],
          isLoading: false,
          error: null,
        };
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      };
    });
    
    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    });
    
    // Open link options dialog
    fireEvent.click(screen.getByText(/Link Options/i));
    
    // Select link type
    const linkTypeSelect = screen.getByLabelText(/Link Type/i);
    fireEvent.change(linkTypeSelect, { target: { value: 'legal_description' } });
    
    // Add notes
    const notesInput = screen.getByLabelText(/Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Contains legal description for this parcel' } });
    
    // Submit link with options
    fireEvent.click(screen.getByText(/Create Link/i));
    
    // Verify link creation with correct parameters
    await waitFor(() => {
      expect(createLinkMutationMock).toHaveBeenCalledWith({
        documentId: mockDocument.id,
        parcelId: 102,
        linkType: 'legal_description',
        notes: 'Contains legal description for this parcel'
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
  
  test('should update an existing document-parcel link type', async () => {
    const updateLinkMutationMock = jest.fn().mockResolvedValue({
      id: 1001,
      documentId: 1,
      parcelId: 101,
      linkType: 'ownership',
      notes: 'Updated relationship',
      createdAt: mockLinks[0].createdAt
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: updateLinkMutationMock,
      isPending: false,
    });
    
    render(<DocumentParcelManager document={mockDocument} showLinkTypeOptions={true} />);
    
    // Find and click edit link button
    await waitFor(() => {
      expect(screen.getByText('12345-67-89')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/Edit Link/i));
    
    // Change link type in dialog
    const linkTypeSelect = screen.getByLabelText(/Link Type/i);
    fireEvent.change(linkTypeSelect, { target: { value: 'ownership' } });
    
    // Update notes
    const notesInput = screen.getByLabelText(/Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Updated relationship' } });
    
    // Submit changes
    fireEvent.click(screen.getByText(/Update Link/i));
    
    // Verify update mutation was called with correct parameters
    await waitFor(() => {
      expect(updateLinkMutationMock).toHaveBeenCalledWith({
        id: 1001,
        linkType: 'ownership',
        notes: 'Updated relationship'
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});

describe('DocumentParcelRelationshipVisualization Component', () => {
  const mockDocumentWithParcels = {
    id: 1,
    name: 'Deed of Trust.pdf',
    type: 'deed',
    contentType: 'application/pdf',
    workflowId: 123,
    uploadedAt: new Date().toISOString(),
    linkedParcels: [
      {
        id: 101,
        parcelNumber: '12345-67-89',
        address: '123 Main St',
        linkType: 'ownership',
        linkId: 1001
      },
      {
        id: 102,
        parcelNumber: '98765-43-21',
        address: '456 Oak Ave',
        linkType: 'reference',
        linkId: 1002
      }
    ]
  };
  
  const mockParcelWithDocuments = {
    id: 101,
    parcelNumber: '12345-67-89',
    address: '123 Main St',
    owner: 'John Doe',
    linkedDocuments: [
      {
        id: 1,
        name: 'Deed of Trust.pdf',
        type: 'deed',
        uploadedAt: new Date().toISOString(),
        linkType: 'ownership',
        linkId: 1001
      },
      {
        id: 2,
        name: 'Survey Map.pdf',
        type: 'survey',
        uploadedAt: new Date().toISOString(),
        linkType: 'legal_description',
        linkId: 1003
      }
    ]
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock queries
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocumentWithParcels.id}/relationships`) {
        return {
          data: mockDocumentWithParcels,
          isLoading: false,
          error: null
        };
      } else if (queryKey[0] === `/api/parcels/${mockParcelWithDocuments.id}/relationships`) {
        return {
          data: mockParcelWithDocuments,
          isLoading: false,
          error: null
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null
      };
    });
  });
  
  test('should display all linked parcels for a document with relationship type', async () => {
    render(<DocumentParcelRelationshipVisualization documentId={mockDocumentWithParcels.id} />);
    
    await waitFor(() => {
      expect(screen.getByText(mockDocumentWithParcels.name)).toBeInTheDocument();
      expect(screen.getByText(mockDocumentWithParcels.linkedParcels[0].parcelNumber)).toBeInTheDocument();
      expect(screen.getByText(mockDocumentWithParcels.linkedParcels[1].parcelNumber)).toBeInTheDocument();
      
      // Verify relationship types are shown
      expect(screen.getByText(/ownership/i)).toBeInTheDocument();
      expect(screen.getByText(/reference/i)).toBeInTheDocument();
    });
  });
  
  test('should display all linked documents for a parcel with relationship type', async () => {
    render(<DocumentParcelRelationshipVisualization parcelId={mockParcelWithDocuments.id} />);
    
    await waitFor(() => {
      expect(screen.getByText(mockParcelWithDocuments.parcelNumber)).toBeInTheDocument();
      expect(screen.getByText(mockParcelWithDocuments.linkedDocuments[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockParcelWithDocuments.linkedDocuments[1].name)).toBeInTheDocument();
      
      // Verify relationship types are shown
      expect(screen.getByText(/ownership/i)).toBeInTheDocument();
      expect(screen.getByText(/legal description/i)).toBeInTheDocument();
    });
  });
  
  test('should filter linked documents by type', async () => {
    render(<DocumentParcelRelationshipVisualization parcelId={mockParcelWithDocuments.id} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(mockParcelWithDocuments.parcelNumber)).toBeInTheDocument();
    });
    
    // Find and use the filter
    const filterSelect = screen.getByLabelText(/Filter by type/i);
    fireEvent.change(filterSelect, { target: { value: 'survey' } });
    
    // Verify only survey document is shown
    await waitFor(() => {
      expect(screen.getByText('Survey Map.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Deed of Trust.pdf')).not.toBeInTheDocument();
    });
  });
  
  test('should show appropriate message when no relationships exist', async () => {
    // Mock empty relationship data
    (useQuery as jest.Mock).mockImplementation(() => ({
      data: { 
        id: 3, 
        name: 'Empty Document.pdf',
        linkedParcels: [] 
      },
      isLoading: false,
      error: null
    }));
    
    render(<DocumentParcelRelationshipVisualization documentId={3} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No linked parcels found/i)).toBeInTheDocument();
      expect(screen.getByText(/This document is not linked to any parcels/i)).toBeInTheDocument();
    });
  });
});