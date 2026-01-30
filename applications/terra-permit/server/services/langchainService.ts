/**
 * LangChain integration service
 * This service provides advanced AI capabilities using LangChain for:
 * - Sophisticated chain workflows
 * - Agent-based processing
 * - Context-aware conversation management
 * - Advanced permit processing logic
 */

import { ChatOpenAI } from "@langchain/openai";
import { 
  PromptTemplate, 
  ChatPromptTemplate, 
  MessagesPlaceholder 
} from "@langchain/core/prompts";
import { 
  StringOutputParser, 
  StructuredOutputParser 
} from "@langchain/core/output_parsers";
import { 
  RunnableSequence, 
  RunnablePassthrough 
} from "@langchain/core/runnables";
import { z } from 'zod';
import { log } from '../vite';
import { Permit } from '../../shared/schema';

/**
 * Helper function to validate OpenAI API key before making calls
 * @returns True if API key is valid, otherwise throws an error
 */
async function validateApiKey(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  return true;
}

/**
 * LangChainService provides advanced AI capabilities using the LangChain framework
 */
export class LangChainService {
  private readonly defaultModel = 'gpt-4';
  private permitAnalysisModel: ChatOpenAI = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.2,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  private permitClassificationChain: any = null;
  private permitExplanationChain: any = null;
  private permitConsistencyChain: any = null;

  constructor() {
    try {
      this.permitAnalysisModel = new ChatOpenAI({
        modelName: this.defaultModel,
        temperature: 0.2,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      // Initialize chains
      this.initializeChains();
    } catch (error) {
      log(`Error initializing LangChain service: ${(error as Error).message}`, 'langchainService');
    }
  }

  /**
   * Initialize all LangChain processing chains
   */
  private initializeChains(): void {
    this.initializePermitClassificationChain();
    this.initializePermitExplanationChain();
    this.initializePermitConsistencyChain();
  }

  /**
   * Initialize a chain for advanced permit classification
   */
  private initializePermitClassificationChain(): void {
    // Parser to ensure consistent output format
    const classificationOutputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        enterPermit: z.boolean().describe('Whether the permit should be entered or skipped'),
        reason: z.string().describe('Detailed reasoning for the classification decision'),
        confidence: z.number().min(0).max(1).describe('Confidence score for this classification (0-1)'),
        relevantFactors: z.array(z.string()).describe('The key factors that influenced this decision'),
        alternativeInterpretation: z.string().optional().describe('An alternative interpretation if confidence is low')
      })
    );

    // Define the classification prompt
    const classificationPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert permit classifier who evaluates permit applications with exceptional attention to detail.
Your task is to determine whether a permit should be ENTERED or SKIPPED based on sophisticated criteria.

RULES:
- Residential permits containing keywords like "hvac", "re-roof", "heat pump", "fence", "water heater", "mini split", or "like for like" should typically be SKIPPED.
- Permits in neighborhood codes starting with "6" are considered commercial, not residential.
- Commercial permits are generally more important and should be ENTERED.
- The 'value' field measures monetary significance, with higher values indicating higher importance.
- Permits that are vague or difficult to classify should include detailed reasoning.

Analyze each permit holistically, considering:
- Neighborhood context and zoning
- Permit description details
- Monetary value and scope
- Historical patterns (if provided)

${classificationOutputParser.getFormatInstructions()}`],
      ["human", `Please classify the following permit application:
{permit_input}

Think through this decision step by step.`],
    ]);

    // Build the chain
    this.permitClassificationChain = RunnableSequence.from([
      {
        permit_input: (input: any) => 
          `Parcel: ${input.parcelNumber}
          Neighborhood: ${input.neighborhoodCode}
          Description: ${input.permitDescription}
          Value: ${input.value}
          Issue Date: ${input.issueDate}`
      },
      classificationPrompt,
      this.permitAnalysisModel,
      new StringOutputParser(),
      classificationOutputParser,
    ]);
  }

  /**
   * Initialize a chain for detailed permit explanation
   */
  private initializePermitExplanationChain(): void {
    // Parser for consistent explanation output
    const explanationOutputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        explanation: z.string().describe('Detailed explanation for why this permit was classified as it was'),
        keyPoints: z.array(z.string()).describe('Key points that led to this decision'),
        relevantRegulations: z.array(z.string()).describe('Relevant building codes or regulations that apply'),
        suggestedActions: z.array(z.string()).optional().describe('Suggested actions or next steps'),
        similarCases: z.array(z.object({
          description: z.string(),
          outcome: z.string()
        })).optional().describe('Similar historical cases for reference')
      })
    );

    // Define the explanation prompt
    const explanationPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert permit analyst who provides detailed, contextual explanations of permit classification decisions.
Your task is to explain WHY a permit was classified as entered or skipped, providing rich context and regulatory background.

Include in your analysis:
- Detailed reasoning connecting the permit characteristics to the decision
- Relevant building codes, regulations, or local ordinances that apply
- Common scenarios where similar permits are processed similarly
- Considerations that might have led to the opposite decision
- Historical context about similar permits when relevant

${explanationOutputParser.getFormatInstructions()}`],
      ["human", `Please provide a detailed explanation for the following permit:

Parcel Number: {parcelNumber}
Neighborhood Code: {neighborhoodCode}
Description: {permitDescription}
Value: {value}
Issue Date: {issueDate}
Decision: {decision} (Reason: {reason})

I need a comprehensive explanation of why this decision was appropriate.`],
    ]);

    // Build the chain
    this.permitExplanationChain = explanationPrompt
      .pipe(this.permitAnalysisModel)
      .pipe(new StringOutputParser())
      .pipe(explanationOutputParser);
  }

  /**
   * Initialize a chain for assessing permit classification consistency
   */
  private initializePermitConsistencyChain(): void {
    // Parser for consistency review output
    const consistencyOutputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        consistencyScore: z.number().min(0).max(1).describe('Overall consistency score (0-1)'),
        potentialErrors: z.array(z.object({
          permitId: z.number(),
          issue: z.string().describe('Description of the potential error'),
          recommendation: z.string().describe('Recommended action to resolve the issue')
        })).describe('Potential classification errors detected'),
        inconsistencies: z.array(z.object({
          conflictingPermits: z.array(z.number()),
          description: z.string().describe('Description of the inconsistency'),
          resolution: z.string().describe('Suggested resolution')
        })).describe('Inconsistencies between similar permits'),
        recommendations: z.array(z.string()).describe('Overall recommendations for improving consistency')
      })
    );

    // Define the consistency prompt
    const consistencyPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert permit consistency auditor who analyzes batches of permit classifications to identify inconsistencies.
