# TerraFusion Component Architecture

## Component Organization Structure

This document defines the clear separation between **core components** and **module components** in the TerraFusion OS frontend.

## Directory Structure

```
src/
├── components/                    # CORE COMPONENTS (System-wide)
│   ├── ui/                       # Base UI components (buttons, inputs, cards)
│   ├── layout/                   # Layout components (header, sidebar, footer)
│   ├── navigation/               # Navigation components (nav, breadcrumbs, tabs)
│   ├── forms/                    # Form components (inputs, selects, checkboxes)
│   ├── feedback/                 # Feedback components (alerts, toasts, modals)
│   ├── data-display/             # Data display (tables, lists, cards)
│   └── brand/                    # TerraFusion brand components (logo, sphere)
│
├── modules/                       # MODULE COMPONENTS (Feature-specific)
│   ├── property-assessment/      # Property assessment module
│   ├── levy-management/          # Tax levy module
│   ├── gis-integration/          # GIS module
│   ├── permit-processing/        # Permit module
│   └── analytics-dashboard/      # Analytics module
│
└── components-enhanced/           # LEGACY (Being phased out)
    └── ...                       # Old component structure
```

## Core Components

**Purpose**: Reusable, system-wide components that provide consistent UI/UX across all modules.

**Characteristics**:
- **No business logic** - Pure presentation components
- **Highly reusable** - Used across multiple modules
- **Well-documented** - Comprehensive Storybook stories
- **Fully tested** - Unit tests with 90%+ coverage
- **Accessible** - WCAG 2.1 AA compliant
- **Design system aligned** - Uses TerraFusion design tokens

**Examples**:
```typescript
// Core Button Component
import { Button } from '@/components/ui/Button';

<Button variant="quantum" pulse glow onClick={handleClick}>
  Execute Quantum Protocol
</Button>
```

## Module Components

**Purpose**: Feature-specific components that implement business logic and domain workflows.

**Characteristics**:
- **Business logic included** - Domain-specific functionality
- **Module-scoped** - Used within specific feature areas
- **Composed of core components** - Built using core UI primitives
- **Feature-focused** - Implements specific user workflows
- **County-aware** - Respects multi-tenant county isolation

**Examples**:
```typescript
// Module-specific Property Assessment Component
import { PropertyValuationForm } from '@/modules/property-assessment/PropertyValuationForm';

<PropertyValuationForm
  countyId="benton"
  propertyId="12345"
  onComplete={handleValuationComplete}
/>
```

## Component Loading System

### Dynamic Module Loading

TerraFusion uses **dynamic imports** for module components to enable code splitting and lazy loading:

```typescript
// src/lib/module-loader.ts
import { lazy, ComponentType } from 'react';

export interface ModuleManifest {
  name: string;
  version: string;
  entryPoint: string;
  dependencies: string[];
  targetCounties: string[];
}

export class ModuleLoader {
  private static loadedModules = new Map<string, ComponentType<any>>();

  static async loadModule(moduleName: string): Promise<ComponentType<any>> {
    // Check cache first
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName)!;
    }

    // Dynamically import module
    const module = await import(`@/modules/${moduleName}`);
    const Component = module.default;

    // Cache loaded module
    this.loadedModules.set(moduleName, Component);

    return Component;
  }

  static async loadModuleWithSuspense(moduleName: string) {
    return lazy(() => import(`@/modules/${moduleName}`));
  }
}
```

### Usage Example

```typescript
import { Suspense } from 'react';
import { ModuleLoader } from '@/lib/module-loader';

// Lazy load module component
const PropertyAssessmentModule = ModuleLoader.loadModuleWithSuspense('property-assessment');

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PropertyAssessmentModule countyId="benton" />
    </Suspense>
  );
}
```

## Testing Module Loading

```typescript
// tests/module-loader.test.ts
import { describe, it, expect } from 'vitest';
import { ModuleLoader } from '@/lib/module-loader';

describe('ModuleLoader', () => {
  it('should load module dynamically', async () => {
    const module = await ModuleLoader.loadModule('property-assessment');
    expect(module).toBeDefined();
    expect(typeof module).toBe('function');
  });

  it('should cache loaded modules', async () => {
    const module1 = await ModuleLoader.loadModule('property-assessment');
    const module2 = await ModuleLoader.loadModule('property-assessment');
    expect(module1).toBe(module2); // Same reference = cached
  });

  it('should handle module loading errors gracefully', async () => {
    await expect(ModuleLoader.loadModule('non-existent-module')).rejects.toThrow();
  });
});
```

## Component Guidelines

### Core Component Requirements

1. **TypeScript**: All components must be fully typed
2. **Props Interface**: Export clear props interface
3. **Documentation**: JSDoc comments for all props
4. **Storybook**: Create story for each component variant
5. **Tests**: Unit tests covering all functionality
6. **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Module Component Requirements

1. **Core Composition**: Build using core components
2. **County Isolation**: Respect tenant boundaries
3. **API Integration**: Use typed API service layer
4. **Error Handling**: Comprehensive error boundaries
5. **Loading States**: Skeleton screens for async operations

## Migration from components-enhanced/

**Status**: In progress
**Target**: Q1 2025
**Strategy**: Incremental migration with backward compatibility

1. Identify components in `components-enhanced/`
2. Classify as core or module component
3. Refactor to follow new structure
4. Create tests and Storybook stories
5. Update imports across codebase
6. Remove from `components-enhanced/`

## Exit Criteria

- ✅ Clear separation between core and module components
- ✅ Dynamic module loading system implemented
- ✅ Module loading tested with unit tests
- ✅ All new components follow architecture guidelines
- ✅ Migration plan from components-enhanced/ documented
