import { useState, useEffect } from 'react';

interface TerraFusionConfig {
  agents: {
    total: number;
    fieldGenerals: number;
    operationalForces: number;
    supremeCommander: number;
  };
  county: {
    name: string;
    properties: number;
    assessedValue: number;
  };
  marketplace: {
    baseSubscription: number;
    marketplaceArpu: number;
    totalMonthly: number;
    platformShare: number;
  };
  ports: {
    api: number;
    frontend: number;
    shell: number;
  };
}

const defaultConfig: TerraFusionConfig = {
  agents: {
    total: 50000,
    fieldGenerals: 1220,
    operationalForces: 48779,
    supremeCommander: 1
  },
  county: {
    name: 'Benton County, WA',
    properties: 94149,
    assessedValue: 12847293847
  },
  marketplace: {
    baseSubscription: 477,
    marketplaceArpu: 142,
    totalMonthly: 619,
    platformShare: 0.3
  },
  ports: {
    api: 5046,
    frontend: 3102,
    shell: 3103
  }
};

export const useTerraFusionConfig = () => {
  const [config, setConfig] = useState<TerraFusionConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setLoading(true);
        
        // Load environment variables from window
        const envVars = (window as any).TERRAFUSION_ENV || {};
        
        // Get API base URL from environment or default
        const apiPort = envVars.TF_API_PORT || config.ports.api;
        const apiBase = `http://localhost:${apiPort}`;
        
        // Load AI swarm configuration
        let agentConfig = config.agents;
        try {
          const swarmResponse = await fetch(`${apiBase}/api/coordination/status`);
          if (swarmResponse.ok) {
            const swarmData = await swarmResponse.json();
            agentConfig = {
              total: swarmData.total_agents || config.agents.total,
              fieldGenerals: swarmData.field_generals || config.agents.fieldGenerals,
              operationalForces: swarmData.operational_forces || config.agents.operationalForces,
              supremeCommander: 1
            };
          }
        } catch (err) {
          console.warn('Could not load agent configuration:', err);
        }
        
        // Load marketplace configuration
        let marketplaceConfig = config.marketplace;
        try {
          const marketplaceResponse = await fetch(`${apiBase}/api/marketplace/config`);
          if (marketplaceResponse.ok) {
            const marketplaceData = await marketplaceResponse.json();
            marketplaceConfig = {
              baseSubscription: marketplaceData.pricing?.basePlatformSubscription || config.marketplace.baseSubscription,
              marketplaceArpu: marketplaceData.pricing?.baseMarketplaceARPU || config.marketplace.marketplaceArpu,
              totalMonthly: marketplaceData.pricing?.totalMonthlyRevenue || config.marketplace.totalMonthly,
              platformShare: marketplaceData.pricing?.platformShare || config.marketplace.platformShare
            };
          }
        } catch (err) {
          console.warn('Could not load marketplace configuration:', err);
        }
        
        // Load county configuration
        let countyConfig = config.county;
        try {
          // Extract county name from environment or use default
          const countyName = envVars.COUNTY_NAME || config.county.name;
          
          // Map county names to property counts (from real data)
          const countyPropertyCounts: Record<string, number> = {
            'Benton County, WA': 94149,
            'San Juan County, WA': 18000,
            'King County, WA': 890000,
            'Pierce County, WA': 378000,
            'Snohomish County, WA': 312000
          };
          
          countyConfig = {
            name: countyName,
            properties: countyPropertyCounts[countyName] || config.county.properties,
            assessedValue: config.county.assessedValue
          };
        } catch (err) {
          console.warn('Could not load county configuration:', err);
        }
        
        // Update ports from environment
        const portConfig = {
          api: parseInt(envVars.TF_API_PORT) || config.ports.api,
          frontend: parseInt(envVars.TF_FRONTEND_PORT) || config.ports.frontend,
          shell: parseInt(envVars.TF_SHELL_PORT) || config.ports.shell
        };
        
        setConfig({
          agents: agentConfig,
          county: countyConfig,
          marketplace: marketplaceConfig,
          ports: portConfig
        });
        
        setError(null);
      } catch (err) {
        console.error('Error loading TerraFusion configuration:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Keep default configuration on error
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  return { config, loading, error };
};

export default useTerraFusionConfig;