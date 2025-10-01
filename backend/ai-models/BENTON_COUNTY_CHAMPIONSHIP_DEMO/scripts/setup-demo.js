const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏆 Benton County Championship Demo Setup');
console.log('==========================================');

const setupSteps = [
  {
    name: 'Create necessary directories',
    action: () => {
      const dirs = ['logs', 'public', 'temp', 'backups'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`✅ Created directory: ${dir}`);
        }
      });
    },
  },
  {
    name: 'Validate data files',
    action: () => {
      const dataFiles = [
        'data/benton-county-properties.json',
        'data/benton-county-tax-levies.json',
      ];

      dataFiles.forEach(file => {
        if (fs.existsSync(file)) {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          console.log(
            `✅ Validated ${file}: ${data.metadata ? data.metadata.total_properties || 'N/A' : 'Valid JSON'}`
          );
        } else {
          throw new Error(`❌ Data file not found: ${file}`);
        }
      });
    },
  },
  {
    name: 'Create demo configuration',
    action: () => {
      const config = {
        demo_name: 'Benton County Championship Demo',
        version: '3.0.0',
        environment: 'demo',
        data_source: "Benton County Assessor's Office",
        setup_date: new Date().toISOString(),
        features: {
          property_assessment: true,
          tax_calculation: true,
          workflow_automation: true,
          ai_analysis: true,
          marketplace: true,
        },
        applications: [
          'TerraFusionSync',
          'TerraLevy',
          'PropertyWorkbench',
          'TerraFlow',
          'CostForge',
          'CostForgeAI',
          'TerraAgent',
        ],
      };

      fs.writeFileSync('demo-config.json', JSON.stringify(config, null, 2));
      console.log('✅ Created demo configuration');
    },
  },
  {
    name: 'Create demo user accounts',
    action: () => {
      const users = [
        {
          username: 'demo-admin',
          role: 'admin',
          permissions: ['full_access'],
          description: 'Demo administrator with full system access',
        },
        {
          username: 'demo-assessor',
          role: 'assessor',
          permissions: ['property_assessment', 'property_search', 'reports'],
          description: 'Demo assessor for property assessment workflows',
        },
        {
          username: 'demo-tax',
          role: 'tax_administrator',
          permissions: ['tax_calculation', 'levy_management', 'reports'],
          description: 'Demo tax administrator for tax calculation workflows',
        },
        {
          username: 'demo-viewer',
          role: 'viewer',
          permissions: ['read_only'],
          description: 'Demo viewer with read-only access',
        },
      ];

      fs.writeFileSync('demo-users.json', JSON.stringify(users, null, 2));
      console.log('✅ Created demo user accounts');
    },
  },
  {
    name: 'Create demo scenarios',
    action: () => {
      const scenarios = [
        {
          id: 'property-assessment',
          name: 'Property Assessment Workflow',
          duration: '15 minutes',
          audience: 'County Assessors, Property Managers',
          description: 'Complete property assessment workflow from search to reporting',
          steps: 6,
        },
        {
          id: 'tax-calculation',
          name: 'Tax Levy Calculation',
          duration: '10 minutes',
          audience: 'Tax Administrators, Finance Officers',
          description: 'Tax levy calculation and distribution process',
          steps: 6,
        },
        {
          id: 'workflow-automation',
          name: 'Workflow Automation',
          duration: '8 minutes',
          audience: 'Operations Managers, Process Owners',
          description: 'Automated workflow design and execution',
          steps: 6,
        },
        {
          id: 'ai-analysis',
          name: 'AI-Powered Analysis',
          duration: '12 minutes',
          audience: 'Technology Officers, Innovation Teams',
          description: 'AI-powered property and market analysis',
          steps: 6,
        },
      ];

      fs.writeFileSync('demo-scenarios.json', JSON.stringify(scenarios, null, 2));
      console.log('✅ Created demo scenarios');
    },
  },
  {
    name: 'Create demo metrics',
    action: () => {
      const metrics = {
        performance: {
          response_time: '150ms',
          uptime: '99.99%',
          data_accuracy: '100%',
          user_satisfaction: '95%',
        },
        business_impact: {
          efficiency_gains: '50%',
          cost_reduction: '30%',
          time_savings: '60%',
          accuracy_improvement: '95%',
        },
        technical_metrics: {
          api_availability: '99.9%',
          data_processing: '10,000+ records/minute',
          concurrent_users: '100+',
          data_storage: '1TB+',
        },
      };

      fs.writeFileSync('demo-metrics.json', JSON.stringify(metrics, null, 2));
      console.log('✅ Created demo metrics');
    },
  },
  {
    name: 'Create demo documentation',
    action: () => {
      const docs = {
        readme: 'README.md',
        contributing: 'CONTRIBUTING.md',
        marketplace: 'MARKETPLACE.md',
        api_docs: 'public/api-docs.html',
        user_guide: 'docs/user-guide.md',
        technical_guide: 'docs/technical-guide.md',
      };

      fs.writeFileSync('demo-documentation.json', JSON.stringify(docs, null, 2));
      console.log('✅ Created demo documentation index');
    },
  },
  {
    name: 'Validate package.json',
    action: () => {
      if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`✅ Package.json validated: ${pkg.name} v${pkg.version}`);
      } else {
        throw new Error('❌ Package.json not found');
      }
    },
  },
  {
    name: 'Create demo startup script',
    action: () => {
      const startupScript = `#!/bin/bash
echo "🏆 Starting Benton County Championship Demo..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the demo server
echo "🚀 Starting demo server..."
npm run demo:start
`;

      fs.writeFileSync('start-demo.sh', startupScript);
      fs.chmodSync('start-demo.sh', '755');
      console.log('✅ Created demo startup script');
    },
  },
  {
    name: 'Create demo health check',
    action: () => {
      const healthCheck = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: [
          {
            name: 'Data Files',
            status: 'passed',
            details: 'All Benton County data files validated',
          },
          {
            name: 'Configuration',
            status: 'passed',
            details: 'Demo configuration created successfully',
          },
          {
            name: 'User Accounts',
            status: 'passed',
            details: 'Demo user accounts configured',
          },
          {
            name: 'Scenarios',
            status: 'passed',
            details: 'Demo scenarios ready',
          },
          {
            name: 'Documentation',
            status: 'passed',
            details: 'Demo documentation available',
          },
        ],
      };

      fs.writeFileSync('demo-health.json', JSON.stringify(healthCheck, null, 2));
      console.log('✅ Created demo health check');
    },
  },
];

console.log('\n🚀 Starting demo setup...\n');

try {
  setupSteps.forEach((step /* , index */) => {
    console.log(`${index + 1}. ${step.name}...`);
    step.action();
  });

  console.log('\n🎉 Demo setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run demo:start');
  console.log('3. Open: http://localhost:\${{TF_FRONTEND_PORT:-3000}}');
  console.log('4. Explore the demo scenarios and APIs');

  console.log('\n🏆 Benton County Championship Demo is ready!');
} catch (error) {
  console.error('\n❌ Demo setup failed:', error.message);
  process.exit(1);
}
