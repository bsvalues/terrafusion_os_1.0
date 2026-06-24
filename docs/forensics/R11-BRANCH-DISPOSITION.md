# R11 — Branch Disposition & Needle Extraction (DECISION LANE)

> **This is a decision lane, not an execution lane.** It produces dispositions and lists
> only. No merges, cherry-picks, ports, deletions, or branch collapsing happen here — those
> are R12–R14 and remain **gated behind recovery-lock release**. Recovery lock: **ACTIVE**.

## Inputs (chain-of-custody)
- `evidence/branch-census.csv` — lineage_class + mergeability_class per branch (mandated schema).
- `RED-FLAG-REGISTER.md` — RF-1..RF-6 buckets.
- `LOOP5-VERIFICATION.md` — CI trust bounding (transient vs final-state).
- `F16-OWNERSHIP-FALSE-COMPLETION.md` — ownership vacuum / owner-sensitive surfaces.
- `F17-AI-REALITY-AUDIT.md` — AI surface REAL/LATENT/MOCKED/FICTION (**consumed for `ai_reality_dependency_flag`**).
- `04-PR-DISPOSITION-REGISTER.md` — recut/closed-unmerged workflow context.

## Required branch fields (schema)
`branch_name · lineage_class · mergeability_class · root_commit_family ·
shares_ancestor_with_main_flag · ci_trust_class · owner_sensitive_flag ·
red_flag_categories · ai_reality_dependency_flag · unresolved_product_intent_flag ·
uniqueness_score · feasibility_score · operational_value_score · disposition · evidence_notes`

### Field value sets
- **lineage_class:** MAIN-CURRENT (f2511bb) · LEGACY (7c26657) · THIRD-ROOT (5d16d8f).
- **mergeability_class:** CONTAINED · MERGE-CANDIDATE · PORT-ONLY · (ARCHAEOLOGY-ONLY).
- **ci_trust_class** (from Loop 5): `TRUSTED-FINAL-GREEN` · `UNTRUSTED-MIDFLIGHT` · `FOOTGUN-TRANSIENT` · `UNKNOWN-DISJOINT` (PORT-ONLY never ran on current CI).
- **disposition:** salvage-now · compare-later · archaeology · ignore · **BLOCKED** (fenced).

## Mandatory fencing rules
1. **PORT-ONLY ⇒ archaeology by default.** The 653 PORT-ONLY branches (LEGACY 580 + THIRD-ROOT 73) share no ancestor with main → **never merge**; salvageable only by file/hunk port, and only if unique value is proven (HR-1/HR-2).
2. **`owner_sensitive_flag = true` ⇒ cannot be `salvage-now` without owner review.** (87 branches: security/auth/secrets, PACS, governance, county-isolation, levy/cert.)
3. **`ai_reality_dependency_flag = true` ⇒ BLOCKED for any final salvage recommendation until F17 reality-classifies the underlying AI surface** (the new F17 rule). 132 AI-touched branches.
4. **`unresolved_product_intent_flag = true` ⇒ BLOCKED** pending owner product decision (e.g. cert/levy single source of truth; native-shell intent).
5. **No needle (salvage-now) is finalized until Gate C is FULL and the recovery lock is released.** This lane may *nominate*, not *commit*.

## Disposition register (class + family level)

| Bucket | Count | Default disposition | Fences |
|---|---|---|---|
| **CONTAINED** (in main, ahead=0) | 8 | **ignore** (already landed) | — |
| **MERGE-CANDIDATE** (MAIN-CURRENT, unique commits) | 80 | **compare-later** → needle pool | owner-sensitive + AI fences apply per branch |
| **PORT-ONLY — LEGACY (7c26657)** | 580 | **archaeology** | port-only; prove uniqueness before any port |
| **PORT-ONLY — THIRD-ROOT (5d16d8f)** | 73 | **archaeology** | port-only |

**Only the 80 MERGE-CANDIDATE branches are normal-mergeable** and form the realistic
near-term needle pool; everything else is port-only/ignore.

## Owner-sensitive list (fence #2) — 87 branches
Families: `*-prometheus-criticals-v1` (auth/cicd/infra/observability), `fix/auth-*`,
`copilot/r1-week5-cx18/cx19*` (permissions + county-isolation), `claude/wo-data-004*-pacs-*`,
`claude/wo-sec-localops-001-phone-redaction`, `claude/wo-ops-002-external-pacs-workspace`,
`codex/county-studio-*` (22), `r2/w7-pacs-county-isolation`, `r2/w11-real-dais-permits`,
`feat/*levy*` / `fix/*levy*`, `*cert*`, `feat/docs-fisma-honest-baseline`, `rescue/fisma-*`.
→ all require owner review before `salvage-now`.

