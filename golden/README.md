# TerraFusion OS – Golden Corpus

> **Purpose:** This directory contains the **compatibility anchor** for the TerraFusion OS autonomy toolchain. The golden corpus ensures that all future versions remain backward-compatible with the reference audit packet produced during the RC release.

## What This Is

The golden corpus is a **single source of truth** consisting of:

1. **`GOLDEN_CORPUS.lock.json`** — Pinned SHA256 hashes for all release artifacts
2. **Reference audit packet** — A county-profile pilot run that produces signed, externally-verifiable evidence

## Contract Definitions

### Determinism

**Structural determinism** (not byte-perfect):
- Canonical manifest ordering (files sorted alphabetically)
- Stable file count for same inputs
- Timestamps (`generatedAt`) are allowed to differ between runs

**NOT guaranteed:**
- Byte-perfect ZIP archive hashes (due to timestamps in manifest)

### Policy Field Mapping

| Context | Field Name |
|---------|------------|
| Evidence index input | `expectedSignaturePolicy` |
| Casefile manifest output | `policySnapshot.signaturePolicy` |

### Triplet Schema

- Status field: `triplets.ok` (boolean)
- Deprecated: `triplets.complete` (do not use)

### Error Code Semantics

| Scenario | Error Code |
|----------|------------|
| File missing from archive | `HASH_MISMATCH` |
| File corrupted (hash differs) | `HASH_MISMATCH` |
| Manifest missing | `MANIFEST_MISSING` |
| Invalid ZIP structure | `ZIP_INVALID` |

**Rationale:** The hash check subsumes the presence check. An empty hash (from missing file) never matches the expected hash.

## Additive Fields Policy

New fields MAY be added to schemas in minor versions. Existing fields MUST NOT be:
- Removed
- Renamed
- Have their semantics changed

Without a **major version bump** and documented migration.

## CI Enforcement

The compatibility gate (`.github/workflows/golden-corpus-compat.yml`) will:

1. Download release assets by tag
2. Verify with clean-room verifier (no checkout)
3. Assert hash equality with `GOLDEN_CORPUS.lock.json`
4. Block merge if any drift detected

### Bypass

Bypass requires:
- `security-review` label
- `cio-approval` label
- Documented migration in PR description

## Regenerating the Golden Corpus

**Warning:** This is a governance action. Do not regenerate without approval.

```bash
# 1. Run county-profile pilot
pnpm -w run pilot:e2e --profile profiles/county.policy.json --emit-audit-packet

# 2. Compute hashes
shasum -a 256 dist/* > dist/SHA256SUMS.txt

# 3. Update lockfile with new hashes
# (manual or via automation script)

# 4. Tag new RC
git tag -s v1.X.0-rc.N -m "TerraFusion OS RC: Golden corpus update"
git push origin v1.X.0-rc.N

# 5. Create GitHub Release with artifacts
gh release create v1.X.0-rc.N --title "..." dist/*
```

## Version History

| RC Tag | Date | Notes |
|--------|------|-------|
| v1.5.0-rc.1 | 2026-02-01 | Initial golden corpus anchor (Phase 4N40-4N47) |

---

*Government. Transcended.*
