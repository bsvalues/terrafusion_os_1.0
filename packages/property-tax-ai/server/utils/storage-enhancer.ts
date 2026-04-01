/**
 * Storage Enhancer
 * 
 * Provides enhanced storage operations with consistent error handling,
 * logging, and activity tracking.
 */

import { IStorage } from '../storage';
import { ErrorHandler, ErrorType, withErrorHandling } from './error-handler';
import { logger } from './logger';

/**
 * Enhance a storage instance with error handling and logging
 * @param storage The storage instance to enhance
 * @param component Component name for logging
 */
export function enhanceStorageWithErrorHandling(
  storage: IStorage,
  component: string = 'storage'
): IStorage {
  const enhancedStorage = { ...storage };
  
  // Enhance methods with error handling and logging
  for (const [key, method] of Object.entries(storage)) {
    if (typeof method === 'function') {
      enhancedStorage[key] = withErrorHandling(
        async (...args: any[]) => {
          try {
            logger.debug(`Executing ${key} with args: ${JSON.stringify(args)}`, { 
              component,
              metadata: { methodName: key }
            });
            
            const result = await method.apply(storage, args);
            
            logger.debug(`Completed ${key} successfully`, { 
              component,
              metadata: { methodName: key }
            });
            
            return result;
          } catch (error) {
            logger.error(`Error in ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
              component,
              metadata: { 
                methodName: key,
                args,
                error
              }
            });
            
            // Rethrow to be caught by the withErrorHandling wrapper
            throw error;
          }
        },
        `${component}.${key}`
      );
    }
  }
  
  return enhancedStorage;
}

/**
 * Enhance specific storage methods with error handling for our market prediction and risk assessment functionality
 */
export function enhanceMarketStorageMethods(storage: IStorage): IStorage {
  const enhanced = { ...storage };
  
  // Enhance getMarketTrends
  const originalGetMarketTrends = storage.getMarketTrends;
  enhanced.getMarketTrends = async (region: string) => {
    try {
      if (!region) {
        throw ErrorHandler.validation('Region is required for market trends');
      }
      
      const result = await originalGetMarketTrends.call(storage, region);
      
      if (!result || result.length === 0) {
        logger.warn(`No market trends found for region: ${region}`, {
          component: 'marketPrediction',
          metadata: { region }
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get market trends for region: ${region}`, {
        component: 'marketPrediction',
        metadata: { region, error }
      });
      
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getMarketTrends');
      }
      throw error;
    }
  };
  
  // Enhance getEconomicIndicators
  const originalGetEconomicIndicators = storage.getEconomicIndicators;
  enhanced.getEconomicIndicators = async (region: string) => {
    try {
      if (!region) {
        throw ErrorHandler.validation('Region is required for economic indicators');
      }
      
      const result = await originalGetEconomicIndicators.call(storage, region);
      
      if (!result || result.length === 0) {
        logger.warn(`No economic indicators found for region: ${region}`, {
          component: 'marketPrediction',
          metadata: { region }
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get economic indicators for region: ${region}`, {
        component: 'marketPrediction',
        metadata: { region, error }
      });
      
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getEconomicIndicators');
      }
      throw error;
    }
  };
  
  // Enhance getRegulatoryFramework
  const originalGetRegulatoryFramework = storage.getRegulatoryFramework;
  enhanced.getRegulatoryFramework = async (region: string) => {
    try {
      if (!region) {
        throw ErrorHandler.validation('Region is required for regulatory framework');
      }
      
      const result = await originalGetRegulatoryFramework.call(storage, region);
      
      if (!result) {
        logger.warn(`No regulatory framework found for region: ${region}`, {
          component: 'riskAssessment',
          metadata: { region }
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get regulatory framework for region: ${region}`, {
        component: 'riskAssessment',
        metadata: { region, error }
      });
      
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getRegulatoryFramework');
      }
      throw error;
    }
  };
  
  // Enhance getHistoricalRegulatoryChanges
  const originalGetHistoricalRegulatoryChanges = storage.getHistoricalRegulatoryChanges;
  enhanced.getHistoricalRegulatoryChanges = async (region: string) => {
    try {
      if (!region) {
        throw ErrorHandler.validation('Region is required for historical regulatory changes');
      }
      
      const result = await originalGetHistoricalRegulatoryChanges.call(storage, region);
      
      if (!result || result.length === 0) {
        logger.warn(`No historical regulatory changes found for region: ${region}`, {
          component: 'riskAssessment',
          metadata: { region }
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get historical regulatory changes for region: ${region}`, {
        component: 'riskAssessment',
        metadata: { region, error }
      });
      
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getHistoricalRegulatoryChanges');
      }
      throw error;
    }
  };
  
  // Enhance getEnvironmentalRisks
  const originalGetEnvironmentalRisks = storage.getEnvironmentalRisks;
  enhanced.getEnvironmentalRisks = async (propertyId: string) => {
    try {
      if (!propertyId) {
        throw ErrorHandler.validation('Property ID is required for environmental risks');
      }
      
      const result = await originalGetEnvironmentalRisks.call(storage, propertyId);
      
      if (!result || !result.risks || result.risks.length === 0) {
        logger.warn(`No environmental risks found for property: ${propertyId}`, {
          component: 'riskAssessment',
          metadata: { propertyId }
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get environmental risks for property: ${propertyId}`, {
        component: 'riskAssessment',
        metadata: { propertyId, error }
      });
      
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getEnvironmentalRisks');
      }
      throw error;
    }
  };
  
  return enhanced;
}