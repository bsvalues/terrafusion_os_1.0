import { storage } from '../storage';
import { DocumentParcelLink } from '@shared/schema';

/**
 * Service for managing the associations between documents and parcels
 */
class DocumentParcelService {
  /**
   * Associates a document with one or more parcels
   * @param documentId The document ID
   * @param parcelIds Array of parcel IDs to associate with the document
   * @param linkType Optional relationship type between document and parcel
   * @param notes Optional notes about the relationship
   * @returns Array of created document-parcel links
   */
  async associateDocumentWithParcels(
    documentId: number, 
    parcelIds: number[], 
    linkType?: string,
    notes?: string
  ) {
    // Ensure the document exists
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Create links for each parcel
    const links = [];
    for (const parcelId of parcelIds) {
      // Ensure the parcel exists
      const parcel = await storage.getParcelById(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Check if the link already exists
      const existingLink = await storage.getDocumentParcelLink(documentId, parcelId);
      if (existingLink) {
        links.push(existingLink);
        continue;
      }
      
      // Create a new link
      const link = await storage.createDocumentParcelLink({
        documentId,
        parcelId,
        linkType: linkType || "reference", // Default to reference if not specified
        notes: notes || undefined
      });
      
      links.push(link);
    }
    
    return links;
  }
  
  /**
   * Removes associations between a document and parcels
   * @param documentId The document ID
   * @param parcelIds Optional array of specific parcel IDs to disassociate (if not provided, all links are removed)
   * @returns Number of links removed
   */
  async disassociateDocumentFromParcels(documentId: number, parcelIds?: number[]) {
    return await storage.removeDocumentParcelLinks(documentId, parcelIds);
  }
  
  /**
   * Gets all parcels associated with a document
   * @param documentId The document ID
   * @returns Array of parcels
   */
  async getParcelsForDocument(documentId: number) {
    return await storage.getParcelsForDocument(documentId);
  }
  
  /**
   * Gets all document-parcel links for a specific document
   * @param documentId The document ID
   * @returns Array of document-parcel links with metadata
   */
  async getDocumentParcelLinks(documentId: number) {
    // Get all links involving this document
    const links = await storage.getDocumentParcelLinksByDocumentId(documentId);
    return links;
  }
  
  /**
   * Gets detailed relationship information for a document and its parcels
   * @param documentId The document ID
   * @returns Document with linked parcels array including relationship info
   */
  async getDocumentRelationships(documentId: number) {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Get all parcels linked to this document
    const parcels = await this.getParcelsForDocument(documentId);
    
    // Get all links for this document
    const links = await this.getDocumentParcelLinks(documentId);
    
    // Enhance parcels with link information
    const linkedParcels = parcels.map(parcel => {
      const link = links.find(l => l.parcelId === parcel.id);
      return {
        ...parcel,
        linkType: link?.linkType || "reference",
        linkId: link?.id
      };
    });
    
    return {
      ...document,
      linkedParcels
    };
  }
  
  /**
   * Gets all documents associated with a parcel
   * @param parcelId The parcel ID
   * @returns Array of documents
   */
  async getDocumentsForParcel(parcelId: number) {
    return await storage.getDocumentsForParcel(parcelId);
  }
  
  /**
   * Gets all document-parcel links for a specific parcel
   * @param parcelId The parcel ID
   * @returns Array of document-parcel links with metadata
   */
  async getParcelDocumentLinks(parcelId: number) {
    // Get all links involving this parcel
    const links = await storage.getDocumentParcelLinksByParcelId(parcelId);
    return links;
  }
  
  /**
   * Gets detailed relationship information for a parcel and its documents
   * @param parcelId The parcel ID
   * @returns Parcel with linked documents array including relationship info
   */
  async getParcelRelationships(parcelId: number) {
    const parcel = await storage.getParcelById(parcelId);
    if (!parcel) {
      throw new Error(`Parcel with ID ${parcelId} not found`);
    }
    
    // Get all documents linked to this parcel
    const documents = await this.getDocumentsForParcel(parcelId);
    
    // Get all links for this parcel
    const links = await this.getParcelDocumentLinks(parcelId);
    
    // Enhance documents with link information
    const linkedDocuments = documents.map(document => {
      const link = links.find(l => l.documentId === document.id);
      return {
        ...document,
        linkType: link?.linkType || "reference",
        linkId: link?.id
      };
    });
    
    return {
      ...parcel,
      linkedDocuments
    };
  }
  
  /**
   * Updates a document-parcel link with new information
   * @param linkId The link ID to update
   * @param linkType New relationship type
   * @param notes New notes
   * @returns Updated document-parcel link
   */
  async updateDocumentParcelLink(
    linkId: number,
    linkType?: string,
    notes?: string
  ): Promise<DocumentParcelLink> {
    // Get existing link to verify it exists
    const link = await storage.getDocumentParcelLinkById(linkId);
    if (!link) {
      throw new Error(`Document-parcel link with ID ${linkId} not found`);
    }
    
    // Update the link
    const updatedLink = await storage.updateDocumentParcelLink(linkId, {
      linkType,
      notes
    });
    
    return updatedLink;
  }
  
  /**
   * Searches for documents associated with a parcel matching a parcel number
   * @param parcelNumber The parcel number to search for
   * @returns Array of documents
   */
  async getDocumentsForParcelNumber(parcelNumber: string) {
    const parcels = await storage.searchParcelsByNumber(parcelNumber);
    if (parcels.length === 0) {
      return [];
    }
    
    const documents = [];
    for (const parcel of parcels) {
      const docs = await this.getDocumentsForParcel(parcel.id);
      documents.push(...docs);
    }
    
    // Remove duplicates
    return [...new Map(documents.map(doc => [doc.id, doc])).values()];
  }
}

// Export a singleton instance
export const documentParcelService = new DocumentParcelService();