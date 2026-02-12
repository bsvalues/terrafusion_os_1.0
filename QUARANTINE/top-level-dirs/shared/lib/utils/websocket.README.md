# WebSocket & Real-Time Connection Utilities

**Robust WebSocket connection management with automatic reconnection, message queuing, and event handling for TerraFusion OS**

## Overview

The WebSocket utilities module provides production-ready WebSocket connection management for real-time features in TerraFusion's property assessment and GIS platform. Built to handle unreliable network conditions, connection drops, and high-frequency updates.

## Features

### ✅ Connection Management
- Automatic connection and reconnection
- Exponential backoff with jitter
- Connection state tracking (connecting, connected, disconnected, reconnecting, error)
- Configurable retry policies
- Graceful connection cleanup

### ✅ Message Handling
- Message queuing when disconnected
- Automatic queue flush on reconnection
- Type-safe message structure
- Message ID generation and tracking
- Support for JSON and raw data

### ✅ Event System
- Subscribe/unsubscribe to message types
- Connection lifecycle events (open, close, error, reconnect)
- Type-safe event listeners
- Error handling for listeners

### ✅ Heartbeat/Health Monitoring
- Configurable ping/pong heartbeat
- Connection health detection
- Automatic reconnection on timeout
- Last heartbeat tracking

### ✅ Advanced Features
- Configurable message queue limit
- Reconnection statistics
- Queue information and management
- Debug logging mode
- Resource cleanup and destroy

## Installation

```typescript
import {
  WebSocketManager,
  createWebSocket,
  ConnectionState,
  type WebSocketConfig,
  type WebSocketMessage
} from '@terrafusion/shared/utils/websocket';
```

## Quick Start

```typescript
// Create WebSocket connection
const ws = createWebSocket('ws://localhost:3000/ws', {
  autoConnect: true,
  autoReconnect: true,
  heartbeatInterval: 30000,
  debug: true
});

// Listen for property updates
ws.on('propertyUpdate', (data) => {
  console.log('Property updated:', data);
});

// Send a message
ws.send({
  type: 'subscribe',
  data: { channel: 'properties', filter: { city: 'Kennewick' } }
});

// Clean up on unmount
ws.destroy();
```

## Real-World Examples

### Example 1: Real-Time Property Updates

```typescript
import { WebSocketManager, ConnectionState } from '@terrafusion/shared/utils/websocket';

// Create connection for property assessment updates
const propertyWS = new WebSocketManager({
  url: 'ws://terrafusion.local/api/property-updates',
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  debug: true
});

// Handle connection state changes
propertyWS.onConnectionEvent('open', () => {
  console.log('Connected to property update stream');
  
  // Subscribe to updates for specific parcels
  propertyWS.send({
    type: 'subscribe',
    data: {
      parcels: ['P123456', 'P123457', 'P123458'],
      events: ['valuation', 'ownership', 'appeal']
    }
  });
});

propertyWS.onConnectionEvent('close', (event) => {
  console.log('Disconnected from property updates');
});

propertyWS.onConnectionEvent('reconnect', (context) => {
  console.log(`Reconnecting (attempt ${context.attemptNumber})...`);
});

// Listen for different property update types
propertyWS.on('valuationUpdate', (data) => {
  console.log(`Property ${data.parcelId} valuation: $${data.newValue}`);
  updatePropertyCard(data.parcelId, { value: data.newValue });
});

propertyWS.on('ownershipChange', (data) => {
  console.log(`Property ${data.parcelId} sold to ${data.newOwner}`);
  showNotification('Ownership Changed', `Parcel ${data.parcelId} has a new owner`);
});

propertyWS.on('appealFiled', (data) => {
  console.log(`Appeal filed for ${data.parcelId}`);
  updatePropertyStatus(data.parcelId, 'UNDER_APPEAL');
});
```

### Example 2: Collaborative GIS Editing

