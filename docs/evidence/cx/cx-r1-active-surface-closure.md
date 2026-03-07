# CX R1 Active Surface Closure

Date: March 7, 2026
Lane: `cx`
Scope: active backend truth closure for Property Valuation, PILT, and runtime theater cleanup

## Implemented

### Property Valuation

- [PropertyValuationController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs)
  now has `[Authorize]`.
- The controller now resolves county context from claims and blocks requests when:
  - no county claims resolve
  - requested `CountyCode` does not match the authorized county
  - requested parcel does not exist in the authorized county scope
- Bulk valuation now rejects mixed-county batches and missing parcel scope.

### PILT

- [PiltController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PiltController.cs)
  no longer serves hardcoded fake-live payloads.
- The controller now has `[Authorize]` and returns explicit `501 Not Implemented`
  `ProblemDetails` with `scope=Post-R1`.
- This reclassifies PILT from fake runtime behavior to explicit deferred scope.

### Quantum Metrics Background Service

- [Program.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs)
  now gates `QuantumMetricsBackgroundService` behind:
  - config key: `Features:EnableQuantumMetricsBackgroundService`
  - env var: `TF_ENABLE_QUANTUM_METRICS_BACKGROUND_SERVICE`
- Default behavior is disabled unless explicitly enabled.

## Verification Targets

- [R1Week5CxR1ClosureTests.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5CxR1ClosureTests.cs)
- backend build
- targeted unit tests for controller auth/county gating and PILT disablement

## Remaining Truth

- This does not make PILT real. It makes PILT honest.
- This does not complete CC fake-path removal for the PILT UI fallback.
- This does not finalize cross-lane signoff or the branch-head evidence manifest.
