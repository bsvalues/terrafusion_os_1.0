/**
 * Maintenance Chatbot Service
 * 
 * This service provides an AI-powered maintenance recommendation chatbot with personality.
 * It handles:
 * - Natural language processing of user queries
 * - Personality-based responses
 * - Maintenance recommendation logic
 * - Conversation history management
 */

import { EventType, emitEvent } from '../../shared/eda/eventSystem';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

/**
 * Personality types for the chatbot
 */
export enum ChatbotPersonality {
  FRIENDLY = 'FRIENDLY',
  TECHNICAL = 'TECHNICAL',
  EFFICIENT = 'EFFICIENT',
  HUMOROUS = 'HUMOROUS',
}

/**
 * Maintenance category types
 */
export enum MaintenanceCategory {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  PREDICTIVE = 'PREDICTIVE',
  EMERGENCY = 'EMERGENCY',
}

/**
 * Interface for maintenance recommendations
 */
export interface MaintenanceRecommendation {
  id: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  resources: string[];
  suggestedSchedule?: string;
}

/**
 * Interface for chatbot conversation history entry
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  metadata?: {
    recommendations?: MaintenanceRecommendation[];
    [key: string]: any;
  };
}

/**
 * Chatbot configuration options
 */
export interface ChatbotConfig {
  personality: ChatbotPersonality;
  name: string;
  systemPromptTemplate: string;
  model: string;
}

/**
 * Main service class for the maintenance chatbot
 */
export class MaintenanceChatbotService {
  private openai: ChatOpenAI | null = null;
  private memory: BufferMemory | null = null;
  private chain: ConversationChain | null = null;
  private config: ChatbotConfig;
  private conversations: Map<string, ChatMessage[]> = new Map();
  private recommendations: MaintenanceRecommendation[] = [];

  // Default chatbot personalities
  private static readonly PERSONALITY_PROMPTS = {
    [ChatbotPersonality.FRIENDLY]: 
      "You are {name}, a friendly and helpful maintenance assistant. You speak in a warm, conversational tone and always try to make the user feel supported. Use simple language, be encouraging, and occasionally use friendly expressions. Your goal is to provide maintenance advice that feels like it's coming from a helpful friend.",
    
    [ChatbotPersonality.TECHNICAL]: 
      "You are {name}, a technical maintenance expert with deep knowledge of systems and procedures. You speak precisely and use proper technical terminology. You provide detailed, accurate information with references to technical standards when appropriate. Your goal is to give the user complete and technically sound maintenance advice.",
    
    [ChatbotPersonality.EFFICIENT]: 
      "You are {name}, an efficiency-focused maintenance advisor. You communicate in a clear, direct, and concise manner. You prioritize time-saving approaches and practical solutions. Your responses are brief but comprehensive, avoiding unnecessary elaboration. Your goal is to help the user resolve maintenance issues with minimal time and effort.",
    
    [ChatbotPersonality.HUMOROUS]: 
      "You are {name}, a maintenance expert with a great sense of humor. You provide accurate advice while keeping the conversation light and entertaining. You occasionally use puns, jokes, or playful language related to maintenance topics. Your goal is to make maintenance tasks feel less tedious by bringing some fun to the conversation."
  };

