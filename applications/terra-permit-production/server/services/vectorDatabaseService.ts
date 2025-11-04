/**
 * Vector Database Service
 * This service implements vector database capabilities for semantic search
 * and similarity matching of permits and related data.
 */

import { ChatOpenAI } from "@langchain/openai";
import { Embeddings } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import * as crypto from 'crypto';
import { storage } from "../storage";
import { Permit } from "../../shared/schema";

// Helper function to validate OpenAI API key
async function validateApiKey(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }
  return true;
}

/**
 * Interface for vector search result
 */
export interface VectorSearchResult {
  permit: Permit;
  similarity: number;
}

/**
 * Interface for permit metadata in vector storage
 */
interface PermitMetadata {
  permitId: number;
  neighborhoodCode: string | null;
  description: string | null;
  enterPermit: boolean | null;
}

/**
 * VectorDatabaseService provides vector database capabilities for
 * semantic search and similarity matching
 */
export class VectorDatabaseService {
  private openAIEmbeddings: Embeddings | null = null;
  private pineconeClient: Pinecone | null = null;
  private pineconeIndex: any = null;
  private inMemoryVectors: Map<string, { vector: number[], metadata: PermitMetadata }>;
  private indexName = "permit-index";
  private namespace = "permits";
  private dimension = 1536; // OpenAI's text-embedding-ada-002 has 1536 dimensions
  
  constructor() {
    // Initialize in-memory vector storage as fallback
    this.inMemoryVectors = new Map();
    
    // Initialize the embeddings and vector DB
    this.initialize();
  }
  
  /**
   * Initialize the vector database and embeddings
   */
  private async initialize(): Promise<void> {
    try {
      await validateApiKey();
      
      // Initialize OpenAI embeddings
      this.openAIEmbeddings = new OpenAIEmbeddings({
        modelName: "text-embedding-ada-002",
        dimensions: this.dimension
      });
      
      // Initialize Pinecone client if credentials are available
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;
      
      if (pineconeApiKey) {
        // Pinecone v5.1.1 doesn't use environment in the constructor
        this.pineconeClient = new Pinecone({
          apiKey: pineconeApiKey,
        });
        
        // Try to get or create the index
        try {
          // Check if index exists
          const indexList = await this.pineconeClient.listIndexes();
          
          if (indexList.indexes?.some(idx => idx.name === this.indexName)) {
            this.pineconeIndex = this.pineconeClient.index(this.indexName);
            console.log(`Connected to existing Pinecone index '${this.indexName}'`);
          } else {
            // Create new index with serverless spec for AWS free tier
            await this.pineconeClient.createIndex({
              name: this.indexName,
              dimension: this.dimension,
              metric: "cosine",
              spec: {
                serverless: {
                  cloud: "aws",
                  region: "us-east-1"
                }
              }
            });
            
            console.log(`Created new Pinecone index '${this.indexName}'`);
            this.pineconeIndex = this.pineconeClient.index(this.indexName);
          }
        } catch (error) {
          console.error("Error with Pinecone index:", error);
        }
      } else {
        console.log("Pinecone credentials not found. Using in-memory vector storage as fallback.");
      }
      
      console.log("Vector database service initialized");
    } catch (error) {
      console.error("Failed to initialize vector database service:", error);
      console.log("Using in-memory vector storage as fallback.");
    }
  }
  
  /**
   * Generate embeddings for a text string
   * @param text The text to generate embeddings for
   * @returns Vector representation of the text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.openAIEmbeddings) {
        await this.initialize();
      }
      
      if (!this.openAIEmbeddings) {
        throw new Error("Embeddings service failed to initialize");
      }
      
      const embedding = await this.openAIEmbeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      
      // Don't generate synthetic data, instead throw an error
      throw new Error("Failed to generate embedding. Please ensure OpenAI API key is correctly configured.");
    }
  }
  
  /**
   * Vectorize a batch of permits and store in the vector database
   * @param permits Permits to vectorize and store
   */
  async vectorizePermits(permits: Permit[]): Promise<void> {
    try {
      await validateApiKey();
      
      if (!this.openAIEmbeddings) {
        await this.initialize();
      }
      
      console.log(`Vectorizing ${permits.length} permits`);
      
      // Process each permit
      for (const permit of permits) {
        // Create a rich text representation of the permit
        const textRepresentation = `Permit Description: ${permit.permitDescription || ''}. Neighborhood: ${permit.neighborhoodCode || ''}. Parcel Number: ${permit.parcelNumber || ''}. Value: ${permit.value || 0}. Issue Date: ${permit.issueDate || ''}. Decision: ${permit.enterPermit ? 'Approved' : 'Rejected'}. Reason: ${permit.reason || ''}`;
        
        // Generate embedding for the text
        const vector = await this.generateEmbedding(textRepresentation);
        
        // Create a unique ID for the vector
        const id = `permit-${permit.id}`;
        
        // Create metadata
        const metadata: PermitMetadata = {
          permitId: permit.id,
          neighborhoodCode: permit.neighborhoodCode,
          description: permit.permitDescription,
          enterPermit: permit.enterPermit
        };
        
        // Store in Pinecone if available
        if (this.pineconeIndex) {
          try {
            await this.pineconeIndex.upsert([{
              id,
              values: vector,
              metadata
            }]);
          } catch (error) {
            console.error("Error upserting to Pinecone:", error);
          }
        }
        
        // Always store in memory as well (for backup and faster access)
        this.inMemoryVectors.set(id, {
          vector,
          metadata
        });
      }
      
      console.log(`Successfully vectorized ${permits.length} permits`);
    } catch (error) {
      console.error("Failed to vectorize permits:", error);
    }
  }
  
