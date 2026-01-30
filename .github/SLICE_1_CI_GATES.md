# Slice 1: CI/Gates

## Scope

This slice contains all CI workflow and gate infrastructure from Phase 4B.

## Files Included

```
.github/workflows/seal-gate-fast.yml      # SEAL Gate - the ONE required check
.github/workflows/manifest-contract-guard.yml  # Manifest validation
.github/workflows/spec-gates.yml          # Specification gates
tools/spec-gates/**                       # Gate tooling
scripts/spec-gates/**                     # Gate scripts  
tools/registry/**                         # Tool registry
```

## Key Changes

1. **SEAL Gate Pattern**: Classify → Frontend/Backend/Governance → SEAL
2. **Fast-path classification**: Docs-only changes skip heavy gates
3. **actions/cache v4**: Fixed deprecated SHA → `@v4` tag
4. **Target**: 3-8 minutes max for full SEAL pass

## Invariants

- No `dotnet test` outside allowed workflows (drift guard)
- Workspace must not include quarantined packages
- Solution file must exist at `backend/TerraFusion.sln`

## Related Slices

- Slice 2: Policy contracts (schemas consumed by gates)
- Slice 3: Backend telemetry (API validated by backend gate)

---

*Slice 1 - CI/Gates - Phase 4B*
