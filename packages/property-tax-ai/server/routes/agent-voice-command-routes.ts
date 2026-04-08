/**
 * Agent Voice Command Routes
 * 
 * API endpoints for processing voice commands targeted at agents,
 * maintaining context between commands, and handling agent responses.
 */

import express from 'express';
import { z } from 'zod';
import { agentVoiceCommandService } from '../services/agent-voice-command-service';
import { randomUUID } from 'crypto';

const router = express.Router();

// Schema for voice transcription request
const transcriptionSchema = z.object({
  audio: z.string(),
  sessionId: z.string().optional(),
  contextOverride: z.object({
    agentId: z.string().optional(),
    subject: z.string().optional(),
    activeContext: z.string().optional()
  }).optional()
});

// Schema for text command processing request
const textCommandSchema = z.object({
  text: z.string(),
  sessionId: z.string().optional(),
  contextOverride: z.object({
    agentId: z.string().optional(),
    subject: z.string().optional(),
    activeContext: z.string().optional()
  }).optional()
});

/**
 * Process a voice command from audio
 */
router.post('/process-audio', async (req, res) => {
  try {
    // Validate request
    const validationResult = transcriptionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }
    
    const { audio, sessionId = randomUUID(), contextOverride } = validationResult.data;
    
    // Transcode the audio using the existing voice routes
    const transcriptionResponse = await fetch(`${req.protocol}://${req.get('host')}/api/voice/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio }),
    });
    
    if (!transcriptionResponse.ok) {
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
    
    const transcriptionData = await transcriptionResponse.json();
    const transcribedText = transcriptionData.text;
    
    // Process the transcribed text as a command
    const result = await agentVoiceCommandService.processVoiceCommand(
      transcribedText, 
      sessionId,
      contextOverride
    );
    
    // Return the result
    return res.json({
      sessionId,
      transcribedText,
      command: result.command,
      response: result.response,
      error: result.error,
      context: result.updatedContext
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    return res.status(500).json({ error: 'Failed to process voice command' });
  }
});

/**
 * Process a text command directly
 */
router.post('/process-text', async (req, res) => {
  try {
    // Validate request
    const validationResult = textCommandSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }
    
    const { text, sessionId = randomUUID(), contextOverride } = validationResult.data;
    
    // Process the text as a command
    const result = await agentVoiceCommandService.processVoiceCommand(
      text, 
      sessionId,
      contextOverride
    );
    
    // Return the result
    return res.json({
      sessionId,
      command: result.command,
      response: result.response,
      error: result.error,
      context: result.updatedContext
    });
  } catch (error) {
    console.error('Error processing text command:', error);
    return res.status(500).json({ error: 'Failed to process text command' });
  }
});

/**
 * Clear a session's context
 */
router.delete('/context/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    agentVoiceCommandService.clearContext(sessionId);
    
    return res.json({ success: true, message: 'Context cleared successfully' });
  } catch (error) {
    console.error('Error clearing context:', error);
    return res.status(500).json({ error: 'Failed to clear context' });
  }
});

/**
 * Get available agents and command types
 */
router.get('/available-commands', async (req, res) => {
  try {
    // Use the help command to get available commands
    const result = await agentVoiceCommandService.processVoiceCommand(
      'help', 
      'system',
      { activeContext: 'help' }
    );
    
    return res.json(result.response);
  } catch (error) {
    console.error('Error getting available commands:', error);
    return res.status(500).json({ error: 'Failed to get available commands' });
  }
});

export default router;