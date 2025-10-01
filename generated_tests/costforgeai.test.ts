// 🧪 AI-Generated Unit Test
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostForgeAI } from '../ai/costforge.ts';

describe('CostForgeAI', () => {
  let costforgeai;

  beforeEach(() => {
    costforgeai = new CostForgeAI({});
  });

  it('should calculate property value accurately', async () => {
    // Arrange
    const property = { sqft: 2400, year: 2010, location: 'residential' };

    // Act
    const result = await costforgeai.calculateValue(property);

    // Assert
    expect(result).toBeCloseTo(385000, -3);
    expect(costforgeai.status).toBe('ready');
  });

  it('should handle invalid property data', async () => {
    // AI-generated edge case test
    // Simulate error condition

    await expect(costforgeai.calculateValue(null)).rejects.toThrow();
  });
});
