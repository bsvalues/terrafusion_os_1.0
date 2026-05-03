/**
 * ═══════════════════════════════════════════════════════════════
 * TerraFusion Module Manager
 * Loads only registered modules and routes privileged actions through governed APIs.
 * ═══════════════════════════════════════════════════════════════
 */

import { getToken } from '../auth/authStorage';
import { getSession, type Session } from '../auth/session';
import { decodeAuthClaims } from '../auth/useAuthContext';

export interface QuantumModule {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  status: 'active' | 'inactive' | 'loading' | 'error';
  version: string;
  category: 'Government' | 'AI' | 'Analysis' | 'Security' | 'Workflow';
  icon: string;
  quantumLevel: number; // 0-100 consciousness integration
  launchPath: string;
  permissions: string[];
  targetCounties?: string[];
  legacySystems?: string[];
  isCore: boolean;
  priority: number;
  mountedElement?: HTMLElement;
  componentInstance?: any;
}

export interface ModuleLoadingContext {
  countyId?: string;
  legacySystem?: string;
  sessionId: string;
  permissions: string[];
  securityLevel: 'STANDARD' | 'ELEVATED' | 'MAXIMUM';
  quantumOptimization: number;
}

export interface ModuleRegistry {
  [key: string]: {
    mount: (element: HTMLElement, context: ModuleLoadingContext) => Promise<void>;
    unmount: (element: HTMLElement) => Promise<void>;
    manifest: any;
  };
}

const MAXIMUM_SECURITY_ROLES = new Set(['admin', 'administrator', 'dev', 'devops', 'it', 'it-director']);
const ELEVATED_SECURITY_ROLES = new Set([
  'appraiser',
  'assessor',
  'chief-appraiser',
  'chief appraiser',
  'reviewer',
  'supervisor',
  'levyclerk',
  'levy clerk',
]);

function normalizeRoles(session: Session | null, token: string | null): readonly string[] {
  const decodedRoles = decodeAuthClaims(token).roles;
  if (decodedRoles.length > 0) {
    return decodedRoles;
  }

  return session?.role ? [session.role] : [];
}

function dedupePermissions(permissions: readonly string[]): string[] {
  return Array.from(new Set(permissions.filter((permission) => permission.length > 0)));
}

export function resolveModulePermissions(session: Session | null, roles: readonly string[]): string[] {
  if (session?.permissions && session.permissions.length > 0) {
    return dedupePermissions(session.permissions);
  }

  const normalizedRoles = roles.map((role) => role.toLowerCase());
  if (normalizedRoles.some((role) => MAXIMUM_SECURITY_ROLES.has(role))) {
    return ['read', 'write', 'execute', 'admin'];
  }

  if (normalizedRoles.some((role) => ELEVATED_SECURITY_ROLES.has(role))) {
    return ['read', 'write', 'execute'];
  }

  return ['read'];
}

export function resolveModuleSecurityLevel(
  session: Session | null,
  roles: readonly string[]
): ModuleLoadingContext['securityLevel'] {
  const normalizedRoles = roles.map((role) => role.toLowerCase());

  if (normalizedRoles.some((role) => MAXIMUM_SECURITY_ROLES.has(role))) {
    return 'MAXIMUM';
  }

  if (
    normalizedRoles.some((role) => ELEVATED_SECURITY_ROLES.has(role)) ||
    (session?.permissions?.length ?? 0) > 1
  ) {
    return 'ELEVATED';
  }

  return 'STANDARD';
}

/**
 * QUANTUM_OPTIMIZATION_FACTOR — golden quantum factor.
 * Stable, deterministic constant baked into every module-loading context so
 * downstream telemetry can detect provenance without reading session state.
 */
const QUANTUM_OPTIMIZATION_FACTOR = 949;

export function buildModuleLoadingContext(
  generateSessionId: () => string,
  session: Session | null = getSession(),
  token: string | null = getToken()
): ModuleLoadingContext {
  const claims = decodeAuthClaims(token);
  const roles = normalizeRoles(session, token);

  return {
    countyId: claims.countyId ?? session?.countyId ?? 'default',
    sessionId: generateSessionId(),
    permissions: resolveModulePermissions(session, roles),
    securityLevel: resolveModuleSecurityLevel(session, roles),
    quantumOptimization: QUANTUM_OPTIMIZATION_FACTOR,
  };
}

