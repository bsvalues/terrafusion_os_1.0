# Environment Configuration Guide

## Environment Variables

### Required Variables

#### API Configuration
```env
VITE_API_BASE_URL=http://localhost:8080/api
```
Base URL for the PACS API backend. In production, this should point to your production API server.

#### SignalR Configuration
```env
VITE_SIGNALR_URL=http://localhost:8080/signalr
```
SignalR hub URL for real-time updates. Must match the backend SignalR hub endpoint.

### Optional Variables

#### Application
```env
VITE_APP_NAME=PACS Quantum AI UI
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
```

#### Feature Flags
```env
VITE_ENABLE_QUERY_BUILDER=true
VITE_ENABLE_WORKFLOW_DESIGNER=true
VITE_ENABLE_DATA_EXPLORER=true
VITE_ENABLE_REALTIME=true
```

#### Performance
```env
VITE_DEFAULT_REFRESH_INTERVAL=5000
VITE_MAX_QUERY_RESULTS=10000
VITE_CACHE_ENABLED=true
```

#### Development
```env
VITE_DEV_MODE=true
VITE_ENABLE_MOCK_DATA=false
VITE_LOG_LEVEL=info
```

## Environment Files

### Development (`.env.development`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SIGNALR_URL=http://localhost:8080/signalr
VITE_APP_NAME=PACS Quantum AI UI (Dev)
VITE_ENABLE_MOCK_DATA=true
VITE_LOG_LEVEL=debug
```

### Production (`.env.production`)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_SIGNALR_URL=https://api.yourdomain.com/signalr
VITE_APP_NAME=PACS Quantum AI UI
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=error
```

### Testing (`.env.test`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SIGNALR_URL=http://localhost:8080/signalr
VITE_ENABLE_MOCK_DATA=true
```

## Accessing Environment Variables

Environment variables are accessed via `import.meta.env`:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
```

**Note**: Only variables prefixed with `VITE_` are exposed to the client code.

## Security Considerations

1. **Never expose secrets** in environment variables that start with `VITE_`
2. **API keys** should be stored server-side only
3. **Sensitive URLs** should use HTTPS in production
4. **Feature flags** can be used to disable features in production

## Validation

The application validates required environment variables on startup:

```typescript
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL not configured, using default: /api');
}
```

