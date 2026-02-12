import { log } from '../vite';
import { Permit, InsertPermit, PermitHistory, ActionType } from '../../shared/schema';
import { openaiService } from './openaiService';
import { promptEngineering, OpenAIRequestParams } from './promptEngineering';

/**
 * Helper function to validate OpenAI API key before making calls
 * @returns True if API key is valid, otherwise throws an error
 */
async function validateApiKey(): Promise<boolean> {
  const isValid = await openaiService.checkApiKey();
  if (!isValid) {
    throw new Error('OpenAI API key is not configured or invalid. Please set the OPENAI_API_KEY environment variable.');
  }
  return true;
};

/**
 * ContextualAIService provides enhanced AI capabilities with context awareness
 * It builds on top of the basic AIService but adds:
 * - History-based permit processing
 * - Context-aware decision making
 * - Batch processing optimization
 * - Advanced analytics capabilities
 */
export class ContextualAIService {
  private systemContext: string;
  
  constructor() {
    this.systemContext = `You are an advanced AI permit processing assistant. 
    You have expertise in construction permits, building codes, and urban planning.
    You analyze permit data to make informed decisions about which permits require 
    manual entry/review and which can be automatically processed.
    
    You consider multiple factors including:
    - Permit type and description
    - Property type (commercial vs residential)
    - Historical decisions on similar permits
    - Neighborhood characteristics
    - Monetary value and scope
    - Regulatory requirements
    
    You provide clear explanations for your decisions and identify patterns or trends.`;
  }
  
  /**
   * Analyze permit history to detect patterns, anomalies, and provide insights
   * @param permits - Array of permits with their history
   * @returns Analysis insights and recommendations
   */
  async analyzePermitHistory(
    permits: Permit[], 
    history: PermitHistory[]
  ): Promise<PermitHistoryAnalysis> {
    try {
      // Prepare data for AI analysis
      const historyByPermit = history.reduce((acc, item) => {
        if (!acc[item.permitId]) {
          acc[item.permitId] = [];
        }
        acc[item.permitId].push(item);
        return acc;
      }, {} as Record<number, PermitHistory[]>);
      
      // Select representative sample to avoid token limits
      const samplePermits = permits.slice(0, 10).map(permit => {
        return {
          id: permit.id,
          parcelNumber: permit.parcelNumber,
          neighborhoodCode: permit.neighborhoodCode,
          permitDescription: permit.permitDescription,
          value: permit.value,
          issueDate: permit.issueDate,
          enterPermit: permit.enterPermit,
          reason: permit.reason,
          history: historyByPermit[permit.id] || []
        };
      });
      
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Define system and user prompts
      const systemPrompt = this.systemContext;
      
      const userPrompt = `Analyze this permit history data and provide insights:
      ${JSON.stringify(samplePermits, null, 2)}
      
      I need to understand:
      1. What patterns or trends do you observe in these permits and their processing history?
      2. Are there any anomalies or unusual cases that stand out?
      3. What recommendations would you make to improve the permit processing workflow?
      4. Are there potential optimization opportunities in our classification logic?
      5. Identify any risk factors or compliance concerns in these permits.
      
      Format your response as JSON with these fields:
      - patterns: array of identified patterns
      - anomalies: array of anomalous permits or cases
      - recommendations: array of specific recommendations
      - optimizationOpportunities: array of optimization suggestions
      - riskFactors: array of potential risks or compliance issues
      - summary: overall analysis summary`;
      
      // Use promptEngineering and openaiService for API call
      const params = promptEngineering.createOpenAIRequestParams(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        'gpt-4o',
        { temperature: 0.7 }
      );
      
      // Add response_format for JSON
      const openAIParams: OpenAIRequestParams = {
        ...params,
        response_format: { type: "json_object" }
      };
      
      const analysisContent = await openaiService.createChatCompletion(openAIParams);
      const analysis = JSON.parse(analysisContent || "{}");
      
      // Return structured analysis
      return {
        patterns: analysis.patterns || [],
        anomalies: analysis.anomalies || [],
        recommendations: analysis.recommendations || [],
        optimizationOpportunities: analysis.optimizationOpportunities || [],
        riskFactors: analysis.riskFactors || [],
        summary: analysis.summary || "Analysis complete"
      };
    } catch (error: any) {
      log(`AI permit history analysis error: ${error.message}`, 'contextualAiService');
      return {
        patterns: [],
        anomalies: [],
        recommendations: [`Analysis failed: ${error.message}`],
        optimizationOpportunities: [],
        riskFactors: [],
        summary: "Failed to analyze permit history with AI"
      };
    }
  }
  
