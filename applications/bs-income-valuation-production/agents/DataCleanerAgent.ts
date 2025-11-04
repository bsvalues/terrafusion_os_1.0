import { Income } from '../shared/schema';

/**
 * Data issue representation for income analysis
 */
interface DataIssue {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  affectedRecords: number;
  suggestions: string[];
}

/**
 * Suggested fix for data quality issues
 */
interface SuggestedFix {
  type: string;
  description: string;
  automaticFix: boolean;
  affectedRecords: number[];
}

/**
 * Duplicate group representation
 */
interface DuplicateGroup {
  records: Income[];
  similarity: number;
  reason: string;
}

/**
 * Data quality analysis result
 */
interface DataQualityAnalysis {
  qualityScore: number;
  totalRecords: number;
  issues: DataIssue[];
  suggestedFixes: SuggestedFix[];
  potentialDuplicates: DuplicateGroup[];
}

/**
 * DataCleanerAgent - AI-powered agent for detecting and fixing anomalies in income data
 * Focuses on identifying data quality issues in Benton County property valuation data
 */
export class DataCleanerAgent {
  /**
   * Analyzes income data to detect potential issues or anomalies
   * @param incomeData Array of income records
   * @returns Object containing analysis results, issues found, and suggested fixes
   */
  async analyzeIncomeData(incomeData: Income[]): Promise<DataQualityAnalysis> {
    if (!incomeData) {
      throw new Error('No income data provided');
    }

    const totalRecords = incomeData.length;
    const issues: DataIssue[] = [];
    const suggestedFixes: SuggestedFix[] = [];
    
    // If no data, return empty analysis
    if (totalRecords === 0) {
      return {
        qualityScore: 100,
        totalRecords: 0,
        issues: [],
        suggestedFixes: [],
        potentialDuplicates: []
      };
    }

    // Check for missing data
    const missingDescriptions = incomeData.filter(income => 
      !income.description || income.description.trim() === '');
    
    if (missingDescriptions.length > 0) {
      issues.push({
        type: 'missing_data',
        description: `${missingDescriptions.length} records have missing descriptions`,
        severity: missingDescriptions.length > totalRecords / 2 ? 'high' : 'medium',
        affectedRecords: missingDescriptions.length,
        suggestions: [
          'Add descriptive details to income records',
          'Include information about income sources and timing',
          'Specify location details for Benton County properties'
        ]
      });
      
      suggestedFixes.push({
        type: 'add_descriptions',
        description: 'Add default descriptions based on income source types',
        automaticFix: false,
        affectedRecords: missingDescriptions.map(income => income.id)
      });
    }
    
    // Check for unreasonable values (negative amounts, etc.)
    const negativeAmounts = incomeData.filter(income => 
      parseFloat(income.amount) < 0);
    
    if (negativeAmounts.length > 0) {
      issues.push({
        type: 'invalid_values',
        description: `${negativeAmounts.length} records have negative amounts`,
        severity: 'high',
        affectedRecords: negativeAmounts.length,
        suggestions: [
          'Convert negative income to positive values',
          'Use expense categories instead of negative income',
          'Verify if these represent actual losses'
        ]
      });
      
      suggestedFixes.push({
        type: 'fix_negative_amounts',
        description: 'Convert negative amounts to positive values',
        automaticFix: true,
        affectedRecords: negativeAmounts.map(income => income.id)
      });
    }
    
    // Find potential duplicate entries
    const potentialDuplicates = this.findPotentialDuplicates(incomeData);
    
    if (potentialDuplicates.length > 0) {
      const totalDuplicates = potentialDuplicates.reduce(
        (count, group) => count + group.records.length, 0);
      
      issues.push({
        type: 'potential_duplicates',
        description: `Found ${potentialDuplicates.length} groups with potential duplicate entries (${totalDuplicates} records affected)`,
        severity: potentialDuplicates.length > 2 ? 'high' : 'medium',
        affectedRecords: totalDuplicates,
        suggestions: [
          'Review similar entries and merge if appropriate',
          'Check for data entry errors',
          'Verify if these are genuinely distinct income sources'
        ]
      });
      
      potentialDuplicates.forEach(group => {
        const primaryId = group.records[0].id;
        const duplicateIds = group.records.slice(1).map(r => r.id);
        
        suggestedFixes.push({
          type: 'merge_duplicates',
          description: `Merge potential duplicates with primary record (ID: ${primaryId})`,
          automaticFix: false,
          affectedRecords: duplicateIds
        });
      });
    }
    
    // Check for inconsistent frequency
    const frequencyCounts: Record<string, Income[]> = {};
    incomeData.forEach(income => {
      const freq = income.frequency.toLowerCase();
      if (!frequencyCounts[freq]) {
        frequencyCounts[freq] = [];
      }
      frequencyCounts[freq].push(income);
    });
    
    if (Object.keys(frequencyCounts).length > 2) {
      const freqList = Object.keys(frequencyCounts).join(', ');
      issues.push({
        type: 'inconsistent_frequency',
        description: `Mixed frequency units found: ${freqList}`,
        severity: 'low',
        affectedRecords: incomeData.length,
        suggestions: [
          'Consider standardizing to monthly or annual frequency',
          'Group similar frequencies together for analysis',
          'Verify that frequency values are correctly entered'
        ]
      });
      
      // Suggest converting all to monthly (most common for income analysis)
      const nonMonthlyIncomes = incomeData.filter(income => 
        income.frequency.toLowerCase() !== 'monthly');
      
      if (nonMonthlyIncomes.length > 0) {
        suggestedFixes.push({
          type: 'standardize_frequency',
          description: 'Convert all income records to monthly frequency',
          automaticFix: true,
          affectedRecords: nonMonthlyIncomes.map(income => income.id)
        });
      }
    }

    // Calculate data quality score based on issues
    const qualityScore = this.calculateDataQualityScore(issues, totalRecords);

    return {
      qualityScore,
      totalRecords,
      issues,
      suggestedFixes,
      potentialDuplicates
    };
  }

