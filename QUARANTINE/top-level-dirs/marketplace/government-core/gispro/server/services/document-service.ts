import { createHash } from 'crypto';
import { InsertDocument, InsertDocumentVersion, documentTypeEnum, Document } from '@shared/schema';
import { DocumentType } from '@shared/document-types';
import { classifyDocument, ClassificationResult } from './document-classifier';
import { documentOcrService, OcrExtractionResult } from './document-ocr-service';
import { storage } from '../storage';

/**
 * Service for handling document operations
 */
class DocumentService {
  /**
   * Creates a new document in the system with automatic classification
   * Now with enhanced OCR and field extraction
   * @param params Document creation parameters
   * @returns Created document with classification details
   */
  async createDocument(params: {
    workflowId?: number;
    name: string;
    contentType: string;
    content: string; // Base64 encoded content
  }) {
    // Generate content hash for integrity verification
    const contentHash = this.generateContentHash(params.content);
    const storageKey = this.generateStorageKey(params.name, contentHash);
    
    // Extract text from document using advanced OCR
    const textContent = await this.extractText(params.content, params.contentType);
    
    // Extract structured fields
    const extractionResult = await documentOcrService.extractFields(textContent);
    
    // Classify the document based on its text content
    const classification = classifyDocument(textContent);
    
    // Create the document record
    const document = await storage.addDocument({
      workflowId: params.workflowId,
      name: params.name,
      type: classification.documentType,
      contentType: params.contentType,
      contentHash,
      storageKey,
      classification: {
        documentType: classification.documentType,
        confidence: classification.confidence,
        wasManuallyClassified: false,
        classifiedAt: new Date().toISOString()
      },
      content: params.content // This will be stored appropriately by the storage layer
    });
    
    // Create initial document version
    await this.createDocumentVersion({
      documentId: document.id,
      versionNumber: 1,
      content: params.content
    });
    
    // If we extracted parcel numbers, try to associate them automatically
    if (extractionResult.parcelNumbers && extractionResult.parcelNumbers.length > 0) {
      try {
        for (const parcelNumber of extractionResult.parcelNumbers) {
          const parcels = await storage.searchParcelsByNumber(parcelNumber);
          if (parcels.length > 0) {
            // Found matching parcels, associate them with the document
            const parcelIds = parcels.map(p => p.id);
            await this.associateWithParcels(document.id, parcelIds);
          }
        }
      } catch (error) {
        console.error('Error auto-associating parcels:', error);
        // Continue even if parcel association fails
      }
    }
    
    return document;
  }
  
  /**
   * Creates a new version of an existing document
   * @param params Version creation parameters
   * @returns Created document version
   */
  async createDocumentVersion(params: {
    documentId: number;
    versionNumber: number;
    content: string; // Base64 encoded content
    notes?: string;
  }) {
    const contentHash = this.generateContentHash(params.content);
    const document = await storage.getDocument(params.documentId);
    if (!document) {
      throw new Error(`Document with ID ${params.documentId} not found`);
    }
    
    const storageKey = this.generateStorageKey(document.name, contentHash, params.versionNumber);
    
    return await storage.addDocumentVersion({
      documentId: params.documentId,
      versionNumber: params.versionNumber,
      contentHash,
      storageKey,
      notes: params.notes,
      content: params.content
    });
  }
  
  /**
   * Updates the document classification manually
   * @param documentId Document ID
   * @param documentType New document type
   * @returns Updated document
   */
  async updateDocumentClassification(documentId: number, documentType: DocumentType) {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    return await storage.updateDocumentClassification(documentId, {
      documentType,
      confidence: 1.0, // 100% confidence for manual classification
      wasManuallyClassified: true,
      classifiedAt: new Date().toISOString()
    });
  }
  
  /**
   * Generates a cryptographic hash for content integrity verification
   * @param content Base64 encoded document content
   * @returns SHA-256 hash of the content
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Generates a storage key for the document content
   * @param name Original document name
   * @param hash Content hash
   * @param version Optional version number
   * @returns Storage key
   */
  private generateStorageKey(name: string, hash: string, version?: number): string {
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const versionSuffix = version ? `_v${version}` : '';
    return `documents/${hash.substring(0, 8)}/${sanitizedName}${versionSuffix}`;
  }
  
  /**
   * Extracts text from document content for classification
   * Using the enhanced OCR service for better text extraction
   * @param content Base64 encoded document content
   * @param contentType MIME type of the document
   * @returns Extracted text
   */
  public async extractText(content: string, contentType: string): Promise<string> {
    try {
      // Use the enhanced OCR service
      return await documentOcrService.extractText(content, contentType);
    } catch (error) {
      console.error('Error extracting text from document:', error);
      return ''; // Return empty string if extraction fails
    }
  }
  
