# TerraFusion Portal - Next.js Citizen Portal

## 🎯 Project Context

**TerraFusion Portal** is a Next.js 14+ React 18 citizen-facing web application providing real-time visibility into the TerraFusion OS ecosystem. This portal enables government staff and citizens to monitor workspaces, view analytics, track deployments, and interact with the AI system through an immersive 3D interface.

**Current Workspace**: `workspaces/portal/apps/terrafusion-web` - Next.js App Router application with TypeScript, Material-UI, and real-time WebSocket integration.

**Critical Understanding**: This is a **visualization and monitoring interface** for the TerraFusion OS backend, NOT a standalone application. It depends on the Rust backend API (port 8787) and .NET backend services (ports 5000, 3004) for data.

**Related Services**:
- `../../../backend/` - .NET 8 microservices (TerraFusion.API, TerraFusion.Consciousness)
- Backend API Gateway: `http://localhost:8787` (Rust-based portal backend)
- WebSocket Endpoints: `ws://localhost:8787/ws/*` (real-time telemetry)

---

## 🏗️ Architecture Overview

### Portal Technology Stack

**Frontend Framework**:
- **Next.js 14+** - React App Router architecture
- **React 18** - Component framework with concurrent features
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Component library and design system
- **Three.js / React Three Fiber** - 3D visualization (TerraSphere component)

**State Management & Data**:
- **React Context API** - Global state (Auth, WebSocket)
- **Custom Hooks** - Data fetching patterns (`useAdvancedWebSocket`, `useWebSocket`)
- **Real-time Updates** - WebSocket provider with automatic reconnection

**Backend Integration**:
- **Rust API Client** - Type-safe client (`src/lib/api/client.ts`)
- **WebSocket Provider** - Real-time streaming (`src/lib/websocket/WebSocketProvider.tsx`)
- **REST Endpoints** - Analytics, security, deployments, federation

### File Structure

```
src/
├── lib/                          # Shared utilities and integrations
│   ├── api/                      # Backend API integration
│   │   ├── client.ts            # TerraFusionApiClient (REST endpoints)
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── hooks.ts             # React Query / data hooks
│   │   └── provider.tsx         # API provider context
│   ├── websocket/               # Real-time WebSocket integration
│   │   ├── WebSocketProvider.tsx  # WebSocket context & reconnection logic
│   │   └── useWebSocket.ts      # WebSocket hooks
│   ├── auth/                     # Authentication context
│   │   └── AuthContext.tsx      # User authentication state
│   ├── data/                     # Static data and mocks
│   │   └── real-county-federation-data.ts  # County federation data
│   └── utils.ts                  # Utility functions
├── pages/                        # Next.js pages (if using Pages Router)
│   └── CodexDashboardDemo.tsx.bak  # Legacy dashboard example
├── components/                   # React components (likely in app/ with App Router)
└── app/                          # Next.js App Router (if using App Router)
```

### Key Components & Services

**API Client (`src/lib/api/client.ts`)**:
- Singleton client: `terrafusionApi`
- Type-safe REST endpoints for health, workspaces, analytics, security, deployments
- WebSocket connection factory for real-time updates
- Error handling with custom `TerraFusionApiError`

**WebSocket Provider (`src/lib/websocket/WebSocketProvider.tsx`)**:
- Automatic reconnection with exponential backoff (max 5 attempts)
- Message type filtering (`health`, `performance`, `analytics`, `security`, `deployment`)
- Connection status tracking (`connecting`, `connected`, `disconnected`, `error`)
- Custom hooks: `useWebSocket()`, `useWebSocketMessages(messageType)`

**Authentication Context (`src/lib/auth/AuthContext.tsx`)**:
- User session management
- SSO integration (Azure AD, Okta)
- Role-based access control (RBAC) support

---

## 🛠️ Development Workflows

### Portal Development Commands

```bash
# Navigate to portal workspace
cd workspaces/portal/apps/terrafusion-web

# Install dependencies (if package.json exists)
npm install

# Development server (Next.js)
npm run dev
# Portal runs on http://localhost:3000 by default

# Production build
npm run build
npm run start

# Type checking
npm run type-check  # OR: npx tsc --noEmit

# Linting
npm run lint
```

### VS Code Tasks (TDC Console Integration)

The portal uses **TDC (TerraFusion Developer Console)** for unified orchestration:

**Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select**:
- `🚀 Launch Portal Full Stack` - Launches portal + backend services
- `📊 Portal Status` - Health check for all services
- `⚡ Launch Backend Services` - Backend only (degraded mode)
- `🤖 AI Activity Trace` - Monitor AI agent coordination
- `🔧 Build TDC` - Build TDC Console

**TDC Commands** (via `npm run tdc <command>`):
```bash
npm run tdc portal:launch   # Launch full stack (frontend + backend)
npm run tdc portal:status   # Check service health
npm run tdc launch:backend  # Backend services only
npm run tdc ai:trace        # AI agent monitoring
```

### Backend Service Dependencies

**Portal requires these backend services running**:

