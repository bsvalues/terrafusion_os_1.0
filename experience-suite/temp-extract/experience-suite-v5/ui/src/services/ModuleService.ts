import { useState, useEffect } from 'react';

// TypeScript interfaces for TerraFusion modules
export interface TerraFusionModule {
  id: string;
  name: string;
  version: string;
  type: string;
  entry: string;
  description: string;
  category: string;
  price: string;
  monthlyPrice?: number;
  annualPrice?: number;
  tier?: string;
  features?: string[];
  author: string;
  marketplace: {
    featured: boolean;
    revenue_sharing: string;
    compatibility: string[];
    requirements: string[];
    rating: number;
    downloads: number;
  };
  endpoints: {
    health: string;
    api: string;
    ui: string;
  };
  permissions: string[];
  hot_swap: {
    enabled: boolean;
    restart_required?: boolean;
  };
  status?: 'installed' | 'available' | 'disabled' | 'error';
  health?: 'healthy' | 'unhealthy' | 'unknown';
}

export interface ModuleCategory {
  name: string;
  description: string;
  modules: TerraFusionModule[];
  totalRevenue: number;
}

export interface MarketplaceStats {
  totalModules: number;
  installedModules: number;
  monthlyRevenue: number;
  annualRevenue: number;
  avgRating: number;
  totalDownloads: number;
}

