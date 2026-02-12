import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

interface GenerateRequest {
  prompt: string
  projectType: 'assessment' | 'dashboard' | 'workflow' | 'report' | 'integration'
  countyContext: {
    name: string
    department: string
    requirements: string[]
    dataTypes: string[]
  }
  techStack?: string[]
  features?: string[]
}

interface CodeTemplate {
  type: string
  name: string
  description: string
  files: Array<{
    path: string
    content: string
    language: string
  }>
  dependencies: string[]
  scripts: Record<string, string>
  environment: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateRequest = await request.json()
    const { prompt, projectType, countyContext, techStack = [], features = [] } = body

    // AI Context Analysis
    const contextAnalysis = analyzeCountyContext(countyContext, prompt)
    
    // Generate project structure
    const projectStructure = generateProjectStructure(projectType, contextAnalysis)
    
    // Generate code templates
    const codeTemplates = await generateCodeTemplates(projectType, contextAnalysis, techStack)
    
    // Create deployment configuration
    const deploymentConfig = generateDeploymentConfig(projectType, countyContext)
    
    // Generate testing suite
    const testingSuite = generateTestingSuite(projectType, contextAnalysis)

    const response = {
      success: true,
      projectId: generateProjectId(),
      projectName: generateProjectName(projectType, countyContext.name),
      structure: projectStructure,
      templates: codeTemplates,
      deployment: deploymentConfig,
      testing: testingSuite,
      estimatedTime: calculateBuildTime(projectType, features.length),
      preview: {
        available: true,
        url: `/preview/${generateProjectId()}`,
        features: extractPreviewFeatures(projectType, features)
      },
      deployment: {
        ready: true,
        environments: ['development', 'staging', 'production'],
        requirements: getDeploymentRequirements(projectType)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function analyzeCountyContext(context: any, prompt: string) {
  return {
    domain: 'county-government',
    department: context.department.toLowerCase(),
    compliance: ['IAAO', 'GASB', 'Local-Regulations'],
    dataIntegration: context.dataTypes.map((type: string) => ({
      type: type.toLowerCase(),
      source: `${context.name.replace(' ', '_')}_${type.toLowerCase()}`,
      format: 'postgresql'
    })),
    security: {
      level: 'enterprise',
      requirements: ['authentication', 'authorization', 'audit-logging', 'encryption']
    },
    userRoles: extractUserRoles(context.department),
    workflows: extractWorkflows(prompt, context.department)
  }
}

function generateProjectStructure(projectType: string, context: any) {
  const baseStructure = {
    'src/': {
      'components/': {
        'ui/': 'Reusable UI components',
        'forms/': 'County-specific forms',
        'charts/': 'Data visualization components',
        'maps/': 'GIS integration components'
      },
      'pages/': {
        'dashboard/': 'Main dashboard views',
        'reports/': 'Report generation pages',
        'admin/': 'Administrative interfaces'
      },
      'services/': {
        'api/': 'API integration services',
        'data/': 'Data processing services',
        'auth/': 'Authentication services'
      },
      'utils/': {
        'validators/': 'Input validation utilities',
        'formatters/': 'Data formatting utilities',
        'constants/': 'Application constants'
      }
    },
    'database/': {
      'migrations/': 'Database schema migrations',
      'seeds/': 'Sample data for development',
      'procedures/': 'Stored procedures'
    },
    'tests/': {
      'unit/': 'Unit tests',
      'integration/': 'Integration tests',
      'e2e/': 'End-to-end tests'
    },
    'docs/': {
      'api/': 'API documentation',
      'user/': 'User guides',
      'deployment/': 'Deployment guides'
    }
  }

  // Customize based on project type
  switch (projectType) {
    case 'assessment':
      baseStructure['src/']['components/']['assessment/'] = 'Property assessment components'
      baseStructure['src/']['services/']['valuation/'] = 'Property valuation services'
      break
    case 'dashboard':
      baseStructure['src/']['components/']['analytics/'] = 'Analytics components'
      baseStructure['src/']['services/']['metrics/'] = 'Metrics collection services'
      break
    case 'workflow':
      baseStructure['src/']['components/']['workflow/'] = 'Workflow components'
      baseStructure['src/']['services/']['automation/'] = 'Process automation services'
      break
  }

  return baseStructure
}

async function generateCodeTemplates(projectType: string, context: any, techStack: string[]): Promise<CodeTemplate[]> {
  const templates: CodeTemplate[] = []

  // Main Application Template
  templates.push({
    type: 'application',
    name: 'Main Application',
    description: 'Core application with TerraFusion integration',
    files: [
      {
        path: 'src/App.tsx',
        language: 'typescript',
        content: generateMainAppCode(projectType, context)
      },
      {
        path: 'src/main.tsx',
        language: 'typescript',
        content: generateMainEntryCode(context)
      },
      {
        path: 'package.json',
        language: 'json',
        content: generatePackageJson(projectType, techStack)
      }
    ],
    dependencies: getTechStackDependencies(techStack),
    scripts: generateBuildScripts(projectType),
    environment: generateEnvironmentVariables(context)
  })

  // Database Template
  if (projectType !== 'report') {
    templates.push({
      type: 'database',
      name: 'Database Schema',
      description: 'PostgreSQL schema with county-specific tables',
      files: [
        {
          path: 'database/schema.sql',
          language: 'sql',
          content: generateDatabaseSchema(projectType, context)
        },
        {
          path: 'database/seed.sql',
          language: 'sql',
          content: generateSeedData(context)
        }
      ],
      dependencies: ['postgresql', 'prisma'],
      scripts: {
        'db:migrate': 'prisma migrate dev',
        'db:seed': 'prisma db seed',
        'db:studio': 'prisma studio'
      },
      environment: {
        'DATABASE_URL': 'postgresql://user:password@localhost:5432/county_db'
      }
    })
  }

  // API Template
  templates.push({
    type: 'api',
    name: 'REST API',
    description: 'RESTful API with county data integration',
    files: [
      {
        path: 'src/api/routes.ts',
        language: 'typescript',
        content: generateAPIRoutes(projectType, context)
      },
      {
        path: 'src/api/middleware.ts',
        language: 'typescript',
        content: generateAPIMiddleware(context)
      }
    ],
    dependencies: ['express', '@types/express', 'cors', 'helmet'],
    scripts: {
      'api:dev': 'nodemon src/api/server.ts',
      'api:build': 'tsc && node dist/api/server.js'
    },
    environment: {
      'API_PORT': '3001',
      'API_BASE_URL': '/api/v1'
    }
  })

  return templates
}

function generateMainAppCode(projectType: string, context: any): string {
  return `import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// TerraFusion Components
import { TerraFusionProvider } from '@/lib/terrafusion'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'

// Pages
import Dashboard from '@/pages/Dashboard'
import ${projectType === 'assessment' ? 'AssessmentPage' : 'MainPage'} from '@/pages/${projectType === 'assessment' ? 'Assessment' : 'Main'}'
import ReportsPage from '@/pages/Reports'
import SettingsPage from '@/pages/Settings'

// Layout
import Layout from '@/components/Layout'
import Navigation from '@/components/Navigation'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TerraFusionProvider
        config={{
          county: '${context.countyContext?.name || 'County'}',
          department: '${context.department}',
          environment: process.env.NODE_ENV,
          features: ['${projectType}', 'reporting', 'analytics']
        }}
      >
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="county-theme">
            <Router>
              <div className="min-h-screen bg-background">
                <Layout>
                  <Navigation />
                  <main className="flex-1 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/${projectType}" element={<${projectType === 'assessment' ? 'AssessmentPage' : 'MainPage'} />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </main>
                </Layout>
              </div>
            </Router>
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </TerraFusionProvider>
    </QueryClientProvider>
  )
}

export default App`
}

function generatePackageJson(projectType: string, techStack: string[]): string {
  const dependencies = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@tanstack/react-query": "^4.24.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.263.1",
    "clsx": "^1.2.1",
    "tailwind-merge": "^1.10.0",
    "@radix-ui/react-slot": "^1.0.1",
    "class-variance-authority": "^0.4.0"
  }

  if (techStack.includes('postgresql')) {
    dependencies['@prisma/client'] = '^4.10.0'
    dependencies['prisma'] = '^4.10.0'
  }

  if (projectType === 'dashboard') {
    dependencies['recharts'] = '^2.5.0'
    dependencies['@visx/responsive'] = '^3.0.0'
  }

  return JSON.stringify({
    "name": `county-${projectType}-app`,
    "version": "1.0.0",
    "description": `AI-generated ${projectType} application for county operations`,
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview",
      "test": "vitest",
      "test:ui": "vitest --ui",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx}\""
    },
    "dependencies": dependencies,
    "devDependencies": {
      "@types/react": "^18.0.28",
      "@types/react-dom": "^18.0.11",
      "@typescript-eslint/eslint-plugin": "^5.54.0",
      "@typescript-eslint/parser": "^5.54.0",
      "@vitejs/plugin-react": "^3.1.0",
      "autoprefixer": "^10.4.14",
      "eslint": "^8.35.0",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.3.4",
      "postcss": "^8.4.21",
      "prettier": "^2.8.4",
      "tailwindcss": "^3.2.7",
      "typescript": "^4.9.3",
      "vite": "^4.1.0",
      "vitest": "^0.28.5"
    }
  }, null, 2)
}

