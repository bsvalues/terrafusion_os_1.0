import { ValuationAgent } from '../../agents/ValuationAgent';
import { Income, Valuation } from '../../shared/schema';
import { TestIncome, TestValuation } from '../../shared/testTypes';

describe('ValuationAgent', () => {
  let valuationAgent: ValuationAgent;
  
  // Mock data for testing
  const mockIncomeData: TestIncome[] = [
    {
      id: 1,
      userId: 1,
      source: 'rental',
      amount: '2500',
      frequency: 'monthly',
      description: 'Main property rental income',
      createdAt: new Date('2023-01-15')
    },
    {
      id: 2,
      userId: 1,
      source: 'rental',
      amount: '1800',
      frequency: 'monthly',
      description: 'Secondary unit rental income',
      createdAt: new Date('2023-01-20')
    },
    {
      id: 3,
      userId: 1,
      source: 'other', // Using 'other' as a valid enum value
      amount: '200',
      frequency: 'monthly',
      description: 'Parking space rentals',
      createdAt: new Date('2023-01-22')
    }
  ];

  const mockValuationHistory: TestValuation[] = [
    {
      id: 1,
      name: 'Initial Valuation',
      userId: 1,
      totalAnnualIncome: '54000',
      multiplier: '4.0',
      valuationAmount: '216000',
      incomeBreakdown: JSON.stringify({
        rental: 51600,
        parking: 2400
      }),
      notes: 'Initial valuation based on first year income projections',
      createdAt: new Date('2023-01-30'),
      updatedAt: new Date('2023-01-30'),
      isActive: true
    },
    {
      id: 2,
      name: '6-Month Update',
      userId: 1,
      totalAnnualIncome: '56400',
      multiplier: '4.2',
      valuationAmount: '236880',
      incomeBreakdown: JSON.stringify({
        rental: 54000,
        parking: 2400
      }),
      notes: 'Updated after rental increase for main unit',
      createdAt: new Date('2023-07-30'),
      updatedAt: new Date('2023-07-30'),
      isActive: true
    },
    {
      id: 3,
      name: 'Annual Review',
      userId: 1,
      totalAnnualIncome: '61200',
      multiplier: '4.3',
      valuationAmount: '263160',
      incomeBreakdown: JSON.stringify({
        rental: 58800,
        parking: 2400
      }),
      notes: 'Annual review with rental increases on both units',
      createdAt: new Date('2024-01-30'),
      updatedAt: new Date('2024-01-30'),
      isActive: true
    }
  ];

  beforeEach(() => {
    valuationAgent = new ValuationAgent();
  });

  describe('analyzeIncome', () => {
    test('should throw error when no income data is provided', async () => {
      await expect(valuationAgent.analyzeIncome([])).rejects.toThrow('Cannot analyze income: No income data provided');
    });

    test('should correctly calculate total monthly and annual income', async () => {
      const result = await valuationAgent.analyzeIncome(mockIncomeData);
      
      // Total monthly income should be sum of all income sources (2500 + 1800 + 200 = 4500)
      expect(result.analysis.metrics.averageMonthlyIncome).toBe(4500);
      
      // Annual income should be monthly * 12
      expect(result.analysis.metrics.totalAnnualIncome).toBe(4500 * 12);
    });

    test('should correctly identify the most common income type', async () => {
      const result = await valuationAgent.analyzeIncome(mockIncomeData);
      
      // Most common source should be 'rental' (2 entries)
      expect(result.analysis.findings.find(f => f.includes('primary income source')))
        .toContain('rental');
    });

    test('should calculate valid diversification and stability scores', async () => {
      const result = await valuationAgent.analyzeIncome(mockIncomeData);
      
      // Diversification score should be between 0-100
      expect(result.analysis.metrics.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(result.analysis.metrics.diversificationScore).toBeLessThanOrEqual(100);
      
      // Stability score should be between 0-100
      expect(result.analysis.metrics.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.analysis.metrics.stabilityScore).toBeLessThanOrEqual(100);
    });

    test('should suggest a valuation with multiplier between 2.5 and 5.0', async () => {
      const result = await valuationAgent.analyzeIncome(mockIncomeData);
      
      const multiplier = parseFloat(result.suggestedValuation.multiplier);
      expect(multiplier).toBeGreaterThanOrEqual(2.5);
      expect(multiplier).toBeLessThanOrEqual(5.0);
      
      // Valuation amount should be annual income * multiplier
      const expectedValuation = result.analysis.metrics.totalAnnualIncome * multiplier;
      expect(parseFloat(result.suggestedValuation.amount)).toBeCloseTo(expectedValuation, 2);
    });

    test('should include Benton County specific considerations', async () => {
      const result = await valuationAgent.analyzeIncome(mockIncomeData);
      
      // Check for Benton County mention in considerations
      const bentonCountyConsideration = result.suggestedValuation.considerations.find(
        c => c.includes('Benton County')
      );
      expect(bentonCountyConsideration).toBeDefined();
    });
  });

  describe('detectAnomalies', () => {
    test('should handle insufficient valuation history', async () => {
      const result = await valuationAgent.detectAnomalies([mockValuationHistory[0]]);
      
      expect(result.anomalies).toHaveLength(0);
      expect(result.insights).toContain('Not enough valuation data to perform anomaly detection. At least two valuations are required.');
    });

    test('should detect valuation growth from first to last valuation', async () => {
      const result = await valuationAgent.detectAnomalies(mockValuationHistory);
      
      // Calculate expected growth percentage
      const firstAmount = parseFloat(mockValuationHistory[0].valuationAmount);
      const lastAmount = parseFloat(mockValuationHistory[2].valuationAmount);
      const expectedGrowth = ((lastAmount - firstAmount) / firstAmount) * 100;
      
      // Check for the growth insight
      const growthInsight = result.insights.find(insight => 
        insight.includes('grown') || insight.includes('declined')
      );
      
      expect(growthInsight).toBeDefined();
      expect(growthInsight).toContain(Math.abs(expectedGrowth).toFixed(2));
    });

    test('should generate a summary with trend information', async () => {
      const result = await valuationAgent.detectAnomalies(mockValuationHistory);
      
      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
      
      // Summary should mention either growth or decline
      expect(result.summary).toMatch(/growth|decline|trend/i);
    });

    test('should detect multiplier changes as potential anomalies', async () => {
      // Create a modified history with a large multiplier jump
      const modifiedHistory = [...mockValuationHistory];
      modifiedHistory[2] = {
        ...modifiedHistory[2],
        multiplier: '6.5', // Large jump from 4.3
        valuationAmount: (61200 * 6.5).toString()
      };
      
      const result = await valuationAgent.detectAnomalies(modifiedHistory);
      
      // Should detect an anomaly
      expect(result.anomalies.length).toBeGreaterThan(0);
      
      // The anomaly should mention multiplier adjustment
      const multiplierAnomaly = result.anomalies.find(anomaly => 
        anomaly.potentialCauses?.some(cause => cause.includes('multiplier'))
      );
      
      expect(multiplierAnomaly).toBeDefined();
    });
  });
});