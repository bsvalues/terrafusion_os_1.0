/**
 * Voice Command Coding Assistance Routes
 * 
 * This file contains routes for handling voice commands specifically
 * focused on coding assistance functionality.
 */

import { Router } from 'express';
import { getVoiceCommandCodingAssistanceService, initializeVoiceCommandCodingAssistanceService } from '../services/voice-command/voice-command-coding-assistance-service';
import { logger } from '../utils/logger';

const router = Router();
const codingAssistanceService = initializeVoiceCommandCodingAssistanceService();

// Route to initialize help content for voice command coding assistance
router.post('/initialize-help', async (req, res) => {
  try {
    await codingAssistanceService.initializeHelpContent();
    res.status(200).json({ success: true, message: 'Coding assistance help content initialized successfully' });
  } catch (error) {
    logger.error(`Error initializing coding assistance help content: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to initialize coding assistance help content' });
  }
});

// Route to process a coding assistance command directly
router.post('/process', async (req, res) => {
  try {
    const { command, context } = req.body;
    
    if (!command) {
      return res.status(400).json({ success: false, message: 'Command is required' });
    }
    
    const result = await codingAssistanceService.processCodingCommand(command, context || {});
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error processing coding assistance command: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process coding assistance command',
      error: error.message
    });
  }
});

// Route to get available coding command types and examples
router.get('/commands', (req, res) => {
  try {
    const commandTypes = [
      {
        type: 'generation',
        examples: [
          'generate code to sort an array',
          'create a function to calculate fibonacci numbers',
          'write a class for user authentication',
          'generate a component for a login form'
        ]
      },
      {
        type: 'explanation',
        examples: [
          'explain this code',
          'describe this function',
          'tell me about this implementation'
        ]
      },
      {
        type: 'bug_fixing',
        examples: [
          'fix this bug',
          'debug this issue',
          'resolve this error'
        ]
      },
      {
        type: 'optimization',
        examples: [
          'optimize this code',
          'improve this function',
          'refactor this query'
        ]
      },
      {
        type: 'editor_controls',
        examples: [
          'insert code here',
          'delete this selection',
          'select this function',
          'undo',
          'redo'
        ]
      }
    ];
    
    res.status(200).json({ success: true, commandTypes });
  } catch (error) {
    logger.error(`Error getting coding command types: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get coding command types',
      error: error.message
    });
  }
});

export default router;