function generateDatabaseSchema(projectType: string, context: any): string {
  let schema = `-- TerraFusion ${projectType} Database Schema
-- Generated for ${context.countyContext?.name || 'County'} ${context.department}

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Base tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`

  // Add project-specific tables
  switch (projectType) {
    case 'assessment':
      schema += `

-- Property Assessment Tables
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_number VARCHAR(50) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  owner_name VARCHAR(255),
  property_type VARCHAR(50),
  land_area DECIMAL(10,2),
  building_area DECIMAL(10,2),
  year_built INTEGER,
  assessed_value DECIMAL(12,2),
  market_value DECIMAL(12,2),
  location GEOMETRY(POINT, 4326),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  assessor_id UUID REFERENCES users(id),
  assessment_date DATE NOT NULL,
  land_value DECIMAL(12,2),
  improvement_value DECIMAL(12,2),
  total_value DECIMAL(12,2),
  assessment_method VARCHAR(50),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
      break

    case 'dashboard':
      schema += `

-- Dashboard Metrics Tables
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4),
  metric_type VARCHAR(50),
  department VARCHAR(100),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  parameters JSONB,
  generated_by UUID REFERENCES users(id),
  file_path TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
      break

    case 'workflow':
      schema += `

-- Workflow Management Tables
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  status VARCHAR(50) DEFAULT 'running',
  current_step VARCHAR(100),
  data JSONB,
  started_by UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);`
      break
  }

  schema += `

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);`

  return schema
}

