import { InsertPermit, Permit } from '@shared/schema';
import { log } from '../vite';
import { PermitClassifier } from './permitClassifier';
import { contextualAiService } from './contextualAiService';
import { ragService } from './ragService';
import { openaiService } from './openaiService';
import { OpenAIRequestParams, promptEngineering } from './promptEngineering';

export class AIService {
  private permitClassifier: PermitClassifier;

  constructor() {
    this.permitClassifier = new PermitClassifier();
  }
  
  /**
   * Validate that the OpenAI API key is properly configured
   * @returns True if the key is valid, false otherwise
   */
  async validateApiKey(): Promise<boolean> {
    try {
      return await openaiService.checkApiKey();
    } catch (error) {
      log(`API key validation failed: ${(error as Error).message}`, 'aiService');
      return false;
    }
  }

  /**
   * Analyzes spreadsheet data structure and provides information about its format
   * @param headers Array of column headers from the spreadsheet
   * @param sampleRows Sample rows of data to analyze
   * @returns Analysis of the spreadsheet structure and recommendations
   */
  async analyzeSpreadsheet(headers: string[], sampleRows: Record<string, any>[]): Promise<SpreadsheetAnalysis> {
    try {
      // Convert sample rows to string for analysis
      const sampleRowsStr = JSON.stringify(sampleRows.slice(0, 3), null, 2);
      
      const systemPrompt = `You are an expert in data analysis and spreadsheet structure. 
      You're helping a permit processing application understand various spreadsheet formats.
      Analyze the headers and sample data to determine if they match expected permit data.
      Focus on identifying key fields like parcel numbers, permit types, descriptions, neighborhoods, and values.`;
      
      const userPrompt = `Analyze this spreadsheet data: 
      Headers: ${JSON.stringify(headers)}
      
      Sample rows: ${sampleRowsStr}
      
      I need to know:
      1. Does this appear to be permit data?
      2. Which columns correspond to: parcel number, neighborhood code, permit description, value, issue date?
      3. How should I map these columns to our standard fields?
      4. Are there any data quality issues to be aware of?`;
      
      const params = promptEngineering.createOpenAIRequestParams([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o');
      
      // Set JSON response format
      const requestParams: OpenAIRequestParams = {
        ...params,
        response_format: { type: "json_object" }
      };
      
      const analysisContent = await openaiService.createChatCompletion(requestParams);
      const analysis = JSON.parse(analysisContent);
      
      return {
        isPermitData: analysis.isPermitData || false,
        columnMapping: analysis.columnMapping || {},
        dataQualityIssues: analysis.dataQualityIssues || [],
        confidence: analysis.confidence || 0,
        message: analysis.message || "Analysis complete"
      };
    } catch (error: any) {
      log(`AI spreadsheet analysis error: ${error.message}`, 'aiService');
      return {
        isPermitData: false,
        columnMapping: {},
        dataQualityIssues: [`Analysis failed: ${error.message}`],
        confidence: 0,
        message: "Failed to analyze spreadsheet with AI"
      };
    }
  }

  /**
   * Performs intelligent classification of permits using AI
   * @param permits Array of permits to classify
   * @param useAdvancedAI Whether to use advanced AI capabilities (contextual + RAG)
   * @returns Classified permits with enterPermit and reason fields populated
   */
  async classifyPermitsWithAI(permits: InsertPermit[], useAdvancedAI = false): Promise<InsertPermit[]> {
    // Use enhanced contextual classification if requested
    if (useAdvancedAI) {
      log(`Using advanced AI classification for ${permits.length} permits`, 'aiService');
      try {
        // Using contextual AI for better results
        return await contextualAiService.contextualPermitClassification(permits);
      } catch (error: any) {
        log(`Advanced AI classification failed: ${error.message}, falling back to standard`, 'aiService');
        // Fall back to standard classification on error
      }
    }
    
    // Standard classification path
    // Use rule-based classification first
    const classifiedPermits = this.permitClassifier.classifyPermits(permits);
    
    // For permits that need special handling or are edge cases, use AI
    const edgeCases = classifiedPermits.filter(permit => 
      this.isEdgeCase(permit) || this.needsSpecialReview(permit)
    );
    
    if (edgeCases.length === 0) {
      return classifiedPermits;
    }
    
    try {
      // Process edge cases in batches to avoid token limits
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < edgeCases.length; i += batchSize) {
        batches.push(edgeCases.slice(i, i + batchSize));
      }
      
      const processedBatches = await Promise.all(batches.map(batch => 
        this.processEdgeCasesBatch(batch)
      ));
      
      // Combine all processed edge cases
      const processedEdgeCases = processedBatches.flat();
      
      // Replace original edge cases with AI-processed ones
      return classifiedPermits.map(permit => {
        const processed = processedEdgeCases.find(p => p.parcelNumber === permit.parcelNumber);
        return processed || permit;
      });
    } catch (error: any) {
      log(`AI permit classification error: ${error.message}`, 'aiService');
      return classifiedPermits; // Fall back to rule-based classification
    }
  }

  /**
   * Process a batch of edge case permits using AI
   */
  private async processEdgeCasesBatch(permits: InsertPermit[]): Promise<InsertPermit[]> {
    const permitDataStr = JSON.stringify(permits.map(p => ({
      parcelNumber: p.parcelNumber,
      neighborhoodCode: p.neighborhoodCode,
      permitDescription: p.permitDescription,
      value: p.value,
      issueDate: p.issueDate
    })), null, 2);
    
    const systemPrompt = `You are an expert in permit processing. Apply these rules:
    1. Commercial permits (usually in neighborhoods starting with C) should be entered (enterPermit=true)
    2. Residential permits like HVAC, re-roof can be skipped (enterPermit=false)
    3. Use your expertise for special cases, uncertain descriptions, or anything needing human review
    4. Always provide a clear reason for your decision`;
    
    const userPrompt = `Analyze these permits and decide whether each should be entered or skipped:
    ${permitDataStr}
    
    For each permit, return:
    1. The parcelNumber
    2. enterPermit (true/false)
    3. reason (explanation for your decision)
    
    Format as JSON array of objects.`;
    
    const params = promptEngineering.createOpenAIRequestParams([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 'gpt-4o');
    
    // Set JSON response format
    const requestParams: OpenAIRequestParams = {
      ...params,
      response_format: { type: "json_object" }
    };
    
    const responseContent = await openaiService.createChatCompletion(requestParams);
    const parsedContent = JSON.parse(responseContent);
    const decisions = parsedContent.permits || [];
    
    // Merge AI decisions with original permits
    return permits.map(permit => {
      const decision = decisions.find((d: any) => d.parcelNumber === permit.parcelNumber);
      if (decision) {
        return {
          ...permit,
          enterPermit: decision.enterPermit,
          reason: decision.reason
        };
      }
      return permit;
    });
  }

  /**
   * Determine if a permit is an edge case requiring AI review
   */
  private isEdgeCase(permit: InsertPermit): boolean {
    // Check for mixed or ambiguous permit descriptions
    if (permit.permitDescription) {
      const description = permit.permitDescription.toLowerCase();
      
      // Check for ambiguous wording
      const ambiguousTerms = ['mixed', 'various', 'multiple', 'other', 'special'];
      if (ambiguousTerms.some(term => description.includes(term))) {
        return true;
      }
      
      // Check for cases with both commercial and residential elements
      if (description.includes('commercial') && description.includes('residential')) {
        return true;
      }
      
      // Check for complex permit types
      const complexTypes = ['renovation', 'remodel', 'conversion', 'addition'];
      if (complexTypes.some(type => description.includes(type))) {
        return true;
      }
    }
    
    // Value-based edge cases (very high-value residential or low-value commercial)
    if (permit.value) {
      const value = parseFloat(permit.value.replace(/[^0-9.]/g, ''));
      const isResidential = permit.neighborhoodCode && !permit.neighborhoodCode.startsWith('C');
      const isCommercial = permit.neighborhoodCode && permit.neighborhoodCode.startsWith('C');
      
      if ((isResidential && value > 500000) || (isCommercial && value < 10000)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determine if a permit needs special review due to data quality issues
   */
  private needsSpecialReview(permit: InsertPermit): boolean {
    // Missing critical fields
    if (!permit.parcelNumber || !permit.permitDescription) {
      return true;
    }
    
    // Check for data quality issues
    if (permit.permitDescription && permit.permitDescription.length < 5) {
      return true; // Very short descriptions might be incomplete
    }
    
    // Unusual neighborhood codes
    if (permit.neighborhoodCode && 
        !permit.neighborhoodCode.startsWith('R') && 
        !permit.neighborhoodCode.startsWith('C')) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract permit data from unstructured text using AI
   * Useful for non-standard spreadsheets or text files
   */
  async extractPermitDataFromText(text: string): Promise<InsertPermit[]> {
    try {
      const truncatedText = text.substring(0, 8000); // Limiting text length to avoid token limits
      
      const systemPrompt = `You are a data extraction expert specialized in permit records. 
      Extract structured permit data from unstructured text. 
      Look for parcel numbers, descriptions, values, dates, and neighborhood codes.`;
      
      const userPrompt = `Extract permit data from this text (which might be from a spreadsheet, PDF, etc.):
      
      ${truncatedText}
      
      Convert to structured permit records with these fields:
      - parcelNumber (required)
      - neighborhoodCode
      - permitDescription
      - value
      - issueDate (in YYYY-MM-DD format if possible)
      
      Return as a JSON array of permit objects.`;
      
      const params = promptEngineering.createOpenAIRequestParams([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o');
      
      // Set JSON response format
      const requestParams: OpenAIRequestParams = {
        ...params,
        response_format: { type: "json_object" }
      };
      
      const responseContent = await openaiService.createChatCompletion(requestParams);
      const extractedData = JSON.parse(responseContent);
      
      if (extractedData.permits && Array.isArray(extractedData.permits)) {
        // Add uploadId to each permit (will be provided by caller)
        return extractedData.permits.map((permit: any) => ({
          ...permit,
          uploadId: 0, // Placeholder, will be set by caller
          enterPermit: false, // Will be set by classification
          reason: "Extracted from unstructured data" // Default reason
        }));
      }
      
      throw new Error("AI couldn't extract structured permit data");
    } catch (error: any) {
      log(`AI permit extraction error: ${error.message}`, 'aiService');
      throw new Error(`Failed to extract permit data: ${error.message}`);
    }
  }
  
  /**
   * Generate a batch summary with enhanced analytics
   * @param permits - The processed permits
   * @returns Detailed summary with insights
   */
  async generateEnhancedBatchSummary(permits: Permit[]): Promise<BatchSummary> {
    try {
      return await contextualAiService.generateBatchSummary(permits);
    } catch (error: any) {
      log(`Enhanced batch summary generation error: ${error.message}`, 'aiService');
      // Return basic summary on error
      const totalCount = permits.length;
      const enteredCount = permits.filter(p => p.enterPermit).length;
      const skippedCount = totalCount - enteredCount;
      
      return {
        metrics: {
          totalCount,
          enteredCount,
          skippedCount,
          enteredPercentage: totalCount > 0 ? Math.round((enteredCount / totalCount) * 100) : 0,
          skippedPercentage: totalCount > 0 ? Math.round((skippedCount / totalCount) * 100) : 0
        },
        insights: ["Basic summary only - AI analysis failed"],
        categories: {},
        potentialIssues: [],
        recommendations: []
      };
    }
  }
  
  /**
   * Get an enhanced explanation for a permit decision using RAG
   * @param permit - The permit to explain
   * @returns Detailed explanation with context
   */
  async getEnhancedPermitExplanation(permit: Permit): Promise<EnhancedExplanation> {
    try {
      // Use RAG system for enhanced explanations
      return await ragService.generateEnhancedExplanation(permit);
    } catch (error: any) {
      log(`Enhanced explanation generation error: ${error.message}`, 'aiService');
      // Return basic explanation on error
      return {
        explanation: `This permit was ${permit.enterPermit ? 'entered' : 'skipped'} because ${permit.reason}.`,
        codeReferences: [],
        similarPermits: []
      };
    }
  }
  
  /**
   * Vectorize permits to enable semantic search
   * @param permits - Permits to vectorize
   */
  async vectorizePermitsForSearch(permits: Permit[]): Promise<void> {
    try {
      await ragService.vectorizePermits(permits);
    } catch (error: any) {
      log(`Permit vectorization error: ${error.message}`, 'aiService');
    }
  }
  
  /**
   * Search for similar permits
   * @param query - Search query text
   * @param limit - Maximum number of results
   * @returns Similar permits with relevance scores
   */
  async searchSimilarPermits(query: string, limit = 5): Promise<Array<{ permit: Permit, similarity: number }>> {
    try {
      return await ragService.searchSimilarPermits(query, limit);
    } catch (error: any) {
      log(`Similar permit search error: ${error.message}`, 'aiService');
      return [];
    }
  }
  
  /**
   * Answer a permit-related question using the RAG system
   * @param question - User's question
   * @param relevantPermits - Optional permits to use as context
   * @returns Detailed answer
   */
  async answerQuestion(question: string, relevantPermits?: Permit[]): Promise<string> {
    try {
      return await ragService.answerPermitQuestion(question, relevantPermits);
    } catch (error: any) {
      log(`Question answering error: ${error.message}`, 'aiService');
      return "Sorry, I couldn't generate an answer at this time. Please try again later.";
    }
  }
}

// Interface for spreadsheet analysis results
export interface SpreadsheetAnalysis {
  isPermitData: boolean;
  columnMapping: Record<string, string>; // Maps found columns to standard fields
  dataQualityIssues: string[];
  confidence: number; // 0-1 confidence score
  message: string;
}

// Re-export interfaces from contextualAiService and ragService
export interface BatchSummary {
  metrics: {
    totalCount: number;
    enteredCount: number;
    skippedCount: number;
    enteredPercentage: number;
    skippedPercentage: number;
  };
  insights: string[];
  categories: Record<string, number>;
  potentialIssues: string[];
  recommendations: string[];
}

export interface EnhancedExplanation {
  explanation: string;
  codeReferences: string[];
  similarPermits: Permit[];
}

// Singleton instance
export const aiService = new AIService();