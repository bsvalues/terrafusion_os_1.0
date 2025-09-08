import supertest from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { documentParcelService } from '../../server/services/document-parcel-service';

// Mock the document-parcel service
jest.mock('../../server/services/document-parcel-service', () => ({
  documentParcelService: {
    associateDocumentWithParcels: jest.fn(),
    disassociateDocumentFromParcels: jest.fn(),
    getParcelsForDocument: jest.fn(),
    getDocumentParcelLinks: jest.fn(),
    getDocumentRelationships: jest.fn(),
    getDocumentsForParcel: jest.fn(),
    getParcelDocumentLinks: jest.fn(),
    getParcelRelationships: jest.fn(),
    updateDocumentParcelLink: jest.fn(),
    getDocumentsForParcelNumber: jest.fn(),
  },
}));

// Create request for testing
describe('Document-Parcel Relationship API Routes', () => {
  let app: express.Express;
  let server: any;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    request = supertest(app);
  });

  afterAll(() => {
    if (server && server.close) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents/:id/parcels', () => {
    test('should return parcels associated with document', async () => {
      const mockParcels = [
        { id: 101, parcelNumber: '12345-67-89', address: '123 Main St' },
        { id: 102, parcelNumber: '98765-43-21', address: '456 Oak Ave' }
      ];

      (documentParcelService.getParcelsForDocument as jest.Mock).mockResolvedValue(mockParcels);

      const response = await request.get('/api/documents/1/parcels');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockParcels);
      expect(documentParcelService.getParcelsForDocument).toHaveBeenCalledWith(1);
    });

    test('should handle errors', async () => {
      (documentParcelService.getParcelsForDocument as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request.get('/api/documents/1/parcels');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/documents/:id/parcel-links', () => {
    test('should return document-parcel links with metadata', async () => {
      const mockLinks = [
        { id: 1001, documentId: 1, parcelId: 101, linkType: 'ownership', notes: null },
        { id: 1002, documentId: 1, parcelId: 102, linkType: 'reference', notes: 'Test notes' }
      ];

      (documentParcelService.getDocumentParcelLinks as jest.Mock).mockResolvedValue(mockLinks);

      const response = await request.get('/api/documents/1/parcel-links');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLinks);
      expect(documentParcelService.getDocumentParcelLinks).toHaveBeenCalledWith(1);
    });

    test('should handle errors', async () => {
      (documentParcelService.getDocumentParcelLinks as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request.get('/api/documents/1/parcel-links');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/documents/:id/relationships', () => {
    test('should return document with relationships data', async () => {
      const mockDocumentWithRelationships = {
        id: 1,
        name: 'Test Document',
        linkedParcels: [
          { id: 101, parcelNumber: '12345-67-89', linkType: 'ownership', linkId: 1001 },
          { id: 102, parcelNumber: '98765-43-21', linkType: 'reference', linkId: 1002 }
        ]
      };

      (documentParcelService.getDocumentRelationships as jest.Mock).mockResolvedValue(
        mockDocumentWithRelationships
      );

      const response = await request.get('/api/documents/1/relationships');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDocumentWithRelationships);
      expect(documentParcelService.getDocumentRelationships).toHaveBeenCalledWith(1);
    });

    test('should handle errors', async () => {
      (documentParcelService.getDocumentRelationships as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request.get('/api/documents/1/relationships');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/parcels/:id/relationships', () => {
    test('should return parcel with relationships data', async () => {
      const mockParcelWithRelationships = {
        id: 101,
        parcelNumber: '12345-67-89',
        linkedDocuments: [
          { id: 1, name: 'Deed.pdf', linkType: 'ownership', linkId: 1001 },
          { id: 2, name: 'Survey.pdf', linkType: 'legal_description', linkId: 1002 }
        ]
      };

      (documentParcelService.getParcelRelationships as jest.Mock).mockResolvedValue(
        mockParcelWithRelationships
      );

      const response = await request.get('/api/parcels/101/relationships');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockParcelWithRelationships);
      expect(documentParcelService.getParcelRelationships).toHaveBeenCalledWith(101);
    });

    test('should handle errors', async () => {
      (documentParcelService.getParcelRelationships as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request.get('/api/parcels/101/relationships');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/documents/:id/parcels', () => {
    test('should associate document with parcels', async () => {
      const mockLinks = [
        { id: 1001, documentId: 1, parcelId: 101, linkType: 'ownership', notes: 'Test notes' }
      ];

      (documentParcelService.associateDocumentWithParcels as jest.Mock).mockResolvedValue(mockLinks);

      const response = await request
        .post('/api/documents/1/parcels')
        .send({
          parcelIds: [101],
          linkType: 'ownership',
          notes: 'Test notes'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockLinks);
      expect(documentParcelService.associateDocumentWithParcels).toHaveBeenCalledWith(
        1, [101], 'ownership', 'Test notes'
      );
    });

    test('should return 400 if parcelIds not provided', async () => {
      const response = await request
        .post('/api/documents/1/parcels')
        .send({
          linkType: 'ownership'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(documentParcelService.associateDocumentWithParcels).not.toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      (documentParcelService.associateDocumentWithParcels as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request
        .post('/api/documents/1/parcels')
        .send({
          parcelIds: [101]
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/documents/:id/parcels', () => {
    test('should remove document-parcel associations', async () => {
      (documentParcelService.disassociateDocumentFromParcels as jest.Mock).mockResolvedValue(2);

      const response = await request
        .delete('/api/documents/1/parcels')
        .send({
          parcelIds: [101, 102]
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 2 });
      expect(documentParcelService.disassociateDocumentFromParcels).toHaveBeenCalledWith(
        1, [101, 102]
      );
    });

    test('should handle errors', async () => {
      (documentParcelService.disassociateDocumentFromParcels as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request
        .delete('/api/documents/1/parcels')
        .send({
          parcelIds: [101]
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /api/document-parcel-links/:id', () => {
    test('should update document-parcel link', async () => {
      const updatedLink = {
        id: 1001,
        documentId: 1,
        parcelId: 101,
        linkType: 'legal_description',
        notes: 'Updated notes'
      };

      (documentParcelService.updateDocumentParcelLink as jest.Mock).mockResolvedValue(updatedLink);

      const response = await request
        .patch('/api/document-parcel-links/1001')
        .send({
          linkType: 'legal_description',
          notes: 'Updated notes'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedLink);
      expect(documentParcelService.updateDocumentParcelLink).toHaveBeenCalledWith(
        1001, 'legal_description', 'Updated notes'
      );
    });

    test('should handle errors', async () => {
      (documentParcelService.updateDocumentParcelLink as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request
        .patch('/api/document-parcel-links/1001')
        .send({
          linkType: 'legal_description'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});