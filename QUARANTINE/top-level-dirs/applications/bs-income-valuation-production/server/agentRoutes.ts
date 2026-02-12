import { Request, Response, Router } from 'express';
import { ValuationAgent, DataCleanerAgent, ReportingAgent } from '../agents';
import { storage } from './storage';
import { authenticateJWT } from './auth';
import { asyncHandler, AuthorizationError, NotFoundError } from './errorHandler';

// Define interface for authenticated request with user payload
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
}

// Define interface for report generation options
interface ReportOptions {
  period: 'monthly' | 'quarterly' | 'yearly';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

export const agentRouter = Router();

// Initialize agents
const valuationAgent = new ValuationAgent();
const dataCleanerAgent = new DataCleanerAgent();
const reportingAgent = new ReportingAgent();

// Valuation analysis endpoint
agentRouter.get(
  '/analyze-income',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const incomes = await storage.getIncomesByUserId(userId);

    if (incomes.length === 0) {
      throw new NotFoundError('No income data found. Please add income sources before analyzing.');
    }

    try {
      const analysis = await valuationAgent.analyzeIncome(incomes);
      return res.json(analysis);
    } catch (error: any) {
      if (error.message.includes('Income data must be')) {
        throw new Error('Income analysis failed: Invalid income data format');
      } else if (error.message.includes('Cannot analyze income')) {
        throw new NotFoundError('Cannot analyze income: No income data provided');
      } else {
        // Re-throw with a more user-friendly message
        throw new Error(`Income analysis failed: ${error.message}`);
      }
    }
  })
);

// Anomaly detection endpoint
agentRouter.get(
  '/detect-anomalies',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length < 2) {
      throw new NotFoundError('Insufficient valuation history for anomaly detection. You need at least two valuations to detect anomalies.');
    }

    try {
      const results = await valuationAgent.detectAnomalies(valuations);
      return res.json(results);
    } catch (error: any) {
      if (error.message.includes('Valuation history must be')) {
        throw new Error('Anomaly detection failed: Invalid valuation data format');
      } else {
        // Re-throw with a more user-friendly message
        throw new Error(`Anomaly detection failed: ${error.message}`);
      }
    }
  })
);

// Data quality analysis endpoint
agentRouter.get(
  '/analyze-data-quality',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const incomes = await storage.getIncomesByUserId(userId);

    if (incomes.length === 0) {
      throw new NotFoundError('No income data found. Please add income sources to analyze data quality.');
    }

    try {
      const analysis = await dataCleanerAgent.analyzeIncomeData(incomes);
      return res.json(analysis);
    } catch (error: any) {
      // Provide more specific error messages
      if (error.message.includes('Income data must be')) {
        throw new Error('Data quality analysis failed: Invalid income data format');
      } else {
        // Re-throw with a more descriptive message
        throw new Error(`Data quality analysis failed: ${error.message}`);
      }
    }
  })
);

// Generate valuation summary endpoint
agentRouter.get(
  '/valuation-summary',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    const incomes = await storage.getIncomesByUserId(userId);
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length === 0) {
      throw new NotFoundError('No valuation data found. Create your first valuation to get a summary.');
    }
    
    if (incomes.length === 0) {
      throw new NotFoundError('No income data found. Add income sources to generate a summary.');
    }

    try {
      const summary = await reportingAgent.generateValuationSummary(incomes, valuations);
      return res.json({ summary });
    } catch (error: any) {
      // Provide more specific error messages based on different validation failures
      if (error.message.includes('Income data must be')) {
        throw new Error('Failed to generate summary: Income data validation failed');
      } else if (error.message.includes('Valuation history must be')) {
        throw new Error('Failed to generate summary: Valuation data validation failed');
      } else if (error.message.includes('Cannot generate summary')) {
        throw new NotFoundError('Cannot generate summary: Insufficient valuation data');
      } else {
        // Re-throw the original error with prefix for better client-side handling
        throw new Error(`Summary generation failed: ${error.message}`);
      }
    }
  })
);

// Generate detailed report endpoint
agentRouter.post(
  '/generate-report',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest & { body: ReportOptions }, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userId = req.user.userId;
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid request: Request body must be a valid JSON object');
    }
    
    // Validate report options with defaults
    const period = req.body.period || 'monthly';
    if (!['monthly', 'quarterly', 'yearly'].includes(period)) {
      throw new Error(`Invalid period: ${period}. Must be one of 'monthly', 'quarterly', or 'yearly'`);
    }
    
    // Convert to boolean to ensure proper types
    const includeCharts = req.body.includeCharts !== undefined ? Boolean(req.body.includeCharts) : true;
    const includeInsights = req.body.includeInsights !== undefined ? Boolean(req.body.includeInsights) : true;
    const includeRecommendations = req.body.includeRecommendations !== undefined ? Boolean(req.body.includeRecommendations) : true;
    
    // Retrieve data
    const incomes = await storage.getIncomesByUserId(userId);
    const valuations = await storage.getValuationsByUserId(userId);

    if (valuations.length === 0) {
      throw new NotFoundError('No valuation data found. Create your first valuation to generate a report.');
    }
    
    if (incomes.length === 0) {
      throw new NotFoundError('No income data found. Add income sources to generate a comprehensive report.');
    }

    const reportOptions: ReportOptions = {
      period,
      includeCharts,
      includeInsights,
      includeRecommendations
    };

    try {
      const report = await reportingAgent.generateReport(incomes, valuations, reportOptions);
      return res.json(report);
    } catch (error: any) {
      // Enhanced error handling with more specific messages
      if (error.message.includes('Income data must be')) {
        throw new Error('Income data validation failed. Please ensure you have valid income data.');
      } else if (error.message.includes('Valuation history must be')) {
        throw new Error('Valuation data validation failed. Please ensure you have valid valuation data.');
      } else if (error.message.includes('Cannot generate report')) {
        throw new NotFoundError('Cannot generate report: No valuation data available. Please create valuations first.');
      } else {
        // Re-throw the original error
        throw error;
      }
    }
  })
);