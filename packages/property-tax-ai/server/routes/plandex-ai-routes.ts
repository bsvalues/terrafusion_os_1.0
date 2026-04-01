/**
 * Plandex AI Routes
 * 
 * This module provides API routes for interacting with the Plandex AI service.
 */

import express from 'express';
import { getPlandexAIService, isPlandexAIAvailable } from '../services/plandex-ai-factory';

const router = express.Router();

// Check if Plandex AI is available
router.get('/status', (req, res) => {
  res.json({ available: isPlandexAIAvailable() });
});

// Generate code
router.post('/generate', async (req, res) => {
  try {
    const { prompt, language, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    
    const plandexService = getPlandexAIService();
    if (!plandexService) {
      return res.status(503).json({ error: 'Plandex AI service not available' });
    }
    
    const generatedCode = await plandexService.generateCode({
      prompt,
      language,
      context
    });
    
    res.json({ code: generatedCode });
  } catch (error) {
    console.error('Error generating code with Plandex AI:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Complete code
router.post('/complete', async (req, res) => {
  try {
    const { codePrefix, language, maxTokens, temperature } = req.body;
    
    if (!codePrefix) {
      return res.status(400).json({ error: 'Missing code prefix' });
    }
    
    const plandexService = getPlandexAIService();
    if (!plandexService) {
      return res.status(503).json({ error: 'Plandex AI service not available' });
    }
    
    const completion = await plandexService.completeCode({
      codePrefix,
      language: language || 'typescript',
      maxTokens,
      temperature
    });
    
    res.json({ completion });
  } catch (error) {
    console.error('Error completing code with Plandex AI:', error);
    res.status(500).json({ error: 'Failed to complete code' });
  }
});

// Fix bugs
router.post('/fix', async (req, res) => {
  try {
    const { buggyCode, errorMessage, language } = req.body;
    
    if (!buggyCode || !errorMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const plandexService = getPlandexAIService();
    if (!plandexService) {
      return res.status(503).json({ error: 'Plandex AI service not available' });
    }
    
    const fixedCode = await plandexService.fixBugs({
      buggyCode,
      errorMessage,
      language: language || 'typescript'
    });
    
    res.json({ fixedCode });
  } catch (error) {
    console.error('Error fixing bugs with Plandex AI:', error);
    res.status(500).json({ error: 'Failed to fix bugs' });
  }
});

// Explain code
router.post('/explain', async (req, res) => {
  try {
    const { code, language, detailLevel } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Missing code' });
    }
    
    const plandexService = getPlandexAIService();
    if (!plandexService) {
      return res.status(503).json({ error: 'Plandex AI service not available' });
    }
    
    const explanation = await plandexService.explainCode({
      code,
      language: language || 'typescript',
      detailLevel
    });
    
    res.json({ explanation });
  } catch (error) {
    console.error('Error explaining code with Plandex AI:', error);
    res.status(500).json({ error: 'Failed to explain code' });
  }
});

export default router;