#!/usr/bin/env node

/**
 * TerraFusion OS 1.0 AI Model Validation
 * Validates AI model configurations and dependencies
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧠 TerraFusion OS 1.0 AI Model Validation');

const aiModelPaths = [
  'modules/ai-advanced/EnhancedRevenueHunter.ts',
  'modules/ai-advanced/MCPIntegrationHub.ts',
  'modules/ai-advanced/RevenueHunterSwarm.ts',
  'modules/ai-advanced/TemporalOptimizationEngine.ts',
  'phase4-multiversal-orchestrator.ts',
  'phase5-cosmic-consciousness-integration.ts',
  'phase6-universal-harmony-protocol.ts',
  'phase7-transcendent-reality-engine.ts',
  'phase8-infinite-optimization-matrix.ts',
  'phase9-omnipotent-government-ai.ts',
  'phase10-universal-singularity.ts',
  'fractal-swarm-hierarchy.ts',
  'probabilistic-engine-core.ts'
];

async function validateAIModels() {
  let validationErrors = [];
  let validatedModels = 0;

  for (const modelPath of aiModelPaths) {
    const fullPath = path.join(rootDir, modelPath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Basic validation checks
      const checks = [
        { name: 'Has export', test: /export\s+(class|interface|function|const)/ },
        { name: 'Has TypeScript types', test: /:\s*\w+(\[\])?(\s*\|\s*\w+)*/ },
        { name: 'Has error handling', test: /(try\s*{|catch\s*\(|throw\s+)/ },
        { name: 'Has logging', test: /(console\.|logger\.|log\()/ },
        { name: 'Has configuration', test: /(config|Config|configuration|Configuration)/ }
      ];

      const failedChecks = checks.filter(check => !check.test.test(content));
      
      if (failedChecks.length === 0) {
        console.log(`✅ ${modelPath} - All checks passed`);
        validatedModels++;
      } else {
        console.log(`⚠️  ${modelPath} - Missing: ${failedChecks.map(c => c.name).join(', ')}`);
        validationErrors.push(`${modelPath}: Missing ${failedChecks.map(c => c.name).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ${modelPath} - File not found or unreadable`);
      validationErrors.push(`${modelPath}: File not accessible - ${error.message}`);
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`✅ Validated models: ${validatedModels}/${aiModelPaths.length}`);
  console.log(`❌ Validation errors: ${validationErrors.length}`);

  if (validationErrors.length > 0) {
    console.log('\n🔍 Issues found:');
    validationErrors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  } else {
    console.log('\n🎉 All AI models validated successfully!');
  }
}

validateAIModels();
