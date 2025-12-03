/**
 * Payment Routes
 * Payment processing and tracking (delegates to Rust Collection Engine)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { NotFoundError, AppError } from '../middleware/errorHandler.js';
import { broadcastToChannel, Channels } from '../websocket/index.js';

const router = Router();

// Validation schemas
const paymentSchema = z.object({
  levyId: z.string().uuid(),
  citizenId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'ach', 'check', 'cash', 'wire_transfer']),
  paymentDetails: z.object({
    // For card payments (PCI compliance - only last 4 digits stored)
    cardLastFour: z.string().length(4).optional(),
    cardType: z.enum(['visa', 'mastercard', 'amex', 'discover']).optional(),
    // For ACH
    bankName: z.string().optional(),
    accountLastFour: z.string().length(4).optional(),
    // For check
    checkNumber: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zipCode: z.string(),
  }).optional(),
});

const refundSchema = z.object({
  reason: z.string().min(1),
  amount: z.number().positive().optional(), // Partial refund if provided
});

// Types
interface Payment {
  id: string;
  transactionId: string;
  levyId: string;
  citizenId: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'ach' | 'check' | 'cash' | 'wire_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentDetails?: {
    cardLastFour?: string;
    cardType?: string;
    bankName?: string;
    accountLastFour?: string;
    checkNumber?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  processingInfo: {
    processedAt?: Date;
    processorResponse?: string;
    authorizationCode?: string;
    settlementDate?: Date;
  };
  refundInfo?: {
    refundedAt: Date;
    refundAmount: number;
    reason: string;
    refundTransactionId: string;
  };
  createdAt: Date;
  updatedAt: Date;
  complianceStatus: {
    level: 'FISMA-HIGH';
    pciCompliant: boolean;
    auditTrail: Array<{
      action: string;
      timestamp: Date;
      userId?: string;
      details?: string;
    }>;
  };
}

// In-memory storage
const paymentStore = new Map<string, Payment>();

// Fee calculation based on payment method
function calculateFee(amount: number, method: Payment['paymentMethod']): number {
  const feeRates: Record<Payment['paymentMethod'], { percentage: number; fixed: number }> = {
    credit_card: { percentage: 0.029, fixed: 0.30 },
    debit_card: { percentage: 0.015, fixed: 0.25 },
    ach: { percentage: 0.008, fixed: 0 },
    check: { percentage: 0, fixed: 0 },
    cash: { percentage: 0, fixed: 0 },
    wire_transfer: { percentage: 0, fixed: 25 },
  };

  const rate = feeRates[method];
  return Number((amount * rate.percentage + rate.fixed).toFixed(2));
}

// Generate transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

// POST process payment
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = paymentSchema.parse(req.body);

    const id = uuidv4();
    const transactionId = generateTransactionId();
    const fee = calculateFee(validated.amount, validated.paymentMethod);

    const payment: Payment = {
      id,
      transactionId,
      levyId: validated.levyId,
      citizenId: validated.citizenId,
      amount: validated.amount,
      fee,
      netAmount: validated.amount - fee,
      paymentMethod: validated.paymentMethod,
      status: 'pending',
      paymentDetails: validated.paymentDetails,
      billingAddress: validated.billingAddress,
      processingInfo: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      complianceStatus: {
        level: 'FISMA-HIGH',
        pciCompliant: true,
        auditTrail: [{
          action: 'payment_initiated',
          timestamp: new Date(),
          userId: req.headers['x-audit-user'] as string,
        }],
      },
    };

    paymentStore.set(id, payment);

    logger.info({
      paymentId: id,
      transactionId,
      amount: validated.amount,
      method: validated.paymentMethod,
    }, 'Payment initiated');

    // Attempt to process via Rust Collection Engine
    try {
      payment.status = 'processing';
      payment.updatedAt = new Date();

      // In production, this would call the Rust service
      // const response = await axios.post(`${config.collectionEngineUrl}/process`, payment);

      // Simulate processing (replace with actual Rust service call)
      await new Promise(resolve => setTimeout(resolve, 100));

      payment.status = 'completed';
      payment.processingInfo = {
        processedAt: new Date(),
        processorResponse: 'APPROVED',
        authorizationCode: `AUTH${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // T+2
      };
      payment.complianceStatus.auditTrail.push({
        action: 'payment_completed',
        timestamp: new Date(),
        details: JSON.stringify(payment.processingInfo),
      });

      paymentStore.set(id, payment);

      logger.info({ paymentId: id, transactionId }, 'Payment completed');

      // Broadcast payment completion
      broadcastToChannel(Channels.PAYMENT_UPDATES, {
        type: 'payment_completed',
        payload: {
          paymentId: id,
          transactionId,
          levyId: validated.levyId,
          amount: validated.amount,
          status: 'completed',
        },
      });

    } catch (processingError) {
      payment.status = 'failed';
      payment.processingInfo.processorResponse = 'DECLINED';
      payment.complianceStatus.auditTrail.push({
        action: 'payment_failed',
        timestamp: new Date(),
        details: String(processingError),
      });
      paymentStore.set(id, payment);

      logger.error({ paymentId: id, error: processingError }, 'Payment processing failed');

      broadcastToChannel(Channels.PAYMENT_UPDATES, {
        type: 'payment_failed',
        payload: { paymentId: id, transactionId },
      });
    }

    res.status(201).json({ data: payment });
  } catch (error) {
    next(error);
  }
});

// GET all payments
router.get('/', async (req: Request, res: Response) => {
  const { status, citizenId, levyId, startDate, endDate, limit = '50', offset = '0' } = req.query;

  let payments = Array.from(paymentStore.values());

  // Apply filters
  if (status) payments = payments.filter(p => p.status === status);
  if (citizenId) payments = payments.filter(p => p.citizenId === citizenId);
  if (levyId) payments = payments.filter(p => p.levyId === levyId);
  if (startDate) payments = payments.filter(p => p.createdAt >= new Date(startDate as string));
  if (endDate) payments = payments.filter(p => p.createdAt <= new Date(endDate as string));

  // Sort by date descending
  payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = payments.length;
  payments = payments.slice(Number(offset), Number(offset) + Number(limit));

  // Summary statistics
  const allPayments = Array.from(paymentStore.values());
  const summary = {
    totalPayments: allPayments.length,
    totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
    totalFees: allPayments.reduce((sum, p) => sum + p.fee, 0),
    completedAmount: allPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    byStatus: {
      completed: allPayments.filter(p => p.status === 'completed').length,
      pending: allPayments.filter(p => p.status === 'pending').length,
      failed: allPayments.filter(p => p.status === 'failed').length,
      refunded: allPayments.filter(p => p.status === 'refunded').length,
    },
    byMethod: Object.entries(
      allPayments.reduce((acc, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([method, count]) => ({ method, count })),
  };

  res.json({
    data: payments,
    summary,
    meta: {
      total,
      limit: Number(limit),
      offset: Number(offset),
      timestamp: new Date().toISOString(),
    },
  });
});

// GET single payment
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = paymentStore.get(req.params.id);
    if (!payment) {
      throw new NotFoundError('Payment');
    }
    res.json({ data: payment });
  } catch (error) {
    next(error);
  }
});

// GET payment by transaction ID
router.get('/transaction/:transactionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = Array.from(paymentStore.values()).find(
      p => p.transactionId === req.params.transactionId
    );
    if (!payment) {
      throw new NotFoundError('Payment');
    }
    res.json({ data: payment });
  } catch (error) {
    next(error);
  }
});

// POST refund payment
router.post('/:id/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = paymentStore.get(req.params.id);
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.status !== 'completed') {
      throw new AppError('Only completed payments can be refunded', 400, 'INVALID_STATUS');
    }

    const { reason, amount } = refundSchema.parse(req.body);
    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new AppError('Refund amount cannot exceed original payment', 400, 'INVALID_AMOUNT');
    }

    const isPartial = refundAmount < payment.amount;

    payment.status = isPartial ? 'partially_refunded' : 'refunded';
    payment.refundInfo = {
      refundedAt: new Date(),
      refundAmount,
      reason,
      refundTransactionId: generateTransactionId(),
    };
    payment.updatedAt = new Date();
    payment.complianceStatus.auditTrail.push({
      action: isPartial ? 'partial_refund_processed' : 'full_refund_processed',
      timestamp: new Date(),
      userId: req.headers['x-audit-user'] as string,
      details: JSON.stringify({ reason, amount: refundAmount }),
    });

    paymentStore.set(req.params.id, payment);

    logger.info({
      paymentId: req.params.id,
      refundAmount,
      reason,
    }, 'Refund processed');

    broadcastToChannel(Channels.PAYMENT_UPDATES, {
      type: 'payment_refunded',
      payload: {
        paymentId: req.params.id,
        refundAmount,
        originalAmount: payment.amount,
        status: payment.status,
      },
    });

    res.json({ data: payment });
  } catch (error) {
    next(error);
  }
});

// GET payment analytics
router.get('/analytics/overview', async (_req: Request, res: Response) => {
  const payments = Array.from(paymentStore.values());
  const completed = payments.filter(p => p.status === 'completed');

  const analytics = {
    totalTransactions: payments.length,
    totalVolume: payments.reduce((sum, p) => sum + p.amount, 0),
    totalFees: payments.reduce((sum, p) => sum + p.fee, 0),
    netRevenue: completed.reduce((sum, p) => sum + p.netAmount, 0),
    successRate: payments.length > 0
      ? (completed.length / payments.length * 100).toFixed(2)
      : 0,
    averageTransactionSize: completed.length > 0
      ? completed.reduce((sum, p) => sum + p.amount, 0) / completed.length
      : 0,
    refundRate: payments.length > 0
      ? (payments.filter(p => p.status.includes('refunded')).length / payments.length * 100).toFixed(2)
      : 0,
    byMethod: Object.entries(
      completed.reduce((acc, p) => {
        if (!acc[p.paymentMethod]) {
          acc[p.paymentMethod] = { count: 0, volume: 0 };
        }
        acc[p.paymentMethod].count++;
        acc[p.paymentMethod].volume += p.amount;
        return acc;
      }, {} as Record<string, { count: number; volume: number }>)
    ).map(([method, data]) => ({ method, ...data })),
  };

  res.json({ data: analytics });
});

export { router as paymentRoutes };
