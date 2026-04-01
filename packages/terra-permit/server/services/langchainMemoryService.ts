/**
 * LangChain Memory Service
 * This service implements conversational memory capabilities for maintaining context
 * in multi-turn permit-related conversations.
 */

import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
  HumanMessagePromptTemplate
} from "@langchain/core/prompts";
import { ConversationChain } from "langchain/chains";
import { 
  BufferMemory, 
  ChatMessageHistory 
} from "langchain/memory";
import { 
  HumanMessage, 
  AIMessage 
} from "@langchain/core/messages";
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
 * Interface for a conversation session
 */
export interface ConversationSession {
  sessionId: string;
  userId: string;
  conversation: ConversationChain;
  lastActivity: Date;
  permitContext?: Permit[];
}

/**
 * LangChainMemoryService provides conversational memory capabilities
 * for maintaining context in multi-turn conversations
 */
export class LangChainMemoryService {
  private readonly defaultModel = 'gpt-4';
  private readonly sessionTTL = 1000 * 60 * 30; // 30 minutes
  private conversationModel: ChatOpenAI = new ChatOpenAI({ modelName: 'gpt-4' }); // Initialize with default value
  private conversationSessions: Map<string, ConversationSession> = new Map();

  constructor() {
    try {
      this.conversationModel = new ChatOpenAI({
        modelName: this.defaultModel,
        temperature: 0.7, // Slightly higher temperature for natural conversation
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      // Set up session cleanup interval
      setInterval(() => this.cleanupExpiredSessions(), this.sessionTTL);
    } catch (error) {
      log(`Error initializing LangChain memory service: ${(error as Error).message}`, 'langchainMemoryService');
    }
  }

  /**
   * Initialize a new conversation session
   * @param sessionId Unique identifier for the conversation session
   * @param userId User identifier
   * @param permitContext Optional permits to provide as context
   * @returns The initialized conversation session
   */
  private initializeConversationSession(
    sessionId: string, 
    userId: string,
    permitContext?: Permit[]
  ): ConversationSession {
    try {
      // Create system message with context about permits if available
      let systemMessage = `You are an expert permit assistant who helps users understand and analyze permit applications.
You can answer questions about specific permits, explain permit decisions, and provide general information about the permit process.
Always speak in a helpful, professional manner.`;

      if (permitContext && permitContext.length > 0) {
        systemMessage += `\n\nYou have access to the following permit information:`;
        
        permitContext.forEach((permit, index) => {
          systemMessage += `\n
Permit #${index + 1} (ID: ${permit.id}):
- Parcel Number: ${permit.parcelNumber}
- Neighborhood: ${permit.neighborhoodCode}
- Description: ${permit.permitDescription}
- Value: ${permit.value}
- Decision: ${permit.enterPermit ? 'ENTERED' : 'SKIPPED'}
- Reason: ${permit.reason}`;
        });
        
        systemMessage += `\n\nRefer to these permits by their number (Permit #1, Permit #2, etc.) when discussing them.`;
      }

      // Create conversation memory
      const memory = new BufferMemory({
        returnMessages: true,
        memoryKey: "history",
        inputKey: "input",
      });

      // Create conversation prompt template
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", systemMessage],
        new MessagesPlaceholder("history"),
        ["human", "{input}"],
      ]);

      // Create conversation chain
      const conversation = new ConversationChain({
        memory: memory,
        prompt: prompt,
        llm: this.conversationModel,
      });

      // Store session
      const session: ConversationSession = {
        sessionId,
        userId,
        conversation,
        lastActivity: new Date(),
        permitContext
      };

      this.conversationSessions.set(sessionId, session);
      log(`Initialized conversation session ${sessionId} for user ${userId}`, 'langchainMemoryService');

      return session;
    } catch (error) {
      log(`Error initializing conversation session: ${(error as Error).message}`, 'langchainMemoryService');
      throw error;
    }
  }