## AI-dependency list (fence #3) — REWRITTEN to key on VALUE TIER (F18), not runtime status
F17 gave runtime status; **F18 (`F18-LATENT-VALUE-AUDIT.md`) gives the value tier, and per
HR-6 salvage-eligibility keys on the value tier, NOT on whether the surface is currently
wired.** A surface can be MOCKED at runtime yet tier-1/2 in value (e.g. the gated mesh, the
IAAO "stub"). Resolve each AI-/domain-touched branch by the tier of the surface it depends on:

| Underlying surface value tier (F18) | Examples | R11 effect |
|---|---|---|
| **Tier 1 — Real & useful** | Sync/PACS ETL, Levy calc | **salvage-eligible / high priority** (but Tier-1 here is also owner-sensitive — PACS/levy → fence #2 owner review) |
| **Tier 2 — Experimental but real** | Consciousness **mesh** (gated), IAAO **Compliance** "stub", ArcGIS scheduler, Muse/Pilot/LocalOps | **salvage-eligible** (un-gate / promote / wire); NOT archaeology |
| **Tier 3 — Simulated/benchmarked/process** | phase4d provenance manifests, honesty-correction branches (`wo-ai-consolidation-004a`, `wo-ai-consolidation-004c-*`, `docs/wo-ai-*`) | **keep & relabel honestly** (truth work is salvage-eligible) |
| **Tier 4 — Presentation-heavy** | property valuation demo, ratio-studies-declared-absent | **keep honest placeholder; implement-or-strip-claim** (not auto-discard) |
| **Tier 5 — Fictionalized** | CostForge "Ultimate", million-agent/quantum theater, `fix/wo-cf-b2*` fabricated-metrics | **archaeology / deprecate** — the only true do-not-build tier |

**Correction to prior R11 draft:** the earlier "MOCKED/FICTION → archaeology" rule was too
blunt (runtime-only lens). Only **Tier 5** defaults to archaeology; Tier 1–2 MOCKED-but-real
surfaces are salvage-eligible. This is the HR-6 guardrail against discarding good work for bad packaging.

## Overlap-resolution groups (pick ONE authoritative head per family)
| Family | Members | Resolution rule |
|---|---|---|
| `ui/tokens-b2-sweep-*` | 27 | latest non-superseded sweep on its lineage; the rest = duplicate effort |
| `codex/county-studio-*` chain | 22 | the chain terminates at `…real-dev-readiness` (PR #1075→main); treat as ONE ordered unit |
| `r2/w*-real-*` + `r2/wave-26..35` | 35 | the "real calculators/engines" series — dedupe per suite (forge/pilt/costforge/atlas/dais/levy/dossier) |
| `feat/sync-doctrine-4-impl-v{2..9}` | 9 | keep the highest-vN "canonical-backfill"; older = archaeology |
| `tf-agent-forge-wo-forge-005-*` | 5 | one authoritative; v2/v3/proof variants are recut noise |

## Archaeology-only list (fence #1)
**All 653 PORT-ONLY branches** (LEGACY 580 + THIRD-ROOT 73). Enumerated in
`evidence/branch-census.csv` where `mergeability_class = PORT-ONLY`. Salvage = file/hunk port
only, never merge; pursue only where Lane 2 (legacy heatmap, deferred) proves unique value.

## Needle list → **DEFERRED (gated)**
Per fence #5, the salvage-now needle list is **not finalized** in this lane. Candidate leads
(subject to all fences + per-branch uniqueness/feasibility/value scoring):
- `r2/w8-real-pilt-calculator`, `r2/w9-real-costforge-calculator`, `r2/w12-real-levy-engine`,
  `r2/w13/w23/w24-dossier`, `feat/sync-pop-4c-canonical-parcel`, `feat/auth-prometheus-criticals-v1`,
  `feat/docs-fisma-honest-baseline`.
- **Caveats:** most are PORT-ONLY (port not merge); several are owner-sensitive and/or
  AI-dependent (blocked). None promoted to needle yet.

## R11 status
Decision register populated at class/family level; fence #3 resolved via F17. **Per-branch
scoring + final needle selection await Gate C FULL + recovery-lock release.** Outputs
delivered: disposition register, owner-sensitive list (87), AI-dependency list (132, now
resolved by F17 class), overlap-resolution groups (5 families), archaeology-only list (653).
Needle list intentionally deferred (fence #5). This lane nominates; it does not commit.
