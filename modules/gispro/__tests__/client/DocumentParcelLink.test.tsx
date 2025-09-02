import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentParcelManager } from '@/components/documents/document-parcel-manager';
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

describe('DocumentParcelManager Component', () => {
  const mockDocument = {
    id: 1,
    name: 'Test Deed.pdf',
    type: 'deed',
    contentType: 'application/pdf',
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockParcels = [
    {
      id: 1,
      parcelNumber: '123456-0001',
      address: '123 Main St',
      owner: 'Jane Smith',
      propertyType: 'Residential',
      acreage: '0.25',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      parcelNumber: '123456-0002',
      address: '125 Main St',
      owner: 'John Doe',
      propertyType: 'Residential',
      acreage: '0.25',
      createdAt: new Date().toISOString(),
    }
  ];

  const mockLinkedParcels = [
    mockParcels[0]
  ];

  const mockSearchResults = [
    mockParcels[0],
    mockParcels[1],
    {
      id: 3,
      parcelNumber: '789012-0003',
      address: '456 Oak St',
      owner: 'Bob Johnson',
      propertyType: 'Commercial',
      acreage: '1.5',
      createdAt: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    // Setup default mock implementations
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: mockLinkedParcels,
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === '/api/parcels/search') {
        return {
          data: mockSearchResults,
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

  test('should display linked parcels', async () => {
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Check if linked parcels are displayed
    await waitFor(() => {
      expect(screen.getByText(/Linked Parcels/i)).toBeInTheDocument();
      expect(screen.getByText(/123456-0001/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  test('should allow searching for parcels to link', async () => {
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Click add parcel button
    fireEvent.click(screen.getByText(/Add Parcel Link/i));
    
    // Enter search query
    fireEvent.change(screen.getByPlaceholderText(/Search by parcel number or address/i), {
      target: { value: 'Main St' },
    });
    
    // Trigger search
    fireEvent.click(screen.getByText(/Search/i));
    
    // Check if search results are displayed
    await waitFor(() => {
      expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
      expect(screen.getByText(/123456-0001/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
      expect(screen.getByText(/123456-0002/i)).toBeInTheDocument();
      expect(screen.getByText(/125 Main St/i)).toBeInTheDocument();
    });
  });

  test('should allow linking document to parcel', async () => {
    const mockLinkMutation = jest.fn().mockResolvedValue({ success: true });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockLinkMutation,
      isPending: false,
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Click add parcel button
    fireEvent.click(screen.getByText(/Add Parcel Link/i));
    
    // Enter search query
    fireEvent.change(screen.getByPlaceholderText(/Search by parcel number or address/i), {
      target: { value: 'Main St' },
    });
    
    // Trigger search
    fireEvent.click(screen.getByText(/Search/i));
    
    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    });
    
    // Select a parcel to link (the one that isn't already linked)
    fireEvent.click(screen.getAllByText(/Link/i)[1]); // Second "Link" button
    
    // Check if link mutation was called
    await waitFor(() => {
      expect(mockLinkMutation).toHaveBeenCalledWith(expect.objectContaining({
        documentId: mockDocument.id,
        parcelId: mockParcels[1].id,
      }));
    });
  });

  test('should allow removing parcel links', async () => {
    const mockUnlinkMutation = jest.fn().mockResolvedValue({ count: 1 });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockUnlinkMutation,
      isPending: false,
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Wait for linked parcels to load
    await waitFor(() => {
      expect(screen.getByText(/123456-0001/i)).toBeInTheDocument();
    });
    
    // Click unlink button
    fireEvent.click(screen.getByText(/Unlink/i));
    
    // Confirm unlink
    fireEvent.click(screen.getByText(/Confirm/i));
    
    // Check if unlink mutation was called
    await waitFor(() => {
      expect(mockUnlinkMutation).toHaveBeenCalledWith(expect.objectContaining({
        documentId: mockDocument.id,
        parcelId: mockParcels[0].id,
      }));
    });
  });

  test('should handle documents with multiple parcel links', async () => {
    // Mock both parcels as linked
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: [mockParcels[0], mockParcels[1]],
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === '/api/parcels/search') {
        return {
          data: mockSearchResults,
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
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Check if both linked parcels are displayed
    await waitFor(() => {
      expect(screen.getByText(/123456-0001/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
      expect(screen.getByText(/123456-0002/i)).toBeInTheDocument();
      expect(screen.getByText(/125 Main St/i)).toBeInTheDocument();
    });
    
    // Ensure there are two unlink buttons
    expect(screen.getAllByText(/Unlink/i)).toHaveLength(2);
  });
});