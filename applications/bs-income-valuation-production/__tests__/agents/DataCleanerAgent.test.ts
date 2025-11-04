import { DataCleanerAgent } from '../../agents/DataCleanerAgent';
import { Income } from '../../shared/schema';
import { TestIncome } from '../../shared/testTypes';

describe('DataCleanerAgent', () => {
  let dataCleanerAgent: DataCleanerAgent;
  
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
      source: 'rental',
      amount: '2500', // Duplicate amount
      frequency: 'monthly', // Same frequency
      description: 'Rental income from main property',
      createdAt: new Date('2023-01-16') // Created just one day later
    },
    {
      id: 3,
      userId: 1,
      source: 'business',
      amount: '-500', // Negative amount
      frequency: 'monthly',
      description: 'Business income deduction',
      createdAt: new Date('2023-01-20')
    },
    {
      id: 4,
      userId: 1,
      source: 'salary',
      amount: '4000',
      frequency: 'monthly',
      description: '', // Empty description
      createdAt: new Date('2023-01-25')
    },
    {
      id: 5,
      userId: 1,
      source: 'investment',
      amount: '1000',
      frequency: 'quarterly', // Different frequency
      description: 'Dividend income from investments',
      createdAt: new Date('2023-02-01')
    }
  ];

  beforeEach(() => {
    dataCleanerAgent = new DataCleanerAgent();
  });

  describe('analyzeIncomeData', () => {
    test('should throw error when no income data is provided', async () => {
      await expect(dataCleanerAgent.analyzeIncomeData(null as any)).rejects.toThrow('No income data provided');
    });

    test('should return perfect score for empty data set', async () => {
      const result = await dataCleanerAgent.analyzeIncomeData([]);
      
      expect(result.qualityScore).toBe(100);
      expect(result.totalRecords).toBe(0);
      expect(result.issues).toHaveLength(0);
      expect(result.suggestedFixes).toHaveLength(0);
    });

    test('should detect missing descriptions', async () => {
      const result = await dataCleanerAgent.analyzeIncomeData(mockIncomeData);
      
      const missingDataIssue = result.issues.find(issue => issue.type === 'missing_data');
      expect(missingDataIssue).toBeDefined();
      expect(missingDataIssue?.description).toContain('missing descriptions');
      
      // Should have one record with empty description
      expect(missingDataIssue?.affectedRecords).toBe(1);
    });

    test('should detect negative amounts', async () => {
      const result = await dataCleanerAgent.analyzeIncomeData(mockIncomeData);
      
      const negativeAmountIssue = result.issues.find(issue => issue.type === 'invalid_values');
      expect(negativeAmountIssue).toBeDefined();
      expect(negativeAmountIssue?.description).toContain('negative amounts');
      
      // Should suggest fixing negative amounts
      const fixNegativeAmountsSuggestion = result.suggestedFixes.find(fix => 
        fix.type === 'fix_negative_amounts'
      );
      expect(fixNegativeAmountsSuggestion).toBeDefined();
      expect(fixNegativeAmountsSuggestion?.automaticFix).toBe(true);
    });

    test('should detect potential duplicate entries', async () => {
      const result = await dataCleanerAgent.analyzeIncomeData(mockIncomeData);
      
      const duplicatesIssue = result.issues.find(issue => issue.type === 'potential_duplicates');
      expect(duplicatesIssue).toBeDefined();
      
      // Should find the duplicates
      expect(result.potentialDuplicates.length).toBeGreaterThan(0);
      
      // First two records should be identified as duplicates
      const duplicateGroup = result.potentialDuplicates[0];
      expect(duplicateGroup.records).toContainEqual(expect.objectContaining({ id: 1 }));
      expect(duplicateGroup.records).toContainEqual(expect.objectContaining({ id: 2 }));
    });

    test('should detect inconsistent frequency units', async () => {
      const result = await dataCleanerAgent.analyzeIncomeData(mockIncomeData);
      
      const frequencyIssue = result.issues.find(issue => issue.type === 'inconsistent_frequency');
      expect(frequencyIssue).toBeDefined();
      
      // Should suggest standardizing frequency
      const standardizeFrequencySuggestion = result.suggestedFixes.find(fix => 
        fix.type === 'standardize_frequency'
      );
      expect(standardizeFrequencySuggestion).toBeDefined();
    });

    test('should calculate a quality score between 0 and 100', async () => {
      const result = await dataCleanerAgent.analyzeIncomeData(mockIncomeData);
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    test('should lower quality score for more severe issues', async () => {
      // Create a dataset with just missing descriptions (medium severity)
      const missingDescData = [
        { ...mockIncomeData[3] } // Copy of the record with empty description
      ];
      
      // Create a dataset with just negative amounts (high severity)
      const negativeAmountData = [
        { ...mockIncomeData[2] } // Copy of the record with negative amount
      ];
      
      const resultMissingDesc = await dataCleanerAgent.analyzeIncomeData(missingDescData);
      const resultNegativeAmount = await dataCleanerAgent.analyzeIncomeData(negativeAmountData);
      
      // High severity issues should result in a lower quality score
      expect(resultNegativeAmount.qualityScore).toBeLessThan(resultMissingDesc.qualityScore);
    });
  });
});