  constructor(config?: Partial<ChatbotConfig>) {
    // Initialize with default or provided configuration
    this.config = {
      personality: config?.personality || ChatbotPersonality.FRIENDLY,
      name: config?.name || "MaintenanceBuddy",
      systemPromptTemplate: config?.systemPromptTemplate || 
                           MaintenanceChatbotService.PERSONALITY_PROMPTS[config?.personality || ChatbotPersonality.FRIENDLY],
      model: config?.model || "gpt-3.5-turbo",
    };

    // Replace template variables in the system prompt
    const systemPrompt = this.config.systemPromptTemplate.replace(
      "{name}", 
      this.config.name
    );

    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: this.config.model,
        temperature:.7,
      });

      // Set up buffer memory for conversation history
      this.memory = new BufferMemory({
        returnMessages: true,
        memoryKey: "history",
      });

      // Create the chat prompt template
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemPrompt),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
      ]);

      // Create the conversation chain
      this.chain = new ConversationChain({
        memory: this.memory,
        prompt: chatPrompt,
        llm: this.openai,
        outputParser: new StringOutputParser(),
      });

      // Log successful initialization
      console.log(`Maintenance Chatbot Service initialized with personality: ${this.config.personality}`);
    } else {
      console.warn("OpenAI API key not configured. Maintenance Chatbot will use fallback responses.");
    }

    // Initialize sample maintenance recommendations
    this.initializeRecommendations();
  }

  /**
   * Initialize with some sample maintenance recommendations
   */
  private initializeRecommendations(): void {
    this.recommendations = [
      {
        id: "rec-001",
        category: MaintenanceCategory.PREVENTIVE,
        title: "Regular System Health Check",
        description: "Perform a comprehensive system health check to identify potential issues before they become critical failures.",
        priority: "medium",
        estimatedTime: "2 hours",
        resources: ["System Health Check Tool", "Diagnostic Software"],
        suggestedSchedule: "Monthly"
      },
      {
        id: "rec-002",
        category: MaintenanceCategory.CORRECTIVE,
        title: "Database Performance Optimization",
        description: "Optimize database performance by cleaning up unused indexes and running vacuum operations.",
        priority: "high",
        estimatedTime: "3 hours",
        resources: ["Database Admin Tools", "Performance Monitoring"]
      },
      {
        id: "rec-003",
        category: MaintenanceCategory.PREDICTIVE,
        title: "API Usage Trend Analysis",
        description: "Analyze API usage patterns to predict potential bottlenecks and scale resources accordingly.",
        priority: "low",
        estimatedTime: "4 hours",
        resources: ["Analytics Dashboard", "Forecasting Tools"],
        suggestedSchedule: "Quarterly"
      },
      {
        id: "rec-004",
        category: MaintenanceCategory.EMERGENCY,
        title: "Critical Security Patch Application",
        description: "Apply recently released security patches to address critical vulnerabilities in the authentication system.",
        priority: "critical",
        estimatedTime: "1 hour",
        resources: ["Patch Management System", "Security Bulletin"]
      }
    ];
  }

  /**
   * Process a user message and generate a response
   */
  public async processMessage(
    userId: string,
    conversationId: string,
    message: string
  ): Promise<ChatMessage> {
    try {
      // Start timing for analytics
      const startTime = Date.now();

      // Generate a unique message ID
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create user message object
      const userMessage: ChatMessage = {
        id: messageId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Get or create conversation history
      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, []);
      }
      
      const conversation = this.conversations.get(conversationId)!;
      conversation.push(userMessage);

      // Emit event for user message
      emitEvent({
        type: EventType.USER_ACTION,
        payload: {
          userId,
          conversationId,
          messageId,
          action: 'chat_message_sent',
          message
        }
      });

      let responseContent: string;
      let relatedRecommendations: MaintenanceRecommendation[] = [];

      // Generate response using OpenAI if available, otherwise use fallback
      if (this.openai && this.chain && process.env.OPENAI_API_KEY) {
        // Process with LLM
        const result = await this.chain.invoke({
          input: message
        });
        
        // Convert result to string
        responseContent = typeof result === 'string' ? result : JSON.stringify(result);

        // Identify relevant maintenance recommendations based on the message
        relatedRecommendations = await this.findRelevantRecommendations(message);
      } else {
        // Fallback response generation
        responseContent = this.generateFallbackResponse(message);
        
        // Find recommendations based on keywords
        relatedRecommendations = this.findRecommendationsByKeywords(message);
      }

      // Create bot response object
      const botResponse: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'bot',
        content: responseContent,
        timestamp: new Date().toISOString(),
        metadata: {
          recommendations: relatedRecommendations,
          processingTime: Date.now() - startTime,
          personality: this.config.personality
        }
      };

      // Add to conversation history
      conversation.push(botResponse);
      
      // Keep conversation history within a reasonable limit (last 50 messages)
      if (conversation.length > 50) {
        this.conversations.set(
          conversationId, 
          conversation.slice(conversation.length - 50)
        );
      }

      // Emit event for bot response
      emitEvent({
        type: EventType.MCP_MESSAGE,
        payload: {
          userId,
          conversationId,
          messageId: botResponse.id,
          action: 'chat_response_generated',
          message: responseContent,
          recommendations: relatedRecommendations.length,
          processingTime: botResponse.metadata?.processingTime
        }
      });

      return botResponse;
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      
      // Emit error event
      emitEvent({
        type: EventType.ERROR,
        payload: {
          source: 'maintenance_chatbot',
          message: `Error processing chat message: ${(error as Error).message}`,
          userId,
          conversationId
        }
      });

      // Return error response
      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        role: 'bot',
        content: "I'm sorry, I encountered an error processing your request. Could you try asking in a different way?",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get conversation history for a specific conversation
   */
  public getConversationHistory(conversationId: string): ChatMessage[] {
    return this.conversations.get(conversationId) || [];
  }

  /**
   * Clear conversation history for a specific conversation
   */
  public clearConversationHistory(conversationId: string): void {
    this.conversations.delete(conversationId);
    
    // Also clear the LangChain memory for this conversation if it exists
    if (this.memory) {
      this.memory.clear();
    }
  }

  /**
   * Change the chatbot's personality
   */
  public setPersonality(personality: ChatbotPersonality, name?: string): void {
    this.config.personality = personality;
    
    if (name) {
      this.config.name = name;
    }
    
    // Update the system prompt template based on the new personality
    this.config.systemPromptTemplate = 
      MaintenanceChatbotService.PERSONALITY_PROMPTS[personality];
    
    // Replace template variables in the system prompt
    const systemPrompt = this.config.systemPromptTemplate.replace(
      "{name}", 
      this.config.name
    );

    // If using LangChain, update the chain's system message
    if (this.chain && this.openai) {
      // Create a new chat prompt template
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemPrompt),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}"),
      ]);
      
      // Create a new memory instance if needed
      if (!this.memory) {
        this.memory = new BufferMemory({
          returnMessages: true,
          memoryKey: "history",
        });
      }
      
      // Create a new conversation chain
      this.chain = new ConversationChain({
        memory: this.memory,
        prompt: chatPrompt,
        llm: this.openai,
        outputParser: new StringOutputParser(),
      });
    }

    // Log personality change
    console.log(`Chatbot personality changed to: ${personality}, name: ${this.config.name}`);
  }

  /**
   * Generate a fallback response when OpenAI is not available
   */
  private generateFallbackResponse(message: string): string {
    // Simple rule-based fallback system
    const lowercaseMessage = message.toLowerCase();
    
    // Check for common greeting patterns
    if (lowercaseMessage.match(/^(hi|hello|hey|greetings).*/i)) {
      switch (this.config.personality) {
        case ChatbotPersonality.FRIENDLY:
          return `Hi there! I'm ${this.config.name}, your friendly maintenance assistant. How can I help you today?`;
        case ChatbotPersonality.TECHNICAL:
          return `Greetings. This is ${this.config.name}, technical maintenance system online. How may I assist with your maintenance inquiries?`;
        case ChatbotPersonality.EFFICIENT:
          return `Hello. ${this.config.name} here. What maintenance issue can I help you resolve today?`;
        case ChatbotPersonality.HUMOROUS:
          return `Hey there! ${this.config.name} at your service! Ready to tackle those pesky maintenance gremlins? What's causing trouble?`;
        default:
          return `Hello! This is ${this.config.name}. How can I assist with your maintenance needs?`;
      }
    }
    
    // Check for questions about the system or features
    if (lowercaseMessage.includes('what can you do') || 
        lowercaseMessage.includes('help me with') ||
        lowercaseMessage.includes('how do you work')) {
      return `I'm ${this.config.name}, an AI maintenance assistant. I can help you with maintenance recommendations, troubleshooting common issues, and providing guidance on best practices. Just describe what you're working on or the issues you're facing, and I'll do my best to assist you.`;
    }
    
    // Check for common maintenance terms
    if (lowercaseMessage.includes('database') || lowercaseMessage.includes('db')) {
      return "I noticed you mentioned database maintenance. Regular database optimization is crucial for system performance. I recommend checking indexes, running vacuum operations, and monitoring query performance. Would you like specific recommendations for database maintenance?";
    }
    
    if (lowercaseMessage.includes('api') || lowercaseMessage.includes('endpoint')) {
      return "API maintenance and monitoring are important for system reliability. Consider implementing rate limiting, regular performance testing, and comprehensive logging. What specific API issues are you dealing with?";
    }
    
    if (lowercaseMessage.includes('performance') || lowercaseMessage.includes('slow')) {
      return "Performance issues can stem from various sources. It's important to systematically identify bottlenecks through monitoring and profiling. Would you like recommendations for performance optimization techniques?";
    }
    
    if (lowercaseMessage.includes('error') || lowercaseMessage.includes('bug') || lowercaseMessage.includes('issue')) {
      return "When troubleshooting errors, a systematic approach is key. Start by reviewing logs, reproducing the issue in a controlled environment, and isolating variables. Can you provide more details about the specific error you're encountering?";
    }
    
    // Default response if no patterns match
    switch (this.config.personality) {
      case ChatbotPersonality.FRIENDLY:
        return `I'm here to help with your maintenance questions! Could you provide a bit more details about what you need assistance with?`;
      case ChatbotPersonality.TECHNICAL:
        return `Please specify the system component or maintenance procedure you require information about. Additional technical details will enable more precise assistance.`;
      case ChatbotPersonality.EFFICIENT:
        return `I need more specific information to help you effectively. Please describe the exact maintenance task or issue you're addressing.`;
      case ChatbotPersonality.HUMOROUS:
        return `I'm racking my digital brain here, but need a few more clues about your maintenance mysteries. Care to share more details? I promise not to bolt at complex questions!`;
      default:
        return `I'd be happy to assist with your maintenance needs. Could you please provide more specific information about what you're looking for?`;
    }
  }
  
  /**
   * Find recommendations based on simple keyword matching (fallback method)
   */
  private findRecommendationsByKeywords(message: string): MaintenanceRecommendation[] {
    const lowercaseMessage = message.toLowerCase();
    const matchedRecommendations: MaintenanceRecommendation[] = [];
    
    // Simple keyword matching
    this.recommendations.forEach(rec => {
      // Check if any keywords from the recommendation match the message
      const recommendationText = `${rec.title} ${rec.description} ${rec.category}`.toLowerCase();
      
      // Define keywords for each category
      const keywords: Record<MaintenanceCategory, string[]> = {
        [MaintenanceCategory.PREVENTIVE]: ['prevent', 'regular', 'schedule', 'routine', 'health', 'check'],
        [MaintenanceCategory.CORRECTIVE]: ['fix', 'repair', 'solve', 'issue', 'problem', 'database', 'performance'],
        [MaintenanceCategory.PREDICTIVE]: ['predict', 'forecast', 'future', 'trend', 'analysis', 'api', 'usage'],
        [MaintenanceCategory.EMERGENCY]: ['urgent', 'critical', 'emergency', 'immediate', 'security', 'patch']
      };
      
      // Check if category keywords match
      const categoryKeywords = keywords[rec.category];
      const hasMatchingKeywords = categoryKeywords.some(keyword => 
        lowercaseMessage.includes(keyword)
      );
      
      // Check if specific recommendation keywords match
      const hasSpecificMatch = recommendationText.split(' ').some(word => 
        word.length > 4 && lowercaseMessage.includes(word)
      );
      
      if (hasMatchingKeywords || hasSpecificMatch) {
        matchedRecommendations.push(rec);
      }
    });
    
    // If too many matches, prioritize by relevance
    if (matchedRecommendations.length > 3) {
      // Sort by priority (critical > high > medium > low)
      return matchedRecommendations
        .sort((a, b) => {
          const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 3);
    }
    
    return matchedRecommendations;
  }
  
  /**
   * Find relevant maintenance recommendations based on user message using OpenAI
   */
  private async findRelevantRecommendations(message: string): Promise<MaintenanceRecommendation[]> {
    // If no OpenAI, fall back to keyword matching
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      return this.findRecommendationsByKeywords(message);
    }
    
    try {
      // Convert recommendations to a format suitable for embedding search
      const recommendationTexts = this.recommendations.map(rec => 
        `${rec.id}: ${rec.title} - ${rec.description} (Category: ${rec.category}, Priority: ${rec.priority})`
      );
      
      // For a production system, you would use embeddings and similarity search
      // This is a simplified approach using direct LLM calls
      const systemPrompt = 
        "You are a maintenance recommendation system. " +
        "Based on the user's message, identify the most relevant maintenance recommendations " +
        "from the list provided. Return ONLY the IDs of the top 1-3 most relevant recommendations " +
        "separated by commas, with no additional text or explanation.";
      
      const userPrompt = 
        `User message: ${message}\n\n` +
        `Available recommendations:\n${recommendationTexts.join('\n')}`;
      
      // Call OpenAI to get relevant recommendation IDs
      const response = await this.openai.invoke(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      );
      
      // Parse the response to get recommendation IDs
      const responseText = typeof response === 'string' 
        ? response 
        : (response as any).content || '';
        
      const recommendationIds = responseText
        .replace(/\s+/g, '')
        .split(',')
        .filter((id: string) => id.startsWith('rec-'));
      
      // Filter recommendations by the returned IDs
      return this.recommendations.filter(rec => 
        recommendationIds.includes(rec.id)
      );
    } catch (error) {
      console.error('Error finding relevant recommendations:', error);
      // Fall back to keyword matching on error
      return this.findRecommendationsByKeywords(message);
    }
  }
  
  /**
   * Get all available maintenance recommendations
   */
  public getRecommendations(): MaintenanceRecommendation[] {
    return [...this.recommendations];
  }
  
  /**
   * Add a new maintenance recommendation
   */
  public addRecommendation(recommendation: Omit<MaintenanceRecommendation, 'id'>): MaintenanceRecommendation {
    const newId = `rec-${Date.now().toString().substring(7)}-${Math.random().toString(36).substring(2, 5)}`;
    
    const newRecommendation: MaintenanceRecommendation = {
      id: newId,
      ...recommendation
    };
    
    this.recommendations.push(newRecommendation);
    return newRecommendation;
  }
}

// Export singleton instance
export const maintenanceChatbotService = new MaintenanceChatbotService();