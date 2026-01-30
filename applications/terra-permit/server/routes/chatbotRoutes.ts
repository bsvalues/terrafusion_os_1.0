/**
 * Maintenance Chatbot API Routes
 * 
 * This file defines the API routes for the AI-powered maintenance chatbot
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { 
  maintenanceChatbotService, 
  ChatbotPersonality,
  MaintenanceCategory
} from '../services/maintenanceChatbotService';
import { isAuthenticated } from '../middleware/auth';
import { EventType, emitEvent } from '../../shared/eda/eventSystem';

// Schema for send message request
const sendMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
});

// Schema for setting chatbot personality
const setPersonalitySchema = z.object({
  personality: z.enum([
    ChatbotPersonality.FRIENDLY,
    ChatbotPersonality.TECHNICAL,
    ChatbotPersonality.EFFICIENT,
    ChatbotPersonality.HUMOROUS,
  ]),
  name: z.string().optional(),
});

// Schema for adding a new recommendation
const addRecommendationSchema = z.object({
  category: z.enum([
    MaintenanceCategory.PREVENTIVE,
    MaintenanceCategory.CORRECTIVE,
    MaintenanceCategory.PREDICTIVE,
    MaintenanceCategory.EMERGENCY,
  ]),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedTime: z.string(),
  resources: z.array(z.string()),
  suggestedSchedule: z.string().optional(),
});

/**
 * Register chatbot routes on the Express application
 */
export function registerChatbotRoutes(app: any) {
  // Route to send a message to the chatbot
  app.post('/api/chatbot/message', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedBody = sendMessageSchema.safeParse(req.body);
      if (!validatedBody.success) {
        return res.status(400).json({
          error: 'Invalid message data',
          details: validatedBody.error.errors
        });
      }

      // Get user ID from session or fallback to dev user
      const userId = req.session.userId || 1;

      // Generate a conversation ID if not provided
      const conversationId = validatedBody.data.conversationId || uuidv4();

      // Process the message
      const response = await maintenanceChatbotService.processMessage(
        userId.toString(),
        conversationId,
        validatedBody.data.message
      );

      // Return the chatbot response
      res.status(200).json({
        success: true,
        data: {
          message: response,
          conversationId
        }
      });
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      res.status(500).json({
        error: 'Failed to process message',
        message: (error as Error).message
      });
    }
  });

  // Route to get conversation history
  app.get('/api/chatbot/conversation/:id', isAuthenticated, (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;

      // Get conversation history
      const history = maintenanceChatbotService.getConversationHistory(conversationId);

      res.status(200).json({
        success: true,
        data: {
          conversationId,
          messages: history
        }
      });
    } catch (error) {
      console.error('Error getting conversation history:', error);
      res.status(500).json({
        error: 'Failed to get conversation history',
        message: (error as Error).message
      });
    }
  });

  // Route to clear conversation history
  app.delete('/api/chatbot/conversation/:id', isAuthenticated, (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;

      // Clear conversation history
      maintenanceChatbotService.clearConversationHistory(conversationId);

      res.status(200).json({
        success: true,
        message: 'Conversation history cleared'
      });
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      res.status(500).json({
        error: 'Failed to clear conversation history',
        message: (error as Error).message
      });
    }
  });

  // Route to set chatbot personality
  app.post('/api/chatbot/personality', isAuthenticated, (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedBody = setPersonalitySchema.safeParse(req.body);
      if (!validatedBody.success) {
        return res.status(400).json({
          error: 'Invalid personality data',
          details: validatedBody.error.errors
        });
      }

      // Set personality
      maintenanceChatbotService.setPersonality(
        validatedBody.data.personality,
        validatedBody.data.name
      );

      // Log personality change event
      emitEvent({
        type: EventType.AGENT_STATUS_CHANGE,
        payload: {
          agentId: 'maintenance-chatbot',
          action: 'personality_changed',
          personality: validatedBody.data.personality,
          name: validatedBody.data.name
        }
      });

      res.status(200).json({
        success: true,
        message: `Chatbot personality changed to ${validatedBody.data.personality}`,
        data: {
          personality: validatedBody.data.personality,
          name: validatedBody.data.name || maintenanceChatbotService['config'].name
        }
      });
    } catch (error) {
      console.error('Error setting chatbot personality:', error);
      res.status(500).json({
        error: 'Failed to set chatbot personality',
        message: (error as Error).message
      });
    }
  });

  // Route to get all available recommendations
  app.get('/api/chatbot/recommendations', isAuthenticated, (req: Request, res: Response) => {
    try {
      // Get all recommendations
      const recommendations = maintenanceChatbotService.getRecommendations();

      res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        error: 'Failed to get recommendations',
        message: (error as Error).message
      });
    }
  });

  // Route to add a new recommendation
  app.post('/api/chatbot/recommendations', isAuthenticated, (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedBody = addRecommendationSchema.safeParse(req.body);
      if (!validatedBody.success) {
        return res.status(400).json({
          error: 'Invalid recommendation data',
          details: validatedBody.error.errors
        });
      }

      // Add recommendation
      const newRecommendation = maintenanceChatbotService.addRecommendation(validatedBody.data);

      // Log new recommendation event
      emitEvent({
        type: EventType.DATA_CHANGE,
        payload: {
          action: 'recommendation_added',
          recommendationId: newRecommendation.id,
          category: newRecommendation.category
        }
      });

      res.status(201).json({
        success: true,
        message: 'Recommendation added successfully',
        data: newRecommendation
      });
    } catch (error) {
      console.error('Error adding recommendation:', error);
      res.status(500).json({
        error: 'Failed to add recommendation',
        message: (error as Error).message
      });
    }
  });

  console.log('Maintenance Chatbot routes registered');
}