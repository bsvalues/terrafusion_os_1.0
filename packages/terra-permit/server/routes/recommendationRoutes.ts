import { Express, Request, Response } from 'express';
import { isAuthenticated, CurrentUser } from '../middleware/auth';
import { recommendationService } from '../services/recommendationService';

// Extend Express Request to include currentUser
interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUser;
}

// Import logger
const log = (message: string, category?: string) => {
  const prefix = category ? `[${category}]` : '';
  console.log(`${prefix} ${message}`);
};

/**
 * Register recommendation related routes
 */
export function registerRecommendationRoutes(app: Express): void {
  log("Registering recommendation routes...", "routes");

  // Get user's recommendations
  app.get('/api/recommendations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get recommendations for current user
      const userId = req.currentUser?.id || 0;
      log(`Fetching recommendations for user ${userId}`, 'recommendation-route');
      
      const recommendations = await recommendationService.getRecommendationsForUser(userId);
      log(`Found ${recommendations.length} recommendations for user ${userId}`, 'recommendation-route');
      
      // Debug log the first recommendation if available
      if (recommendations.length > 0) {
        log(`First recommendation: ${JSON.stringify(recommendations[0], null, 2)}`, 'recommendation-route');
      }
      
      // Make sure to serialize dates properly
      const serializedRecommendations = recommendations.map(rec => ({
        ...rec,
        createdAt: rec.createdAt ? rec.createdAt.toISOString() : null,
        expiresAt: rec.expiresAt ? rec.expiresAt.toISOString() : null,
        implementedAt: rec.implementedAt ? rec.implementedAt.toISOString() : null
      }));
      
      log(`Sending ${serializedRecommendations.length} serialized recommendations`, 'recommendation-route');
      res.json(serializedRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });
  
  // Create a new recommendation
  app.post('/api/recommendations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.currentUser?.id || 0;
      const organizationId = req.currentUser?.organizationId || 0;
      
      // Create recommendation with data from request body
      const recommendationData = {
        ...req.body,
        userId,
        organizationId
      };
      
      const newRecommendation = await recommendationService.createRecommendation(recommendationData);
      
      res.status(201).json(newRecommendation);
    } catch (error) {
      console.error('Error creating recommendation:', error);
      res.status(500).json({ error: 'Failed to create recommendation' });
    }
  });

  // Generate recommendations for the current user
  app.post('/api/recommendations/generate', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.currentUser?.id || 0;
      
      // Generate recommendations
      const recommendations = await recommendationService.generateRecommendationsForUser(userId);
      
      res.json({
        success: true,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  // Get a specific recommendation
  app.get('/api/recommendations/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recommendationId = req.params.id;
      const recommendation = await recommendationService.getRecommendation(recommendationId);
      
      if (!recommendation) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }
      
      res.json(recommendation);
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      res.status(500).json({ error: 'Failed to fetch recommendation' });
    }
  });

  // Mark a recommendation as implemented
  app.post('/api/recommendations/:id/implement', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recommendationId = req.params.id;
      const note = req.body.note;
      
      const updatedRecommendation = await recommendationService.implementRecommendation(
        recommendationId,
        note
      );
      
      if (!updatedRecommendation) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }
      
      res.json(updatedRecommendation);
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      res.status(500).json({ error: 'Failed to implement recommendation' });
    }
  });

  // Delete a recommendation
  app.delete('/api/recommendations/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recommendationId = req.params.id;
      const success = await recommendationService.deleteRecommendation(recommendationId);
      
      if (!success) {
        return res.status(404).json({ error: 'Recommendation not found or could not be deleted' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      res.status(500).json({ error: 'Failed to delete recommendation' });
    }
  });

  log("Recommendation routes registered", "routes");
}