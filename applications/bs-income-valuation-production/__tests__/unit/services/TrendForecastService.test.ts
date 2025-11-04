import { describe, expect, it } from 'vitest';
import { TrendForecastService } from '@/services/TrendForecastService';

describe('TrendForecastService', () => {
  // Test data setup
  const historicalData = [
    { date: new Date('2023-01-01'), value: 100000 },
    { date: new Date('2023-02-01'), value: 105000 },
    { date: new Date('2023-03-01'), value: 110000 },
    { date: new Date('2023-04-01'), value: 108000 },
    { date: new Date('2023-05-01'), value: 115000 },
    { date: new Date('2023-06-01'), value: 120000 },
  ];

  const cyclicalData = [
    { date: new Date('2023-01-01'), value: 100000 },
    { date: new Date('2023-02-01'), value: 110000 },
    { date: new Date('2023-03-01'), value: 90000 },
    { date: new Date('2023-04-01'), value: 105000 },
    { date: new Date('2023-05-01'), value: 115000 },
    { date: new Date('2023-06-01'), value: 95000 },
  ];

  const stableData = [
    { date: new Date('2023-01-01'), value: 100000 },
    { date: new Date('2023-02-01'), value: 100500 },
    { date: new Date('2023-03-01'), value: 100200 },
    { date: new Date('2023-04-01'), value: 100800 },
    { date: new Date('2023-05-01'), value: 100300 },
    { date: new Date('2023-06-01'), value: 100600 },
  ];

  const forecastService = new TrendForecastService();

  it('should generate accurate predictions with linear trend data', () => {
    const forecast = forecastService.generateForecast(historicalData, 3);
    
    // We should have 3 forecast points
    expect(forecast.predictions.length).toBe(3);
    
    // Predicted dates should follow the sequence
    expect(forecast.predictions[0].date.getMonth()).toBe(6); // July
    expect(forecast.predictions[1].date.getMonth()).toBe(7); // August
    expect(forecast.predictions[2].date.getMonth()).toBe(8); // September
    
    // With linear growth, trend should continue in approximately same direction
    expect(forecast.predictions[0].value).toBeGreaterThan(historicalData[historicalData.length - 1].value);
    
    // Confidence should be between 0 and 1
    expect(forecast.confidenceScore).toBeGreaterThan(0);
    expect(forecast.confidenceScore).toBeLessThanOrEqual(1);
  });

  it('should handle cyclical data appropriately', () => {
    const forecast = forecastService.generateForecast(cyclicalData, 3);
    
    // We should have 3 forecast points
    expect(forecast.predictions.length).toBe(3);
    
    // Confidence score should be lower for cyclical data
    expect(forecast.confidenceScore).toBeLessThan(0.8);
    
    // Should contain a warning about cyclical patterns
    expect(forecast.warnings.some(warning => 
      warning.toLowerCase().includes('cyclical') || 
      warning.toLowerCase().includes('seasonal')
    )).toBe(true);
  });

  it('should recognize stable patterns', () => {
    const forecast = forecastService.generateForecast(stableData, 3);
    
    // Values should be relatively close to the historical average
    const average = stableData.reduce((sum, point) => sum + point.value, 0) / stableData.length;
    
    forecast.predictions.forEach(prediction => {
      // Predictions should be within 5% of the average for stable data
      expect(Math.abs(prediction.value - average) / average).toBeLessThan(0.05);
    });
    
    // Confidence should be high for stable data
    expect(forecast.confidenceScore).toBeGreaterThan(0.7);
  });

  it('should handle minimal data points gracefully', () => {
    const minimalData = historicalData.slice(0, 2); // Only 2 data points
    const forecast = forecastService.generateForecast(minimalData, 1);
    
    // Should still produce a forecast with limited data
    expect(forecast.predictions.length).toBe(1);
    
    // But confidence should be lower
    expect(forecast.confidenceScore).toBeLessThan(0.7);
    
    // Should include a warning about limited data
    expect(forecast.warnings.some(warning => 
      warning.toLowerCase().includes('limited data') || 
      warning.toLowerCase().includes('few data points')
    )).toBe(true);
  });

  it('should provide confidence intervals for predictions', () => {
    const forecast = forecastService.generateForecast(historicalData, 1);
    
    expect(forecast.predictions[0].lowerBound).toBeDefined();
    expect(forecast.predictions[0].upperBound).toBeDefined();
    expect(forecast.predictions[0].lowerBound).toBeLessThan(forecast.predictions[0].value);
    expect(forecast.predictions[0].upperBound).toBeGreaterThan(forecast.predictions[0].value);
  });

  it('should calculate appropriate growth rate', () => {
    const forecast = forecastService.generateForecast(historicalData, 3);
    
    // Growth rate should be positive for upward trending data
    expect(forecast.growthRate).toBeGreaterThan(0);
    
    // Calculate expected growth rate (approximately 4% monthly from data)
    const expectedGrowthRate = 0.04;
    expect(Math.abs(forecast.growthRate - expectedGrowthRate)).toBeLessThan(0.02);
  });

  it('should handle empty or invalid input gracefully', () => {
    // Empty array
    expect(() => forecastService.generateForecast([], 3)).toThrow();
    
    // Negative forecast periods
    expect(() => forecastService.generateForecast(historicalData, -1)).toThrow();
    
    // Zero forecast periods should return empty predictions
    const zeroForecast = forecastService.generateForecast(historicalData, 0);
    expect(zeroForecast.predictions.length).toBe(0);
  });
});