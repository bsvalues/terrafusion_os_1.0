/**
 * TerraAgent AI Main Entry Point
 * Day 3 - MIT PhD-level AI Agent Implementation
 */

import express from 'express';
import { TerraAgent } from './agents/terra-agent.js';
import { AgentConfig } from './types/agent-types.js';

// Initialize Express server for AI Agent API
const app = express();
const port = process.env.TERRA_AGENT_PORT || 3001;

app.use(express.json());

// Default configuration for TerraAgent
const defaultConfig: AgentConfig = {
  model: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are TerraAgent, an expert AI real estate assistant.',
  },
  memory: {
    enabled: true,
    vectorStore: 'local',
    embeddingModel: 'text-embedding-ada-002',
    maxMemories: 10000,
    retrievalCount: 5,
  },
  knowledge: {
    enabled: true,
    sources: [],
    updateFrequency: 'daily',
  },
  tools: {
    mcpServer: '../mcp-server/dist/index.js',
    availableTools: ['property-search', 'property-analysis', 'market-analysis'],
    toolTimeout: 30000,
  },
};

// Initialize TerraAgent
let terraAgent: TerraAgent;

async function initializeAgent() {
  try {
    terraAgent = new TerraAgent(defaultConfig);
    console.log('🤖 TerraAgent AI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize TerraAgent:', error);
    process.exit(1);
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous', sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const request = {
      requestId: `req_${Date.now()}`,
      timestamp: new Date(),
      input: message,
      inputType: 'natural_language' as const,
      context: {
        userId,
        userProfile: {
          id: userId,
          preferences: {
            propertyTypes: ['residential'],
            locations: [],
            features: [],
          },
          expertiseLevel: 'intermediate' as const,
          interactionHistory: {
            totalInteractions: 0,
            lastInteraction: new Date(),
            commonQueries: [],
            satisfactionRating: 0,
          },
        },
        conversationId: sessionId || `conv_${Date.now()}`,
        messageHistory: [],
        currentTopic: '',
        detectedIntent: '',
        confidence: 0,
      },
    };

    const response = await terraAgent.execute(request);

    res.json({
      success: true,
      response: response.content,
      confidence: response.confidence,
      suggestions: response.suggestions,
      toolsUsed: response.toolsUsed,
      processingTime: response.processingTime,
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'TerraAgent AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/capabilities', (req, res) => {
  if (!terraAgent) {
    return res.status(503).json({ error: 'Agent not initialized' });
  }

  res.json({
    capabilities: terraAgent.capabilities,
    config: {
      model: terraAgent.config.model,
      tools: terraAgent.config.tools.availableTools,
    },
  });
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { interactionId, rating, feedback, helpful } = req.body;

    // Store feedback for learning
    const interaction = {
      interactionId,
      sessionId: 'feedback_session',
      timestamp: new Date(),
      request: {} as any,
      response: {} as any,
      userFeedback: {
        rating,
        feedback,
        helpful,
      },
      learningData: {
        successfulTools: [],
        failedTools: [],
        improvedResponses: [],
        userSatisfaction: rating,
      },
    };

    await terraAgent.learn(interaction);

    res.json({ success: true, message: 'Feedback received and processed' });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to process feedback' });
  }
});

// Start server
async function startServer() {
  await initializeAgent();

  app.listen(port, () => {
    console.log(`🚀 TerraAgent AI Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🤖 Chat endpoint: http://localhost:${port}/api/chat`);
    console.log(`📋 Capabilities: http://localhost:${port}/api/capabilities`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down TerraAgent AI gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down TerraAgent AI gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start TerraAgent AI server:', error);
  process.exit(1);
});

export { terraAgent };
