# TerraFusion Forensic Recovery — Evidence Register

> Produced under the **TerraFusion Forensic Recovery Playbook Work Order**.
> Doctrine: *completeness before confidence; evidence before interpretation; discovery is not recovery; no premature collapse.*

This directory is the **operational memory** of the forensic recovery. It is not a
narrative audit — every conclusion here is traceable to a named evidence source
(git command output, file path, PR record, or canonical doc).

## Loop status

| | |
|---|---|
| **Current loop** | Loop 1 — Discovery breadth (forensic lanes 1–10) |
| **Recovery lock** | **ACTIVE** — no salvage/cleanup/merge actions taken |
| **Gate reached** | Gate A candidate (see `GATES-STATUS.md`) |
| **Date** | 2026-06-24 |
| **Working branch** | `claude/terrafusion-forensic-playbook-u3kvx6` (on current `main` lineage) |

## The one finding that reframes everything

The repository contains **three disjoint git histories** (three unrelated root
commits). **580 of 742 branches (78%) share *no common ancestor* with current
`main`** and are therefore **physically impossible to merge**. All buried value on
those branches must be recovered by file-/hunk-level cherry-pick or manual port —
never by `git merge`. This single fact explains the branch sprawl, the
recut-PR culture, and the 38-of-40 closed-unmerged PR pattern. See
`03-BRANCH-CENSUS-REGISTER.md`.

## Documents

| # | Deliverable | File | Status |
|---|---|---|---|
| 1 | Canonical Truth Brief | `02-CANONICAL-TRUTH-BRIEF.md` | complete (cross-checked) |
| 2 | Forensic Coverage Matrix | `01-COVERAGE-MATRIX.md` | living |
| 3 | Branch Census Register | `03-BRANCH-CENSUS-REGISTER.md` | complete (cross-checked) |
| 4 | PR Disposition Register | `04-PR-DISPOSITION-REGISTER.md` | partial (recent window) |
| 5 | Root Containment Table | `05-ROOT-CONTAINMENT-TABLE.md` | complete |
| 6 | System Duplication Map | `06-SYSTEM-DUPLICATION-MAP.md` | complete |
| 7 | Runtime Truth Map | `07-RUNTIME-TRUTH-MAP.md` | complete (cross-checked) |
| 8 | Artifact & Residue Register | `08-ARTIFACT-RESIDUE-REGISTER.md` | complete |
| 9 | Agent Drift Report | `09-AGENT-DRIFT-REPORT.md` | complete |
| 10 | Structural Risk Register | `10-STRUCTURAL-RISK-REGISTER.md` | complete |
| — | Loop Ledger | `00-LOOP-LEDGER.md` | living |
| — | Gate Model status | `GATES-STATUS.md` | living |
| 11–14 | Recovery Lanes (needles/salvage/containment/spine) | `11-RECOVERY-LANES-STATUS.md` | **gated — not started** |

Raw evidence (git output) is under `evidence/`.

## How to read this

1. Start with **`02-CANONICAL-TRUTH-BRIEF.md`** — what is true now.
2. Read **`03-BRANCH-CENSUS-REGISTER.md`** — the three-lineage finding governs all branch decisions.
3. Use **`01-COVERAGE-MATRIX.md`** to see what is proven vs. still shallow.
4. **Do not act on the recovery lanes** until Gates A–E pass (`GATES-STATUS.md`).
