/**
 * Terrafusion Plugin Templates
 * Pre-built templates for common plugin types
 */

export interface PluginTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'foundation' | 'professional' | 'enterprise';
  features: string[];
  files: TemplateFile[];
  dependencies: string[];
  permissions: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'typescript' | 'json' | 'markdown' | 'css' | 'html';
}

// Available Plugin Templates
export const PLUGIN_TEMPLATES: PluginTemplate[] = [
  {
    id: 'basic-dashboard',
    name: 'Basic Dashboard Plugin',
    description: 'Simple dashboard with data visualization',
    category: 'Analytics & Reporting',
    tier: 'foundation',
    features: ['dashboard', 'charts', 'data-display'],
    complexity: 'beginner',
    estimatedTime: '2-4 hours',
    dependencies: ['@terrafusion/sdk', 'chart.js', 'react-chartjs-2'],
    permissions: ['data_read'],
    files: [
      {
        path: 'src/index.ts',
        type: 'typescript',
        content: `
import TerraFusionSDK, { PluginContext } from '@terrafusion/sdk';
import { DashboardComponent } from './components/Dashboard';

export default class BasicDashboardPlugin {
  private sdk: TerraFusionSDK;

  constructor(sdk: TerraFusionSDK) {
    this.sdk = sdk;
  }

  async onActivate(): Promise<void> {
    this.sdk.getLogger().info('Basic Dashboard Plugin activated');
    
    // Register dashboard component
    await this.sdk.getUI().registerComponent('main-dashboard', DashboardComponent);
    
    // Load initial data
    await this.loadDashboardData();
  }

  async onDeactivate(): Promise<void> {
    this.sdk.getLogger().info('Basic Dashboard Plugin deactivated');
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const county = this.sdk.getCounty();
      const api = this.sdk.getAPI();
      
      // Fetch county analytics data
      const analytics = await api.getAnalytics('overview', {
        county_id: county.id,
        period: '30d'
      });

      // Update dashboard with data
      await this.sdk.getUI().updateDashboard('main-dashboard', analytics);
      
    } catch (error) {
      this.sdk.getLogger().error('Failed to load dashboard data:', error);
    }
  }
}
`
      },
      {
        path: 'src/components/Dashboard.tsx',
        type: 'typescript',
        content: `
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const DashboardComponent: React.FC<{ data?: any }> = ({ data }) => {
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'County Metrics',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (data) {
      setChartData(prevData => ({
        ...prevData,
        datasets: [{
          ...prevData.datasets[0],
          data: data.metrics || prevData.datasets[0].data
        }]
      }));
    }
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'County Dashboard Overview' },
    },
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow"><>
<>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">County Analytics</h2>
      
      <div
</>
</> className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg"><>
<>

          <h3 className="text-lg font-semibold text-blue-900">Total Properties</h3>
          <p
</>
</> className="text-3xl font-bold text-blue-600">{data?.totalProperties || '12,345'}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg"><>
<>

          <h3 className="text-lg font-semibold text-green-900">Assessments</h3>
          <p
</>
</> className="text-3xl font-bold text-green-600">{data?.totalAssessments || '8,901'}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg"><>
<>

          <h3 className="text-lg font-semibold text-purple-900">Revenue</h3>
          <p
</>
</> className="text-3xl font-bold text-purple-600">${data?.totalRevenue || '2.4M'}</p>
        </div>
      </div>

      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
`
      }
    ]
  },

  {
    id: 'api-service',
    name: 'REST API Service Plugin',
    description: 'Plugin with custom REST API endpoints',
    category: 'Infrastructure & Integration',
    tier: 'professional',
    features: ['api', 'database', 'validation'],
    complexity: 'intermediate',
    estimatedTime: '4-8 hours',
    dependencies: ['@terrafusion/sdk', 'express', 'joi', 'sqlite3'],
    permissions: ['api_access', 'data_write', 'database'],
    files: [
      {
        path: 'src/index.ts',
        type: 'typescript',
        content: `
import TerraFusionSDK from '@terrafusion/sdk';
import { ApiService } from './services/ApiService';

export default class ApiServicePlugin {
  private sdk: TerraFusionSDK;
  private apiService: ApiService;

  constructor(sdk: TerraFusionSDK) {
    this.sdk = sdk;
    this.apiService = new ApiService(sdk);
  }

  async onActivate(): Promise<void> {
    await this.apiService.start();
    this.sdk.getLogger().info('API Service Plugin activated');
  }

  async onDeactivate(): Promise<void> {
    await this.apiService.stop();
    this.sdk.getLogger().info('API Service Plugin deactivated');
  }
}
`
      }
    ]
  },

  {
    id: 'workflow-automation',
    name: 'Workflow Automation Plugin',
    description: 'Automated workflow processing with triggers',
    category: 'Workflow & Automation',
    tier: 'enterprise',
    features: ['workflows', 'triggers', 'notifications', 'scheduling'],
    complexity: 'advanced',
    estimatedTime: '8-16 hours',
    dependencies: ['@terrafusion/sdk', 'node-cron', 'nodemailer', 'bull'],
    permissions: ['data_read', 'data_write', 'email', 'scheduling'],
    files: [
      {
        path: 'src/index.ts',
        type: 'typescript',
        content: `
import TerraFusionSDK from '@terrafusion/sdk';
import { WorkflowEngine } from './engine/WorkflowEngine';

export default class WorkflowAutomationPlugin {
  private sdk: TerraFusionSDK;
  private workflowEngine: WorkflowEngine;

  constructor(sdk: TerraFusionSDK) {
    this.sdk = sdk;
    this.workflowEngine = new WorkflowEngine(sdk);
  }

  async onActivate(): Promise<void> {
    await this.workflowEngine.initialize();
    await this.setupDefaultWorkflows();
    this.sdk.getLogger().info('Workflow Automation Plugin activated');
  }

  async onDeactivate(): Promise<void> {
    await this.workflowEngine.stop();
    this.sdk.getLogger().info('Workflow Automation Plugin deactivated');
  }

  private async setupDefaultWorkflows(): Promise<void> {
    await this.workflowEngine.createWorkflow({
      id: 'property-assessment',
      name: 'Property Assessment Workflow',
      triggers: ['property_created', 'assessment_due'],
      steps: [
        { type: 'validate_property_data', timeout: 300 },
        { type: 'calculate_assessment', timeout: 600 },
        { type: 'send_notification', timeout: 60 }
      ]
    });
  }
}
`
      }
    ]
  }
];

