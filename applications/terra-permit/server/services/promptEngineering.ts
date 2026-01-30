/**
 * PromptEngineering service provides utilities for creating, managing, and optimizing prompts
 * for OpenAI API calls. This service helps create consistent, effective prompts across
 * different AI features in the application.
 */

import { Permit } from '@shared/schema';
import { log } from '../vite';

// Define a clear type for system messages
type SystemMessage = {
  role: 'system';
  content: string;
};

// Define types for user messages
type UserMessage = {
  role: 'user';
  content: string;
};

// Define types for assistant messages
type AssistantMessage = {
  role: 'assistant';
  content: string;
};

// Union type for all message types
export type Message = SystemMessage | UserMessage | AssistantMessage;

// Exported types for OpenAI API
export interface OpenAIRequestParams {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: { type: "json_object" } | { type: "text" };
}

/**
 * Class for generating and managing prompts
 */
export class PromptEngineering {
  private readonly DEFAULT_MODEL = 'gpt-4';

  // Define system prompts for different use cases
  private readonly SYSTEM_PROMPTS = {
    permitClassification: `You are an expert permit processor with deep knowledge of building codes and regulations.
Your task is to analyze permit descriptions and determine if they should be entered or skipped based on the following rules:
- Enter permits for new construction, major renovations, additions, or alterations that change the structure's footprint or purpose
- Skip permits for minor repairs, replacements, mechanical updates when they don't alter the structure significantly
- Consider both the permit description and property type when making decisions
Provide a brief, clear rationale for each decision focusing on the specific reasons from the description.`,

    permitExplanation: `You are a building permit specialist explaining decisions to a permit reviewer.
Explain the reasoning behind a specific permit decision in a clear, educational manner.
Reference relevant building codes or regulations when applicable.
Your explanation should be comprehensive but concise, focusing on the key factors that influenced the decision.
Include any special considerations or edge cases that affected this particular decision.`,

    batchSummary: `You are a data analyst specializing in building permit data.
Analyze the provided batch of permits and create a comprehensive summary with the following elements:
1. Key metrics about the processed permits
2. Insights about notable patterns or trends
3. Breakdown of permit categories and their distribution
4. Identification of any potential issues or anomalies in the data
5. Practical recommendations based on the data analysis
Your summary should be factual, insightful, and provide actionable information to permit managers.`,

    similaritySearch: `You are a data retrieval specialist helping find permits that match a specific query.
Analyze the semantic similarity between the provided query and each permit's description.
Consider key terms, context, and intended meaning rather than just keyword matching.
Rank permits by their relevance to the query, with higher scores indicating closer matches.
Provide brief explanations for why certain permits are considered similar to the query.`,

    questionAnswering: `You are a permit information specialist answering questions about building permits.
Provide accurate, factual responses based on the permit data and building code knowledge.
If the answer requires information not contained in the provided context, clearly state that limitation.
Keep answers focused specifically on the question asked.
When appropriate, reference specific permits from the context to illustrate your answer.
Always prioritize accuracy over speculation.`,

    consistencyReview: `You are a quality assurance specialist reviewing permit classification decisions.
Identify any potential inconsistencies or errors in the classification of permits.
Look for cases where similar permits received different decisions without clear justification.
Flag permits where the decision appears to contradict standard classification rules.
For each issue identified, provide a clear explanation and recommendation for resolution.
Focus on improving consistency and adherence to permit processing standards.`,

    historyAnalysis: `You are a permit tracking analyst examining the history of permit decisions.
Review the chronological sequence of permit updates and changes.
Identify patterns, trends, or anomalies in how permits have been processed over time.
Look for opportunities to improve efficiency or consistency based on historical data.
Provide insights about decision-making patterns and their implications.
Your analysis should help improve future permit processing workflows.`,
  };

