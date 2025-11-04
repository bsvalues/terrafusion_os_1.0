import express, { Request, Response } from 'express';
import { IStorage } from '../storage';

/**
 * Creates the routes for the property change tracking API.
 */
export function createChangeTrackingApiRoutes(storage: IStorage) {
  const router = express.Router();

  // Get recent property changes
  router.get('/property-changes/recent', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const recentChanges = await storage.getRecentPropertyChanges(limit);

      res.json(recentChanges);
    } catch (error) {
      console.error('Error fetching recent property changes:', error);
      res.status(500).json({ error: 'Failed to fetch recent property changes' });
    }
  });

  // Get changes for a specific property
  router.get('/properties/:id/changes', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      const params = {
        changeType: req.query.changeType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        changedBy: req.query.changedBy as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const changes = await storage.getPropertyChanges(propertyId, params);
      res.json(changes);
    } catch (error) {
      console.error(`Error fetching changes for property ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch property changes' });
    }
  });

  // Search for property changes across all properties
  router.get('/property-changes/search', async (req: Request, res: Response) => {
    try {
      const searchParams = {
        propertyId: req.query.propertyId as string,
        changeType: req.query.changeType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        changedBy: req.query.changedBy as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await storage.searchPropertyChanges(searchParams);
      res.json(result);
    } catch (error) {
      console.error('Error searching property changes:', error);
      res.status(500).json({ error: 'Failed to search property changes' });
    }
  });

  // Get change statistics
  router.get('/property-changes/statistics', async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as string) || 'month';
      const statistics = await storage.getChangeStatistics(timeRange);

      res.json(statistics);
    } catch (error) {
      console.error('Error fetching change statistics:', error);
      res.status(500).json({ error: 'Failed to fetch change statistics' });
    }
  });

  // Record a property change
  router.post('/property-changes', async (req: Request, res: Response) => {
    try {
      const changeData = req.body;

      if (!changeData.propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      const change = await storage.recordPropertyChange(changeData);
      res.status(201).json(change);
    } catch (error) {
      console.error('Error recording property change:', error);
      res.status(500).json({ error: 'Failed to record property change' });
    }
  });

  return router;
}