  /**
   * Search for similar permits by description or characteristics
   * @param query Search query text
   * @param limit Maximum number of results to return
   * @param threshold Minimum similarity score threshold (0-1)
   * @returns Array of permits with similarity scores
   */
  async searchSimilarPermits(query: string, limit = 5, threshold = 0.7): Promise<VectorSearchResult[]> {
    try {
      await validateApiKey();
      
      if (!this.openAIEmbeddings) {
        await this.initialize();
      }
      
      // Generate embedding for the query
      const queryVector = await this.generateEmbedding(query);
      
      // Initialize results array
      let searchResults: VectorSearchResult[] = [];
      
      // Try to search in Pinecone first
      if (this.pineconeIndex) {
        try {
          // Query the Pinecone index
          const queryResult = await this.pineconeIndex.query({
            vector: queryVector,
            topK: limit,
            includeMetadata: true,
          });
          
          // Process Pinecone results
          if (queryResult.matches && queryResult.matches.length > 0) {
            const validMatches = queryResult.matches
              .filter((match: any) => match.score && match.score >= threshold);
              
            if (validMatches.length > 0) {
              // Extract permit IDs from metadata
              const permitIds: number[] = [];
              validMatches.forEach((match: any) => {
                if (match.metadata && 'permitId' in match.metadata) {
                  permitIds.push(match.metadata.permitId as number);
                }
              });
              
              // Fetch permit details for the matched IDs
              const permits: Permit[] = [];
              for (const id of permitIds) {
                const permit = await storage.getPermit(id);
                if (permit) {
                  permits.push(permit);
                }
              }
              
              // Create search results with similarity scores
              searchResults = validMatches
                .map((match: any) => {
                  if (match.metadata && 'permitId' in match.metadata) {
                    const permitId = match.metadata.permitId as number;
                    const permit = permits.find(p => p.id === permitId);
                    if (permit && match.score) {
                      return {
                        permit,
                        similarity: match.score
                      };
                    }
                  }
                  return null;
                })
                .filter((result: any): result is VectorSearchResult => result !== null);
                
              if (searchResults.length > 0) {
                return searchResults;
              }
            }
          }
        } catch (error) {
          console.error("Error searching in Pinecone:", error);
        }
      }
      
      // Fall back to in-memory search if Pinecone search fails or has no results
      if (searchResults.length === 0) {
        console.log("Falling back to in-memory vector search");
        
        // Calculate similarity scores for all vectors in memory
        const results: Array<{ id: string; score: number; metadata: PermitMetadata }> = [];
        
        // Convert Map entries to array for safer iteration
        Array.from(this.inMemoryVectors.entries()).forEach(([id, { vector, metadata }]) => {
          const similarity = this.calculateCosineSimilarity(queryVector, vector);
          
          if (similarity >= threshold) {
            results.push({
              id,
              score: similarity,
              metadata
            });
          }
        });
        
        // Sort by similarity score (descending) and take top results
        const topResults = results
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
        
        // Fetch permit details for the matched IDs
        const permits: Permit[] = [];
        for (const result of topResults) {
          const permit = await storage.getPermit(result.metadata.permitId);
          if (permit) {
            permits.push(permit);
          }
        }
        
        // Create search results with similarity scores
        searchResults = topResults
          .map(result => {
            const permit = permits.find(p => p.id === result.metadata.permitId);
            return permit ? {
              permit,
              similarity: result.score
            } : null;
          })
          .filter((result): result is VectorSearchResult => result !== null);
      }
      
      return searchResults;
    } catch (error) {
      console.error("Failed to search similar permits:", error);
      return [];
    }
  }
  
