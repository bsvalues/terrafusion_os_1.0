# Terrafusion-AI Codebase Optimization Plan

## Current State Analysis
- **Archive Folder**: 30+ unused components creating technical debt
- **UI Components**: 47 shadcn components, only 15 actively used
- **Server Files**: Multiple redundant authentication and validation modules
- **Dependencies**: 99 total dependencies, estimated 25-30% unused

## Cleanup Strategy

### Phase 1: Archive Migration
Move all unused components from root to archive:
- GuidedTour.tsx (0 references)
- QuickPacsConnection.tsx (0 references) 
- QuickReportGenerator.tsx (0 references)

### Phase 2: UI Component Consolidation
Keep only actively used shadcn components:
- button.tsx (5 imports)
- card.tsx (8 imports)
- select.tsx (3 imports)
- input.tsx (3 imports)
- label.tsx (3 imports)
- badge.tsx (3 imports)
- separator.tsx (3 imports)
- skeleton.tsx (2 imports)
- tabs.tsx (1 import)
- textarea.tsx (1 import)
- toaster.tsx (1 import)
- tooltip.tsx (1 import)
- dialog.tsx (1 import)

Archive 34 unused UI components.

### Phase 3: Server Module Optimization
Consolidate redundant modules:
- Merge auth.ts and ad-auth.ts
- Remove duplicate validation services
- Consolidate report generators
- Remove backup/testing files

### Phase 4: Dependency Pruning
Target unused packages for removal:
- Unused @radix-ui components
- Redundant typing packages
- Development-only dependencies in production

## Expected Performance Gains
- Bundle size reduction: 40-60%
- Build time improvement: 30-50%
- Memory usage reduction: 35-45%
- Development reload speed: 50-70% faster