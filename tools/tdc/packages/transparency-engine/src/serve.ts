#!/usr/bin/env node

/**
 * Transparency Engine WebSocket Server Entry Point
 * Starts the WebSocket server for real-time agent activity streaming
 */

import { transparencyWSServer } from './server';

console.log('');
console.log('🌐 TerraFusion Transparency Engine WebSocket Server');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('  Server: ws://localhost:8788');
console.log('  Status: Running');
console.log('');
console.log('  📊 Broadcasting agent activity in real-time');
console.log('  🔗 Portal frontend can connect for live updates');
console.log('');
console.log('  Press Ctrl+C to stop');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Transparency Engine WebSocket Server...\n');
  transparencyWSServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down Transparency Engine WebSocket Server...\n');
  transparencyWSServer.close();
  process.exit(0);
});

// Keep the process alive
setInterval(() => {
  const clients = transparencyWSServer.getClientCount();
  if (clients > 0) {
    console.log(`[${new Date().toLocaleTimeString()}] Connected clients: ${clients}`);
  }
}, 30000); // Every 30 seconds
