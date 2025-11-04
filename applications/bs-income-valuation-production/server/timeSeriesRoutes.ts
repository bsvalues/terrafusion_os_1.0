import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from './auth';
import { timeSeriesController } from './timeSeriesController';
import { asyncHandler } from './errorHandler';

export const timeSeriesRouter = Router();

// Define validation schemas
const timeSeriesDataSchema = z.object({
  data: z.array(z.object({
    date: z.string().datetime(),
    value: z.number()
  })),
});

const forecastRequestSchema = timeSeriesDataSchema.extend({
  periods: z.number().int().positive(),
  confidenceLevel: z.number().min(0.5).max(0.99).optional(),
  method: z.enum(['arima', 'ets', 'auto']).optional()
});

// Routes
timeSeriesRouter.post('/forecast', authenticateJWT, asyncHandler(async (req, res) => {
  const validatedData = forecastRequestSchema.parse(req.body);
  const result = await timeSeriesController.forecast(
    validatedData.data,
    validatedData.periods,
    {
      confidenceLevel: validatedData.confidenceLevel,
      method: validatedData.method
    }
  );
  res.json(result);
}));

timeSeriesRouter.post('/seasonality', authenticateJWT, asyncHandler(async (req, res) => {
  const validatedData = timeSeriesDataSchema.parse(req.body);
  const result = await timeSeriesController.detectSeasonality(validatedData.data);
  res.json(result);
}));

timeSeriesRouter.post('/decompose', authenticateJWT, asyncHandler(async (req, res) => {
  const validatedData = timeSeriesDataSchema.parse(req.body);
  const result = await timeSeriesController.decompose(validatedData.data);
  res.json(result);
}));

timeSeriesRouter.post('/trend', authenticateJWT, asyncHandler(async (req, res) => {
  const validatedData = timeSeriesDataSchema.parse(req.body);
  const result = await timeSeriesController.getTrendDirection(validatedData.data);
  res.json(result);
}));

timeSeriesRouter.post('/description', authenticateJWT, asyncHandler(async (req, res) => {
  const descriptionRequestSchema = z.object({
    historicalData: z.array(z.object({
      date: z.string().datetime(),
      value: z.number()
    })),
    forecast: z.object({
      values: z.array(z.number()),
      dates: z.array(z.string().datetime()),
      lowerBound: z.array(z.number()),
      upperBound: z.array(z.number()),
      method: z.string(),
      confidenceLevel: z.number()
    })
  });
  
  const validatedData = descriptionRequestSchema.parse(req.body);
  const result = await timeSeriesController.generateForecastDescription(
    validatedData.historicalData,
    validatedData.forecast
  );
  
  res.json({ description: result });
}));