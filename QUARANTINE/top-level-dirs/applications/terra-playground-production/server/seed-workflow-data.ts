import {
  WorkflowOptimizationRequest,
  WorkflowOptimizationResult,
  WorkflowOptimizationStatus,
  WorkflowOptimizationType,
  WorkflowOptimizationPriority,
} from '@shared/schema';
import crypto from 'crypto';

export interface SeedWorkflowOptimizerData {
  requests: WorkflowOptimizationRequest[];
  results: WorkflowOptimizationResult[];
}

/**
 * Get seed data for the workflow optimizer
 */
export function getSeedWorkflowOptimizerData(): SeedWorkflowOptimizerData {
  const requests: WorkflowOptimizationRequest[] = [];
  const results: WorkflowOptimizationResult[] = [];
  let requestId = 1;
  let resultId = 1;

  // Create a fixed requestId to ensure consistency across server restarts
  const codeQualityRequestId = '5d966f0f-8b78-43dc-ac3f-a2e91da14b81'; // Match the one in the results
  const codeQualityRequest: WorkflowOptimizationRequest = {
    id: requestId++,
    requestId: codeQualityRequestId,
    userId: 1,
    repositoryId: 1,
    title: 'Code Quality Analysis',
    description: 'Automated code quality analysis to identify improvement opportunities',
    codebase: 'server/routes',
    optimizationType: WorkflowOptimizationType.CODE_QUALITY,
    status: WorkflowOptimizationStatus.COMPLETED,
    priority: WorkflowOptimizationPriority.MEDIUM,
    tags: ['refactoring', 'maintainability'],
    settings: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
  };
  requests.push(codeQualityRequest);

  // Create code quality optimization result
  const codeQualityResult: WorkflowOptimizationResult = {
    id: resultId++,
    requestId: codeQualityRequestId,
    summary: 'Found several code quality issues that can be improved for better maintainability',
    recommendationsJson: JSON.stringify([
      {
        id: crypto.randomUUID(),
        title: 'Improve function parameter validation',
        description:
          'Add proper parameter validation at the beginning of functions to prevent unexpected behavior',
        code: 'function processData(data) {\n  if (!data) return null;\n  // Rest of the function\n}',
        filePath: 'server/routes/api.js',
        lineNumbers: [15, 25],
        impact: 'medium',
        effortEstimate: 'quick',
        category: 'reliability',
        implementationSteps: [
          'Identify functions with missing validation',
          'Add appropriate checks for required parameters',
          'Return early if validation fails',
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'Extract duplicate code into helper functions',
        description:
          'Multiple routes contain similar data processing logic that could be extracted into shared helper functions',
        code: 'function formatResponse(data) {\n  return {\n    success: true,\n    data,\n    timestamp: new Date()\n  };\n}',
        filePath: 'server/utils/helpers.js',
        lineNumbers: null,
        impact: 'medium',
        effortEstimate: 'medium',
        category: 'maintainability',
        implementationSteps: [
          'Identify duplicate code patterns',
          'Create helper functions in utils folder',
          'Replace duplicate code with helper function calls',
        ],
      },
    ]),
    improvementScore: 72,
    runTime: 5600,
    modelUsed: 'gpt-4o',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
  };
  results.push(codeQualityResult);

  // Create a completed performance optimization request
  const perfRequestId = '503cadc4-b33e-4955-b6c3-d0a899530792'; // Match the one in the results
  const perfRequest: WorkflowOptimizationRequest = {
    id: requestId++,
    requestId: perfRequestId,
    userId: 1,
    repositoryId: 1,
    title: 'Performance Optimization',
    description: 'Identify performance bottlenecks in the database queries and API endpoints',
    codebase: 'server/services',
    optimizationType: WorkflowOptimizationType.PERFORMANCE,
    status: WorkflowOptimizationStatus.COMPLETED,
    priority: WorkflowOptimizationPriority.HIGH,
    tags: ['database', 'api', 'optimization'],
    settings: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 47), // 47 hours ago
  };
  requests.push(perfRequest);

  // Create performance optimization result
  const perfResult: WorkflowOptimizationResult = {
    id: resultId++,
    requestId: perfRequestId,
    summary:
      'Identified several performance bottlenecks in database queries and API response handling',
    recommendationsJson: JSON.stringify([
      {
        id: crypto.randomUUID(),
        title: 'Add database indexes',
        description: 'Add indexes to frequently queried columns to improve query performance',
        code: 'CREATE INDEX idx_property_id ON properties(property_id);\nCREATE INDEX idx_user_email ON users(email);',
        filePath: 'server/db/migrations/001_add_indexes.sql',
        lineNumbers: null,
        impact: 'high',
        effortEstimate: 'quick',
        category: 'database',
        implementationSteps: [
          'Identify frequently queried columns',
          'Create appropriate indexes',
          'Monitor query performance after changes',
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'Implement response caching',
        description: "Cache API responses for frequently requested data that doesn't change often",
        code: 'const cache = new Map();\n\nfunction getCachedData(key, ttl, fetchFn) {\n  const now = Date.now();\n  const cached = cache.get(key);\n  \n  if (cached && now < cached.expiry) {\n    return cached.data;\n  }\n  \n  const data = await fetchFn();\n  cache.set(key, { data, expiry: now + ttl });\n  return data;\n}',
        filePath: 'server/utils/cache.js',
        lineNumbers: null,
        impact: 'high',
        effortEstimate: 'medium',
        category: 'api',
        implementationSteps: [
          'Implement caching utility',
          'Identify API endpoints suitable for caching',
          'Apply caching with appropriate TTL values',
        ],
      },
    ]),
    improvementScore: 85,
    runTime: 6200,
    modelUsed: 'gpt-4o',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47), // 47 hours ago
  };
  results.push(perfResult);

  // Create an in-progress security optimization request
  const securityRequestId = crypto.randomUUID();
  const securityRequest: WorkflowOptimizationRequest = {
    id: requestId++,
    requestId: securityRequestId,
    userId: 1,
    repositoryId: 2,
    title: 'Security Vulnerability Scan',
    description: 'Scan for potential security vulnerabilities in the codebase',
    codebase: 'server',
    optimizationType: WorkflowOptimizationType.SECURITY,
    status: WorkflowOptimizationStatus.IN_PROGRESS,
    priority: WorkflowOptimizationPriority.HIGH,
    tags: ['security', 'authentication', 'validation'],
    settings: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  };
  requests.push(securityRequest);

  // Create a pending architecture optimization request
  const architectureRequestId = crypto.randomUUID();
  const architectureRequest: WorkflowOptimizationRequest = {
    id: requestId++,
    requestId: architectureRequestId,
    userId: 1,
    repositoryId: 3,
    title: 'Architecture Review',
    description:
      'Review the current architecture and suggest improvements for scalability and maintainability',
    codebase: '.',
    optimizationType: WorkflowOptimizationType.ARCHITECTURE,
    status: WorkflowOptimizationStatus.PENDING,
    priority: WorkflowOptimizationPriority.MEDIUM,
    tags: ['architecture', 'scalability', 'design-patterns'],
    settings: null,
    createdAt: new Date(), // Just created
    updatedAt: new Date(), // Just created
  };
  requests.push(architectureRequest);

  return { requests, results };
}
