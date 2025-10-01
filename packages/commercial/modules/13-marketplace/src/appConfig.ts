// Terrafusion Application Configuration
export interface AppConfig {
  id: string;
  name: string;
  description: string;
  executable: string;
  port?: number;
  icon?: string;
  category: 'core' | 'assessment' | 'analytics' | 'management';
}

export const appConfigurations: AppConfig[] = [
  {
    id: '01',
    name: 'TerraAgent',
    description: 'AI-powered government assistant for automated workflows',
    executable: 'terra-agent',
    port: 3001,
    category: 'core',
  },
  {
    id: '02',
    name: 'TerraFlow',
    description: 'Workflow automation and process management',
    executable: 'terra-flow',
    port: 3002,
    category: 'core',
  },
  {
    id: '03',
    name: 'WebAuditTracker',
    description: 'Compliance tracking and audit management',
    executable: 'web-audit-tracker',
    port: 3003,
    category: 'assessment',
  },
  {
    id: '04',
    name: 'TerraLevy',
    description: 'Tax levy calculation and management system',
    executable: 'terra-levy',
    port: 3004,
    category: 'assessment',
  },
  {
    id: '05',
    name: 'TerraMiner',
    description: 'Data mining and analytics engine',
    executable: 'terra-miner',
    port: 3005,
    category: 'analytics',
  },
  {
    id: '06',
    name: 'TerraFusionSync',
    description: 'Data synchronization across systems',
    executable: 'terra-fusion-sync',
    port: 3006,
    category: 'core',
  },
  {
    id: '07',
    name: 'GISPRO',
    description: 'Geographic Information System for property mapping',
    executable: 'gispro',
    port: 3007,
    category: 'analytics',
  },
  {
    id: '08',
    name: 'CostForgeAI',
    description: 'AI-driven cost estimation and forecasting',
    executable: 'costforge-ai',
    port: 3008,
    category: 'analytics',
  },
  {
    id: '09',
    name: 'PropertyWorkbench',
    description: 'Property assessment and management workbench',
    executable: 'property-workbench',
    port: 3009,
    category: 'assessment',
  },
  {
    id: '10',
    name: 'TerraInsight',
    description: 'Business intelligence and analytics dashboard',
    executable: 'terra-insight',
    port: 3010,
    category: 'analytics',
  },
  {
    id: '11',
    name: 'TerraFusionDashboard',
    description: 'Executive dashboard for system overview',
    executable: 'terra-fusion-dashboard',
    port: 3011,
    category: 'management',
  },
  {
    id: '12',
    name: 'TerraFusionAssessor',
    description: 'Property assessment and valuation tools',
    executable: 'terra-fusion-assessor',
    port: 3012,
    category: 'assessment',
  },
  {
    id: '13',
    name: 'Marketplace',
    description: 'Terrafusion Control Center and App Marketplace',
    executable: 'terrafusion-marketplace',
    port: 1420,
    category: 'management',
  },
  {
    id: '14',
    name: 'TerraCollections',
    description: 'Revenue collection and management system',
    executable: 'terra-collections',
    port: 3014,
    category: 'management',
  },
];

// Helper functions
export const getAppConfig = (appId: string): AppConfig | undefined => {
  return appConfigurations.find(app => app.id === appId);
};

export const getAppsByCategory = (category: AppConfig['category']): AppConfig[] => {
  return appConfigurations.filter(app => app.category === category);
};

export const getAppExecutablePath = (appId: string): string => {
  const app = getAppConfig(appId);
  if (!app) return '';

  // Return relative path to the app's executable
  return `../apps/${appId}-${app.executable.replace(/-/g, '_')}/src-tauri/target/debug/${app.executable}`;
};

export const getAppUrl = (appId: string): string => {
  const app = getAppConfig(appId);
  if (!app?.port) return '';

  return `http://localhost:${app.port}`;
};