Your task is to thoroughly review a set of classified permits and identify any potential errors or inconsistencies in how they were processed.

Look for patterns such as:
- Similar permits with different classifications
- Unusual or outlier decisions that don't match typical patterns
- Permits that may have been misclassified based on established rules
- Conflicts with historical decision patterns

Provide a structured analysis with specific examples of inconsistencies, and recommend concrete solutions.

${consistencyOutputParser.getFormatInstructions()}`],
      ["human", `Please review the following set of classified permits for consistency:

{permits_json}

Analyze the classifications for errors and inconsistencies.`],
    ]);

    // Build the chain
    this.permitConsistencyChain = consistencyPrompt
      .pipe(this.permitAnalysisModel)
      .pipe(new StringOutputParser())
      .pipe(consistencyOutputParser);
  }

  /**
   * Perform advanced LangChain-powered permit classification
   * @param permit The permit to classify
   * @returns Enhanced classification with confidence and reasoning
   */
  async classifyPermit(permit: Permit): Promise<any> {
    try {
      await validateApiKey();
      const result = await this.permitClassificationChain.invoke(permit);
      return result;
    } catch (error) {
      log(`Error in LangChain permit classification: ${(error as Error).message}`, 'langchainService');
      throw error;
    }
  }

  /**
   * Perform batch classification of permits using LangChain
   * @param permits Array of permits to classify
   * @returns Classified permits with enhanced reasoning
   */
  async classifyPermits(permits: Permit[]): Promise<any[]> {
    try {
      await validateApiKey();
      
      // Process permits in parallel with a concurrency limit
      const classificationPromises = permits.map(permit => 
        this.classifyPermit(permit)
          .catch(error => {
            log(`Error classifying permit ${permit.id}: ${error.message}`, 'langchainService');
            // Return a default classification with error information
            return {
              enterPermit: false,
              reason: `Error during classification: ${error.message}`,
              confidence: 0,
              relevantFactors: ['Error occurred during processing']
            };
          })
      );
      
      return await Promise.all(classificationPromises);
    } catch (error) {
      log(`Error in LangChain batch permit classification: ${(error as Error).message}`, 'langchainService');
      throw error;
    }
  }

  /**
   * Generate a detailed explanation for a permit decision
   * @param permit The permit to explain
   * @returns Enhanced explanation with regulatory context
   */
  async explainPermitDecision(permit: Permit): Promise<any> {
    try {
      await validateApiKey();
      
      const permitWithDecision = {
        ...permit,
        decision: permit.enterPermit ? 'ENTERED' : 'SKIPPED'
      };
      
      const result = await this.permitExplanationChain.invoke(permitWithDecision);
      return result;
    } catch (error) {
      log(`Error in LangChain permit explanation: ${(error as Error).message}`, 'langchainService');
      throw error;
    }
  }

  /**
   * Review classification consistency across a batch of permits
   * @param permits Array of permits to analyze for consistency
   * @returns Consistency analysis with identified issues
   */
  async reviewClassificationConsistency(permits: Permit[]): Promise<any> {
    try {
      await validateApiKey();
      
      // Convert permits to a string format for the prompt
      const permitsJson = JSON.stringify(permits.map(p => ({
        id: p.id,
        parcelNumber: p.parcelNumber,
        neighborhoodCode: p.neighborhoodCode,
        permitDescription: p.permitDescription,
        value: p.value,
        enterPermit: p.enterPermit,
        reason: p.reason
      })));
      
      const result = await this.permitConsistencyChain.invoke({ permits_json: permitsJson });
      return result;
    } catch (error) {
      log(`Error in LangChain consistency review: ${(error as Error).message}`, 'langchainService');
      throw error;
    }
  }
}

export const langchainService = new LangChainService();