1. **Rust Portal Backend** (port 8787):
   - Provides `/api/portal/*` endpoints
   - WebSocket server for real-time updates
   - Located in separate backend repository (not in this workspace)

2. **.NET Backend Services** (optional, for full features):
   - `TerraFusion.API` (port 5000/5001) - Property data, county operations
   - `TerraFusion.Consciousness` (port 3004) - AI agent coordination
   - See `../../../backend/` workspace

**Starting Backend Services**:
```bash
# Start .NET services (from backend/ workspace)
cd ../../../backend
dotnet run --project TerraFusion.API
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"

# OR use VS Code task: "Launch Core Services (Degraded, No Build)"
```

---

## 🎯 Key Development Patterns

### 1. Type-Safe API Integration

**Always use the typed API client** (`terrafusionApi`):

```typescript
import { terrafusionApi } from '@/lib/api/client';

// ✅ CORRECT: Type-safe API calls
const health = await terrafusionApi.getHealth();
const workspaces = await terrafusionApi.getWorkspaces();
const analytics = await terrafusionApi.getWorkspaceAnalytics('workspace-id', '24h');

// ✅ CORRECT: Error handling
try {
  const data = await terrafusionApi.getSecurityDashboard();
} catch (error) {
  if (error instanceof TerraFusionApiError) {
    if (error.isNetworkError) {
      // Backend not running
    } else if (error.isServerError) {
      // Backend error (500+)
    }
  }
}

// ❌ WRONG: Direct fetch without types
const response = await fetch('http://localhost:8787/api/portal/health');
const data = await response.json(); // No type safety!
```

### 2. WebSocket Real-Time Updates

**Use WebSocket provider for real-time data**:

```tsx
import { useWebSocket, useWebSocketMessages } from '@/lib/websocket/WebSocketProvider';

// Component with WebSocket connection status
function MyComponent() {
  const { isConnected, connectionStatus, sendMessage } = useWebSocket();
  
  return (
    <div>
      <p>Status: {connectionStatus}</p>
      {isConnected && <button onClick={() => sendMessage({ type: 'ping' })}>Ping</button>}
    </div>
  );
}

// Listen to specific message types
function PerformanceMonitor() {
  const performanceMessages = useWebSocketMessages('performance');
  
  return (
    <div>
      {performanceMessages.map((msg, idx) => (
        <div key={idx}>{JSON.stringify(msg)}</div>
      ))}
    </div>
  );
}

// Wrap app with WebSocket provider
function App() {
  return (
    <WebSocketProvider url="ws://localhost:8787/ws">
      <MyComponent />
    </WebSocketProvider>
  );
}
```

### 3. County Federation Data

**Use real county data** from `src/lib/data/real-county-federation-data.ts`:

```typescript
import { countyFederationData } from '@/lib/data/real-county-federation-data';

// County nodes for 3D visualization
const countyNodes = countyFederationData.nodes;
console.log(`Rendering ${countyNodes.length} counties`); // 39 Washington counties

// Connection edges between counties
const countyEdges = countyFederationData.edges;
```

### 4. Material-UI Theming

**Use MUI components consistently**:

```tsx
import { Box, Typography, Button, Card } from '@mui/material';

function Dashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        TerraFusion Dashboard
      </Typography>
      <Card sx={{ p: 2, mt: 2 }}>
        <Button variant="contained" color="primary">
          Launch AI Analysis
        </Button>
      </Card>
    </Box>
  );
}
```

---

## 📋 API Endpoints Reference

### Core Endpoints

**Health & Status**:
```typescript
GET /api/portal/health                  // System health summary
GET /api/portal/workspaces              // Workspace list
POST /api/portal/ask                    // AI assistant query
```

**Analytics**:
```typescript
GET /api/analytics/workspace/:id?timeframe=24h    // Workspace analytics
GET /api/analytics/system?timeframe=24h           // System-wide analytics
GET /api/analytics/performance/system             // Performance metrics
```

**Security**:
```typescript
GET /api/security/dashboard             // Security dashboard
GET /api/security/events?limit=50       // Recent security events
GET /api/security/compliance            // Compliance status
```

**Deployments**:
```typescript
GET /api/deployments/pipelines          // All deployment pipelines
GET /api/deployments/pipeline/:id       // Specific pipeline
POST /api/deployments/trigger           // Trigger deployment
GET /api/deployments/status             // Deployment status
```

**County Federation**:
```typescript
GET /api/federation/nodes               // County nodes
GET /api/federation/health              // Federation health
POST /api/federation/send               // Inter-county message
```

### WebSocket Endpoints

**Real-Time Streams**:
```typescript
ws://localhost:8787/ws/telemetry        // Telemetry data stream
ws://localhost:8787/ws/security         // Security events stream
ws://localhost:8787/ws/deployments      // Deployment updates stream
```

**Message Types**:
- `health` - System health updates
- `performance` - Performance metrics
- `analytics` - Analytics data
- `security` - Security events
- `deployment` - Deployment status

---

## 🎨 Component Development Guidelines

### Component Structure

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface MyComponentProps {
  title: string;
  data?: unknown;
  onAction?: () => void;
}

