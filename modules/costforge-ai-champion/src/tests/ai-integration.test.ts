/**
 * AI Integration Tests for Terrafusion OS CostForge AI Champion
 * 
 * These tests validate the AI/MCP integration functionality including:
 * - Cost prediction accuracy and error handling
 * - Matrix analysis capabilities
 * - Calculation explanation generation
 * - Natural language query processing
 * - Government compliance validation
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { aiService } from '../services/AIService';
import { 
  CostPredictionRequest,
  MatrixAnalysisRequest,
  CalculationExplanationRequest,
  NaturalLanguageQueryRequest
} from '../services/AIService';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AI Service Integration Tests', () => {
  beforeAll(() => {
    // Configure AI service for testing
    aiService.configure({
      baseUrl: 'http://localhost:5000',
      apiKey: 'test-api-key'
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('MCP Status and Configuration', () => {
    test('should return service status', async () => {
      const status = await aiService.getStatus();
      
      expect(status).toBeDefined();
      expect(status.status).toMatch(/ready|api_key_missing|error/);
      expect(status.message).toBeDefined();
      expect(Array.isArray(status.capabilities)).toBe(true);
      expect(status.version).toBeDefined();
    });

    test('should handle service unavailability gracefully', async () => {
      // Mock fetch to simulate service failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Service unavailable'));
      
      const status = await aiService.getStatus();
      
      expect(status.status).toBe('ready');
      expect(status.message).toContain('fallback mode');
    });
  });

  describe('Cost Prediction Functionality', () => {
    const validCostRequest: CostPredictionRequest = {
      buildingType: 'commercial',
      region: 'north',
      squareFootage: 5000,
      yearBuilt: 2020,
      condition: 'good',
      complexity: 1.2
    };

    test('should predict costs for valid input', async () => {
      const result = await aiService.predictCost(validCostRequest);
      
      expect(result).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.costPerSquareFoot).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
      expect(result.explanation).toBeDefined();
      expect(typeof result.explanation).toBe('string');
    });

    test('should include enhanced AI features in prediction', async () => {
      const result = await aiService.predictCost(validCostRequest);
      
      expect(result.materialRecommendations).toBeDefined();
      expect(Array.isArray(result.materialRecommendations)).toBe(true);
      expect(result.complianceValidation).toBeDefined();
      expect(typeof result.complianceValidation?.fismaCompliant).toBe('boolean');
      expect(typeof result.complianceValidation?.accessibilityCompliant).toBe('boolean');
      expect(typeof result.complianceValidation?.energyEfficient).toBe('boolean');
    });

    test('should handle healthcare building complexity', async () => {
      const healthcareRequest: CostPredictionRequest = {
        ...validCostRequest,
        buildingType: 'healthcare'
      };
      
      const result = await aiService.predictCost(healthcareRequest);
      
      expect(result.totalCost).toBeGreaterThan(validCostRequest.squareFootage * 250); // Healthcare premium
      expect(result.materialRecommendations?.some(rec => 
        rec.material.toLowerCase().includes('antimicrobial') || 
        rec.material.toLowerCase().includes('medical')
      )).toBe(true);
    });

    test('should detect cost anomalies', async () => {
      const anomalyRequest: CostPredictionRequest = {
        ...validCostRequest,
        squareFootage: 50, // Very small building
        complexity: 2.0 // High complexity
      };
      
      const result = await aiService.predictCost(anomalyRequest);
      
      expect(result.anomalies).toBeDefined();
      expect(Array.isArray(result.anomalies)).toBe(true);
    });

    test('should validate regional cost differences', async () => {
      const pacificRequest = { ...validCostRequest, region: 'pacific' };
      const centralRequest = { ...validCostRequest, region: 'central' };
      
      const [pacificResult, centralResult] = await Promise.all([
        aiService.predictCost(pacificRequest),
        aiService.predictCost(centralRequest)
      ]);
      
      expect(pacificResult.totalCost).toBeGreaterThan(centralResult.totalCost);
      expect(pacificResult.regionFactor).toBeGreaterThan(centralResult.regionFactor || 1);
    });
  });

  describe('Matrix Analysis Capabilities', () => {
    const sampleMatrixData = {
      matrix: [
        {
          region: 'north',
          buildingType: 'commercial',
          baseCost: 185.50,
          squareFootage: 5000,
          year: 2024
        },
        {
          region: 'south',
          buildingType: 'residential',
          baseCost: 145.25,
          squareFootage: 2500,
          year: 2024
        },
        {
          region: 'pacific',
          buildingType: 'healthcare',
          baseCost: 345.75,
          squareFootage: 10000,
          year: 2024
        }
      ],
      regions: ['north', 'south', 'pacific'],
      buildingTypes: ['residential', 'commercial', 'healthcare']
    };

    const matrixRequest: MatrixAnalysisRequest = {
      matrixData: sampleMatrixData
    };

    test('should analyze cost matrix data', async () => {
      const result = await aiService.analyzeMatrix(matrixRequest);
      
      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.regionalAnalysis).toBeDefined();
      expect(result.buildingTypeAnalysis).toBeDefined();
      expect(result.trendsAndInsights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    test('should provide statistical summary', async () => {
      const result = await aiService.analyzeMatrix(matrixRequest);
      
      expect(result.statisticalSummary).toBeDefined();
      expect(result.statisticalSummary?.avgCost).toBeGreaterThan(0);
      expect(result.statisticalSummary?.medianCost).toBeGreaterThan(0);
      expect(result.statisticalSummary?.costRange).toBeDefined();
      expect(result.statisticalSummary?.regionVariance).toBeGreaterThanOrEqual(0);
    });

    test('should detect data anomalies in matrix', async () => {
      const result = await aiService.analyzeMatrix(matrixRequest);
      
      expect(result.anomalies).toBeDefined();
      expect(Array.isArray(result.anomalies)).toBe(true);
    });
  });

  describe('Calculation Explanation Generation', () => {
    const sampleCalculationData = {
      buildingType: 'commercial',
      region: 'north',
      squareFootage: 5000,
      baseCost: 150.00,
      regionFactor: 1.2,
      complexityFactor: 1.1,
      costPerSqft: 198.00,
      totalCost: 990000.00
    };

    const explanationRequest: CalculationExplanationRequest = {
      calculationData: sampleCalculationData
    };

    test('should explain calculation methodology', async () => {
      const result = await aiService.explainCalculation(explanationRequest);
      
      expect(result).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.formulaBreakdown).toBeDefined();
      expect(result.factorExplanations).toBeDefined();
      expect(result.additionalInsights).toBeDefined();
    });

    test('should include government compliance information', async () => {
      const result = await aiService.explainCalculation(explanationRequest);
      
      expect(result.governmentCompliance).toBeDefined();
      expect(Array.isArray(result.governmentCompliance?.standardsUsed)).toBe(true);
      expect(result.governmentCompliance?.complianceLevel).toBeGreaterThanOrEqual(0);
      expect(result.governmentCompliance?.complianceLevel).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.governmentCompliance?.requiredDocumentation)).toBe(true);
    });

    test('should provide detailed factor explanations', async () => {
      const result = await aiService.explainCalculation(explanationRequest);
      
      const factors = result.factorExplanations;
      expect(factors).toBeDefined();
      expect(factors['Regional Factor']).toBeDefined();
      expect(factors['Complexity Factor']).toBeDefined();
      expect(factors['Base Cost']).toBeDefined();
    });
  });

  describe('Natural Language Query Processing', () => {
    test('should process healthcare cost queries', async () => {
      const query: NaturalLanguageQueryRequest = {
        query: 'What are typical costs for healthcare facilities?'
      };
      
      const result = await aiService.processNaturalLanguageQuery(query);
      
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(Array.isArray(result.suggestedActions)).toBe(true);
      expect(Array.isArray(result.relatedQueries)).toBe(true);
    });

    test('should provide contextual suggestions', async () => {
      const query: NaturalLanguageQueryRequest = {
        query: 'How do regional factors affect costs?',
        context: {
          buildingType: 'commercial',
          region: 'pacific'
        }
      };
      
      const result = await aiService.processNaturalLanguageQuery(query);
      
      expect(result.suggestedActions.length).toBeGreaterThan(0);
      expect(result.relatedQueries.length).toBeGreaterThan(0);
    });

    test('should handle complex compliance queries', async () => {
      const query: NaturalLanguageQueryRequest = {
        query: 'What FISMA compliance requirements affect building costs?'
      };
      
      const result = await aiService.processNaturalLanguageQuery(query);
      
      expect(result.answer).toBeDefined();
      expect(result.answer.toLowerCase()).toContain('fisma');
    });
  });

  describe('Government Compliance Validation', () => {
    test('should validate basic compliance requirements', async () => {
      const complianceData = {
        buildingType: 'commercial',
        region: 'north',
        squareFootage: 10000,
        yearBuilt: 2020
      };
      
      const result = await aiService.validateCompliance(complianceData);
      
      expect(result).toBeDefined();
      expect(typeof result.fismaCompliant).toBe('boolean');
      expect(typeof result.accessibilityCompliant).toBe('boolean');
      expect(typeof result.energyEfficient).toBe('boolean');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.requiredDocuments)).toBe(true);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(1);
    });

    test('should identify pre-1990 building concerns', async () => {
      const oldBuildingData = {
        buildingType: 'commercial',
        region: 'north',
        squareFootage: 10000,
        yearBuilt: 1985
      };
      
      const result = await aiService.validateCompliance(oldBuildingData);
      
      expect(result.warnings.some(warning => 
        warning.toLowerCase().includes('asbestos') || 
        warning.toLowerCase().includes('lead')
      )).toBe(true);
    });

    test('should require enhanced documentation for public buildings', async () => {
      const healthcareData = {
        buildingType: 'healthcare',
        region: 'north',
        squareFootage: 25000
      };
      
      const result = await aiService.validateCompliance(healthcareData);
      
      expect(result.warnings.some(warning => 
        warning.toLowerCase().includes('accessibility')
      )).toBe(true);
    });

    test('should flag energy efficiency requirements for large buildings', async () => {
      const largeBuildingData = {
        buildingType: 'commercial',
        region: 'north',
        squareFootage: 75000
      };
      
      const result = await aiService.validateCompliance(largeBuildingData);
      
      expect(result.warnings.some(warning => 
        warning.toLowerCase().includes('energy')
      )).toBe(true);
    });
  });

  describe('Error Handling and Fallback Behavior', () => {
    test('should handle network errors gracefully', async () => {
      // Mock fetch to simulate network failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      const request: CostPredictionRequest = {
        buildingType: 'commercial',
        region: 'north',
        squareFootage: 5000
      };
      
      // Should not throw, should fallback to local prediction
      const result = await aiService.predictCost(request);
      expect(result).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
    });

    test('should handle invalid input parameters', async () => {
      const invalidRequest: CostPredictionRequest = {
        buildingType: 'invalid-type',
        region: 'invalid-region',
        squareFootage: -100 // Invalid square footage
      };
      
      // Should not throw, should handle gracefully
      const result = await aiService.predictCost(invalidRequest);
      expect(result).toBeDefined();
      
      // Should likely have warnings or anomalies
      if (result.anomalies) {
        expect(result.anomalies.length).toBeGreaterThan(0);
      }
    });

    test('should maintain service resilience under load', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        aiService.predictCost({
          buildingType: 'commercial',
          region: 'north',
          squareFootage: 1000 + i * 1000
        })
      );
      
      const results = await Promise.allSettled(requests);
      
      // All requests should complete (either fulfilled or rejected gracefully)
      expect(results.length).toBe(10);
      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });
  });

  describe('AI Performance and Accuracy Validation', () => {
    test('should maintain consistent cost calculations', async () => {
      const baseRequest: CostPredictionRequest = {
        buildingType: 'commercial',
        region: 'north',
        squareFootage: 5000,
        condition: 'good'
      };
      
      const results = await Promise.all([
        aiService.predictCost(baseRequest),
        aiService.predictCost(baseRequest),
        aiService.predictCost(baseRequest)
      ]);
      
      // Results should be consistent (within reasonable variance)
      const costs = results.map(r => r.totalCost);
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
      
      costs.forEach(cost => {
        expect(Math.abs(cost - avgCost) / avgCost).toBeLessThan(0.1); // Within 10% variance
      });
    });

    test('should provide reasonable confidence scores', async () => {
      const requests: CostPredictionRequest[] = [
        // High confidence: complete data
        {
          buildingType: 'commercial',
          region: 'north',
          squareFootage: 5000,
          yearBuilt: 2020,
          condition: 'good',
          complexity: 1.0
        },
        // Lower confidence: minimal data
        {
          buildingType: 'commercial',
          region: 'north',
          squareFootage: 5000
        },
        // Very low confidence: edge case
        {
          buildingType: 'commercial',
          region: 'north',
          squareFootage: 1000000 // Very large building
        }
      ];
      
      const results = await Promise.all(
        requests.map(req => aiService.predictCost(req))
      );
      
      expect(results[0].confidenceScore).toBeGreaterThan(results[1].confidenceScore);
      expect(results[1].confidenceScore).toBeGreaterThan(results[2].confidenceScore);
    });

    test('should scale appropriately with building size', async () => {
      const sizes = [1000, 5000, 25000, 100000];
      
      const results = await Promise.all(
        sizes.map(size => 
          aiService.predictCost({
            buildingType: 'commercial',
            region: 'north',
            squareFootage: size
          })
        )
      );
      
      // Total costs should increase with size
      for (let i = 1; i < results.length; i++) {
        expect(results[i].totalCost).toBeGreaterThan(results[i-1].totalCost);
      }
      
      // Cost per square foot should show some economies/diseconomies of scale
      const costPerSqFt = results.map(r => r.totalCost / sizes[results.indexOf(r)]);
      // Should not be exactly linear (some variation expected)
      const uniqueCosts = new Set(costPerSqFt.map(c => Math.round(c)));
      expect(uniqueCosts.size).toBeGreaterThan(1);
    });
  });
});

// Integration test utilities
export const testUtilities = {
  /**
   * Generate test data for cost prediction
   */
  generateTestCostRequest: (overrides: Partial<CostPredictionRequest> = {}): CostPredictionRequest => ({
    buildingType: 'commercial',
    region: 'north',
    squareFootage: 5000,
    yearBuilt: 2020,
    condition: 'good',
    complexity: 1.0,
    ...overrides
  }),

  /**
   * Generate test matrix data
   */
  generateTestMatrixData: (size: number = 10) => ({
    matrix: Array.from({ length: size }, (_, i) => ({
      region: ['north', 'south', 'east', 'west'][i % 4],
      buildingType: ['residential', 'commercial', 'industrial'][i % 3],
      baseCost: 150 + Math.random() * 100,
      squareFootage: 1000 + Math.random() * 10000,
      year: 2020 + Math.floor(Math.random() * 5)
    })),
    regions: ['north', 'south', 'east', 'west'],
    buildingTypes: ['residential', 'commercial', 'industrial']
  }),

  /**
   * Validate AI response structure
   */
  validateAIResponse: (response: any, requiredFields: string[]) => {
    requiredFields.forEach(field => {
      expect(response[field]).toBeDefined();
    });
  }
};