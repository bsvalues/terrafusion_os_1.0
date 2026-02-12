/**
 * Enhanced Market Prediction Model
 *
 * An enhanced version of the MarketPredictionModel with improved error handling,
 * logging, and performance monitoring.
 */

import { MarketPredictionModel, MarketTrend, MarketPrediction } from './market-prediction-model';
import { IStorage } from '../storage';
import { LLMService } from './llm-service';
import { logger } from '../utils/logger';
import { ErrorHandler, ErrorType } from '../utils/error-handler';
import { enhanceMarketStorageMethods } from '../utils/storage-enhancer';

export class EnhancedMarketPredictionModel extends MarketPredictionModel {
  private enhancedStorage: IStorage;

  constructor(storage: IStorage, llmService?: LLMService) {
    // Enhance storage with error handling for market prediction methods
    const enhancedStorage = enhanceMarketStorageMethods(storage);

    // Call parent constructor with enhanced storage
    super(enhancedStorage, llmService);

    // Store reference to enhanced storage
    this.enhancedStorage = enhancedStorage;

    logger.info('Enhanced Market Prediction Model initialized', {
      component: 'EnhancedMarketPredictionModel',
    });
  }

  /**
   * Override predictForProperty with enhanced error handling
   */
  public async predictForProperty(
    propertyId: string,
    years: number = 5
  ): Promise<MarketPrediction> {
    const startTime = Date.now();
    logger.debug(`Starting prediction for property ${propertyId} for ${years} years`, {
      component: 'EnhancedMarketPredictionModel',
      metadata: { propertyId, years },
    });

    try {
      // Call parent method
      const result = await super.predictForProperty(propertyId, years);

      const duration = Date.now() - startTime;
      logger.info(`Completed prediction for property ${propertyId} in ${duration}ms`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          propertyId,
          years,
          duration,
          currentValue: result.currentValue,
          annualGrowthRate: result.annualGrowthRate,
          confidenceScore: result.confidenceScore,
          riskScore: result.riskScore,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed to predict property value for ${propertyId}`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          propertyId,
          years,
          duration,
          error,
        },
      });

      // Transform error to AppError
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
        } else {
          throw ErrorHandler.handleError(error, 'predictForProperty');
        }
      }

      throw error;
    }
  }

  /**
   * Override getMarketTrends with enhanced error handling
   */
  public async getMarketTrends(region: string): Promise<MarketTrend[]> {
    const startTime = Date.now();
    logger.debug(`Fetching market trends for region ${region}`, {
      component: 'EnhancedMarketPredictionModel',
      metadata: { region },
    });

    try {
      // Call parent method
      const result = await super.getMarketTrends(region);

      const duration = Date.now() - startTime;
      logger.info(
        `Retrieved ${result.length} market trends for region ${region} in ${duration}ms`,
        {
          component: 'EnhancedMarketPredictionModel',
          metadata: {
            region,
            trendCount: result.length,
            duration,
          },
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed to get market trends for region ${region}`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          duration,
          error,
        },
      });

      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getMarketTrends');
      }

      throw error;
    }
  }

  /**
   * Override getEconomicIndicators with enhanced error handling
   */
  public async getEconomicIndicators(region: string): Promise<any> {
    const startTime = Date.now();
    logger.debug(`Fetching economic indicators for region ${region}`, {
      component: 'EnhancedMarketPredictionModel',
      metadata: { region },
    });

    try {
      // Call parent method
      const result = await super.getEconomicIndicators(region);

      const duration = Date.now() - startTime;
      logger.info(`Retrieved economic indicators for region ${region} in ${duration}ms`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          duration,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed to get economic indicators for region ${region}`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          duration,
          error,
        },
      });

      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getEconomicIndicators');
      }

      throw error;
    }
  }

  /**
   * Override getEconomicForecasts with enhanced error handling
   */
  public async getEconomicForecasts(region: string, years: number = 5): Promise<any> {
    const startTime = Date.now();
    logger.debug(`Generating economic forecasts for region ${region} for ${years} years`, {
      component: 'EnhancedMarketPredictionModel',
      metadata: { region, years },
    });

    try {
      // Call parent method
      const result = await super.getEconomicForecasts(region, years);

      const duration = Date.now() - startTime;
      logger.info(`Generated economic forecasts for region ${region} in ${duration}ms`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          years,
          duration,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed to generate economic forecasts for region ${region}`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          years,
          duration,
          error,
        },
      });

      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getEconomicForecasts');
      }

      throw error;
    }
  }

  /**
   * Override getHistoricalData with enhanced error handling
   */
  public async getHistoricalData(region: string): Promise<any> {
    const startTime = Date.now();
    logger.debug(`Fetching historical data for region ${region}`, {
      component: 'EnhancedMarketPredictionModel',
      metadata: { region },
    });

    try {
      // Call parent method
      const result = await super.getHistoricalData(region);

      const duration = Date.now() - startTime;
      logger.info(`Retrieved historical data for region ${region} in ${duration}ms`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          duration,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed to get historical data for region ${region}`, {
        component: 'EnhancedMarketPredictionModel',
        metadata: {
          region,
          duration,
          error,
        },
      });

      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getHistoricalData');
      }

      throw error;
    }
  }
}