```typescript
import { createWebSocket } from '@terrafusion/shared/utils/websocket';

// Connect to collaborative editing session
const collabWS = createWebSocket('ws://terrafusion.local/api/collaborate', {
  autoConnect: false, // Manual connection control
  autoReconnect: true,
  heartbeatInterval: 15000,
  messageQueueLimit: 200
});

// Join a map editing session
async function joinEditingSession(mapId: string, userId: string) {
  // Connect first
  collabWS.connect();
  
  // Wait for connection
  collabWS.onConnectionEvent('open', () => {
    // Join the editing room
    collabWS.send({
      type: 'join',
      data: { mapId, userId, userInfo: { name: 'John Doe', role: 'Assessor' } }
    });
  });
  
  // Handle user presence
  collabWS.on('userJoined', (data) => {
    console.log(`${data.userInfo.name} joined the session`);
    addUserCursor(data.userId, data.userInfo);
  });
  
  collabWS.on('userLeft', (data) => {
    console.log(`${data.userInfo.name} left the session`);
    removeUserCursor(data.userId);
  });
  
  // Handle collaborative edits
  collabWS.on('featureUpdate', (data) => {
    console.log(`Feature ${data.featureId} updated by ${data.userId}`);
    updateMapFeature(data.featureId, data.geometry, data.properties);
  });
  
  collabWS.on('cursorMove', (data) => {
    updateUserCursor(data.userId, data.position);
  });
}

// Broadcast local edits to other users
function broadcastFeatureEdit(featureId: string, geometry: any, properties: any) {
  collabWS.send({
    type: 'featureUpdate',
    data: { featureId, geometry, properties, timestamp: Date.now() }
  });
}

// Send cursor position updates (throttled)
let lastCursorSend = 0;
function onMapMouseMove(position: { lat: number, lng: number }) {
  const now = Date.now();
  if (now - lastCursorSend > 100) { // Throttle to 10 updates/sec
    collabWS.send({
      type: 'cursorMove',
      data: { position }
    });
    lastCursorSend = now;
  }
}

// Leave session
function leaveEditingSession() {
  collabWS.send({ type: 'leave' });
  collabWS.disconnect();
}
```

### Example 3: Live Property Auction System

```typescript
import { WebSocketManager, ConnectionState } from '@terrafusion/shared/utils/websocket';

// Connect to auction WebSocket
const auctionWS = new WebSocketManager({
  url: `ws://terrafusion.local/api/auctions/${auctionId}`,
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: 0, // Infinite retries for auctions
  reconnectDelay: 500,
  heartbeatInterval: 10000, // Aggressive heartbeat for auctions
  heartbeatTimeout: 3000
});

// Track connection state
let isConnected = false;

auctionWS.onConnectionEvent('open', () => {
  isConnected = true;
  showConnectionStatus('Connected', 'success');
  
  // Register as bidder
  auctionWS.send({
    type: 'register',
    data: { bidderId: userId, bidderName: userName }
  });
});

auctionWS.onConnectionEvent('close', () => {
  isConnected = false;
  showConnectionStatus('Disconnected', 'error');
});

auctionWS.onConnectionEvent('reconnect', (context) => {
  showConnectionStatus(`Reconnecting... (${context.attemptNumber})`, 'warning');
});

// Handle auction events
auctionWS.on('auctionStart', (data) => {
  console.log(`Auction started: ${data.propertyAddress}`);
  startAuctionTimer(data.duration);
  updateCurrentBid(data.startingBid);
});

auctionWS.on('bidReceived', (data) => {
  console.log(`New bid: $${data.amount} from ${data.bidderName}`);
  updateCurrentBid(data.amount);
  addBidToHistory(data);
  
  if (data.bidderId === userId) {
    showNotification('Bid Accepted', `Your bid of $${data.amount} has been placed`);
  } else {
    playBidSound();
  }
});

auctionWS.on('bidRejected', (data) => {
  showNotification('Bid Rejected', data.reason, 'error');
});

auctionWS.on('auctionEnd', (data) => {
  console.log(`Auction ended. Winner: ${data.winnerName} - $${data.finalBid}`);
  stopAuctionTimer();
  
  if (data.winnerId === userId) {
    showNotification('Congratulations!', `You won with a bid of $${data.finalBid}`, 'success');
  } else {
    showNotification('Auction Ended', `Won by ${data.winnerName} - $${data.finalBid}`, 'info');
  }
});

// Place a bid
function placeBid(amount: number) {
  if (!isConnected) {
    showNotification('Not Connected', 'Cannot place bid while disconnected', 'error');
    return;
  }
  
  auctionWS.send({
    type: 'placeBid',
    data: { bidderId: userId, amount, timestamp: Date.now() }
  });
}
```

### Example 4: System Monitoring Dashboard

```typescript
import { createWebSocket, type WebSocketMessage } from '@terrafusion/shared/utils/websocket';

// Connect to system monitoring hub
const monitoringWS = createWebSocket('ws://terrafusion.local/api/monitoring', {
  autoConnect: true,
  autoReconnect: true,
  heartbeatInterval: 30000,
  debug: false
});

