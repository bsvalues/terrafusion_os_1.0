/**
 * AI Services Integration Tests
 * 
 * Tests the integration between Anthropic and OpenAI services
 * with proper error handling and fallback mechanisms.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AnthropicService from '../../server/services/ai/AnthropicService.js';
import OpenAIService from '../../server/services/ai/OpenAIService.js';

// Mock the actual AI service calls to avoid real API calls in tests
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('AI Services Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AnthropicService', () => {
    it('should be available when API key is set', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const service = new (AnthropicService.constructor as any)();
      expect(service.isAvailable()).toBe(true);
    });

    it('should generate building cost predictions', async () => {
      const mockPrediction = {
        totalCost: '250,000',
        costPerSquareFoot: 125,
        predictionFactors: [
          {
            factor: 'Building Age',
            impact: 'negative',
            importance: 0.3,
            explanation: 'Older building requires additional maintenance costs'
          }
        ],
        materialSubstitutions: [
          {
            originalMaterial: 'Hardwood flooring',
            substituteMaterial: 'Luxury vinyl plank',
            potentialSavings: '$5,000 - $8,000',
            qualityImpact: 'Low'
          }
        ],
        confidence: 0.8
      };

      // Mock the Anthropic client response
      const mockClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: JSON.stringify(mockPrediction) }]
          })
        }
      };

      (AnthropicService as any).client = mockClient;

      const result = await AnthropicService.generateBuildingCostPrediction({
        buildingType: 'Residential',
        squareFootage: 2000,
        region: 'Benton',
        quality: 'Good',
        buildingAge: 20,
        yearBuilt: 2000,
        complexityFactor: 0.5,
        conditionFactor: 0.8
      });

      expect(result).toMatchObject({
        totalCost: '250,000',
        costPerSquareFoot: 125,
        confidence: 0.8
      });
      expect(result.predictionFactors).toHaveLength(1);
      expect(result.materialSubstitutions).toHaveLength(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      (AnthropicService as any).client = mockClient;

      await expect(
        AnthropicService.generateBuildingCostPrediction({
          buildingType: 'Residential',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          buildingAge: 20,
          yearBuilt: 2000,
          complexityFactor: 0.5,
          conditionFactor: 0.8
        })
      ).rejects.toThrow('Failed to generate building cost prediction');
    });
  });

  describe('OpenAIService', () => {
    it('should be available when API key is set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new (OpenAIService.constructor as any)();
      expect(service.isAvailable()).toBe(true);
    });

    it('should perform natural language cost analysis', async () => {
      const mockAnalysis = 'Based on the provided parameters, the estimated cost for this residential building is approximately $250,000...';

      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: mockAnalysis
                  }
                }
              ],
              usage: {
                total_tokens: 150
              }
            })
          }
        }
      };

      (OpenAIService as any).client = mockClient;

      const result = await OpenAIService.analyzeCostWithNLP({
        buildingType: 'Residential',
        squareFootage: 2000,
        region: 'Benton',
        features: ['garage', 'deck']
      });

      expect(result.analysis).toBe(mockAnalysis);
      expect(result.metadata.tokensUsed).toBe(150);
      expect(result.metadata.model).toBe('gpt-4');
    });

    it('should generate embeddings for cost data', async () => {
      const mockEmbeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];

      const mockClient = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              { embedding: [0.1, 0.2, 0.3] },
              { embedding: [0.4, 0.5, 0.6] }
            ],
            usage: {
              total_tokens: 50
            }
          })
        }
      };

      (OpenAIService as any).client = mockClient;

      const result = await OpenAIService.generateEmbeddings([
        'Residential building cost',
        'Commercial building cost'
      ]);

      expect(result).toEqual(mockEmbeddings);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(3);
    });

    it('should process natural language queries', async () => {
      const mockResponse = 'The average cost per square foot for residential buildings in Benton County is approximately $125-150.';

      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: mockResponse
                  }
                }
              ],
              usage: {
                total_tokens: 75
              }
            })
          }
        }
      };

      (OpenAIService as any).client = mockClient;

      const result = await OpenAIService.processNaturalLanguageQuery({
        query: 'What is the average cost per square foot for residential buildings?',
        context: { region: 'Benton' }
      });

      expect(result.answer).toBe(mockResponse);
      expect(result.metadata.tokensUsed).toBe(75);
    });
  });

  describe('Service Integration', () => {
    it('should handle service availability checks', () => {
      // Test with no API keys
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const anthropicService = new (AnthropicService.constructor as any)();
      const openaiService = new (OpenAIService.constructor as any)();

      expect(anthropicService.isAvailable()).toBe(false);
      expect(openaiService.isAvailable()).toBe(false);
    });

    it('should work with partial service availability', async () => {
      // Only Anthropic available
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.OPENAI_API_KEY;

      const anthropicService = new (AnthropicService.constructor as any)();
      const openaiService = new (OpenAIService.constructor as any)();

      expect(anthropicService.isAvailable()).toBe(true);
      expect(openaiService.isAvailable()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue(new Error('Network Error'))
        }
      };

      (AnthropicService as any).client = mockClient;

      await expect(
        AnthropicService.generateBuildingCostPrediction({
          buildingType: 'Residential',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          buildingAge: 20,
          yearBuilt: 2000,
          complexityFactor: 0.5,
          conditionFactor: 0.8
        })
      ).rejects.toThrow();
    });

    it('should handle invalid JSON responses', async () => {
      const mockClient = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: 'Invalid JSON response' }]
          })
        }
      };

      (AnthropicService as any).client = mockClient;

      await expect(
        AnthropicService.generateBuildingCostPrediction({
          buildingType: 'Residential',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          buildingAge: 20,
          yearBuilt: 2000,
          complexityFactor: 0.5,
          conditionFactor: 0.8
        })
      ).rejects.toThrow('No valid JSON found in model response');
    });
  });
});