function generateAPIRoutes(projectType: string, context: any): string {
  return `import express from 'express'
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole } from './middleware'

const router = express.Router()
const prisma = new PrismaClient()

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: '${projectType}-api',
    county: '${context.countyContext?.name || 'County'}',
    timestamp: new Date().toISOString()
  })
})

// Authentication required for all routes below
router.use(authenticateToken)

${generateProjectSpecificRoutes(projectType)}

// Generic CRUD operations
router.get('/${projectType}s', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const items = await prisma.${projectType}.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.${projectType}.count()

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ${projectType}s' })
  }
})

router.post('/${projectType}s', requireRole(['admin', 'editor']), async (req: Request, res: Response) => {
  try {
    const item = await prisma.${projectType}.create({
      data: {
        ...req.body,
        createdBy: req.user.id
      }
    })
    res.status(201).json(item)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create ${projectType}' })
  }
})

export default router`
}

function generateProjectSpecificRoutes(projectType: string): string {
  switch (projectType) {
    case 'assessment':
      return `
// Property assessment specific routes
router.get('/properties/:id/assessments', async (req: Request, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { propertyId: req.params.id },
      include: { property: true, assessor: true },
      orderBy: { assessmentDate: 'desc' }
    })
    res.json(assessments)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' })
  }
})

router.post('/properties/:id/assess', requireRole(['assessor', 'admin']), async (req: Request, res: Response) => {
  try {
    const assessment = await prisma.assessment.create({
      data: {
        propertyId: req.params.id,
        assessorId: req.user.id,
        ...req.body
      }
    })
    res.status(201).json(assessment)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create assessment' })
  }
})`

    case 'dashboard':
      return `
// Dashboard metrics routes
router.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    const summary = await prisma.metric.groupBy({
      by: ['metricType'],
      _avg: { metricValue: true },
      _count: { id: true },
      where: {
        recordedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics summary' })
  }
})

router.post('/reports/generate', requireRole(['admin', 'analyst']), async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.create({
      data: {
        ...req.body,
        generatedBy: req.user.id,
        status: 'processing'
      }
    })
    
    // Trigger report generation (async)
    generateReportAsync(report.id)
    
    res.status(202).json(report)
  } catch (error) {
    res.status(400).json({ error: 'Failed to initiate report generation' })
  }
})`

    case 'workflow':
      return `
// Workflow management routes
router.post('/workflows/:id/start', async (req: Request, res: Response) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id }
    })
    
    if (!workflow || !workflow.active) {
      return res.status(404).json({ error: 'Workflow not found or inactive' })
    }

    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId: req.params.id,
        startedBy: req.user.id,
        data: req.body.data || {},
        currentStep: 'start'
      }
    })
    
    res.status(201).json(instance)
  } catch (error) {
    res.status(400).json({ error: 'Failed to start workflow' })
  }
})

router.put('/workflow-instances/:id/advance', async (req: Request, res: Response) => {
  try {
    const instance = await prisma.workflowInstance.update({
      where: { id: req.params.id },
      data: {
        currentStep: req.body.nextStep,
        data: req.body.data,
        ...(req.body.completed && { 
          status: 'completed', 
          completedAt: new Date() 
        })
      }
    })
    res.json(instance)
  } catch (error) {
    res.status(400).json({ error: 'Failed to advance workflow' })
  }
})`

    default:
      return '// No specific routes for this project type'
  }
}

