import { log } from '../vite';
import { Permit } from '@shared/schema';
import { openaiService } from './openaiService';
import { promptEngineering } from './promptEngineering';

/**
 * Helper function to validate OpenAI API key before making calls
 * @returns True if API key is valid, otherwise throws an error
 */
async function validateApiKey(): Promise<boolean> {
  const isValid = await openaiService.checkApiKey();
  if (!isValid) {
    throw new Error('OpenAI API key is not configured or invalid. Please set the OPENAI_API_KEY environment variable.');
  }
  return true;
}

/**
 * RAGService implements Retrieval-Augmented Generation for permits
 * It creates and maintains vector embeddings for permits and related data
 * and enables semantic search and knowledge-enhanced responses
 */
export class RAGService {
  private permitVectors: Record<number, { vector: number[], permit: Permit }> = {};
  private codeReferences: Record<string, string[]> = {
    'commercial': [
      'Commercial permits must be entered manually to verify compliance with regulations 2.3.1 and 4.5.6.',
      'All commercial permits require plan review according to section 7.2.3 of the building code.',
      'Commercial permits over $100,000 require additional structural review.'
    ],
    'residential': [
      'Residential permits follow simplified procedures under code section 3.1.2.',
      'Residential HVAC replacements can be auto-approved under ordinance 22-14.',
      'Residential re-roofing permits are eligible for expedited processing.'
    ],
    'new_construction': [
      'New construction requires full plan review regardless of building type.',
      'New construction permits must include site plan, foundation plan, and elevation drawings.',
      'Construction value above $500,000 requires additional environmental impact review.'
    ],
    'renovation': [
      'Renovations involving structural changes require engineering review.',
      'Interior-only renovations without electrical or plumbing changes qualify for expedited processing.',
      'Historical district renovations require additional review by the historical commission.'
    ]
  };
  
  constructor() {
    // Initialize in-memory vector database
    // In a production environment, this would use a proper vector database
  }
  
