/**
 * WebSocket CORS Middleware
 *
 * This module handles CORS for WebSocket connections, allowing clients
 * to connect to the WebSocket server from different origins.
 */

import { IncomingMessage } from 'http';
import { Socket } from 'net';
import crypto from 'crypto';

// Calculate Sec-WebSocket-Accept value based on Sec-WebSocket-Key
function generateAcceptValue(secWebSocketKey: string): string {
  const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'; // WebSocket Protocol GUID
  const hash = crypto
    .createHash('sha1')
    .update(secWebSocketKey + GUID)
    .digest('base64');
  return hash;
}

// Add CORS headers but don't complete the handshake - let the WebSocket server handle that
export function verifyWebSocketRequest(
  request: IncomingMessage,
  socket: Socket,
  head: Buffer
): boolean {
  // Check if the request is for a WebSocket upgrade
  if (request.headers.upgrade?.toLowerCase() !== 'websocket') {
    return false; // Not a WebSocket upgrade request
  }

  // Handle CORS for WebSocket connections
  const origin = request.headers.origin || '';

  // Allow connections from any origin in development
  // In production, you might want to restrict this to trusted origins
  const allowedOrigins = ['*'];

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    // Return true to allow the connection - don't try to handle the actual handshake
    // The WebSocket server will take care of that
    return true;
  }

  // For non-allowed origins, reject the connection
  socket.write('HTTP/1.1 403 Forbidden\r\n');
  socket.write('Content-Type: text/plain\r\n');
  socket.write('\r\n');
  socket.write('WebSocket connection refused: Origin not allowed');
  socket.end();

  return false;
}
