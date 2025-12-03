/**
 * TerraFusion Native Shell - Suite Registry
 * Loads, validates, and manages suite manifests
 */

import { SuiteManifest, SuiteState, SuiteStatus } from './types';

class SuiteRegistry {
  private suites: Map<string, SuiteState> = new Map();
  private manifestCache: Map<string, SuiteManifest> = new Map();

  /**
   * Load all suite manifests from /suites/*.json
   */
  async loadAllSuites(): Promise<void> {
    try {
      // In production, this would fetch from /suites/ directory
      // For now, load the manifests we have
      const levyManifest = await this.loadManifest('levy');

      if (levyManifest) {
        this.registerSuite(levyManifest);
      }
    } catch (error) {
      console.error('Failed to load suites:', error);
    }
  }

  /**
   * Load a specific suite manifest
   */
  private async loadManifest(suiteId: string): Promise<SuiteManifest | null> {
    try {
      const response = await fetch(`/suites/${suiteId}-suite.json`);
      if (!response.ok) return null;

      const manifest: SuiteManifest = await response.json();
      this.validateManifest(manifest);
      this.manifestCache.set(suiteId, manifest);

      return manifest;
    } catch (error) {
      console.error(`Failed to load manifest for ${suiteId}:`, error);
      return null;
    }
  }

  /**
   * Validate suite manifest against schema
   */
  private validateManifest(manifest: SuiteManifest): void {
    if (!manifest.id || !manifest.label || !manifest.category) {
      throw new Error('Invalid manifest: missing required fields');
    }

    if (!['core', 'premium', 'enterprise'].includes(manifest.category)) {
      throw new Error(`Invalid category: ${manifest.category}`);
    }

    if (!Array.isArray(manifest.webApps) || !Array.isArray(manifest.nativeModules)) {
      throw new Error('Invalid manifest: webApps and nativeModules must be arrays');
    }

    // Validate permission format
    manifest.permissions.forEach((perm) => {
      if (!perm.startsWith('ROLE_')) {
        throw new Error(`Invalid permission format: ${perm} (must start with ROLE_)`);
      }
    });
  }

  /**
   * Register a suite in the registry
   */
  private registerSuite(manifest: SuiteManifest): void {
    const state: SuiteState = {
      manifest,
      status: 'inactive',
      mountedApps: new Set(),
      mountedModules: new Set(),
      activeEngines: new Set(),
    };

    this.suites.set(manifest.id, state);
  }

  /**
   * Get all registered suites
   */
  getAllSuites(): SuiteState[] {
    return Array.from(this.suites.values());
  }

  /**
   * Get suite by ID
   */
  getSuite(suiteId: string): SuiteState | undefined {
    return this.suites.get(suiteId);
  }

  /**
   * Update suite status
   */
  updateSuiteStatus(suiteId: string, status: SuiteStatus, error?: string): void {
    const suite = this.suites.get(suiteId);
    if (!suite) return;

    suite.status = status;
    if (error) suite.error = error;
    if (status === 'active') suite.loadedAt = new Date();
  }

  /**
   * Check if suite has required dependencies loaded
   */
  areDependenciesLoaded(suiteId: string): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite || !suite.manifest.dependencies) return true;

    return suite.manifest.dependencies.every((depId) => {
      const dep = this.suites.get(depId);
      return dep && dep.status === 'active';
    });
  }

  /**
   * Get load order for suites (topological sort by dependencies)
   */
  getLoadOrder(suiteIds: string[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const suite = this.suites.get(id);
      if (suite?.manifest.dependencies) {
        suite.manifest.dependencies.forEach(visit);
      }

      order.push(id);
    };

    suiteIds.forEach(visit);
    return order;
  }
}

export const suiteRegistry = new SuiteRegistry();