// Subscribe to monitoring channels
monitoringWS.onConnectionEvent('open', () => {
  monitoringWS.send({
    type: 'subscribe',
    data: {
      channels: ['system-health', 'performance', 'ai-agents', 'database']
    }
  });
});

// Handle different monitoring events
monitoringWS.on('systemHealth', (data) => {
  updateHealthIndicator('cpu', data.cpuUsage);
  updateHealthIndicator('memory', data.memoryUsage);
  updateHealthIndicator('disk', data.diskUsage);
});

monitoringWS.on('performanceMetrics', (data) => {
  updateChart('responseTime', data.averageResponseTime);
  updateChart('requestsPerSecond', data.requestsPerSecond);
  updateChart('activeConnections', data.activeConnections);
});

monitoringWS.on('aiAgentUpdate', (data) => {
  updateAgentStatus(data.agentId, data.status);
  
  if (data.status === 'error') {
    showAlert(`AI Agent ${data.agentId} encountered an error`, 'warning');
  }
});

monitoringWS.on('databaseAlert', (data) => {
  if (data.severity === 'critical') {
    showAlert(`Database ${data.database}: ${data.message}`, 'error');
  }
  addLogEntry('database', data);
});

// Check connection health
setInterval(() => {
  const lastHeartbeat = monitoringWS.getLastHeartbeat();
  const timeSinceHeartbeat = Date.now() - lastHeartbeat;
  
  if (timeSinceHeartbeat > 60000) {
    console.warn('No heartbeat received in over 60 seconds');
  }
}, 10000);
```

### Example 5: Legal Description Real-Time Validation

```typescript
import { WebSocketManager } from '@terrafusion/shared/utils/websocket';

// Connect to legal description validation service
const validationWS = new WebSocketManager({
  url: 'ws://terrafusion.local/api/legal-validation',
  autoConnect: true,
  autoReconnect: true,
  messageQueueLimit: 50
});

// Debounce validation requests
let validationTimeout: ReturnType<typeof setTimeout> | null = null;

function validateLegalDescription(text: string) {
  // Clear previous timeout
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
  
  // Debounce by 500ms
  validationTimeout = setTimeout(() => {
    validationWS.send({
      type: 'validate',
      data: { text, parcelId: currentParcelId }
    });
  }, 500);
}

// Handle validation results
validationWS.on('validationResult', (data) => {
  if (data.isValid) {
    showValidationSuccess();
    highlightValidSegments(data.segments);
  } else {
    showValidationErrors(data.errors);
    highlightErrorSegments(data.errorSegments);
  }
  
  // Update computed area and perimeter
  if (data.computedGeometry) {
    updateGeometryPreview(data.computedGeometry);
    updateCalculatedArea(data.area);
    updateCalculatedPerimeter(data.perimeter);
  }
});

// Handle real-time parsing suggestions
validationWS.on('suggestionAvailable', (data) => {
  showAutocompleteSuggestion(data.suggestion, data.position);
});

// Check if message queue is getting full
setInterval(() => {
  const queueInfo = validationWS.getQueueInfo();
  if (queueInfo.percentage > 80) {
    console.warn(`Validation queue is ${queueInfo.percentage.toFixed(0)}% full`);
  }
}, 5000);
```

### Example 6: Multi-County Data Sync

```typescript
import { WebSocketManager, ConnectionState } from '@terrafusion/shared/utils/websocket';

class CountyDataSync {
  private connections = new Map<string, WebSocketManager>();
  
  connectCounty(countyId: string, countyName: string) {
    if (this.connections.has(countyId)) {
      console.log(`Already connected to ${countyName}`);
      return;
    }
    
    const ws = new WebSocketManager({
      url: `ws://terrafusion.local/api/counties/${countyId}/sync`,
      autoConnect: true,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      debug: true
    });
    
    // Connection events
    ws.onConnectionEvent('open', () => {
      console.log(`Connected to ${countyName} data stream`);
      updateCountyStatus(countyId, 'connected');
      
      // Request initial data sync
      ws.send({ type: 'requestSync', data: { lastSyncTime: getLastSyncTime(countyId) } });
    });
    
    ws.onConnectionEvent('close', () => {
      console.log(`Disconnected from ${countyName}`);
      updateCountyStatus(countyId, 'disconnected');
    });
    
    ws.onConnectionEvent('reconnect', (context) => {
      console.log(`Reconnecting to ${countyName} (attempt ${context.attemptNumber})`);
      updateCountyStatus(countyId, 'reconnecting');
    });
    
    // Data sync events
    ws.on('dataUpdate', (data) => {
      console.log(`Received ${data.records.length} updates from ${countyName}`);
      processCountyUpdates(countyId, data.records);
      setLastSyncTime(countyId, data.timestamp);
    });
    
    ws.on('syncComplete', (data) => {
      console.log(`Sync complete for ${countyName}: ${data.recordsProcessed} records`);
      updateCountyStatus(countyId, 'synced');
    });
    
    this.connections.set(countyId, ws);
  }
  
