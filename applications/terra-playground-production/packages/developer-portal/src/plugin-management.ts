/**
 * Plugin Management
 *
 * Provides a comprehensive system for managing plugins in the platform:
 * - Plugin discovery and browsing
 * - Plugin installation, update, and removal
 * - Plugin licensing and pricing
 * - Plugin ratings and reviews
 * - Admin approval workflow
 */

import { EventEmitter } from 'events';

// Plugin Category
export enum PluginCategory {
  DATA_VISUALIZATION = 'data_visualization',
  DATA_IMPORT_EXPORT = 'data_import_export',
  MAPPING = 'mapping',
  PROPERTY_ASSESSMENT = 'property_assessment',
  REPORTING = 'reporting',
  WORKFLOW_AUTOMATION = 'workflow_automation',
  SECURITY = 'security',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
  AI = 'ai',
  UI_COMPONENT = 'ui_component',
  THEME = 'theme',
}

// Plugin License Type
export enum PluginLicenseType {
  FREE = 'free',
  PREMIUM = 'premium',
  SUBSCRIPTION = 'subscription',
  TRIAL = 'trial',
  OPEN_SOURCE = 'open_source',
  ENTERPRISE = 'enterprise',
}

// Plugin Status
export enum PluginStatus {
  PUBLISHED = 'published',
  PENDING_APPROVAL = 'pending_approval',
  DRAFT = 'draft',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

// Installation Status
export enum InstallationStatus {
  INSTALLED = 'installed',
  INSTALLING = 'installing',
  NOT_INSTALLED = 'not_installed',
  UPDATE_AVAILABLE = 'update_available',
  ERROR = 'error',
}

// Plugin Pricing
export interface PluginPricing {
  licenseType: PluginLicenseType;
  price?: number;
  currency?: string;
  billingPeriod?: 'one_time' | 'monthly' | 'annual';
  trialDays?: number;
  enterpriseContact?: string;
}

// Plugin Requirement
export interface PluginRequirement {
  name: string;
  minVersion: string;
  maxVersion?: string;
  type: 'core' | 'plugin' | 'system';
  required: boolean;
}

// Plugin Author
export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
  organization?: string;
}

// Plugin Review
export interface PluginReview {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

// Plugin Version
export interface PluginVersion {
  version: string;
  changelog: string;
  publishedAt: Date;
  minCoreVersion: string;
  downloadUrl: string;
  size: number; // In bytes
}

// Plugin Entity
export interface PluginEntity {
  id: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  category: PluginCategory;
  status: PluginStatus;
  installationStatus: InstallationStatus;
  versions: PluginVersion[];
  currentVersion: string;
  author: PluginAuthor;
  pricing: PluginPricing;
  requirements: PluginRequirement[];
  tags: string[];
  screenshotUrls: string[];
  demoUrl?: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  supportUrl?: string;
  reviews: PluginReview[];
  averageRating: number;
  downloads: number;
  installDate?: Date;
  licenseExpiryDate?: Date;
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Plugin Installation Options
export interface PluginInstallOptions {
  version?: string; // Specific version or latest if not specified
  skipDependencies?: boolean;
  force?: boolean;
}

/**
 * Plugin Manager
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginEntity> = new Map();
  private installedPlugins: Set<string> = new Set();

  constructor() {
    super();
  }

  /**
   * Initialize the plugin manager
   */
  public initialize(): void {
    this.emit('initialized');
  }

  /**
   * Register a new plugin
   */
  public registerPlugin(
    plugin: Omit<
      PluginEntity,
      'id' | 'averageRating' | 'installationStatus' | 'createdAt' | 'updatedAt'
    >
  ): PluginEntity {
    const id = `plugin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Calculate average rating
    const averageRating =
      plugin.reviews.length > 0
        ? plugin.reviews.reduce((sum, review) => sum + review.rating, 0) / plugin.reviews.length
        : 0;

    const newPlugin: PluginEntity = {
      ...plugin,
      id,
      averageRating,
      installationStatus: InstallationStatus.NOT_INSTALLED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.plugins.set(id, newPlugin);

    `);
    this.emit('plugin:registered', newPlugin);

    return newPlugin;
  }

  /**
   * Update an existing plugin
   */
  public updatePlugin(
    id: string,
    updates: Partial<Omit<PluginEntity, 'id' | 'averageRating' | 'createdAt' | 'updatedAt'>>
  ): PluginEntity | null {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return null;
    }

    // Recalculate average rating if reviews changed
    let averageRating = plugin.averageRating;
    if (updates.reviews) {
      averageRating =
        updates.reviews.length > 0
          ? updates.reviews.reduce((sum, review) => sum + review.rating, 0) / updates.reviews.length
          : 0;
    }

    const updatedPlugin: PluginEntity = {
      ...plugin,
      ...updates,
      averageRating,
      updatedAt: new Date(),
    };

    this.plugins.set(id, updatedPlugin);

