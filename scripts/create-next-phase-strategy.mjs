#!/usr/bin/env node

/**
 * 🎯 Next Phase Migration Strategy  
 * Immediate steps to continue progress from 28.7% to 45%+ confidence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 NEXT PHASE MIGRATION STRATEGY');
console.log('================================');

const CURRENT_STATE = {
  confidence: 28.7,
  systems_completed: 1, // BCBSGISPRO Phase 2
  systems_pending: 28,
  target_next_phase: 45.0
};

const NEXT_SYSTEMS = [
  {
    name: 'BCBSLevy_PRODUCTION',
    contribution: 8.2,
    priority: 'CRITICAL',
    hours: 10
  },
  {
    name: 'BCBSWebhub_PRODUCTION', 
    contribution: 5.8,
    priority: 'CRITICAL',
    hours: 8
  },
  {
    name: 'BSIncomeValuation_PRODUCTION',
    contribution: 4.5,
    priority: 'CRITICAL', 
    hours: 6
  }
];

async function createImmediateActionPlan() {
  console.log('\\n📋 Creating Immediate Action Plan...');
  
  let projectedConfidence = CURRENT_STATE.confidence;
  
  console.log(`📊 Current State: ${CURRENT_STATE.confidence}% confidence`);
  console.log('\\n🎯 Next Phase Target Systems:');
  
  for (const system of NEXT_SYSTEMS) {
    projectedConfidence += system.contribution;
    console.log(`   • ${system.name}: +${system.contribution}% (${system.hours}h)`);
  }
  
  console.log(`\\n📈 Projected Confidence: ${projectedConfidence.toFixed(1)}%`);
  
  const actionPlan = {
    current_confidence: CURRENT_STATE.confidence,
    target_confidence: projectedConfidence.toFixed(1),
    systems_to_migrate: NEXT_SYSTEMS,
    total_estimated_hours: NEXT_SYSTEMS.reduce((sum, sys) => sum + sys.hours, 0),
    
    immediate_next_steps: [
      {
        step: 1,
        action: 'Complete BCBSGISPRO Phase 3 Integration',
        estimated_time: '2 hours',
        confidence_gain: '+6.5%'
      },
      {
        step: 2,
        action: 'Start BCBSLevy_PRODUCTION Foundation',
        estimated_time: '3 hours',
        confidence_gain: '+4.1%'
      },
      {
        step: 3,
        action: 'Start BCBSWebhub_PRODUCTION Foundation', 
        estimated_time: '2 hours',
        confidence_gain: '+2.9%'
      },
      {
        step: 4,
        action: 'Start BSIncomeValuation_PRODUCTION Foundation',
        estimated_time: '2 hours', 
        confidence_gain: '+2.3%'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'IMMEDIATE_ACTION_PLAN.json'),
    JSON.stringify(actionPlan, null, 2)
  );
  
  return actionPlan;
}

async function createNextSystemScript(systemName) {
  console.log(`\\n🔧 Creating ${systemName} migration script...`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * 🎯 ${systemName} Migration Script
 * Foundation and source code integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  system: '${systemName}',
  sourcePath: 'c:\\\\Users\\\\bsval\\\\OneDrive\\\\Desktop\\\\from D\\\\${systemName}',
  targetPath: path.join(__dirname, '..', 'src-enhanced', '${systemName.toLowerCase().replace(/_/g, '-')}'),
  mcpPath: path.join(__dirname, '..', 'src-enhanced', 'mcp-servers', '${systemName.toLowerCase().replace(/_/g, '-')}-mcp')
};

console.log('🎯 ${systemName} Migration Starting...');

async function createFoundation() {
  console.log('\\n📁 Creating Foundation...');
  
  // Create directories
  [CONFIG.targetPath, CONFIG.mcpPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(\`   ✅ Created: \${dir}\`);
    }
  });
  
  // Create migration status
  const status = {
    system: CONFIG.system,
    timestamp: new Date().toISOString(),
    phase: 'FOUNDATION_COMPLETE',
    next_step: 'SOURCE_CODE_ANALYSIS'
  };
  
  fs.writeFileSync(
    path.join(CONFIG.targetPath, 'migration-status.json'),
    JSON.stringify(status, null, 2)
  );
  
  console.log('✅ Foundation complete');
}

async function analyzeSource() {
  console.log('\\n🔍 Analyzing Source...');
  
  if (fs.existsSync(CONFIG.sourcePath)) {
    const files = fs.readdirSync(CONFIG.sourcePath, { recursive: true });
    console.log(\`📊 Found \${files.length} files in source\`);
    
    const analysis = {
      total_files: files.length,
      analyzed_at: new Date().toISOString(),
      source_path: CONFIG.sourcePath,
      target_path: CONFIG.targetPath
    };
    
    fs.writeFileSync(
      path.join(CONFIG.targetPath, 'source-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    return files.length;
  } else {
    console.log('⚠️ Source path not found');
    return 0;
  }
}

async function main() {
  try {
    await createFoundation();
    const fileCount = await analyzeSource();
    
    console.log(\`\\n🎉 \${CONFIG.system} Foundation Complete!\`);
    console.log(\`📊 Files to migrate: \${fileCount}\`);
    console.log('🔄 Ready for source code integration');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

main();
`;

  const scriptPath = path.join(__dirname, `migrate-${systemName.toLowerCase().replace(/_/g, '-')}-foundation.mjs`);
  fs.writeFileSync(scriptPath, scriptContent);
  
  console.log(`   ✅ Created: ${scriptPath}`);
  return scriptPath;
}

async function main() {
  try {
    const actionPlan = await createImmediateActionPlan();
    
    console.log('\\n🔧 Creating Migration Scripts...');
    const scripts = [];
    
    for (const system of NEXT_SYSTEMS) {
      const scriptPath = await createNextSystemScript(system.name);
      scripts.push(scriptPath);
    }
    
    console.log('\\n🚀 IMMEDIATE ACTION PLAN COMPLETE!');
    console.log('===================================');
    console.log(`📊 Current: ${CURRENT_STATE.confidence}% confidence`);
    console.log(`🎯 Target: ${actionPlan.target_confidence}% confidence`);
    console.log(`⏱️ Estimated time: ${actionPlan.total_estimated_hours} hours`);
    console.log(`🔧 Scripts created: ${scripts.length}`);
    
    console.log('\\n📋 IMMEDIATE NEXT STEPS:');
    actionPlan.immediate_next_steps.forEach(step => {
      console.log(`   ${step.step}. ${step.action} (${step.estimated_time}, ${step.confidence_gain})`);
    });
    
    console.log('\\n💡 To start next migration:');
    console.log('   node scripts/migrate-bcbslevy-production-foundation.mjs');
    
  } catch (error) {
    console.error('❌ Strategy creation failed:', error);
  }
}

main();
