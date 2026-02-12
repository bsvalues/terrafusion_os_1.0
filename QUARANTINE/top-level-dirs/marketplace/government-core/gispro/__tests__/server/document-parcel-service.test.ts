import { documentParcelService } from '../../server/services/document-parcel-service';
import { storage } from '../../server/storage';

// Mock the storage
jest.mock('../../server/storage', () => ({
  storage: {
    getDocument: jest.fn(),
    getParcelById: jest.fn(),
    getDocumentParcelLink: jest.fn(),
    createDocumentParcelLink: jest.fn(),
    removeDocumentParcelLinks: jest.fn(),
    getParcelsForDocument: jest.fn(),
    getDocumentParcelLinksByDocumentId: jest.fn(),
    getDocumentParcelLinksByParcelId: jest.fn(),
    getDocumentsForParcel: jest.fn(),
    getDocumentParcelLinkById: jest.fn(),
    updateDocumentParcelLink: jest.fn(),
    searchParcelsByNumber: jest.fn(),
  },
}));

describe('DocumentParcelService', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('associateDocumentWithParcels', () => {
    test('should associate document with parcels using default link type when not specified', async () => {
      // Setup mocks
      const mockDocument = { id: 1, name: 'Test Document' };
      const mockParcel = { id: 101, parcelNumber: '12345-67-89' };
      const mockLink = {
        id: 1001,
        documentId: 1,
        parcelId: 101,
        linkType: 'reference',
        notes: null,
      };

      (storage.getDocument as jest.Mock).mockResolvedValue(mockDocument);
      (storage.getParcelById as jest.Mock).mockResolvedValue(mockParcel);
      (storage.getDocumentParcelLink as jest.Mock).mockResolvedValue(null); // No existing link
      (storage.createDocumentParcelLink as jest.Mock).mockResolvedValue(mockLink);

      // Execute the function
      const result = await documentParcelService.associateDocumentWithParcels(1, [101]);

      // Assertions
      expect(storage.getDocument).toHaveBeenCalledWith(1);
      expect(storage.getParcelById).toHaveBeenCalledWith(101);
      expect(storage.getDocumentParcelLink).toHaveBeenCalledWith(1, 101);
      expect(storage.createDocumentParcelLink).toHaveBeenCalledWith({
        documentId: 1,
        parcelId: 101,
        linkType: 'reference',
        notes: undefined,
      });
      expect(result).toEqual([mockLink]);
    });

    test('should associate document with parcels using specified link type and notes', async () => {
      // Setup mocks
      const mockDocument = { id: 1, name: 'Test Document' };
      const mockParcel = { id: 101, parcelNumber: '12345-67-89' };
      const mockLink = {
        id: 1001,
        documentId: 1,
        parcelId: 101,
        linkType: 'ownership',
        notes: 'Test notes',
      };

      (storage.getDocument as jest.Mock).mockResolvedValue(mockDocument);
      (storage.getParcelById as jest.Mock).mockResolvedValue(mockParcel);
      (storage.getDocumentParcelLink as jest.Mock).mockResolvedValue(null); // No existing link
      (storage.createDocumentParcelLink as jest.Mock).mockResolvedValue(mockLink);

      // Execute the function
      const result = await documentParcelService.associateDocumentWithParcels(
        1, [101], 'ownership', 'Test notes'
      );

      // Assertions
      expect(storage.createDocumentParcelLink).toHaveBeenCalledWith({
        documentId: 1,
        parcelId: 101,
        linkType: 'ownership',
        notes: 'Test notes',
      });
      expect(result).toEqual([mockLink]);
    });

    test('should not create duplicate links', async () => {
      // Setup mocks
      const mockDocument = { id: 1, name: 'Test Document' };
      const mockParcel = { id: 101, parcelNumber: '12345-67-89' };
      const existingLink = {
        id: 1001,
        documentId: 1,
        parcelId: 101,
        linkType: 'reference',
        notes: null,
      };

      (storage.getDocument as jest.Mock).mockResolvedValue(mockDocument);
      (storage.getParcelById as jest.Mock).mockResolvedValue(mockParcel);
      (storage.getDocumentParcelLink as jest.Mock).mockResolvedValue(existingLink); // Existing link
      (storage.createDocumentParcelLink as jest.Mock).mockResolvedValue(existingLink);

      // Execute the function
      const result = await documentParcelService.associateDocumentWithParcels(1, [101]);

      // Assertions
      expect(storage.getDocumentParcelLink).toHaveBeenCalledWith(1, 101);
      expect(storage.createDocumentParcelLink).not.toHaveBeenCalled();
      expect(result).toEqual([existingLink]);
    });

    test('should throw error if document not found', async () => {
      // Setup mocks
      (storage.getDocument as jest.Mock).mockResolvedValue(null);

      // Execute and assert
      await expect(documentParcelService.associateDocumentWithParcels(1, [101]))
        .rejects.toThrow('Document with ID 1 not found');
    });

    test('should throw error if parcel not found', async () => {
      // Setup mocks
      const mockDocument = { id: 1, name: 'Test Document' };
      
      (storage.getDocument as jest.Mock).mockResolvedValue(mockDocument);
      (storage.getParcelById as jest.Mock).mockResolvedValue(null);

      // Execute and assert
      await expect(documentParcelService.associateDocumentWithParcels(1, [101]))
        .rejects.toThrow('Parcel with ID 101 not found');
    });
  });

  describe('disassociateDocumentFromParcels', () => {
    test('should remove all links when no parcelIds specified', async () => {
      // Setup mock
      (storage.removeDocumentParcelLinks as jest.Mock).mockResolvedValue(3); // 3 links removed

      // Execute the function
      const result = await documentParcelService.disassociateDocumentFromParcels(1);

      // Assertions
      expect(storage.removeDocumentParcelLinks).toHaveBeenCalledWith(1, undefined);
      expect(result).toBe(3);
    });

    test('should remove only specified links', async () => {
      // Setup mock
      (storage.removeDocumentParcelLinks as jest.Mock).mockResolvedValue(2); // 2 links removed

      // Execute the function
      const result = await documentParcelService.disassociateDocumentFromParcels(1, [101, 102]);

      // Assertions
      expect(storage.removeDocumentParcelLinks).toHaveBeenCalledWith(1, [101, 102]);
      expect(result).toBe(2);
    });
  });

  describe('getDocumentRelationships', () => {
    test('should return document with linked parcels', async () => {
      // Setup mocks
      const mockDocument = { id: 1, name: 'Test Document' };
      const mockParcels = [
        { id: 101, parcelNumber: '12345-67-89' },
        { id: 102, parcelNumber: '98765-43-21' }
      ];
      const mockLinks = [
        { id: 1001, documentId: 1, parcelId: 101, linkType: 'ownership', notes: null },
        { id: 1002, documentId: 1, parcelId: 102, linkType: 'reference', notes: 'Test notes' }
      ];

      (storage.getDocument as jest.Mock).mockResolvedValue(mockDocument);
      (storage.getParcelsForDocument as jest.Mock).mockResolvedValue(mockParcels);
      (storage.getDocumentParcelLinksByDocumentId as jest.Mock).mockResolvedValue(mockLinks);

      // Execute the function
      const result = await documentParcelService.getDocumentRelationships(1);

      // Assertions
      expect(storage.getDocument).toHaveBeenCalledWith(1);
      expect(storage.getParcelsForDocument).toHaveBeenCalledWith(1);
      expect(storage.getDocumentParcelLinksByDocumentId).toHaveBeenCalledWith(1);
      
      expect(result).toMatchObject({
        id: 1,
        name: 'Test Document',
        linkedParcels: [
          { id: 101, parcelNumber: '12345-67-89', linkType: 'ownership', linkId: 1001 },
          { id: 102, parcelNumber: '98765-43-21', linkType: 'reference', linkId: 1002 }
        ]
      });
    });

    test('should throw error if document not found', async () => {
      // Setup mocks
      (storage.getDocument as jest.Mock).mockResolvedValue(null);

      // Execute and assert
      await expect(documentParcelService.getDocumentRelationships(1))
        .rejects.toThrow('Document with ID 1 not found');
    });
  });

  describe('getParcelRelationships', () => {
    test('should return parcel with linked documents', async () => {
      // Setup mocks
      const mockParcel = { id: 101, parcelNumber: '12345-67-89' };
      const mockDocuments = [
        { id: 1, name: 'Deed.pdf', type: 'deed' },
        { id: 2, name: 'Survey.pdf', type: 'survey' }
      ];
      const mockLinks = [
        { id: 1001, documentId: 1, parcelId: 101, linkType: 'ownership', notes: null },
        { id: 1002, documentId: 2, parcelId: 101, linkType: 'legal_description', notes: 'Test notes' }
      ];

      (storage.getParcelById as jest.Mock).mockResolvedValue(mockParcel);
      (storage.getDocumentsForParcel as jest.Mock).mockResolvedValue(mockDocuments);
      (storage.getDocumentParcelLinksByParcelId as jest.Mock).mockResolvedValue(mockLinks);

      // Execute the function
      const result = await documentParcelService.getParcelRelationships(101);

      // Assertions
      expect(storage.getParcelById).toHaveBeenCalledWith(101);
      expect(storage.getDocumentsForParcel).toHaveBeenCalledWith(101);
      expect(storage.getDocumentParcelLinksByParcelId).toHaveBeenCalledWith(101);
      
      expect(result).toMatchObject({
        id: 101,
        parcelNumber: '12345-67-89',
        linkedDocuments: [
          { id: 1, name: 'Deed.pdf', type: 'deed', linkType: 'ownership', linkId: 1001 },
          { id: 2, name: 'Survey.pdf', type: 'survey', linkType: 'legal_description', linkId: 1002 }
        ]
      });
    });

    test('should throw error if parcel not found', async () => {
      // Setup mocks
      (storage.getParcelById as jest.Mock).mockResolvedValue(null);

      // Execute and assert
      await expect(documentParcelService.getParcelRelationships(101))
        .rejects.toThrow('Parcel with ID 101 not found');
    });
  });

  describe('updateDocumentParcelLink', () => {
    test('should update link type and notes', async () => {
      // Setup mocks
      const existingLink = {
        id: 1001,
        documentId: 1,
        parcelId: 101,
        linkType: 'reference',
        notes: null
      };
      const updatedLink = {
        id: 1001,
        documentId: 1,
        parcelId: 101,
        linkType: 'ownership',
        notes: 'Updated notes'
      };

      (storage.getDocumentParcelLinkById as jest.Mock).mockResolvedValue(existingLink);
      (storage.updateDocumentParcelLink as jest.Mock).mockResolvedValue(updatedLink);

      // Execute the function
      const result = await documentParcelService.updateDocumentParcelLink(
        1001, 'ownership', 'Updated notes'
      );

      // Assertions
      expect(storage.getDocumentParcelLinkById).toHaveBeenCalledWith(1001);
      expect(storage.updateDocumentParcelLink).toHaveBeenCalledWith(1001, {
        linkType: 'ownership',
        notes: 'Updated notes'
      });
      expect(result).toEqual(updatedLink);
    });

    test('should throw error if link not found', async () => {
      // Setup mocks
      (storage.getDocumentParcelLinkById as jest.Mock).mockResolvedValue(null);

      // Execute and assert
      await expect(documentParcelService.updateDocumentParcelLink(1001, 'ownership'))
        .rejects.toThrow('Document-parcel link with ID 1001 not found');
    });
  });

  describe('getDocumentsForParcelNumber', () => {
    test('should return documents for the matching parcel number', async () => {
      // Setup mocks
      const mockParcels = [
        { id: 101, parcelNumber: '12345-67-89' }
      ];
      const mockDocuments = [
        { id: 1, name: 'Deed.pdf', type: 'deed' },
        { id: 2, name: 'Survey.pdf', type: 'survey' }
      ];

      (storage.searchParcelsByNumber as jest.Mock).mockResolvedValue(mockParcels);
      (storage.getDocumentsForParcel as jest.Mock).mockResolvedValue(mockDocuments);

      // Execute the function
      const result = await documentParcelService.getDocumentsForParcelNumber('12345-67-89');

      // Assertions
      expect(storage.searchParcelsByNumber).toHaveBeenCalledWith('12345-67-89');
      expect(storage.getDocumentsForParcel).toHaveBeenCalledWith(101);
      expect(result).toEqual(mockDocuments);
    });

    test('should return empty array when no parcels match', async () => {
      // Setup mocks
      (storage.searchParcelsByNumber as jest.Mock).mockResolvedValue([]);

      // Execute the function
      const result = await documentParcelService.getDocumentsForParcelNumber('00000-00-00');

      // Assertions
      expect(storage.searchParcelsByNumber).toHaveBeenCalledWith('00000-00-00');
      expect(storage.getDocumentsForParcel).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});