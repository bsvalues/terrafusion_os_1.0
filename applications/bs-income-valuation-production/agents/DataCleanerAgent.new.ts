/**
 * DataCleanerAgent - AI-powered agent for detecting and fixing anomalies in income data
 * Enhanced with MCP compatibility and learning capabilities
 */

import { Income } from '../shared/schema';
import { 
  AgentType, 
  EventType,
  ErrorCode
} from '../shared/agentProtocol';
import { BaseAgent } from './BaseAgent';
import { AgentExperience } from '../shared/agentProtocol';
import { DATA_CLEANER_AGENT_CONFIG } from '../config/mcpConfig';

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
 * Enhanced DataCleanerAgent with MCP compatibility
 */
export class DataCleanerAgent extends BaseAgent {
  private duplicateDetectionThreshold: number;
  private validationRules: {
    allowNegativeIncome: boolean;
    requireDescriptions: boolean;
    allowedFrequencies: string[];
  };
  
  /**
   * Create a new DataCleanerAgent
   * @param agentId Unique ID for this agent
   */
  constructor(agentId: string = 'data-cleaner-agent-1') {
    super(agentId, AgentType.DATA_CLEANER);
    
    // Initialize from configuration
    const config = DATA_CLEANER_AGENT_CONFIG;
    this.duplicateDetectionThreshold = config.duplicateDetectionThreshold;
    this.validationRules = config.validationRules;
  }
  
  /**
   * Process a request sent to this agent
   * @param request The request to process
   * @returns Promise resolving to the result
   */
  public async processRequest(request: any): Promise<any> {
    const startTime = Date.now();
    let result: any;
    
    try {
      // Currently only supports income data analysis
      if (request.type === 'analyze-data-quality') {
        result = await this.analyzeIncomeData(request.incomeData);
      } else {
        throw new Error(`Unknown request type: ${request.type}`);
      }
      
      const processingTime = Date.now() - startTime;
      this.reportResult(result, processingTime, undefined, request.correlationId);
      return result;
    } catch (error) {
      this.reportError(error as Error, request.id, request.correlationId);
      
      // If we encounter serious data issues, request help
      if (error instanceof Error && error.message.includes('validation')) {
        this.requestHelp(
          `Data validation issues: ${error.message}`,
          request.id || 'unknown-task',
          1,
          error.message,
          { incomeData: request.incomeData }
        );
      }
      
      throw error;
    }
  }
  
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

    // Check for missing descriptions if required
    if (this.validationRules.requireDescriptions) {
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
    }
    
    // Check for unreasonable values (negative amounts)
    if (!this.validationRules.allowNegativeIncome) {
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
    }
    
