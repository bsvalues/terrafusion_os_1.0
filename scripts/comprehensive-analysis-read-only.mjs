#!/usr/bin/env node

/**
 * COMPREHENSIVE ANALYSIS - NO ACTIONS
 * Understanding the current state before any consolidation
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 COMPREHENSIVE TERRA ANALYSIS - READ ONLY');
console.log('==========================================');
console.log('');

// 1. What exists in source (OneDrive)
console.log('📂 SOURCE DIRECTORIES (OneDrive):');
// We'll list these manually based on what we saw
const SOURCE_DIRS = [
  'BCBSGISPRO_PRODUCTION',
  'BCBSLevy_PRODUCTION', 
  'BCBSWebhub_PRODUCTION',
  'MCP_Servers_PRODUCTION',
  'MONITORING_PRODUCTION',
  'SECURITY_PRODUCTION', 
  'SystemPrompts_AI_Tools_PRODUCTION',
  'TerraAgent_PRODUCTION',
  'TerraFlow_PRODUCTION',
  'TerraFusion_NextGen_Elite_Execution',
  'TerraFusion-Enterprise',
  'TerraFusionAssessor_PRODUCTION',
  'TerraFusionAssistant_PRODUCTION', 
  'TerraFusionBuild_ACTUAL',
  'TerraFusionDashboard_PRODUCTION',
  'TerraFusionDevelopment',
  'TerraFusionEcosystem_PRODUCTION',
  'TerraFusionGama_PRODUCTION',
  'TerraFusionPermit_PRODUCTION',
  'TerraFusionPilt_PRODUCTION',
  'TerraFusionPlayground_PRODUCTION',
  'TerraFusionPlayground-main',
  'TerraFusionPrimeView_PRODUCTION',
  'TerraFusionPro_PRODUCTION',
  'TerraFusionProf_PRODUCTION', 
  'TerraFusionProPlus_PRODUCTION',
  'TerraFusionSync_PRODUCTION',
  'TerraFusionSync_PRODUCTION_OLD_BACKUP',
  'TerraFusionV0Demo_PRODUCTION',
  'TerraMiner_PRODUCTION'
];

SOURCE_DIRS.forEach((dir, i) => {
  console.log(`${(i+1).toString().padStart(2, '0')}. ${dir}`);
});

console.log(`\nTotal Source Directories: ${SOURCE_DIRS.length}`);
console.log('');

// 2. What exists in target (src-enhanced)
console.log('📁 TARGET DIRECTORIES (src-enhanced):');
const TARGET_DIRS = [
  'ai-army',
  'bcbs-gis-production', 
  'bcbslevy-production',
  'bcbswebhub-production',
  'core',
  'mcp-servers',
  'mcp-servers-production',
  'modules', 
  'monitoring-production',
  'security-production',
  'system-prompts-ai-tools',
  'terraagent-production',
  'terraflow-production',
  'terrafusion-assessor-production',
  'terrafusion-assistant-production',
  'terrafusion-build-actual',
  'terrafusion-dashboard',
  'terrafusion-development',
  'terrafusion-ecosystem',
  'terrafusion-enterprise-v2',
  'terrafusion-gama',
  'terrafusion-gis',
  'terrafusion-income',
  'terrafusion-nextgen-elite',
  'terrafusion-notebook-production',
  'terrafusion-permit-production',
  'terrafusion-pilt-production',
  'terrafusion-playground-main',
  'terrafusion-playground-production', 
  'terrafusion-prime-view',
  'terrafusion-pro-plus',
  'terrafusion-pro-production',
  'terrafusion-prof-production',
  'terrafusion-sync-backup',
  'terrafusion-sync-production',
  'terrafusion-v0-demo',
  'terraminer-production'
];

TARGET_DIRS.forEach((dir, i) => {
  console.log(`${(i+1).toString().padStart(2, '0')}. ${dir}`);
});

console.log(`\nTotal Target Directories: ${TARGET_DIRS.length}`);
console.log('');

// 3. Mapping analysis
console.log('🔄 SOURCE → TARGET MAPPING ANALYSIS:');
console.log('');

const MAPPING_ANALYSIS = [
  { source: 'BCBSGISPRO_PRODUCTION', targets: ['bcbs-gis-production', 'terrafusion-gis'], issue: 'DUPLICATE - Same source, two targets' },
  { source: 'MCP_Servers_PRODUCTION', targets: ['mcp-servers', 'mcp-servers-production'], issue: 'DUPLICATE - Similar names' },
  { source: 'TerraFusionPlayground_PRODUCTION', targets: ['terrafusion-playground-production'], issue: 'OK' },
  { source: 'TerraFusionPlayground-main', targets: ['terrafusion-playground-main'], issue: 'OK - Different source' },
  { source: 'TerraFusionSync_PRODUCTION', targets: ['terrafusion-sync-production'], issue: 'OK' },
  { source: 'TerraFusionSync_PRODUCTION_OLD_BACKUP', targets: ['terrafusion-sync-backup'], issue: 'OK - Different source' },
  { source: 'TerraFusionPro_PRODUCTION', targets: ['terrafusion-pro-production'], issue: 'OK' },
  { source: 'TerraFusionProf_PRODUCTION', targets: ['terrafusion-prof-production'], issue: 'OK - Different source' },
  { source: 'TerraFusionProPlus_PRODUCTION', targets: ['terrafusion-pro-plus'], issue: 'OK' }
];

MAPPING_ANALYSIS.forEach(map => {
  console.log(`SOURCE: ${map.source}`);
  console.log(`TARGETS: ${map.targets.join(', ')}`);
  console.log(`STATUS: ${map.issue}`);
  console.log('');
});

// 4. Identify what's missing
console.log('❓ SOURCES NOT YET MIGRATED:');
const POTENTIAL_MISSING = SOURCE_DIRS.filter(source => {
  // Simple name matching - convert source name to expected target
  const expectedTarget = source
    .toLowerCase()
    .replace(/_production$/i, '-production')
    .replace(/_actual$/i, '-actual')
    .replace(/^bcbs/i, 'bcbs-')
    .replace(/^terra/i, 'terra')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
    
  return !TARGET_DIRS.some(target => target.includes(expectedTarget.split('-')[0]));
});

POTENTIAL_MISSING.forEach(missing => {
  console.log(`- ${missing}`);
});

console.log('');
console.log('🎯 ANALYSIS SUMMARY:');
console.log(`Sources available: ${SOURCE_DIRS.length}`);
console.log(`Targets created: ${TARGET_DIRS.length}`);
console.log(`Potential duplicates: Multiple (needs manual review)`);
console.log(`Potential missing: ${POTENTIAL_MISSING.length}`);
console.log('');
console.log('⚠️  NEXT STEPS NEEDED:');
console.log('1. User review of this analysis');
console.log('2. Define clear 1:1 source→target mapping');
console.log('3. Identify which duplicates to keep/remove');
console.log('4. Plan consolidation strategy');
console.log('5. Execute ONLY after user approval');
console.log('');
console.log('🛑 NO ACTIONS TAKEN - ANALYSIS ONLY');
