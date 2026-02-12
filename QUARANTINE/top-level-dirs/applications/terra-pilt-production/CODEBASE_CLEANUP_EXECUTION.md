# Codebase Cleanup Execution Plan

## Phase 1: Remove Unused Server Files
- Delete optimized-index.ts (has TypeScript errors and is unused)
- Remove simplified-auth.ts (auth errors)
- Clean up report-engine.ts (TypeScript parameter errors)
- Remove unused PDF generation routes

## Phase 2: Fix Core Application
- Fix React Fragment warning in SpectacularReportGenerator
- Update TypeScript configurations
- Remove unused dependencies

## Phase 3: Optimize File Structure
- Consolidate duplicate functionality
- Remove archive folder from production
- Clean up attached_assets for deployment

## Phase 4: Production Readiness
- Fix all LSP errors
- Ensure proper error handling
- Optimize build configuration