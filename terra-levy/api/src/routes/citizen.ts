/**
 * Citizen Routes
 * Citizen profile and interaction management
 */

import { NextFunction, Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { NotFoundError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation schemas
const citizenSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  }),
  preferredContactMethod: z.enum(['email', 'phone', 'mail']).default('email'),
  notificationPreferences: z.object({
    paymentReminders: z.boolean().default(true),
    assessmentUpdates: z.boolean().default(true),
    newsletterSubscription: z.boolean().default(false),
  }).optional(),
});

const citizenUpdateSchema = citizenSchema.partial();

// Types
interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  preferredContactMethod: 'email' | 'phone' | 'mail';
  notificationPreferences: {
    paymentReminders: boolean;
    assessmentUpdates: boolean;
    newsletterSubscription: boolean;
  };
  linkedParcels: string[];
  createdAt: Date;
  updatedAt: Date;
  complianceStatus: {
    level: 'FISMA-HIGH';
    dataClassification: 'PII';
    consentDate?: Date;
    lastVerified?: Date;
  };
  interactionHistory: Array<{
    id: string;
    type: 'inquiry' | 'payment' | 'dispute' | 'update' | 'notification';
    timestamp: Date;
    summary: string;
    resolution?: string;
  }>;
}

// In-memory storage
const citizenStore = new Map<string, Citizen>();

// Seed data
const seedCitizens: Omit<Citizen, 'id' | 'createdAt' | 'updatedAt' | 'complianceStatus' | 'interactionHistory'>[] = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '555-123-4567',
    address: {
      street: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
    preferredContactMethod: 'email',
    notificationPreferences: {
      paymentReminders: true,
      assessmentUpdates: true,
      newsletterSubscription: false,
    },
    linkedParcels: ['PAR-2024-001234'],
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@email.com',
    phone: '555-987-6543',
    address: {
      street: '456 Oak Avenue',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
    },
    preferredContactMethod: 'phone',
    notificationPreferences: {
      paymentReminders: true,
      assessmentUpdates: true,
      newsletterSubscription: true,
    },
    linkedParcels: ['PAR-2024-001235'],
  },
];

seedCitizens.forEach(data => {
  const id = `CIT-${uuidv4().slice(0, 8).toUpperCase()}`;
  citizenStore.set(id, {
    id,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    complianceStatus: {
      level: 'FISMA-HIGH',
      dataClassification: 'PII',
      consentDate: new Date(),
    },
    interactionHistory: [],
  });
});

// GET all citizens (with PII protection)
router.get('/', async (req: Request, res: Response) => {
  const { search, limit = '50', offset = '0' } = req.query;

  let citizens = Array.from(citizenStore.values());

  // Search by name or email
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    citizens = citizens.filter(c =>
      c.firstName.toLowerCase().includes(searchLower) ||
      c.lastName.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const total = citizens.length;
  citizens = citizens.slice(Number(offset), Number(offset) + Number(limit));

  // Mask sensitive data for list view
  const maskedCitizens = citizens.map(c => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: maskEmail(c.email),
    city: c.address.city,
    state: c.address.state,
    linkedParcels: c.linkedParcels.length,
    createdAt: c.createdAt,
  }));

  res.json({
    data: maskedCitizens,
    meta: {
      total,
      limit: Number(limit),
      offset: Number(offset),
      timestamp: new Date().toISOString(),
    },
  });
});

// GET single citizen (full details for authorized users)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizen = citizenStore.get(req.params.id);
    if (!citizen) {
      throw new NotFoundError('Citizen');
    }

    // Log PII access for compliance
    logger.info({
      citizenId: req.params.id,
      accessedBy: req.headers['x-audit-user'],
      action: 'pii_access',
    }, 'PII data accessed');

    res.json({ data: citizen });
  } catch (error) {
    next(error);
  }
});

// POST create citizen
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = citizenSchema.parse(req.body);

    const id = `CIT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const citizen: Citizen = {
      id,
      ...validated,
      notificationPreferences: validated.notificationPreferences || {
        paymentReminders: true,
        assessmentUpdates: true,
        newsletterSubscription: false,
      },
      linkedParcels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      complianceStatus: {
        level: 'FISMA-HIGH',
        dataClassification: 'PII',
        consentDate: new Date(),
      },
      interactionHistory: [{
        id: uuidv4(),
        type: 'update',
        timestamp: new Date(),
        summary: 'Account created',
      }],
    };

    citizenStore.set(id, citizen);

    logger.info({ citizenId: id }, 'Citizen record created');

    res.status(201).json({ data: citizen });
  } catch (error) {
    next(error);
  }
});

// PUT update citizen
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = citizenStore.get(req.params.id);
    if (!existing) {
      throw new NotFoundError('Citizen');
    }

    const validated = citizenUpdateSchema.parse(req.body);

    const updated: Citizen = {
      ...existing,
      ...validated,
      address: validated.address ? { ...existing.address, ...validated.address } : existing.address,
      notificationPreferences: validated.notificationPreferences
        ? { ...existing.notificationPreferences, ...validated.notificationPreferences }
        : existing.notificationPreferences,
      updatedAt: new Date(),
      interactionHistory: [
        ...existing.interactionHistory,
        {
          id: uuidv4(),
          type: 'update',
          timestamp: new Date(),
          summary: 'Profile updated',
        },
      ],
    };

    citizenStore.set(req.params.id, updated);

    logger.info({ citizenId: req.params.id }, 'Citizen record updated');

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

// POST link parcel to citizen
router.post('/:id/parcels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizen = citizenStore.get(req.params.id);
    if (!citizen) {
      throw new NotFoundError('Citizen');
    }

    const { parcelId } = req.body;
    if (!parcelId) {
      return res.status(400).json({ error: 'parcelId is required' });
    }

    if (!citizen.linkedParcels.includes(parcelId)) {
      citizen.linkedParcels.push(parcelId);
      citizen.updatedAt = new Date();
      citizen.interactionHistory.push({
        id: uuidv4(),
        type: 'update',
        timestamp: new Date(),
        summary: `Parcel ${parcelId} linked to account`,
      });
      citizenStore.set(req.params.id, citizen);
    }

    res.json({ data: citizen });
  } catch (error) {
    next(error);
  }
});

// POST record interaction
router.post('/:id/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizen = citizenStore.get(req.params.id);
    if (!citizen) {
      throw new NotFoundError('Citizen');
    }

    const { type, summary, resolution } = req.body;

    const interaction = {
      id: uuidv4(),
      type: type as Citizen['interactionHistory'][0]['type'],
      timestamp: new Date(),
      summary,
      resolution,
    };

    citizen.interactionHistory.push(interaction);
    citizen.updatedAt = new Date();
    citizenStore.set(req.params.id, citizen);

    logger.info({ citizenId: req.params.id, interactionType: type }, 'Interaction recorded');

    res.status(201).json({ data: interaction });
  } catch (error) {
    next(error);
  }
});

// GET citizen interaction history
router.get('/:id/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizen = citizenStore.get(req.params.id);
    if (!citizen) {
      throw new NotFoundError('Citizen');
    }

    const { type, limit = '50' } = req.query;

    let interactions = [...citizen.interactionHistory].reverse();

    if (type) {
      interactions = interactions.filter(i => i.type === type);
    }

    interactions = interactions.slice(0, Number(limit));

    res.json({
      data: interactions,
      meta: {
        total: citizen.interactionHistory.length,
        count: interactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to mask email
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export { router as citizenRoutes };

