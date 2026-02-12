/**
 * Enhanced Voice Command Routes
 *
 * Main API endpoints for the enhanced voice command system, integrating:
 * - Analytics
 * - Shortcut expansion
 * - Error handling and recovery
 * - Contextual help
 * - Domain-specific commands
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  voiceCommandProcessor,
  CommandContext,
} from '../services/voice-command/voice-command-processor';
import { voiceCommandHelpService } from '../services/voice-command/voice-command-help-service';
import { randomUUID } from 'crypto';

const router = Router();

// Validate voice command request
const commandRequestSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  userId: z.number().int().positive('Valid user ID is required'),
  sessionId: z.string().optional(),
  contextId: z.string().optional(),
  deviceInfo: z.any().optional(),
});

// Audio command request schema
const audioCommandRequestSchema = z.object({
  audio: z.string().min(1, 'Audio data is required'),
  userId: z.number().int().positive('Valid user ID is required'),
  sessionId: z.string().optional(),
  contextId: z.string().optional(),
  deviceInfo: z.any().optional(),
});

/**
 * Process a text voice command
 *
 * POST /api/voice-command/enhanced/process
 */
router.post('/process', async (req, res) => {
  try {
    // Validate request
    const validationResult = commandRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.format(),
      });
    }

    const {
      command,
      userId,
      sessionId = randomUUID(),
      contextId,
      deviceInfo,
    } = validationResult.data;

    // Process the command
    const context: CommandContext = {
      userId,
      sessionId,
      contextId,
      deviceInfo,
    };

    const result = await voiceCommandProcessor.processCommand(command, context);

    // Return the result
    return res.json({
      sessionId,
      command,
      ...result,
    });
  } catch (error) {
    console.error('Error processing voice command:', error);

    return res.status(500).json({
      error: 'Failed to process voice command',
      message: error.message,
    });
  }
});

/**
 * Process a voice command from audio
 *
 * POST /api/voice-command/enhanced/process-audio
 */
router.post('/process-audio', async (req, res) => {
  try {
    // Validate request
    const validationResult = audioCommandRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.format(),
      });
    }

    const {
      audio,
      userId,
      sessionId = randomUUID(),
      contextId,
      deviceInfo,
    } = validationResult.data;

    // Transcode the audio using the existing voice transcription service
    const transcriptionResponse = await fetch(
      `${req.protocol}://${req.get('host')}/api/voice/transcribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio }),
      }
    );

    if (!transcriptionResponse.ok) {
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcribedText = transcriptionData.text;

    if (!transcribedText) {
      return res.status(422).json({ error: 'Could not transcribe audio' });
    }

    // Process the transcribed text as a command
    const context: CommandContext = {
      userId,
      sessionId,
      contextId,
      deviceInfo,
    };

    const result = await voiceCommandProcessor.processCommand(transcribedText, context);

    // Return the result
    return res.json({
      sessionId,
      transcribedText,
      ...result,
    });
  } catch (error) {
    console.error('Error processing audio command:', error);

    return res.status(500).json({
      error: 'Failed to process audio command',
      message: error.message,
    });
  }
});

/**
 * Get available commands based on current context
 *
 * GET /api/voice-command/enhanced/available-commands
 */
router.get('/available-commands', async (req, res) => {
  try {
    // Get context ID from query parameters
    const contextId = req.query.contextId as string;

    // Default to global context if not specified
    const effectiveContextId = contextId || 'global';

    // Get help content for this context
    const helpContent = await voiceCommandHelpService.getContextualHelp(effectiveContextId, false);

    // Transform help content into a more user-friendly format
    const availableCommands = helpContent.map(item => ({
      type: item.commandType,
      title: item.title,
      description: item.description,
      examples: item.examplePhrases,
      parameters: item.parameters,
    }));

    return res.json({
      context: effectiveContextId,
      commands: availableCommands,
    });
  } catch (error) {
    console.error('Error getting available commands:', error);

    return res.status(500).json({
      error: 'Failed to get available commands',
      message: error.message,
    });
  }
});

export default router;
