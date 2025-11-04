import express, { Router } from 'express';
import { RepositoryMarketplaceService } from '../services/repository-marketplace-service';
import { IStorage } from '../storage';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  repositories,
  repositoryVersions,
  repositoryReviews,
  repositoryDependencies,
} from '../../shared/schema';

/**
 * Create repository marketplace routes
 * @param storage The storage implementation
 * @returns The router with repository marketplace routes
 */
export function createRepositoryMarketplaceRoutes(storage: IStorage): Router {
  // Create a router instance
  const router = express.Router();

  // Create a repository marketplace service instance
  const repositoryMarketplaceService = new RepositoryMarketplaceService(storage);

  // Create the Zod schemas for validation
  const insertRepositorySchema = createInsertSchema(repositories).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    stars: true,
    forks: true,
    downloads: true,
    featured: true,
  });
  const insertVersionSchema = createInsertSchema(repositoryVersions).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    downloads: true,
  });
  const insertReviewSchema = createInsertSchema(repositoryReviews).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
  const insertDependencySchema = createInsertSchema(repositoryDependencies).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

  // Repository routes

  /**
   * GET /repositories
   * Get all repositories with optional filtering
   */
  router.get('/repositories', async (req, res) => {
    try {
      const { type, visibility, tags, featured } = req.query;

      const filters: {
        repositoryType?: string;
        visibility?: string;
        tags?: string[];
        featured?: boolean;
      } = {};

      if (type) filters.repositoryType = type as string;
      if (visibility) filters.visibility = visibility as string;
      if (tags) filters.tags = (tags as string).split(',');
      if (featured === 'true') filters.featured = true;

      const repositories = await repositoryMarketplaceService.getRepositories(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json(repositories);
    } catch (error) {
      console.error('Error retrieving repositories:', error);
      res.status(500).json({ error: 'Failed to retrieve repositories' });
    }
  });

  /**
   * GET /repositories/search
   * Search repositories by query
   */
  router.get('/repositories/search', async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }

      const repositories = await repositoryMarketplaceService.searchRepositories(q as string);

      res.json(repositories);
    } catch (error) {
      console.error('Error searching repositories:', error);
      res.status(500).json({ error: 'Failed to search repositories' });
    }
  });

  /**
   * GET /repositories/featured
   * Get featured repositories
   */
  router.get('/repositories/featured', async (req, res) => {
    try {
      const repositories = await repositoryMarketplaceService.getFeaturedRepositories();

      res.json(repositories);
    } catch (error) {
      console.error('Error retrieving featured repositories:', error);
      res.status(500).json({ error: 'Failed to retrieve featured repositories' });
    }
  });

  /**
   * GET /repositories/user/:userId
   * Get repositories by user ID
   */
  router.get('/repositories/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const repositories = await repositoryMarketplaceService.getRepositoriesByOwner(userId);

      res.json(repositories);
    } catch (error) {
      console.error('Error retrieving repositories by user:', error);
      res.status(500).json({ error: 'Failed to retrieve repositories by user' });
    }
  });

  /**
   * GET /repositories/:id
   * Get a repository by ID
   */
  router.get('/repositories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const repository = await repositoryMarketplaceService.getRepositoryById(id);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      res.json(repository);
    } catch (error) {
      console.error('Error retrieving repository:', error);
      res.status(500).json({ error: 'Failed to retrieve repository' });
    }
  });

  /**
   * POST /repositories
   * Create a new repository
   */
  router.post('/repositories', async (req, res) => {
    try {
      const validatedData = insertRepositorySchema.parse(req.body);

      const repository = await repositoryMarketplaceService.createRepository(validatedData);

      res.status(201).json(repository);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error creating repository:', error);
      res.status(500).json({ error: 'Failed to create repository' });
    }
  });

  /**
   * PATCH /repositories/:id
   * Update a repository
   */
  router.patch('/repositories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      // Validate the update data
      const validatedData = insertRepositorySchema.partial().parse(req.body);

      const repository = await repositoryMarketplaceService.updateRepository(id, validatedData);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      res.json(repository);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error updating repository:', error);
      res.status(500).json({ error: 'Failed to update repository' });
    }
  });

  /**
   * DELETE /repositories/:id
   * Delete a repository
   */
  router.delete('/repositories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const success = await repositoryMarketplaceService.deleteRepository(id);

      if (!success) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting repository:', error);
      res.status(500).json({ error: 'Failed to delete repository' });
    }
  });

  /**
   * POST /repositories/:id/star
   * Star a repository
   */
  router.post('/repositories/:id/star', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const repository = await repositoryMarketplaceService.starRepository(id);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      res.json(repository);
    } catch (error) {
      console.error('Error starring repository:', error);
      res.status(500).json({ error: 'Failed to star repository' });
    }
  });

  /**
   * POST /repositories/:id/fork
   * Fork a repository
   */
  router.post('/repositories/:id/fork', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const repository = await repositoryMarketplaceService.forkRepository(id);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      res.json(repository);
    } catch (error) {
      console.error('Error forking repository:', error);
      res.status(500).json({ error: 'Failed to fork repository' });
    }
  });

  // Repository Version routes

  /**
   * GET /repositories/:repositoryId/versions
   * Get versions of a repository
   */
  router.get('/repositories/:repositoryId/versions', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const versions = await repositoryMarketplaceService.getRepositoryVersions(repositoryId);

      res.json(versions);
    } catch (error) {
      console.error('Error retrieving repository versions:', error);
      res.status(500).json({ error: 'Failed to retrieve repository versions' });
    }
  });

  /**
   * GET /repositories/:repositoryId/versions/latest
   * Get the latest version of a repository
   */
  router.get('/repositories/:repositoryId/versions/latest', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const version = await repositoryMarketplaceService.getLatestRepositoryVersion(repositoryId);

      if (!version) {
        return res.status(404).json({ error: 'No versions found for this repository' });
      }

      res.json(version);
    } catch (error) {
      console.error('Error retrieving latest repository version:', error);
      res.status(500).json({ error: 'Failed to retrieve latest repository version' });
    }
  });

  /**
   * GET /repositories/:repositoryId/versions/:versionId
   * Get a specific version of a repository
   */
  router.get('/repositories/:repositoryId/versions/:versionId', async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);

      if (isNaN(versionId)) {
        return res.status(400).json({ error: 'Invalid version ID' });
      }

      const version = await repositoryMarketplaceService.getRepositoryVersionById(versionId);

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json(version);
    } catch (error) {
      console.error('Error retrieving repository version:', error);
      res.status(500).json({ error: 'Failed to retrieve repository version' });
    }
  });

  /**
   * POST /repositories/:repositoryId/versions
   * Create a new version for a repository
   */
  router.post('/repositories/:repositoryId/versions', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      // Check if repository exists
      const repository = await repositoryMarketplaceService.getRepositoryById(repositoryId);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      // Validate the version data
      const validatedData = insertVersionSchema.parse({
        ...req.body,
        repositoryId,
      });

      const version = await repositoryMarketplaceService.createRepositoryVersion(validatedData);

      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error creating repository version:', error);
      res.status(500).json({ error: 'Failed to create repository version' });
    }
  });

  /**
   * PATCH /repositories/:repositoryId/versions/:versionId
   * Update a repository version
   */
  router.patch('/repositories/:repositoryId/versions/:versionId', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);
      const versionId = parseInt(req.params.versionId);

      if (isNaN(repositoryId) || isNaN(versionId)) {
        return res.status(400).json({ error: 'Invalid IDs provided' });
      }

      // Validate the update data
      const validatedData = insertVersionSchema.partial().parse(req.body);

      const version = await repositoryMarketplaceService.updateRepositoryVersion(
        versionId,
        validatedData
      );

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error updating repository version:', error);
      res.status(500).json({ error: 'Failed to update repository version' });
    }
  });

  /**
   * POST /repositories/:repositoryId/versions/:versionId/download
   * Download a repository version
   */
  router.post('/repositories/:repositoryId/versions/:versionId/download', async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);

      if (isNaN(versionId)) {
        return res.status(400).json({ error: 'Invalid version ID' });
      }

      const version = await repositoryMarketplaceService.downloadRepositoryVersion(versionId);

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json(version);
    } catch (error) {
      console.error('Error downloading repository version:', error);
      res.status(500).json({ error: 'Failed to record download' });
    }
  });

  // Repository Review routes

  /**
   * GET /repositories/:repositoryId/reviews
   * Get reviews for a repository
   */
  router.get('/repositories/:repositoryId/reviews', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const reviews = await repositoryMarketplaceService.getRepositoryReviews(repositoryId);

      res.json(reviews);
    } catch (error) {
      console.error('Error retrieving repository reviews:', error);
      res.status(500).json({ error: 'Failed to retrieve repository reviews' });
    }
  });

  /**
   * GET /repositories/:repositoryId/rating
   * Get the average rating for a repository
   */
  router.get('/repositories/:repositoryId/rating', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const rating = await repositoryMarketplaceService.getRepositoryAverageRating(repositoryId);

      res.json({ rating });
    } catch (error) {
      console.error('Error retrieving repository average rating:', error);
      res.status(500).json({ error: 'Failed to retrieve repository average rating' });
    }
  });

  /**
   * POST /repositories/:repositoryId/reviews
   * Create a new review for a repository
   */
  router.post('/repositories/:repositoryId/reviews', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      // Check if repository exists
      const repository = await repositoryMarketplaceService.getRepositoryById(repositoryId);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      // Validate the review data
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        repositoryId,
      });

      const review = await repositoryMarketplaceService.createRepositoryReview(validatedData);

      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error creating repository review:', error);
      res.status(500).json({ error: 'Failed to create repository review' });
    }
  });

  /**
   * PATCH /repositories/:repositoryId/reviews/:reviewId
   * Update a repository review
   */
  router.patch('/repositories/:repositoryId/reviews/:reviewId', async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);

      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'Invalid review ID' });
      }

      // Validate the update data
      const validatedData = insertReviewSchema.partial().parse(req.body);

      const review = await repositoryMarketplaceService.updateRepositoryReview(
        reviewId,
        validatedData
      );

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error updating repository review:', error);
      res.status(500).json({ error: 'Failed to update repository review' });
    }
  });

  /**
   * DELETE /repositories/:repositoryId/reviews/:reviewId
   * Delete a repository review
   */
  router.delete('/repositories/:repositoryId/reviews/:reviewId', async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);

      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'Invalid review ID' });
      }

      const success = await repositoryMarketplaceService.deleteRepositoryReview(reviewId);

      if (!success) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting repository review:', error);
      res.status(500).json({ error: 'Failed to delete repository review' });
    }
  });

  // Repository Dependency routes

  /**
   * GET /repositories/:repositoryId/dependencies
   * Get dependencies for a repository
   */
  router.get('/repositories/:repositoryId/dependencies', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const dependencies =
        await repositoryMarketplaceService.getRepositoryDependencies(repositoryId);

      res.json(dependencies);
    } catch (error) {
      console.error('Error retrieving repository dependencies:', error);
      res.status(500).json({ error: 'Failed to retrieve repository dependencies' });
    }
  });

  /**
   * GET /repositories/:repositoryId/dependents
   * Get repositories that depend on this repository
   */
  router.get('/repositories/:repositoryId/dependents', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      const dependents = await repositoryMarketplaceService.getDependentRepositories(repositoryId);

      res.json(dependents);
    } catch (error) {
      console.error('Error retrieving dependent repositories:', error);
      res.status(500).json({ error: 'Failed to retrieve dependent repositories' });
    }
  });

  /**
   * POST /repositories/:repositoryId/dependencies
   * Add a dependency to a repository
   */
  router.post('/repositories/:repositoryId/dependencies', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.repositoryId);

      if (isNaN(repositoryId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      // Check if repository exists
      const repository = await repositoryMarketplaceService.getRepositoryById(repositoryId);

      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      // Validate the dependency data
      const validatedData = insertDependencySchema.parse({
        ...req.body,
        repositoryId,
      });

      // Check if the dependency repository exists
      const dependencyRepo = await repositoryMarketplaceService.getRepositoryById(
        validatedData.dependencyRepoId
      );

      if (!dependencyRepo) {
        return res.status(404).json({ error: 'Dependency repository not found' });
      }

      const dependency =
        await repositoryMarketplaceService.createRepositoryDependency(validatedData);

      res.status(201).json(dependency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error adding repository dependency:', error);
      res.status(500).json({ error: 'Failed to add repository dependency' });
    }
  });

  /**
   * PATCH /repositories/:repositoryId/dependencies/:dependencyId
   * Update a repository dependency
   */
  router.patch('/repositories/:repositoryId/dependencies/:dependencyId', async (req, res) => {
    try {
      const dependencyId = parseInt(req.params.dependencyId);

      if (isNaN(dependencyId)) {
        return res.status(400).json({ error: 'Invalid dependency ID' });
      }

      // Validate the update data
      const validatedData = insertDependencySchema.partial().parse(req.body);

      const dependency = await repositoryMarketplaceService.updateRepositoryDependency(
        dependencyId,
        validatedData
      );

      if (!dependency) {
        return res.status(404).json({ error: 'Dependency not found' });
      }

      res.json(dependency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      console.error('Error updating repository dependency:', error);
      res.status(500).json({ error: 'Failed to update repository dependency' });
    }
  });

  /**
   * DELETE /repositories/:repositoryId/dependencies/:dependencyId
   * Delete a repository dependency
   */
  router.delete('/repositories/:repositoryId/dependencies/:dependencyId', async (req, res) => {
    try {
      const dependencyId = parseInt(req.params.dependencyId);

      if (isNaN(dependencyId)) {
        return res.status(400).json({ error: 'Invalid dependency ID' });
      }

      const success = await repositoryMarketplaceService.deleteRepositoryDependency(dependencyId);

      if (!success) {
        return res.status(404).json({ error: 'Dependency not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting repository dependency:', error);
      res.status(500).json({ error: 'Failed to delete repository dependency' });
    }
  });

  return router;
}

export default createRepositoryMarketplaceRoutes;
