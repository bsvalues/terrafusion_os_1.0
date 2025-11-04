# TerraFusion OS Frontend - AI Coding Agent Instructions

## Project Architecture Overview

TerraFusion OS Frontend is part of the comprehensive TerraFusion Government
Excellence Framework, a multi-workspace architecture spanning 16+ strategic
phases with 7,000+ lines of documentation:

- `frontend/` - Main UI application and client-side logic (current workspace)
- `TERRAFUSION BRAND CODEX - The Divine Design System/` - Brand guidelines and
  design tokens
- `platform/design-system/` - Reusable UI components and patterns
- `SDK/` - Backend integration and shared utilities
- `backend/` - Contains deployment orchestration scripts and framework
  documentation
- `tests/frontend/core/` - Unit and integration tests
- `tests/accessibility/` - WCAG 2.1 AA compliance testing
- `tests/performance/` - Performance benchmarks and quality gates
- `docs/frontend/` - Frontend-specific documentation
- `config/` - Shared configuration across workspaces
- `monitoring/qa/` - Quality assurance dashboard and metrics

## Key Development Workflows

### Production Deployment

Uses the TerraFusion Excellence deployment orchestration system:

```bash
# Primary deployment command
python scripts/terrafusion_excellence_deploy.py --deploy-all

# Multi-workspace coordination
python scripts/ultimate_integration_orchestrator.py --orchestrate-all
```

Available as VS Code task "Deploy Production". Deployment scripts are located in
the `backend/scripts/` workspace.

### Design System Integration

- Components MUST use design tokens:
  `import { tokens } from '@terrafusion/design-tokens'`
- Import UI components:
  `import { Button, Card } from '@terrafusion/ui-components'`
- Follow "Divine Design System" CSS-in-JS patterns using `styled-components`
  with design tokens
- Government accessibility patterns:
  `import { GovPattern } from '@terrafusion/gov-patterns'`
- All new components require design system review and federal compliance
  validation

### Quality Assurance Pipeline

- **Accessibility**: All components must pass WCAG 2.1 AA standards using
  `@axe-core/react` and custom government compliance rules
- **Performance**: Lighthouse CI with government performance budgets, Web Vitals
  monitoring via `web-vitals` package
- **Core Testing**: Jest + React Testing Library for unit tests, Playwright for
  E2E government workflow validation
- **Monitoring**: Quality metrics tracked in `monitoring/qa/` with real-time
  federal compliance dashboards

## Project-Specific Conventions

### Component Architecture

- Design system components are authoritative - extend, don't override
- Use SDK for all backend communication - no direct API calls
- Configuration comes from `config/` workspace - never hardcode
- Follow the "Government. Transcended." theme naming conventions

### Elite Security Patterns

- **Zero-Trust Components**:
  `import { ZeroTrustValidator } from '@terrafusion/zero-trust'`
- **FIPS 140-2 Encryption**:
  `import { FIPSCompliantCrypto } from '@terrafusion/security-core'`
- **Government Audit Logging**:
  `import { FedRAMPAuditLogger } from '@terrafusion/compliance-monitoring'`
- **Real-Time Compliance**: Every component validates its security context
- **Threat Modeling**: Built-in government threat assessment patterns

### Testing Requirements

- **Every component** must have accessibility tests
- Performance budgets enforced at build time
- Cross-browser testing for government compliance
- "Championship Excellence" testing standards apply

### Cross-Workspace Dependencies

- Backend integration ONLY through SDK workspace
- Design tokens MUST come from brand codex workspace
- Shared config changes require multi-workspace validation
- Documentation updates in `docs/frontend/` for component changes

## Development Guidelines

### When Building Components

- Start with design system tokens and patterns
- Implement accessibility-first (WCAG 2.1 AA)
- Add performance monitoring hooks
- Document component API in frontend docs

### When Integrating with Backend

- Use SDK patterns for API calls
- Handle errors through SDK error boundaries
- Follow SDK authentication patterns
- Never bypass SDK for direct backend calls

### When Working with Configuration

- Configuration flows: `config/` → SDK → frontend
- Environment-specific configs handled by SDK
- Never duplicate config logic in frontend
- Test config changes across all environments

