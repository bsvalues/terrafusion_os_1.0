#!/usr/bin/env node
/**
 * Portal Integration Test
 * Publishes test agent actions to verify Portal UI displays them
 */

import { publishAction } from './packages/transparency-engine/src';

console.log('🧪 Testing Portal Integration\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📡 Publishing test agent actions to Transparency Bus...\n');

// Test Action 1: Backend service starting
DefaultTransparencyBus.publish({
  timestamp: new Date().toISOString(),
  agentId: 'test-backend-1',
  agentRole: 'Backend Service',
  workspace: 'backend',
  service: 'dotnet-backend',
  phase: 'executing',
  summary: 'Starting TerraFusion API on port 5000',
});

setTimeout(() => {
  // Test Action 2: Consciousness engine
  DefaultTransparencyBus.publish({
    timestamp: new Date().toISOString(),
    agentId: 'test-consciousness-1',
    agentRole: 'Consciousness Engine',
    workspace: 'backend',
    service: 'dotnet-backend',
    phase: 'executing',
    summary: 'Initializing AI agent swarm (50,000 agents)',
  });
}, 1000);

setTimeout(() => {
  // Test Action 3: Portal launching
  DefaultTransparencyBus.publish({
    timestamp: new Date().toISOString(),
    agentId: 'test-portal-1',
    agentRole: 'Portal Launcher',
    workspace: 'portal',
    service: 'portal-ui',
    phase: 'executing',
    summary: 'Starting Portal frontend on port 5174',
  });
}, 2000);

setTimeout(() => {
  // Test Action 4: TDC command
  DefaultTransparencyBus.publish({
    timestamp: new Date().toISOString(),
    agentId: 'test-tdc-1',
    agentRole: 'TDC CLI',
    workspace: 'tdc',
    service: 'tdc-cli',
    phase: 'complete',
    summary: 'System status check completed',
  });
}, 3000);

setTimeout(() => {
  // Test Action 5: Error scenario
  DefaultTransparencyBus.publish({
    timestamp: new Date().toISOString(),
    agentId: 'test-error-1',
    agentRole: 'Database Connector',
    workspace: 'backend',
    service: 'dotnet-backend',
    phase: 'error',
    summary: 'Failed to connect to PostgreSQL (connection refused)',
  });
}, 4000);

setTimeout(() => {
  console.log('\n✅ Published 5 test actions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🌐 Portal UI should now display these actions at:');
  console.log('   http://localhost:5174\n');
  console.log('💡 Open the Portal in your browser to see real-time updates!\n');
}, 5000);
