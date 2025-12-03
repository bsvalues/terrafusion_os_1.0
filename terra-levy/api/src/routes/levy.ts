/**
 * Levy Routes
 * Tax and levy management with FISMA-HIGH compliance
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { broadcastToChannel, Channels } from '../websocket/index.js';

const router = Router();

// Validation schemas
const levySchema = z.object({
  parcelId: z.string().min(1),
  propertyAddress: z.string().min(1),
  ownerName: z.string().min(1),
  ownerId: z.string().optional(),
  assessedValue: z.number().positive(),
  taxableValue: z.number().positive(),
  levyAmount: z.number().positive(),
  levyType: z.enum(['property', 'special_assessment', 'improvement_district', 'school', 'municipal']),
  status: z.enum(['pending', 'paid', 'overdue', 'disputed', 'exempt', 'deferred']).default('pending'),
  fiscalYear: z.string().regex(/^\d{4}$/),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
});

const levyUpdateSchema = levySchema.partial();

// Types
interface LevyRecord {
  id: string;
  parcelId: string;
  propertyAddress: string;
  ownerName: string;
  ownerId?: string;
  assessedValue: number;
  taxableValue: number;
  levyAmount: number;
  levyType: 'property' | 'special_assessment' | 'improvement_district' | 'school' | 'municipal';
  status: 'pending' | 'paid' | 'overdue' | 'disputed' | 'exempt' | 'deferred';
  fiscalYear: string;
  dueDate: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  complianceStatus: {
    level: 'FISMA-HIGH';
    auditTrail: Array<{
      action: string;
      timestamp: Date;
      userId?: string;
      details?: string;
    }>;
  };
  aiRecommendation?: {
    action: string;
    confidence: number;
    reasoning: string;
  };
}

// In-memory storage
const levyStore = new Map<string, LevyRecord>();

// Seed data
const seedLevies: Omit<LevyRecord, 'id' | 'createdAt' | 'updatedAt' | 'complianceStatus'>[] = [
  {
    parcelId: 'PAR-2024-001234',
    propertyAddress: '123 Main Street, Springfield, IL 62701',
    ownerName: 'John Smith',
    ownerId: 'CIT-001',
    assessedValue: 250000,
    taxableValue: 225000,
    levyAmount: 4500,
    levyType: 'property',
    status: 'pending',
    fiscalYear: '2024',
    dueDate: '2024-12-31T23:59:59Z',
  },
  {
    parcelId: 'PAR-2024-001235',
    propertyAddress: '456 Oak Avenue, Springfield, IL 62702',
    ownerName: 'Jane Doe',
    ownerId: 'CIT-002',
    assessedValue: 375000,
    taxableValue: 337500,
    levyAmount: 6750,
    levyType: 'property',
    status: 'paid',
    fiscalYear: '2024',
    dueDate: '2024-12-31T23:59:59Z',
  },
  {
    parcelId: 'PAR-2024-001236',
    propertyAddress: '789 Elm Drive, Springfield, IL 62703',
    ownerName: 'Acme Corporation',
    ownerId: 'BUS-001',
    assessedValue: 1500000,
    taxableValue: 1350000,
    levyAmount: 27000,
    levyType: 'property',
    status: 'overdue',
    fiscalYear: '2024',
    dueDate: '2024-06-30T23:59:59Z',
  },
];

seedLevies.forEach(data => {
  const id = uuidv4();
  levyStore.set(id, {
    id,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    complianceStatus: {
      level: 'FISMA-HIGH',
      auditTrail: [{ action: 'created', timestamp: new Date() }],
    },
  });
});

// GET all levies with filtering
router.get('/', async (req: Request, res: Response) => {
  const { status, fiscalYear, levyType, minAmount, maxAmount } = req.query;

  let levies = Array.from(levyStore.values());

  // Apply filters
  if (status) {
    levies = levies.filter(l => l.status === status);
  }
  if (fiscalYear) {
    levies = levies.filter(l => l.fiscalYear === fiscalYear);
  }
  if (levyType) {
    levies = levies.filter(l => l.levyType === levyType);
  }
  if (minAmount) {
    levies = levies.filter(l => l.levyAmount >= Number(minAmount));
  }
  if (maxAmount) {
    levies = levies.filter(l => l.levyAmount <= Number(maxAmount));
  }

  // Summary statistics
  const summary = {
    totalLevies: levies.length,
    totalAmount: levies.reduce((sum, l) => sum + l.levyAmount, 0),
    byStatus: {
      pending: levies.filter(l => l.status === 'pending').length,
      paid: levies.filter(l => l.status === 'paid').length,
      overdue: levies.filter(l => l.status === 'overdue').length,
      disputed: levies.filter(l => l.status === 'disputed').length,
    },
    collectionRate: levies.length > 0
      ? (levies.filter(l => l.status === 'paid').length / levies.length * 100).toFixed(2)
      : 0,
  };

  res.json({
    data: levies,
    summary,
    meta: {
      count: levies.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// GET single levy
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levy = levyStore.get(req.params.id);
    if (!levy) {
      throw new NotFoundError('Levy record');
    }
    res.json({ data: levy });
  } catch (error) {
    next(error);
  }
});

// GET levy by parcel ID
router.get('/parcel/:parcelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levies = Array.from(levyStore.values()).filter(
      l => l.parcelId === req.params.parcelId
    );
    res.json({
      data: levies,
      meta: { count: levies.length },
    });
  } catch (error) {
    next(error);
  }
});

// POST create new levy
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = levySchema.parse(req.body);

    const id = uuidv4();
    const levy: LevyRecord = {
      id,
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
      complianceStatus: {
        level: 'FISMA-HIGH',
        auditTrail: [{
          action: 'created',
          timestamp: new Date(),
          userId: req.headers['x-audit-user'] as string,
        }],
      },
    };

    levyStore.set(id, levy);

    logger.info({ levyId: id, parcelId: levy.parcelId }, 'Levy record created');

    broadcastToChannel(Channels.LEVY_UPDATES, {
      type: 'levy_created',
      payload: levy,
    });

    res.status(201).json({ data: levy });
  } catch (error) {
    next(error);
  }
});

// PUT update levy
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = levyStore.get(req.params.id);
    if (!existing) {
      throw new NotFoundError('Levy record');
    }

    const validated = levyUpdateSchema.parse(req.body);

    const updated: LevyRecord = {
      ...existing,
      ...validated,
      updatedAt: new Date(),
      complianceStatus: {
        ...existing.complianceStatus,
        auditTrail: [
          ...existing.complianceStatus.auditTrail,
          {
            action: 'updated',
            timestamp: new Date(),
            userId: req.headers['x-audit-user'] as string,
            details: JSON.stringify(validated),
          },
        ],
      },
    };

    levyStore.set(req.params.id, updated);

    logger.info({ levyId: req.params.id }, 'Levy record updated');

    broadcastToChannel(Channels.LEVY_UPDATES, {
      type: 'levy_update',
      payload: { levyId: req.params.id, changes: validated },
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

// POST mark levy as paid
router.post('/:id/pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levy = levyStore.get(req.params.id);
    if (!levy) {
      throw new NotFoundError('Levy record');
    }

    const { paymentId, paymentMethod, amount } = req.body;

    levy.status = 'paid';
    levy.updatedAt = new Date();
    levy.complianceStatus.auditTrail.push({
      action: 'payment_received',
      timestamp: new Date(),
      userId: req.headers['x-audit-user'] as string,
      details: JSON.stringify({ paymentId, paymentMethod, amount }),
    });

    levyStore.set(req.params.id, levy);

    logger.info({ levyId: req.params.id, paymentId }, 'Levy payment recorded');

    broadcastToChannel(Channels.LEVY_UPDATES, {
      type: 'levy_paid',
      payload: { levyId: req.params.id, paymentId },
    });

    broadcastToChannel(Channels.PAYMENT_UPDATES, {
      type: 'payment_completed',
      payload: { levyId: req.params.id, paymentId, amount },
    });

    res.json({ data: levy });
  } catch (error) {
    next(error);
  }
});

// POST dispute levy
router.post('/:id/dispute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levy = levyStore.get(req.params.id);
    if (!levy) {
      throw new NotFoundError('Levy record');
    }

    const { reason, evidence } = req.body;

    levy.status = 'disputed';
    levy.updatedAt = new Date();
    levy.complianceStatus.auditTrail.push({
      action: 'disputed',
      timestamp: new Date(),
      userId: req.headers['x-audit-user'] as string,
      details: JSON.stringify({ reason, evidence }),
    });

    levyStore.set(req.params.id, levy);

    logger.info({ levyId: req.params.id }, 'Levy disputed');

    broadcastToChannel(Channels.LEVY_UPDATES, {
      type: 'levy_disputed',
      payload: { levyId: req.params.id, reason },
    });

    res.json({ data: levy });
  } catch (error) {
    next(error);
  }
});

// GET levy analytics
router.get('/analytics/overview', async (_req: Request, res: Response) => {
  const levies = Array.from(levyStore.values());

  const analytics = {
    totalRecords: levies.length,
    totalAssessedValue: levies.reduce((sum, l) => sum + l.assessedValue, 0),
    totalLevyAmount: levies.reduce((sum, l) => sum + l.levyAmount, 0),
    collectedAmount: levies
      .filter(l => l.status === 'paid')
      .reduce((sum, l) => sum + l.levyAmount, 0),
    outstandingAmount: levies
      .filter(l => l.status !== 'paid')
      .reduce((sum, l) => sum + l.levyAmount, 0),
    collectionRate: levies.length > 0
      ? levies.filter(l => l.status === 'paid').length / levies.length
      : 0,
    byType: Object.entries(
      levies.reduce((acc, l) => {
        acc[l.levyType] = (acc[l.levyType] || 0) + l.levyAmount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, amount]) => ({ type, amount })),
    overdueCount: levies.filter(l => l.status === 'overdue').length,
    disputedCount: levies.filter(l => l.status === 'disputed').length,
  };

  res.json({ data: analytics });
});

export { router as levyRoutes };
