# CI Governance

This directory contains CI governance documentation for TerraFusion OS.

## Governance Checkpoints

| Tag | Date | Scope |
|-----|------|-------|
| `ci-governance-v1` | January 2026 | Canonical .NET tests, drift guards, single-sourced PR hints |

## Documents

| Document | Purpose |
|----------|---------|
| [CANONICAL_DOTNET_TESTING.md](CANONICAL_DOTNET_TESTING.md) | Canonical test command, workflows, drift guards, single-source locations |

## Quick Reference

```bash
# View governance checkpoint
git show ci-governance-v1

# Run canonical .NET tests
dotnet test backend/TerraFusion.sln -c Release -v:minimal --nologo

# Validate guards locally
grep -rn "dotnet test" .github/workflows/ --include="*.yml" | grep -v "dotnet-test.yml"
```

## Related

- [BUILD_HYGIENE.md](../BUILD_HYGIENE.md) — Build hygiene practices including PR hint system
- `.github/workflows/ci.yml` — Guard job definitions
- `.github/workflows/dotnet-test.yml` — Reusable test workflow
