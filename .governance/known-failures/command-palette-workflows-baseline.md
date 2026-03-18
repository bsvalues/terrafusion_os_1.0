# Known-Fail Baseline: `command-palette-workflows.integration.test.tsx`

**Status:** Isolated known-fail — excluded from hard-gate suite  
**Sealed:** Wave 5 (2026-03-18)  
**Severity:** Non-blocking (pre-existing integration test environment limitation)

## Root Cause

`Integration: Basic Command Palette Workflow > Component Integration > should render command input` fails because the command palette component has a dependency that does not resolve in the jsdom integration test environment. The component likely depends on a global keyboard listener or portal that isn't initialized in the test setup.

The test consistently fails when run in isolation and is NOT a regression from Wave 3/4/5 changes.

## Fix Pointer

Add the missing global setup (keyboard listener mock or portal container) to the test's `beforeEach` block.

## Regression Guard

Expected failure: `Integration: Basic Command Palette Workflow > Component Integration > should render command input`