  /**
   * Search for permits in a specific neighborhood
   * @param neighborhoodCode Neighborhood code to search for
   * @param limit Maximum number of results to return
   * @returns Array of permits in the specified neighborhood
   */
  async searchByNeighborhood(neighborhoodCode: string, limit = 10): Promise<Permit[]> {
    try {
      // Try to search in Pinecone first
      if (this.pineconeIndex) {
        try {
          // Use zero vector for metadata-only search instead of random vector
          // This avoids using synthetic data while still allowing metadata-based filtering
          const zeroVector = Array(this.dimension).fill(0);
          
          const queryResult = await this.pineconeIndex.query({
            vector: zeroVector,
            topK: limit,
            includeMetadata: true,
            filter: {
              neighborhoodCode: { $eq: neighborhoodCode }
            }
          });
          
          // Process Pinecone results
          if (queryResult.matches && queryResult.matches.length > 0) {
            // Extract permit IDs from metadata
            const permitIds: number[] = [];
            queryResult.matches.forEach((match: any) => {
              if (match.metadata && 'permitId' in match.metadata) {
                permitIds.push(match.metadata.permitId as number);
              }
            });
            
            // Fetch permit details for the matched IDs
            const permits: Permit[] = [];
            for (const id of permitIds) {
              const permit = await storage.getPermit(id);
              if (permit) {
                permits.push(permit);
              }
            }
            
            return permits;
          }
        } catch (error) {
          console.error("Error searching in Pinecone by neighborhood:", error);
        }
      }
      
      // Fall back to in-memory search
      console.log("Falling back to in-memory neighborhood search");
      
      // Find permits with matching neighborhood code
      const matchingPermitIds = Array.from(this.inMemoryVectors.values())
        .filter(({ metadata }) => metadata.neighborhoodCode === neighborhoodCode)
        .map(({ metadata }) => metadata.permitId)
        .slice(0, limit);
      
      // Fetch permit details for the matched IDs
      const permits: Permit[] = [];
      for (const id of matchingPermitIds) {
        const permit = await storage.getPermit(id);
        if (permit) {
          permits.push(permit);
        }
      }
      
      return permits;
    } catch (error) {
      console.error("Failed to search by neighborhood:", error);
      return [];
    }
  }
  
  /**
   * Remove permits from the vector database
   * @param permitIds IDs of permits to remove
   */
  async removePermitVectors(permitIds: number[]): Promise<void> {
    try {
      // Convert permit IDs to vector IDs
      const ids = permitIds.map(id => `permit-${id}`);
      
      // Remove from Pinecone if available
      if (this.pineconeIndex) {
        try {
          await this.pineconeIndex.deleteMany(ids);
          console.log(`Removed ${ids.length} vectors from Pinecone`);
        } catch (error) {
          console.error("Error removing vectors from Pinecone:", error);
        }
      }
      
      // Remove from in-memory storage
      for (const id of ids) {
        this.inMemoryVectors.delete(id);
      }
      
      console.log(`Successfully removed ${permitIds.length} permit vectors`);
    } catch (error) {
      console.error("Failed to remove permit vectors:", error);
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Cosine similarity score (0-1)
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimension");
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }
  
  /**
   * Get the number of vectors stored in the database
   * @returns Count of stored vectors
   */
  async getVectorCount(): Promise<number> {
    // Try to get count from Pinecone
    if (this.pineconeIndex) {
      try {
        const stats = await this.pineconeIndex.describeStats();
        return stats.totalRecordCount || 0;
      } catch (error) {
        console.error("Error getting vector count from Pinecone:", error);
      }
    }
    
    // Fall back to in-memory count
    return this.inMemoryVectors.size;
  }
  
  /**
   * Calculate the nearest neighbors for a specific permit
   * @param permitId ID of the permit to find neighbors for
   * @param limit Maximum number of neighbors to return
   * @returns Array of similar permits with similarity scores
   */
  async findNearestNeighbors(permitId: number, limit = 5): Promise<VectorSearchResult[]> {
    try {
      const permit = await storage.getPermit(permitId);
      
      if (!permit) {
        throw new Error("Permit not found");
      }
      
      // Create a rich text representation of the permit
      const textRepresentation = `Permit Description: ${permit.permitDescription}. Neighborhood: ${permit.neighborhoodCode}. Parcel Number: ${permit.parcelNumber}. Value: ${permit.value}. Issue Date: ${permit.issueDate}. Decision: ${permit.enterPermit ? 'Approved' : 'Rejected'}. Reason: ${permit.reason}`;
      
      // Search for similar permits using the permit's text representation
      return this.searchSimilarPermits(textRepresentation, limit);
    } catch (error) {
      console.error("Failed to find nearest neighbors:", error);
      return [];
    }
  }
}

export const vectorDatabaseService = new VectorDatabaseService();