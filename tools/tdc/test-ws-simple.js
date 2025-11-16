#!/usr/bin/env node
/**
 * Simple Portal Integration Test
 */

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Connection to Transparency Engine\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const ws = new WebSocket('ws://localhost:8788');

ws.on('open', () => {
  console.log('✅ Connected to Transparency Engine WebSocket\n');

  // Send a test action
  const action = {
    timestamp: new Date().toISOString(),
    agentId: 'test-1',
    agentRole: 'Test Agent',
    workspace: 'backend',
    service: 'tdc-cli',
    phase: 'executing',
    summary: 'Test action from simple test script',
  };

  console.log('📤 Sending test action:', action.summary);
  ws.send(JSON.stringify(action));

  setTimeout(() => {
    console.log('\n✅ Test complete - check Portal UI at http://localhost:5174\n');
    ws.close();
    process.exit(0);
  }, 2000);
});

ws.on('message', data => {
  console.log('📥 Received:', data.toString());
});

ws.on('error', error => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 Disconnected from Transparency Engine\n');
});
