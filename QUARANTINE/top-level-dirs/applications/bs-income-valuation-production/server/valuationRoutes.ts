import { Router, Request, Response } from 'express';
import { db } from './db';
import { valuations, incomes, users, insertValuationSchema } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { asyncHandler } from './errorHandler';
import { authenticateJWT } from './auth';
import { ValidationError, NotFoundError } from './errorHandler';
import { z } from 'zod';

export const valuationRouter = Router();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
}

// Get all valuations for a user
valuationRouter.get(
  '/users/:userId/valuations',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    
    // In production, check if the user is requesting their own data or has admin privileges
    if (process.env.NODE_ENV === 'production') {
      if (req.user?.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to access this resource'
          }
        });
      }
    }
    
    const userValuations = await db
      .select()
      .from(valuations)
      .where(eq(valuations.userId, userId))
      .orderBy(desc(valuations.createdAt));
    
    res.json({
      success: true,
      data: userValuations,
      count: userValuations.length
    });
  })
);

// Get a specific valuation
valuationRouter.get(
  '/:id',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const valuationId = parseInt(req.params.id);
    
    const valuation = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, valuationId))
      .limit(1);
    
    if (valuation.length === 0) {
      throw new NotFoundError('Valuation not found');
    }
    
    // In production, check if the user is requesting their own data or has admin privileges
    if (process.env.NODE_ENV === 'production') {
      if (req.user?.userId !== valuation[0].userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to access this resource'
          }
        });
      }
    }
    
    res.json({
      success: true,
      data: valuation[0]
    });
  })
);

// Create a new valuation
valuationRouter.post(
  '/',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate the request body
    const parseResult = insertValuationSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      throw new ValidationError('Invalid valuation data', parseResult.error.format());
    }
    
    const validatedData = parseResult.data;
    
    // In production, ensure the user is creating a valuation for themselves
    if (process.env.NODE_ENV === 'production') {
      if (req.user?.userId !== validatedData.userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You can only create valuations for your own account'
          }
        });
      }
    }
    
    // Create the valuation
    const [newValuation] = await db
      .insert(valuations)
      .values({
        userId: validatedData.userId,
        name: validatedData.name,
        totalAnnualIncome: validatedData.totalAnnualIncome,
        multiplier: validatedData.multiplier,
        valuationAmount: validatedData.valuationAmount,
        incomeBreakdown: validatedData.incomeBreakdown,
        notes: validatedData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: newValuation
    });
  })
);

// Update a valuation
valuationRouter.put(
  '/:id',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const valuationId = parseInt(req.params.id);
    
    // Check if the valuation exists
    const existingValuation = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, valuationId))
      .limit(1);
    
    if (existingValuation.length === 0) {
      throw new NotFoundError('Valuation not found');
    }
    
    // In production, ensure the user is updating their own valuation
    if (process.env.NODE_ENV === 'production') {
      if (req.user?.userId !== existingValuation[0].userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You can only update your own valuations'
          }
        });
      }
    }
    
    // Prepare the update data
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    // Only include fields that are provided in the request
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.totalAnnualIncome) updateData.totalAnnualIncome = req.body.totalAnnualIncome;
    if (req.body.multiplier) updateData.multiplier = req.body.multiplier;
    if (req.body.valuationAmount) updateData.valuationAmount = req.body.valuationAmount;
    if (req.body.incomeBreakdown) updateData.incomeBreakdown = req.body.incomeBreakdown;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    
    // Update the valuation
    const [updatedValuation] = await db
      .update(valuations)
      .set(updateData)
      .where(eq(valuations.id, valuationId))
      .returning();
    
    res.json({
      success: true,
      data: updatedValuation
    });
  })
);

// Soft delete a valuation (set isActive to false)
valuationRouter.delete(
  '/:id',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const valuationId = parseInt(req.params.id);
    
    // Check if the valuation exists
    const existingValuation = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, valuationId))
      .limit(1);
    
    if (existingValuation.length === 0) {
      throw new NotFoundError('Valuation not found');
    }
    
    // In production, ensure the user is deleting their own valuation
    if (process.env.NODE_ENV === 'production') {
      if (req.user?.userId !== existingValuation[0].userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You can only delete your own valuations'
          }
        });
      }
    }
    
    // Soft delete the valuation by setting isActive to false
    await db
      .update(valuations)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(valuations.id, valuationId));
    
    res.json({
      success: true,
      message: 'Valuation successfully deleted'
    });
  })
);

// Compare two or more valuations
valuationRouter.get(
  '/compare',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get IDs from query string
    const idParam = req.query.ids as string;
    
    if (!idParam) {
      throw new ValidationError('No valuation IDs provided');
    }
    
    const ids = idParam.split(',').map(id => parseInt(id.trim()));
    
    if (ids.length < 2) {
      throw new ValidationError('At least two valuation IDs are required for comparison');
    }
    
    // Fetch the valuations
    const valuationsToCompare = await db
      .select()
      .from(valuations)
      .where(sql`${valuations.id} IN (${ids.join(',')})`);
    
    if (valuationsToCompare.length < 2) {
      throw new ValidationError('Could not find all specified valuations');
    }
    
    // In production, ensure the user owns the valuations or has admin privileges
    if (process.env.NODE_ENV === 'production') {
      const hasPermission = valuationsToCompare.every(
        v => v.userId === req.user?.userId || req.user?.role === 'admin'
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to access all of these valuations'
          }
        });
      }
    }
    
    // Sort by created date
    valuationsToCompare.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Compare the first and last valuations (assuming chronological comparison)
    const baseValuation = valuationsToCompare[0];
    const targetValuation = valuationsToCompare[valuationsToCompare.length - 1];
    
    // Calculate differences
    const incomeDifference = (
      parseFloat(targetValuation.totalAnnualIncome) - parseFloat(baseValuation.totalAnnualIncome)
    ).toFixed(2);
    
    const multiplierDifference = (
      parseFloat(targetValuation.multiplier) - parseFloat(baseValuation.multiplier)
    ).toFixed(2);
    
    const valuationDifference = (
      parseFloat(targetValuation.valuationAmount) - parseFloat(baseValuation.valuationAmount)
    ).toFixed(2);
    
    const percentageChange = (
      (parseFloat(valuationDifference) / parseFloat(baseValuation.valuationAmount)) * 100
    ).toFixed(2);
    
    // Compare income breakdown if available
    let incomeChanges: Record<string, string> | undefined;
    
    if (baseValuation.incomeBreakdown && targetValuation.incomeBreakdown) {
      try {
        const baseBreakdown = JSON.parse(baseValuation.incomeBreakdown);
        const targetBreakdown = JSON.parse(targetValuation.incomeBreakdown);
        
        incomeChanges = {};
        
        // Combine all income sources from both breakdowns
        const allSources = Array.from(
          new Set([...Object.keys(baseBreakdown), ...Object.keys(targetBreakdown)])
        );
        
        // Calculate changes for each source
        allSources.forEach(source => {
          const baseAmount = baseBreakdown[source] || 0;
          const targetAmount = targetBreakdown[source] || 0;
          incomeChanges![source] = (targetAmount - baseAmount).toFixed(2);
        });
      } catch (error) {
        console.error('Error parsing income breakdown:', error);
      }
    }
    
    res.json({
      success: true,
      data: {
        valuations: [baseValuation, targetValuation],
        comparison: {
          incomeDifference,
          multiplierDifference,
          valuationDifference,
          percentageChange,
          ...(incomeChanges && { incomeChanges })
        }
      }
    });
  })
);