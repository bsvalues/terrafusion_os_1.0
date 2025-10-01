/**
 * TerraFusion OS Universal Configuration Service
 * Provides dynamic configuration loading for frontend applications
 * Eliminates hardcoded values throughout the system
 */

interface TerraFusionConfig {
  system: {
    name: string;
    version: string;
    environment: string;
    deployment_target: string;
  };
  ai_swarm: {
    scaling_strategy: string;
    deployment_phases: {
      current_phase: number;
      target_phase: number;
      phases: Array<{
        id: number;
        name: string;
        agent_count: number;
        status: string;
        capabilities: string[];
      }>;
    };
  };
  modules: {
    discovery_strategy: string;
    loading_strategy: string;
    scaling: {
      min_modules: number;
      max_modules: string | number;
      auto_discovery: boolean;
      runtime_loading: boolean;
    };
  };
  networking: {
    port_strategy: string;
    api_port: string;
    frontend_port: string;
    shell_port: string;
    websocket_port: string;
  };
  county_profile: {
    name: string;
    population: number;
    government_type: string;
    budget: number;
    agent_scaling_factor: number;
    module_requirements: string[];
  };
}

class TerraFusionConfigService {
  private static instance: TerraFusionConfigService;
  private config: TerraFusionConfig | null = null;
  private cache = new Map<string, any>();
  
  private constructor() {}
  
  public static getInstance(): TerraFusionConfigService {
    if (!TerraFusionConfigService.instance) {
      TerraFusionConfigService.instance = new TerraFusionConfigService();
    }
    return TerraFusionConfigService.instance;
  }
  
  public async loadConfig(): Promise<TerraFusionConfig> {
    if (this.config) {
      return this.config;
    }
    
    try {
      // Try to load from backend API first
      const apiPort = this.resolvePort('TF_API_PORT', '5046');
      const response = await fetch(`http://localhost:${apiPort}/api/config`);
      if (response.ok) {
        this.config = await response.json();
        console.log('✅ Configuration loaded from backend API');
        return this.config;
      }
    } catch (error) {
      console.warn('Backend config API unavailable, loading local config');
    }
    
    try {
      // Fallback to local config file
      const response = await fetch('/terrafusion-config.json');
      this.config = await response.json();
      console.log('✅ Configuration loaded from local file');
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration, using defaults');
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }
  
  public getConfig(): TerraFusionConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }
  
  // Dynamic port resolution with environment variable support
  public resolvePort(envVar: string, fallback: string): string {
    // Check environment variables (for build-time injection)
    const envValue = (window as any).__TF_ENV__?.[envVar] || 
                     process.env[envVar];
    
    if (envValue) {
      return envValue;
    }
    
    // Parse template strings like "${TF_API_PORT:-5046}"
    if (this.config?.networking) {
      const portConfig = (this.config.networking as any)[envVar.toLowerCase().replace('tf_', '').replace('_port', '_port')];
      if (portConfig && typeof portConfig === 'string' && portConfig.includes('${')) {
        const match = portConfig.match(/\$\{([^:]+):?-?([^}]*)\}/);
        if (match) {
          const [, varName, defaultValue] = match;
          return (window as any).__TF_ENV__?.[varName] || 
                 process.env[varName] || 
                 defaultValue || 
                 fallback;
        }
      }
    }
    
