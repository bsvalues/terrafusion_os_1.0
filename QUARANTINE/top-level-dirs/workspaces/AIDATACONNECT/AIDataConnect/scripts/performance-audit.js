#!/usr/bin/env node

/**
 * RAG Drive FTP Hub Performance Audit Tool
 * This script analyzes the codebase for performance optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const LOG_FILE = './logs/performance-audit.log';
const REPORT_FILE = './performance-audit-report.md';
const DIRECTORIES_TO_ANALYZE = [
  './client/src',
  './server',
  './shared'
];

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Logger setup
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
};

log('Starting performance audit...');

// Function to analyze file sizes
function analyzeFileSizes() {
  log('Analyzing file sizes...');
  
  const fileSizes = [];
  
  for (const dir of DIRECTORIES_TO_ANALYZE) {
    traverseDirectory(dir, (filePath) => {
      const stats = fs.statSync(filePath);
      fileSizes.push({
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime
      });
    });
  }
  
  // Sort by size (largest first)
  fileSizes.sort((a, b) => b.size - a.size);
  
  log(`Analyzed ${fileSizes.length} files`);
  return fileSizes;
}

// Function to traverse a directory
function traverseDirectory(dir, callback) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      traverseDirectory(filePath, callback);
    } else if (stats.isFile()) {
      callback(filePath);
    }
  }
}

// Function to analyze JavaScript/TypeScript complexity
function analyzeCodeComplexity() {
  log('Analyzing code complexity...');
  
  const complexFiles = [];
  
  for (const dir of DIRECTORIES_TO_ANALYZE) {
    traverseDirectory(dir, (filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Simple complexity metrics
        const lineCount = lines.length;
        const functionCount = (content.match(/function\s+\w+\s*\(/g) || []).length +
                             (content.match(/\w+\s*=\s*function\s*\(/g) || []).length +
                             (content.match(/\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length +
                             (content.match(/\([^)]*\)\s*=>/g) || []).length;
        
        // Check for deep nesting
        let maxNestingLevel = 0;
        let currentNestingLevel = 0;
        for (const line of lines) {
          // Increment nesting level for opening brackets
          currentNestingLevel += (line.match(/{/g) || []).length;
          // Decrement nesting level for closing brackets
          currentNestingLevel -= (line.match(/}/g) || []).length;
          // Update max nesting level
          maxNestingLevel = Math.max(maxNestingLevel, currentNestingLevel);
        }
        
        // Check for long functions
        const longFunctions = [];
        let inFunction = false;
        let functionStartLine = 0;
        let functionName = '';
        let bracketCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Function declaration patterns
          const functionDeclaration = line.match(/function\s+(\w+)\s*\(/);
          const arrowFunctionDeclaration = line.match(/(\w+)\s*=\s*\([^)]*\)\s*=>/);
          const methodDeclaration = line.match(/(\w+)\s*\([^)]*\)\s*{/);
          
          if (!inFunction && (functionDeclaration || arrowFunctionDeclaration || methodDeclaration)) {
            inFunction = true;
            functionStartLine = i + 1;
            functionName = functionDeclaration ? functionDeclaration[1] :
                          arrowFunctionDeclaration ? arrowFunctionDeclaration[1] :
                          methodDeclaration ? methodDeclaration[1] : 'anonymous';
            bracketCount += (line.match(/{/g) || []).length;
            bracketCount -= (line.match(/}/g) || []).length;
          } else if (inFunction) {
            bracketCount += (line.match(/{/g) || []).length;
            bracketCount -= (line.match(/}/g) || []).length;
            
            if (bracketCount === 0) {
              const functionLength = i - functionStartLine + 1;
              if (functionLength > 50) { // Functions longer than 50 lines
                longFunctions.push({
                  name: functionName,
                  length: functionLength,
                  startLine: functionStartLine
                });
              }
              inFunction = false;
            }
          }
        }
        
        complexFiles.push({
          path: filePath,
          lines: lineCount,
          functions: functionCount,
          maxNestingLevel,
          longFunctions
        });
      }
    });
  }
  
  // Sort by complexity (most complex first based on nesting level and line count)
  complexFiles.sort((a, b) => {
    if (b.maxNestingLevel !== a.maxNestingLevel) {
      return b.maxNestingLevel - a.maxNestingLevel;
    }
    return b.lines - a.lines;
  });
  
  log(`Analyzed complexity of ${complexFiles.length} files`);
  return complexFiles;
}

// Function to analyze React components for performance issues
function analyzeReactPerformance() {
  log('Analyzing React performance...');
  
  const reactIssues = [];
  
  for (const dir of DIRECTORIES_TO_ANALYZE) {
    traverseDirectory(dir, (filePath) => {
      if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Check for common React performance issues
        const issues = {
          missingMemo: !content.includes('React.memo') && !content.includes('memo(') && content.includes('export default'),
          missingUseCallback: content.includes('function') && content.includes('useState') && !content.includes('useCallback'),
          missingUseMemo: content.includes('useState') && !content.includes('useMemo'),
          inlineObjectCreation: (content.match(/style=\{\{/g) || []).length,
          missingDependencyArray: (content.match(/useEffect\(\s*\(\)\s*=>\s*\{[^}]*\}\s*\)/g) || []).length,
          excessiveRenders: content.includes('console.log') && content.includes('render')
        };
        
        // Look for inline handlers in JSX
        let inlineHandlers = 0;
        for (const line of lines) {
          if (line.includes('on') && line.includes('=>')) {
            inlineHandlers++;
          }
        }
        
        issues.inlineHandlers = inlineHandlers;
        
        // Calculate overall severity
        const severity = Object.values(issues).reduce((sum, value) => {
          return sum + (typeof value === 'number' ? value : (value ? 1 : 0));
        }, 0);
        
        if (severity > 0) {
          reactIssues.push({
            path: filePath,
            severity,
            issues
          });
        }
      }
    });
  }
  
  // Sort by severity (highest first)
  reactIssues.sort((a, b) => b.severity - a.severity);
  
  log(`Found ${reactIssues.length} files with React performance issues`);
  return reactIssues;
}

// Function to analyze API and database queries
function analyzeBackendPerformance() {
  log('Analyzing backend performance...');
  
  const backendIssues = [];
  
  for (const dir of ['./server']) {
    traverseDirectory(dir, (filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common backend performance issues
        const issues = {
          missingIndexes: content.includes('findOne') || content.includes('findMany'),
          missingPagination: (content.includes('find') || content.includes('query')) && !content.includes('limit') && !content.includes('LIMIT'),
          missingCaching: content.includes('query') && !content.includes('cache'),
          n1Problem: content.includes('for') && content.includes('await') && content.includes('findOne'),
          inefficientQueries: content.includes('SELECT * FROM') || content.includes('find({})'),
          synchronousOperations: content.includes('readFileSync') || content.includes('execSync'),
          missingErrorHandling: content.includes('try') && !content.includes('catch'),
          missingTransactions: content.includes('UPDATE') && content.includes('INSERT') && !content.includes('transaction')
        };
        
        // Calculate overall severity
        const severity = Object.values(issues).filter(Boolean).length;
        
        if (severity > 0) {
          backendIssues.push({
            path: filePath,
            severity,
            issues
          });
        }
      }
    });
  }
  
  // Sort by severity (highest first)
  backendIssues.sort((a, b) => b.severity - a.severity);
  
  log(`Found ${backendIssues.length} files with backend performance issues`);
  return backendIssues;
}

// Function to analyze bundle size (using rough estimation)
function analyzeBundleSize() {
  log('Analyzing client bundle size...');
  
  // Group files by type to estimate their contribution to the bundle
  const typeGroups = {
    components: { size: 0, count: 0 },
    utilities: { size: 0, count: 0 },
    styles: { size: 0, count: 0 },
    assets: { size: 0, count: 0 },
    tests: { size: 0, count: 0 },
    other: { size: 0, count: 0 }
  };
  
  traverseDirectory('./client/src', (filePath) => {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    
    if (filePath.includes('/components/')) {
      typeGroups.components.size += size;
      typeGroups.components.count++;
    } else if (filePath.includes('/utils/') || filePath.includes('/helpers/') || filePath.includes('/lib/')) {
      typeGroups.utilities.size += size;
      typeGroups.utilities.count++;
    } else if (filePath.endsWith('.css') || filePath.endsWith('.scss') || filePath.includes('/styles/')) {
      typeGroups.styles.size += size;
      typeGroups.styles.count++;
    } else if (filePath.endsWith('.svg') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.includes('/assets/')) {
      typeGroups.assets.size += size;
      typeGroups.assets.count++;
    } else if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      typeGroups.tests.size += size;
      typeGroups.tests.count++;
    } else {
      typeGroups.other.size += size;
      typeGroups.other.count++;
    }
  });
  
  log('Bundle size analysis completed');
  return typeGroups;
}

// Function to check for unused dependencies
function analyzeUnusedDependencies() {
  log('Analyzing dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
    
    // Count usage of each dependency in the codebase
    const dependencyUsage = {};
    for (const dep of dependencies) {
      dependencyUsage[dep] = 0;
    }
    
    // Search for imports in files
    for (const dir of DIRECTORIES_TO_ANALYZE) {
      traverseDirectory(dir, (filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          for (const dep of dependencies) {
            // Check for imports like 'import x from "dep"' or 'require("dep")'
            if (content.includes(`from '${dep}'`) || 
                content.includes(`from "${dep}"`) ||
                content.includes(`require('${dep}')`) || 
                content.includes(`require("${dep}")`)) {
              dependencyUsage[dep]++;
            }
            
            // Also check for submodule imports like 'import x from "dep/submodule"'
            if (content.includes(`from '${dep}/`) || 
                content.includes(`from "${dep}/`) ||
                content.includes(`require('${dep}/`) || 
                content.includes(`require("${dep}/`)) {
              dependencyUsage[dep]++;
            }
          }
        }
      });
    }
    
    // Find potentially unused dependencies
    const unusedDependencies = Object.entries(dependencyUsage)
      .filter(([dep, count]) => count === 0)
      // Filter out common development tools that might not be directly imported
      .filter(([dep]) => !['typescript', 'eslint', 'prettier', 'vitest', 'jest', 'babel'].includes(dep));
    
    log(`Found ${unusedDependencies.length} potentially unused dependencies`);
    return unusedDependencies;
  } catch (error) {
    log(`Error analyzing dependencies: ${error.message}`);
    return [];
  }
}

// Function to generate optimizations recommendations
function generateOptimizationRecommendations(data) {
  log('Generating optimization recommendations...');
  
  const recommendations = [];
  
  // React optimizations
  if (data.reactIssues.length > 0) {
    recommendations.push({
      category: 'React Performance',
      title: 'React Component Optimizations',
      description: 'The following components have potential performance issues:',
      items: data.reactIssues.slice(0, 5).map(issue => 
        `${issue.path} (Severity: ${issue.severity})`
      ),
      recommendations: [
        'Use React.memo() for components that render often but with the same props',
        'Use useCallback() for event handlers to prevent unnecessary re-renders',
        'Use useMemo() for expensive calculations',
        'Avoid creating objects and arrays in render (move them outside the component or use useMemo)',
        'Ensure all useEffect hooks have proper dependency arrays',
        'Avoid inline function definitions in JSX props'
      ]
    });
  }
  
  // Backend optimizations
  if (data.backendIssues.length > 0) {
    recommendations.push({
      category: 'Backend Performance',
      title: 'API and Database Optimizations',
      description: 'The following server files have potential performance issues:',
      items: data.backendIssues.slice(0, 5).map(issue => 
        `${issue.path} (Severity: ${issue.severity})`
      ),
      recommendations: [
        'Ensure all database queries are properly indexed',
        'Implement pagination for all list endpoints',
        'Add caching for frequently accessed data',
        'Fix N+1 query problems by using proper JOIN operations or DataLoader pattern',
        'Use specific field selection instead of SELECT * or find({})',
        'Replace synchronous operations with asynchronous alternatives',
        'Implement proper error handling for all async operations',
        'Use database transactions for operations that modify multiple records'
      ]
    });
  }
  
  // Code complexity optimizations
  if (data.complexFiles.length > 0) {
    const highComplexityFiles = data.complexFiles.filter(file => file.maxNestingLevel > 4 || file.lines > 300);
    
    if (highComplexityFiles.length > 0) {
      recommendations.push({
        category: 'Code Complexity',
        title: 'Simplify Complex Code',
        description: 'The following files have high complexity that could impact maintainability and performance:',
        items: highComplexityFiles.slice(0, 5).map(file => 
          `${file.path} (Lines: ${file.lines}, Max Nesting: ${file.maxNestingLevel})`
        ),
        recommendations: [
          'Refactor large files into smaller, more focused modules',
          'Break down complex functions into smaller, reusable functions',
          'Reduce nesting levels by using early returns or extracting helper functions',
          'Consider using functional programming patterns to simplify logic',
          'Add comprehensive tests before refactoring to ensure behavior is preserved'
        ]
      });
    }
  }
  
  // Bundle size optimizations
  if (data.bundleSize) {
    recommendations.push({
      category: 'Bundle Size',
      title: 'Optimize Client Bundle Size',
      description: 'Analyze and optimize the client bundle to improve loading performance:',
      items: Object.entries(data.bundleSize).map(([category, info]) => 
        `${category}: ${formatBytes(info.size)} (${info.count} files)`
      ),
      recommendations: [
        'Implement code splitting using dynamic imports',
        'Use React.lazy() for component lazy loading',
        'Optimize images and other assets',
        'Remove unused CSS with tools like PurgeCSS',
        'Consider using a bundle analyzer to identify large dependencies',
        'Implement tree-shaking for all imports'
      ]
    });
  }
  
  // Unused dependencies
  if (data.unusedDependencies.length > 0) {
    recommendations.push({
      category: 'Dependencies',
      title: 'Remove Unused Dependencies',
      description: 'The following dependencies appear to be unused in the codebase:',
      items: data.unusedDependencies.slice(0, 10).map(([dep]) => dep),
      recommendations: [
        'Remove unused dependencies to reduce bundle size',
        'Audit dependencies for security vulnerabilities',
        'Consider using lighter alternatives for large dependencies',
        'Use dynamic imports for dependencies only needed in specific situations'
      ]
    });
  }
  
  // General optimizations
  recommendations.push({
    category: 'General Optimizations',
    title: 'General Performance Improvements',
    description: 'Consider these general optimization strategies:',
    items: [],
    recommendations: [
      'Implement proper caching strategies (HTTP caching, in-memory caching, etc.)',
      'Use compression for HTTP responses',
      'Optimize critical rendering path for faster page loads',
      'Implement proper error boundaries in React components',
      'Use performance monitoring tools to identify bottlenecks',
      'Configure Content Security Policy to improve security',
      'Ensure accessibility standards are met for better user experience'
    ]
  });
  
  log(`Generated ${recommendations.length} optimization recommendations`);
  return recommendations;
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function to generate the final report
function generateReport(data, recommendations) {
  log('Generating performance audit report...');
  
  const reportContent = `# RAG Drive FTP Hub Performance Audit Report

Generated on: ${new Date().toLocaleString()}

## Executive Summary

This report provides an analysis of the current codebase with a focus on performance optimizations. The goal is to identify areas that could be improved to enhance the user experience, reduce resource usage, and ensure the application performs well at scale.

## Performance Overview

### Code Complexity

${data.complexFiles.length > 0 ? `
| File | Lines | Functions | Max Nesting Level |
|------|-------|-----------|------------------|
${data.complexFiles.slice(0, 10).map(file => `| ${file.path} | ${file.lines} | ${file.functions} | ${file.maxNestingLevel} |`).join('\n')}
` : 'No complex files detected.'}

### React Component Analysis

${data.reactIssues.length > 0 ? `
| Component | Severity | Issues |
|-----------|----------|--------|
${data.reactIssues.slice(0, 10).map(issue => `| ${issue.path} | ${issue.severity} | ${Object.entries(issue.issues).filter(([_, value]) => value).map(([key]) => key).join(', ')} |`).join('\n')}
` : 'No React performance issues detected.'}

### Backend Performance

${data.backendIssues.length > 0 ? `
| File | Severity | Issues |
|------|----------|--------|
${data.backendIssues.slice(0, 10).map(issue => `| ${issue.path} | ${issue.severity} | ${Object.entries(issue.issues).filter(([_, value]) => value).map(([key]) => key).join(', ')} |`).join('\n')}
` : 'No backend performance issues detected.'}

### Large Files

${data.fileSizes.length > 0 ? `
| File | Size | Last Modified |
|------|------|---------------|
${data.fileSizes.slice(0, 10).map(file => `| ${file.path} | ${formatBytes(file.size)} | ${file.lastModified.toLocaleString()} |`).join('\n')}
` : 'No large files detected.'}

### Bundle Size Analysis

| Category | Size | File Count |
|----------|------|------------|
${Object.entries(data.bundleSize).map(([category, info]) => `| ${category} | ${formatBytes(info.size)} | ${info.count} |`).join('\n')}

### Unused Dependencies

${data.unusedDependencies.length > 0 ? `
The following dependencies appear to be unused in the codebase:

${data.unusedDependencies.slice(0, 15).map(([dep]) => `- ${dep}`).join('\n')}
` : 'No unused dependencies detected.'}

## Optimization Recommendations

${recommendations.map(rec => `
### ${rec.category}: ${rec.title}

${rec.description}

${rec.items.length > 0 ? `#### Affected Objects:\n${rec.items.map(item => `- ${item}`).join('\n')}` : ''}

#### Recommendations:
${rec.recommendations.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Implementation Steps

1. **Prior to making changes:**
   - Create a performance baseline to measure improvements against
   - Identify the highest impact changes to prioritize
   - Set up monitoring to measure the impact of changes

2. **Implementation priority:**
   - Address critical backend performance issues first
   - Optimize React components with the highest severity
   - Implement code splitting and lazy loading
   - Remove unused dependencies
   - Simplify complex code

3. **Testing:**
   - Performance test each change to measure its impact
   - Ensure functional tests pass after optimizations
   - Test under various load conditions to ensure scalability

## Conclusion

By implementing these recommendations, you can expect improved application performance, better user experience, and more maintainable code. Performance optimization should be an ongoing process, with regular audits and improvements.

---

*This report was generated automatically by the RAG Drive FTP Hub Performance Audit Tool. For assistance with implementing these recommendations, please contact the development team.*
`;
  
  fs.writeFileSync(REPORT_FILE, reportContent);
  log(`Report generated and saved to ${REPORT_FILE}`);
}

// Main function
function main() {
  log('Starting performance audit analysis...');
  
  try {
    // Analyze codebase
    const fileSizes = analyzeFileSizes();
    const complexFiles = analyzeCodeComplexity();
    const reactIssues = analyzeReactPerformance();
    const backendIssues = analyzeBackendPerformance();
    const bundleSize = analyzeBundleSize();
    const unusedDependencies = analyzeUnusedDependencies();
    
    // Compile data
    const data = {
      fileSizes,
      complexFiles,
      reactIssues,
      backendIssues,
      bundleSize,
      unusedDependencies
    };
    
    // Generate recommendations
    const recommendations = generateOptimizationRecommendations(data);
    
    // Generate report
    generateReport(data, recommendations);
    
    log('Performance audit completed successfully');
    return 0;
  } catch (error) {
    log(`Error during performance audit: ${error.message}`);
    return 1;
  }
}

// Run the main function
process.exit(main());