/**
 * LangChain Agent Service
 * This service implements advanced agent-based workflows using LangChain
 * for complex permit processing, reasoning, and decision-making tasks.
 */

import { ChatOpenAI } from "@langchain/openai";
import { 
  AgentExecutor,
  createOpenAIFunctionsAgent
} from "langchain/agents";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
  HumanMessagePromptTemplate
} from "@langchain/core/prompts";
import { DynamicTool } from "@langchain/core/tools";
import { RunnableSequence } from "@langchain/core/runnables";
import { log } from '../vite';
import { Permit } from '../../shared/schema';
import { storage } from '../storage';

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
 * LangChainAgentService provides agent-based AI capabilities
 * that can intelligently chain together multiple tasks and reasoning steps
 */
export class LangChainAgentService {
  private readonly defaultModel = 'gpt-4';
  private permitModel: ChatOpenAI = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.2,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  private permitAgent: AgentExecutor | null = null;

  constructor() {
    try {
      this.permitModel = new ChatOpenAI({
        modelName: this.defaultModel,
        temperature: 0.2,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      // Initialize the agent
      this.initializePermitAgent();
    } catch (error) {
      log(`Error initializing LangChain agent service: ${(error as Error).message}`, 'langchainAgentService');
    }
  }

  /**
   * Initialize the permit processing agent with necessary tools
   */
  private async initializePermitAgent(): Promise<void> {
    try {
      // Define tools the agent can use
      const tools = [
        // Tool to get permit data by ID
        new DynamicTool({
          name: "get_permit_by_id",
          description: "Get a permit's details by its ID",
          func: async (permitId: string) => {
            try {
              const id = parseInt(permitId.trim());
              if (isNaN(id)) {
                return "Invalid permit ID. Please provide a valid number.";
              }
              
              const permit = await storage.getPermit(id);
              if (!permit) {
                return "Permit not found with the provided ID.";
              }
              
              return JSON.stringify(permit);
            } catch (error) {
              return `Error retrieving permit: ${(error as Error).message}`;
            }
          }
        }),
        
        // Tool to search permits by description
        new DynamicTool({
          name: "search_permits_by_description",
          description: "Search for permits containing specific terms in their description",
          func: async (query: string) => {
            try {
              // Get all permits (in a real system, this would use a proper search index)
              const uploads = await storage.getAllUploads();
              let allPermits: Permit[] = [];
              
              for (const upload of uploads) {
                const permits = await storage.getPermitsByUploadId(upload.id);
                allPermits = [...allPermits, ...permits];
              }
              
              // Simple search implementation
              const matchingPermits = allPermits.filter(permit => 
                permit.permitDescription?.toLowerCase().includes(query.toLowerCase()) || false
              ).slice(0, 5); // Limit to 5 results
              
              if (matchingPermits.length === 0) {
                return "No permits found matching your query.";
              }
              
              return JSON.stringify(matchingPermits);
            } catch (error) {
              return `Error searching permits: ${(error as Error).message}`;
            }
          }
        }),
        
        // Tool to get historical decisions for similar permits
        new DynamicTool({
          name: "get_historical_decisions",
          description: "Get historical decisions for permits similar to the provided description",
          func: async (description: string) => {
            try {
              // Get all permits (in a real system, this would use a proper search index)
              const uploads = await storage.getAllUploads();
              let allPermits: Permit[] = [];
              
              for (const upload of uploads) {
                const permits = await storage.getPermitsByUploadId(upload.id);
                allPermits = [...allPermits, ...permits];
              }
              
              // Find similar permits based on description similarity (naive implementation)
              const similarityThreshold = 0.3; // Simple threshold for demonstration
              const similarPermits = allPermits.filter(permit => {
                const words = description.toLowerCase().split(/\s+/);
                const matchCount = words.filter(word => 
                  permit.permitDescription?.toLowerCase().includes(word) || false
                ).length;
                const similarity = matchCount / words.length;
                return similarity > similarityThreshold;
              }).slice(0, 5); // Limit to 5 results
              
              if (similarPermits.length === 0) {
                return "No similar historical permits found.";
              }
              
              const historicalDecisions = similarPermits.map(permit => ({
                id: permit.id,
                description: permit.permitDescription,
                decision: permit.enterPermit ? "ENTERED" : "SKIPPED",
                reason: permit.reason
              }));
              
              return JSON.stringify(historicalDecisions);
            } catch (error) {
              return `Error getting historical decisions: ${(error as Error).message}`;
            }
          }
        }),
        
        // Tool to analyze permits by neighborhood code
        new DynamicTool({
          name: "analyze_neighborhood_permits",
          description: "Analyze permits by neighborhood code to identify patterns",
          func: async (neighborhoodCode: string) => {
            try {
              // Get all permits (in a real system, this would use a proper index)
              const uploads = await storage.getAllUploads();
              let allPermits: Permit[] = [];
              
              for (const upload of uploads) {
                const permits = await storage.getPermitsByUploadId(upload.id);
                allPermits = [...allPermits, ...permits];
              }
              
              // Filter permits by neighborhood code
              const neighborhoodPermits = allPermits.filter(permit => 
                permit.neighborhoodCode === neighborhoodCode
              );
              
              if (neighborhoodPermits.length === 0) {
                return `No permits found for neighborhood code ${neighborhoodCode}.`;
              }
              
              // Calculate some basic statistics
              const totalCount = neighborhoodPermits.length;
              const enteredCount = neighborhoodPermits.filter(p => p.enterPermit).length;
              const skippedCount = totalCount - enteredCount;
              const enteredPercentage = (enteredCount / totalCount) * 100;
              
              // Get common words in descriptions
              const descriptions = neighborhoodPermits.map(p => p.permitDescription ? p.permitDescription.toLowerCase() : '');
              const words = descriptions.flatMap(desc => desc.split(/\s+/));
              const wordCounts: Record<string, number> = {};
              
              words.forEach(word => {
                if (word.length > 3) { // Skip short words
                  wordCounts[word] = (wordCounts[word] || 0) + 1;
                }
              });
              
              // Get top 5 most common words
              const commonWords = Object.entries(wordCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([word, count]) => `${word} (${count})`);
              
              return JSON.stringify({
                neighborhoodCode,
                totalPermits: totalCount,
                enteredPermits: enteredCount,
                skippedPermits: skippedCount,
                enteredPercentage: enteredPercentage.toFixed(1) + '%',
                commonTerms: commonWords,
                commercialArea: neighborhoodCode.startsWith('6')
              });
            } catch (error) {
              return `Error analyzing neighborhood permits: ${(error as Error).message}`;
            }
          }
        })
      ];

      // Define the agent prompt
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are an expert permit analysis agent with the ability to analyze permit applications in detail.
You have access to tools that help you retrieve and analyze permit data from the database.

Your goal is to provide sophisticated analysis of permit applications by:
1. Retrieving relevant permit data
2. Finding similar historical permits
3. Analyzing neighborhood patterns
4. Making well-reasoned recommendations based on all available evidence

When asked about permits, use the tools to gather all necessary information before making a recommendation.
Think step by step and explain your reasoning clearly.`],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      // Create the agent
      const agent = await createOpenAIFunctionsAgent({
        llm: this.permitModel,
        tools,
        prompt
      });

      // Create the agent executor
      this.permitAgent = new AgentExecutor({
        agent,
        tools,
        verbose: true, // for debugging
        maxIterations: 5,
      });

      log("LangChain permit agent initialized successfully", 'langchainAgentService');
    } catch (error) {
      log(`Error initializing permit agent: ${(error as Error).message}`, 'langchainAgentService');
      this.permitAgent = null;
    }
  }

  /**
   * Process a complex permit analysis task using the agent
   * @param query The query or task for the agent to process
   * @param permitId Optional permit ID to focus the analysis on
   * @returns Agent's analysis and recommendation
   */
  async processPermitQuery(query: string, permitId?: number): Promise<any> {
    try {
      await validateApiKey();
      
      if (!this.permitAgent) {
        await this.initializePermitAgent();
        
        if (!this.permitAgent) {
          throw new Error("Failed to initialize permit agent");
        }
      }
      
      // Construct the input with permit context if provided
      let input = query;
      
      if (permitId) {
        const permit = await storage.getPermit(permitId);
        if (permit) {
          input = `${query}\n\nThis question is about permit #${permitId} with the following details:
Parcel Number: ${permit.parcelNumber}
Neighborhood: ${permit.neighborhoodCode}
Description: ${permit.permitDescription}
Value: ${permit.value}
Issue Date: ${permit.issueDate}
Decision: ${permit.enterPermit ? 'ENTERED' : 'SKIPPED'}
Reason: ${permit.reason}`;
        }
      }
      
      // Execute the agent with the query
      const result = await this.permitAgent.invoke({
        input,
        chat_history: []
      });
      
      return {
        query,
        result: result.output,
        permitId
      };
    } catch (error) {
      log(`Error in LangChain agent processing: ${(error as Error).message}`, 'langchainAgentService');
      throw error;
    }
  }

  /**
   * Perform deep analysis of a specific permit using the agent
   * @param permitId The ID of the permit to analyze
   * @returns Comprehensive analysis of the permit
   */
  async analyzePermitInDepth(permitId: number): Promise<any> {
    try {
      await validateApiKey();
      
      const query = `Perform a deep analysis of permit #${permitId}.
1. Analyze whether the classification (ENTERED or SKIPPED) was appropriate
2. Find similar historical permits and compare their classifications
3. Analyze patterns in the neighborhood this permit belongs to
4. Provide specific recommendations about this permit
5. Highlight any unusual aspects or potential issues with this permit's classification`;
      
      return this.processPermitQuery(query, permitId);
    } catch (error) {
      log(`Error in LangChain permit deep analysis: ${(error as Error).message}`, 'langchainAgentService');
      throw error;
    }
  }

  /**
   * Analyze neighborhood patterns in permit processing
   * @param neighborhoodCode The neighborhood code to analyze
   * @returns Analysis of permit patterns in the neighborhood
   */
  async analyzeNeighborhoodPatterns(neighborhoodCode: string): Promise<any> {
    try {
      await validateApiKey();
      
      const query = `Analyze permit patterns for neighborhood code ${neighborhoodCode}.
1. Determine whether this is primarily a commercial or residential area
2. Identify the most common types of permits in this neighborhood
3. Analyze the approval/skip rates compared to other neighborhoods
4. Identify any unusual patterns or outliers in this neighborhood
5. Provide recommendations for optimizing permit processing in this area`;
      
      return this.processPermitQuery(query);
    } catch (error) {
      log(`Error in LangChain neighborhood analysis: ${(error as Error).message}`, 'langchainAgentService');
      throw error;
    }
  }

  /**
   * Answer a complex permit-related question
   * @param question The user's question
   * @param permitId Optional permit ID for context
   * @returns Detailed answer with supporting evidence
   */
  async answerComplexQuestion(question: string, permitId?: number): Promise<any> {
    try {
      await validateApiKey();
      return this.processPermitQuery(question, permitId);
    } catch (error) {
      log(`Error in LangChain complex question answering: ${(error as Error).message}`, 'langchainAgentService');
      throw error;
    }
  }
}

export const langchainAgentService = new LangChainAgentService();