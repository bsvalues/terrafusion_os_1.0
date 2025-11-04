# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**TerraFusion OS Frontend** is a React 18 + TypeScript PWA with Electron desktop shell for government operations. This is the UI layer for a complete government operating system with real-time AI coordination, property management, and citizen services.

**Critical**: This builds to `../native-shell/ui` - not a standard `dist/` folder. The frontend is embedded in a native shell for desktop deployment.

## Tech Stack

- **Framework**: React 18.3.1 with TypeScript 5.3.2
- **Build Tool**: Vite 5.0.8 with esbuild
- **Styling**: Tailwind CSS 4.1.14 + CSS custom properties
- **UI Components**: Radix UI primitives + shadcn/ui patterns + Material-UI 5
- **State Management**: Zustand 4.4.7 + Redux Toolkit 2.0.1 + TanStack Query 5.59.0
- **Charts**: Recharts 2.15.4
- **3D Graphics**: Three.js 0.179.1
- **Real-time**: SignalR 8.0.0 for backend WebSocket communication
- **Routing**: React Router DOM 6.20.1
- **Desktop**: Electron 28.3.3
- **Testing**: Jest 29.7.0 + React Testing Library + Playwright
- **Code Quality**: ESLint 8.57.0 + Prettier 3.2.0 + Husky 9.1.7

## Architecture

### Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui primitives (button, card, input, etc.)
│   │   ├── analytics/      # Analytics dashboards
│   │   ├── brand/          # TerraSphere and brand components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── ecosystem/      # Module ecosystem UI
│   │   ├── navigation/     # Navigation components
│   │   └── widgets/        # Widget system
│   ├── contexts/           # React contexts (WidgetManager, etc.)
│   ├── hooks/              # Custom hooks (useBackendConnection, etc.)
│   ├── services/           # API services and performance optimization
│   ├── pages/              # Page-level components
│   ├── routes/             # Route configuration
│   ├── lib/                # Utility libraries
│   ├── styles/             # Global styles and design system
│   │   ├── terrafusion-brand.css
│   │   ├── terrafusion-theme.css
│   │   └── terrafusion-*.css
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── App.tsx             # Main application entry
├── public/                 # Static assets
├── electron/               # Electron main process
├── tests/                  # Test files
└── scripts/                # Build and deployment scripts
```

### Key Architectural Patterns

#### 1. Path Aliases

TypeScript paths are configured for clean imports:

```tsx
import { Button } from '@/components/ui/button';
import { useBackendConnection } from '@/hooks/useBackendConnection';
import { api } from '@/services/api';
import type { Property } from '@/types/property';
```

Available aliases:
- `@/*` - src root
- `@/components/*` - components directory
- `@/services/*` - services directory
- `@/hooks/*` - hooks directory
- `@/utils/*` - utilities
- `@/types/*` - type definitions
- `@/lib/*` - library code

#### 2. Build Output

**CRITICAL**: The frontend builds to `../native-shell/ui`, NOT `dist/`:

```typescript
// vite.config.ts
build: {
  outDir: '../native-shell/ui',
  emptyOutDir: true,
}
```

This enables the native desktop shell to serve the built frontend directly.

#### 3. API Proxy Configuration

Development proxy routes `/api` requests to .NET backend:

```typescript
// vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // .NET API
      changeOrigin: true,
      ws: true,  // SignalR WebSocket support
    },
  },
}
```

#### 4. SignalR Real-Time Communication

SignalR connects frontend to backend real-time hubs:

```tsx
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/api/hubs/system')
  .withAutomaticReconnect()
  .build();

await connection.start();
connection.on('ReceiveUpdate', (data) => {
  // Handle real-time updates
});
```

#### 5. TerraFusion Design System

The design system uses CSS custom properties with Tailwind:

```css
/* styles/terrafusion-theme.css */
:root {
  --terra-cyan: #00FFFF;
  --terra-midnight: #0A0E1A;
  --terra-blue: #0080FF;
}
```

Tailwind config extends with TerraFusion colors:

```js
colors: {
  'terra-cyan': '#00FFFF',
  'terra-midnight': '#0A0E1A',
  'terra-transcend': '#00FFEE',
}
```

## Common Development Commands

### Development

```bash
# Start development server (port 3000)
npm run dev