/**
 * MyComponent - Brief description
 * 
 * @param props - Component properties
 * @returns React component
 */
export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  data, 
  onAction 
}) => {
  // Component logic
  
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      {/* Component content */}
    </Box>
  );
};

export default MyComponent;
```

### Performance Optimization

**Use React best practices**:

```tsx
// ✅ Memoize expensive computations
const processedData = useMemo(() => {
  return heavyComputation(rawData);
}, [rawData]);

// ✅ Memoize callback functions
const handleClick = useCallback(() => {
  performAction();
}, [dependencies]);

// ✅ Code splitting for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <CircularProgress />
});

// ❌ Avoid inline object creation in render
// Bad: <Component style={{ margin: 10 }} />
// Good: Define style object outside or use sx prop with MUI
```

---

## 🔧 Configuration & Environment

### Environment Variables

Create `.env.local` for local development:

```bash
# Backend API endpoint
NEXT_PUBLIC_API_URL=http://localhost:8787

# WebSocket endpoint
NEXT_PUBLIC_WS_URL=ws://localhost:8787/ws

# .NET Backend services (optional)
NEXT_PUBLIC_DOTNET_API_URL=http://localhost:5000
NEXT_PUBLIC_CONSCIOUSNESS_URL=http://localhost:3004

# Feature flags
NEXT_PUBLIC_ENABLE_3D_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_AI_CHAT=true
```

### TypeScript Configuration

**`tsconfig.json` should include**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🚀 Deployment & Production

### Build Process

```bash
# Production build
npm run build

# Check build output
ls -la .next/

# Start production server
npm run start
# Production runs on http://localhost:3000
```

### Production Checklist

- [ ] Build completes without errors (`npm run build`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Backend API endpoint configured correctly
- [ ] WebSocket connections tested
- [ ] Environment variables set for production
- [ ] Error boundaries implemented for critical components
- [ ] Loading states for all async operations

### Docker Deployment (if applicable)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔍 Debugging & Troubleshooting

### Common Issues

**1. Backend Connection Failed**:
```typescript
// Check if backend is running
const isHealthy = await terrafusionApi.ping();
if (!isHealthy) {
  console.error('Backend not available at http://localhost:8787');
}
```

**2. WebSocket Connection Errors**:
```typescript
// Check connection status
const { connectionStatus } = useWebSocket();
console.log('WebSocket status:', connectionStatus);

// Common issues:
// - Backend WebSocket server not running
// - CORS issues (check backend CORS configuration)
// - Firewall blocking WebSocket connections
```

**3. Type Errors**:
```bash
# Run type checker
npx tsc --noEmit

# Common fixes:
# - Update types in src/lib/api/types.ts
# - Ensure API responses match TypeScript interfaces
```

### Development Tools

**Browser DevTools**:
- **Network Tab** - Monitor API requests, WebSocket connections
- **Console** - Check for errors, WebSocket messages
- **React DevTools** - Inspect component state, props
- **Redux DevTools** (if using Redux) - State debugging

**VS Code Extensions**:
- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - IntelliSense and type checking

---

## 📚 Key Resources

### Documentation Files
- **This File**: `.github/copilot-instructions.md` - Portal development guide
- **Backend Guide**: `../../../backend/.github/copilot-instructions.md` - Backend services
- **API Types**: `src/lib/api/types.ts` - TypeScript interface definitions

### Code References
- **API Client**: `src/lib/api/client.ts` - REST API integration patterns
- **WebSocket Provider**: `src/lib/websocket/WebSocketProvider.tsx` - Real-time patterns
- **County Data**: `src/lib/data/real-county-federation-data.ts` - County federation

### External Documentation
- **Next.js Documentation**: https://nextjs.org/docs
- **React Documentation**: https://react.dev
- **Material-UI**: https://mui.com/material-ui/getting-started/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## ⚠️ Critical Constraints

### Always Do
✅ Use typed API client (`terrafusionApi`) - never direct fetch
✅ Handle WebSocket disconnections gracefully (provider handles this)
✅ Test with backend services running (use TDC Console)
✅ Follow Material-UI theming and design system
✅ Use TypeScript strict mode - no `any` types
✅ Implement loading and error states for all async operations

### Never Do
❌ Bypass type safety with `any` or `@ts-ignore`
❌ Hardcode backend URLs - use environment variables
❌ Make synchronous API calls that block UI
❌ Ignore WebSocket connection errors
❌ Skip error boundaries for critical components
❌ Deploy without testing backend integration

---

## 🎯 Next Steps for New Developers

1. **Setup**: Ensure backend services are running (`npm run tdc portal:status`)
2. **Explore**: Read `src/lib/api/client.ts` to understand API integration
3. **Test**: Try connecting to WebSocket (`useWebSocket()` hook)
4. **Build**: Create a simple dashboard component using MUI
5. **Deploy**: Test production build (`npm run build && npm start`)

---

**Brand Voice**: "Government. Transcended."

**Status**: Active Development | Real-time Integration | Type-Safe Architecture

**Execute with excellence. Build with clarity. Monitor with precision.**
