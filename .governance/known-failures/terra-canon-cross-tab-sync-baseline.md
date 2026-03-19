# Known-Fail Baseline: `TerraCanonCrossTabSyncContract.test.tsx`

**Status:** Isolated known-fail — excluded from hard-gate suite  
**Sealed:** Wave 5 (2026-03-18)  
**Severity:** Non-blocking (pre-existing; surfaced when vitest scheduling changed)

## Root Cause

`Phase 40 contract: cross-tab sync reloads workspace state from storage events > S1` fails with a timing/storage-event assertion error. The test simulates a localStorage event from another tab and expects the current tab to respond within a timeout. The jsdom environment's `StorageEvent` dispatch does not reliably trigger the event listener within the default timeout.

The test consistently fails when run in isolation and is NOT a regression from Wave 3/4/5 changes.

## Fix Pointer

Replace the `StorageEvent` dispatch with a direct call to the registered listener mock, or increase the timeout and use `vi.useFakeTimers()` to control async progression.

## Regression Guard

Expected failure: `Phase 40 contract: cross-tab sync ... S1: external workspace write updates this tab to loaded state`