function generateDeploymentConfig(projectType: string, context: any) {
  return {
    docker: {
      enabled: true,
      file: 'Dockerfile',
      compose: 'docker-compose.yml'
    },
    environments: {
      development: {
        url: 'http://localhost:3000',
        database: 'postgresql://localhost:5432/county_dev'
      },
      staging: {
        url: 'https://staging.county.gov',
        database: 'postgresql://staging-db:5432/county_staging'
      },
      production: {
        url: 'https://county.gov',
        database: 'postgresql://prod-db:5432/county_prod'
      }
    },
    requirements: {
      node: '>=18.0.0',
      postgresql: '>=14.0.0',
      memory: '512MB',
      storage: '2GB'
    }
  }
}

function generateTestingSuite(projectType: string, context: any) {
  return {
    unit: {
      framework: 'vitest',
      coverage: 80,
      files: ['src/**/*.test.ts', 'src/**/*.test.tsx']
    },
    integration: {
      framework: 'supertest',
      database: 'test',
      files: ['tests/integration/**/*.test.ts']
    },
    e2e: {
      framework: 'playwright',
      browsers: ['chromium', 'firefox'],
      files: ['tests/e2e/**/*.spec.ts']
    }
  }
}

// Utility functions
function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateProjectName(projectType: string, countyName: string): string {
  const typeNames = {
    assessment: 'Property Assessment System',
    dashboard: 'Analytics Dashboard',
    workflow: 'Process Management System',
    report: 'Reporting Suite',
    integration: 'Data Integration Platform'
  }
  
  return `${countyName} ${typeNames[projectType as keyof typeof typeNames] || 'Application'}`
}

function calculateBuildTime(projectType: string, featureCount: number): number {
  const baseTime = {
    assessment: 45,
    dashboard: 30,
    workflow: 60,
    report: 25,
    integration: 50
  }
  
  return (baseTime[projectType as keyof typeof baseTime] || 40) + (featureCount * 5)
}

function extractPreviewFeatures(projectType: string, features: string[]) {
  return features.map(feature => ({
    name: feature,
    available: true,
    url: `/preview/feature/${feature}`
  }))
}

function getDeploymentRequirements(projectType: string) {
  return {
    infrastructure: ['postgresql', 'nginx', 'ssl-certificate'],
    security: ['authentication', 'authorization', 'audit-logging'],
    compliance: ['data-encryption', 'backup-strategy', 'access-controls']
  }
}

function extractUserRoles(department: string) {
  const roleMap = {
    'assessor': ['assessor', 'senior-assessor', 'assessment-admin'],
    'planning': ['planner', 'senior-planner', 'planning-director'],
    'permits': ['permit-clerk', 'permit-reviewer', 'permit-admin'],
    'default': ['user', 'admin']
  }
  
  return roleMap[department.toLowerCase() as keyof typeof roleMap] || roleMap.default
}

function extractWorkflows(prompt: string, department: string) {
  // Basic workflow extraction based on keywords
  const workflows = []
  
  if (prompt.includes('approval') || prompt.includes('review')) {
    workflows.push('approval-process')
  }
  
  if (prompt.includes('assessment') || prompt.includes('valuation')) {
    workflows.push('property-assessment')
  }
  
  if (prompt.includes('permit') || prompt.includes('application')) {
    workflows.push('permit-application')
  }
  
  return workflows.length > 0 ? workflows : ['basic-workflow']
}

function getTechStackDependencies(techStack: string[]) {
  const depMap = {
    'react': ['react', 'react-dom'],
    'typescript': ['typescript', '@types/react', '@types/react-dom'],
    'postgresql': ['@prisma/client', 'prisma'],
    'tailwind': ['tailwindcss', 'autoprefixer', 'postcss'],
    'nextjs': ['next', 'react', 'react-dom']
  }
  
  const deps = new Set<string>()
  techStack.forEach(tech => {
    const techDeps = depMap[tech.toLowerCase() as keyof typeof depMap]
    if (techDeps) {
      techDeps.forEach(dep => deps.add(dep))
    }
  })
  
  return Array.from(deps)
}