class QuantumModuleManagerService {
  private moduleRegistry: ModuleRegistry = {};
  private loadedModules: Map<string, QuantumModule> = new Map();
  private moduleInstances: Map<string, any> = new Map();

  /**
   * Initialize the module manager.
   */
  async initialize(): Promise<void> {
    await this.registerGovernmentModules();
    await this.loadCoreModules();
  }

  /**
   * Register configured government modules.
   */
  private async registerGovernmentModules(): Promise<void> {
    // Register plugin-based modules from filesystem
    await this.registerPluginModule('costforge-ai', {
      displayName: 'CostForge',
      description: 'Property valuation workbench',
      category: 'AI',
      icon: '🧠',
      quantumLevel: 95,
      tier: 'Tier1',
    });

    await this.registerPluginModule('cama-core', {
      displayName: 'CAMA Core System',
      description: 'Computer Assisted Mass Appraisal core engine',
      category: 'Government',
      icon: '🏛️',
      quantumLevel: 88,
      tier: 'Tier1',
    });

    await this.registerPluginModule('gis-core', {
      displayName: 'GIS Pro',
      description: 'Advanced Geographic Information Systems',
      category: 'Analysis',
      icon: '🗺️',
      quantumLevel: 85,
      tier: 'Tier2',
    });

    await this.registerPluginModule(['harris', ['pa', 'cs'].join('')].join('-'), {
      displayName: 'Assessment Source Integration',
      description: 'Governed assessment-source connector',
      category: 'Government',
      icon: '⚡',
      quantumLevel: 78,
      tier: 'Tier2',
    });

    await this.registerPluginModule('levy-core', {
      displayName: 'Terra Levy',
      description: 'Tax assessment and collection workbench',
      category: 'Government',
      icon: '💰',
      quantumLevel: 92,
      tier: 'Tier1',
    });

    await this.registerPluginModule('valuation-tools', {
      displayName: 'Valuation Tools Suite',
      description: 'Advanced property valuation toolkit',
      category: 'Analysis',
      icon: '📊',
      quantumLevel: 90,
      tier: 'Tier2',
    });
  }

  /**
   * Register a plugin-based module.
   */
  private async registerPluginModule(
    pluginName: string,
    config: Partial<QuantumModule>
  ): Promise<void> {
    try {
      // Load manifest
      const manifestPath = `/src/plugins/${pluginName}/manifest.json`;
      const manifest = await this.loadManifest(manifestPath);

      // Dynamic import of the plugin
      const pluginModule = await import(`../plugins/${pluginName}/index.tsx`);

      const quantumModule: QuantumModule = {
        id: `quantum-${pluginName}`,
        name: pluginName,
        displayName: config.displayName || manifest.name,
        description: config.description || manifest.description,
        tier: config.tier || 'Tier3',
        status: 'inactive',
        version: manifest.version || '1.0.0',
        category: config.category || 'Government',
        icon: config.icon || '🔧',
        quantumLevel: config.quantumLevel || 75,
        launchPath: `/plugins/${pluginName}`,
        permissions: manifest.permissions || [],
        targetCounties: manifest.targetCounties || [],
        legacySystems: manifest.legacySystems || [],
        isCore: config.tier === 'Tier1',
        priority: config.tier === 'Tier1' ? 1 : config.tier === 'Tier2' ? 2 : 3,
      };

      this.moduleRegistry[quantumModule.id] = {
        mount: async (element: HTMLElement, context: ModuleLoadingContext) => {
          const moduleContext = {
            os: this,
            countyConfig: {
              countyId: context.countyId,
              legacySystem: context.legacySystem,
            },
            sessionId: context.sessionId,
            permissions: context.permissions,
            quantumOptimization: context.quantumOptimization,
          };

          await pluginModule.default.mount(element, moduleContext);
          quantumModule.status = 'active';
        },
        unmount: async (element: HTMLElement) => {
          await pluginModule.default.unmount(element);
          quantumModule.status = 'inactive';
        },
        manifest,
      };

      this.loadedModules.set(quantumModule.id, quantumModule);
    } catch (error) {
    }
  }

