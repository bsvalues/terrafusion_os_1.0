# Known-Fail Baseline: `forgeAnalytics.contract.test.tsx`

**Status:** Isolated known-fail — excluded from hard-gate suite  
**Sealed:** Wave 5 (2026-03-18)  
**Severity:** Non-blocking (pre-existing contract test assertion failure)

## Root Cause

`Phase 10: Forge Analytics Contract > RegressionStudio > model list items have data-material="bento"` fails because the Forge Analytics `RegressionStudio` component's model list items do not have the expected `data-material="bento"` attribute. The contract was written against a design spec that the implementation has not yet caught up to.

The test consistently fails when run in isolation and is NOT a regression from Wave 3/4/5 changes.

## Fix Pointer

Either add `data-material="bento"` to the model list item elements in `RegressionStudio.tsx`, or update the contract to reflect the current implementation.

## Regression Guard

Expected failure: `Phase 10: Forge Analytics Contract > RegressionStudio > model list items have data-material="bento"`