# Start with clean cache
npm run dev:clean

# Start Electron desktop app
npm run electron:dev

# Type checking
npm run type-check
```

### Building

```bash
# Production build (outputs to ../native-shell/ui)
npm run build

# Build with bundle analysis
npm run build:analyze

# Elite build with optimizations
npm run build:elite

# Preview production build
npm run preview
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests with Playwright
npm run test:e2e

# Run all test suites
npm run test:all
```

### Code Quality

```bash
# Lint TypeScript/React code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Run quality checks
npm run quality

# Fix all quality issues
npm run quality:fix

# Government compliance checks (a11y + security)
npm run government:compliance
```

### Storybook

```bash
# Start Storybook dev server (port 6006)
npm run storybook

# Build Storybook for production
npm run build-storybook
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run size

# Why is my bundle so large?
npm run size:why
```

### Maintenance

```bash
# Clean build artifacts
npm run clean

# Reinstall dependencies
npm run reinstall
```

## Component Development Patterns

### shadcn/ui Component Usage

TerraFusion uses shadcn/ui component library pattern:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

Components are in `src/components/ui/` and use Radix UI primitives underneath.

### Custom Hooks

```tsx
// hooks/useBackendConnection.ts
export function useBackendConnection() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // SignalR connection logic
  }, []);

  return { connected };
}

// Usage
import { useBackendConnection } from '@/hooks/useBackendConnection';

function MyComponent() {
  const { connected } = useBackendConnection();
  return <div>{connected ? 'Connected' : 'Disconnected'}</div>;
}
```

### State Management

Three state management approaches coexist:

1. **Zustand** - Lightweight global state:
```tsx
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

2. **Redux Toolkit** - Complex application state:
```tsx
import { configureStore } from '@reduxjs/toolkit';
```

3. **TanStack Query** - Server state:
```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['properties'],
  queryFn: () => fetch('/api/properties').then(r => r.json()),
});
```

### Testing Patterns

```tsx
// button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Environment Configuration

### Environment Variables

```bash
# .env.development
VITE_API_URL=http://localhost:5000
VITE_PORT=3000
VITE_ENABLE_ANALYTICS=false
```

Access in code:

```tsx
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

### Build-time Constants

Defined in `vite.config.ts`:

```tsx
// Available globally
const version = __APP_VERSION__;  // From package.json
const apiUrl = __API_URL__;       // From VITE_API_URL
```

## Performance Optimization

### Code Splitting

Vite automatically splits chunks:

```typescript
// vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom', 'react-router-dom'],
      ui: ['@mui/material', '@mui/icons-material'],
      charts: ['recharts'],
      '3d': ['three'],
    },
  },
}
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### Bundle Size Limits

Configured in `.size-limit.js`:

```js
module.exports = [
  {
    path: 'dist/**/*.js',
    limit: '1000 KB',
  },
];
```

Check with: `npm run size`

## Design System

### TerraFusion Brand Colors

```css
/* Primary Brand Colors */
--terra-cyan: #00FFFF;           /* Quantum cyan accent */
--terra-midnight: #0A0E1A;       /* Deep background */
--terra-blue: #0080FF;           /* Primary blue */
--terra-slate: #1E293B;          /* UI slate */
--terra-accent: #00FFAA;         /* Success/accent */
--terra-transcend: #00FFEE;      /* Transcendent highlight */
```

### Typography

Uses system font stack with custom sizing:

```css
font-family: system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif;
```

### Spacing System

Tailwind spacing scale (4px base):

```tsx
<div className="p-4 m-8 space-y-6">  {/* 16px, 32px, 24px */}
```

## Government Compliance

### Accessibility (WCAG 2.1 AA)

All components must meet accessibility standards:

```tsx
// Good - proper ARIA labels
<button aria-label="Close dialog">X</button>

// Good - semantic HTML
<nav aria-label="Main navigation">

