# WebSocket Connectivity Architecture

This document describes the WebSocket connectivity implementation in the Benton County Assessor's Office AI Platform, including the resilient fallback mechanisms and monitoring system.

## Overview

The system uses WebSockets (via Socket.IO) for real-time communication between the frontend and backend agent services. However, WebSocket connections can be fragile in certain environments, especially when traversing through corporate firewalls or running in restricted environments like Replit.

To address these challenges, a comprehensive resilience strategy has been implemented with:

1. **Automatic fallback mechanism** - When WebSocket connectivity fails, the system transparently switches to REST API polling
2. **Connection metrics collection** - Detailed metrics track connection health, fallback events, and performance
3. **User notifications** - Clear notifications when the system switches to fallback mode
4. **Exponential backoff reconnection** - Smart retry logic to prevent overwhelming the server
5. **Comprehensive error handling** - Detailed error capture and reporting

## Connection Flow

The connectivity flow works as follows:

1. The frontend attempts to establish a Socket.IO connection to the backend
2. If successful, it authenticates and begins normal WebSocket operation
3. If the connection fails or drops:
   - The system attempts reconnection with exponential backoff
   - After `maxReconnectAttempts` (default: 5), it switches to fallback mode
   - In fallback mode, HTTP REST polling is used instead of WebSockets
   - Users are notified of fallback mode with a visible notification
   - Metrics are recorded and available for monitoring
   - Periodically, the system attempts to reconnect WebSockets

## Fallback Mechanism

The fallback mechanism is based on REST API polling:

```
┌────────────┐                          ┌────────────┐
│            │  1. WebSocket attempt    │            │
│            │ ─────────────────────>   │            │
│            │                          │            │
│            │  2. WebSocket failure    │            │
│  Frontend  │ <─────────────────────   │  Backend   │
│            │                          │            │
│            │  3. REST API Fallback    │            │
│            │ ─────────────────────>   │            │
│            │                          │            │
│            │  4. REST API Response    │            │
│            │ <─────────────────────   │            │
└────────────┘                          └────────────┘
```

When in fallback mode:

1. The client polls the `/api/agents/socketio/messages/pending` endpoint every `pollingFrequency` milliseconds (default: 3000ms)
2. Any pending messages for the client are returned
3. Messages are processed as if they arrived via WebSocket
4. Outgoing messages are sent via REST API endpoints

## Connection Metrics

The system collects detailed connection metrics:

- **Total fallback activations** - Number of times fallback mode was activated
- **Total reconnect attempts** - Number of WebSocket reconnection attempts
- **Total errors** - Number of connection errors encountered
- **Average reconnect time** - Average time to successfully reconnect (ms)
- **Connection events** - Chronological log of connection-related events
- **Last error** - Most recent error information

These metrics are available via the `useAgentSocketIO` hook's `connectionMetrics` property and can be displayed using the `ConnectionHealthMetrics` component.

## User Interface Components

The system includes several UI components for connectivity:

1. **ConnectionNotification** - Shows when in fallback mode with manual reconnect button
2. **ConnectionStatusIndicator** - Displays current connection status with color coding
3. **ConnectionHealthMetrics** - Dashboard showing detailed connection statistics

## Implementation Details

### Key Files

- `client/src/services/agent-socketio-service.ts` - Main Socket.IO service implementation
- `client/src/services/connection-metrics.ts` - Connection metrics tracking
- `client/src/hooks/use-agent-socketio.tsx` - React hook for using agent Socket.IO
- `client/src/components/connection-notification.tsx` - User notification component
- `client/src/components/connection-health-metrics.tsx` - Metrics display component

### Configuration Options

The Socket.IO service accepts several configuration options:

- `pollingFrequency` - Milliseconds between fallback polling requests
- `maxReconnectAttempts` - Maximum WebSocket reconnection attempts before fallback
- `reconnectDelay` - Base delay in milliseconds for reconnect attempts

## Security Considerations

The connectivity architecture implements several security features:

1. **Authentication on both channels** - Both WebSocket and REST fallback require the same authentication
2. **Timeout protection** - All API requests have appropriate timeouts
3. **Secure communication** - All traffic is encrypted via HTTPS/WSS
4. **Request rate limiting** - Polling frequency is limited to prevent abuse
5. **Error isolation** - Connection errors don't crash the application

## Best Practices

When extending the WebSocket connectivity:

1. Always handle both WebSocket and fallback modes in new features
2. Track connection-related events via the metrics service
3. Provide clear user feedback for connectivity changes
4. Test both connection modes to ensure seamless operation
5. Implement appropriate error handling and fallback logic

## Troubleshooting

Common issues and solutions:

- **Frequent fallback switching**: May indicate network instability; check logs for specific errors
- **High reconnect times**: May indicate server overload or network latency issues
- **Authentication failures**: Check client ID management and server authentication logic
- **Message delivery issues**: Verify message format and ensure proper event handling

## Conclusion

This resilient connectivity architecture ensures the system remains operational even when WebSocket connectivity is unstable. By automatically failing over to REST API polling, the application maintains its functionality, with minimal impact on user experience beyond slight increases in latency.
