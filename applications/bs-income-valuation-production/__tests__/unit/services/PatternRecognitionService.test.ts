import { PatternRecognitionService } from '../../../client/src/services/PatternRecognitionService';
import { Income, Valuation } from '../../../shared/schema';

// Mock the BaseService
jest.mock('../../../client/src/services/BaseService', () => ({
  BaseService: {
    post: jest.fn().mockImplementation(async (endpoint, data, errorMessage) => {
      if (endpoint === '/api/patterns/correlation') {
        return {
          correlations: [
            { sourceA: 'rental', sourceB: 'business', coefficient: 0.78, significance: 'high' },
            { sourceA: 'rental', sourceB: 'investment', coefficient: 0.45, significance: 'medium' },
          ],
          sampleSize: data.incomes.length,
          timePeriod: '12 months'
        };
      } else if (endpoint === '/api/patterns/outliers') {
        return {
          outliers: [
            { id: 3, reason: 'Statistical deviation', confidenceScore: 0.92, suggestedAction: 'Review' },
            { id: 7, reason: 'Inconsistent with historical pattern', confidenceScore: 0.85, suggestedAction: 'Verify' }
          ],
          thresholdUsed: data.threshold || 2.5,
          methodology: 'Z-score analysis'
        };
      } else if (endpoint === '/api/patterns/seasonality') {
        return {
          seasonalPatterns: [
            { source: 'rental', periodicity: 12, strength: 0.8, phase: 'Winter peak' },
            { source: 'business', periodicity: 4, strength: 0.6, phase: 'Quarterly cycle' }
          ],
          confidenceLevel: 0.95,
          dataPointsAnalyzed: data.incomes.length
        };
      }
      
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    })
  }
}));

// Test data generators
function createTestIncomes(count: number = 20, withSeasonality: boolean = false): Income[] {
  const result: Income[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - (count - i - 1));
    
    // Base amount varies by source
    let baseAmount = 0;
    let source: string;
    
    switch (i % 3) {
      case 0:
        source = 'rental';
        baseAmount = 2000;
        break;
      case 1:
        source = 'business';
        baseAmount = 5000;
        break;
      default:
        source = 'investment';
        baseAmount = 1000;
        break;
    }
    
    // Add seasonality if requested
    if (withSeasonality && source === 'rental') {
      // Higher in summer (months 5-8), lower in winter
      const month = date.getMonth();
      if (month >= 5 && month <= 8) {
        baseAmount *= 1.2;
      } else if (month >= 11 || month <= 2) {
        baseAmount *= 0.8;
      }
    }
    
    // Add some noise
    const noise = 0.9 + Math.random() * 0.2;
    const amount = Math.round(baseAmount * noise);
    
    result.push({
      id: i,
      userId: 1,
      source,
      frequency: 'monthly',
      amount: String(amount),
      date,
      description: `Test income ${i+1}`,
      createdAt: date
    });
  }
  
  return result;
}

function createTestValuations(count: number = 10): Valuation[] {
  const result: Valuation[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - (count - i - 1));
    
    // Different property types have different base valuations
    const propertyTypes = ['residential', 'commercial', 'industrial', 'mixed-use'];
    const propertyType = propertyTypes[i % propertyTypes.length];
    
    // Base valuation depends on property type
    let baseValue = 0;
    switch (propertyType) {
      case 'residential':
        baseValue = 250000;
        break;
      case 'commercial':
        baseValue = 750000;
        break;
      case 'industrial':
        baseValue = 1200000;
        break;
      case 'mixed-use':
        baseValue = 500000;
        break;
    }
    
    // Add growth trend
    const growthFactor = 1 + (i * 0.02);
    
    // Add some noise
    const noise = 0.95 + Math.random() * 0.1;
    const amount = Math.round(baseValue * growthFactor * noise);
    
    result.push({
      id: i,
      userId: 1,
      amount: String(amount),
      date,
      method: 'income',
      notes: `Valuation ${i+1} for ${propertyType} property`,
      createdAt: date
    });
  }
  
  return result;
}

