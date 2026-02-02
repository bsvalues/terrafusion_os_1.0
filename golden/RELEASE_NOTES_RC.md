# TerraFusion OS v1.5.0-rc.1 – Golden Corpus Anchor

> **Release Type:** Release Candidate
> **Date:** 2026-02-01
> **Profile:** County (Benton County reference)

## Overview

This release candidate establishes the **golden corpus compatibility anchor** for the TerraFusion OS autonomy toolchain. All future versions must remain backward-compatible with the artifacts produced in this release.

## What's Included

### Phase 4N40-4N47 Complete

| Phase | Feature | Tests |
|-------|---------|-------|
| 4N40 | Casefile as primary artifact | ✅ |
| 4N41 | Chain verification schema | ✅ |
| 4N42 | Audience separation + distribution packs | ✅ |
| 4N43 | Signer lifecycle + key rotation | ✅ |
| 4N44 | Economics (size limits, chunking, retention) | ✅ |
| 4N45a | Key rotation tests | ✅ |
| 4N45b | Key revocation tests | ✅ |
| 4N45c | Telemetry emitters | ✅ |
| 4N45d | DR reconstitution | ✅ |
| 4N46 | Operational readiness package | ✅ |
| 4N47 | Field deployment & accreditation | ✅ |

### Test Suite Status

- **Full suite:** 1448/1448 ✅
- **Type-check:** ✅
- **Phase 83 governance:** 32/32 ✅

## Artifacts

| Artifact | Description |
|----------|-------------|
| `audit-packet.zip` | Signed audit packet (county profile) |
| `ledger-head.json` | Current ledger state |
| `rollup-head.json` | Current rollup state |
| `casefile-public.zip` | Public distribution pack |
| `casefile-internal.zip` | Internal distribution pack |
| `verification-report.json` | External verification report |
| `dr-reconstitution-report.json` | DR drill report |
| `SHA256SUMS.txt` | Hash manifest |

## Contract Freeze

This RC locks the following semantics:

1. **Determinism:** Structural (not byte-perfect) – timestamps allowed to vary
2. **Policy field:** `expectedSignaturePolicy` → `policySnapshot.signaturePolicy`
3. **Triplet status:** `triplets.ok` (not `.complete`)
4. **Missing file error:** `HASH_MISMATCH` (hash check subsumes presence)

## Verification

```bash
# Download and verify (clean-room, no checkout)
gh release download v1.5.0-rc.1 --dir /tmp/verify

# Verify hashes
cd /tmp/verify
shasum -a 256 -c SHA256SUMS.txt

# Run external verifier
pnpm -w run verify:external --dir /tmp/verify
```

## Upgrade Path

For existing deployments:
1. Update dependency to `^1.5.0-rc.1`
2. Run `pnpm install`
3. Verify local tests pass
4. No schema migrations required (additive only)

## Known Issues

None. All governance gates green.

## Contributors

- TerraFusion Development Team
- Cloud Coach (AI Agent)

---

*Government. Transcended.*
