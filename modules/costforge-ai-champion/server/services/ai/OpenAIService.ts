/**
 * OpenAI Integration Service for CostForge AI Champion
 * 
 * Provides AI-powered analysis, embeddings, and natural language processing
 * for cost estimation and property analysis.
 */

import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export interface CostAnalysisParams {
  buildingType: string;
  squareFootage: number;
  region: string;
  features: string[];
  constraints?: any;
}

export interface NaturalLanguageQueryParams {
  query: string;
  context?: any;
}

export class OpenAIService {
  private client: OpenAI;
  private initialized: boolean = false;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not set - OpenAI service will be disabled');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.initialized = true;
      logger.info('OpenAI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI service:', error);
    }
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Performs natural language cost analysis using GPT-4
   */
  async analyzeCostWithNLP(params: CostAnalysisParams): Promise<any> {
    if (!this.initialized) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const { buildingType, squareFootage, region, features, constraints } = params;

      const systemPrompt = `
        You are an expert construction cost analyst with deep knowledge of building economics, 
        regional cost variations, and construction methods. Your responses should be precise, 
        professional, and suitable for government property assessment purposes.
      `;

      const userPrompt = `
        Analyze the construction costs for this building:
        
        Building Type: ${buildingType}
        Square Footage: ${squareFootage.toLocaleString()}
        Region: ${region}
        Features: ${features.join(', ')}
        Additional Constraints: ${JSON.stringify(constraints || {})}
        
        Please provide:
        1. Cost per square foot estimate
        2. Total estimated cost
        3. Key cost drivers
        4. Regional adjustments
        5. Risk factors
        6. Confidence level of the estimate
        
        Format your response as a structured analysis suitable for professional use.
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content;

      logger.info('Generated NLP cost analysis', {
        buildingType,
        squareFootage,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        analysis,
        metadata: {
          model: 'gpt-4',
          tokensUsed: response.usage?.total_tokens,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('OpenAI API error in cost analysis:', error);
      throw new Error(`Failed to perform NLP cost analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Processes natural language queries about cost data
   */
  async processNaturalLanguageQuery(params: NaturalLanguageQueryParams): Promise<any> {
    if (!this.initialized) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const { query, context } = params;

      const systemPrompt = `
        You are a helpful assistant specialized in construction cost analysis and property assessment.
        You can answer questions about building costs, materials, construction methods, and market trends.
        
        If provided with context data, use it to inform your responses. Always be factual and professional.
      `;

      const userPrompt = context 
        ? `Context: ${JSON.stringify(context)}\n\nUser Question: ${query}`
        : query;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 1000
      });

      const answer = response.choices[0]?.message?.content;

      logger.info('Processed natural language query', {
        queryLength: query.length,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        query,
        answer,
        metadata: {
          model: 'gpt-3.5-turbo',
          tokensUsed: response.usage?.total_tokens,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('OpenAI API error in natural language query:', error);
      throw new Error(`Failed to process natural language query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates embeddings for cost data to enable semantic search
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.initialized) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      });

      const embeddings = response.data.map(item => item.embedding);

      logger.info('Generated embeddings', {
        textCount: texts.length,
        embeddingDimension: embeddings[0]?.length,
        tokensUsed: response.usage?.total_tokens
      });

      return embeddings;

    } catch (error) {
      logger.error('OpenAI API error in embedding generation:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Classifies cost data into categories using GPT
   */
  async classifyCostData(costData: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const systemPrompt = `
        You are a data classification expert for construction cost analysis.
        Classify the provided cost data into appropriate categories and identify patterns.
        
        Return your response as structured JSON.
      `;

      const userPrompt = `
        Classify this cost data:
        ${JSON.stringify(costData)}
        
        Provide classification in this format:
        {
          "primaryCategory": "category name",
          "subcategories": ["subcategory1", "subcategory2"],
          "costRange": "low/medium/high",
          "complexity": "simple/moderate/complex",
          "tags": ["tag1", "tag2", "tag3"]
        }
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      let classification;

      try {
        classification = JSON.parse(content || '{}');
      } catch {
        // If JSON parsing fails, return a basic classification
        classification = {
          primaryCategory: 'General',
          subcategories: ['Unclassified'],
          costRange: 'unknown',
          complexity: 'moderate',
          tags: ['unclassified']
        };
      }

      logger.info('Classified cost data', {
        primaryCategory: classification.primaryCategory,
        tokensUsed: response.usage?.total_tokens
      });

      return classification;

    } catch (error) {
      logger.error('OpenAI API error in cost data classification:', error);
      throw new Error(`Failed to classify cost data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default new OpenAIService();