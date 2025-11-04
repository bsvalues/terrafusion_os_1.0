import { ReportingAgent } from '../../agents/ReportingAgent';
import { Income, Valuation } from '../../shared/schema';
import { TestIncome, TestValuation } from '../../shared/testTypes';
import { z } from 'zod';
import { createMockIncome, createMockValuation } from '../utils/testUtils';

describe('ReportingAgent', () => {
  let reportingAgent: ReportingAgent;
  
  // Mock data for testing
  const mockIncomeData: TestIncome[] = [
    {
      id: 1,
      userId: 1,
      source: 'rental',
      amount: '2500',
      frequency: 'monthly',
      description: 'Main property rental income in Benton County',
      createdAt: new Date('2023-01-15')
    },
    {
      id: 2,
      userId: 1,
      source: 'other', // Using 'other' instead of 'parking' to match enum
      amount: '200',
      frequency: 'monthly',
      description: 'Parking space rentals',
      createdAt: new Date('2023-01-22')
    },
    {
      id: 3,
      userId: 1,
      source: 'business',
      amount: '1200',
      frequency: 'monthly',
      description: 'Business rental in Benton County commercial center',
      createdAt: new Date('2023-02-05')
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
    reportingAgent = new ReportingAgent();
  });

  describe('generateReport', () => {
    test('should throw error when no data is provided', async () => {
      await expect(reportingAgent.generateReport(null as any, null as any)).rejects.toThrow('Cannot generate report: Missing income or valuation data');
    });
    
    test('should handle invalid income data', async () => {
      // Create invalid income data with incorrect source type
      const invalidIncome = [
        {...mockIncomeData[0], source: 'invalid_source' as any}
      ];
      
      const report = await reportingAgent.generateReport(invalidIncome, mockValuationHistory);
      
      // Should have validation errors in the report
      expect(report.errors).toBeDefined();
      expect(report.errors).not.toBeUndefined();
      expect(report.errors!.length).toBeGreaterThan(0);
      expect(report.errors![0]).toContain('invalid_source');
    });
    
    test('should handle invalid valuation data', async () => {
      // Create invalid valuation data with missing required field
      const invalidValuation = [
        {...mockValuationHistory[0], multiplier: undefined as any}
      ];
      
      const report = await reportingAgent.generateReport(mockIncomeData, invalidValuation);
      
      // Should have validation errors in the report
      expect(report.errors).toBeDefined();
      expect(report.errors).not.toBeUndefined();
      expect(report.errors!.length).toBeGreaterThan(0);
    });
    
    test('should handle invalid report period option', async () => {
      // Create invalid report options
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        period: 'invalid_period' as any
      });
      
      // Should default to monthly and include error
      expect(report.periodCovered).toBeDefined();
      expect(report.errors).toBeDefined();
      expect(report.errors).not.toBeUndefined();
      expect(report.errors!.length).toBeGreaterThan(0);
      expect(report.errors![0]).toContain('Invalid reporting period');
    });

    test('should generate a report with default options', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory);
      
      // Check basic report structure
      expect(report).toBeDefined();
      expect(report.dateGenerated).toBeInstanceOf(Date);
      expect(report.periodCovered).toHaveProperty('start');
      expect(report.periodCovered).toHaveProperty('end');
      expect(report.metrics).toBeDefined();
      expect(report.summary).toBeDefined();
      
      // Should include charts by default
      expect(report.charts).toBeDefined();
    });

    test('should generate a report without charts when specified', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        includeCharts: false
      });
      
      // Should not include charts
      expect(report.charts).toBeUndefined();
    });

    test('should generate a report with different period granularity', async () => {
      const yearlyReport = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        period: 'yearly'
      });
      
      const monthlyReport = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        period: 'monthly'
      });
      
      // Different period should result in different period coverage
      expect(yearlyReport.periodCovered.start.getTime()).toBeLessThan(monthlyReport.periodCovered.start.getTime());
    });

    test('should include insights when requested', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        includeInsights: true
      });
      
      expect(report.insights).toBeDefined();
      expect(report.insights.length).toBeGreaterThan(0);
    });

    test('should include recommendations when requested', async () => {
      const report = await reportingAgent.generateReport(mockIncomeData, mockValuationHistory, {
        includeRecommendations: true
      });
      
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('processIncomeData', () => {
    test('should filter out invalid income records', async () => {
      // Create a mix of valid and invalid income records
      const mixedData = [
        createMockIncome({ id: 1, source: 'rental' }),
        createMockIncome({ id: 2, source: 'invalid_source' as any }),
        createMockIncome({ id: 3, source: 'business' })
      ];
      
      // Access the private method using type assertion
      const result = (reportingAgent as any).preprocessIncomeData(mixedData);
      
      // Should separate valid and invalid records
      expect(result.processed.length).toBe(2); // Only valid records
      expect(result.errors.length).toBe(1); // One error for invalid record
      expect(result.errors[0]).toContain('invalid_source');
    });
    
    test('should handle empty income array', async () => {
      const result = (reportingAgent as any).preprocessIncomeData([]);
      
      expect(result.processed).toEqual([]);
      expect(result.errors.length).toBe(0);
    });
    
    test('should fix and report fixable issues', async () => {
      // Create income with fixable issue (negative amount)
      const fixableIncome = [
        createMockIncome({ id: 1, amount: '-100' })
      ];
      
      const result = (reportingAgent as any).preprocessIncomeData(fixableIncome);
      
      // Should fix the amount but record an error
      expect(result.processed.length).toBe(1);
      expect(result.processed[0].amount).toBe('100');
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('negative amount');
    });
  });
  
  describe('processValuationData', () => {
    test('should filter out invalid valuation records', async () => {
      // Create a mix of valid and invalid valuation records
      const mixedData = [
        createMockValuation({ id: 1, name: 'Valid Valuation' }),
        createMockValuation({ id: 2, name: '' }), // Empty name is invalid
        createMockValuation({ id: 3, name: 'Another Valid Valuation' })
      ];
      
      // Access the private method using type assertion
      const result = (reportingAgent as any).preprocessValuationData(mixedData);
      
      // Should separate valid and invalid records
      expect(result.processed.length).toBe(2); // Only valid records
      expect(result.errors.length).toBe(1); // One error for invalid record
    });
    
    test('should handle empty valuation array', async () => {
      const result = (reportingAgent as any).preprocessValuationData([]);
      
      expect(result.processed).toEqual([]);
      expect(result.errors.length).toBe(0);
    });
  });
  
  describe('generateValuationSummary', () => {
    test('should handle empty valuation history', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, []);
      
      expect(summary.text).toContain('No valuation data available');
      expect(summary.highlights).toHaveLength(1);
      expect(summary.trends).toHaveLength(1);
    });

    test('should generate summary with trends and highlights', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, mockValuationHistory);
      
      expect(summary.text).toBeDefined();
      expect(summary.text.length).toBeGreaterThan(0);
      expect(summary.highlights.length).toBeGreaterThan(0);
      expect(summary.trends.length).toBeGreaterThan(0);
    });

    test('should include Benton County specific information', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, mockValuationHistory);
      
      // Should mention Benton County in the summary
      expect(summary.text).toContain('Benton County');
    });

    test('should identify correct growth percentage', async () => {
      const summary = await reportingAgent.generateValuationSummary(mockIncomeData, mockValuationHistory);
      
      // Calculate expected growth percentage
      const firstAmount = parseFloat(mockValuationHistory[0].valuationAmount);
      const lastAmount = parseFloat(mockValuationHistory[2].valuationAmount);
      const expectedPercentChange = ((lastAmount - firstAmount) / firstAmount) * 100;
      
      // Summary should include the growth percentage
      expect(summary.text).toContain(Math.abs(expectedPercentChange).toFixed(2));
    });
  });
});