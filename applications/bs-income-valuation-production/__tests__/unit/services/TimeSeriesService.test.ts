import { TimeSeriesService, ForecastResult } from '../../../client/src/services/TimeSeriesService';
import { Income } from '../../../shared/schema';

// Mock the BaseService post method
jest.mock('../../../client/src/services/BaseService', () => ({
  BaseService: {
    post: jest.fn().mockImplementation(async (endpoint, data, errorMessage) => {
      // Return appropriate mock responses based on the endpoint
      if (endpoint === '/api/timeseries/forecast') {
        return {
          values: [10500, 11000, 11500, 12000, 12500, 13000],
          dates: [
            new Date().toISOString(),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString()
          ],
          lowerBound: [9500, 10000, 10500, 11000, 11500, 12000],
          upperBound: [11500, 12000, 12500, 13000, 13500, 14000],
          method: 'arima',
          confidenceLevel: 0.95
        };
      } else if (endpoint === '/api/timeseries/seasonality') {
        return {
          hasSeasonal: true,
          seasonalPeriod: 12,
          seasonalStrength: 0.65,
          pValue: 0.01
        };
      } else if (endpoint === '/api/timeseries/decompose') {
        const mockSeries = Array(data.data.length).fill(0);
        return {
          trend: mockSeries.map((_, i) => 10000 + i * 100),
          seasonal: mockSeries.map((_, i) => Math.sin(i / 6 * Math.PI) * 1000),
          residual: mockSeries.map(() => (Math.random() - 0.5) * 200),
          dates: data.data.map(d => d.date)
        };
      } else if (endpoint === '/api/timeseries/trend') {
        return {
          direction: 'up',
          strength: 0.8,
          changePct: 0.15
        };
      } else if (endpoint === '/api/timeseries/description') {
        return {
          description: 'A detailed forecast description showing an upward trend with 95% confidence intervals.'
        };
      }
      
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    })
  }
}));

// Test data helper function to create income time series
function createTestIncomeTimeSeries(
  baseAmount: number, 
  months: number, 
  trend: 'up' | 'down' | 'flat' | 'seasonal' = 'up',
  noiseLevel: number = 0.05
): Income[] {
  const now = new Date();
  const result: Income[] = [];
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - (months - i - 1));
    
    let trendFactor = 1;
    switch(trend) {
      case 'up':
        trendFactor = 1 + (i * 0.02); // 2% increase per month
        break;
      case 'down':
        trendFactor = 1 - (i * 0.01); // 1% decrease per month
        break;
      case 'flat':
        trendFactor = 1;
        break;
      case 'seasonal':
        // Add seasonal pattern (higher in summer, lower in winter)
        const monthIndex = date.getMonth();
        trendFactor = 1 + Math.sin((monthIndex / 12) * Math.PI * 2) * 0.2;
        break;
    }
    
    // Add some random noise to make it realistic
    const noise = 1 + (Math.random() * 2 - 1) * noiseLevel;
    const amount = baseAmount * trendFactor * noise;
    
    result.push({
      id: i,
      userId: 1,
      source: 'rental',
      frequency: 'monthly',
      amount: String(Math.round(amount)),
      date: date,
      description: `Test income for month ${i+1}`,
      createdAt: date
    });
  }
  
  return result;
}

