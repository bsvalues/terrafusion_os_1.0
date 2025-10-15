/**
 * Service for advanced document OCR and text analysis
 * This service enhances the basic document classification with:
 * 1. Improved text extraction from various document types
 * 2. Field extraction (parcel numbers, legal descriptions, etc.)
 * 3. Content-based document similarity and relation detection
 */
export interface OcrExtractionResult {
  fullText: string;
  parcelNumbers: string[];
  legalDescription?: string;
  ownerNames?: string[];
  dates?: string[];
  addresses?: string[];
  extractionConfidence: number;
}

export interface DocumentSimilarityResult {
  documentId: number;
  similarityScore: number;
  sharedFields: {
    parcelNumbers?: string[];
    legalDescriptions?: string[];
    ownerNames?: string[];
  };
}

class DocumentOcrService {
  /**
   * Extracts text from document content 
   * @param content Base64 encoded document content
   * @param contentType MIME type of the document
   * @returns Extracted text
   */
  async extractText(content: string, contentType: string): Promise<string> {
    // For PDF documents
    if (contentType === 'application/pdf') {
      return this.extractTextFromPdf(content);
    }
    
    // For image-based documents
    if (contentType.startsWith('image/')) {
      return this.extractTextFromImage(content);
    }
    
    // For text-based documents
    if (contentType.startsWith('text/') || 
        contentType.includes('json') || 
        contentType.includes('xml')) {
      return this.extractTextFromTextDocument(content);
    }
    
    // Default extraction for unknown types
    try {
      const buffer = Buffer.from(content, 'base64');
      return buffer.toString('ascii')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      console.error('Error extracting text from document:', error);
      return '';
    }
  }
  