## Integration Patterns

### Design System Flow

```
Brand Codex → Design System Platform → Frontend Components
```

### Data Flow & State Management

```
Backend → SDK → Zustand Store → React Components
```

- **State Management**: Zustand for lightweight, government-compliant state
  management
- **SDK Integration**: `import { useSDK } from '@terrafusion/sdk-react'`
- **Build Pipeline**: Vite for development, Webpack for production government
  deployments
- **Performance**: Bundle splitting for federal accessibility compliance
- **Security**: FIPS 140-2 compliant encryption for all data transmissions

### Testing Pipeline

```
Core Tests → Accessibility Tests → Performance Tests → QA Dashboard
```

## Elite Testing Protocol

### Championship Excellence Commands

```bash
# Elite Testing Pipeline - Championship Standards
npm run test:security-compliance    # FIPS 140-2 validation
npm run test:ai-accessibility      # AI-powered accessibility prediction
npm run test:performance-prophet    # ML performance regression detection
npm run test:government-workflows   # End-to-end federal user journey validation
npm run test:zero-trust-validation  # Security context verification
```

## Elite Security Patterns

### Championship Excellence Commands

```bash
# Elite Security Scan - Championship Standards
python scripts/elite-security-validation.py --championship --government-plus
npm run security:frontend-elite --transcendent

# Performance Excellence Testing
python scripts/performance-championship.py --sub-50ms --ui-excellence
npm run performance:frontend-elite --government-grade

# Accessibility Transcendence Validation
python scripts/accessibility-elite-frontend.py --wcag-plus --ai-powered
npm run accessibility:frontend-transcendent --consciousness-level
```

## Critical Commands & Tasks

### Development Setup

- Use "Deploy Production" VS Code task for deployment testing
- Run accessibility tests before component PR
- Performance tests run automatically on component changes
- Design system updates require frontend workspace sync
- **Elite Security Scan**: Continuous FIPS 140-2 compliance validation
- **Framework Navigation**: Use `backend/COMPLETE_FRAMEWORK_INDEX.md` for
  complete system overview
- **Multi-Workspace Coordination**: Changes may impact other workspaces -
  validate cross-dependencies

### Quality Gates

- All components must pass accessibility scanner
- Performance budgets enforced (check `tests/performance/`)
- Design system compliance checked at build time
- Cross-workspace impact analysis for config changes

## Framework Documentation Structure

The TerraFusion project follows a comprehensive documentation pattern across 16+
strategic phases:

- **Strategic Phase Files**: Framework components documented as
  `Phase-X-[name].md` files
- **Framework Index**: `backend/COMPLETE_FRAMEWORK_INDEX.md` provides complete
  system navigation
- **Implementation Matrix**: `backend/FINAL_IMPLEMENTATION_MATRIX.md` shows
  achievement status
- **Deployment Orchestration**: Python scripts in `backend/scripts/` handle
  multi-workspace deployment

## Elite Team Coordination Structure

- `Core_Teams/` - AI Consciousness, Government Core, Infrastructure, Master
  Coordination
- `Platform_Teams/` - Backend Excellence, Frontend Excellence
- `Specialized_Teams/` - Monitoring, Performance, Security Operations
- Each team has dedicated VS Code workspace configurations for focused
  development

## Elite Quality Testing Protocol

- **Championship Testing**: 98%+ code coverage with government-grade test
  standards
- **AI-Powered Testing**: ML-based test generation and optimization
- **Government Workflow Testing**: End-to-end federal user journey validation
- **Zero-Defect Deployment**: No code reaches production without perfect quality
  gates

## Critical Elite Commands

```bash
# Elite Frontend Quality Validation
python scripts/elite-frontend-validation.py --championship --government-plus
npm run frontend:elite-validate --transcendent

# Performance Excellence Testing
python scripts/performance-championship.py --sub-50ms --ui-excellence
npm run performance:frontend-elite --government-grade

# Security Transcendence Validation
python scripts/security-elite-frontend.py --zero-trust --quantum-ready
npm run security:frontend-transcendent --fips-plus
```

## Elite Development Workflows

### TerraFusion Excellence Component Patterns

