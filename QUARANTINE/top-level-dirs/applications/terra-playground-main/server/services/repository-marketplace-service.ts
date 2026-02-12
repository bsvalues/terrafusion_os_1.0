import { IStorage } from '../storage';
import {
  Repository,
  RepositoryVersion,
  RepositoryReview,
  RepositoryDependency,
  InsertRepository,
  InsertRepositoryVersion,
  InsertRepositoryReview,
  InsertRepositoryDependency,
  RepositoryType,
  RepositoryVisibility,
  RepositoryLicense,
} from '../../shared/schema';

/**
 * RepositoryMarketplaceService provides functionality for managing repositories
 * in the Terra Fusion Repository Marketplace.
 */
export class RepositoryMarketplaceService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Get all repositories with optional filtering
   */
  async getRepositories(filters?: {
    repositoryType?: string;
    visibility?: string;
    tags?: string[];
    featured?: boolean;
  }): Promise<Repository[]> {
    return this.storage.getRepositories(filters);
  }

  /**
   * Get a repository by ID
   */
  async getRepositoryById(id: number): Promise<Repository | undefined> {
    return this.storage.getRepositoryById(id);
  }

  /**
   * Get a repository by name
   */
  async getRepositoryByName(name: string): Promise<Repository | undefined> {
    return this.storage.getRepositoryByName(name);
  }

  /**
   * Create a new repository
   */
  async createRepository(repository: InsertRepository): Promise<Repository> {
    return this.storage.createRepository(repository);
  }

  /**
   * Update an existing repository
   */
  async updateRepository(
    id: number,
    updates: Partial<InsertRepository>
  ): Promise<Repository | undefined> {
    return this.storage.updateRepository(id, updates);
  }

  /**
   * Delete a repository
   */
  async deleteRepository(id: number): Promise<boolean> {
    return this.storage.deleteRepository(id);
  }

  /**
   * Star a repository
   */
  async starRepository(id: number): Promise<Repository | undefined> {
    return this.storage.incrementRepositoryStars(id);
  }

  /**
   * Fork a repository
   */
  async forkRepository(id: number): Promise<Repository | undefined> {
    return this.storage.incrementRepositoryForks(id);
  }

  /**
   * Get repositories by owner
   */
  async getRepositoriesByOwner(ownerId: number): Promise<Repository[]> {
    return this.storage.getRepositoriesByOwner(ownerId);
  }

  /**
   * Get featured repositories
   */
  async getFeaturedRepositories(): Promise<Repository[]> {
    return this.storage.getFeaturedRepositories();
  }

  /**
   * Search repositories by various criteria
   */
  async searchRepositories(query: string): Promise<Repository[]> {
    // Get all repositories
    const allRepositories = await this.storage.getRepositories();

    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();

    // Filter repositories based on the query
    return allRepositories.filter(repo => {
      // Check if query matches repository name, display name, or description
      return (
        repo.name.toLowerCase().includes(lowerQuery) ||
        repo.displayName.toLowerCase().includes(lowerQuery) ||
        (repo.description && repo.description.toLowerCase().includes(lowerQuery)) ||
        // Check if query matches any tags
        (repo.tags && repo.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    });
  }

  /**
   * Get repository versions
   */
  async getRepositoryVersions(repositoryId: number): Promise<RepositoryVersion[]> {
    return this.storage.getRepositoryVersions(repositoryId);
  }

  /**
   * Get a specific repository version by ID
   */
  async getRepositoryVersionById(id: number): Promise<RepositoryVersion | undefined> {
    return this.storage.getRepositoryVersionById(id);
  }

  /**
   * Get a specific repository version by version string
   */
  async getRepositoryVersionByVersion(
    repositoryId: number,
    version: string
  ): Promise<RepositoryVersion | undefined> {
    return this.storage.getRepositoryVersionByVersion(repositoryId, version);
  }

  /**
   * Create a new repository version
   */
  async createRepositoryVersion(version: InsertRepositoryVersion): Promise<RepositoryVersion> {
    return this.storage.createRepositoryVersion(version);
  }

  /**
   * Update an existing repository version
   */
  async updateRepositoryVersion(
    id: number,
    updates: Partial<InsertRepositoryVersion>
  ): Promise<RepositoryVersion | undefined> {
    return this.storage.updateRepositoryVersion(id, updates);
  }

  /**
   * Set a repository version as the latest version
   */
  async setRepositoryVersionAsLatest(id: number): Promise<RepositoryVersion | undefined> {
    return this.storage.setRepositoryVersionAsLatest(id);
  }

  /**
   * Download a repository version
   */
  async downloadRepositoryVersion(id: number): Promise<RepositoryVersion | undefined> {
    return this.storage.incrementVersionDownloads(id);
  }

  /**
   * Get the latest version of a repository
   */
  async getLatestRepositoryVersion(repositoryId: number): Promise<RepositoryVersion | undefined> {
    return this.storage.getLatestRepositoryVersion(repositoryId);
  }

  /**
   * Get repository reviews
   */
  async getRepositoryReviews(repositoryId: number): Promise<RepositoryReview[]> {
    return this.storage.getRepositoryReviews(repositoryId);
  }

  /**
   * Get a specific repository review by ID
   */
  async getRepositoryReviewById(id: number): Promise<RepositoryReview | undefined> {
    return this.storage.getRepositoryReviewById(id);
  }

  /**
   * Create a new repository review
   */
  async createRepositoryReview(review: InsertRepositoryReview): Promise<RepositoryReview> {
    return this.storage.createRepositoryReview(review);
  }

  /**
   * Update an existing repository review
   */
  async updateRepositoryReview(
    id: number,
    updates: Partial<InsertRepositoryReview>
  ): Promise<RepositoryReview | undefined> {
    return this.storage.updateRepositoryReview(id, updates);
  }

  /**
   * Delete a repository review
   */
  async deleteRepositoryReview(id: number): Promise<boolean> {
    return this.storage.deleteRepositoryReview(id);
  }

  /**
   * Get repository reviews by user
   */
  async getRepositoryReviewsByUser(userId: number): Promise<RepositoryReview[]> {
    return this.storage.getRepositoryReviewsByUser(userId);
  }

  /**
   * Get the average rating of a repository
   */
  async getRepositoryAverageRating(repositoryId: number): Promise<number> {
    return this.storage.getRepositoryAverageRating(repositoryId);
  }

  /**
   * Get repository dependencies
   */
  async getRepositoryDependencies(repositoryId: number): Promise<RepositoryDependency[]> {
    return this.storage.getRepositoryDependencies(repositoryId);
  }

  /**
   * Get repositories that depend on a specific repository
   */
  async getDependentRepositories(dependencyRepoId: number): Promise<RepositoryDependency[]> {
    return this.storage.getDependentRepositories(dependencyRepoId);
  }

  /**
   * Create a new repository dependency
   */
  async createRepositoryDependency(
    dependency: InsertRepositoryDependency
  ): Promise<RepositoryDependency> {
    return this.storage.createRepositoryDependency(dependency);
  }

  /**
   * Update an existing repository dependency
   */
  async updateRepositoryDependency(
    id: number,
    updates: Partial<InsertRepositoryDependency>
  ): Promise<RepositoryDependency | undefined> {
    return this.storage.updateRepositoryDependency(id, updates);
  }

  /**
   * Delete a repository dependency
   */
  async deleteRepositoryDependency(id: number): Promise<boolean> {
    return this.storage.deleteRepositoryDependency(id);
  }

  /**
   * Get a repository dependency by ID
   */
  async getRepositoryDependency(id: number): Promise<RepositoryDependency | undefined> {
    return this.storage.getRepositoryDependency(id);
  }
}
