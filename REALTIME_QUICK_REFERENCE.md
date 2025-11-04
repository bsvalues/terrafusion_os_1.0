# TerraFusion Real-Time Infrastructure - Quick Reference Guide

**Version**: 2.0.0 - Phase 2 Week 5
**Author**: TerraFusion Elite Government OS Engineering Agent
**Last Updated**: October 31, 2025

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Backend Hubs](#backend-hubs)
3. [Frontend Hooks](#frontend-hooks)
4. [Components](#components)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
# Frontend dependencies already installed
npm install @microsoft/signalr

# Backend packages already in Directory.Packages.props
```

### Quick Start - Notebook Collaboration

```typescript
import { RealtimeNotebook } from '@/components/realtime/RealtimeNotebook';

export function MyNotebookPage() {
  return (
    <RealtimeNotebook
      notebookId={123}
      userId={currentUser.id}
      countyId={currentUser.countyId}
      userName={currentUser.name}
    />
  );
}
```

---

## Backend Hubs

### NotebookHub

**Endpoint**: `/hubs/notebook`

**Join Session**:
```csharp
await hubConnection.InvokeAsync("JoinNotebook", notebookId, userId, countyId, userName);
```

**Update Cell**:
```csharp
await hubConnection.InvokeAsync("UpdateCell", notebookId, cellIndex, content, cellType);
```

**Execute Cell**:
```csharp
await hubConnection.InvokeAsync("ExecuteCell", notebookId, cellIndex, code);
```

**Listen for Events**:
```csharp
connection.On<CellUpdate>("CellUpdated", (update) => {
    Console.WriteLine($"Cell {update.CellIndex} updated");
});
```

### AnalyticsHub

**Endpoint**: `/hubs/analytics`

**Subscribe to Analysis**:
```csharp
await hubConnection.InvokeAsync("SubscribeToAnalysis", analysisId);
```

**Subscribe to Data Stream**:
```csharp
await hubConnection.InvokeAsync("SubscribeToDataStream", streamId);
```

**Listen for Progress**:
```csharp
connection.On<AnalysisProgress>("AnalysisProgress", (progress) => {
    Console.WriteLine($"Progress: {progress.Progress * 100}%");
});
```

### WorkflowHub

**Endpoint**: `/hubs/workflow`

**Subscribe to Workflow**:
```csharp
await hubConnection.InvokeAsync("SubscribeToWorkflow", workflowId, userId, countyId);
```

**Lock Workflow**:
```csharp
await hubConnection.InvokeAsync("LockWorkflow", workflowId, userId, userName);
```

**Unlock Workflow**:
```csharp
await hubConnection.InvokeAsync("UnlockWorkflow", workflowId);
```

### CollaborationHub

**Endpoint**: `/hubs/collaboration`

**Join Session**:
```csharp
await hubConnection.InvokeAsync("JoinSession", sessionId, userInfo);
```

**Send Chat Message**:
```csharp
var message = new { Content = "Hello!", MessageType = "text" };
await hubConnection.InvokeAsync("SendChatMessage", sessionId, message);
```

**Update Presence**:
```csharp
await hubConnection.InvokeAsync("UpdatePresence", sessionId, PresenceStatus.Active);
```

---

## Frontend Hooks

### useNotebookHub

```typescript
import { useNotebookHub } from '@/hooks/useNotebookHub';

function MyComponent() {
  const { state, actions, connection } = useNotebookHub(
    notebookId,
    userId,
    countyId,
    userName,
    true // enabled
  );

  // State
  const { connected, connecting, error, activeUsers, cellUpdates, cursors } = state;

  // Actions
  await actions.updateCell(cellIndex, content, cellType);
  await actions.executeCell(cellIndex, code);
  await actions.addCell(cellIndex, cellType);
  await actions.deleteCell(cellIndex);
  await actions.updateCursor(position);
  await actions.addComment(cellIndex, comment);
  await actions.disconnect();
}
```

### useAnalyticsHub

```typescript
import { useAnalyticsHub } from '@/hooks/useAnalyticsHub';

function MyComponent() {
  const { state, actions } = useAnalyticsHub(true);

  // State
  const {
    connected,
    activeAnalyses,
    dataStreams,
    visualizations,
    statistics
  } = state;

  // Actions
  await actions.subscribeToAnalysis(analysisId);
  await actions.unsubscribeFromAnalysis(analysisId);
  await actions.subscribeToDataStream(streamId);
  await actions.unsubscribeFromDataStream(streamId);

  // Get data
  const analysis = state.activeAnalyses.get(analysisId);
  const stream = state.dataStreams.get(streamId);
}
```

### useWorkflowHub

```typescript
import { useWorkflowHub } from '@/hooks/useWorkflowHub';

function MyComponent() {
  const { state, actions } = useWorkflowHub(true);

  // State
  const {
    connected,
    executions,
    nodeExecutions,
    workflowLock,
    isLocked,
    isLockedByMe
  } = state;

  // Actions
  await actions.subscribeToWorkflow(workflowId, userId, countyId);
  await actions.unsubscribeFromWorkflow(workflowId);
  await actions.lockWorkflow(workflowId, userId, userName);
  await actions.unlockWorkflow(workflowId);

  // Get execution
  const execution = state.executions.get(executionId);
  const nodes = state.nodeExecutions.get(executionId);
}
```

### useCollaborationHub

```typescript
import { useCollaborationHub, PresenceStatus } from '@/hooks/useCollaborationHub';

function MyComponent() {
  const { state, actions } = useCollaborationHub(true);

  // State
  const {
    connected,
    sessionId,
    activeUsers,
    chatMessages,
    activities,
    typingIndicators
  } = state;

  // Actions
  await actions.joinSession(sessionId, userInfo);
  await actions.leaveSession(sessionId);
  await actions.updatePresence(sessionId, PresenceStatus.Active);
  await actions.sendChatMessage(sessionId, "Hello!", "text");
  await actions.sendTypingIndicator(sessionId, true, "chat");
  await actions.broadcastActivity(sessionId, "code_executed", "Ran cell 5");
}
```

---

## Components

### RealtimeNotebook

```typescript
import { RealtimeNotebook } from '@/components/realtime/RealtimeNotebook';

<RealtimeNotebook
  notebookId={123}
  userId={currentUser.id}
  countyId={currentUser.countyId}
  userName={currentUser.name}
  initialCells={cells}
  readOnly={false}
  onCellChange={(cells) => setCells(cells)}
/>
```

### LiveAnalyticsChart

```typescript
import { LiveAnalyticsChart } from '@/components/realtime/LiveAnalyticsChart';

<LiveAnalyticsChart
  analysisId={456}
  streamId="property-values"
  chartType="area"
  title="Property Value Trends"
  description="Real-time property valuation data"
  maxDataPoints={150}
  showProgress
  showStats
/>
```

### WorkflowExecutionMonitor

```typescript
import { WorkflowExecutionMonitor } from '@/components/realtime/WorkflowExecutionMonitor';

<WorkflowExecutionMonitor
  workflowId={789}
  userId={currentUser.id}
  countyId={currentUser.countyId}
  userName={currentUser.name}
  showLocking
  showTimeline
  autoSubscribe
/>
```

### CollaborationSidebar

```typescript
import { CollaborationSidebar } from '@/components/realtime/CollaborationSidebar';

<CollaborationSidebar
  sessionId="session-123"
  currentUser={{
    userId: currentUser.id,
    userName: currentUser.name,
    avatar: currentUser.avatar,
    role: currentUser.role,
  }}
  showChat
  showActivity
  showPresence
  autoJoin
/>
```

---

## Common Patterns

### Pattern 1: Basic SignalR Connection

```typescript
import { signalRService } from '@/services/SignalRService';

// Connect to notebook
const connection = await signalRService.connectToNotebook(
  notebookId,
  userId,
  countyId,
  userName
);

// Listen for events
connection.on('CellUpdated', (update) => {
  console.log('Cell updated:', update);
});

// Disconnect when done
await signalRService.disconnectFromNotebook(notebookId, userName);
```

### Pattern 2: Custom Hook with Effects

```typescript
import { useEffect } from 'react';
import { useNotebookHub } from '@/hooks/useNotebookHub';

function MyComponent({ notebookId, userId, countyId, userName }) {
  const { state, actions } = useNotebookHub(
    notebookId,
    userId,
    countyId,
    userName
  );

  // React to cell updates
  useEffect(() => {
    if (state.cellUpdates.length > 0) {
      const latestUpdate = state.cellUpdates[state.cellUpdates.length - 1];
      console.log('Latest cell update:', latestUpdate);
    }
  }, [state.cellUpdates]);

  return <div>Connected: {state.connected ? 'Yes' : 'No'}</div>;
}
```

### Pattern 3: Error Handling

```typescript
import { useAnalyticsHub } from '@/hooks/useAnalyticsHub';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

function MyComponent() {
  const { state } = useAnalyticsHub();

  if (state.connecting) {
    return <Spinner />;
  }

  if (state.error) {
    return <Alert variant="destructive">{state.error}</Alert>;
  }

  return <div>Connected and ready!</div>;
}
```

### Pattern 4: Broadcasting Events

```typescript
import { useCollaborationHub } from '@/hooks/useCollaborationHub';

function MyComponent({ sessionId }) {
  const { actions } = useCollaborationHub();

  const handleCodeExecution = async () => {
    // Execute code...

    // Broadcast activity
    await actions.broadcastActivity(
      sessionId,
      'code_executed',
      'Executed cell 5',
      { cellIndex: 5, executionTime: 123 }
    );
  };

  return <button onClick={handleCodeExecution}>Run Code</button>;
}
```

### Pattern 5: Workflow Locking

```typescript
import { useWorkflowHub } from '@/hooks/useWorkflowHub';
import { Button } from '@/components/ui/button';

function MyComponent({ workflowId, userId, userName }) {
  const { state, actions } = useWorkflowHub();

  const handleEdit = async () => {
    if (state.isLocked && !state.isLockedByMe) {
      alert(`Workflow is locked by ${state.workflowLock?.userName}`);
      return;
    }

    if (!state.isLocked) {
      await actions.lockWorkflow(workflowId, userId, userName);
    }

    // Perform edits...

    await actions.unlockWorkflow(workflowId);
  };

  return (
    <Button onClick={handleEdit} disabled={state.isLocked && !state.isLockedByMe}>
      Edit Workflow
    </Button>
  );
}
```

---

## Troubleshooting

### Connection Issues

**Problem**: Connection fails to establish

```typescript
// Check connection state
const { state } = useNotebookHub(...);
console.log('Connected:', state.connected);
console.log('Connecting:', state.connecting);
console.log('Error:', state.error);

// Check SignalR service directly
import { signalRService } from '@/services/SignalRService';
const isConnected = signalRService.isConnected('notebook');
console.log('Notebook hub connected:', isConnected);
```

**Solution**:
1. Verify backend is running (port 5000)
2. Check CORS configuration
3. Verify JWT token is valid
4. Check browser console for errors

### Reconnection Issues

**Problem**: Connection lost and not reconnecting

```typescript
// SignalR handles reconnection automatically
// Check reconnection events in console:
// ⚠️ NotebookHub reconnecting...
// ✅ NotebookHub reconnected: connection-id
```

**Solution**:
1. Wait for automatic reconnection (up to 30 seconds)
2. Check network connectivity
3. Verify backend hub is still running
4. Check for max reconnect attempts (5 attempts)

### Performance Issues

**Problem**: Slow real-time updates

```typescript
// Limit data points for charts
<LiveAnalyticsChart
  maxDataPoints={50}  // Lower limit for better performance
  refreshInterval={2000}  // Increase interval
/>
```

**Solution**:
1. Reduce maxDataPoints in LiveAnalyticsChart
2. Increase refreshInterval
3. Use data batching for analytics
4. Implement debouncing for frequent updates

### Access Denied

**Problem**: HubException: "Access denied to notebook"

```typescript
// Backend checks county access
var hasAccess = await _notebookRepository.HasAccessAsync(
  notebookId,
  userId,
  countyId
);
```

**Solution**:
1. Verify user has access to county
2. Check notebook belongs to user's county
3. Verify JWT token contains correct countyId
4. Check repository HasAccessAsync implementation

---

## Best Practices

### 1. Always Cleanup Connections

```typescript
useEffect(() => {
  // Connect
  const connect = async () => {
    await actions.joinSession(sessionId, userInfo);
  };
  connect();

  // Cleanup
  return () => {
    actions.leaveSession(sessionId).catch(console.error);
  };
}, [sessionId]);
```

### 2. Handle All Connection States

```typescript
if (state.connecting) return <LoadingState />;
if (state.error) return <ErrorState />;
if (!state.connected) return <DisconnectedState />;
return <ConnectedState />;
```

### 3. Use Optimistic Updates

```typescript
// Update local state immediately
setCells((prev) => prev.map((cell) =>
  cell.index === cellIndex ? { ...cell, content } : cell
));

// Then broadcast to other users
await actions.updateCell(cellIndex, content, cellType);
```

### 4. Throttle Frequent Events

```typescript
import { throttle } from 'lodash';

const throttledUpdateCursor = throttle(
  (position) => actions.updateCursor(position),
  100  // Max once per 100ms
);
```

### 5. Monitor Connection Health

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (state.connected && state.sessionId) {
      actions.sendHeartbeat(state.sessionId);
    }
  }, 30000);  // Every 30 seconds

  return () => clearInterval(interval);
}, [state.connected, state.sessionId]);
```

---

## API Reference Links

- **Backend Hubs**: `backend/TerraFusion.AI/Hubs/`
- **Frontend Service**: `frontend/src/services/SignalRService.ts`
- **Custom Hooks**: `frontend/src/hooks/use*Hub.ts`
- **Components**: `frontend/src/components/realtime/`

---

## Support

For issues or questions:

1. Check `PHASE_2_WEEK_5_DAYS_1_4_SUMMARY.md` for detailed documentation
2. Review component source code for examples
3. Check browser console for SignalR connection logs
4. Verify backend hub is registered in Program.cs

---

**TerraFusion Elite Government OS Engineering Agent**
*Execute with Excellence* 🏆
