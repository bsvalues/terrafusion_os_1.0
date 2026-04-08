import express from 'express';
import { z } from 'zod';
import { projectManager } from '../services/development/project-manager';
import { fileManager } from '../services/development/file-manager';
import { previewEngine } from '../services/development/preview-engine';
import { getAICodeAssistant } from '../services/development/ai-code-assistant';
import { 
  insertDevProjectSchema, 
  DevFileType, 
  insertCodeSnippetSchema, 
  insertDataVisualizationSchema, 
  insertUIComponentTemplateSchema,
  CodeSnippetType,
  VisualizationType,
  ComponentType
} from '@shared/schema';
import { storage } from '../storage';
import path from 'path';

// Initialize development tool services
import { CodeSnippetService, DataVisualizationService, ComponentPlaygroundService } from '../services/development';
const codeSnippetService = new CodeSnippetService(storage);
const dataVisualizationService = new DataVisualizationService(storage);
const componentPlaygroundService = new ComponentPlaygroundService(storage);

const router = express.Router();

// Project routes
router.get('/projects', async (req, res) => {
  try {
    const projects = await projectManager.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await projectManager.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const validationResult = insertDevProjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const project = await projectManager.createProject(validationResult.data);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const validatedData = insertDevProjectSchema.partial().parse(req.body);
    
    const project = await projectManager.updateProject(projectId, validatedData);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await projectManager.deleteProject(projectId);
    
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Project metadata routes
router.get('/project-types', (req, res) => {
  try {
    const types = projectManager.getProjectTypes();
    res.json(types);
  } catch (error) {
    console.error('Error getting project types:', error);
    res.status(500).json({ error: 'Failed to get project types' });
  }
});

router.get('/project-statuses', (req, res) => {
  try {
    const statuses = projectManager.getProjectStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error getting project statuses:', error);
    res.status(500).json({ error: 'Failed to get project statuses' });
  }
});

// Project templates endpoint - Provides template options for new projects
router.get('/templates', (req, res) => {
  try {
    // Templates organized by categories: basic frameworks, assessment applications, and demos
    const templates = [
      // Basic Framework Templates
      {
        id: 'react-basic',
        name: 'React Basic App',
        description: 'A simple React application with a basic component structure',
        language: 'javascript',
        framework: 'react',
        category: 'framework',
        files: [
          { path: 'src/App.js', type: 'FILE' },
          { path: 'src/index.js', type: 'FILE' },
          { path: 'public/index.html', type: 'FILE' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'api-express',
        name: 'Express API',
        description: 'RESTful API built with Express.js',
        language: 'javascript',
        framework: 'express',
        category: 'framework',
        files: [
          { path: 'src/index.js', type: 'FILE' },
          { path: 'src/routes.js', type: 'FILE' },
          { path: 'src/controllers', type: 'DIRECTORY' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'flask-app',
        name: 'Flask Web Application',
        description: 'Web application built with Flask',
        language: 'python',
        framework: 'flask',
        category: 'framework',
        files: [
          { path: 'app.py', type: 'FILE' },
          { path: 'templates', type: 'DIRECTORY' },
          { path: 'static', type: 'DIRECTORY' },
          { path: 'requirements.txt', type: 'FILE' }
        ]
      },
      
      // Assessment-specific Templates
      {
        id: 'assessment-module',
        name: 'Property Assessment Module',
        description: 'Specialized module for property assessment calculations',
        language: 'javascript',
        framework: 'nodejs',
        category: 'assessment',
        files: [
          { path: 'src/assessment.js', type: 'FILE' },
          { path: 'src/models', type: 'DIRECTORY' },
          { path: 'src/utils', type: 'DIRECTORY' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'cama-dashboard',
        name: 'CAMA Dashboard',
        description: 'Computer Assisted Mass Appraisal dashboard with visualizations',
        language: 'javascript',
        framework: 'react',
        category: 'assessment',
        files: [
          { path: 'src/App.jsx', type: 'FILE' },
          { path: 'src/components/Dashboard.jsx', type: 'FILE' },
          { path: 'src/components/ValuationChart.jsx', type: 'FILE' },
          { path: 'src/components/PropertyTable.jsx', type: 'FILE' },
          { path: 'src/services/camaService.js', type: 'FILE' },
          { path: 'src/utils/calculationHelpers.js', type: 'FILE' },
          { path: 'public/index.html', type: 'FILE' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'valuation-api',
        name: 'Property Valuation API',
        description: 'RESTful API for property valuation calculations',
        language: 'javascript',
        framework: 'express',
        category: 'assessment',
        files: [
          { path: 'src/index.js', type: 'FILE' },
          { path: 'src/routes/valuation-routes.js', type: 'FILE' },
          { path: 'src/controllers/valuationController.js', type: 'FILE' },
          { path: 'src/services/valuationService.js', type: 'FILE' },
          { path: 'src/models/property.js', type: 'FILE' },
          { path: 'src/models/valuation.js', type: 'FILE' },
          { path: 'src/utils/calculationHelpers.js', type: 'FILE' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'property-data-analyzer',
        name: 'Property Data Analyzer',
        description: 'Python-based property data analysis tool',
        language: 'python',
        framework: 'flask',
        category: 'assessment',
        files: [
          { path: 'app.py', type: 'FILE' },
          { path: 'data_analyzer.py', type: 'FILE' },
          { path: 'property_models.py', type: 'FILE' },
          { path: 'valuation_engine.py', type: 'FILE' },
          { path: 'templates/index.html', type: 'FILE' },
          { path: 'templates/analysis_results.html', type: 'FILE' },
          { path: 'static/css/styles.css', type: 'FILE' },
          { path: 'static/js/charts.js', type: 'FILE' },
          { path: 'requirements.txt', type: 'FILE' }
        ]
      },
      
      // Demo Templates
      {
        id: 'comp-sales-demo',
        name: 'Comparable Sales Demo',
        description: 'Interactive demo showing comparable property sales analysis',
        language: 'javascript',
        framework: 'react',
        category: 'demo',
        files: [
          { path: 'src/App.jsx', type: 'FILE' },
          { path: 'src/components/CompSalesMap.jsx', type: 'FILE' },
          { path: 'src/components/PropertyList.jsx', type: 'FILE' },
          { path: 'src/components/AnalysisPanel.jsx', type: 'FILE' },
          { path: 'src/data/sampleProperties.js', type: 'FILE' },
          { path: 'src/services/mockApiService.js', type: 'FILE' },
          { path: 'src/utils/compHelpers.js', type: 'FILE' },
          { path: 'public/index.html', type: 'FILE' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'market-trend-analyzer',
        name: 'Market Trend Analyzer',
        description: 'Demo showing property value trends over time with predictive analytics',
        language: 'javascript',
        framework: 'react',
        category: 'demo',
        files: [
          { path: 'src/App.jsx', type: 'FILE' },
          { path: 'src/components/TrendDashboard.jsx', type: 'FILE' },
          { path: 'src/components/TrendChart.jsx', type: 'FILE' },
          { path: 'src/components/PredictionPanel.jsx', type: 'FILE' },
          { path: 'src/services/marketTrendService.js', type: 'FILE' },
          { path: 'src/data/marketData.js', type: 'FILE' },
          { path: 'src/utils/trendCalculations.js', type: 'FILE' },
          { path: 'src/utils/predictiveModel.js', type: 'FILE' },
          { path: 'public/index.html', type: 'FILE' },
          { path: 'package.json', type: 'FILE' }
        ]
      },
      {
        id: 'property-inspect-tool',
        name: 'Property Inspection Tool',
        description: 'Mobile-friendly app for property inspections with image capture',
        language: 'javascript',
        framework: 'react',
        category: 'demo',
        files: [
          { path: 'src/App.jsx', type: 'FILE' },
          { path: 'src/components/InspectionForm.jsx', type: 'FILE' },
          { path: 'src/components/PhotoCapture.jsx', type: 'FILE' },
          { path: 'src/components/PropertyDetails.jsx', type: 'FILE' },
          { path: 'src/components/InspectionSummary.jsx', type: 'FILE' },
          { path: 'src/services/inspectionService.js', type: 'FILE' },
          { path: 'src/utils/imageProcessing.js', type: 'FILE' },
          { path: 'src/styles/mobile.css', type: 'FILE' },
          { path: 'public/index.html', type: 'FILE' },
          { path: 'package.json', type: 'FILE' }
        ]
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

router.get('/programming-languages', (req, res) => {
  try {
    const languages = projectManager.getProjectLanguages();
    res.json(languages);
  } catch (error) {
    console.error('Error getting programming languages:', error);
    res.status(500).json({ error: 'Failed to get programming languages' });
  }
});

// File routes
router.get('/projects/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const fileTree = await fileManager.buildFileTree(projectId);
    res.json(fileTree);
  } catch (error) {
    console.error('Error getting project files:', error);
    res.status(500).json({ error: 'Failed to get project files' });
  }
});

router.get('/projects/:projectId/files/*', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Access wildcard path parameter with proper TypeScript typing
    const filePath = req.params[0] as string;
    
    const file = await fileManager.getFileByPath(projectId, filePath);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({
      content: file.content,
      path: file.path,
      name: file.name,
      type: file.type
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

router.post('/projects/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, name, content, type } = req.body;
    
    if (!filePath || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const parentPath = path.dirname(filePath) === '.' ? null : path.dirname(filePath);
    
    const file = await fileManager.createFile({
      projectId,
      path: filePath,
      name,
      type,
      content: content || '',
      size: content ? Buffer.from(content).length : 0,
      createdBy: req.body.userId || 1, // Default to user ID 1 if not provided
      parentPath
    });
    
    res.status(201).json(file);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

router.put('/projects/:projectId/files/*', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Access wildcard path parameter with proper TypeScript typing
    const filePath = req.params[0] as string;
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({ error: 'Missing content field' });
    }
    
    const updatedFile = await fileManager.updateFile(projectId, filePath, { content });
    
    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

router.delete('/projects/:projectId/files/*', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Access wildcard path parameter with proper TypeScript typing
    const filePath = req.params[0] as string;
    
    const result = await fileManager.deleteFile(projectId, filePath);
    
    if (!result) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Preview routes
router.get('/projects/:projectId/preview', async (req, res) => {
  try {
    const { projectId } = req.params;
    const previewStatus = await previewEngine.getPreviewStatus(projectId);
    res.json(previewStatus);
  } catch (error) {
    console.error('Error getting preview status:', error);
    res.status(500).json({ error: 'Failed to get preview status' });
  }
});

router.post('/projects/:projectId/preview/start', async (req, res) => {
  try {
    const { projectId } = req.params;
    const previewStatus = await previewEngine.startPreview(projectId);
    res.json(previewStatus);
  } catch (error) {
    console.error('Error starting preview:', error);
    res.status(500).json({ error: 'Failed to start preview' });
  }
});

router.post('/projects/:projectId/preview/stop', async (req, res) => {
  try {
    const { projectId } = req.params;
    const previewStatus = await previewEngine.stopPreview(projectId);
    res.json(previewStatus);
  } catch (error) {
    console.error('Error stopping preview:', error);
    res.status(500).json({ error: 'Failed to stop preview' });
  }
});

// AI Code Assistant routes
router.post('/ai/generate-code', async (req, res) => {
  try {
    const { prompt, fileContext } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt field' });
    }
    
    const aiCodeAssistant = getAICodeAssistant(); 
    const code = await aiCodeAssistant.generateCodeSuggestion(prompt, fileContext);
    res.json({ code });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

router.post('/ai/complete-code', async (req, res) => {
  try {
    const { codeSnippet, language } = req.body;
    
    if (!codeSnippet || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const aiCodeAssistant = getAICodeAssistant();
    const completedCode = await aiCodeAssistant.completeCode(codeSnippet, language);
    res.json({ code: completedCode });
  } catch (error) {
    console.error('Error completing code:', error);
    res.status(500).json({ error: 'Failed to complete code' });
  }
});

router.post('/ai/explain-code', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Missing code field' });
    }
    
    const aiCodeAssistant = getAICodeAssistant();
    const explanation = await aiCodeAssistant.explainCode(code);
    res.json({ explanation });
  } catch (error) {
    console.error('Error explaining code:', error);
    res.status(500).json({ error: 'Failed to explain code' });
  }
});

router.post('/ai/fix-bugs', async (req, res) => {
  try {
    const { code, errorMessage } = req.body;
    
    if (!code || !errorMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const aiCodeAssistant = getAICodeAssistant();
    const fixedCode = await aiCodeAssistant.fixBugs(code, errorMessage);
    res.json({ code: fixedCode });
  } catch (error) {
    console.error('Error fixing bugs:', error);
    res.status(500).json({ error: 'Failed to fix bugs' });
  }
});

router.post('/ai/recommend-improvement', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Missing code field' });
    }
    
    const aiCodeAssistant = getAICodeAssistant();
    const recommendations = await aiCodeAssistant.recommendImprovement(code);
    res.json({ recommendations });
  } catch (error) {
    console.error('Error recommending improvements:', error);
    res.status(500).json({ error: 'Failed to recommend improvements' });
  }
});

// ==================================================================
// DEVELOPMENT TOOLS ROUTES
// ==================================================================

// ======================= CODE SNIPPETS ============================

// Get all code snippets with optional filtering
router.get('/code-snippets', async (req, res) => {
  try {
    const { 
      language, 
      type, 
      search, 
      tags, 
      createdBy, 
      isPublic,
      limit,
      offset
    } = req.query;
    
    // Build filter object from query parameters
    const filter: any = {};
    if (language) filter.language = language as string;
    if (type) filter.snippetType = type as string;
    if (search) filter.search = search as string;
    if (tags) filter.tags = (tags as string).split(',');
    if (createdBy) filter.createdBy = parseInt(createdBy as string);
    if (isPublic) filter.isPublic = isPublic === 'true';
    
    // Parse pagination parameters
    const pagination = {
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0
    };
    
    const snippets = await codeSnippetService.getCodeSnippets(filter, pagination);
    res.json(snippets);
  } catch (error) {
    console.error('Error getting code snippets:', error);
    res.status(500).json({ error: 'Failed to retrieve code snippets' });
  }
});

// Get a single code snippet by ID
router.get('/code-snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snippet = await codeSnippetService.getCodeSnippetById(parseInt(id));
    
    if (!snippet) {
      return res.status(404).json({ error: 'Code snippet not found' });
    }
    
    res.json(snippet);
  } catch (error) {
    console.error('Error getting code snippet:', error);
    res.status(500).json({ error: 'Failed to retrieve code snippet' });
  }
});

// Create a new code snippet
router.post('/code-snippets', async (req, res) => {
  try {
    const validationResult = insertCodeSnippetSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const snippet = await codeSnippetService.createCodeSnippet(validationResult.data);
    res.status(201).json(snippet);
  } catch (error) {
    console.error('Error creating code snippet:', error);
    res.status(500).json({ error: 'Failed to create code snippet' });
  }
});

// Update a code snippet
router.put('/code-snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertCodeSnippetSchema.partial().parse(req.body);
    
    const snippet = await codeSnippetService.updateCodeSnippet(
      parseInt(id), 
      validatedData
    );
    
    if (!snippet) {
      return res.status(404).json({ error: 'Code snippet not found' });
    }
    
    res.json(snippet);
  } catch (error) {
    console.error('Error updating code snippet:', error);
    res.status(500).json({ error: 'Failed to update code snippet' });
  }
});

// Delete a code snippet
router.delete('/code-snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await codeSnippetService.deleteCodeSnippet(parseInt(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Code snippet not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting code snippet:', error);
    res.status(500).json({ error: 'Failed to delete code snippet' });
  }
});

// Generate a code snippet with AI
router.post('/code-snippets/generate', async (req, res) => {
  try {
    const { prompt, language, snippetType } = req.body;
    
    if (!prompt || !language) {
      return res.status(400).json({ error: 'Prompt and language are required' });
    }
    
    const generatedSnippet = await codeSnippetService.generateCodeSnippet(
      prompt, 
      language, 
      snippetType || CodeSnippetType.UTILITY
    );
    
    res.json(generatedSnippet);
  } catch (error) {
    console.error('Error generating code snippet:', error);
    res.status(500).json({ error: 'Failed to generate code snippet' });
  }
});

// Get code snippet metadata (available languages, types, etc.)
router.get('/code-snippets/metadata', async (req, res) => {
  try {
    const metadata = {
      languages: [
        'javascript', 'typescript', 'python', 'java', 'csharp', 'go',
        'ruby', 'php', 'swift', 'kotlin', 'rust', 'sql'
      ],
      types: Object.values(CodeSnippetType),
      frameworks: [
        'react', 'angular', 'vue', 'express', 'django', 'flask',
        'spring', 'laravel', 'aspnet', 'rails'
      ]
    };
    
    res.json(metadata);
  } catch (error) {
    console.error('Error getting code snippet metadata:', error);
    res.status(500).json({ error: 'Failed to retrieve code snippet metadata' });
  }
});

// ======================= DATA VISUALIZATIONS ============================

// Get all data visualizations with optional filtering
router.get('/data-visualizations', async (req, res) => {
  try {
    const { 
      type, 
      search, 
      createdBy, 
      isPublic,
      limit,
      offset
    } = req.query;
    
    // Build filter object from query parameters
    const filter: any = {};
    if (type) filter.visualizationType = type as string;
    if (search) filter.search = search as string;
    if (createdBy) filter.createdBy = parseInt(createdBy as string);
    if (isPublic) filter.isPublic = isPublic === 'true';
    
    // Parse pagination parameters
    const pagination = {
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0
    };
    
    const visualizations = await dataVisualizationService.getDataVisualizations(filter, pagination);
    res.json(visualizations);
  } catch (error) {
    console.error('Error getting data visualizations:', error);
    res.status(500).json({ error: 'Failed to retrieve data visualizations' });
  }
});

// Get a single data visualization by ID
router.get('/data-visualizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visualization = await dataVisualizationService.getDataVisualizationById(parseInt(id));
    
    if (!visualization) {
      return res.status(404).json({ error: 'Data visualization not found' });
    }
    
    res.json(visualization);
  } catch (error) {
    console.error('Error getting data visualization:', error);
    res.status(500).json({ error: 'Failed to retrieve data visualization' });
  }
});

// Create a new data visualization
router.post('/data-visualizations', async (req, res) => {
  try {
    const validationResult = insertDataVisualizationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const visualization = await dataVisualizationService.createDataVisualization(validationResult.data);
    res.status(201).json(visualization);
  } catch (error) {
    console.error('Error creating data visualization:', error);
    res.status(500).json({ error: 'Failed to create data visualization' });
  }
});

// Update a data visualization
router.put('/data-visualizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertDataVisualizationSchema.partial().parse(req.body);
    
    const visualization = await dataVisualizationService.updateDataVisualization(
      parseInt(id), 
      validatedData
    );
    
    if (!visualization) {
      return res.status(404).json({ error: 'Data visualization not found' });
    }
    
    res.json(visualization);
  } catch (error) {
    console.error('Error updating data visualization:', error);
    res.status(500).json({ error: 'Failed to update data visualization' });
  }
});

// Delete a data visualization
router.delete('/data-visualizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dataVisualizationService.deleteDataVisualization(parseInt(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Data visualization not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting data visualization:', error);
    res.status(500).json({ error: 'Failed to delete data visualization' });
  }
});

// Generate a data visualization chart config with AI
router.post('/data-visualizations/generate-config', async (req, res) => {
  try {
    const { dataSource, visualizationType, description } = req.body;
    
    if (!dataSource || !visualizationType) {
      return res.status(400).json({ error: 'Data source and visualization type are required' });
    }
    
    const generatedConfig = await dataVisualizationService.generateVisualizationConfig(
      dataSource, 
      visualizationType as VisualizationType,
      description
    );
    
    res.json(generatedConfig);
  } catch (error) {
    console.error('Error generating visualization config:', error);
    res.status(500).json({ error: 'Failed to generate visualization configuration' });
  }
});

// Get data visualization metadata (available types, chart libraries, etc.)
router.get('/data-visualizations/metadata', async (req, res) => {
  try {
    const metadata = {
      types: Object.values(VisualizationType),
      libraries: [
        'recharts', 'chart.js', 'd3', 'highcharts', 'plotly', 
        'visx', 'nivo', 'victory', 'echarts'
      ],
      colorSchemes: [
        'sequential', 'diverging', 'categorical', 'monochrome',
        'assessment-blues', 'assessment-greens', 'assessment-yellows'
      ]
    };
    
    res.json(metadata);
  } catch (error) {
    console.error('Error getting data visualization metadata:', error);
    res.status(500).json({ error: 'Failed to retrieve data visualization metadata' });
  }
});

// ======================= UI COMPONENT TEMPLATES ============================

// Get all UI component templates with optional filtering
router.get('/ui-components', async (req, res) => {
  try {
    const { 
      type, 
      framework,
      search, 
      tags,
      createdBy, 
      isPublic,
      limit,
      offset
    } = req.query;
    
    // Build filter object from query parameters
    const filter: any = {};
    if (type) filter.componentType = type as string;
    if (framework) filter.framework = framework as string;
    if (search) filter.search = search as string;
    if (tags) filter.tags = (tags as string).split(',');
    if (createdBy) filter.createdBy = parseInt(createdBy as string);
    if (isPublic) filter.isPublic = isPublic === 'true';
    
    // Parse pagination parameters
    const pagination = {
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0
    };
    
    const components = await componentPlaygroundService.getUIComponentTemplates(filter, pagination);
    res.json(components);
  } catch (error) {
    console.error('Error getting UI component templates:', error);
    res.status(500).json({ error: 'Failed to retrieve UI component templates' });
  }
});

// Get a single UI component template by ID
router.get('/ui-components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await componentPlaygroundService.getUIComponentTemplateById(parseInt(id));
    
    if (!component) {
      return res.status(404).json({ error: 'UI component template not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error('Error getting UI component template:', error);
    res.status(500).json({ error: 'Failed to retrieve UI component template' });
  }
});

// Create a new UI component template
router.post('/ui-components', async (req, res) => {
  try {
    const validationResult = insertUIComponentTemplateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const component = await componentPlaygroundService.createUIComponentTemplate(validationResult.data);
    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating UI component template:', error);
    res.status(500).json({ error: 'Failed to create UI component template' });
  }
});

// Update a UI component template
router.put('/ui-components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertUIComponentTemplateSchema.partial().parse(req.body);
    
    const component = await componentPlaygroundService.updateUIComponentTemplate(
      parseInt(id), 
      validatedData
    );
    
    if (!component) {
      return res.status(404).json({ error: 'UI component template not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error('Error updating UI component template:', error);
    res.status(500).json({ error: 'Failed to update UI component template' });
  }
});

// Delete a UI component template
router.delete('/ui-components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await componentPlaygroundService.deleteUIComponentTemplate(parseInt(id));
    
    if (!result) {
      return res.status(404).json({ error: 'UI component template not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting UI component template:', error);
    res.status(500).json({ error: 'Failed to delete UI component template' });
  }
});

// Generate a UI component with AI
router.post('/ui-components/generate', async (req, res) => {
  try {
    const { prompt, framework, componentType } = req.body;
    
    if (!prompt || !framework) {
      return res.status(400).json({ error: 'Prompt and framework are required' });
    }
    
    const generatedComponent = await componentPlaygroundService.generateUIComponent(
      prompt, 
      framework, 
      componentType || ComponentType.FORM
    );
    
    res.json(generatedComponent);
  } catch (error) {
    console.error('Error generating UI component:', error);
    res.status(500).json({ error: 'Failed to generate UI component' });
  }
});

// Get UI component metadata (available component types, frameworks, etc.)
router.get('/ui-components/metadata', async (req, res) => {
  try {
    const metadata = {
      types: Object.values(ComponentType),
      frameworks: [
        'react', 'angular', 'vue', 'svelte', 'solid', 'preact',
        'lit', 'stencil', 'web-components'
      ],
      styling: [
        'css', 'scss', 'styled-components', 'emotion', 'tailwind',
        'bootstrap', 'material-ui', 'chakra-ui', 'shadcn'
      ]
    };
    
    res.json(metadata);
  } catch (error) {
    console.error('Error getting UI component metadata:', error);
    res.status(500).json({ error: 'Failed to retrieve UI component metadata' });
  }
});

export default router;