  /**
   * Finds potential duplicate income entries based on similar attributes
   * @param incomeData Array of income records
   * @returns Array of groups of potential duplicates
   */
  private findPotentialDuplicates(incomeData: Income[]): DuplicateGroup[] {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<number>();
    
    for (let i = 0; i < incomeData.length; i++) {
      const incomeA = incomeData[i];
      
      if (processedIds.has(incomeA.id)) continue;
      
      const similarIncomes: Income[] = [incomeA];
      let reason = '';
      
      for (let j = i + 1; j < incomeData.length; j++) {
        const incomeB = incomeData[j];
        
        if (processedIds.has(incomeB.id)) continue;
        
        // Check for potential duplicates based on several criteria
        const sameSource = incomeA.source === incomeB.source;
        const sameFrequency = incomeA.frequency === incomeB.frequency;
        
        // Check for similar amounts (within 5%)
        const amountA = parseFloat(incomeA.amount);
        const amountB = parseFloat(incomeB.amount);
        const amountDiff = Math.abs(amountA - amountB);
        const similarAmount = (amountDiff / Math.max(amountA, amountB)) <= 0.05;
        
        // Check for similar descriptions using simple match
        const similarDescription = incomeA.description && incomeB.description && 
          (incomeA.description.toLowerCase().includes(incomeB.description.toLowerCase()) || 
           incomeB.description.toLowerCase().includes(incomeA.description.toLowerCase()));
        
        // Check for close dates
        const dateA = new Date(incomeA.createdAt);
        const dateB = new Date(incomeB.createdAt);
        const daysDiff = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);
        const closeDates = daysDiff <= 7; // Within a week
        
        // Determine if this is likely a duplicate
        let isDuplicate = false;
        
        if (sameSource && sameFrequency && similarAmount) {
          isDuplicate = true;
          reason = 'Same source, frequency and similar amount';
        } else if (sameSource && similarAmount && closeDates) {
          isDuplicate = true;
          reason = 'Same source, similar amount and created within a week';
        } else if (sameSource && sameFrequency && similarDescription) {
          isDuplicate = true;
          reason = 'Same source, frequency and similar description';
        }
        
        if (isDuplicate) {
          similarIncomes.push(incomeB);
          processedIds.add(incomeB.id);
        }
      }
      
      // If we found potential duplicates
      if (similarIncomes.length > 1) {
        processedIds.add(incomeA.id);
        
        // Calculate similarity score (0-1)
        const similarity = 0.7 + (0.3 * (similarIncomes.length - 2) / incomeData.length);
        
        duplicateGroups.push({
          records: similarIncomes,
          similarity: similarity,
          reason: reason
        });
      }
    }
    
    return duplicateGroups;
  }

  /**
   * Calculates a data quality score based on issues found
   * @param issues Array of issues found
   * @param totalRecords Total number of records analyzed
   * @returns Quality score from 0-100
   */
  private calculateDataQualityScore(issues: DataIssue[], totalRecords: number): number {
    if (issues.length === 0 || totalRecords === 0) {
      return 100; // Perfect score if no issues or no records
    }
    
    // Calculate total affected records (may have overlaps)
    const affectedRecords = new Set<number>();
    issues.forEach(issue => {
      // If the issue has specific IDs, add them
      if (issue.type === 'potential_duplicates') {
        // For duplicate records, we need to count each affected ID
        // We can't call findPotentialDuplicates here as it would be recursive
        // Just use the issue's affected records count as an approximation
        for (let i = 0; i < issue.affectedRecords; i++) {
          affectedRecords.add(i);
        }
      } else {
        // Just add the count of affected records (not ideal but workable)
        for (let i = 0; i < issue.affectedRecords; i++) {
          affectedRecords.add(i);
        }
      }
    });
    
    // Calculate severity weights (higher severity = more impact on score)
    const severityWeights = {
      high: 3,
      medium: 2,
      low: 1
    };
    
    // Calculate weighted issue score
    const weightedIssueScore = issues.reduce((score, issue) => {
      const weight = severityWeights[issue.severity];
      return score + (weight * issue.affectedRecords / totalRecords);
    }, 0);
    
    // Calculate final quality score (0-100)
    // Higher weightedIssueScore means more issues, so subtract from 100
    const qualityScore = Math.max(0, Math.min(100, 100 - (weightedIssueScore * 25)));
    
    return Math.round(qualityScore);
  }
}