    `);
    this.emit('plugin:updated', updatedPlugin);

    return updatedPlugin;
  }

  /**
   * Change plugin status
   */
  public changePluginStatus(id: string, status: PluginStatus): PluginEntity | null {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return null;
    }

    const previousStatus = plugin.status;

    const updatedPlugin = this.updatePlugin(id, { status });

    if (updatedPlugin) {
      this.emit('plugin:status-changed', {
        plugin: updatedPlugin,
        previousStatus,
        newStatus: status,
      });
    }

    return updatedPlugin;
  }

  /**
   * Add a plugin version
   */
  public addPluginVersion(id: string, version: PluginVersion): PluginEntity | null {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return null;
    }

    // Check if version already exists
    const existingIndex = plugin.versions.findIndex(v => v.version === version.version);

    if (existingIndex >= 0) {
      console.error(`Version ${version.version} already exists for plugin ${id}`);
      return null;
    }

    // Add the new version
    const updatedVersions = [...plugin.versions, version];

    // Sort versions in descending order (newest first)
    updatedVersions.sort((a, b) => {
      return this.compareVersions(b.version, a.version);
    });

    const updatedPlugin = this.updatePlugin(id, {
      versions: updatedVersions,
      currentVersion:
        this.compareVersions(version.version, plugin.currentVersion) > 0
          ? version.version
          : plugin.currentVersion,
    });

    if (updatedPlugin) {
      this.emit('plugin:version-added', { plugin: updatedPlugin, version });

      // If the plugin is installed and a newer version is available, update the installation status
      if (
        this.installedPlugins.has(id) &&
        updatedPlugin.installationStatus !== InstallationStatus.UPDATE_AVAILABLE &&
        this.compareVersions(version.version, updatedPlugin.currentVersion) > 0
      ) {
        this.updatePlugin(id, { installationStatus: InstallationStatus.UPDATE_AVAILABLE });
      }
    }

    return updatedPlugin;
  }

  /**
   * Add a plugin review
   */
  public addPluginReview(
    id: string,
    review: Omit<PluginReview, 'id' | 'createdAt' | 'updatedAt'>
  ): PluginReview | null {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return null;
    }

    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newReview: PluginReview = {
      ...review,
      id: reviewId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add the review
    const updatedReviews = [...plugin.reviews, newReview];

    // Update the plugin
    this.updatePlugin(id, { reviews: updatedReviews });

    this.emit('plugin:review-added', { plugin, review: newReview });

    return newReview;
  }

  /**
   * Install a plugin
   */
  public async installPlugin(id: string, options: PluginInstallOptions = {}): Promise<boolean> {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return false;
    }

    // Check if plugin is already installed
    if (this.installedPlugins.has(id) && !options.force) {
      console.error(`Plugin ${id} is already installed`);
      return false;
    }

    // Update installation status
    this.updatePlugin(id, { installationStatus: InstallationStatus.INSTALLING });

    try {
      // In a real implementation, this would install the plugin
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as installed
      this.installedPlugins.add(id);

      const updateResult = this.updatePlugin(id, {
        installationStatus: InstallationStatus.INSTALLED,
        installDate: new Date(),
      });

      if (updateResult) {
        this.emit('plugin:installed', updateResult);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error installing plugin ${id}:`, error);

      this.updatePlugin(id, { installationStatus: InstallationStatus.ERROR });

      this.emit('plugin:installation-error', { plugin, error });

      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  public async uninstallPlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return false;
    }

    // Check if plugin is installed
    if (!this.installedPlugins.has(id)) {
      console.error(`Plugin ${id} is not installed`);
      return false;
    }

    try {
      // In a real implementation, this would uninstall the plugin
      // Simulate uninstallation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as not installed
      this.installedPlugins.delete(id);

      const updateResult = this.updatePlugin(id, {
        installationStatus: InstallationStatus.NOT_INSTALLED,
        installDate: undefined,
      });

      if (updateResult) {
        this.emit('plugin:uninstalled', updateResult);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error uninstalling plugin ${id}:`, error);

      this.emit('plugin:uninstallation-error', { plugin, error });

      return false;
    }
  }

  /**
   * Update a plugin
   */
  public async updatePluginToLatest(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      console.error(`Plugin not found: ${id}`);
      return false;
    }

    // Check if plugin is installed
    if (!this.installedPlugins.has(id)) {
      console.error(`Plugin ${id} is not installed`);
      return false;
    }

    // Check if there's a newer version
    const latestVersion = plugin.versions[0]?.version;
    if (!latestVersion || this.compareVersions(latestVersion, plugin.currentVersion) <= 0) {
      return false;
    }

    try {
      // In a real implementation, this would update the plugin
      // Simulate update
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updateResult = this.updatePlugin(id, {
        currentVersion: latestVersion,
        installationStatus: InstallationStatus.INSTALLED,
        installDate: new Date(),
      });

      if (updateResult) {
        this.emit('plugin:updated-version', updateResult);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating plugin ${id}:`, error);

      this.emit('plugin:update-error', { plugin, error });

      return false;
    }
  }

  /**
   * Get a plugin by ID
   */
  public getPlugin(id: string): PluginEntity | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all plugins
   */
  public getAllPlugins(): PluginEntity[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by category
   */
  public getPluginsByCategory(category: PluginCategory): PluginEntity[] {
    return this.getAllPlugins().filter(plugin => plugin.category === category);
  }

  /**
   * Get plugins by status
   */
  public getPluginsByStatus(status: PluginStatus): PluginEntity[] {
    return this.getAllPlugins().filter(plugin => plugin.status === status);
  }

  /**
   * Get installed plugins
   */
  public getInstalledPlugins(): PluginEntity[] {
    return this.getAllPlugins().filter(plugin => this.installedPlugins.has(plugin.id));
  }

  /**
   * Get plugins with updates available
   */
  public getPluginsWithUpdates(): PluginEntity[] {
    return this.getAllPlugins().filter(
      plugin => plugin.installationStatus === InstallationStatus.UPDATE_AVAILABLE
    );
  }

  /**
   * Get featured plugins
   */
  public getFeaturedPlugins(): PluginEntity[] {
    return this.getAllPlugins().filter(
      plugin => plugin.featured && plugin.status === PluginStatus.PUBLISHED
    );
  }

  /**
   * Get plugins by tag
   */
  public getPluginsByTag(tag: string): PluginEntity[] {
    return this.getAllPlugins().filter(plugin => plugin.tags.includes(tag));
  }

  /**
   * Get plugins by license type
   */
  public getPluginsByLicenseType(licenseType: PluginLicenseType): PluginEntity[] {
    return this.getAllPlugins().filter(plugin => plugin.pricing.licenseType === licenseType);
  }

  /**
   * Search plugins
   */
  public searchPlugins(query: string): PluginEntity[] {
    query = query.toLowerCase();

    return this.getAllPlugins().filter(plugin => {
      // Only search published plugins
      if (plugin.status !== PluginStatus.PUBLISHED) return false;

      return (
        plugin.name.toLowerCase().includes(query) ||
        plugin.displayName.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.longDescription?.toLowerCase().includes(query) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(query)) ||
        plugin.author.name.toLowerCase().includes(query)
      );
    });
  }

  /**
   * Compare two version strings
   * Returns:
   * - positive if version1 > version2
   * - negative if version1 < version2
   * - zero if version1 === version2
   */
  private compareVersions(version1: string, version2: string): number {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);

    // Compare each part
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 !== part2) {
        return part1 - part2;
      }
    }

    return 0;
  }

  /**
   * Check if a plugin's license is valid
   */
  public isLicenseValid(id: string): boolean {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      return false;
    }

    // Free and open source plugins are always valid
    if (
      plugin.pricing.licenseType === PluginLicenseType.FREE ||
      plugin.pricing.licenseType === PluginLicenseType.OPEN_SOURCE
    ) {
      return true;
    }

    // Check expiry date for other license types
    if (plugin.licenseExpiryDate) {
      return plugin.licenseExpiryDate > new Date();
    }

    return false;
  }

  /**
   * Get plugin marketplace statistics
   */
  public getMarketplaceStatistics(): any {
    const plugins = this.getAllPlugins();
    const publishedPlugins = plugins.filter(p => p.status === PluginStatus.PUBLISHED);

    const stats = {
      totalPlugins: plugins.length,
      publishedPlugins: publishedPlugins.length,
      pendingApproval: plugins.filter(p => p.status === PluginStatus.PENDING_APPROVAL).length,
      installedPlugins: this.installedPlugins.size,
      byCategory: {} as Record<string, number>,
      byLicenseType: {} as Record<string, number>,
      topDownloaded: [] as any[],
      topRated: [] as any[],
    };

    // Count by category
    for (const category of Object.values(PluginCategory)) {
      const count = this.getPluginsByCategory(category as PluginCategory).length;
      if (count > 0) {
        stats.byCategory[category] = count;
      }
    }

    // Count by license type
    for (const licenseType of Object.values(PluginLicenseType)) {
      const count = this.getPluginsByLicenseType(licenseType as PluginLicenseType).length;
      if (count > 0) {
        stats.byLicenseType[licenseType] = count;
      }
    }

    // Top downloaded plugins
    stats.topDownloaded = [...publishedPlugins]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.displayName,
        downloads: p.downloads,
        rating: p.averageRating,
      }));

    // Top rated plugins (minimum 5 reviews)
    stats.topRated = [...publishedPlugins]
      .filter(p => p.reviews.length >= 5)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.displayName,
        rating: p.averageRating,
        reviews: p.reviews.length,
      }));

    return stats;
  }
}

/**
 * Create a new plugin manager
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}

