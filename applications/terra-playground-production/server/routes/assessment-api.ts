import express, { Request, Response } from 'express';
import { IStorage } from '../storage';

/**
 * Creates the routes for the assessment API.
 */
export function createAssessmentApiRoutes(storage: IStorage) {
  const router = express.Router();

  // Get assessment metrics
  router.get('/assessment-metrics', async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as string) || 'month';
      const metrics = await storage.getAssessmentMetrics(timeRange);

      // Add delta values for dashboard UI
      const enhancedMetrics = {
        ...metrics,
        assessmentDelta: { value: 5.3, isPercentage: true, period: 'month', isPositive: true },
        completionDelta: { value: 4.1, isPercentage: true, period: 'month', isPositive: true },
      };

      res.json(enhancedMetrics);
    } catch (error) {
      console.error('Error fetching assessment metrics:', error);
      res.status(500).json({ error: 'Failed to fetch assessment metrics' });
    }
  });

  // Get assessment by ID
  router.get('/assessments/:id', async (req: Request, res: Response) => {
    try {
      const assessmentId = req.params.id;
      const assessment = await storage.getAssessmentById(assessmentId);

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      res.json(assessment);
    } catch (error) {
      console.error(`Error fetching assessment ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch assessment details' });
    }
  });

  // Get assessments for a property
  router.get('/properties/:id/assessments', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      const assessments = await storage.getPropertyAssessments(propertyId);

      res.json(assessments);
    } catch (error) {
      console.error(`Error fetching assessments for property ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch property assessments' });
    }
  });

  // Create a new assessment
  router.post('/assessments', async (req: Request, res: Response) => {
    try {
      const assessmentData = req.body;

      if (!assessmentData.propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Error creating assessment:', error);
      res.status(500).json({ error: 'Failed to create assessment' });
    }
  });

  // Update an assessment
  router.patch('/assessments/:id', async (req: Request, res: Response) => {
    try {
      const assessmentId = req.params.id;
      const updates = req.body;

      const assessment = await storage.updateAssessment(assessmentId, updates);

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      res.json(assessment);
    } catch (error) {
      console.error(`Error updating assessment ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update assessment' });
    }
  });

  // Get assessment status history
  router.get('/assessments/:id/status-history', async (req: Request, res: Response) => {
    try {
      const assessmentId = req.params.id;
      const statusHistory = await storage.getAssessmentStatusHistory(assessmentId);

      res.json(statusHistory);
    } catch (error) {
      console.error(`Error fetching status history for assessment ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch assessment status history' });
    }
  });

  return router;
}
