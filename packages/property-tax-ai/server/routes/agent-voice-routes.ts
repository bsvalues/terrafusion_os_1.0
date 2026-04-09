/**
 * Agent Voice Command Routes
 * 
 * This file defines the API routes for the agent voice command functionality.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAgentVoiceCommandService, VoiceCommandContext, VoiceCommandResult } from '../services/agent-voice-command-service';

// Create a router
const router = Router();

// Schema for validating voice command requests
const voiceCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  context: z.object({
    agentId: z.string().optional(),
    subject: z.string().optional(),
    recentCommands: z.array(z.string()).optional(),
    recentResults: z.array(z.any()).optional()
  }).optional()
});

/**
 * Process voice command
 * 
 * POST /api/agent-voice/command
 */
router.post('/command', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = voiceCommandSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validationResult.error.format()
      });
    }
    
    const { command, context = {} } = validationResult.data;
    
    // Get the voice command service
    const voiceCommandService = getAgentVoiceCommandService();
    
    // Process the command
    const result = await voiceCommandService.processCommand(command, context);
    
    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing voice command:', error);
    
    // Return error response
    let errorMessage = 'An error occurred while processing the voice command';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // If this is a known error type, we could handle it differently
      if (errorMessage.includes('not initialized')) {
        statusCode = 503; // Service Unavailable
      }
    }
    
    return res.status(statusCode).json({
      error: errorMessage
    });
  }
});

/**
 * Execute action from voice command
 * 
 * POST /api/agent-voice/execute-action
 */
router.post('/execute-action', async (req: Request, res: Response) => {
  try {
    // Schema for validating action execution
    const actionSchema = z.object({
      type: z.string().min(1, 'Action type is required'),
      payload: z.any().optional()
    });
    
    // Validate request body
    const validationResult = actionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid action',
        details: validationResult.error.format()
      });
    }
    
    const { type, payload } = validationResult.data;
    
    // In a real implementation, we would handle different action types
    // For this demo, we'll just acknowledge the action
    
    // Return a success response
    let response = '';
    let actions: Array<{type: string, payload?: any}> = [];
    
    switch (type) {
      case 'display_property_details':
        response = `Displaying property details for ID: ${payload.propertyId}`;
        break;
        
      case 'open_modal':
        response = `Opening ${payload.modalType} modal for: ${payload.address || 'N/A'}`;
        break;
        
      case 'display_notification':
        response = `Notification displayed: ${payload.title}`;
        break;
        
      case 'navigate':
        response = `Navigating to: ${payload.url || payload.route || 'unknown destination'}`;
        break;
        
      case 'copy_to_clipboard':
        response = `Copied text to clipboard`;
        break;
        
      case 'refresh_data':
        response = `Refreshing data for: ${payload.dataType || 'current view'}`;
        break;
        
      default:
        response = `Action '${type}' executed successfully`;
    }
    
    return res.status(200).json({
      successful: true,
      message: response,
      actions // Additional actions if needed
    });
  } catch (error) {
    console.error('Error executing voice command action:', error);
    
    // Return error response
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error executing action'
    });
  }
});

/**
 * Get available voice commands
 * 
 * GET /api/agent-voice/available-commands
 */
router.get('/available-commands', (req: Request, res: Response) => {
  try {
    // In a real implementation, this would be dynamic based on the user's context
    // and the available functionality
    
    const availableCommands = [
      {
        name: 'Property Data',
        examples: [
          'Show me property data for BC001',
          'What are the details for property ID BC002?',
          'Give me information about property BC003'
        ]
      },
      {
        name: 'Valuation Reports',
        examples: [
          'Generate a valuation report for 1320 N Louis Avenue',
          'Create an assessment report for 742 Evergreen Terrace',
          'What\'s the valuation for 123 Main Street?'
        ]
      },
      {
        name: 'Assessment Methods',
        examples: [
          'How are residential properties assessed?',
          'What\'s the assessment method for commercial properties?',
          'Explain the assessment process for agricultural land'
        ]
      },
      {
        name: 'General Help',
        examples: [
          'Help',
          'What can you do?',
          'Show me available commands'
        ]
      }
    ];
    
    // Return available commands
    return res.status(200).json({
      availableCommands
    });
  } catch (error) {
    console.error('Error getting available commands:', error);
    
    // Return error response
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error getting available commands'
    });
  }
});

export default router;