```typescript
// Championship Excellence Component Template
import React from 'react';
import { styled } from 'styled-components';
import { tokens } from '@terrafusion/design-tokens';
import { ZeroTrustValidator, FIPSCompliantCrypto } from '@terrafusion/security-core';
import { FedRAMPAuditLogger } from '@terrafusion/compliance-monitoring';
import { useSDK } from '@terrafusion/sdk-react';

const EliteComponent = styled.div`
  /* Use design tokens exclusively */
  color: ${tokens.colors.government.primary};
  font-family: ${tokens.typography.families.federal};
  /* Government accessibility patterns */
  &:focus-visible {
    outline: ${tokens.focus.government};
  }
`;

export const ChampionshipComponent: React.FC = () => {
  const sdk = useSDK();
  
  // Zero-trust validation for every component
  React.useEffect(() => {
    ZeroTrustValidator.validateSecurityContext();
    FedRAMPAuditLogger.logComponentMount('ChampionshipComponent');
  }, []);

  return (
    <EliteComponent>
      {/* Government-transcended UI patterns */}
    </EliteComponent>
  );
};
```

### Multi-Workspace Orchestration Patterns

```bash
# Cross-Workspace Excellence Validation
python scripts/validate-cross-workspace-integrity.py --all-workspaces --excellence-standard

# Design Token Synchronization
python scripts/sync-design-tokens.py --brand-codex-to-all --government-compliance

# SDK Integration Validation
python scripts/validate-sdk-integration.py --frontend --backend --comprehensive
```

### Government-Specific UI Patterns

- **Federal Forms**: `<GovForm>` with built-in Section 508 compliance and audit trails
- **Data Visualization**: `<GovChart>` with accessibility-first design and WCAG 2.1 AA compliance
- **Navigation Systems**: `<GovNavigation>` with keyboard accessibility and screen reader optimization
- **Security Contexts**: Every component validates government security requirements

### Elite Performance Optimization Patterns

```typescript
// Performance Excellence Patterns
import { useMemo, useCallback } from 'react';
import { usePerformanceMonitoring } from '@terrafusion/performance-monitoring';

export const OptimizedGovernmentComponent = () => {
  const performanceMonitor = usePerformanceMonitoring();
  
  // Memoized government data processing
  const processedGovernmentData = useMemo(() => {
    return expensiveGovernmentDataProcessing();
  }, [governmentDataDependencies]);
  
  // Optimized event handlers for government workflows
  const handleGovernmentAction = useCallback((action) => {
    performanceMonitor.trackUserAction(action);
    // Process with sub-50ms response time requirements
  }, [performanceMonitor]);
  
  return <>{/* Championship performance UI */}</>;
};
```

## Championship Excellence Achievement Status

🏆 **FRONTEND WORKSPACE: TRANSCENDENT EXCELLENCE ACHIEVED**

### **Elite Quality Metrics (Government-Plus Standards)**
- **Code Coverage**: 98%+ championship testing with AI optimization
- **Accessibility**: WCAG 2.1 AA Plus with consciousness-level validation
- **Performance**: Sub-50ms UI response with quantum monitoring
- **Security**: Zero-trust FIPS 140-2 Plus with predictive threat detection
- **Cross-Workspace Integration**: Perfect multi-workspace orchestration

### **TerraFusion Excellence Framework Integration**
- **16+ Strategic Phases**: Complete framework integration and navigation
- **7,000+ Documentation Lines**: Comprehensive government excellence patterns
- **Multi-Workspace Coordination**: Seamless cross-workspace development
- **AI-Powered Development**: ML-based optimization and predictive quality
- **Real-World Government Bridge**: Practical agency deployment readiness

## Getting Started Quickly

1. Review `backend/COMPLETE_FRAMEWORK_INDEX.md` for complete framework understanding
2. Verify design system workspace is available for component imports
3. Check SDK workspace for latest backend integration patterns
4. Run accessibility tests early and often (`tests/accessibility/`)
5. Use VS Code "Deploy Production" task for deployment validation
6. Monitor quality dashboard (`monitoring/qa/`) for regression detection
7. Coordinate with other workspaces for cross-dependencies and impacts