  /**
   * Extracts structured fields from document text
   * @param documentId Document ID
   * @returns Extraction result with fields
   */
  public async extractDocumentFields(documentId: number): Promise<OcrExtractionResult | null> {
    // Get the document
    const document = await storage.getDocument(documentId);
    if (!document) {
      return null;
    }
    
    // Get the latest version of the document to access its content
    const versions = await storage.getDocumentVersions(documentId);
    if (!versions || versions.length === 0) {
      return null;
    }
    
    // Sort versions by version number (latest first)
    const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
    const latestVersion = sortedVersions[0];
    
    // Get the document content (which would be stored in version record)
    const documentContent = await this.getDocumentContentByKey(latestVersion.storageKey);
    if (!documentContent) {
      return null;
    }
    
    // First extract the text
    const text = await this.extractText(documentContent, document.contentType);
    
    // Then extract structured fields
    return await documentOcrService.extractFields(text);
  }
  
  /**
   * Retrieves document content by storage key
   * In a real system, this would fetch from S3, filesystem, or another storage
   * For this implementation, we're simulating content retrieval
   * @param storageKey The key where the document is stored
   * @returns The document content or null if not found
   */
  private async getDocumentContentByKey(storageKey: string): Promise<string | null> {
    // In a real implementation, this would fetch from persistent storage
    // For now, we'll simulate having the content by generating placeholder text
    // based on the storage key to make it deterministic
    
    // This is a simplified simulation - in a real app, actual document content would be retrieved
    return `Sample document content for ${storageKey}`;
  }
  
  /**
   * Finds documents potentially related to a given document based on content similarity
   * @param documentId Document ID to find relations for
   * @param minSimilarity Minimum similarity threshold (0-1)
   * @returns Array of document similarity results
   */
  public async findRelatedDocuments(documentId: number, minSimilarity: number = 0.4): Promise<any[]> {
    // Get the target document
    const document = await storage.getDocument(documentId);
    if (!document) {
      return [];
    }
    
    // Get the document versions for the target
    const versions = await storage.getDocumentVersions(documentId);
    if (!versions || versions.length === 0) {
      return [];
    }
    
    // Get the latest version
    const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
    const latestVersion = sortedVersions[0];
    
    // Get target document content
    const targetContent = await this.getDocumentContentByKey(latestVersion.storageKey);
    if (!targetContent) {
      return [];
    }
    
    // Get all other documents (excluding the target)
    const allDocuments = await storage.getDocuments();
    const candidateDocumentIds = allDocuments
      .filter(doc => doc.id !== documentId)
      .map(doc => doc.id);
    
    // No candidates to compare
    if (candidateDocumentIds.length === 0) {
      return [];
    }
    
    // Extract text from target document
    const targetText = await this.extractText(targetContent, document.contentType);
    
    // Calculate similarity with each candidate
    const results = [];
    for (const candidateId of candidateDocumentIds) {
      // Get the candidate document
      const candidateDoc = await storage.getDocument(candidateId);
      if (!candidateDoc) continue;
      
      // Get candidate versions
      const candidateVersions = await storage.getDocumentVersions(candidateId);
      if (!candidateVersions || candidateVersions.length === 0) continue;
      
      // Get latest candidate version
      const sortedCandidateVersions = [...candidateVersions].sort((a, b) => b.versionNumber - a.versionNumber);
      const latestCandidateVersion = sortedCandidateVersions[0];
      
      // Get candidate content
      const candidateContent = await this.getDocumentContentByKey(latestCandidateVersion.storageKey);
      if (!candidateContent) continue;
      
      // Extract text from candidate
      const candidateText = await this.extractText(candidateContent, candidateDoc.contentType);
      
      // Calculate similarity
      const similarity = await documentOcrService.calculateContentSimilarity(targetText, candidateText);
      
      if (similarity >= minSimilarity) {
        results.push({
          documentId: candidateDoc.id,
          name: candidateDoc.name,
          type: candidateDoc.type,
          similarityScore: similarity
        });
      }
    }
    
    // Sort by similarity (highest first)
    return results.sort((a, b) => b.similarityScore - a.similarityScore);
  }
  
  /**
   * Gets all documents for a workflow
   * @param workflowId Workflow ID
   * @returns Array of documents
   */
  async getDocumentsForWorkflow(workflowId: number) {
    return await storage.getDocuments(workflowId);
  }
  
  /**
   * Gets all document versions for a document
   * @param documentId Document ID
   * @returns Array of document versions
   */
  async getDocumentVersions(documentId: number) {
    return await storage.getDocumentVersions(documentId);
  }
  
  /**
   * Associates a document with parcels
   * Helper method used for automatic parcel linking
   * @param documentId Document ID
   * @param parcelIds Array of parcel IDs
   */
  private async associateWithParcels(documentId: number, parcelIds: number[]) {
    if (!parcelIds || parcelIds.length === 0) return;
    
    for (const parcelId of parcelIds) {
      try {
        // Check if link already exists
        const existingLink = await storage.getDocumentParcelLink(documentId, parcelId);
        if (!existingLink) {
          // Create new link
          await storage.createDocumentParcelLink({
            documentId,
            parcelId
          });
        }
      } catch (error) {
        console.error(`Error linking document ${documentId} to parcel ${parcelId}:`, error);
      }
    }
  }
}

// Export a singleton instance
export const documentService = new DocumentService();