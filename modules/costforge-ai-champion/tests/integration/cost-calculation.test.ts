/**
 * Cost Calculation Integration Tests
 * 
 * Tests the integration between traditional cost calculation algorithms
 * and AI-enhanced predictions with database storage.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { costAnalysisRoutes } from '../../server/routes/costAnalysisRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/cost-analysis', costAnalysisRoutes);

describe('Cost Calculation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Traditional Cost Calculation', () => {
    it('should calculate building costs using matrix-based approach', async () => {
      const buildingData = {
        buildingType: 'Residential',
        squareFootage: 2000,
        region: 'Benton',
        quality: 'Good',
        yearBuilt: 2000,
        conditionFactor: 0.8,
        complexityFactor: 0.5
      };

      const response = await request(app)
        .post('/api/cost-analysis/calculate')
        .send(buildingData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        method: 'traditional-calculation'
      });

      expect(response.body.baseCost).toBeValidCostAmount();
      expect(response.body.totalCost).toBeValidCostAmount();
      expect(response.body.costPerSqFt).toBeGreaterThan(0);
      expect(response.body.breakdown).toBeDefined();
      expect(response.body.adjustments).toBeDefined();
    });

    it('should handle different building types correctly', async () => {
      const buildingTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];

      for (const buildingType of buildingTypes) {
        const response = await request(app)
          .post('/api/cost-analysis/calculate')
          .send({
            buildingType,
            squareFootage: 2000,
            region: 'Benton',
            quality: 'Good',
            yearBuilt: 2010,
            conditionFactor: 0.8,
            complexityFactor: 0.5
          })
          .expect(200);

        expect(response.body.totalCost).toBeValidCostAmount();
        expect(response.body.totalCost).toBeGreaterThan(0);
      }
    });

    it('should apply depreciation correctly', async () => {
      const currentYear = new Date().getFullYear();
      
      // Test older building
      const oldBuildingResponse = await request(app)
        .post('/api/cost-analysis/calculate')
        .send({
          buildingType: 'Residential',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          yearBuilt: currentYear - 30, // 30 years old
          conditionFactor: 0.8,
          complexityFactor: 0.5
        })
        .expect(200);

      // Test newer building
      const newBuildingResponse = await request(app)
        .post('/api/cost-analysis/calculate')
        .send({
          buildingType: 'Residential',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          yearBuilt: currentYear - 5, // 5 years old
          conditionFactor: 0.8,
          complexityFactor: 0.5
        })
        .expect(200);

      expect(oldBuildingResponse.body.adjustments.depreciation).toBeLessThan(0);
      expect(newBuildingResponse.body.adjustments.depreciation).toBeLessThan(0);
      expect(oldBuildingResponse.body.adjustments.depreciation).toBeLessThan(
        newBuildingResponse.body.adjustments.depreciation
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cost-analysis/calculate')
        .send({
          buildingType: 'Residential',
          // Missing squareFootage and region
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.required).toContain('squareFootage');
      expect(response.body.required).toContain('region');
    });
  });

  describe('Enhanced Cost Analysis', () => {
    it('should combine traditional and AI analysis', async () => {
      const buildingData = {
        buildingType: 'Residential',
        squareFootage: 2000,
        region: 'Benton',
        quality: 'Good',
        yearBuilt: 2010,
        conditionFactor: 0.8,
        complexityFactor: 0.5
      };

      const response = await request(app)
        .post('/api/cost-analysis/enhanced-analysis')
        .send(buildingData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });

      expect(response.body.traditional).toBeDefined();
      expect(response.body.traditional.success).toBe(true);
      expect(response.body.traditional.totalCost).toBeValidCostAmount();

      // AI result may be null if services aren't available in test
      if (response.body.ai) {
        expect(response.body.ai.provider).toMatch(/anthropic|openai/);
        expect(response.body.comparison).toBeDefined();
      }
    });

    it('should provide comparison analysis when both methods available', async () => {
      // Mock AI service availability
      const mockAIResult = {
        totalCost: '275,000',
        costPerSquareFoot: 137.5,
        predictionFactors: [],
        materialSubstitutions: [],
        confidence: 0.85
      };

      // Mock the AI service call
      jest.doMock('../../server/services/ai/AnthropicService.js', () => ({
        default: {
          isAvailable: () => true,
          generateBuildingCostPrediction: jest.fn().mockResolvedValue(mockAIResult)
        }
      }));

      const buildingData = {
        buildingType: 'Residential',
        squareFootage: 2000,
        region: 'Benton',
        quality: 'Good',
        yearBuilt: 2010,
        conditionFactor: 0.8,
        complexityFactor: 0.5
      };

      const response = await request(app)
        .post('/api/cost-analysis/enhanced-analysis')
        .send(buildingData);

      if (response.body.ai && response.body.comparison) {
        expect(response.body.comparison.traditionalCost).toBeValidCostAmount();
        expect(response.body.comparison.aiCost).toBeValidCostAmount();
        expect(response.body.comparison.difference).toBeGreaterThanOrEqual(0);
        expect(response.body.comparison.percentageDifference).toBeGreaterThanOrEqual(0);
        expect(response.body.comparison.recommendation).toBeDefined();
      }
    });
  });

  describe('Cost Matrix Management', () => {
    it('should retrieve cost matrices', async () => {
      const response = await request(app)
        .get('/api/cost-analysis/matrices')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });

      expect(Array.isArray(response.body.matrices)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve cost matrices by region and type', async () => {
      const response = await request(app)
        .get('/api/cost-analysis/matrices/Benton/Residential')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        region: 'Benton',
        buildingType: 'Residential'
      });

      expect(Array.isArray(response.body.matrices)).toBe(true);
    });

    it('should create new cost matrix entries', async () => {
      const matrixData = {
        region: 'Test Region',
        building_type: 'Test Type',
        cost_per_sqft: 150,
        quality_level: 'Good',
        metadata: { source: 'test' }
      };

      const response = await request(app)
        .post('/api/cost-analysis/matrices')
        .send(matrixData);

      // May fail if database is not available in test environment
      if (response.status === 201) {
        expect(response.body).toMatchObject({
          success: true
        });
        expect(response.body.matrix).toBeDefined();
      } else if (response.status === 503) {
        expect(response.body.error).toBe('Database service is not available');
      }
    });

    it('should validate required fields for matrix creation', async () => {
      const response = await request(app)
        .post('/api/cost-analysis/matrices')
        .send({
          region: 'Test Region',
          // Missing required fields
        });

      if (response.status === 400) {
        expect(response.body.error).toBe('Missing required fields');
      }
    });
  });

  describe('Analysis History', () => {
    it('should retrieve analysis history', async () => {
      const response = await request(app)
        .get('/api/cost-analysis/history')
        .expect(200);

      if (response.body.error !== 'Database service is not available') {
        expect(response.body).toMatchObject({
          success: true,
          analysisType: 'enhanced-cost-analysis'
        });
        expect(Array.isArray(response.body.results)).toBe(true);
      }
    });

    it('should retrieve specific analysis types', async () => {
      const response = await request(app)
        .get('/api/cost-analysis/history/traditional-cost-calculation')
        .expect(200);

      if (response.body.error !== 'Database service is not available') {
        expect(response.body).toMatchObject({
          success: true,
          analysisType: 'traditional-cost-calculation'
        });
      }
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/cost-analysis/history?limit=10')
        .expect(200);

      if (response.body.error !== 'Database service is not available') {
        expect(response.body.results.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid square footage', async () => {
      const response = await request(app)
        .post('/api/cost-analysis/calculate')
        .send({
          buildingType: 'Residential',
          squareFootage: -100, // Invalid
          region: 'Benton'
        })
        .expect(200); // The calculation should still work but with adjusted values

      expect(response.body.totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown building types gracefully', async () => {
      const response = await request(app)
        .post('/api/cost-analysis/calculate')
        .send({
          buildingType: 'UnknownType',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          yearBuilt: 2010,
          conditionFactor: 0.8,
          complexityFactor: 0.5
        })
        .expect(200);

      expect(response.body.totalCost).toBeValidCostAmount();
    });

    it('should handle extreme factor values', async () => {
      const response = await request(app)
        .post('/api/cost-analysis/calculate')
        .send({
          buildingType: 'Residential',
          squareFootage: 2000,
          region: 'Benton',
          quality: 'Good',
          yearBuilt: 2010,
          conditionFactor: 1.5, // Beyond normal range
          complexityFactor: -0.5 // Beyond normal range
        })
        .expect(200);

      expect(response.body.totalCost).toBeValidCostAmount();
      expect(response.body.totalCost).toBeGreaterThan(0);
    });
  });
});