  /**
   * Get or initialize a conversation session
   * @param sessionId Unique identifier for the conversation session
   * @param userId User identifier
   * @param permitContext Optional permits to provide as context
   * @returns The conversation session
   */
  private getOrCreateSession(
    sessionId: string, 
    userId: string,
    permitContext?: Permit[]
  ): ConversationSession {
    // Check if session exists and update last activity
    if (this.conversationSessions.has(sessionId)) {
      const session = this.conversationSessions.get(sessionId)!;
      session.lastActivity = new Date();
      
      // Update permit context if provided
      if (permitContext) {
        session.permitContext = permitContext;
      }
      
      return session;
    }
    
    // Initialize new session
    return this.initializeConversationSession(sessionId, userId, permitContext);
  }

  /**
   * Clean up expired conversation sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessionIds: string[] = [];
    
    // Find expired sessions
    this.conversationSessions.forEach((session, sessionId) => {
      const lastActivity = session.lastActivity.getTime();
      if (now - lastActivity > this.sessionTTL) {
        expiredSessionIds.push(sessionId);
      }
    });
    
    // Remove expired sessions
    expiredSessionIds.forEach(sessionId => {
      this.conversationSessions.delete(sessionId);
      log(`Cleaned up expired conversation session ${sessionId}`, 'langchainMemoryService');
    });
  }

  /**
   * Process a message in a conversation with memory
   * @param sessionId Unique identifier for the conversation session
   * @param userId User identifier
   * @param message The user's message
   * @param permitContext Optional permits to provide as context
   * @returns The AI's response
   */
  async processMessage(
    sessionId: string,
    userId: string,
    message: string,
    permitContext?: Permit[]
  ): Promise<string> {
    try {
      await validateApiKey();
      
      // Get or create conversation session
      const session = this.getOrCreateSession(sessionId, userId, permitContext);
      
      // Process message
      const response = await session.conversation.call({
        input: message
      });
      
      return response.response;
    } catch (error) {
      log(`Error processing message: ${(error as Error).message}`, 'langchainMemoryService');
      throw error;
    }
  }

  /**
   * Reset a conversation session
   * @param sessionId The session ID to reset
   * @param userId User identifier
   * @param permitContext Optional permits to provide as new context
   * @returns True if reset successfully
   */
  async resetConversation(
    sessionId: string,
    userId: string,
    permitContext?: Permit[]
  ): Promise<boolean> {
    try {
      // Delete existing session if exists
      if (this.conversationSessions.has(sessionId)) {
        this.conversationSessions.delete(sessionId);
      }
      
      // Create new session
      this.initializeConversationSession(sessionId, userId, permitContext);
      
      return true;
    } catch (error) {
      log(`Error resetting conversation: ${(error as Error).message}`, 'langchainMemoryService');
      return false;
    }
  }

  /**
   * Add context to an existing conversation
   * @param sessionId The session ID
   * @param userId User identifier
   * @param permitContext Permits to add as context
   * @returns True if context added successfully
   */
  async addConversationContext(
    sessionId: string,
    userId: string,
    permitContext: Permit[]
  ): Promise<boolean> {
    try {
      await validateApiKey();
      
      // Get or create session
      const session = this.getOrCreateSession(sessionId, userId);
      
      // Add system message to inform about new context
      const contextMessage = `I'm now providing information about ${permitContext.length} permit(s) for your reference:`;
      const permitDetails = permitContext.map((permit, index) => 
        `Permit #${index + 1} (ID: ${permit.id}): ${permit.permitDescription} - ${permit.enterPermit ? 'ENTERED' : 'SKIPPED'}`
      ).join('\n');
      
      // Add to conversation history as if the AI had provided this context
      const memory = session.conversation.memory as BufferMemory;
      await memory.chatHistory.addUserMessage(contextMessage);
      await memory.chatHistory.addMessage(new AIMessage({
        content: `I've received information about the following permits:\n${permitDetails}\n\nI'll reference these by number when discussing them. How can I help with these permits?`
      }));
      
      // Update permit context
      session.permitContext = [...(session.permitContext || []), ...permitContext];
      
      return true;
    } catch (error) {
      log(`Error adding conversation context: ${(error as Error).message}`, 'langchainMemoryService');
      return false;
    }
  }

  /**
   * Get active conversation sessions
   * @returns Array of active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.conversationSessions.keys());
  }

  /**
   * Check if a conversation session exists
   * @param sessionId The session ID to check
   * @returns True if the session exists
   */
  hasSession(sessionId: string): boolean {
    return this.conversationSessions.has(sessionId);
  }
}

export const langchainMemoryService = new LangChainMemoryService();