describe('TimeSeriesService', () => {
  describe('forecast', () => {
    it('should forecast future values based on past trends', async () => {
      // Arrange
      const incomeData = createTestIncomeTimeSeries(10000, 24, 'up');
      const trainingData = incomeData.slice(0, 18);
      const testingData = incomeData.slice(18);
      
      // Act
      const forecast = await TimeSeriesService.forecast(trainingData, 6);
      
      // Assert
      expect(forecast.values.length).toBe(6);
      
      // Test that forecast values are within 15% of "actual" values
      forecast.values.forEach((value /* , index */) => {
        const actual = parseFloat(testingData[index].amount);
        const predicted = value;
        const percentError = Math.abs((predicted - actual) / actual);
        expect(percentError).toBeLessThan(0.15);
      });
    });
    
    it('should provide confidence intervals for forecasts', async () => {
      // Arrange
      const incomeData = createTestIncomeTimeSeries(10000, 24, 'up');
      
      // Act
      const forecast = await TimeSeriesService.forecast(incomeData, 6);
      
      // Assert
      expect(forecast.upperBound).toBeDefined();
      expect(forecast.lowerBound).toBeDefined();
      expect(forecast.upperBound.length).toBe(6);
      expect(forecast.lowerBound.length).toBe(6);
      
      // Upper bound should be greater than value, lower bound should be less
      forecast.values.forEach((value /* , index */) => {
        expect(forecast.upperBound[index]).toBeGreaterThan(value);
        expect(forecast.lowerBound[index]).toBeLessThan(value);
      });
    });
    
    it('should handle sparse time series data', async () => {
      // Arrange
      const incomeData = createTestIncomeTimeSeries(10000, 12, 'up');
      // Remove some data points to create gaps
      const sparseData = [
        incomeData[0],
        incomeData[1],
        incomeData[3], // Skip index 2
        incomeData[4],
        incomeData[6], // Skip index 5
        incomeData[7],
        incomeData[8],
        incomeData[10], // Skip index 9
        incomeData[11]
      ];
      
      // Act
      const forecast = await TimeSeriesService.forecast(sparseData, 3);
      
      // Assert
      expect(forecast.values.length).toBe(3);
      // Just checking that it produces values without error for sparse data
    });
  });
  
  describe('detectSeasonality', () => {
    it('should detect seasonal patterns in data', async () => {
      // Arrange
      const seasonalData = createTestIncomeTimeSeries(10000, 24, 'seasonal');
      
      // Act
      const result = await TimeSeriesService.detectSeasonality(seasonalData);
      
      // Assert
      expect(result.hasSeasonal).toBe(true);
      expect(result.seasonalPeriod).toBeGreaterThan(0);
    });
    
    it('should return no seasonality for flat/trending data', async () => {
      // Arrange
      const flatData = createTestIncomeTimeSeries(10000, 24, 'flat');
      
      // Act
      const result = await TimeSeriesService.detectSeasonality(flatData);
      
      // Assert
      expect(result.hasSeasonal).toBe(false);
    });
  });
  
  describe('decompose', () => {
    it('should decompose a time series into trend, seasonal, and residual components', async () => {
      // Arrange
      const incomeData = createTestIncomeTimeSeries(10000, 24, 'seasonal');
      
      // Act
      const decomposition = await TimeSeriesService.decompose(incomeData);
      
      // Assert
      expect(decomposition.trend.length).toBe(incomeData.length);
      expect(decomposition.seasonal.length).toBe(incomeData.length);
      expect(decomposition.residual.length).toBe(incomeData.length);
      
      // Sum of components should approximately equal original
      decomposition.trend.forEach((value /* , index */) => {
        const sum = value + decomposition.seasonal[index] + decomposition.residual[index];
        const actual = parseFloat(incomeData[index].amount);
        const percentDifference = Math.abs((sum - actual) / actual);
        expect(percentDifference).toBeLessThan(0.01); // Within 1%
      });
    });
  });
  
  describe('getTrendDirection', () => {
    it('should identify upward trends', async () => {
      // Arrange
      const upTrendData = createTestIncomeTimeSeries(10000, 12, 'up');
      
      // Act
      const result = await TimeSeriesService.getTrendDirection(upTrendData);
      
      // Assert
      expect(result.direction).toBe('up');
      expect(result.strength).toBeGreaterThan(0);
    });
    
    it('should identify downward trends', async () => {
      // Arrange
      const downTrendData = createTestIncomeTimeSeries(10000, 12, 'down');
      
      // Act
      const result = await TimeSeriesService.getTrendDirection(downTrendData);
      
      // Assert
      expect(result.direction).toBe('down');
      expect(result.strength).toBeGreaterThan(0);
    });
    
    it('should identify flat trends', async () => {
      // Arrange
      const flatData = createTestIncomeTimeSeries(10000, 12, 'flat', 0.02);
      
      // Act
      const result = await TimeSeriesService.getTrendDirection(flatData);
      
      // Assert
      expect(result.direction).toBe('flat');
      expect(result.strength).toBeCloseTo(0, 1);
    });
  });
  
  describe('generateForecastDescription', () => {
    it('should generate natural language description of forecast results', async () => {
      // Arrange
      const incomeData = createTestIncomeTimeSeries(10000, 24, 'up');
      const forecast = await TimeSeriesService.forecast(incomeData, 6);
      
      // Act
      const description = await TimeSeriesService.generateForecastDescription(incomeData, forecast);
      
      // Assert
      expect(description).toContain('trend');
      expect(description.length).toBeGreaterThan(50); // Should provide meaningful description
    });
    
    it('should mention confidence levels in the description', async () => {
      // Arrange
      const incomeData = createTestIncomeTimeSeries(10000, 24, 'up');
      const forecast = await TimeSeriesService.forecast(incomeData, 6);
      
      // Act
      const description = await TimeSeriesService.generateForecastDescription(incomeData, forecast);
      
      // Assert
      expect(description).toContain('confidence');
    });
  });
});