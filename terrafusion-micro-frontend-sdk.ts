/**
 * TerraFusion cOS Micro-Frontend SDK
 * Reference implementation for vendor module development
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface TerraFusionModuleManifest {
  id: string;                       // "woolpert.securegov"
  version: string;                  // semver
  displayName: string;
  description: string;
  vendor: string;                   // "Woolpert"
  routes: Array<{
    path: string;                   // "/securegov/dashboard"
    slot: "main" | "sidebar" | "modal" | "toolbar";
    icon?: string;
    requiredEntitlements?: string[];// ["cos.agentFabric.use"]
    requiredScopes?: Array<"read"|"write"|"admin">;
    title: string;
  }>;
  permissions: string[];            // "data.parcel.read"
  events?: string[];                // "County.Events.Property.*"
  configSchema?: JsonSchema;        // module settings schema
  minCosApi?: string;               // ">=3.5.0"
  dependencies?: string[];          // ["cos.dataPlane", "cos.securityMesh"]
}

export interface TerraFusionRuntimeBridge {
  auth: {
    getSession(): Promise<{
      sub: string;
      roles: string[];
      tenant: string;
      county: string;
      permissions: string[];
    }>;
    getToken(scope?: string): Promise<string>; // short-lived
    hasPermission(permission: string): boolean;
    hasRole(role: string): boolean;
  };
  
  entitlements: {
    has(flag: string): boolean;
    onChange(callback: () => void): () => void;
    getFlags(): string[];
  };
  
  data: {
    query<T = unknown>(query: TerraFusionQuery): Promise<T>;
    lineage(id: string): Promise<TerraFusionLineageGraph>;
    subscribe(event: string, callback: (data: any) => void): () => void;
    publish(event: string, data: any): Promise<void>;
  };
  
  ui: {
    toast(message: string, level?: "info"|"warn"|"error"|"success"): void;
    registerCommand(command: TerraFusionCommand): void; // for ⌘/Ctrl+K palette
    theme: TerraFusionDesignTokens;                 // read-only tokens
    openModal(component: React.ComponentType<any>, props?: any): void;
    closeModal(): void;
    navigate(path: string): void;
  };
  
  observability: {
    trace(name: string, attrs?: Record<string, unknown>): () => void;
    log(level: "info"|"warn"|"error", message: string, context?: unknown): void;
    metrics: {
      counter(name: string, value?: number): void;
      gauge(name: string, value: number): void;
      histogram(name: string, value: number): void;
    };
  };
  
  security: {
    encrypt(data: string): Promise<string>;
    decrypt(encryptedData: string): Promise<string>;
    validateInput(input: any, schema: JsonSchema): boolean;
  };
}

export interface TerraFusionMicroFrontend {
  mount(
    element: HTMLElement, 
    bridge: TerraFusionRuntimeBridge, 
    context: TerraFusionMountContext
  ): Promise<void>;
  unmount(): Promise<void>;
  onThemeChange?(tokens: TerraFusionDesignTokens): void;
  onEntitlementChange?(entitlements: string[]): void;
  onPermissionChange?(permissions: string[]): void;
}

export interface TerraFusionMountContext {
  moduleId: string;
  route: string;
  user: AuthenticatedUser;
  county: CountyContext;
  config: Record<string, any>;
  theme: TerraFusionDesignTokens;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export interface TerraFusionDesignTokens {
  color: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent: string;
    accentDark: string;
    accentLight: string;
    transcend: string;
    surface: string;
    surfaceDark: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  motion: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      easeInOut: string;
      easeOut: string;
      easeIn: string;
    };
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// ============================================================================
// EXAMPLE VENDOR MODULE IMPLEMENTATION
// ============================================================================

export class WoolpertSecureGovModule implements TerraFusionMicroFrontend {
  private bridge: TerraFusionRuntimeBridge;
  private context: TerraFusionMountContext;
  private element: HTMLElement;
  private reactRoot: any;

  async mount(
    element: HTMLElement,
    bridge: TerraFusionRuntimeBridge,
    context: TerraFusionMountContext
  ): Promise<void> {
    this.element = element;
    this.bridge = bridge;
    this.context = context;

    // Initialize observability
    const trace = this.bridge.observability.trace('woolpert.securegov.mount', {
      moduleId: context.moduleId,
      route: context.route,
      county: context.county.id
    });

    try {
      // Validate permissions
      if (!this.bridge.auth.hasPermission('data.parcel.read')) {
        throw new Error('Insufficient permissions for Woolpert SecureGov module');
      }

      // Register module commands
      this.bridge.ui.registerCommand({
        id: 'woolpert.securegov.dashboard',
        title: 'Open SecureGov Dashboard',
        handler: () => this.bridge.ui.navigate('/securegov/dashboard')
      });

      // Mount React application
      await this.mountReactApp();

      // Subscribe to relevant events
      this.bridge.data.subscribe('County.Events.Property.Updated', (event) => {
        this.handlePropertyUpdate(event);
      });

      this.bridge.observability.log('info', 'Woolpert SecureGov module mounted successfully', {
        moduleId: context.moduleId,
        county: context.county.id
      });

    } catch (error) {
      this.bridge.observability.log('error', 'Failed to mount Woolpert SecureGov module', {
        error: error.message,
        moduleId: context.moduleId
      });
      throw error;
    } finally {
      trace();
    }
  }

  async unmount(): Promise<void> {
    const trace = this.bridge.observability.trace('woolpert.securegov.unmount');

    try {
      // Cleanup React application
      if (this.reactRoot) {
        this.reactRoot.unmount();
        this.reactRoot = null;
      }

      // Clear element content
      this.element.innerHTML = '';

      this.bridge.observability.log('info', 'Woolpert SecureGov module unmounted');
    } finally {
      trace();
    }
  }

  onThemeChange(tokens: TerraFusionDesignTokens): void {
    // Apply new theme tokens to module
    this.applyTheme(tokens);
  }

  onEntitlementChange(entitlements: string[]): void {
    // Handle entitlement changes
    if (!entitlements.includes('woolpert.securegov.premium')) {
      this.showUpgradePrompt();
    }
  }

  private async mountReactApp(): Promise<void> {
    // Dynamic import of React components
    const { createRoot } = await import('react-dom/client');
    const { SecureGovDashboard } = await import('./components/SecureGovDashboard');

    this.reactRoot = createRoot(this.element);
    this.reactRoot.render(
      React.createElement(SecureGovDashboard, {
        bridge: this.bridge,
        context: this.context,
        theme: this.context.theme
      })
    );
  }

  private applyTheme(tokens: TerraFusionDesignTokens): void {
    // Apply TerraFusion design tokens to module
    const root = this.element;
    root.style.setProperty('--tf-color-primary', tokens.color.primary);
    root.style.setProperty('--tf-color-accent', tokens.color.accent);
    root.style.setProperty('--tf-spacing-md', tokens.spacing.md);
    // ... apply all relevant tokens
  }

  private handlePropertyUpdate(event: any): void {
    // Handle property update events from TerraFusion data plane
    this.bridge.observability.log('info', 'Property update received', { propertyId: event.propertyId });
    
    // Update module state or trigger re-render
    this.refreshData();
  }

  private showUpgradePrompt(): void {
    this.bridge.ui.toast(
      'Upgrade to Woolpert SecureGov Premium for advanced features',
      'info'
    );
  }

  private async refreshData(): Promise<void> {
    // Refresh module data using TerraFusion data plane
    try {
      const data = await this.bridge.data.query({
        schema: 'properties',
        filters: { county: this.context.county.id },
        limit: 100
      });
      
      // Update module with fresh data
      this.updateModuleData(data);
    } catch (error) {
      this.bridge.observability.log('error', 'Failed to refresh data', { error: error.message });
    }
  }

  private updateModuleData(data: any): void {
    // Update module state with new data
    // Implementation depends on specific module requirements
  }
}

// ============================================================================
// MODULE MANIFEST EXAMPLE
// ============================================================================

export const woolpertSecureGovManifest: TerraFusionModuleManifest = {
  id: "woolpert.securegov",
  version: "1.2.0",
  displayName: "Woolpert SecureGov Suite",
  description: "Comprehensive GIS and property management solution for county governments",
  vendor: "Woolpert",
  routes: [
    {
      path: "/securegov/dashboard",
      slot: "main",
      icon: "map",
      requiredEntitlements: ["woolpert.securegov.basic"],
      requiredScopes: ["read"],
      title: "SecureGov Dashboard"
    },
    {
      path: "/securegov/properties",
      slot: "main", 
      icon: "building",
      requiredEntitlements: ["woolpert.securegov.basic"],
      requiredScopes: ["read", "write"],
      title: "Property Management"
    },
    {
      path: "/securegov/analytics",
      slot: "main",
      icon: "chart",
      requiredEntitlements: ["woolpert.securegov.premium"],
      requiredScopes: ["read"],
      title: "Analytics & Reporting"
    }
  ],
  permissions: [
    "data.parcel.read",
    "data.parcel.write", 
    "data.property.assess",
    "data.gis.analyze"
  ],
  events: [
    "County.Events.Property.Updated",
    "County.Events.Assessment.Completed",
    "County.Events.GIS.Layer.Updated"
  ],
  configSchema: {
    type: "object",
    properties: {
      enableAdvancedAnalytics: { type: "boolean", default: false },
      defaultMapStyle: { type: "string", enum: ["satellite", "street", "terrain"] },
      autoSyncInterval: { type: "number", minimum: 300, maximum: 3600 }
    }
  },
  minCosApi: ">=3.5.0",
  dependencies: ["cos.dataPlane", "cos.securityMesh", "cos.agentFabric"]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export class TerraFusionModuleUtils {
  static async validateManifest(manifest: TerraFusionModuleManifest): Promise<boolean> {
    // Validate module manifest against TerraFusion schema
    const requiredFields = ['id', 'version', 'displayName', 'routes', 'permissions'];
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Version must be in semver format (x.y.z)');
    }

    // Validate routes
    for (const route of manifest.routes) {
      if (!route.path || !route.slot || !route.title) {
        throw new Error('Invalid route configuration');
      }
    }

    return true;
  }

  static generateModuleId(vendor: string, product: string): string {
    return `${vendor.toLowerCase()}.${product.toLowerCase()}`;
  }

  static async checkDependencies(dependencies: string[]): Promise<boolean> {
    // Check if all required TerraFusion dependencies are available
    for (const dep of dependencies) {
      if (!await this.isDependencyAvailable(dep)) {
        return false;
      }
    }
    return true;
  }

  private static async isDependencyAvailable(dependency: string): Promise<boolean> {
    // Implementation to check TerraFusion dependency availability
    return true; // Placeholder
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  TerraFusionModuleManifest,
  TerraFusionRuntimeBridge,
  TerraFusionMicroFrontend,
  TerraFusionMountContext,
  TerraFusionDesignTokens,
  WoolpertSecureGovModule,
  woolpertSecureGovManifest,
  TerraFusionModuleUtils
};
