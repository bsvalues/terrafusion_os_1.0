import express, { Request, Response } from 'express';
import { IStorage } from '../storage';

/**
 * Creates the routes for the property API.
 */
export function createPropertyApiRoutes(storage: IStorage) {
  const router = express.Router();

  // Get property statistics
  router.get('/property-statistics', async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as string) || 'month';
      const statistics = await storage.getPropertyStatistics(timeRange);

      // Add sample delta values for dashboard UI
      const enhancedStats = {
        ...statistics,
        propertyDelta: { value: 2.5, isPercentage: true, period: 'month', isPositive: true },
        valueDelta: { value: 3.2, isPercentage: true, period: 'month', isPositive: true },
        medianDelta: { value: 1.8, isPercentage: true, period: 'month', isPositive: true },
        changesDelta: { value: 15, isPercentage: false, period: 'month', isPositive: true },
      };

      res.json(enhancedStats);
    } catch (error) {
      console.error('Error fetching property statistics:', error);
      res.status(500).json({ error: 'Failed to fetch property statistics' });
    }
  });

  // Get property by ID
  router.get('/properties/:id', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      const property = await storage.getPropertyById(propertyId);

      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      res.json(property);
    } catch (error) {
      console.error(`Error fetching property ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch property details' });
    }
  });

  // Search properties
  router.get('/properties/search', async (req: Request, res: Response) => {
    try {
      const params = {
        query: req.query.query as string,
        propertyType: req.query.propertyType as string,
        minValue: req.query.minValue ? Number(req.query.minValue) : undefined,
        maxValue: req.query.maxValue ? Number(req.query.maxValue) : undefined,
        zipCode: req.query.zipCode as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await storage.searchProperties(params);
      res.json(result);
    } catch (error) {
      console.error('Error searching properties:', error);
      res.status(500).json({ error: 'Failed to search properties' });
    }
  });

  // Get nearby properties
  router.get('/properties/:id/nearby', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      const radiusMiles = req.query.radius ? Number(req.query.radius) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const nearbyProperties = await storage.getNearbyProperties(propertyId, radiusMiles, limit);
      res.json(nearbyProperties);
    } catch (error) {
      console.error(`Error fetching nearby properties for ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch nearby properties' });
    }
  });

  // Get property value history
  router.get('/properties/:id/value-history', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      const years = req.query.years ? Number(req.query.years) : 5;

      const valueHistory = await storage.getPropertyValueHistory(propertyId, years);
      res.json(valueHistory);
    } catch (error) {
      console.error(`Error fetching value history for property ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch property value history' });
    }
  });

  return router;
}