  /**
   * Generate an intelligent summary for permit batches with context awareness
   * @param permits - Array of processed permits
   * @returns Contextual summary with insights and potential issues
   */
  async generateBatchSummary(permits: Permit[]): Promise<BatchSummary> {
    try {
      // Basic statistics calculation
      const totalCount = permits.length;
      const enteredCount = permits.filter(p => p.enterPermit).length;
      const skippedCount = totalCount - enteredCount;
      
      const enteredPercentage = totalCount > 0 ? Math.round((enteredCount / totalCount) * 100) : 0;
      const skippedPercentage = totalCount > 0 ? Math.round((skippedCount / totalCount) * 100) : 0;
      
      // Only analyze if there are enough permits to be meaningful
      if (totalCount < 3) {
        return {
          metrics: {
            totalCount,
            enteredCount,
            skippedCount,
            enteredPercentage,
            skippedPercentage
          },
          insights: ["Not enough permits for meaningful analysis"],
          categories: {},
          potentialIssues: [],
          recommendations: []
        };
      }
      
      // Sample permits for analysis (to stay within token limits)
      const sampleSize = Math.min(totalCount, 20);
      const samplePermits = permits.slice(0, sampleSize);
      
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Define system and user prompts
      const systemPrompt = this.systemContext;
      
      const userPrompt = `Analyze this batch of ${totalCount} permits and generate a smart summary.
      Here's a sample of ${sampleSize} permits from the batch:
      ${JSON.stringify(samplePermits, null, 2)}
      
      I need:
      1. Key insights about this batch (unusual patterns, notable characteristics)
      2. Categories/types of permits found with counts and percentages
      3. Potential data quality or processing issues to address
      4. Recommendations for handling this batch
      
      Format your response as JSON with these fields:
      - insights: array of key insights about the batch
      - categories: object with permit categories and their counts
      - potentialIssues: array of potential issues to address
      - recommendations: array of actionable recommendations`;
      
      // Use promptEngineering and openaiService for API call
      const params = promptEngineering.createOpenAIRequestParams(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        'gpt-4o',
        { temperature: 0.6 }
      );
      
      // Add response_format for JSON
      const openAIParams: OpenAIRequestParams = {
        ...params,
        response_format: { type: "json_object" }
      };
      
      const summaryContent = await openaiService.createChatCompletion(openAIParams);
      const summary = JSON.parse(summaryContent || "{}");
      
      // Return structured batch summary
      return {
        metrics: {
          totalCount,
          enteredCount,
          skippedCount,
          enteredPercentage,
          skippedPercentage
        },
        insights: summary.insights || [],
        categories: summary.categories || {},
        potentialIssues: summary.potentialIssues || [],
        recommendations: summary.recommendations || []
      };
    } catch (error: any) {
      log(`AI batch summary generation error: ${error.message}`, 'contextualAiService');
      return {
        metrics: {
          totalCount: permits.length,
          enteredCount: permits.filter(p => p.enterPermit).length,
          skippedCount: permits.length - permits.filter(p => p.enterPermit).length,
          enteredPercentage: permits.length > 0 ? Math.round((permits.filter(p => p.enterPermit).length / permits.length) * 100) : 0,
          skippedPercentage: permits.length > 0 ? Math.round(((permits.length - permits.filter(p => p.enterPermit).length) / permits.length) * 100) : 0
        },
        insights: [`Summary generation failed: ${error.message}`],
        categories: {},
        potentialIssues: [],
        recommendations: []
      };
    }
  }
  