    return fallback;
  }
  
  // Get current AI agent count based on deployment phase
  public getCurrentAgentCount(): number {
    if (!this.config) return 1008;
    
    const currentPhase = this.config.ai_swarm.deployment_phases.current_phase;
    const phase = this.config.ai_swarm.deployment_phases.phases.find(p => p.id === currentPhase);
    return phase?.agent_count || 1008;
  }
  
  // Get target AI agent count for full deployment
  public getTargetAgentCount(): number {
    if (!this.config) return 50000;
    
    const targetPhase = this.config.ai_swarm.deployment_phases.target_phase;
    const phase = this.config.ai_swarm.deployment_phases.phases.find(p => p.id === targetPhase);
    return phase?.agent_count || 50000;
  }
  
  // Get dynamic module count
  public async getModuleCount(): Promise<number> {
    const cacheKey = 'module_count';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const apiPort = this.resolvePort('TF_API_PORT', '5046');
      const response = await fetch(`http://localhost:${apiPort}/api/modules/count`);
      if (response.ok) {
        const data = await response.json();
        const count = data.total || data.count || 39;
        this.cache.set(cacheKey, count);
        return count;
      }
    } catch (error) {
      console.warn('Failed to get dynamic module count, using config fallback');
    }
    
    // Fallback to config
    const count = this.config?.modules.scaling.min_modules || 39;
    this.cache.set(cacheKey, count);
    return count;
  }
  
  // Get all available API ports
  public getApiPorts(): { [key: string]: string } {
    return {
      api: this.resolvePort('TF_API_PORT', '5046'),
      frontend: this.resolvePort('TF_FRONTEND_PORT', '3103'),
      shell: this.resolvePort('TF_SHELL_PORT', '3103'),
      websocket: this.resolvePort('TF_WEBSOCKET_PORT', '3104')
    };
  }
  
  // Get county-specific configuration
  public getCountyConfig(): any {
    return this.config?.county_profile || {
      name: 'default',
      population: 50000,
      government_type: 'county',
      budget: 10000000,
      agent_scaling_factor: 1.0,
      module_requirements: ['basic']
    };
  }
  
  // Invalidate cache for real-time updates
  public invalidateCache(): void {
    this.cache.clear();
  }
  
  // Default configuration fallback
  private getDefaultConfig(): TerraFusionConfig {
    return {
      system: {
        name: 'TerraFusion OS',
        version: '1.0.0',
        environment: 'development',
        deployment_target: 'default-county'
      },
      ai_swarm: {
        scaling_strategy: 'dynamic_elastic',
        deployment_phases: {
          current_phase: 1,
          target_phase: 5,
          phases: [
            { id: 1, name: 'bootstrap', agent_count: 1008, status: 'active', capabilities: ['basic_operations'] },
            { id: 2, name: 'county_operations', agent_count: 5000, status: 'ready_to_deploy', capabilities: ['government_services'] },
            { id: 3, name: 'regional_expansion', agent_count: 15000, status: 'planned', capabilities: ['multi_county'] },
            { id: 4, name: 'state_integration', agent_count: 35000, status: 'planned', capabilities: ['state_systems'] },
            { id: 5, name: 'federal_readiness', agent_count: 50000, status: 'target', capabilities: ['federal_integration'] }
          ]
        }
      },
      modules: {
        discovery_strategy: 'filesystem_scan',
        loading_strategy: 'hot_swap_enabled',
        scaling: {
          min_modules: 39,
          max_modules: 'unlimited',
          auto_discovery: true,
          runtime_loading: true
        }
      },
      networking: {
        port_strategy: 'dynamic_allocation',
        api_port: '${TF_API_PORT:-5046}',
        frontend_port: '${TF_FRONTEND_PORT:-3103}',
        shell_port: '${TF_SHELL_PORT:-3103}',
        websocket_port: '${TF_WEBSOCKET_PORT:-3104}'
      },
      county_profile: {
        name: 'default-county',
        population: 50000,
        government_type: 'county',
        budget: 10000000,
        agent_scaling_factor: 1.0,
        module_requirements: ['basic', 'government', 'ai-swarm']
      }
    };
  }
}

// Export singleton instance
export const configService = TerraFusionConfigService.getInstance();

// Helper functions for common use cases
export const getApiPort = () => configService.resolvePort('TF_API_PORT', '5046');
export const getFrontendPort = () => configService.resolvePort('TF_FRONTEND_PORT', '3103');
export const getCurrentAgents = () => configService.getCurrentAgentCount();
export const getTargetAgents = () => configService.getTargetAgentCount();

// Initialize configuration on import
configService.loadConfig().catch(console.error);

export default configService;