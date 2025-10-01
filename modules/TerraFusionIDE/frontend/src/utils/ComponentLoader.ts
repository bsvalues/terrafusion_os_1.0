/**
 * Dynamic TerraFusion Component Loader
 * Dynamically resolves and loads TerraFusion components from the parent system
 */

export interface TerraFusionComponent {
  name: string;
  component: any;
  props?: Record<string, any>;
}

export class ComponentLoader {
  private static instance: ComponentLoader;
  private componentCache: Map<string, any> = new Map();
  private parentSystemPath: string;

  private constructor() {
    // Dynamically detect parent system path
    this.parentSystemPath = this.detectParentSystemPath();
  }

  public static getInstance(): ComponentLoader {
    if (!ComponentLoader.instance) {
      ComponentLoader.instance = new ComponentLoader();
    }
    return ComponentLoader.instance;
  }

  private detectParentSystemPath(): string {
    // Dynamic detection of parent TerraFusion system
    // In a real implementation, we'd check which path exists
    // For now, return the most likely path
    return '../../../frontend/src/components/TerraFusion';
  }

  public async loadComponent(componentName: string): Promise<any> {
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName);
    }

    try {
      // Dynamic import from parent system
      const componentModule = await import(/* @vite-ignore */ `${this.parentSystemPath}/${componentName}`);
      const component = componentModule.default || componentModule[componentName];
      
      this.componentCache.set(componentName, component);
      return component;
    } catch (error) {
      console.warn(`Failed to load component ${componentName} from parent system:`, error);
      return this.loadFallbackComponent(componentName);
    }
  }

  public async loadTerraFusionSystem(): Promise<any> {
    try {
      // Load the entire TerraFusion component system
      const systemModule = await import(/* @vite-ignore */ `${this.parentSystemPath}/index.ts`);
      return systemModule;
    } catch (error) {
      console.warn('Failed to load TerraFusion system, using fallback:', error);
      return this.createFallbackSystem();
    }
  }

  private loadFallbackComponent(componentName: string): any {
    // Create minimal fallback components
    const fallbacks: Record<string, any> = {
      TFButton: ({ children }: any) => 
        `<button class="tf-btn">${children}</button>`,
      TFCard: ({ children }: any) => 
        `<div class="tf-card">${children}</div>`,
      TFHeading: ({ children, level = 2 }: any) => 
        `<h${level} class="tf-heading">${children}</h${level}>`,
      TFFlex: ({ children }: any) => 
        `<div class="tf-flex">${children}</div>`
    };

    return fallbacks[componentName] || (() => `<div>Component ${componentName} not found</div>`);
  }

  private createFallbackSystem(): any {
    return {
      TerraFusionGlobalStyles: () => null,
      TFButton: this.loadFallbackComponent('TFButton'),
      TFCard: this.loadFallbackComponent('TFCard'),
      TFHeading: this.loadFallbackComponent('TFHeading'),
      TFFlex: this.loadFallbackComponent('TFFlex')
    };
  }

  public async preloadEssentialComponents(): Promise<void> {
    const essentialComponents = [
      'TerraFusionGlobalStyles',
      'TFButton',
      'TFCard',
      'TFHeading',
      'TFFlex',
      'TFInput',
      'TFText'
    ];

    const loadPromises = essentialComponents.map(component => 
      this.loadComponent(component).catch(error => 
        console.warn(`Failed to preload ${component}:`, error)
      )
    );

    await Promise.allSettled(loadPromises);
  }
}
