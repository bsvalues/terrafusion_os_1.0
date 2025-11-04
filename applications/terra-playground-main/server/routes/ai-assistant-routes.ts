/**
 * AI Assistant Routes
 *
 * This module provides routes for the AI Assistant feature, allowing client-side
 * components to query different AI providers and get context-aware responses.
 */

import express from 'express';
import { aiAssistantService, AIAssistantRequest } from '../services/ai-assistant-service';

const router = express.Router();

/**
 * Get available AI providers
 */
router.get('/providers', (req, res) => {
  try {
    const providers = aiAssistantService.getAvailableProviders();

    return res.json({
      providers,
      default: providers.length > 0 ? providers[0] : null,
    });
  } catch (error) {
    console.error('Error getting available AI providers:', error);
    return res.status(500).json({ error: 'Failed to retrieve available AI providers' });
  }
});

/**
 * Send query to AI assistant
 */
router.post('/query', async (req, res) => {
  try {
    const { message, provider, context, options } = req.body as AIAssistantRequest;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    // Check if requested provider is available
    if (!aiAssistantService.isProviderAvailable(provider)) {
      return res.status(400).json({
        error: `Provider '${provider}' is not available. Choose from: ${aiAssistantService.getAvailableProviders().join(', ')}`,
      });
    }

    // Generate response from AI assistant
    const response = await aiAssistantService.generateResponse({
      message,
      provider,
      context,
      options,
    });

    return res.json(response);
  } catch (error) {
    console.error('Error generating AI assistant response:', error);
    return res.status(500).json({ error: 'Failed to generate AI assistant response' });
  }
});

export default router;
