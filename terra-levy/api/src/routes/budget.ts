/**
 * Budget Routes
 * CRUD operations for budget management with FISMA-HIGH compliance
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { broadcastToChannel, Channels } from '../websocket/index.js';

const router = Router();

// Validation schemas
const budgetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  allocatedAmount: z.number().positive(),
  spentAmount: z.number().min(0).default(0),
  fiscalYear: z.string().regex(/^\d{4}$/),
  department: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  description: z.string().optional(),
  complianceStatus: z.object({
    level: z.literal('FISMA-HIGH'),
    lastAudit: z.string().datetime().optional(),
    complianceScore: z.number().min(0).max(100).optional(),
  }).optional(),
});

const budgetUpdateSchema = budgetCategorySchema.partial();

// In-memory storage (replace with database in production)
interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  fiscalYear: string;
  department: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  complianceStatus: {
    level: 'FISMA-HIGH';
    lastAudit?: string;
    complianceScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  aiRecommendation?: {
    action: string;
    confidence: number;
    reasoning: string;
  };
}

const budgetStore = new Map<string, BudgetCategory>();

// Seed initial data
const seedData: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Property Tax Collection',
    allocatedAmount: 5000000,
    spentAmount: 1250000,
    fiscalYear: '2024',
    department: 'Revenue',
    priority: 'critical',
    description: 'Annual property tax collection operations',
    complianceStatus: { level: 'FISMA-HIGH', complianceScore: 98 },
  },
  {
    name: 'Assessment Technology',
    allocatedAmount: 800000,
    spentAmount: 350000,
    fiscalYear: '2024',
    department: 'IT',
    priority: 'high',
    description: 'GIS and assessment software maintenance',
    complianceStatus: { level: 'FISMA-HIGH', complianceScore: 95 },
  },
  {
    name: 'Citizen Services',
    allocatedAmount: 1200000,
    spentAmount: 600000,
    fiscalYear: '2024',
    department: 'Public Affairs',
    priority: 'high',
    description: 'Citizen portal and support services',
    complianceStatus: { level: 'FISMA-HIGH', complianceScore: 92 },
  },
];

seedData.forEach(data => {
  const id = uuidv4();
  budgetStore.set(id, {
    id,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

// GET all budget categories
router.get('/', async (_req: Request, res: Response) => {
  const budgets = Array.from(budgetStore.values());

  // Calculate summary statistics
  const summary = {
    totalAllocated: budgets.reduce((sum, b) => sum + b.allocatedAmount, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.spentAmount, 0),
    categoryCount: budgets.length,
    averageComplianceScore: budgets.reduce((sum, b) => sum + (b.complianceStatus.complianceScore || 0), 0) / budgets.length,
  };

  res.json({
    data: budgets,
    summary,
    meta: {
      count: budgets.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// GET single budget category
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = budgetStore.get(req.params.id);
    if (!budget) {
      throw new NotFoundError('Budget category');
    }
    res.json({ data: budget });
  } catch (error) {
    next(error);
  }
});

// POST create new budget category
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = budgetCategorySchema.parse(req.body);

    const id = uuidv4();
    const budget: BudgetCategory = {
      id,
      ...validated,
      complianceStatus: validated.complianceStatus || { level: 'FISMA-HIGH' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    budgetStore.set(id, budget);

    logger.info({ budgetId: id, name: budget.name }, 'Budget category created');

    // Broadcast to WebSocket subscribers
    broadcastToChannel(Channels.BUDGET_UPDATES, {
      type: 'budget_created',
      payload: budget,
    });

    res.status(201).json({ data: budget });
  } catch (error) {
    next(error);
  }
});

// PUT update budget category
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = budgetStore.get(req.params.id);
    if (!existing) {
      throw new NotFoundError('Budget category');
    }

    const validated = budgetUpdateSchema.parse(req.body);

    const updated: BudgetCategory = {
      ...existing,
      ...validated,
      updatedAt: new Date(),
    };

    budgetStore.set(req.params.id, updated);

    logger.info({ budgetId: req.params.id }, 'Budget category updated');

    // Broadcast update
    broadcastToChannel(Channels.BUDGET_UPDATES, {
      type: 'budget_update',
      payload: {
        categoryId: req.params.id,
        changes: validated,
        budget: updated,
      },
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE budget category
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = budgetStore.get(req.params.id);
    if (!existing) {
      throw new NotFoundError('Budget category');
    }

    budgetStore.delete(req.params.id);

    logger.info({ budgetId: req.params.id }, 'Budget category deleted');

    // Broadcast deletion
    broadcastToChannel(Channels.BUDGET_UPDATES, {
      type: 'budget_deleted',
      payload: { categoryId: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET budget summary by department
router.get('/summary/by-department', async (_req: Request, res: Response) => {
  const budgets = Array.from(budgetStore.values());

  const byDepartment = budgets.reduce((acc, budget) => {
    if (!acc[budget.department]) {
      acc[budget.department] = {
        department: budget.department,
        totalAllocated: 0,
        totalSpent: 0,
        categories: 0,
      };
    }
    acc[budget.department].totalAllocated += budget.allocatedAmount;
    acc[budget.department].totalSpent += budget.spentAmount;
    acc[budget.department].categories += 1;
    return acc;
  }, {} as Record<string, { department: string; totalAllocated: number; totalSpent: number; categories: number }>);

  res.json({
    data: Object.values(byDepartment),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// POST AI recommendation request
router.post('/:id/ai-recommendation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = budgetStore.get(req.params.id);
    if (!budget) {
      throw new NotFoundError('Budget category');
    }

    // Simulate AI recommendation (replace with actual AI service call)
    const utilizationRate = budget.spentAmount / budget.allocatedAmount;
    let recommendation: BudgetCategory['aiRecommendation'];

    if (utilizationRate > 0.9) {
      recommendation = {
        action: 'request_additional_funding',
        confidence: 0.85,
        reasoning: `Budget utilization at ${(utilizationRate * 100).toFixed(1)}%. Consider requesting supplemental allocation to avoid shortfall.`,
      };
    } else if (utilizationRate < 0.3) {
      recommendation = {
        action: 'reallocate_funds',
        confidence: 0.78,
        reasoning: `Budget utilization at ${(utilizationRate * 100).toFixed(1)}%. Consider reallocating unused funds to higher-priority categories.`,
      };
    } else {
      recommendation = {
        action: 'maintain_current_allocation',
        confidence: 0.92,
        reasoning: `Budget utilization at ${(utilizationRate * 100).toFixed(1)}%. Current allocation is appropriate for projected needs.`,
      };
    }

    // Update budget with recommendation
    budget.aiRecommendation = recommendation;
    budget.updatedAt = new Date();
    budgetStore.set(req.params.id, budget);

    res.json({
      data: {
        budgetId: req.params.id,
        recommendation,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as budgetRoutes };