  /**
   * Create a full prompt with system message and user input
   * @param promptType The type of prompt to use from predefined templates
   * @param userContent The user-specific content to include
   * @param additionalContext Optional additional context to include in system message
   */
  createPrompt(
    promptType: keyof typeof this.SYSTEM_PROMPTS,
    userContent: string,
    additionalContext?: string
  ): Message[] {
    let systemContent = this.SYSTEM_PROMPTS[promptType];
    
    if (additionalContext) {
      systemContent = `${systemContent}\n\nAdditional context: ${additionalContext}`;
    }
    
    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ];
  }

  /**
   * Create permit classification prompt
   * @param permits The permits to classify
   */
  createPermitClassificationPrompt(permits: Permit[]): Message[] {
    const permitsData = permits.map(permit => {
      return `Permit ID: ${permit.id}
Parcel Number: ${permit.parcelNumber}
Neighborhood Code: ${permit.neighborhoodCode}
Description: ${permit.permitDescription}
Value: ${permit.value}
Issue Date: ${permit.issueDate}
---`;
    }).join('\n\n');

    const userContent = `Please classify the following permits as ENTER or SKIP:
    
${permitsData}

For each permit, provide:
1. The decision (ENTER or SKIP)
2. A brief explanation of your reasoning

Return your analysis in a format that clearly labels each permit ID with its decision and rationale.`;

    return this.createPrompt('permitClassification', userContent);
  }

  /**
   * Create permit explanation prompt
   * @param permit The permit to explain
   */
  createPermitExplanationPrompt(permit: Permit): Message[] {
    const additionalContext = `This explanation is for a ${permit.enterPermit ? 'ENTERED' : 'SKIPPED'} permit.`;
    
    const userContent = `Please explain the decision to ${permit.enterPermit ? 'ENTER' : 'SKIP'} the following permit:
    
Permit ID: ${permit.id}
Parcel Number: ${permit.parcelNumber || 'N/A'}
Neighborhood Code: ${permit.neighborhoodCode || 'N/A'}
Description: ${permit.permitDescription || 'N/A'}
Value: ${permit.value || 'N/A'}
Issue Date: ${permit.issueDate || 'N/A'}
Decision: ${permit.enterPermit ? 'ENTER' : 'SKIP'}
Reason Provided: ${permit.reason || 'No reason provided'}

Provide a comprehensive explanation of why this decision was made, referencing specific details from the permit.`;

    return this.createPrompt('permitExplanation', userContent, additionalContext);
  }

  /**
   * Create batch summary prompt
   * @param permits The batch of permits to summarize
   */
  createBatchSummaryPrompt(permits: Permit[]): Message[] {
    // Prepare statistics for context
    const total = permits.length;
    const entered = permits.filter(p => p.enterPermit).length;
    const skipped = total - entered;
    
    // Sample a subset of permits for the prompt (to avoid token limits)
    const sampleSize = Math.min(20, permits.length);
    const sampledPermits = permits
      .sort(() => 0.5 - Math.random()) // Simple shuffle
      .slice(0, sampleSize);
    
    const permitSamples = sampledPermits.map(permit => {
      return `Permit ID: ${permit.id}
Parcel Number: ${permit.parcelNumber}
Neighborhood Code: ${permit.neighborhoodCode}
Description: ${permit.permitDescription}
Value: ${permit.value}
Issue Date: ${permit.issueDate}
Decision: ${permit.enterPermit ? 'ENTER' : 'SKIP'}
Reason: ${permit.reason}`;
    }).join('\n\n');
    
    const userContent = `Please analyze this batch of ${total} building permits (${entered} entered, ${skipped} skipped).

Here's a sample of ${sampleSize} permits from this batch:

${permitSamples}

Based on this representative sample, generate a comprehensive batch summary with:
1. Key metrics (total, entered, skipped counts and percentages)
2. Insights about patterns or trends you observe
3. A breakdown of permit categories and their distribution
4. Identification of any potential issues or anomalies 
5. Practical recommendations

Format your response as a structured analysis that could be presented to permit managers.`;

    return this.createPrompt('batchSummary', userContent);
  }

  /**
   * Create search similarity prompt
   * @param query The search query
   * @param permits The permits to search through
   */
  createSimilaritySearchPrompt(query: string, permits: Permit[]): Message[] {
    // Sample a subset of permits for the prompt (to avoid token limits)
    const sampleSize = Math.min(20, permits.length);
    const sampledPermits = permits
      .sort(() => 0.5 - Math.random()) // Simple shuffle
      .slice(0, sampleSize);
    
    const permitsList = sampledPermits.map(permit => {
      return `Permit ID: ${permit.id}
Description: ${permit.permitDescription}
Neighborhood Code: ${permit.neighborhoodCode}
Value: ${permit.value}`;
    }).join('\n\n');
    
    const userContent = `Find permits that are semantically similar to the following search query:

QUERY: "${query}"

PERMITS TO SEARCH:
${permitsList}

For each permit, provide a similarity score from 0 to 1, where 1 indicates an exact match and 0 indicates no similarity.
Then rank the permits by similarity and provide the top 5 most relevant permits with a brief explanation of why they match.`;

    return this.createPrompt('similaritySearch', userContent);
  }

  /**
   * Create question answering prompt
   * @param question The question to answer
   * @param relevantPermits Relevant permits to use as context
   */
  createQuestionAnsweringPrompt(question: string, relevantPermits?: Permit[]): Message[] {
    let permitContext = '';
    
    if (relevantPermits && relevantPermits.length > 0) {
      permitContext = relevantPermits.map(permit => {
        return `Permit ID: ${permit.id}
Parcel Number: ${permit.parcelNumber}
Neighborhood Code: ${permit.neighborhoodCode}
Description: ${permit.permitDescription}
Value: ${permit.value}
Issue Date: ${permit.issueDate}
Decision: ${permit.enterPermit ? 'ENTER' : 'SKIP'}
Reason: ${permit.reason}`;
      }).join('\n\n');
    }
    
    const additionalContext = permitContext 
      ? `Use the following permits as context for your answer:\n\n${permitContext}`
      : 'No specific permit examples are provided. Answer based on general permit knowledge.';
    
    const userContent = `Please answer the following question about building permits:

QUESTION: ${question}

Provide a clear, factual answer based on permit processing knowledge and the context provided.
If you cannot answer the question with the available information, please state that clearly.`;

    return this.createPrompt('questionAnswering', userContent, additionalContext);
  }

  /**
   * Create consistency review prompt
   * @param permits The permits to review for consistency
   */
  createConsistencyReviewPrompt(permits: Permit[]): Message[] {
    // Group similar permits by description keywords or patterns
    // This is a simplified approach - in a real system, you'd use more sophisticated grouping
    const permitGroups: Record<string, Permit[]> = {};
    
    permits.forEach(permit => {
      // Extract key terms from description (simplified)
      const keyTerms = (permit.permitDescription || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(term => term.length > 4);
      
      // Use first significant term as group key (simplified)
      const groupKey = keyTerms[0] || 'other';
      
      if (!permitGroups[groupKey]) {
        permitGroups[groupKey] = [];
      }
      
      permitGroups[groupKey].push(permit);
    });
    
    // Filter to groups with potential inconsistencies
    const potentialInconsistentGroups = Object.entries(permitGroups)
      .filter(([_key, groupPermits]) => {
        if (groupPermits.length < 2) return false;
        
        // Check if group has mixed decisions
        const hasEnter = groupPermits.some(p => p.enterPermit);
        const hasSkip = groupPermits.some(p => !p.enterPermit);
        
        return hasEnter && hasSkip;
      })
      .slice(0, 5); // Limit to 5 groups for token limit
    
    let inconsistencyExamples = '';
    
    if (potentialInconsistentGroups.length > 0) {
      inconsistencyExamples = potentialInconsistentGroups.map(([key, groupPermits]) => {
        const permitSamples = groupPermits.slice(0, 3).map(permit => {
          return `Permit ID: ${permit.id}
Description: ${permit.permitDescription}
Neighborhood Code: ${permit.neighborhoodCode}
Value: ${permit.value}
Decision: ${permit.enterPermit ? 'ENTER' : 'SKIP'}
Reason: ${permit.reason}`;
        }).join('\n\n');
        
        return `GROUP "${key}" (${groupPermits.length} permits):\n${permitSamples}`;
      }).join('\n\n---\n\n');
    }
    
    const userContent = `Review these building permits for classification consistency.
${permits.length} total permits were processed (${permits.filter(p => p.enterPermit).length} entered, ${permits.filter(p => !p.enterPermit).length} skipped).

${inconsistencyExamples ? `Here are some permit groups with potentially inconsistent decisions:\n\n${inconsistencyExamples}` : 'No specific inconsistency examples found.'}

Please analyze the permits for:
1. Potential classification errors where permits may have been incorrectly classified
2. Inconsistencies where similar permits received different decisions
3. An overall consistency score (0-100%)
4. Recommendations to improve classification consistency

Focus on practical insights that would help improve the permit classification process.`;

    return this.createPrompt('consistencyReview', userContent);
  }

  /**
   * Create history analysis prompt
   * @param permits The permits with history to analyze
   * @param histories The history records for the permits
   */
  createHistoryAnalysisPrompt(
    permits: Permit[],
    histories: Array<{ permitId: number; action: string; detail: any; createdAt: string }>
  ): Message[] {
    // Group histories by permit
    const permitHistories: Record<number, any[]> = {};
    
    histories.forEach(history => {
      if (!permitHistories[history.permitId]) {
        permitHistories[history.permitId] = [];
      }
      
      permitHistories[history.permitId].push({
        action: history.action,
        detail: history.detail,
        createdAt: history.createdAt
      });
    });
    
    // Create a sample of permits with their histories
    const sampleSize = Math.min(5, permits.length);
    const sampledPermits = permits
      .filter(p => permitHistories[p.id] && permitHistories[p.id].length > 0)
      .sort(() => 0.5 - Math.random()) // Simple shuffle
      .slice(0, sampleSize);
    
    const permitHistorySamples = sampledPermits.map(permit => {
      const histories = permitHistories[permit.id] || [];
      
      const historyText = histories
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(h => {
          return `Action: ${h.action}
Timestamp: ${h.createdAt}
Detail: ${h.detail.description || 'No description'}`;
        })
        .join('\n\n');
      
      return `PERMIT ID: ${permit.id}
Description: ${permit.permitDescription}
Current Decision: ${permit.enterPermit ? 'ENTER' : 'SKIP'}

HISTORY:
${historyText}`;
    }).join('\n\n---\n\n');
    
    const userContent = `Analyze the history of these ${permits.length} building permits.
These permits have undergone a total of ${histories.length} changes or reviews.

Here's a sample of ${sampleSize} permits with their complete history:

${permitHistorySamples}

Please analyze this permit history data to identify:
1. Patterns in how permits are processed over time
2. Any anomalies or unusual patterns in the permit processing workflow
3. Recommendations for optimizing the permit review process
4. Risk factors or issues revealed by the historical data
5. A summary of key findings

Focus on practical insights that would help improve the permit processing system.`;

    return this.createPrompt('historyAnalysis', userContent);
  }

  /**
   * Create OpenAI API request parameters
   * @param messages The messages to include in the request
   * @param model The model to use (defaults to DEFAULT_MODEL)
   * @param options Additional options for the request
   */
  createOpenAIRequestParams(
    messages: Message[],
    model: string = this.DEFAULT_MODEL,
    options: Partial<Omit<OpenAIRequestParams, 'model' | 'messages'>> = {}
  ): OpenAIRequestParams {
    const { 
      temperature = 0.7,
      max_tokens = 1500,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0
    } = options;
    
    return {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty
    };
  }

  /**
   * Validate that the OpenAI API key is properly configured
   * @returns True if the key is configured, false otherwise
   */
  validateApiKey(): boolean {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      log('OpenAI API key is not configured', 'promptEngineering');
      return false;
    }
    return true;
  }
}

export const promptEngineering = new PromptEngineering();