  disconnectCounty(countyId: string) {
    const ws = this.connections.get(countyId);
    if (ws) {
      ws.disconnect();
      this.connections.delete(countyId);
    }
  }
  
  disconnectAll() {
    this.connections.forEach((ws, countyId) => {
      ws.disconnect();
    });
    this.connections.clear();
  }
  
  getConnectionStatus() {
    const status: Record<string, ConnectionState> = {};
    this.connections.forEach((ws, countyId) => {
      status[countyId] = ws.getState();
    });
    return status;
  }
}

// Usage
const dataSync = new CountyDataSync();
dataSync.connectCounty('benton-wa', 'Benton County, WA');
dataSync.connectCounty('franklin-wa', 'Franklin County, WA');
dataSync.connectCounty('yakima-wa', 'Yakima County, WA');
```

### Example 7: Error Handling and Recovery

```typescript
import { WebSocketManager, ConnectionState } from '@terrafusion/shared/utils/websocket';

const ws = new WebSocketManager({
  url: 'ws://terrafusion.local/api/updates',
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  messageQueueLimit: 100,
  debug: true
});

// Track connection metrics
let connectTime: number = 0;
let disconnectCount: number = 0;
let totalDowntime: number = 0;

ws.onConnectionEvent('open', () => {
  connectTime = Date.now();
  console.log('Connected');
  
  // Log reconnection stats if this was a reconnection
  const stats = ws.getReconnectionStats();
  if (stats.attemptNumber > 0) {
    console.log(`Reconnected after ${stats.attemptNumber} attempts (${stats.elapsedTime}ms downtime)`);
    totalDowntime += stats.elapsedTime;
  }
});

ws.onConnectionEvent('close', (event) => {
  if (connectTime > 0) {
    const uptime = Date.now() - connectTime;
    console.log(`Disconnected after ${uptime}ms uptime`);
    disconnectCount++;
  }
});

ws.onConnectionEvent('error', (error) => {
  console.error('WebSocket error:', error);
  logError('websocket', error);
  
  // Implement custom error recovery
  const state = ws.getState();
  if (state === ConnectionState.ERROR) {
    // Check if we should give up
    const stats = ws.getReconnectionStats();
    if (stats.attemptNumber >= 10) {
      console.error('Max reconnection attempts reached, switching to fallback');
      switchToPollingMode();
    }
  }
});

ws.onConnectionEvent('reconnect', (context) => {
  console.log(`Reconnection attempt ${context.attemptNumber}/${ws.getReconnectionStats().maxAttempts}`);
  console.log(`Time since first attempt: ${context.elapsedTime}ms`);
  
  // Show user notification
  showToast(`Attempting to reconnect... (${context.attemptNumber})`, 'info');
});

// Monitor message queue
setInterval(() => {
  const queueInfo = ws.getQueueInfo();
  
  if (queueInfo.size > 0) {
    console.log(`Message queue: ${queueInfo.size}/${queueInfo.limit} (${queueInfo.percentage.toFixed(1)}%)`);
    
    if (queueInfo.percentage > 90) {
      console.warn('Message queue is almost full!');
      showAlert('Connection issues - messages are being queued', 'warning');
    }
  }
}, 5000);

// Periodic connection health check
setInterval(() => {
  const lastHeartbeat = ws.getLastHeartbeat();
  const timeSinceHeartbeat = Date.now() - lastHeartbeat;
  
  if (ws.isConnected() && timeSinceHeartbeat > 60000) {
    console.warn(`No heartbeat received in ${timeSinceHeartbeat}ms`);
    // Force reconnection
    ws.disconnect();
    ws.connect();
  }
}, 30000);

