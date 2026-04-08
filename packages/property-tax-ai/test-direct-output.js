/**
 * Direct output test script
 * 
 * This script is a simplified version that just outputs information
 * to see if the output is being captured properly
 */

console.log("STANDARD OUTPUT: This is a test of standard output");
console.error("STANDARD ERROR: This is a test of standard error");

// Print process info
console.log("Node.js version:", process.version);
console.log("Process ID:", process.pid);
console.log("Current directory:", process.cwd());
console.log("Environment variables count:", Object.keys(process.env).length);

// Test WebSocket constants
try {
  const WebSocket = require('ws');
  console.log("WebSocket module loaded successfully");
  console.log("WebSocket OPEN constant:", WebSocket.OPEN);
} catch (error) {
  console.error("Error loading WebSocket module:", error);
}

// Force output flush
process.stdout.write("FORCED OUTPUT: Making sure output is flushed\n");
process.stderr.write("FORCED ERROR: Making sure error output is flushed\n");

console.log("Test completed");