# CLAUDE-frontend.md

Frontend development guidance for Terrafusion OS 1.0 React 18 application with complete PWA shell and brand integration.

## Current Frontend Architecture - PRODUCTION READY

### Tech Stack
- **React 18** with TypeScript 5.0
- **Vite** for build tooling and dev server
- **PWA Shell** with complete module loading system
- **WebView2** for desktop OS integration
- **Three.js** for 3D visualizations and WebGL effects
- **Brand Asset Components** - All 14 modules integrated

### Project Structure
```
frontend/
├── src/
│   ├── components/          # React components (COMPLETE)
│   │   ├── BrandKit.tsx            # Complete brand kit component
│   │   ├── GovernmentArchitecture.tsx  # Championship architecture
│   │   ├── ABTestingFramework.tsx      # County A/B testing
│   │   ├── ApplicationLauncher.tsx     # Real app launcher (14 modules)
│   │   ├── WebGLTranscendence.tsx      # 7 WebGL effects
│   │   ├── PWAShell.tsx               # Progressive web app shell
│   │   ├── CountiesHub.tsx            # WA counties integration
│   │   ├── StrategyDashboard.tsx      # Strategic messaging
│   │   └── Marketplace.tsx            # Module marketplace
│   ├── App.tsx             # Main app with hero sections
│   ├── pages/              # Page-level components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   └── assets/             # Static assets
├── electron/               # Electron main process
├── public/                 # Public assets
└── components-enhanced/    # Shared UI components
```

### COMPLETED BRAND INTEGRATION 

**All 14 Official Terrafusion Brand Assets Implemented:**
1. **BrandKit** - Complete brand guidelines and design system
2. **GovernmentArchitecture** - Championship deployment framework
3. **ABTestingFramework** - County-specific variant testing
4. **ApplicationLauncher** - Real 14-module application launcher
5. **WebGLTranscendence** - 7 advanced WebGL effects
6. **PWAShell** - Progressive web app with module loading
7. **CountiesHub** - Washington counties integration
8. **StrategyDashboard** - Strategic messaging and metrics
9. **Marketplace** - Module marketplace and installation
10. **Hero Sections** - Multiple branded landing pages
11. **Desktop OS Shell** - WebView2 native integration
12. **Brand Colors** - Official Terrafusion color palette
13. **Typography** - Complete font and styling system
14. **Animations** - Glass morphism and particle effects

#### Build & Deploy
```bash
# Frontend build (React/TypeScript)
npm run frontend:build

# Electron desktop build
cd frontend && npm run electron:build

# Windows installer build
npm run deploy:windows
```

#### Code Quality
```bash
# Lint frontend code
npm run lint

# Format code with Prettier
npm run format
```

## Key Frontend Configuration

### Configuration Files
- `frontend/package.json`: React dependencies and scripts
- `frontend/vite.config.ts`: Vite build configuration
- `frontend/tsconfig.json`: TypeScript compiler settings
- `frontend/electron/main.js`: Electron main process

### Component Structure
- React components in `frontend/src/` with TypeScript
- Shared UI components in `frontend/components-enhanced/`
- Module-specific components within each module directory
- Material-UI theme customization in App.tsx

## Development Patterns

### Component Organization
- Follow domain-driven design for component structure
- Use TypeScript interfaces for type safety
- Implement Material-UI components with custom theming
- Apply React.memo and useMemo for expensive operations

### State Management
- Shared state through Redux/Zustand
- Real-time updates via SignalR
- Inter-module messaging via event bus

### Performance Optimization
- Use React.memo and useMemo for expensive operations
- Optimize bundle sizes with Vite
- Implement code splitting for module loading
- PWA caching for offline functionality

## Module System Integration

### Frontend Module Development
- Module-specific components in each module directory
- Follow Tauri patterns for native modules
- Material-UI integration for consistent UX
- Hot-swappable module architecture

### Module Communication
- Inter-module messaging via event bus
- Shared state through Redux/Zustand
- Real-time updates via SignalR

## Electron Integration

### Desktop Application
- Electron wrapper for native desktop experience
- Main process configuration in `frontend/electron/main.js`
- Native OS integration capabilities
- Cross-platform desktop deployment

### Native Features
- File system access
- Native notifications
- System tray integration
- Auto-updater functionality

## Testing Strategy

### Frontend Testing
```bash
# Frontend tests (Jest)
npm run frontend:test

# End-to-end tests (Playwright)
cd frontend && npm run test:e2e
```

### Testing Patterns
- Unit tests for all React components
- Integration tests for component interactions
- E2E tests with Playwright for critical workflows
- Accessibility testing compliance

## Development Environment

### Local Setup
- Uses Vite dev server on port 3000
- Hot module replacement for rapid development
- TypeScript compilation with strict mode
- ESLint and Prettier for code quality

### Debugging
- Use browser dev tools for frontend profiling
- React Developer Tools for component debugging
- Vite debugging for build issues
- Electron debugging for desktop issues

## Troubleshooting

### Common Frontend Issues
- **Build Failures**: Check Node.js version (18+) and dependencies
- **TypeScript Errors**: Verify TypeScript configuration and types
- **Electron Issues**: Clear cache and rebuild native modules
- **Component Rendering**: Check React hooks usage and state management

### Performance Debugging
- Use React Profiler for component performance
- Vite bundle analyzer for bundle optimization
- Browser performance tools for runtime analysis
- Memory leak detection with React DevTools

## Module-Specific Frontend Components

### Government Module UI Components
- 32 specialized government applications in `modules/` directory
- Each module has dedicated frontend components
- Consistent Material-UI theming across modules
- Responsive design for mobile and desktop

### Tauri-Enhanced Modules
- Several modules use Rust+Tauri for native performance
- TypeScript interfaces for Rust backend communication
- Native system integration through Tauri APIs
- Cross-platform compatibility

## Security Considerations

### Frontend Security
- JWT token handling with secure storage
- XSS prevention with proper data sanitization
- CSRF protection for form submissions
- Content Security Policy implementation

### Government Compliance
- Section 508 accessibility compliance
- FISMA security standards adherence
- Government UI/UX guidelines following
- Audit logging for user interactions