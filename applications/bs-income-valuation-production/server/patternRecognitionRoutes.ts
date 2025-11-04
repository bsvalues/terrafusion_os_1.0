import { Router } from 'express';
import { patternRecognitionController } from './patternRecognitionController';
import { asyncHandler } from './errorHandler';

export const patternRecognitionRouter = Router();

/**
 * Analyze correlations between different income sources
 * 
 * @route POST /api/patterns/correlation
 * @body { incomes: Income[] }
 * @returns { correlations: IncomeCorrelation[], sampleSize: number, timePeriod: string }
 */
patternRecognitionRouter.post(
  '/correlation',
  asyncHandler(patternRecognitionController.findIncomeCorrelations)
);

/**
 * Detect outliers in income data
 * 
 * @route POST /api/patterns/outliers
 * @body { incomes: Income[], threshold?: number, groupBy?: string, methodology?: string }
 * @returns { outliers: DataOutlier[], thresholdUsed: number, methodology: string }
 */
patternRecognitionRouter.post(
  '/outliers',
  asyncHandler(patternRecognitionController.detectOutliers)
);

/**
 * Analyze seasonality patterns in income data
 * 
 * @route POST /api/patterns/seasonality
 * @body { incomes: Income[], minConfidence?: number, maxPeriods?: number, detrend?: boolean }
 * @returns { seasonalPatterns: SeasonalPattern[], confidenceLevel: number, dataPointsAnalyzed: number }
 */
patternRecognitionRouter.post(
  '/seasonality',
  asyncHandler(patternRecognitionController.analyzeSeasonality)
);

/**
 * Identify growth trends in valuation data
 * 
 * @route POST /api/patterns/growth-trends
 * @body { valuations: Valuation[], categories?: string[], timeframe?: string, adjustForInflation?: boolean }
 * @returns { trends: GrowthTrend[], overallMarketTrend: number, timePeriod: string, methodology: string }
 */
patternRecognitionRouter.post(
  '/growth-trends',
  asyncHandler(patternRecognitionController.identifyGrowthTrends)
);