  /**
   * Generate and store vector embeddings for permits to enable semantic search
   * @param permits - Permits to vectorize
   */
  async vectorizePermits(permits: Permit[]): Promise<void> {
    try {
      // Process in batches to optimize API usage
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < permits.length; i += batchSize) {
        batches.push(permits.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(async (permit) => {
          // Create a text representation of the permit for embedding
          const permitText = `Parcel: ${permit.parcelNumber}. 
                             Neighborhood: ${permit.neighborhoodCode}. 
                             Description: ${permit.permitDescription}. 
                             Value: ${permit.value}. 
                             Issue Date: ${permit.issueDate}.
                             Status: ${permit.enterPermit ? 'Entered' : 'Skipped'}.
                             Reason: ${permit.reason}.`;
          
          const embedding = await this.generateEmbedding(permitText);
          this.permitVectors[permit.id] = {
            vector: embedding,
            permit
          };
        }));
      }
      
      log(`Vectorized ${permits.length} permits successfully`, 'ragService');
    } catch (error: any) {
      log(`Error vectorizing permits: ${error.message}`, 'ragService');
    }
  }
  
  /**
   * Generate embedding for a text using OpenAI's embedding API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Use the openaiService to generate embeddings
      const embeddings = await openaiService.generateEmbeddings(text);
      if (embeddings.length === 0) {
        throw new Error("Received empty embedding vector");
      }
      
      return embeddings;
    } catch (error: any) {
      log(`Embedding generation error: ${error.message}`, 'ragService');
      // Return a zero vector as fallback
      return new Array(1536).fill(0);
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      aMagnitude += a[i] * a[i];
      bMagnitude += b[i] * b[i];
    }
    
    aMagnitude = Math.sqrt(aMagnitude);
    bMagnitude = Math.sqrt(bMagnitude);
    
    return dotProduct / (aMagnitude * bMagnitude);
  }
  
  /**
   * Search for similar permits by description or characteristics
   * @param query - Search query text
   * @param limit - Maximum number of results to return
   * @returns Array of similar permits with similarity scores
   */
  async searchSimilarPermits(query: string, limit = 5): Promise<Array<{ permit: Permit, similarity: number }>> {
    try {
      // Generate embedding for the query
      const queryVector = await this.generateEmbedding(query);
      
      // Calculate similarity with all vectorized permits
      const results = Object.values(this.permitVectors).map(({ vector, permit }) => {
        const similarity = this.cosineSimilarity(queryVector, vector);
        return { permit, similarity };
      });
      
      // Sort by similarity (higher is better) and take top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error: any) {
      log(`Error searching similar permits: ${error.message}`, 'ragService');
      return [];
    }
  }
  
  /**
   * Get contextually relevant code references and regulations for a permit
   * @param permit - The permit to find references for
   * @returns Array of relevant code references and regulations
   */
  async getRelevantCodeReferences(permit: Permit): Promise<string[]> {
    try {
      if (!permit.permitDescription) return [];
      
      const description = permit.permitDescription.toLowerCase();
      const references: string[] = [];
      
      // Match permit description to code reference categories
      if (description.includes('commercial') || (permit.neighborhoodCode && permit.neighborhoodCode.startsWith('C'))) {
        references.push(...(this.codeReferences['commercial'] || []));
      }
      
      if (description.includes('residential') || (permit.neighborhoodCode && !permit.neighborhoodCode.startsWith('C'))) {
        references.push(...(this.codeReferences['residential'] || []));
      }
      
      if (description.includes('new') && (description.includes('construction') || description.includes('build'))) {
        references.push(...(this.codeReferences['new_construction'] || []));
      }
      
      if (description.includes('renovation') || description.includes('remodel') || description.includes('repair')) {
        references.push(...(this.codeReferences['renovation'] || []));
      }
      
      return references;
    } catch (error: any) {
      log(`Error finding code references: ${error.message}`, 'ragService');
      return [];
    }
  }
  
  /**
   * Generate context-enhanced explanation of a permit decision using RAG
   * @param permit - The permit to explain
   * @returns Detailed explanation with relevant regulations and similar examples
   */
  async generateEnhancedExplanation(permit: Permit): Promise<EnhancedExplanation> {
    try {
      // Get relevant code references
      const codeReferences = await this.getRelevantCodeReferences(permit);
      
      // Find similar permits (but exclude the current one)
      const similarPermits = await this.searchSimilarPermits(permit.permitDescription || '', 3);
      const filteredSimilarPermits = similarPermits
        .filter(item => item.permit.id !== permit.id)
        .slice(0, 2); // Take at most 2 similar permits
      
      // Create context from references and similar permits
      const context = `
        Relevant regulations:
        ${codeReferences.join('\n')}
        
        Similar permits:
        ${filteredSimilarPermits.map(item => 
          `- ${item.permit.permitDescription || 'Unknown description'} (${item.permit.enterPermit ? 'Entered' : 'Skipped'}: ${item.permit.reason || 'No reason provided'})`
        ).join('\n')}
      `;
      
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Define system and user prompts
      const systemPrompt = `You are a permit processing expert that explains permit decisions.
      Use the provided context information to enhance your explanation.
      Be clear, concise, and focus on the specific details of this permit.
      Explain in terms that a regular citizen can understand.`;
      
      const userPrompt = `Explain the decision for this permit in detail:
      
      Permit: ${JSON.stringify(permit, null, 2)}
      
      Context information:
      ${context}
      
      Provide a detailed explanation of why this permit was ${permit.enterPermit ? 'entered' : 'skipped'},
      referencing relevant regulations and similar cases where appropriate.`;
      
      // Use promptEngineering to create consistent params and openaiService to make the API call
      const params = promptEngineering.createOpenAIRequestParams([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o');
      
      const explanation = await openaiService.createChatCompletion(params) ||
        `This permit was ${permit.enterPermit ? 'entered' : 'skipped'} because ${permit.reason || 'of standard processing rules'}.`;
      
      return {
        explanation,
        codeReferences,
        similarPermits: filteredSimilarPermits.map(item => item.permit)
      };
    } catch (error: any) {
      log(`Error generating enhanced explanation: ${error.message}`, 'ragService');
      return {
        explanation: `This permit was ${permit.enterPermit ? 'entered' : 'skipped'} based on standard processing rules.`,
        codeReferences: [],
        similarPermits: []
      };
    }
  }
  
  /**
   * Answer a specific question about permits using RAG
   * @param question - The user's question about permits
   * @param relevantPermits - Optional array of permits to use as context
   * @returns Detailed answer based on permit knowledge and context
   */
  async answerPermitQuestion(question: string, relevantPermits?: Permit[]): Promise<string> {
    try {
      // Find relevant permits based on the question if not provided
      const permits = relevantPermits || [];
      let contextPermits = permits;
      
      if (permits.length === 0) {
        // Search for relevant permits
        const searchResults = await this.searchSimilarPermits(question, 5);
        contextPermits = searchResults.map(item => item.permit);
      }
      
      // Get relevant code references based on the question
      const queryVector = await this.generateEmbedding(question);
      const referenceCategories = ['commercial', 'residential', 'new_construction', 'renovation'];
      
      // Find most relevant reference categories
      const categoryVectors: Record<string, number[]> = {};
      for (const category of referenceCategories) {
        categoryVectors[category] = await this.generateEmbedding(category);
      }
      
      const relevantCategories = referenceCategories
        .map(category => ({
          category,
          similarity: this.cosineSimilarity(queryVector, categoryVectors[category])
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 2) // Take top 2 categories
        .map(item => item.category);
      
      const codeReferences: string[] = [];
      for (const category of relevantCategories) {
        codeReferences.push(...(this.codeReferences[category] || []));
      }
      
      // Create context from references and relevant permits
      const context = `
        Relevant regulations:
        ${codeReferences.join('\n')}
        
        Relevant permit examples:
        ${contextPermits.slice(0, 3).map(permit => 
          `- ${permit.permitDescription || 'Unknown description'} (${permit.enterPermit ? 'Entered' : 'Skipped'}: ${permit.reason || 'No reason provided'})`
        ).join('\n')}
      `;
      
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Define system and user prompts
      const systemPrompt = `You are a permit processing expert assistant.
      Answer questions about permits, building codes, and processing procedures.
      Use the provided context information to enhance your answer.
      Be clear, concise, and accurate. If you don't know something, say so.
      Always reference relevant regulations when appropriate.`;
      
      const userPrompt = `Question: ${question}
      
      Context information:
      ${context}
      
      Provide a detailed answer to the question, referencing relevant regulations 
      and permit examples where appropriate.`;
      
      // Use the promptEngineering service to create consistent params
      const params = promptEngineering.createOpenAIRequestParams([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o');
      
      // Use openaiService for the API call with error handling
      const answer = await openaiService.createChatCompletion(params);
      
      return answer || "I don't have enough information to answer this question accurately.";
    } catch (error: any) {
      log(`Error answering permit question: ${error.message}`, 'ragService');
      return "I encountered an error while trying to answer your question. Please try again or rephrase your question.";
    }
  }
}

/**
 * Interface for enhanced explanation
 */
export interface EnhancedExplanation {
  explanation: string;
  codeReferences: string[];
  similarPermits: Permit[];
}

// Singleton instance
export const ragService = new RAGService();