// Test with
npm run government:compliance
```

### Security Best Practices

1. **No inline scripts** - CSP compliant
2. **Sanitize user input** - Use proper escaping
3. **Secure API calls** - Always use HTTPS in production
4. **No sensitive data in localStorage** - Use secure session storage

Security linting:

```bash
npm run lint -- --rule 'security/*: error'
```

## Integration with Backend

### API Service Pattern

```tsx
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

export const propertyService = {
  getAll: () => api.get('/properties'),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: Property) => api.post('/properties', data),
};
```

### SignalR Hub Connection

```tsx
// hooks/useSignalR.ts
import * as signalR from '@microsoft/signalr';

export function useSignalR(hubUrl: string) {
  const [connection, setConnection] = useState<signalR.HubConnection>();

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => setConnection(newConnection))
      .catch(err => console.error('SignalR error:', err));

    return () => {
      newConnection.stop();
    };
  }, [hubUrl]);

  return connection;
}
```

## Electron Desktop Integration

### Main Process

Located in `electron/main.js`:

```js
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadURL('http://localhost:3000');  // Dev
  // win.loadFile('index.html');         // Production
}
```

### Running Electron

```bash
# Development with live reload
npm run electron:dev

# Production build
npm run electron:build
```

## Common Patterns to Avoid

1. **DON'T import from `/dist`** - Always import from source files
2. **DON'T use `any` type** - Use proper TypeScript types
3. **DON'T bypass ESLint** - Fix warnings, don't disable them
4. **DON'T use inline styles** - Use Tailwind classes or CSS modules
5. **DON'T forget accessibility** - All interactive elements need proper ARIA
6. **DON'T skip testing** - Write tests for new components
7. **DON'T hardcode API URLs** - Use environment variables

## Debugging

### Development Tools

```bash
# Vite dev server with HMR
npm run dev

# TypeScript errors
npm run type-check

# Bundle analysis
npm run build:analyze
```

### Browser DevTools

React DevTools and Redux DevTools are configured automatically in development.

### Vite Debug Mode

```bash
# Verbose logging
VITE_LOG_LEVEL=info npm run dev

# Clear cache and rebuild
npm run dev:clean
```

## PWA Configuration

Progressive Web App features via `vite-plugin-pwa`:

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'TerraFusion OS',
    short_name: 'TerraFusion',
    theme_color: '#0891b2',
  },
})
```

Service worker auto-updates on new builds.

## Git Hooks (Husky)

Pre-commit hooks run quality checks:

```bash
# .husky/pre-commit
npm run quality    # Lint + format check
npm test           # Run tests
```

Configured via `lint-staged`:

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

## Related Documentation

- `TESTING_GUIDE.md` - Comprehensive testing documentation
- `BUILD_SYSTEM_GUIDE.md` - Build system and optimization details
- `COMPONENT_COVERAGE_ANALYSIS.md` - Component architecture analysis
- `TERRAFUSION_DESIGN_SYSTEM_ENHANCEMENT.md` - Design system documentation
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting rules

## Quick Reference

### Adding a New Component

1. Create component in `src/components/[category]/ComponentName.tsx`
2. Add styles using Tailwind classes or CSS custom properties
3. Create test file `ComponentName.test.tsx`
4. Export from appropriate index file
5. Document props with TypeScript interfaces
6. Add Storybook story if needed

### Adding a New Page

1. Create page in `src/pages/PageName.tsx`
2. Add route in `src/routes/index.tsx` or `src/Router.tsx`
3. Add navigation link if needed
4. Add page-level tests
5. Ensure accessibility compliance

### Adding a New API Integration

1. Add service in `src/services/serviceName.ts`
2. Use axios instance with proper base URL
3. Add TypeScript types for request/response
4. Add error handling
5. Use TanStack Query for data fetching
6. Add integration tests

### Environment-Specific Config

- Development: `.env.development`
- Production: `.env.production`
- Example: `.env.example` (commit this, not actual .env files)

Access: `import.meta.env.VITE_VARIABLE_NAME`
