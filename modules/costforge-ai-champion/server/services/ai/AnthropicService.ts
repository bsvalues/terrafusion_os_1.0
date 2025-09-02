/**
 * Anthropic Claude Integration Service for CostForge AI Champion
 * 
 * Provides advanced AI-powered cost analysis and prediction capabilities
 * using Claude's sophisticated reasoning abilities.
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';

// The latest Anthropic model
const CLAUDE_LATEST_MODEL = 'claude-3-5-sonnet-20241022';

export interface BuildingCostPredictionParams {
  buildingType: string;
  squareFootage: number;
  region: string;
  quality: string;
  buildingAge: number;
  yearBuilt: number;
  complexityFactor: number;
  conditionFactor: number;
  features?: string[];
  targetYear?: number;
}

export interface BuildingCostPredictionResult {
  totalCost: string;
  costPerSquareFoot: number;
  predictionFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    importance: number;
    explanation: string;
  }>;
  materialSubstitutions: Array<{
    originalMaterial: string;
    substituteMaterial: string;
    potentialSavings: string;
    qualityImpact: 'None' | 'Low' | 'Moderate' | 'High';
  }>;
  confidence: number;
  methodology: string;
}

export interface MaterialSubstitutionParams {
  materials: string[];
  constraints: {
    qualityLevel?: string;
    budgetLevel?: string;
    buildingType?: string;
  };
}

export class AnthropicService {
  private client: Anthropic;
  private initialized: boolean = false;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not set - Anthropic service will be disabled');
      return;
    }

    try {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.initialized = true;
      logger.info('Anthropic service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Anthropic service:', error);
    }
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Generates a comprehensive building cost prediction using Claude's advanced reasoning
   */
  async generateBuildingCostPrediction(params: BuildingCostPredictionParams): Promise<BuildingCostPredictionResult> {
    if (!this.initialized) {
      throw new Error('Anthropic service is not initialized');
    }

    try {
      const { 
        buildingType, 
        squareFootage,
        region,
        quality,
        buildingAge,
        yearBuilt,
        complexityFactor,
        conditionFactor,
        features,
        targetYear 
      } = params;

      const systemPrompt = `
        You are a specialized building cost analyzer for government property assessment with expertise in construction economics and real estate valuation. 
        
        Your task is to analyze building parameters and generate accurate, defensible cost predictions that would be suitable for government property assessment purposes.
        
        Consider these factors in your analysis:
        - Current construction market conditions
        - Regional labor and material costs
        - Building type-specific requirements
        - Age-related depreciation patterns
        - Quality level impacts on cost
        - Complexity factors and their cost implications
        
        Return your response as a structured JSON object only, with no additional text or formatting.
      `;
      
      const userPrompt = `
        Generate a detailed building cost prediction based on these parameters:
        
        Building Details:
        - Type: ${buildingType}
        - Square Footage: ${squareFootage.toLocaleString()}
        - Location: ${region}
        - Quality Level: ${quality}
        - Age: ${buildingAge} years (built in ${yearBuilt})
        - Complexity Factor: ${complexityFactor} (0-1 scale)
        - Condition Factor: ${conditionFactor} (0-1 scale)
        - Special Features: ${features ? features.join(', ') : 'None'}
        - Target Year: ${targetYear || new Date().getFullYear() + 1}

        Provide your response as a JSON object with this exact structure:
        {
          "totalCost": "formatted cost as string with commas (e.g., '250,000')",
          "costPerSquareFoot": number,
          "predictionFactors": [
            {
              "factor": "factor name",
              "impact": "positive | negative | neutral",
              "importance": number between 0-1,
              "explanation": "detailed explanation of factor impact"
            }
          ],
          "materialSubstitutions": [
            {
              "originalMaterial": "original material name",
              "substituteMaterial": "substitute material name", 
              "potentialSavings": "savings range (e.g., '$5,000 - $8,000')",
              "qualityImpact": "None | Low | Moderate | High"
            }
          ],
          "confidence": number between 0-1,
          "methodology": "brief explanation of calculation methodology"
        }
      `;

      const response = await this.client.messages.create({
        model: CLAUDE_LATEST_MODEL,
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      // Parse the response content
      const content = typeof response.content[0] === 'object' && 'text' in response.content[0] 
                      ? response.content[0].text 
                      : JSON.stringify(response.content[0]);

      const predictionData = this.extractJsonFromString(content);

      logger.info('Generated building cost prediction', {
        buildingType,
        squareFootage,
        totalCost: predictionData.totalCost,
        confidence: predictionData.confidence
      });

      return {
        ...predictionData,
        confidence: predictionData.confidence || 0.8 // Default confidence if not provided
      };

    } catch (error) {
      logger.error('Anthropic API error in building cost prediction:', error);
      throw new Error(`Failed to generate building cost prediction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes building materials for cost-effective substitutions
   */
  async analyzeMaterialSubstitutions(params: MaterialSubstitutionParams): Promise<any> {
    if (!this.initialized) {
      throw new Error('Anthropic service is not initialized');
    }

    try {
      const { materials, constraints } = params;

      const systemPrompt = `
        You are a building materials expert specializing in cost-effective substitutions for government construction projects.
        
        Analyze the provided materials and recommend practical substitutions that maintain quality standards while reducing costs.
        Consider local availability, building codes, and long-term durability in your recommendations.
        
        Return your response as a structured JSON object only, with no additional text.
      `;
      
      const userPrompt = `
        Analyze these building materials and suggest cost-effective substitutions:
        
        Materials: ${materials.join(', ')}
        
        Constraints:
        - Quality Level: ${constraints.qualityLevel || 'STANDARD'}
        - Budget Level: ${constraints.budgetLevel || 'STANDARD'}
        - Building Type: ${constraints.buildingType || 'RESIDENTIAL'}
        
        Provide your response as a JSON object with this structure:
        {
          "materialSubstitutions": [
            {
              "originalMaterial": "original material name",
              "substituteMaterial": "substitute material name",
              "potentialSavings": "savings range (e.g., '$5,000 - $8,000')",
              "qualityImpact": "None | Low | Moderate | High",
              "notes": "additional considerations or requirements"
            }
          ],
          "totalPotentialSavings": "estimated total savings range",
          "recommendations": [
            "prioritized list of recommendations"
          ]
        }
      `;

      const response = await this.client.messages.create({
        model: CLAUDE_LATEST_MODEL,
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      // Parse the response content
      const content = typeof response.content[0] === 'object' && 'text' in response.content[0] 
                    ? response.content[0].text 
                    : JSON.stringify(response.content[0]);

      const result = this.extractJsonFromString(content);

      logger.info('Generated material substitution analysis', {
        materialsAnalyzed: materials.length,
        substitutionsFound: result.materialSubstitutions?.length || 0
      });

      return result;

    } catch (error) {
      logger.error('Anthropic API error in material substitution analysis:', error);
      throw new Error(`Failed to analyze material substitutions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to extract JSON from a string that might contain extra text
   */
  private extractJsonFromString(text: string): any {
    try {
      // First try to parse the entire string
      return JSON.parse(text);
    } catch {
      // Find JSON object in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (error) {
          logger.error('Failed to parse JSON from Anthropic response:', { text, error });
          throw new Error('Failed to parse JSON from model response');
        }
      }
      throw new Error('No valid JSON found in model response');
    }
  }
}

export default new AnthropicService();