describe('PatternRecognitionService', () => {
  describe('findIncomeCorrelations', () => {
    it('should identify correlations between different income sources', async () => {
      // Arrange
      const incomes = createTestIncomes(24);
      
      // Act
      const result = await PatternRecognitionService.findIncomeCorrelations(incomes);
      
      // Assert
      expect(result.correlations).toBeDefined();
      expect(result.correlations.length).toBeGreaterThan(0);
      
      // Should find correlation between rental and business incomes
      const rentalBusinessCorrelation = result.correlations.find(
        c => (c.sourceA === 'rental' && c.sourceB === 'business') || 
             (c.sourceA === 'business' && c.sourceB === 'rental')
      );
      expect(rentalBusinessCorrelation).toBeDefined();
      expect(rentalBusinessCorrelation?.coefficient).toBeGreaterThan(0.6);
    });
    
    it('should return empty correlations when insufficient data is provided', async () => {
      // Arrange - only 3 income entries is insufficient
      const incomes = createTestIncomes(3);
      
      // Act
      const result = await PatternRecognitionService.findIncomeCorrelations(incomes);
      
      // Assert
      expect(result.correlations).toHaveLength(0);
      expect(result.sampleSize).toBe(3);
    });
  });
  
  describe('detectOutliers', () => {
    it('should identify statistical outliers in income data', async () => {
      // Arrange
      const incomes = createTestIncomes(30);
      
      // Manually inject outliers
      const outlierIndex1 = 3;
      const outlierIndex2 = 7;
      
      incomes[outlierIndex1] = {
        ...incomes[outlierIndex1],
        amount: String(Number(incomes[outlierIndex1].amount) * 3) // 3x the normal amount
      };
      
      incomes[outlierIndex2] = {
        ...incomes[outlierIndex2],
        amount: String(Number(incomes[outlierIndex2].amount) * 0.2) // only 20% of the normal amount
      };
      
      // Act
      const result = await PatternRecognitionService.detectOutliers(incomes);
      
      // Assert
      expect(result.outliers).toBeDefined();
      expect(result.outliers.length).toBeGreaterThan(0);
      
      // Should find the injected outliers
      const outlierIds = result.outliers.map(o => o.id);
      expect(outlierIds).toContain(outlierIndex1);
      expect(outlierIds).toContain(outlierIndex2);
    });
    
    it('should allow customization of outlier detection threshold', async () => {
      // Arrange
      const incomes = createTestIncomes(30);
      
      // Inject a mild outlier
      incomes[5] = {
        ...incomes[5],
        amount: String(Number(incomes[5].amount) * 1.5) // 1.5x normal amount (mild outlier)
      };
      
      // Act - with strict threshold
      const strictResult = await PatternRecognitionService.detectOutliers(incomes, {
        threshold: 1.5  // More sensitive - should detect mild outliers
      });
      
      // Act - with lenient threshold
      const lenientResult = await PatternRecognitionService.detectOutliers(incomes, {
        threshold: 3.0  // Less sensitive - should ignore mild outliers
      });
      
      // Assert
      expect(strictResult.outliers.length).toBeGreaterThan(lenientResult.outliers.length);
      expect(strictResult.thresholdUsed).toBe(1.5);
      expect(lenientResult.thresholdUsed).toBe(3.0);
    });
  });
  
  describe('analyzeSeasonality', () => {
    it('should detect seasonal patterns in income data', async () => {
      // Arrange
      const incomes = createTestIncomes(36, true); // 3 years of data with seasonality
      
      // Act
      const result = await PatternRecognitionService.analyzeSeasonality(incomes);
      
      // Assert
      expect(result.seasonalPatterns).toBeDefined();
      expect(result.seasonalPatterns.length).toBeGreaterThan(0);
      
      // Should identify rental seasonality
      const rentalPattern = result.seasonalPatterns.find(p => p.source === 'rental');
      expect(rentalPattern).toBeDefined();
      expect(rentalPattern?.periodicity).toBe(12); // Annual cycle
      expect(rentalPattern?.strength).toBeGreaterThan(0.5); // Medium-strong pattern
    });
    
    it('should not find seasonality in non-seasonal data', async () => {
      // Arrange
      const incomes = createTestIncomes(24, false); // No seasonality
      
      // Act
      const result = await PatternRecognitionService.analyzeSeasonality(incomes);
      
      // Assert
      // May find weak patterns by chance, but strength should be low
      const significantPatterns = result.seasonalPatterns.filter(p => p.strength > 0.6);
      expect(significantPatterns.length).toBe(0);
    });
    
    it('should require sufficient data for seasonal analysis', async () => {
      // Arrange
      const incomes = createTestIncomes(5, true); // Too little data
      
      // Act
      const result = await PatternRecognitionService.analyzeSeasonality(incomes);
      
      // Assert
      expect(result.seasonalPatterns).toHaveLength(0);
      expect(result.dataPointsAnalyzed).toBe(5);
    });
  });
  
  describe('identifyGrowthTrends', () => {
    it('should identify growth trends across different property types', async () => {
      // Arrange
      const valuations = createTestValuations(20);
      
      // Act
      const result = await PatternRecognitionService.identifyGrowthTrends(valuations);
      
      // Assert
      expect(result.trends).toBeDefined();
      expect(result.trends.length).toBeGreaterThan(0);
      
      // Should identify property type specific trends
      const propertyTypes = ['residential', 'commercial', 'industrial', 'mixed-use'];
      for (const propertyType of propertyTypes) {
        const trend = result.trends.find(t => t.category === propertyType);
        expect(trend).toBeDefined();
      }
    });
  });
});