function generateBuildScripts(projectType: string) {
  return {
    'dev': 'vite',
    'build': 'tsc && vite build',
    'preview': 'vite preview',
    'test': 'vitest',
    'lint': 'eslint . --ext ts,tsx',
    'format': 'prettier --write "src/**/*.{ts,tsx}"',
    'db:migrate': 'prisma migrate dev',
    'db:seed': 'prisma db seed',
    'deploy': 'npm run build && npm run deploy:staging'
  }
}

function generateEnvironmentVariables(context: any) {
  return {
    'VITE_APP_NAME': `${context.countyContext?.name || 'County'} Application`,
    'VITE_APP_VERSION': '1.0.0',
    'VITE_API_URL': 'http://localhost:3001/api',
    'DATABASE_URL': 'postgresql://user:password@localhost:5432/county_db',
    'NEXTAUTH_SECRET': 'your-secret-key',
    'NEXTAUTH_URL': 'http://localhost:3000'
  }
}

function generateMainEntryCode(context: any): string {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// TerraFusion initialization
import { initializeTerraFusion } from '@/lib/terrafusion'

// Initialize TerraFusion with county configuration
initializeTerraFusion({
  county: '${context.countyContext?.name || 'County'}',
  department: '${context.department}',
  environment: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL,
  features: {
    authentication: true,
    analytics: true,
    reporting: true,
    gis: true
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
}

function generateAPIMiddleware(context: any): string {
  return `import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    department: string
  }
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department || ''
    }

    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

export const auditLog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Log the request for audit purposes
  if (req.user && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: \`\${req.method} \${req.path}\`,
        resourceType: req.path.split('/')[2] || 'unknown',
        resourceId: req.params.id || null,
        details: {
          body: req.body,
          query: req.query,
          params: req.params
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || null
      }
    })
  }

  next()
}

export const rateLimiter = (windowMs: number, max: number) => {
  const requests = new Map()

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip
    const now = Date.now()
    const windowStart = now - windowMs

    if (!requests.has(key)) {
      requests.set(key, [])
    }

    const requestTimes = requests.get(key).filter((time: number) => time > windowStart)
    
    if (requestTimes.length >= max) {
      return res.status(429).json({ error: 'Too many requests' })
    }

    requestTimes.push(now)
    requests.set(key, requestTimes)

    next()
  }
}`
}

function generateSeedData(context: any): string {
  return `-- Seed data for ${context.countyContext?.name || 'County'} ${context.department}

-- Insert default users
INSERT INTO users (email, name, role, department) VALUES
('admin@county.gov', 'System Administrator', 'admin', '${context.department}'),
('assessor@county.gov', 'Senior Assessor', 'assessor', 'Assessor Office'),
('clerk@county.gov', 'County Clerk', 'clerk', 'Clerk Office'),
('analyst@county.gov', 'Data Analyst', 'analyst', 'IT Department');

-- Insert sample data based on project type
${context.projectType === 'assessment' ? `
-- Sample properties
INSERT INTO properties (parcel_number, address, owner_name, property_type, land_area, building_area, year_built, assessed_value, market_value) VALUES
('123-456-789', '123 Main St, Kennewick, WA', 'John Doe', 'Residential', 0.25, 1800, 1995, 250000, 275000),
('123-456-790', '125 Main St, Kennewick, WA', 'Jane Smith', 'Residential', 0.30, 2200, 2005, 320000, 350000),
('123-456-791', '100 Business Ave, Richland, WA', 'ABC Corp', 'Commercial', 1.50, 8500, 1985, 850000, 950000);
` : ''}

-- Insert sample metrics for dashboard
${context.projectType === 'dashboard' ? `
INSERT INTO metrics (metric_name, metric_value, metric_type, department) VALUES
('total_properties', 15432, 'count', 'Assessor Office'),
('avg_assessment_time', 45.5, 'duration', 'Assessor Office'),
('pending_assessments', 23, 'count', 'Assessor Office'),
('assessment_accuracy', 98.7, 'percentage', 'Assessor Office');
` : ''}

-- Insert sample workflows
${context.projectType === 'workflow' ? `
INSERT INTO workflows (name, description, definition, created_by) VALUES
('Property Assessment Workflow', 'Standard property assessment process', 
'{"steps": [{"id": "initial_review", "name": "Initial Review"}, {"id": "field_inspection", "name": "Field Inspection"}, {"id": "valuation", "name": "Valuation"}, {"id": "final_review", "name": "Final Review"}]}',
(SELECT id FROM users WHERE role = 'admin' LIMIT 1));
` : ''}

-- Commit the transaction
COMMIT;`
}`
</rewritten_file>