// Template Generator Functions
export class TemplateGenerator {
  static generateManifest(template: PluginTemplate, pluginName: string, options: any): any {
    return {
      id: pluginName,
      name: options.displayName || this.toDisplayName(pluginName),
      version: '1.0.0',
      description: options.description || template.description,
      author: options.author || 'Plugin Developer',
      license: 'MIT',
      tier: template.tier,
      category: template.category,
      tags: template.features,
      main: 'dist/index.js',
      terrafusion: {
        minVersion: '3.0.0',
        permissions: template.permissions.map(perm => ({
          type: perm,
          scope: 'plugin_scope',
          description: `Required for ${perm} operations`,
          required: true
        })),
        dependencies: [],
        api: this.generateApiEndpoints(template),
        ui: this.generateUIComponents(template),
        hooks: [
          { event: 'install', handler: 'onInstall', async: false },
          { event: 'activate', handler: 'onActivate', async: false },
          { event: 'deactivate', handler: 'onDeactivate', async: false }
        ],
        compliance: [
          { standard: 'CountyOS', level: 'required', description: 'Basic CountyOS compliance' }
        ]
      },
      targeting: {
        county_sizes: ['small', 'medium', 'large'],
        county_types: ['rural', 'urban', 'suburban'],
        specialties: []
      }
    };
  }

  static generatePackageJson(template: PluginTemplate, pluginName: string, options: any): any {
    return {
      name: `@terrafusion/${pluginName}`,
      version: '1.0.0',
      description: options.description || template.description,
      main: 'dist/index.js',
      scripts: {
        'build': 'tsc',
        'dev': 'tsc --watch',
        'test': 'jest',
        'validate': 'terrafusion validate',
        'package': 'terrafusion package',
        'deploy': 'terrafusion deploy'
      },
      dependencies: template.dependencies.reduce((deps, dep) => {
        deps[dep] = 'latest';
        return deps;
      }, {} as Record<string, string>),
      devDependencies: {
        '@types/node': '^20.0.0',
        'typescript': '^5.0.0',
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0'
      }
    };
  }

  static generateReadme(template: PluginTemplate, pluginName: string, options: any): string {
    return `
# ${this.toDisplayName(pluginName)}

${options.description || template.description}

## Features

${template.features.map(feature => `- ${this.toDisplayName(feature)}`).join('\n')}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
npm run test
npm run build
\`\`\`

## License

MIT License
`.trim();
  }

  // Helper methods
  private static toDisplayName(str: string): string {
    return str.split(/[-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private static generateApiEndpoints(template: PluginTemplate): any[] {
    if (template.features.includes('api')) {
      return [
        {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
          auth_required: false
        }
      ];
    }
    return [];
  }

  private static generateUIComponents(template: PluginTemplate): any[] {
    if (template.features.includes('dashboard')) {
      return [{
        name: 'main-dashboard',
        type: 'dashboard',
        path: '/dashboard',
        permissions: ['data_read']
      }];
    }
    return [];
  }
}

// Export template utilities
export const TemplateUtils = {
  getTemplateById: (id: string): PluginTemplate | undefined => {
    return PLUGIN_TEMPLATES.find(template => template.id === id);
  },

  getTemplatesByCategory: (category: string): PluginTemplate[] => {
    return PLUGIN_TEMPLATES.filter(template => template.category === category);
  },

  getTemplatesByTier: (tier: string): PluginTemplate[] => {
    return PLUGIN_TEMPLATES.filter(template => template.tier === tier);
  }
};