  /**
   * Extracts structured fields from document text
   * @param text Extracted document text
   * @returns Object containing extracted fields
   */
  async extractFields(text: string): Promise<OcrExtractionResult> {
    const result: OcrExtractionResult = {
      fullText: text,
      parcelNumbers: [],
      extractionConfidence: 0
    };
    
    // Extract parcel numbers using regex patterns
    const parcelPatterns = [
      /Parcel(?:\s+ID)?(?:\s*[:#]?\s*)([0-9-]{5,15})/gi,
      /(?:Tax|Property)(?:\s+ID)?(?:\s*[:#]?\s*)([0-9-]{5,15})/gi,
      /(?:APN|Assessor(?:'s)? Parcel Number)(?:\s*[:#]?\s*)([0-9-]{5,15})/gi
    ];
    
    for (const pattern of parcelPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && !result.parcelNumbers.includes(match[1])) {
          result.parcelNumbers.push(match[1]);
        }
      }
    }
    
    // Extract legal description
    const legalDescPattern = /LEGAL\s+DESCRIPTION\s*:?\s*((?:[^\n]+\n?)+?)\s*(?:\n\n|\n[A-Z]|$)/i;
    const legalMatch = legalDescPattern.exec(text);
    if (legalMatch && legalMatch[1]) {
      result.legalDescription = legalMatch[1].trim();
    }
    
    // Extract owner names
    const ownerPatterns = [
      /Owner(?:\s+Name)?(?:\s*[:#]?\s*)([A-Z\s,]+)(?:\n|,)/i,
      /(?:Grantor|Grantee)(?:\s*[:#]?\s*)([A-Z\s,]+)(?:\n|,)/i
    ];
    
    result.ownerNames = [];
    for (const pattern of ownerPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && !result.ownerNames.includes(match[1].trim())) {
          result.ownerNames.push(match[1].trim());
        }
      }
    }
    
    // Extract dates using regex
    const datePattern = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/gi;
    result.dates = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(text)) !== null) {
      if (dateMatch[1] && !result.dates.includes(dateMatch[1])) {
        result.dates.push(dateMatch[1]);
      }
    }
    
    // Calculate extraction confidence based on how many fields we found
    let fieldsFound = 0;
    if (result.parcelNumbers.length > 0) fieldsFound++;
    if (result.legalDescription) fieldsFound++;
    if (result.ownerNames && result.ownerNames.length > 0) fieldsFound++;
    if (result.dates && result.dates.length > 0) fieldsFound++;
    
    result.extractionConfidence = fieldsFound / 4; // Simple confidence calculation
    
    return result;
  }
  
  /**
   * Calculates content similarity between two document texts
   * @param text1 First document text
   * @param text2 Second document text
   * @returns Similarity score between 0 and 1
   */
  async calculateContentSimilarity(text1: string, text2: string): Promise<number> {
    // Implement a simple Jaccard similarity calculation
    // In production, this would use more sophisticated NLP techniques
    
    // Tokenize and normalize the texts
    const tokens1 = this.tokenizeText(text1);
    const tokens2 = this.tokenizeText(text2);
    
    // Calculate Jaccard similarity
    const intersection = tokens1.filter(token => tokens2.includes(token));
    
    // Create a union without using Set iteration (ES5 compatible)
    const unionMap: Record<string, boolean> = {};
    tokens1.forEach(token => { unionMap[token] = true; });
    tokens2.forEach(token => { unionMap[token] = true; });
    const union = Object.keys(unionMap);
    
    return intersection.length / union.length;
  }
  
  /**
   * Suggests related documents based on content similarity
   * @param document Target document with content
   * @param candidateDocuments Array of potential related documents with content
   * @returns Array of document similarity results
   */
  async suggestRelatedDocuments(
    document: { id: number, content: string },
    candidateDocuments: Array<{ id: number, content: string }>
  ): Promise<DocumentSimilarityResult[]> {
    const results: DocumentSimilarityResult[] = [];
    
    for (const candidate of candidateDocuments) {
      const similarityScore = await this.calculateContentSimilarity(
        document.content, 
        candidate.content
      );
      
      // Only include documents with meaningful similarity
      if (similarityScore > 0.3) {
        // In production, also identify shared fields like parcel numbers
        results.push({
          documentId: candidate.id,
          similarityScore,
          sharedFields: {} // Would contain shared parcel numbers, etc.
        });
      }
    }
    
    // Sort by similarity score (highest first)
    return results.sort((a, b) => b.similarityScore - a.similarityScore);
  }
  
  /**
   * Searches for specific patterns in document text
   * @param text Document text
   * @param patterns Array of regex patterns to search for
   * @returns Array of matches
   */
  searchPatterns(text: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && !matches.includes(match[1])) {
          matches.push(match[1]);
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Private helper method to extract text from PDF documents
   * In production, this would use a PDF parsing library
   */
  private async extractTextFromPdf(base64Content: string): Promise<string> {
    // This is a simplified implementation
    // In production, use a PDF library like pdf.js or pdfparse
    
    // For now, just return a simple extraction of readable ASCII characters
    try {
      const buffer = Buffer.from(base64Content, 'base64');
      return buffer.toString('ascii')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }
  
  /**
   * Private helper method to extract text from image documents
   * In production, this would use an OCR service
   */
  private async extractTextFromImage(base64Content: string): Promise<string> {
    // This is a simplified implementation
    // In production, use an OCR library or service
    
    // For now, return a placeholder message
    return "Image document content (OCR would extract text in production)";
  }
  
  /**
   * Private helper method to extract text from text-based documents
   */
  private async extractTextFromTextDocument(base64Content: string): Promise<string> {
    try {
      const buffer = Buffer.from(base64Content, 'base64');
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('Error extracting text from text document:', error);
      return '';
    }
  }
  
  /**
   * Tokenizes and normalizes text for similarity comparison
   */
  private tokenizeText(text: string): string[] {
    // Normalize text: lowercase, remove punctuation, split into words
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2); // Remove very short words
  }
}

// Export a singleton instance
export const documentOcrService = new DocumentOcrService();