class TerraFusionModuleService {
  private baseUrl: string;
  private modules: TerraFusionModule[] = [];
  private moduleHealth: Map<string, string> = new Map();

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                   process.env.REACT_APP_API_GATEWAY || 
                   `http://localhost:${process.env.TF_API_PORT || 5046}`;
  }

  /**
   * Scan and load all modules from the /modules directory
   */
  async scanModules(): Promise<TerraFusionModule[]> {
    try {
      console.log('🔍 Scanning TerraFusion modules...');
      
      // Get module list from backend API
      const response = await fetch(`${this.baseUrl}/api/modules/scan`);
      if (!response.ok) {
        throw new Error(`Failed to scan modules: ${response.statusText}`);
      }
      
      const moduleData = await response.json();
      this.modules = moduleData.modules || [];
      
      console.log(`✅ Found ${this.modules.length} TerraFusion modules`);
      return this.modules;
    } catch (error) {
      console.error('❌ Failed to scan modules:', error);
      
      // Fallback to mock data for development
      return this.getMockModules();
    }
  }

  /**
   * Get health status for all modules
   */
  async checkModuleHealth(): Promise<Map<string, string>> {
    const healthPromises = this.modules.map(async (module) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${this.baseUrl}${module.endpoints.health}`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.moduleHealth.set(module.id, 'healthy');
        } else {
          this.moduleHealth.set(module.id, 'unhealthy');
        }
      } catch (error) {
        this.moduleHealth.set(module.id, 'unknown');
      }
    });

    await Promise.allSettled(healthPromises);
    return this.moduleHealth;
  }

  /**
   * Install a module
   */
  async installModule(moduleId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/modules/${moduleId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Failed to install module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Uninstall a module
   */
  async uninstallModule(moduleId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/modules/${moduleId}/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Failed to uninstall module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Enable/disable hot-swap for a module
   */
  async toggleModule(moduleId: string, enabled: boolean): Promise<boolean> {
    try {
      const action = enabled ? 'enable' : 'disable';
      const response = await fetch(`${this.baseUrl}/api/modules/${moduleId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Failed to ${enabled ? 'enable' : 'disable'} module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(): ModuleCategory[] {
    const categories: { [key: string]: TerraFusionModule[] } = {};
    
    this.modules.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = [];
      }
      categories[module.category].push(module);
    });

    return Object.entries(categories).map(([name, modules]) => ({
      name,
      description: this.getCategoryDescription(name),
      modules,
      totalRevenue: modules.reduce((sum, mod) => sum + this.parsePrice(mod.price), 0)
    }));
  }

  /**
   * Calculate marketplace statistics
   */
  getMarketplaceStats(): MarketplaceStats {
    const installedCount = this.modules.filter(m => m.status === 'installed').length;
    const monthlyRevenue = this.modules
      .filter(m => m.status === 'installed')
      .reduce((sum, mod) => sum + this.parsePrice(mod.price) / 12, 0);
    
    return {
      totalModules: this.modules.length,
      installedModules: installedCount,
      monthlyRevenue,
      annualRevenue: monthlyRevenue * 12,
      avgRating: this.modules.reduce((sum, mod) => sum + mod.marketplace.rating, 0) / this.modules.length,
      totalDownloads: this.modules.reduce((sum, mod) => sum + mod.marketplace.downloads, 0)
    };
  }

  /**
   * Search modules by name, description, or category
   */
  searchModules(query: string): TerraFusionModule[] {
    const searchTerm = query.toLowerCase();
    return this.modules.filter(module =>
      module.name.toLowerCase().includes(searchTerm) ||
      module.description.toLowerCase().includes(searchTerm) ||
      module.category.toLowerCase().includes(searchTerm)
    );
  }

  private parsePrice(priceString: string): number {
    // Convert "$2300/year" to annual number
    const match = priceString.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private getCategoryDescription(category: string): string {
    const descriptions: { [key: string]: string } = {
      'government': 'Core government operations and compliance',
      'Core': 'Essential TerraFusion OS functionality',
      'Tier 1': 'Premium government services',
      'Mapping': 'GIS and geospatial analysis tools',
      'Revenue': 'Revenue discovery and optimization',
      'AI': 'Artificial intelligence and automation',
      'Security': 'Security and compliance tools',
      'Analytics': 'Data analysis and reporting'
    };
    
    return descriptions[category] || 'TerraFusion government modules';
  }

  /**
   * Mock data for development (when backend is not available)
   */
  private getMockModules(): TerraFusionModule[] {
    return [
      {
        id: 'government-edition',
        name: 'Government Edition',
        version: '1.0.0',
        type: 'module',
        entry: './index.js',
        description: 'Core government operations module',
        category: 'Tier 1',
        price: '$2300/year',
        author: 'TerraFusion OS',
        marketplace: {
          featured: true,
          revenue_sharing: '70_30',
          compatibility: ['all_counties'],
          requirements: ['terrafusion_os_1.0'],
          rating: 4.7,
          downloads: 1007
        },
        endpoints: {
          health: '/modules/government-edition/health',
          api: '/modules/government-edition/api',
          ui: '/modules/government-edition/ui'
        },
        permissions: ['government_data_access', 'county_system_integration'],
        hot_swap: { enabled: true },
        status: 'installed',
        health: 'healthy'
      },
      {
        id: 'ai-swarm',
        name: 'AI Swarm Coordinator',
        version: '1.0.0',
        type: 'module',
        entry: './index.js',
        description: '50,000+ AI agent coordination',
        category: 'AI',
        price: '$2300/year',
        author: 'TerraFusion OS',
        marketplace: {
          featured: true,
          revenue_sharing: '70_30',
          compatibility: ['all_counties'],
          requirements: ['terrafusion_os_1.0'],
          rating: 4.9,
          downloads: 856
        },
        endpoints: {
          health: '/modules/ai-swarm/health',
          api: '/modules/ai-swarm/api',
          ui: '/modules/ai-swarm/ui'
        },
        permissions: ['ai_coordination', 'system_management'],
        hot_swap: { enabled: true },
        status: 'installed',
        health: 'healthy'
      }
      // Add more mock modules as needed...
    ];
  }
}

// React hook for using the module service
export function useModuleService() {
  const [service] = useState(() => new TerraFusionModuleService());
  const [modules, setModules] = useState<TerraFusionModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshModules = async () => {
    try {
      setLoading(true);
      const moduleData = await service.scanModules();
      await service.checkModuleHealth();
      setModules(moduleData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshModules();
  }, []);

  return {
    service,
    modules,
    loading,
    error,
    refreshModules,
    categories: service.getModulesByCategory(),
    stats: service.getMarketplaceStats(),
    searchModules: (query: string) => service.searchModules(query)
  };
}

export default TerraFusionModuleService;