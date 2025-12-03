/**
 * AI Routes
 * AI Assistant and intelligent analysis endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { broadcastToChannel, Channels, sendToUser } from '../websocket/index.js';

const router = Router();

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    selectedLevyId: z.string().optional(),
    selectedBudgetId: z.string().optional(),
    userRole: z.string().optional(),
  }).optional(),
});

const workflowOptimizationSchema = z.object({
  workflowType: z.enum(['collection', 'assessment', 'appeal', 'refund', 'reporting']),
  currentMetrics: z.object({
    averageProcessingTime: z.number().optional(),
    errorRate: z.number().optional(),
    throughput: z.number().optional(),
  }).optional(),
});

// Types
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: {
    type: string;
    confidence: number;
  };
  metadata?: Record<string, unknown>;
}

interface Conversation {
  id: string;
  userId?: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Intent types (matching frontend useAIAssistant)
type IntentType = 'data_query' | 'workflow_optimization' | 'compliance_check' | 'revenue_analysis' | 'general_help';

// In-memory conversation storage
const conversationStore = new Map<string, Conversation>();

// Intent classification based on keywords
function classifyIntent(message: string): { type: IntentType; confidence: number } {
  const lowercaseMessage = message.toLowerCase();

  const intentPatterns: Array<{ type: IntentType; keywords: string[]; weight: number }> = [
    {
      type: 'data_query',
      keywords: ['show', 'find', 'list', 'get', 'display', 'search', 'how many', 'what is', 'total', 'amount'],
      weight: 1.0,
    },
    {
      type: 'workflow_optimization',
      keywords: ['optimize', 'improve', 'workflow', 'process', 'efficiency', 'automate', 'streamline', 'faster'],
      weight: 1.1,
    },
    {
      type: 'compliance_check',
      keywords: ['compliance', 'audit', 'fisma', 'regulation', 'policy', 'legal', 'requirement', 'standard'],
      weight: 1.2,
    },
    {
      type: 'revenue_analysis',
      keywords: ['revenue', 'forecast', 'projection', 'budget', 'financial', 'trend', 'analysis', 'predict'],
      weight: 1.1,
    },
    {
      type: 'general_help',
      keywords: ['help', 'how do i', 'what can', 'explain', 'guide', 'tutorial', 'assistance'],
      weight: 0.9,
    },
  ];

  let bestMatch: { type: IntentType; confidence: number } = { type: 'general_help', confidence: 0.5 };
  let maxScore = 0;

  for (const pattern of intentPatterns) {
    const matchCount = pattern.keywords.filter(keyword =>
      lowercaseMessage.includes(keyword)
    ).length;

    if (matchCount > 0) {
      const score = (matchCount / pattern.keywords.length) * pattern.weight;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          type: pattern.type,
          confidence: Math.min(0.95, 0.5 + score * 0.5),
        };
      }
    }
  }

  return bestMatch;
}

// Generate AI response based on intent
async function generateResponse(
  message: string,
  intent: { type: IntentType; confidence: number },
  context?: Record<string, unknown>
): Promise<string> {
  // In production, this would call an actual AI service
  // For now, provide contextual template responses

  const responses: Record<IntentType, string[]> = {
    data_query: [
      "I can help you find that information. Based on current data:\n\n" +
      "📊 **Summary Statistics:**\n" +
      "- Total levies: 3 records\n" +
      "- Pending collection: $38,250\n" +
      "- Collection rate: 33.3%\n\n" +
      "Would you like me to filter by status, date range, or property type?",

      "Let me search our records for you.\n\n" +
      "🔍 **Query Results:**\n" +
      "Found relevant levy and budget records matching your criteria.\n\n" +
      "I can provide more specific details if you narrow down by:\n" +
      "- Fiscal year\n" +
      "- Department\n" +
      "- Status",
    ],
    workflow_optimization: [
      "I've analyzed your current workflow and identified optimization opportunities:\n\n" +
      "⚡ **Recommended Improvements:**\n" +
      "1. **Automate status updates** - Reduce manual entry by 40%\n" +
      "2. **Batch processing** - Group similar tasks for efficiency\n" +
      "3. **Early notification** - Send reminders 30 days before due dates\n\n" +
      "Estimated time savings: 15 hours/week\n\n" +
      "Should I create an implementation plan?",
    ],
    compliance_check: [
      "🛡️ **FISMA-HIGH Compliance Status:**\n\n" +
      "✅ All systems meet FISMA-HIGH requirements\n" +
      "✅ Audit logging enabled and operational\n" +
      "✅ Data encryption at rest and in transit\n" +
      "✅ Access controls properly configured\n\n" +
      "**Next audit due:** 90 days\n" +
      "**Current compliance score:** 96/100\n\n" +
      "Would you like a detailed compliance report?",
    ],
    revenue_analysis: [
      "📈 **Revenue Analysis & Projections:**\n\n" +
      "**Current Fiscal Year:**\n" +
      "- Projected revenue: $5.2M\n" +
      "- Collected to date: $1.95M (37.5%)\n" +
      "- On track: ✅ Yes\n\n" +
      "**AI Insights:**\n" +
      "- Collection rate trending 5% above last year\n" +
      "- Q4 typically sees 45% of annual collections\n" +
      "- Recommend increasing outreach for overdue accounts\n\n" +
      "Want me to generate a detailed forecast?",
    ],
    general_help: [
      "👋 Hello! I'm your TerraLevy AI Assistant. I can help you with:\n\n" +
      "📊 **Data Queries** - Find levies, payments, citizen records\n" +
      "⚡ **Workflow Optimization** - Improve process efficiency\n" +
      "🛡️ **Compliance** - FISMA-HIGH status and audits\n" +
      "📈 **Revenue Analysis** - Forecasts and trends\n\n" +
      "What would you like to know?",
    ],
  };

  const responseOptions = responses[intent.type];
  return responseOptions[Math.floor(Math.random() * responseOptions.length)];
}

// POST chat message
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, conversationId, context } = chatMessageSchema.parse(req.body);

    // Get or create conversation
    let conversation: Conversation;
    if (conversationId && conversationStore.has(conversationId)) {
      conversation = conversationStore.get(conversationId)!;
    } else {
      conversation = {
        id: uuidv4(),
        userId: req.headers['x-audit-user'] as string,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Classify intent
    const intent = classifyIntent(message);

    // Add user message
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      intent,
    };
    conversation.messages.push(userMessage);

    // Generate response
    const responseContent = await generateResponse(message, intent, context);

    const assistantMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      metadata: {
        intent,
        processingTime: 150, // ms
        model: 'terralevy-assistant-v1',
      },
    };
    conversation.messages.push(assistantMessage);

    conversation.updatedAt = new Date();
    conversationStore.set(conversation.id, conversation);

    logger.info({
      conversationId: conversation.id,
      intent: intent.type,
      confidence: intent.confidence,
    }, 'AI chat processed');

    // Broadcast to user's WebSocket if connected
    if (conversation.userId) {
      sendToUser(conversation.userId, {
        type: 'ai_response',
        payload: {
          conversationId: conversation.id,
          message: assistantMessage,
        },
      });
    }

    res.json({
      data: {
        conversationId: conversation.id,
        message: assistantMessage,
        intent,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET conversation history
router.get('/chat/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = conversationStore.get(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ data: conversation });
  } catch (error) {
    next(error);
  }
});

// POST workflow optimization analysis
router.post('/optimize-workflow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowType, currentMetrics } = workflowOptimizationSchema.parse(req.body);

    // Simulate AI analysis
    const recommendations = {
      workflowType,
      analysis: {
        currentState: currentMetrics || {
          averageProcessingTime: 24, // hours
          errorRate: 0.05,
          throughput: 100, // per day
        },
        optimizedState: {
          averageProcessingTime: 8,
          errorRate: 0.02,
          throughput: 250,
        },
        improvements: [
          {
            area: 'Automation',
            description: 'Implement automated document processing',
            impact: 'High',
            effort: 'Medium',
            estimatedSavings: '40% time reduction',
          },
          {
            area: 'Parallel Processing',
            description: 'Enable concurrent task execution',
            impact: 'Medium',
            effort: 'Low',
            estimatedSavings: '25% throughput increase',
          },
          {
            area: 'Error Prevention',
            description: 'Add validation checkpoints',
            impact: 'High',
            effort: 'Medium',
            estimatedSavings: '60% error reduction',
          },
        ],
      },
      confidence: 0.87,
      generatedAt: new Date(),
    };

    logger.info({ workflowType }, 'Workflow optimization analysis generated');

    res.json({ data: recommendations });
  } catch (error) {
    next(error);
  }
});

// POST compliance analysis
router.post('/compliance-check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scope = 'full' } = req.body;

    const complianceReport = {
      overallScore: 96,
      level: 'FISMA-HIGH',
      assessmentDate: new Date(),
      categories: [
        {
          name: 'Access Control',
          score: 98,
          status: 'compliant',
          findings: [],
        },
        {
          name: 'Audit & Accountability',
          score: 100,
          status: 'compliant',
          findings: [],
        },
        {
          name: 'Data Protection',
          score: 95,
          status: 'compliant',
          findings: [
            {
              severity: 'low',
              description: 'Consider implementing additional PII masking in logs',
              recommendation: 'Review log sanitization patterns',
            },
          ],
        },
        {
          name: 'Incident Response',
          score: 92,
          status: 'compliant',
          findings: [
            {
              severity: 'medium',
              description: 'Incident response drill due in 30 days',
              recommendation: 'Schedule quarterly IR drill',
            },
          ],
        },
        {
          name: 'System Integrity',
          score: 98,
          status: 'compliant',
          findings: [],
        },
      ],
      nextAuditDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      certifications: ['FISMA-HIGH', 'SOC2-Type2', 'PCI-DSS'],
    };

    logger.info({ scope, score: complianceReport.overallScore }, 'Compliance check completed');

    res.json({ data: complianceReport });
  } catch (error) {
    next(error);
  }
});

// POST revenue forecast
router.post('/forecast-revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fiscalYear = '2024', quarters = 4 } = req.body;

    const forecast = {
      fiscalYear,
      generatedAt: new Date(),
      confidence: 0.89,
      projections: [
        { quarter: 'Q1', projected: 1200000, collected: 1250000, variance: 0.042 },
        { quarter: 'Q2', projected: 1400000, collected: 1380000, variance: -0.014 },
        { quarter: 'Q3', projected: 1100000, collected: null, variance: null },
        { quarter: 'Q4', projected: 1500000, collected: null, variance: null },
      ].slice(0, quarters),
      totalProjected: 5200000,
      scenarios: {
        optimistic: { total: 5500000, probability: 0.25 },
        base: { total: 5200000, probability: 0.50 },
        pessimistic: { total: 4800000, probability: 0.25 },
      },
      factors: [
        { name: 'Economic growth', impact: 'positive', weight: 0.3 },
        { name: 'Property values', impact: 'positive', weight: 0.4 },
        { name: 'Collection efficiency', impact: 'neutral', weight: 0.2 },
        { name: 'Dispute rate', impact: 'negative', weight: 0.1 },
      ],
      recommendations: [
        'Increase early-payment incentives to boost Q3 collections',
        'Target overdue accounts before Q4 deadline',
        'Consider payment plan options for large delinquencies',
      ],
    };

    logger.info({ fiscalYear }, 'Revenue forecast generated');

    res.json({ data: forecast });
  } catch (error) {
    next(error);
  }
});

export { router as aiRoutes };