  /**
   * Perform advanced contextual permit classification using historical data
   * and neighborhood context
   * @param permits - Permits to classify
   * @param neighborhoodData - Optional contextual data about neighborhoods
   * @param historicalDecisions - Optional historical classification decisions
   * @returns Classified permits with reasons
   */
  async contextualPermitClassification(
    permits: InsertPermit[],
    neighborhoodData?: Record<string, NeighborhoodContext>,
    historicalDecisions?: Record<string, HistoricalDecision[]>
  ): Promise<InsertPermit[]> {
    try {
      // Process in batches to optimize token usage
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < permits.length; i += batchSize) {
        batches.push(permits.slice(i, i + batchSize));
      }
      
      // Process each batch with context
      const processedBatches = await Promise.all(batches.map(batch => 
        this.processPermitBatchWithContext(batch, neighborhoodData, historicalDecisions)
      ));
      
      // Combine results
      return processedBatches.flat();
    } catch (error: any) {
      log(`Contextual permit classification error: ${error.message}`, 'contextualAiService');
      return permits; // Return original permits on error
    }
  }
  
  /**
   * Process a batch of permits with contextual awareness
   */
  private async processPermitBatchWithContext(
    permits: InsertPermit[],
    neighborhoodData?: Record<string, NeighborhoodContext>,
    historicalDecisions?: Record<string, HistoricalDecision[]>
  ): Promise<InsertPermit[]> {
    // Extract unique neighborhood codes to provide context
    const uniqueCodeMap: Record<string, boolean> = {};
    const neighborhoodCodes: string[] = [];
    
    permits.forEach(p => {
      if (p.neighborhoodCode && !uniqueCodeMap[p.neighborhoodCode]) {
        uniqueCodeMap[p.neighborhoodCode] = true;
        neighborhoodCodes.push(p.neighborhoodCode);
      }
    });
    
    // Build context information
    const context: Record<string, any> = {
      neighborhoods: {}
    };
    
    // Add neighborhood context if available
    if (neighborhoodData) {
      neighborhoodCodes.forEach(code => {
        if (neighborhoodData[code]) {
          context.neighborhoods[code] = neighborhoodData[code];
        }
      });
    }
    
    // Add historical decisions if available
    if (historicalDecisions) {
      context.historicalDecisions = {};
      permits.forEach(permit => {
        if (permit.permitDescription) {
          // Look for similar permits based on description
          const keyTerms = this.extractKeyTerms(permit.permitDescription);
          keyTerms.forEach(term => {
            if (historicalDecisions && historicalDecisions[term]) {
              if (!context.historicalDecisions[term]) {
                context.historicalDecisions[term] = [];
              }
              // Add unique historical decisions
              historicalDecisions[term].forEach(decision => {
                if (!context.historicalDecisions[term].find((d: any) => d.id === decision.id)) {
                  context.historicalDecisions[term].push(decision);
                }
              });
            }
          });
        }
      });
    }
    
    // Prepare permit data for classification
    const permitData = permits.map(p => ({
      id: p.parcelNumber, // Using parcel number as ID for correlation
      parcelNumber: p.parcelNumber,
      neighborhoodCode: p.neighborhoodCode,
      permitDescription: p.permitDescription,
      value: p.value,
      issueDate: p.issueDate
    }));
    
    // Validate OpenAI API key before making the call
    await validateApiKey();
    
    // Define system and user prompts
    const systemPrompt = `${this.systemContext}
    
    Classification rules:
    1. Commercial permits should generally be entered (enterPermit=true)
    2. Residential permits for minor work like HVAC, re-roof should be skipped (enterPermit=false)
    3. New construction and significant additions should be entered
    4. High-value residential permits should be entered
    5. Consider neighborhood characteristics and historical decisions
    6. When uncertain, prioritize entering the permit for manual review`;
    
    const userPrompt = `Classify these permits with context awareness:
    
    Permits:
    ${JSON.stringify(permitData, null, 2)}
    
    Context:
    ${JSON.stringify(context, null, 2)}
    
    For each permit, provide:
    - id (parcel number)
    - enterPermit (boolean)
    - reason (detailed explanation)
    - confidence (0-1 score)
    
    Format as JSON array of objects.`;
    
    // Use promptEngineering and openaiService for API call
    const params = promptEngineering.createOpenAIRequestParams(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      'gpt-4o',
      { temperature: 0.4 }
    );
    
    // Add response_format for JSON
    const openAIParams: OpenAIRequestParams = {
      ...params,
      response_format: { type: "json_object" }
    };
    
    const responseContent = await openaiService.createChatCompletion(openAIParams);
    const parsedContent = JSON.parse(responseContent || "{}");
    const decisions = parsedContent.permits || [];
    
    // Merge AI decisions with original permits
    return permits.map(permit => {
      const decision = decisions.find((d: any) => d.id === permit.parcelNumber);
      if (decision) {
        return {
          ...permit,
          enterPermit: decision.enterPermit,
          reason: decision.reason,
          confidence: decision.confidence
        };
      }
      return permit;
    });
  }
  
  /**
   * Extract key terms from permit description for historical matching
   */
  private extractKeyTerms(description: string): string[] {
    if (!description) return [];
    
    // Simple extraction of key terms
    const normalized = description.toLowerCase();
    const terms = [
      'commercial', 'residential', 'new', 'construction', 
      'addition', 'renovation', 'repair', 'roof', 'hvac', 
      'plumbing', 'electrical', 'demolition', 'pool'
    ];
    
    return terms.filter(term => normalized.includes(term));
  }
  
  /**
   * Generate natural language explanation for permit decisions 
   * to help users understand the reasoning
   * @param permit - The permit to explain
   * @returns Detailed explanation of the decision
   */
  async explainPermitDecision(permit: Permit): Promise<string> {
    try {
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Define system and user prompts
      const systemPrompt = `${this.systemContext}
      
      You're explaining permit processing decisions in clear, simple language 
      that a non-technical person can understand. Focus on being concise yet informative.`;
      
      const userPrompt = `Explain why this permit was ${permit.enterPermit ? 'entered' : 'skipped'} in simple terms:
      
      Permit details:
      ${JSON.stringify(permit, null, 2)}
      
      The system's reason was: "${permit.reason}"
      
      Please provide a more detailed, user-friendly explanation of this decision 
      in 2-3 sentences. Use plain language and avoid technical jargon.`;
      
      // Use promptEngineering and openaiService for API call
      const params = promptEngineering.createOpenAIRequestParams(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        'gpt-4o',
        { temperature: 0.7 }
      );
      
      const explanation = await openaiService.createChatCompletion(params);
      
      return explanation || 
        `This permit was ${permit.enterPermit ? 'entered' : 'skipped'} because ${permit.reason}.`;
    } catch (error: any) {
      log(`AI explanation generation error: ${error.message}`, 'contextualAiService');
      return `This permit was ${permit.enterPermit ? 'entered' : 'skipped'} based on standard processing rules.`;
    }
  }
  
  /**
   * Analyze multiple permit decisions to identify potential errors or inconsistencies
   * @param permits - Array of classified permits to review
   * @returns Analysis of potential classification errors or inconsistencies
   */
  async reviewClassificationConsistency(permits: Permit[]): Promise<ConsistencyReview> {
    try {
      // Sample permits for analysis (to stay within token limits)
      const sampleSize = Math.min(permits.length, 30);
      const samplePermits = permits.slice(0, sampleSize);
      
      // Validate OpenAI API key before making the call
      await validateApiKey();
      
      // Define system and user prompts
      const systemPrompt = `${this.systemContext}
      
      You're auditing permit classification decisions for consistency and correctness.
      Look for permits that may have been classified incorrectly or inconsistently.
      Focus on identifying patterns of potential errors or decisions that contradict each other.`;
      
      const userPrompt = `Review these ${sampleSize} permit classifications for consistency and potential errors:
      ${JSON.stringify(samplePermits, null, 2)}
      
      Please identify:
      1. Any permits that may have been classified incorrectly
      2. Inconsistencies in classification (similar permits with different decisions)
      3. Overall consistency score (0-100%)
      4. Recommendations for improving consistency
      
      Format your response as JSON with these fields:
      - potentialErrors: array of permits that may be misclassified (include ID and reason)
      - inconsistencies: array of inconsistency groups (each containing similar permits with different decisions)
      - consistencyScore: numerical score from 0-100
      - recommendations: array of specific recommendations to improve consistency`;
      
      // Use promptEngineering and openaiService for API call
      const params = promptEngineering.createOpenAIRequestParams(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        'gpt-4o',
        { temperature: 0.5 }
      );
      
      // Add response_format for JSON
      const openAIParams: OpenAIRequestParams = {
        ...params,
        response_format: { type: "json_object" }
      };
      
      const reviewContent = await openaiService.createChatCompletion(openAIParams);
      const review = JSON.parse(reviewContent || "{}");
      
      return {
        potentialErrors: review.potentialErrors || [],
        inconsistencies: review.inconsistencies || [],
        consistencyScore: review.consistencyScore || 0,
        recommendations: review.recommendations || []
      };
    } catch (error: any) {
      log(`AI consistency review error: ${error.message}`, 'contextualAiService');
      return {
        potentialErrors: [],
        inconsistencies: [],
        consistencyScore: 0,
        recommendations: [`Analysis failed: ${error.message}`]
      };
    }
  }
}

/**
 * Interface for neighborhood context
 */
export interface NeighborhoodContext {
  type: 'residential' | 'commercial' | 'industrial' | 'mixed';
  zoning: string;
  characteristics: string[];
  typicalPermitTypes: string[];
}

/**
 * Interface for historical decisions
 */
export interface HistoricalDecision {
  id: string;
  description: string;
  decision: boolean;
  reason: string;
  date: string;
}

/**
 * Interface for permit history analysis results
 */
export interface PermitHistoryAnalysis {
  patterns: string[];
  anomalies: string[];
  recommendations: string[];
  optimizationOpportunities: string[];
  riskFactors: string[];
  summary: string;
}

/**
 * Interface for batch summary
 */
export interface BatchSummary {
  metrics: {
    totalCount: number;
    enteredCount: number;
    skippedCount: number;
    enteredPercentage: number;
    skippedPercentage: number;
  };
  insights: string[];
  categories: Record<string, number>;
  potentialIssues: string[];
  recommendations: string[];
}

/**
 * Interface for consistency review
 */
export interface ConsistencyReview {
  potentialErrors: any[];
  inconsistencies: any[];
  consistencyScore: number;
  recommendations: string[];
}

// Singleton instance
export const contextualAiService = new ContextualAIService();