// Log connection statistics
function logConnectionStats() {
  console.log('Connection Statistics:');
  console.log(`  Disconnections: ${disconnectCount}`);
  console.log(`  Total downtime: ${totalDowntime}ms`);
  console.log(`  Current state: ${ws.getState()}`);
  console.log(`  Queue size: ${ws.getQueueInfo().size}`);
}
```

## API Reference

### Class: WebSocketManager

Main class for managing WebSocket connections.

#### Constructor

```typescript
new WebSocketManager(config: WebSocketConfig)
```

**Parameters:**
- `config.url` - WebSocket URL (required)
- `config.protocols` - WebSocket protocols (optional)
- `config.autoConnect` - Auto-connect on instantiation (default: true)
- `config.autoReconnect` - Auto-reconnect on connection loss (default: true)
- `config.maxReconnectAttempts` - Max reconnection attempts, 0 = infinite (default: 0)
- `config.reconnectDelay` - Initial reconnection delay in ms (default: 1000)
- `config.maxReconnectDelay` - Maximum reconnection delay in ms (default: 30000)
- `config.heartbeatInterval` - Heartbeat interval in ms, 0 = disabled (default: 30000)
- `config.heartbeatTimeout` - Heartbeat timeout in ms (default: 5000)
- `config.messageQueueLimit` - Message queue size limit (default: 100)
- `config.debug` - Enable debug logging (default: false)

#### Methods

##### Connection Management

**`connect(): void`**
Establishes WebSocket connection.

**`disconnect(code?: number, reason?: string): void`**
Disconnects WebSocket connection.
- `code` - Close code (default: 1000 = normal closure)
- `reason` - Close reason (default: 'Normal closure')

**`getState(): ConnectionState`**
Returns current connection state.

**`isConnected(): boolean`**
Returns true if connection is established.

##### Message Handling

**`send<T>(message: WebSocketMessage<T>): boolean`**
Sends a message through WebSocket. Returns true if sent immediately, false if queued.

**`sendRaw(data: string | ArrayBufferLike | Blob | ArrayBufferView): void`**
Sends raw data through WebSocket. Throws error if not connected.

##### Event Handling

**`on<T>(event: string, listener: WebSocketEventListener<T>): void`**
Registers an event listener for a specific message type.

**`off<T>(event: string, listener: WebSocketEventListener<T>): void`**
Removes an event listener.

**`removeAllListeners(event?: string): void`**
Removes all event listeners for a specific event or all events.

**`onConnectionEvent(event: 'open' | 'close' | 'error' | 'reconnect', callback: ConnectionEventCallback): void`**
Registers a connection lifecycle event listener.

**`offConnectionEvent(event: 'open' | 'close' | 'error' | 'reconnect', callback: ConnectionEventCallback): void`**
Removes a connection event listener.

##### Information & Management

**`getReconnectionStats(): { attemptNumber: number; elapsedTime: number; maxAttempts: number }`**
Returns reconnection statistics.

**`getQueueInfo(): { size: number; limit: number; percentage: number }`**
Returns message queue information.

**`clearQueue(): void`**
Clears the message queue.

**`getLastHeartbeat(): number`**
Returns last heartbeat timestamp.

**`destroy(): void`**
Cleans up all resources.

### Utility Functions

#### `createWebSocket(url: string, options?: Partial<WebSocketConfig>): WebSocketManager`
Factory function to create a WebSocket connection with simplified API.

#### `calculateBackoffDelay(attempt: number, baseDelay?: number, maxDelay?: number): number`
Calculates exponential backoff delay.
- `attempt` - Current attempt number (0-based)
- `baseDelay` - Base delay in ms (default: 1000)
- `maxDelay` - Maximum delay in ms (default: 30000)

**Formula:** `min(baseDelay * 2^attempt, maxDelay)`

#### `calculateJitteredBackoff(attempt: number, baseDelay?: number, maxDelay?: number, jitterFactor?: number): number`
Calculates jittered backoff delay (adds randomness to prevent thundering herd).
- `jitterFactor` - Jitter factor 0-1 (default: 0.1 = ±10%)

#### `isWebSocketState(ws: WebSocket | null, state: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'): boolean`
Checks if WebSocket is in a specific ready state.

#### `getWebSocketState(ws: WebSocket | null): string`
Gets WebSocket ready state as string.

#### `waitForWebSocketState(ws: WebSocket, targetState: number, timeout?: number): Promise<void>`
Waits for WebSocket to reach a specific state.

## Types

```typescript
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

interface WebSocketMessage<T = any> {
  type: string;
  data?: T;
  timestamp?: number;
  id?: string;
}

interface ReconnectionContext {
  attemptNumber: number;
  elapsedTime: number;
  lastError?: Error;
}
```

## Reconnection Strategy

The WebSocketManager implements exponential backoff with the following formula:

```
delay = min(reconnectDelay * 2^attemptNumber, maxReconnectDelay)
```

**Example delays:**
- Attempt 0: 1,000ms
- Attempt 1: 2,000ms
- Attempt 2: 4,000ms
- Attempt 3: 8,000ms
- Attempt 4: 16,000ms
- Attempt 5+: 30,000ms (capped)

### Jittered Backoff

To prevent thundering herd problem (multiple clients reconnecting simultaneously):

```typescript
import { calculateJitteredBackoff } from '@terrafusion/shared/utils/websocket';

// With 10% jitter
const delay = calculateJitteredBackoff(attempt, 1000, 30000, 0.1);
// Attempt 3: 8,000ms ± 800ms = 7,200-8,800ms
```

## Message Queue

When disconnected, messages are automatically queued:
- Default limit: 100 messages
- Oldest messages removed when limit reached (FIFO)
- Automatic flush on reconnection
- Queue can be monitored with `getQueueInfo()`

## Heartbeat System

Prevents silent connection death:

1. Every `heartbeatInterval` ms, send `{ type: 'ping' }`
2. Expect `{ type: 'pong' }` or `{ type: 'heartbeat' }` response
3. If no response within `heartbeatTimeout` ms, disconnect and reconnect
4. Track last heartbeat with `getLastHeartbeat()`

## Error Handling Best Practices

```typescript
// 1. Connection event monitoring
ws.onConnectionEvent('error', (error) => {
  logError('websocket', error);
  showUserNotification('Connection issue detected');
});

// 2. Reconnection monitoring
ws.onConnectionEvent('reconnect', (context) => {
  if (context.attemptNumber > 5) {
    considerFallbackMode();
  }
});

// 3. Queue monitoring
setInterval(() => {
  const queue = ws.getQueueInfo();
  if (queue.percentage > 80) {
    warnUserAboutQueueing();
  }
}, 5000);

// 4. Heartbeat monitoring
setInterval(() => {
  const lastHeartbeat = ws.getLastHeartbeat();
  if (Date.now() - lastHeartbeat > 60000) {
    forceReconnection();
  }
}, 30000);
```

## Use Cases

### Property Assessment
- Real-time property valuation updates
- Live appeal status changes
- Ownership transfer notifications
- Tax assessment broadcast

### GIS/Mapping
- Collaborative map editing
- Live feature updates
- User cursor tracking
- Layer synchronization

### Auctions
- Real-time bidding
- Bid notifications
- Auction timer sync
- Winner announcements

### System Monitoring
- Live health metrics
- Performance dashboards
- AI agent status updates
- Database alerts

### Data Synchronization
- Multi-county data sync
- Cross-system updates
- Replication streams
- Change notifications

## Performance Considerations

- **Message Throughput**: Handle 100+ messages/second
- **Reconnection**: Exponential backoff prevents server overload
- **Queue Management**: Prevents memory leaks with configurable limits
- **Heartbeat**: Detects dead connections without excessive traffic
- **Event Listeners**: Use `off()` to prevent memory leaks

## Browser Support

WebSocket is supported in all modern browsers:
- Chrome 16+
- Firefox 11+
- Safari 7+
- Edge (all versions)
- Opera 12.1+

## Dependencies

**None** - Pure JavaScript/TypeScript implementation using native WebSocket API.

## Testing

```typescript
import { WebSocketManager, ConnectionState } from '@terrafusion/shared/utils/websocket';

// Mock WebSocket for testing
const mockWS = new WebSocketManager({
  url: 'ws://localhost:3000/test',
  autoConnect: false,
  debug: true
});

// Test connection
mockWS.onConnectionEvent('open', () => {
  console.assert(mockWS.isConnected(), 'Should be connected');
  console.assert(mockWS.getState() === ConnectionState.CONNECTED, 'State should be CONNECTED');
});

// Test message handling
mockWS.on('test', (data) => {
  console.assert(data.value === 'test', 'Should receive test message');
});

mockWS.connect();
```

## Contributing

Follow THE TERRAFUSION WAY:
1. Write production-ready, well-documented code
2. Include comprehensive error handling
3. Provide real-world examples
4. Test with actual network conditions
5. Maintain type safety

## License

Part of TerraFusion OS - Property Assessment & GIS Platform

---

**Day 9 of TerraFusion OS Extraction - THE TERRAFUSION WAY** 🚀

*Building reliable real-time connections for the future of property assessment.*
