# Artifact & Residue Register (Lane 8)

*Deliverable #8.* Status: **complete**. Confidence: **high**.
Method: Explore agent — root manifests, `QUARANTINE/` tree (`du`/`ls`), log/err scan.

## Source-vs-artifact separation

| Live source (in-tree) | Residue / artifact |
|---|---|
| `backend/` (135M), `frontend/` (41M), `os-platform/` (45M), `packages/` (162M), `docs/` (242M), `ops/`, `tests/`, `scripts/` | `QUARANTINE/` (**2.3 GB**, 161 dirs); `_validator_proof.log.err`; `.ci_artifacts_local/`, `.ci_test_results/`, `dev-audit/` (minimal) |

**Verdict:** clean separation. The only true residue sitting in the live tree is
`_validator_proof.log.err` (a port-5000 bind error log). Everything heavy is already
fenced in `QUARANTINE/`.

## Root manifest cluster (governance evidence, not residue — but root-cluttering)

`phase4b.manifest.json` (1.1M), `phase4c.readiness.manifest.json` (528K),
`phase4d..4n.*.json`, `phase4f.activation.ledger.json` (389K), `phase4g.retirement.manifest.json` (343K),
`ui-token-compliance.contract.json` (343K), `shell-defect-ledger.json`.
→ **KEEP** (load-bearing governance/disposition records). Lane 13 candidate: relocate under
`docs/governance/phase4/` to de-clutter root.

## QUARANTINE breakdown

| Subtree | Size | Contents |
|---|---|---|
| `top-level-dirs/` | 2.3G | 161 dead module copies, near-complete replicas, SDKs, brand assets |
| `root-md/` | 5.6M | 304 `.md` scaffolds (many "COMPLETE" claims unbacked by code) |
| `root-artifacts/` | 26M | 304 agent-generated scripts/specs/screenshots |
| `frontend-dead-shell/` | 392K | abandoned React shell |
| `terra-pilt-server/` | 320K | island service |
| `elite-dashboard/` | 72K | fabricated-metrics stub |
| `backend-orphan-controllers/` | 20K | dead .NET controllers |

## Residue register (action = Lane 13, gated)

| Path | Category | Recommendation |
|---|---|---|
| `_validator_proof.log.err` | error log | move to QUARANTINE/logs/ |
| `phase4a–4c` early manifests | superseded evidence | archive under `docs/archive/` if 4d+ supersedes |
| `QUARANTINE/top-level-dirs/` | dead replicas | confirm none are recovery backups, then size-reduce |

**No deletion/move performed** — recovery lock active; containment must not destroy
salvage evidence.