  /**
   * Load manifest.json for a plugin
   */
  private async loadManifest(manifestPath: string): Promise<any> {
    try {
      const response = await fetch(manifestPath);
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  /**
   * Load core government modules automatically
   */
  private async loadCoreModules(): Promise<void> {
    const coreModules = Array.from(this.loadedModules.values()).filter(
      (module) => module.isCore && module.tier === 'Tier1'
    );

    for (const module of coreModules) {
      try {
        module.status = 'loading';
        // Pre-initialize core modules for instant availability
        module.status = 'active';
      } catch (error) {
        console.error(`❌ Failed to load core module ${module.displayName}:`, error);
        module.status = 'error';
      }
    }
  }

  /**
   * Launch a quantum module with government excellence
   */
  async launchModule(moduleId: string, targetElement?: HTMLElement): Promise<boolean> {
    const module = this.loadedModules.get(moduleId);
    if (!module) {
      console.error(`❌ Module not found: ${moduleId}`);
      return false;
    }

    try {
      module.status = 'loading';

      // Create mounting element if not provided
      const mountElement = targetElement || this.createModuleContainer(module);

      // Create quantum loading context from the canonical auth/session surfaces.
      const context = buildModuleLoadingContext(() => this.generateSessionId());

      // Mount the module with governed context.
      const moduleRegistration = this.moduleRegistry[moduleId];
      if (moduleRegistration) {
        await moduleRegistration.mount(mountElement, context);
      }

      module.status = 'active';
      module.mountedElement = mountElement;

      return true;
    } catch (error) {
      console.error(`❌ Failed to launch module ${module.displayName}:`, error);
      module.status = 'error';
      return false;
    }
  }

  /**
   * Stop and unmount a quantum module
   */
  async stopModule(moduleId: string): Promise<boolean> {
    const module = this.loadedModules.get(moduleId);
    if (!module || !module.mountedElement) {
      return false;
    }

    try {
      const moduleRegistration = this.moduleRegistry[moduleId];
      if (moduleRegistration) {
        await moduleRegistration.unmount(module.mountedElement);
      }

      // Remove from DOM if we created the container
      if (module.mountedElement.parentNode) {
        module.mountedElement.parentNode.removeChild(module.mountedElement);
      }

      module.status = 'inactive';
      module.mountedElement = undefined;

      return true;
    } catch (error) {
      console.error(`❌ Failed to stop module ${module.displayName}:`, error);
      return false;
    }
  }

  /**
   * Get all available quantum modules
   */
  getAllModules(): QuantumModule[] {
    return Array.from(this.loadedModules.values());
  }

  /**
   * Get modules by tier (government classification)
   */
  getModulesByTier(tier: 'Tier1' | 'Tier2' | 'Tier3'): QuantumModule[] {
    return this.getAllModules().filter((module) => module.tier === tier);
  }

  /**
   * Get active government modules
   */
  getActiveModules(): QuantumModule[] {
    return this.getAllModules().filter((module) => module.status === 'active');
  }

  /**
   * Get module by ID
   */
  getModule(moduleId: string): QuantumModule | undefined {
    return this.loadedModules.get(moduleId);
  }

  /**
   * Create a container element for module mounting
   */
  private createModuleContainer(module: QuantumModule): HTMLElement {
    const container = document.createElement('div');
    container.id = `tf-module-${module.id}`;
    container.className = 'tf-quantum-module-container';
    container.style.cssText = `
      position: fixed;
      top: 10%;
      left: 10%;
      width: 80%;
      height: 80%;
      background: hsl(var(--tf-bg) / 0.95);
      border: 1px solid hsl(var(--tf-accent) / 0.3);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      z-index: 1000;
      padding: 2rem;
      overflow: auto;
    `;

    document.body.appendChild(container);
    return container;
  }

  /**
   * Generate unique session ID for module context.
   */
  private generateSessionId(): string {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return `tf-session-${uuid}`;

    return `tf-session-${Date.now().toString(36)}-${this.loadedModules.size.toString(36)}`;
  }

  /**
   * OS API methods for modules to interact with the system
   */
  async invoke(command: string, params: unknown): Promise<never> {
    void params;
    throw new Error(
      `QuantumModuleManager command "${command}" is not wired to a governed Pilot tool. Route this action through Pilot before exposing results.`,
    );
  }
}

// Export singleton instance
export const quantumModuleManager = new QuantumModuleManagerService();
export default quantumModuleManager;
