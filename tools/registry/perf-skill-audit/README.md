# @terrafusion/perf-skill-audit

**Phase 4G: Informational Performance Audit Lane**

A deterministic, fast, read-only scanner that identifies performance anti-patterns based on Vercel React Best Practices.

## Key Properties

- **Informational Only**: Never blocks merges, never touches SEAL
- **Cancel-Safe**: Concurrency with cancel-in-progress
- **Deterministic**: Pinned rule snapshots for auditability
- **Zero Queue Pressure**: No PR triggers, only schedule + manual dispatch

## Usage

```bash
# Run manual audit
pnpm -C tools/registry/perf-skill-audit audit

# Run tests
pnpm -C tools/registry/perf-skill-audit test
```

## Outputs

After running, check `out/` directory:

- `perf-audit-report.md` - Human-readable findings
- `perf-audit-report.json` - Machine-readable for automation

## Scanners

| Scanner | Severity | What it detects |
|---------|----------|-----------------|
| `waterfalls.ts` | Critical | Sequential awaits that could be parallelized |
| `bundles.ts` | Critical | Barrel imports and bundle amplifiers |
| `client-boundary.ts` | High | Server/client boundary friction |
| `rerenders.ts` | Medium | Rerender hotspots and missing memoization |

## Governance

This tool respects Core Governance:

- ❌ Never scans `**/ARCHIVE/**`
- ❌ Never scans `**/node_modules/**`
- ❌ Never modifies files
- ✅ Read-only analysis
- ✅ Lives in allowed `tools/registry/**` scope

## Rule Snapshots

Rules are pinned in `rules/vercel-react-best-practices.snapshot.md` to ensure:

1. Deterministic results across runs
2. Auditability of what was checked
3. Explicit upgrades when rules change

## Phase 4G Invariants

1. SEAL remains the only required check
2. This workflow is NEVER required for merge
3. Outputs are artifacts only, no auto-commits
4. Concurrency prevents backlog accumulation