    // Check for invalid frequencies
    if (this.validationRules.allowedFrequencies && this.validationRules.allowedFrequencies.length > 0) {
      const invalidFrequencies = incomeData.filter(
        income => !this.validationRules.allowedFrequencies.includes(income.frequency.toLowerCase())
      );
      
      if (invalidFrequencies.length > 0) {
        issues.push({
          type: 'invalid_frequency',
          description: `${invalidFrequencies.length} records have invalid frequency values`,
          severity: 'medium',
          affectedRecords: invalidFrequencies.length,
          suggestions: [
            `Use standard frequency values: ${this.validationRules.allowedFrequencies.join(', ')}`,
            'Standardize frequency terminology across all records'
          ]
        });
        
        suggestedFixes.push({
          type: 'standardize_frequencies',
          description: 'Convert non-standard frequencies to nearest standard value',
          automaticFix: true,
          affectedRecords: invalidFrequencies.map(income => income.id)
        });
      }
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
        
        // Check for similar amounts (within threshold percentage)
        const amountA = parseFloat(incomeA.amount);
        const amountB = parseFloat(incomeB.amount);
        const amountDiff = Math.abs(amountA - amountB);
        const similarAmount = (amountDiff / Math.max(amountA, amountB)) <= this.duplicateDetectionThreshold;
        
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
  
  /**
   * Handle a help request from another agent
   * @param helpRequest The help request payload
   * @param requestingAgentId ID of the agent requesting help
   * @returns Promise resolving when help is provided
   */
  public override async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    console.log(`DataCleanerAgent handling help request from ${requestingAgentId}`);
    
    // We can only help with data quality-related tasks
    if (!helpRequest.problemDescription.includes('data quality') && 
        !helpRequest.problemDescription.includes('validation') &&
        !helpRequest.problemDescription.includes('duplicate')) {
      console.log(`Cannot help with ${helpRequest.problemDescription}, not a data quality issue`);
      return;
    }
    
    // Check if we have the required context data
    if (!helpRequest.contextData) {
      console.log('Insufficient context data to provide help');
      return;
    }
    
    try {
      // If we have income data, analyze it for data quality issues
      if (helpRequest.contextData.incomeData) {
        const incomeData = helpRequest.contextData.incomeData;
        
        // Temporarily relax validation rules for this analysis
        const originalRules = { ...this.validationRules };
        this.validationRules = {
          ...this.validationRules,
          requireDescriptions: false,  // Don't require descriptions for this analysis
        };
        
        // Perform analysis
        const result = await this.analyzeIncomeData(incomeData);
        
        // Restore original rules
        this.validationRules = originalRules;
        
        // Send result to MCP for routing back to requesting agent
        this.sendMessage({
          messageId: crypto.randomUUID(),
          correlationId: helpRequest.taskId,
          sourceAgentId: this.agentId,
          targetAgentId: 'MCP',
          timestamp: new Date().toISOString(),
          eventType: EventType.RESPONSE,
          payload: {
            status: 'success',
            result,
            helpProvidedTo: requestingAgentId,
            originalTask: helpRequest.taskId,
            notes: ['Data quality analysis performed with relaxed validation']
          }
        });
      } else {
        console.log('Unable to help with the provided context data');
      }
    } catch (error) {
      console.error('Error providing data quality help:', error);
      
      // Report error to MCP
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: helpRequest.taskId,
        sourceAgentId: this.agentId,
        targetAgentId: 'MCP',
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: `Error providing help: ${(error as Error).message}`,
          helpRequestId: helpRequest.taskId,
          requestingAgentId
        }
      });
    }
  }
  
  /**
   * Learn from a set of experiences
   * @param experiences The experiences to learn from
   * @returns Promise resolving when learning is complete
   */
  public override async learn(experiences: AgentExperience[]): Promise<void> {
    console.log(`${this.agentId} learning from ${experiences.length} experiences`);
    
    // Extract successful data quality analyses to learn from
    const dataQualityResults = experiences
      .filter(exp => 
        exp.metadata.messageType === EventType.RESPONSE && 
        exp.result.status === 'success' &&
        exp.result.result?.qualityScore !== undefined
      )
      .map(exp => exp.result.result);
    
    if (dataQualityResults.length === 0) {
      console.log('No relevant data quality experiences to learn from');
      return;
    }
    
    // Learn about duplicate detection threshold
    const duplicateGroups = dataQualityResults
      .flatMap(result => result.potentialDuplicates || []);
    
    if (duplicateGroups.length > 0) {
      // Calculate average similarity across all duplicate groups
      const totalSimilarity = duplicateGroups.reduce((sum, group) => sum + group.similarity, 0);
      const avgSimilarity = totalSimilarity / duplicateGroups.length;
      
      // If we have enough data, adjust our duplicate detection threshold
      if (duplicateGroups.length >= 5) {
        const oldThreshold = this.duplicateDetectionThreshold;
        const newThreshold = oldThreshold * 0.8 + avgSimilarity * 0.2;
        
        // Only change if significant
        if (Math.abs(newThreshold - oldThreshold) > 0.05) {
          console.log(`Adjusted duplicate detection threshold from ${oldThreshold} to ${newThreshold}`);
          this.duplicateDetectionThreshold = newThreshold;
        }
      }
    }
    
    // Learn from error experiences
    const errorExperiences = experiences.filter(exp => exp.metadata.messageType === EventType.ERROR);
    if (errorExperiences.length > 0) {
      console.log(`Analyzing ${errorExperiences.length} error experiences to improve robustness`);
      
      // Check for common error patterns and adjust parameters if needed
      // For example, if many errors relate to validation rules, we might want to relax them
      const validationErrors = errorExperiences.filter(exp => 
        exp.result.errorMessage && exp.result.errorMessage.includes('validation')
      );
      
      if (validationErrors.length > errorExperiences.length / 2) {
        // Many validation-related errors, consider relaxing some rules
        console.log('Many validation errors detected, considering rule adjustments');
        
        // Specific rule adjustments based on error patterns could be implemented here
      }
    }
  }
  
  /**
   * Get the capabilities of this agent
   * @returns Array of capability strings
   */
  public override getCapabilities(): string[] {
    return [
      'data_validation',
      'duplicate_detection',
      'data_quality_analysis',
      'data_cleanup',
      'anomaly_detection'
    ];
  }
}