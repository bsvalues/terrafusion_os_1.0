import { documentOcrService, OcrExtractionResult } from '../../server/services/document-ocr-service';
import { documentService } from '../../server/services/document-service';
import { storage } from '../../server/storage';
import { DocumentType } from '../../shared/document-types';

// Mock storage methods
jest.mock('../../server/storage', () => ({
  storage: {
    getDocument: jest.fn(),
    getDocumentVersions: jest.fn(),
    getDocuments: jest.fn()
  },
}));

// Mock document OCR service methods
jest.mock('../../server/services/document-ocr-service', () => ({
  documentOcrService: {
    extractText: jest.fn(),
    extractFields: jest.fn(),
    calculateContentSimilarity: jest.fn(),
    suggestRelatedDocuments: jest.fn()
  },
  OcrExtractionResult: {}
}));

// Mock document service methods for integration tests
jest.mock('../../server/services/document-service', () => ({
  documentService: {
    extractDocumentFields: jest.fn(),
    findRelatedDocuments: jest.fn(),
    getDocumentContentByKey: jest.fn(),
    extractText: jest.fn()
  }
}));

describe('Document OCR Service', () => {
  // Test OCR text extraction
  it('should extract text from a PDF document', async () => {
    // Mock base64-encoded PDF content for testing
    const mockPdfContent = 'base64encodedpdfcontent';
    
    // This test will need to be updated when an actual OCR implementation is in place
    const result = await documentOcrService.extractText(mockPdfContent, 'application/pdf');
    
    // Basic validation that some text was extracted
    expect(typeof result).toBe('string');
  });
  
  // Test field extraction
  it('should extract parcel numbers from document text', async () => {
    // Sample text containing parcel numbers in common formats
    const sampleText = `
      This document pertains to Parcel ID: 1234-56-7890
      Property located at 123 Main St with Tax ID 98-765-4321
      Secondary Parcel Number: 1122334455
    `;
    
    const extractionResult = await documentOcrService.extractFields(sampleText);
    
    expect(extractionResult).toHaveProperty('parcelNumbers');
    expect(extractionResult.parcelNumbers.length).toBeGreaterThan(0);
    expect(extractionResult.parcelNumbers).toContain('1234-56-7890');
  });
  
  // Test legal description extraction
  it('should extract legal descriptions from document text', async () => {
    const sampleText = `
      LEGAL DESCRIPTION:
      Lot 7, Block 3, MEADOW HILLS SUBDIVISION, according to the plat 
      thereof recorded in Volume 8 of Plats, Page 45, records of 
      Benton County, Washington.
    `;
    
    const extractionResult = await documentOcrService.extractFields(sampleText);
    
    expect(extractionResult).toHaveProperty('legalDescription');
    expect(extractionResult.legalDescription).toContain('Lot 7, Block 3');
  });
  
  // Test document similarity
  it('should calculate content similarity between documents', async () => {
    const document1 = "Parcel 1234-56-7890, Legal Description: Lot 7, Block 3";
    const document2 = "Lot 7, Block 3, Parcel ID: 1234-56-7890"; // Similar content
    const document3 = "Completely different content about another property";
    
    const similarity1 = await documentOcrService.calculateContentSimilarity(document1, document2);
    const similarity2 = await documentOcrService.calculateContentSimilarity(document1, document3);
    
    // Documents with similar content should have higher similarity score
    expect(similarity1).toBeGreaterThan(0.5);
    // Documents with different content should have lower similarity score
    expect(similarity2).toBeLessThan(0.3);
  });
  
  // Test document content-based linking
  it('should suggest document links based on content similarity', async () => {
    // Mock document contents
    const documents = [
      { id: 1, content: "Parcel 1234-56-7890, Property Transfer" },
      { id: 2, content: "Survey of Parcel 1234-56-7890" },
      { id: 3, content: "Completely different parcel information" }
    ];
    
    const suggestions = await documentOcrService.suggestRelatedDocuments(documents[0], documents.slice(1));
    
    // Should suggest the related document (id: 2) but not the unrelated one
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].documentId).toBe(2);
    expect(suggestions[0].similarityScore).toBeGreaterThan(0.5);
  });
  
  // Test for document service integration
  describe('Document Service Integration', () => {
    let mockDocument;
    let mockVersions;
    
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Mock a document
      mockDocument = {
        id: 1,
        name: 'Test Document.pdf',
        type: 'deed' as DocumentType,
        contentType: 'application/pdf',
        storageKey: 'documents/123abc/Test_Document.pdf',
        uploadedAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock document versions
      mockVersions = [
        {
          id: 1,
          documentId: 1,
          versionNumber: 2,
          contentHash: 'hash456',
          storageKey: 'documents/456def/Test_Document_v2.pdf',
          createdAt: new Date(),
          notes: 'Updated version'
        },
        {
          id: 2,
          documentId: 1,
          versionNumber: 1,
          contentHash: 'hash123',
          storageKey: 'documents/123abc/Test_Document_v1.pdf',
          createdAt: new Date(Date.now() - 86400000), // 1 day earlier
          notes: 'Initial version'
        }
      ];
      
      // Setup mocks
      (storage.getDocument as jest.Mock).mockResolvedValue(mockDocument);
      (storage.getDocumentVersions as jest.Mock).mockResolvedValue(mockVersions);
      (documentOcrService.extractText as jest.Mock).mockResolvedValue('Sample extracted text');
      (documentOcrService.extractFields as jest.Mock).mockResolvedValue({
        fullText: 'Sample extracted text',
        parcelNumbers: ['1234-56-7890'],
        legalDescription: 'Lot 7, Block 3',
        extractionConfidence: 0.85
      });
    });
    
    it('should extract fields from a document', async () => {
      const result = await documentService.extractDocumentFields(1);
      
      // Check that the right methods were called
      expect(storage.getDocument).toHaveBeenCalledWith(1);
      expect(storage.getDocumentVersions).toHaveBeenCalledWith(1);
      expect(documentOcrService.extractFields).toHaveBeenCalled();
      
      // Verify result
      expect(result).toHaveProperty('parcelNumbers');
      expect(result?.parcelNumbers).toContain('1234-56-7890');
      expect(result).toHaveProperty('legalDescription');
    });
    
    it('should find related documents based on content similarity', async () => {
      // Setup additional mocks for related docs
      const mockDocuments = [mockDocument, { id: 2, name: 'Related Doc.pdf' }, { id: 3, name: 'Unrelated Doc.pdf' }];
      (storage.getDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (documentOcrService.calculateContentSimilarity as jest.Mock)
        .mockImplementation((text1, text2) => {
          // Mock similarity based on document ID
          if (text1.includes('Sample') && text2.includes('Similar')) {
            return Promise.resolve(0.8);  // High similarity
          }
          return Promise.resolve(0.2);    // Low similarity
        });
      
      // Setup additional extracted text mocks
      (documentOcrService.extractText as jest.Mock)
        .mockImplementation((content) => {
          if (content.includes('2')) {
            return Promise.resolve('Similar text with parcel 1234-56-7890');
          } else if (content.includes('3')) {
            return Promise.resolve('Completely different text');
          }
          return Promise.resolve('Sample text with parcel 1234-56-7890');
        });
      
      const result = await documentService.findRelatedDocuments(1, 0.5);
      
      expect(storage.getDocuments).toHaveBeenCalled();
      expect(documentOcrService.calculateContentSimilarity).toHaveBeenCalled();
      
      // Since our mock implementation will return similarity 0.8 for document id 2
      // but only 0.2 for document id 3 (which is below our threshold of 0.5),
      // we should only have one result
      expect(result.length).toBeGreaterThan(0);
    });
    
    it('should return empty result if document not found', async () => {
      (storage.getDocument as jest.Mock).mockResolvedValue(null);
      
      const result = await documentService.extractDocumentFields(999);
      
      expect(result).toBeNull();
      expect(documentOcrService.extractText).not.toHaveBeenCalled();
    });
  });
});