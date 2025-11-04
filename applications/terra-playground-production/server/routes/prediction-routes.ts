/**
 * Prediction API Routes
 *
 * These routes provide access to AI-driven property predictions
 * for visualization and analysis in the GIS system.
 */

import { Router } from 'express';
import { IStorage } from '../storage';
import { z } from 'zod';

// Prediction request schema
const predictionRequestSchema = z.object({
  type: z.enum(['value', 'risk', 'development']).optional().default('value'),
  timeframe: z.enum(['1year', '5year', '10year']).optional().default('1year'),
  detailLevel: z.number().min(0).max(100).optional().default(50),
  bounds: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .optional(),
});

export const createPredictionRoutes = (storage: IStorage) => {
  const router = Router();

  /**
   * Get property value predictions
   *
   * Returns AI-driven predictions for property values, risk assessments,
   * or development potential.
   */
  router.get('/predictions', async (req, res) => {
    try {
      // Validate and parse query parameters
      const { type, timeframe, detailLevel, bounds } = predictionRequestSchema.parse({
        type: req.query.type || 'value',
        timeframe: req.query.timeframe || '1year',
        detailLevel: req.query.detailLevel ? parseInt(req.query.detailLevel as string) : 50,
        bounds: req.query.bounds ? JSON.parse(req.query.bounds as string) : undefined,
      });

      // Get properties from storage
      const properties = await storage.getAllProperties();

      // Generate predictions for each property
      const predictions = await Promise.all(
        properties.map(async property => {
          // Convert string coordinates to numbers if needed
          const coordinates =
            typeof property.geometry === 'string'
              ? JSON.parse(property.geometry)
              : property.geometry;

          // Use property ID for prediction retrieval or calculation
          const propertyId = property.propertyId;

          // Current value from property data
          const currentValue = parseFloat(property.value || '0');

          // Get specific prediction based on type and timeframe
          let prediction: any;

          switch (type) {
            case 'value':
              // For value predictions, calculate future estimated value
              prediction = await getPredictedValue(propertyId, currentValue, timeframe);
              break;

            case 'risk':
              // For risk predictions, calculate various risk factors
              prediction = await getRiskAssessment(propertyId, timeframe);
              break;

            case 'development':
              // For development potential, analyze growth opportunities
              prediction = await getDevelopmentPotential(propertyId, timeframe);
              break;

            default:
              prediction = await getPredictedValue(propertyId, currentValue, timeframe);
          }

          // Return combined property and prediction data
          return {
            propertyId,
            currentValue,
            predictedValue: prediction.predictedValue,
            changePercent: prediction.changePercent,
            confidence: prediction.confidence,
            riskScore: prediction.riskScore,
            riskFactors: prediction.riskFactors,
            developmentPotential: prediction.developmentPotential,
            coordinates: coordinates?.coordinates?.[0] || [],
          };
        })
      );

      // Filter out properties with no coordinates
      const validPredictions = predictions.filter(
        pred => pred.coordinates && pred.coordinates.length > 0
      );

      // Send response
      res.json(validPredictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
      res.status(500).json({ error: 'Failed to generate predictions' });
    }
  });

  /**
   * Get predicted property value based on historical data and market trends
   */
  async function getPredictedValue(propertyId: string, currentValue: number, timeframe: string) {
    // Get historical data for this property
    const propertyHistory = await storage.getPropertyHistory(propertyId);

    // Analyze market trends for the area
    const marketTrends = await storage.getMarketTrends(propertyId);

    // Calculate growth multiplier based on timeframe
    let growthMultiplier = 1.0;
    switch (timeframe) {
      case '1year':
        growthMultiplier = 1.05; // 5% average annual growth
        break;
      case '5year':
        growthMultiplier = 1.3; // 30% growth over 5 years
        break;
      case '10year':
        growthMultiplier = 1.7; // 70% growth over 10 years
        break;
    }

    // Apply property-specific adjustments based on its characteristics
    let propertyMultiplier = 1.0;

    // If we have market trends data, use it to adjust the property multiplier
    if (marketTrends) {
      if (marketTrends.hotMarket) {
        propertyMultiplier *= 1.2; // Hot markets grow faster
      } else if (marketTrends.decliningMarket) {
        propertyMultiplier *= 0.8; // Declining markets grow slower
      }

      if (marketTrends.highDemandNeighborhood) {
        propertyMultiplier *= 1.1; // High demand neighborhoods grow faster
      }
    }

    // Calculate final predicted value
    const predictedValue = Math.round(currentValue * growthMultiplier * propertyMultiplier);

    // Calculate percent change
    const changePercent = parseFloat(((predictedValue / currentValue - 1) * 100).toFixed(1));

    // Calculate confidence level (higher for shorter timeframes)
    let confidence = 90; // Base confidence
    switch (timeframe) {
      case '1year':
        confidence = 85;
        break;
      case '5year':
        confidence = 70;
        break;
      case '10year':
        confidence = 55;
        break;
    }

    // Return prediction data
    return {
      predictedValue,
      changePercent,
      confidence,
      riskScore: undefined,
      riskFactors: undefined,
      developmentPotential: undefined,
    };
  }

  /**
   * Get risk assessment for a property based on various factors
   */
  async function getRiskAssessment(propertyId: string, timeframe: string) {
    // Get property details
    const property = await storage.getProperty(propertyId);

    // Get market data for risk assessment
    const marketData = await storage.getMarketTrends(propertyId);

    // Base risk score (0-100, higher = riskier)
    let riskScore = 30; // Default moderate-low risk

    // Risk factors list
    const riskFactors: string[] = [];

    // Adjust risk based on property details
    if (property) {
      const propertyType = property.propertyType || '';

      // Commercial properties might have higher volatility
      if (propertyType.toLowerCase().includes('commercial')) {
        riskScore += 10;
        riskFactors.push('Commercial Volatility');
      }

      // Vacant land might be higher risk
      if (propertyType.toLowerCase().includes('vacant')) {
        riskScore += 15;
        riskFactors.push('Vacant Land');
      }

      // Assess based on value
      const value = parseFloat(property.value || '0');
      if (value > 1000000) {
        riskScore += 5;
        riskFactors.push('High Value Property');
      }
    }

    // Adjust risk based on market data
    if (marketData) {
      if (marketData.decliningMarket) {
        riskScore += 20;
        riskFactors.push('Declining Market');
      }

      if (marketData.highVolatility) {
        riskScore += 15;
        riskFactors.push('Market Volatility');
      }

      if (marketData.overvaluedMarket) {
        riskScore += 25;
        riskFactors.push('Overvalued Market');
      }
    }

    // Adjust for timeframe - longer timeframes have higher risk
    switch (timeframe) {
      case '5year':
        riskScore += 10;
        break;
      case '10year':
        riskScore += 20;
        break;
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // Calculate confidence (inverse relationship with risk)
    const confidence = Math.max(40, 100 - riskScore / 2);

    // For completeness, include a reasonable predicted value
    const currentValue = parseFloat(property?.value || '0');
    let predictedValue = currentValue;
    let changePercent = 0;

    if (riskScore < 40) {
      // Low risk properties might appreciate more
      predictedValue = currentValue * 1.15;
      changePercent = 15;
    } else if (riskScore < 70) {
      // Medium risk properties might appreciate slightly
      predictedValue = currentValue * 1.05;
      changePercent = 5;
    } else {
      // High risk properties might depreciate
      predictedValue = currentValue * 0.9;
      changePercent = -10;
    }

    return {
      predictedValue: Math.round(predictedValue),
      changePercent: parseFloat(changePercent.toFixed(1)),
      confidence: Math.round(confidence),
      riskScore: Math.round(riskScore),
      riskFactors,
      developmentPotential: undefined,
    };
  }

  /**
   * Get development potential assessment for a property
   */
  async function getDevelopmentPotential(propertyId: string, timeframe: string) {
    // Get property details
    const property = await storage.getProperty(propertyId);

    // Get zoning and development data
    const zoningData = await storage.getZoningData(propertyId);

    // Default potential rating
    let developmentPotential: 'high' | 'medium' | 'low' = 'medium';
    let potentialScore = 50; // 0-100 scale

    // Base confidence factor
    let confidence = 60;

    // Assess based on property details
    if (property) {
      const propertyType = property.propertyType || '';

      // Vacant land has higher development potential
      if (propertyType.toLowerCase().includes('vacant')) {
        potentialScore += 30;
        confidence += 10;
      }

      // Older buildings might have redevelopment potential
      if (property.extraFields?.yearBuilt && parseInt(property.extraFields.yearBuilt) < 1970) {
        potentialScore += 20;
      }

      // Assess based on acreage
      const acres = parseFloat(property.acres || '0');
      if (acres > 5) {
        potentialScore += 15;
        confidence += 5;
      }
    }

    // Adjust based on zoning
    if (zoningData) {
      if (zoningData.zoningType === 'commercial' || zoningData.zoningType === 'mixed') {
        potentialScore += 25;
      }

      if (zoningData.developmentFriendly) {
        potentialScore += 15;
      }

      if (zoningData.restrictedDevelopment) {
        potentialScore -= 30;
      }
    }

    // Adjust for timeframe - longer timeframes have higher potential
    switch (timeframe) {
      case '5year':
        potentialScore += 10;
        break;
      case '10year':
        potentialScore += 25;
        confidence -= 10; // But lower confidence
        break;
    }

    // Cap score at 0-100
    potentialScore = Math.max(0, Math.min(100, potentialScore));

    // Determine potential category
    if (potentialScore >= 70) {
      developmentPotential = 'high';
    } else if (potentialScore >= 40) {
      developmentPotential = 'medium';
    } else {
      developmentPotential = 'low';
    }

    // Cap confidence
    confidence = Math.max(40, Math.min(90, confidence));

    // For completeness, include predicted value
    const currentValue = parseFloat(property?.value || '0');
    let predictedValue = currentValue;
    let changePercent = 0;

    switch (developmentPotential) {
      case 'high':
        predictedValue = currentValue * 1.5;
        changePercent = 50;
        break;
      case 'medium':
        predictedValue = currentValue * 1.2;
        changePercent = 20;
        break;
      case 'low':
        predictedValue = currentValue * 1.05;
        changePercent = 5;
        break;
    }

    return {
      predictedValue: Math.round(predictedValue),
      changePercent: parseFloat(changePercent.toFixed(1)),
      confidence: Math.round(confidence),
      riskScore: undefined,
      riskFactors: undefined,
      developmentPotential,
    };
  }

  return router;
};
