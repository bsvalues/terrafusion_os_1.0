# TerraFusion Quantum Governance Platform - AI Coding Agent Instructions

## Overview
TerraFusion is an advanced quantum governance platform featuring sophisticated React 18 PWA frontend with Electron shell, quantum-themed UI components, and AI-driven functionality. The system provides comprehensive government administration capabilities with a cutting-edge design system and modular architecture.

**Multi-Workspace Context**: This frontend integrates with .NET 8 backend microservices, Kubernetes infrastructure, and comprehensive SDK. Backend services run on ports 5000 (API), 3002 (Gateway), 3004 (Consciousness).

## Architecture

### Core Structure
- **Frontend** (`frontend/`): React 18 + Vite + TypeScript + TerraFusion Design System
- **Platform** (`platform/design-system/`): TerraFusion Quantum UI components
- **SDK** (`SDK/`): Production-ready developer kit with boilerplate, configs, and tools
- **Tests** (`tests/frontend/core/`): Comprehensive testing infrastructure
- **Docs** (`docs/frontend/`): Frontend documentation

### TerraFusion Design System
Revolutionary quantum-themed design system with:
- **Terra-Cyan Primary** (#00FFFF): The consciousness color for interactive elements
- **Terra-Midnight Background** (#0A0E1A): The void for sophisticated dark interfaces
- **Golden Ratio Typography**: φ-scaled type system (1.618) for mathematical harmony
- **Base-8 Spacing**: Consistent 8px-based spacing for perfect alignment
- **Glassmorphic Components**: Advanced backdrop-filter effects with terra-cyan luminescence
- **Quantum Animations**: Pulse, shimmer, and orbital effects for engaging interactions

### Plugin System
Located in `src/plugins/`, each plugin follows this structure:
```
plugins/
├── cama-core/          # Computer Assisted Mass Appraisal
├── gis-core/           # Geographic Information Systems
├── harris-pacs/        # Harris PACS integration
├── levy-core/          # Tax levy management
├── valuation-tools/    # Property valuation
└── costforge-ai/       # AI-powered cost estimation
```

Each plugin requires:
- `manifest.json` with name, version, permissions, targetCounties
- `index.tsx` as entry point
- County-specific targeting and legacy system integration

### Shell Architecture
The OS shell (`src/shell/`) provides:
- `DesktopShell.tsx`: Quantum-themed OS interface with system tray and module launcher
- `WindowManager.tsx`: Multi-window management with glassmorphic effects
- `ModuleLauncher.tsx`: Dynamic module loading with quantum transitions
- `SystemTray.tsx`: System status with terra-cyan glow notifications

## Development Workflows

### Essential Commands
```bash
# Frontend development
npm run dev                    # Start dev server with hot reload
npm run build                  # Production build
npm run electron              # Run Electron app with quantum UI
npm run test:unit             # Unit tests
npm run test:integration      # Integration tests
npm run quality              # Lint + format check
npm run government:compliance # Security/accessibility checks

# Cross-workspace integration (requires backend)
# Backend API: cd ../backend && dotnet run --project TerraFusion.API
# Frontend proxies to localhost:5000 for API calls
# Full system: Use VS Code task "🔧 Full System Build"

# SDK operations (from ../SDK/)
./scripts/create-module.sh --name="module-name" --type="government"
./scripts/dev-setup.sh
./scripts/test-integration.sh
```

### Build System
- **Vite** for fast development with HMR
- **TypeScript** in bundler mode with quantum governance paths (`@/quantum/*`, `@/terrafusion/*`)
- **Jest** for unit testing with jsdom environment
- **Playwright** for E2E testing
- **ESLint + Prettier** with pre-commit hooks via husky

## TerraFusion Design System Usage

### Core Components
```typescript
import {
  Button, Card, CardHeader, CardBody, Input, Badge, Avatar,
  Progress, Divider, TerraSphere
} from '@/components/terrafusion-design-system';

// Quantum Button with pulse effect
<Button variant="quantum" pulse glow>
  Execute Quantum Protocol
</Button>

// Glassmorphic Card with terra-cyan glow
<Card variant="glass" glow>
  <CardHeader>
    <TerraSphere size="lg" variant="quantum" />
    <h2>Quantum Interface</h2>
  </CardHeader>
  <CardBody>
    Content with glassmorphic background
  </CardBody>
</Card>

// Terra-cyan input with glow effect
<Input
  label="Quantum Input"
  glow
  placeholder="Enter quantum parameters..."
/>
```

### Design Tokens
```css
/* Core Colors */
--terra-cyan: #00FFFF;        /* Primary consciousness */
--terra-midnight: #0A0E1A;    /* Background void */
--terra-blue: #0080FF;        /* Secondary network */
--terra-slate: #1E293B;       /* Surface foundation */

/* Typography (Golden Ratio) */
--text-base: 1rem;            /* 16px */
--text-lg: 1.236rem;          /* φ × base */
--text-xl: 1.618rem;          /* φ² × base */
--text-2xl: 2rem;             /* φ³ × base */

/* Spacing (Base-8) */
--space-2: 0.5rem;            /* 8px */
--space-4: 1rem;              /* 16px */
--space-6: 1.5rem;            /* 24px */
--space-8: 2rem;              /* 32px */
--space-golden: 1.618rem;     /* Golden ratio spacing */

/* Effects */
--shadow-glow: 0 0 40px rgba(0, 255, 255, 0.4);
--shadow-quantum: 0 0 20px rgba(0, 255, 255, 0.3);
--glass-bg: rgba(30, 41, 59, 0.3);
--glass-border: rgba(0, 255, 255, 0.2);
```

### Component Variants
- **Primary**: Terra-cyan gradient buttons and accents
- **Quantum**: Animated multi-color gradients with quantum flow
- **Glass**: Glassmorphic backgrounds with backdrop blur
- **Glow**: Terra-cyan luminescence effects
- **Pulse**: Quantum pulse animations for interactive elements

## Testing Patterns
- **Unit Tests**: `src/**/*.{test,spec}.{ts,tsx}` with jest + @testing-library
- **Component Tests**: TerraFusion design system component testing
- **Visual Tests**: Quantum animation and glassmorphic effect validation
- **Integration Tests**: Plugin integration testing with timing metrics
- **Coverage**: Collect from `src/**/*.{ts,tsx}` excluding stories/mocks

## Government Compliance
- **Security**: eslint-plugin-security rules enforced
- **Accessibility**: WCAG 2.1 AA compliance with quantum UI considerations
- **Performance**: Bundle analysis with quantum component optimization
- **Documentation**: Comprehensive Storybook with TerraFusion components

## Key Patterns

### Plugin Development
```typescript
// Plugin manifest.json structure
{
  "name": "plugin-name",
  "version": "1.0.0",
  "targetCounties": ["county-name"],
  "legacySystems": ["LEGACY_SYSTEM"],
  "permissions": ["load:plugin-name"],
  "entryPoint": "index.tsx"
}
```

### Quantum State Management
```typescript
import { useModules } from '../hooks/useModules';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { TerraFusionTheme } from '@/components/terrafusion-design-system';

// Module management with React Query + TerraFusion theming
const { modules, loadModule } = useModules();
const { systemHealth } = useSystemHealth(); // 5-second polling

// Terra-themed module states: active | inactive | loading | error
await loadModule(moduleId); // Launches with quantum transitions
```

### Component Architecture
```typescript
// TerraFusion design system pattern
import { cn } from '@/lib/utils';
import { TerraFusionTheme } from '@/components/terrafusion-design-system';

const className = cn(
  "terra-glass",
  "quantum-pulse",
  condition && "terra-glow"
);

// Quantum-themed styling with design tokens
const styles = {
  background: TerraFusionTheme.colors.background,
  color: TerraFusionTheme.colors.primary,
  borderRadius: TerraFusionTheme.radius.lg,
};
```

### TerraSphere Logo Integration
```typescript
import { TerraSphere } from '@/components/terrafusion-design-system';

// Animated quantum logo with size variants
<TerraSphere
  size="lg"           // sm | md | lg | xl
  variant="quantum"   // glow | pulse | quantum | static
  className="navigation-logo"
/>
```

### Quantum Animation Patterns
```typescript
// CSS classes for quantum effects
<div className="quantum-pulse terra-glow">
  <div className="terra-gradient-quantum">
    Quantum Interface Element
  </div>
</div>

// Glassmorphic components
<div className="terra-glass hover-quantum">
  Advanced Government Interface
</div>
```

### Plugin Integration Workflow
1. **Validate** manifest.json with proper targetCounties and permissions
2. **Load** via ModuleLauncher with quantum transition effects
3. **Mount** component with TerraFusion design system integration
4. **Test** API integration with quantum UI feedback
5. **Performance** timing thresholds optimized for quantum animations

### Electron Integration
```bash
# Development mode with quantum UI
npm run electron:dev  # Starts Vite + Electron with TerraFusion theme
npm run electron      # Production Electron app with quantum governance

# Entry point: electron/main.js
# PWA manifest: public/manifest.json
```

## File Organization
- **Path Aliases**: `@/`, `@components/`, `@hooks/`, `@utils/`, `@ui/`, `@quantum/`, `@terrafusion/`
- **Design System**: `src/components/terrafusion-design-system.ts` - Main export
- **Styles**: `src/styles/terrafusion-tokens.css` - Design tokens
- **Components**: `src/components/ui/` - TerraFusion UI components
- **Brand**: `src/components/brand/` - TerraSphere and brand elements
- **Hooks**: Quantum state management hooks
- **Utils**: `cn()` utility for TerraFusion class merging

## Development Standards
- **Pre-commit**: Husky runs `npm run quality` (lint + format check)
- **TypeScript**: Bundler mode, quantum governance paths, strict disabled for rapid development
- **Testing**: Comprehensive testing with TerraFusion component validation
- **Performance**: Bundle analysis with quantum animation optimization
- **Compliance**: `npm run government:compliance` for security + a11y validation
- **Design System**: TerraFusion components with quantum theming and government-grade accessibility

## Quantum Governance Principles
- **Terra-cyan (#00FFFF)** as primary consciousness color for all interactive elements
- **Golden ratio (φ = 1.618)** typography scaling for mathematical harmony
- **Base-8 spacing system** for consistent alignment and rhythm
- **Glassmorphic effects** with backdrop-filter for sophisticated depth
- **Quantum animations** that enhance rather than distract from functionality
- **Government-grade accessibility** maintaining WCAG 2.1 AA compliance
- **Performance-first** approach ensuring smooth 60fps animations
