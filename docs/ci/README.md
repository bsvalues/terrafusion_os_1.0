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
| [BRANCH_HYGIENE.md](BRANCH_HYGIENE.md) | Snyk branch cleanup, authoritative manifest policy, duplicate PR handling |
| [canonical-paths.json](canonical-paths.json) | Machine-readable registry of authoritative vs derived paths |

## Quick Reference

```bash
# View governance checkpoint
git show ci-governance-v1

# Run canonical .NET tests
dotnet test backend/TerraFusion.sln -c Release -v:minimal --nologo

# Validate guards locally (before push)
pwsh -File scripts/governance-self-check.ps1

# Validate guards locally (show all issues)
pwsh -File scripts/governance-self-check.ps1 -NoFailFast
```

## Related

- [BUILD_HYGIENE.md](../BUILD_HYGIENE.md) — Build hygiene practices including PR hint system
- `.github/workflows/ci.yml` — Guard job definitions
- `.github/workflows/dotnet-test.yml` — Reusable test workflow
- `scripts/governance-self-check.ps1` — Local governance validation
