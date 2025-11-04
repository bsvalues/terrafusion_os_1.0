import { Income, Valuation } from '../shared/schema';
import { z } from 'zod';

/**
 * Interface for the analysis results from the valuation agent
 */
export interface IncomeAnalysis {
  analysis: {
    findings: string[];
    recommendations: string[];
    distribution: Array<{ source: string; percentage: number }>;
    metrics: {
      averageMonthlyIncome: number;
      totalAnnualIncome: number;
      diversificationScore: number;
      stabilityScore: number;
      growthPotential: number;
      seasonalImpact: 'high' | 'medium' | 'low';
    };
  };
  suggestedValuation: {
    amount: string;
    multiplier: string;
    considerations: string[];
    rangeMin: string;
    rangeMax: string;
    confidenceScore: number;
  };
  errors?: string[]; // Optional errors that didn't prevent analysis but might affect quality
}

/**
 * Interface for detected anomalies in valuation history
 */
export interface AnomalyDetection {
  anomalies: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    relatedValuationIds?: number[];
    potentialCauses?: string[];
    suggestedActions?: string[];
  }>;
  insights: string[];
  summary: string;
  errors?: string[]; // Optional errors that didn't prevent analysis but might affect quality
}

// Validation schema for Income data
export const IncomeSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  source: z.string().min(1).max(50),
  amount: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a valid positive number" }),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"])
    .or(z.string()), // Allow string but will be normalized in processing
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Validation schema for Valuation data
export const ValuationSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  valuationAmount: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, { message: "Valuation amount must be a valid positive number" }),
  multiplier: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, { message: "Multiplier must be a valid positive number" }),
  valuationDate: z.date(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * ValuationAgent - AI-powered agent for analyzing income data and generating valuation insights
 * Focuses specifically on income valuation approaches for Benton County, Washington properties
 */
export class ValuationAgent {
  /**
   * Analyzes income data to provide valuation insights
   * @param incomeData Array of income records
   * @returns Analysis results and recommendations
   */
  /**
   * Pre-processes income data to normalize values and handle edge cases
   * @param incomeData Raw income data to process
   * @returns Processed income data array and any validation errors
   */
  private preprocessIncomeData(incomeData: Income[]): { processed: Income[], errors: string[] } {
    const processed: Income[] = [];
    const errors: string[] = [];
    
    // Process each income record
    for (let i = 0; i < incomeData.length; i++) {
      const income = { ...incomeData[i] };
      
      try {
        // Validate with Zod schema
        IncomeSchema.parse(income);
        
        // Normalize frequency to lowercase for consistent processing
        income.frequency = income.frequency.toLowerCase();
        
        // Add to processed array
        processed.push(income);
      } catch (error) {
        // If validation fails, record error but still try to use the data
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `Field '${e.path.join('.')}': ${e.message}`).join('; ');
          errors.push(`Invalid income record (ID: ${income.id || 'unknown'}): ${errorDetails}`);
        } else {
          errors.push(`Error processing income record (ID: ${income.id || 'unknown'}): ${(error as Error).message}`);
        }
        
        // Still add to processed array if we can salvage it
        if (income.id && income.amount && parseFloat(income.amount) > 0) {
          // Ensure frequency is normalized
          if (!income.frequency || typeof income.frequency !== 'string') {
            income.frequency = 'monthly'; // Default to monthly if missing
            errors.push(`Missing frequency for income record ${income.id}, defaulting to monthly`);
          }
          
          processed.push(income);
        }
      }
    }
    
    // Check if we have a reasonable number of income records
    if (processed.length === 0 && incomeData.length > 0) {
      errors.push('All income records failed validation. Check data format.');
    }
    
    return { processed, errors };
  }
  
  async analyzeIncome(incomeData: Income[]): Promise<IncomeAnalysis> {
    if (!incomeData || incomeData.length === 0) {
      throw new Error('Cannot analyze income: No income data provided');
    }
    
    // Preprocess income data
    const { processed, errors } = this.preprocessIncomeData(incomeData);
    
    // If no valid records, throw error
    if (processed.length === 0) {
      throw new Error('Cannot analyze income: No valid income records after validation');
    }

    // Calculate total monthly and annual income
    const totalMonthlyIncome = processed.reduce((sum, income) => {
      const amount = parseFloat(income.amount);
      // Convert to monthly equivalent if needed
      switch (income.frequency.toLowerCase()) {
        case 'weekly': return sum + (amount * 4.33);
        case 'biweekly': return sum + (amount * 2.17);
        case 'monthly': return sum + amount;
        case 'quarterly': return sum + (amount / 3);
        case 'annually': return sum + (amount / 12);
        default: return sum + amount;
      }
    }, 0);

    const totalAnnualIncome = totalMonthlyIncome * 12;

    // Analyze income distribution by source
    const incomeBySource: Record<string, Income[]> = {};
    processed.forEach(income => {
      if (!incomeBySource[income.source]) {
        incomeBySource[income.source] = [];
      }
      incomeBySource[income.source].push(income);
    });

    // Calculate distribution percentages
    const distribution = Object.entries(incomeBySource).map(([source, incomes]) => {
      const sourceTotal = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const percentage = (sourceTotal / totalMonthlyIncome) * 100;
      return { source, percentage };
    });

    // Get most common income type
    const mostCommonType = this.getMostCommonIncomeType(incomeBySource);

    // Calculate diversification score (0-100)
    // Higher when income comes from multiple sources with more even distribution
    const diversificationScore = Math.min(100, 
      Math.max(0, 100 - (Math.pow(distribution[0]?.percentage || 0, 2) / 100))
    );

    // Calculate stability score based on income types
    // Stable types: salary, rental; Less stable: freelance, business
    const stabilityMapping: Record<string, number> = {
      'salary': 90,
      'rental': 85,
      'investment': 70,
      'business': 60,
      'freelance': 50,
      'other': 40
    };

    const stabilityScore = Math.min(100, 
      distribution.reduce((score, { source, percentage }) => {
        return score + (stabilityMapping[source] || 50) * (percentage / 100);
      }, 0)
    );

    // Generate findings
    const findings = [
      `Your total monthly income is $${totalMonthlyIncome.toFixed(2)}`,
      `Your total annual income is $${totalAnnualIncome.toFixed(2)}`,
      `Your primary income source is ${mostCommonType} (${distribution.find(d => d.source === mostCommonType)?.percentage.toFixed(2)}% of total)`,
      `Your income diversification score is ${diversificationScore.toFixed(2)} out of 100`,
      `Your income stability score is ${stabilityScore.toFixed(2)} out of 100`
    ];

    // Generate recommendations based on analysis
    const recommendations = [];
    
    if (diversificationScore < 50) {
      recommendations.push("Consider diversifying your income sources to reduce risk");
    }
    
    if (stabilityScore < 70) {
      recommendations.push("Look for ways to increase income stability, such as long-term contracts or fixed-rate agreements");
    }
    
    // For Benton County specifically - typical multipliers range from 2.5x to 5x annual income
    // depending on income stability, source quality, and local market conditions
    let suggestedMultiplier = 3.0; // Base multiplier
    
    // Adjust based on stability
    if (stabilityScore > 80) suggestedMultiplier += 0.5;
    if (stabilityScore < 60) suggestedMultiplier -= 0.5;
    
    // Adjust based on diversification
    if (diversificationScore > 70) suggestedMultiplier += 0.3;
    if (diversificationScore < 40) suggestedMultiplier -= 0.3;
    
    // Ensure multiplier is within reasonable range for Benton County
    suggestedMultiplier = Math.max(2.5, Math.min(5.0, suggestedMultiplier));
    
    const valuationAmount = totalAnnualIncome * suggestedMultiplier;
    const confidenceScore = Math.min(90, (stabilityScore + diversificationScore) / 2);
    
    // Create analysis result object
    const result: IncomeAnalysis = {
      analysis: {
        findings,
        recommendations,
        distribution,
        metrics: {
          averageMonthlyIncome: totalMonthlyIncome,
          totalAnnualIncome,
          diversificationScore,
          stabilityScore,
          growthPotential: diversificationScore * 0.7 + stabilityScore * 0.3,
          seasonalImpact: stabilityScore > 80 ? 'low' : stabilityScore > 60 ? 'medium' : 'high'
        }
      },
      suggestedValuation: {
        amount: valuationAmount.toFixed(2),
        multiplier: suggestedMultiplier.toFixed(2),
        considerations: [
          "Based on Benton County market conditions",
          "Considers income stability and diversification",
          "Assumes current income level remains consistent"
        ],
        rangeMin: (valuationAmount * 0.9).toFixed(2),
        rangeMax: (valuationAmount * 1.1).toFixed(2),
        confidenceScore
      }
    };
    
    // Include any validation errors
    if (errors.length > 0) {
      result.errors = errors;
      
      // Adjust confidence score based on errors
      result.suggestedValuation.confidenceScore = Math.max(
        10, 
        result.suggestedValuation.confidenceScore - (errors.length * 5)
      );
      
      // Add a finding about data quality
      result.analysis.findings.push(
        `Data quality issues were detected that may affect accuracy (${errors.length} issues found)`
      );
      
      // Add recommendation about data quality
      result.analysis.recommendations.push(
        "Review and correct income data to improve valuation accuracy"
      );
    }

    return result;
  }

  /**
   * Pre-processes valuation data to normalize values and handle edge cases
   * @param valuationHistory Raw valuation data to process
   * @returns Processed valuation data array and any validation errors
   */
  private preprocessValuationData(valuationHistory: Valuation[]): { processed: Valuation[], errors: string[] } {
    const processed: Valuation[] = [];
    const errors: string[] = [];
    
    // Process each valuation record
    for (let i = 0; i < valuationHistory.length; i++) {
      const valuation = { ...valuationHistory[i] };
      
      try {
        // Validate with Zod schema
        ValuationSchema.parse(valuation);
        
        // Add to processed array
        processed.push(valuation);
      } catch (error) {
        // If validation fails, record error
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `Field '${e.path.join('.')}': ${e.message}`).join('; ');
          errors.push(`Invalid valuation record (ID: ${valuation.id || 'unknown'}): ${errorDetails}`);
        } else {
          errors.push(`Error processing valuation record (ID: ${valuation.id || 'unknown'}): ${(error as Error).message}`);
        }
        
        // Still add to processed array if we can salvage it
        if (valuation.id && valuation.valuationAmount && parseFloat(valuation.valuationAmount) > 0) {
          // Ensure multiplier is present
          if (!valuation.multiplier || parseFloat(valuation.multiplier) <= 0) {
            valuation.multiplier = '3.0'; // Default Benton County multiplier
            errors.push(`Missing/invalid multiplier for valuation record ${valuation.id}, defaulting to 3.0`);
          }
          
          processed.push(valuation);
        }
      }
    }
    
    return { processed, errors };
  }

  /**
   * Detects anomalies in valuation history
   * @param valuationHistory Array of valuation records
   * @returns Detected anomalies and insights
   */
  async detectAnomalies(valuationHistory: Valuation[]): Promise<AnomalyDetection> {
    if (!valuationHistory || valuationHistory.length <= 1) {
      // Not enough data to detect anomalies
      return {
        anomalies: [],
        insights: ['Not enough valuation data to perform anomaly detection. At least two valuations are required.'],
        summary: 'Insufficient valuation history for anomaly detection'
      };
    }
    
    // Preprocess valuation data
    const { processed, errors } = this.preprocessValuationData(valuationHistory);
    
    // If not enough valid records, return early
    if (processed.length <= 1) {
      return {
        anomalies: [],
        insights: ['Not enough valid valuation data after validation. At least two valuations are required.'],
        summary: 'Insufficient valid valuation history for anomaly detection',
        errors
      };
    }

    // Sort by creation date ascending
    const sortedValuations = [...processed].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const anomalies = [];
    const insights = [];

    // Analyze valuation changes
    const valuationChanges = [];
    for (let i = 1; i < sortedValuations.length; i++) {
      const prev = sortedValuations[i - 1];
      const current = sortedValuations[i];
      
      const prevAmount = parseFloat(prev.valuationAmount);
      const currentAmount = parseFloat(current.valuationAmount);
      const prevMultiplier = parseFloat(prev.multiplier);
      const currentMultiplier = parseFloat(current.multiplier);
      
      const percentChange = ((currentAmount - prevAmount) / prevAmount) * 100;
      const multiplierChange = currentMultiplier - prevMultiplier;
      const monthsBetween = (
        new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime()
      ) / (1000 * 60 * 60 * 24 * 30); // Approximate months
      
      valuationChanges.push({
        from: prev.createdAt,
        to: current.createdAt,
        prevId: prev.id,
        currentId: current.id,
        percentChange,
        multiplierChange,
        monthsBetween,
        annualizedChange: percentChange / (monthsBetween / 12),
        isAnomaly: false
      });
    }

    // Detect anomalies in valuation changes
    for (const change of valuationChanges) {
      // Anomaly detection criteria
      const isLargeChange = Math.abs(change.percentChange) > 25;
      const isVeryLargeChange = Math.abs(change.percentChange) > 50;
      const isRapidChange = Math.abs(change.annualizedChange) > 40;
      const isMultiplierJump = Math.abs(change.multiplierChange) > 1;
      
      if (isVeryLargeChange || (isLargeChange && isRapidChange) || isMultiplierJump) {
        change.isAnomaly = true;
        
        let severity: 'high' | 'medium' | 'low';
        if (isVeryLargeChange || (isLargeChange && isRapidChange && isMultiplierJump)) {
          severity = 'high';
        } else if (isLargeChange && (isRapidChange || isMultiplierJump)) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
        
        anomalies.push({
          type: 'unusual_valuation_change',
          severity,
          description: `Unusual ${change.percentChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(change.percentChange).toFixed(2)}% over ${change.monthsBetween.toFixed(1)} months`,
          relatedValuationIds: [change.prevId, change.currentId],
          potentialCauses: [
            'Significant change in income composition',
            'Multiplier adjustment (from ' + sortedValuations[change.prevId - 1].multiplier + ' to ' + sortedValuations[change.currentId - 1].multiplier + ')',
            'Market condition changes in Benton County',
            'Potential data entry error'
          ],
          suggestedActions: [
            'Review income data for accuracy',
            'Validate multiplier selection',
            'Check for missing income sources'
          ]
        });
      }
    }

    // Generate insights
    if (anomalies.length === 0) {
      insights.push('Valuation history appears consistent with no significant anomalies detected.');
    } else {
      insights.push(`Detected ${anomalies.length} potential anomalies in valuation history.`);
      
      if (anomalies.some(a => a.severity === 'high')) {
        insights.push('Some high-severity anomalies were detected that require attention.');
      }
    }

    // Calculate valuation trend
    const firstValuation = sortedValuations[0];
    const lastValuation = sortedValuations[sortedValuations.length - 1];
    const totalPercentChange = (
      (parseFloat(lastValuation.valuationAmount) - parseFloat(firstValuation.valuationAmount)) / 
      parseFloat(firstValuation.valuationAmount)
    ) * 100;
    
    const monthsBetween = (
      new Date(lastValuation.createdAt).getTime() - new Date(firstValuation.createdAt).getTime()
    ) / (1000 * 60 * 60 * 24 * 30);
    
    const annualizedGrowth = totalPercentChange / (monthsBetween / 12);
    
    insights.push(`Overall valuation has ${totalPercentChange >= 0 ? 'grown' : 'declined'} by ${Math.abs(totalPercentChange).toFixed(2)}% over ${monthsBetween.toFixed(1)} months (${annualizedGrowth.toFixed(2)}% annualized).`);

    // Generate summary
    let summary;
    if (anomalies.length === 0) {
      summary = `Valuation history shows consistent growth of ${annualizedGrowth.toFixed(2)}% annually with no anomalies detected.`;
    } else {
      summary = `Detected ${anomalies.length} anomalies in valuation history. Overall trend shows ${totalPercentChange >= 0 ? 'positive' : 'negative'} growth of ${Math.abs(annualizedGrowth).toFixed(2)}% annually.`;
    }

    const result: AnomalyDetection = {
      anomalies,
      insights,
      summary
    };
    
    // Include any validation errors if present
    if (errors.length > 0) {
      result.errors = errors;
      
      // Add an insight about data quality
      result.insights.push(`${errors.length} data quality issues were detected that may affect anomaly detection accuracy.`);
    }
    
    return result;
  }

  /**
   * Helper method to find the most common income type
   * @param incomeBySource Record mapping income sources to arrays of income records
   * @returns The most common income source type
   */
  private getMostCommonIncomeType(incomeBySource: Record<string, Income[]>): string {
    let maxCount = 0;
    let mostCommonType = '';
    
    for (const [source, incomes] of Object.entries(incomeBySource)) {
      if (incomes.length > maxCount) {
        maxCount = incomes.length;
        mostCommonType = source;
      }
    }
    
    return mostCommonType;
  }
}