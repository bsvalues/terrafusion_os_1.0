# Decisions (ADR log)

> Record **real** decisions only. One ADR per architectural/process choice. Never delete an ADR;
> supersede it. Format: Context → Decision → Consequences.

---

## ADR-0001 — Adopt the solo-dev control plane (this vault)
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** Solo dev shipping TerraFusion OS 1.0 with AI agents. Recurring failure modes: context
  loss, scope expansion, architecture drift, agent overreach, contradictory docs, weak release evidence.
- **Decision:** Establish `docs/obsidian/**` as operating memory + execution control: daily scope
  fence ([[00_TODAY]]), canon digest ([[canon-digest]]), release gates ([[release-gates]]), drift
  ledger ([[drift-ledger]]), deferred valve ([[deferred]]), one-at-a-time work orders
  ([[agent-workorders]]), this ADR log, honesty register ([[visible-honesty]]), and a drift
  landing zone ([[findings]]).
- **Consequences:** Every session starts in the vault. Work is bounded to one order. The vault is a
  *working surface*, never an authority — it obeys copilot-instructions → CLAUDE.md → STANDARD.md →
  TF-052 → AGENT_ENTRYPOINT.

## ADR-0002 — Do not fork `AGENT_ENTRYPOINT.md`; point to the canonical one
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** The control-plane spec proposed creating a new root `AGENT_ENTRYPOINT.md`. A canonical,
  far richer one already exists at `.github/AGENT_ENTRYPOINT.md` (Lane A/B scope, full Write-Lane
  Matrix, TerraTrace emission contract, Muse-mode boundary, Property Workbench routing, scope-block protocol).
- **Decision:** Do **not** create a second, paraphrased entrypoint. The vault links to and obeys the
  existing `.github/AGENT_ENTRYPOINT.md`. [[canon-digest]] is an explicitly-labeled digest, subordinate to it.
  A root `AGENT_ENTRYPOINT.md` exists only as a **thin pointer** (signpost) to the canonical file + `docs/brain/`.
- **Consequences:** No contradictory duplicate (which would be the exact "contradictory docs" drift the
  plan exists to prevent). One source of truth for agent rules.

## ADR-0004 — Machine canon is JSON, not YAML
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** The Brain needs machine-readable canon (suites, write-lanes, layers, naming) for the
  `brain` CLI to reason over. No YAML parser is installed (`yaml`/`js-yaml` absent); repo convention is
  dependency-light `.mjs` tooling.
- **Decision:** Author machine canon as `docs/brain/canon/*.json` — natively loadable, zero deps.
  `canon-digest.md` is the human mirror. Both are digests of TF-052 (law).
- **Consequences:** `scripts/brain/canon.mjs` loads canon with `JSON.parse`, no new dep. The spec's
  YAML examples were illustrative of the *data model*, which JSON expresses identically.

## ADR-0005 — The Brain wraps existing enforcement; it never reinvents it
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** `brain check` could re-implement naming/write-lane checks. The repo already has
  `tools/naming/naming-lint.mjs` and `scripts/spec-gates/write-lanes.mjs` (validates
  `tools/registry/terrapilot.tools.json` against TF-052's write-lane spec).
- **Decision:** `brain check` **shells out to the existing gates** (`execFileSync` with fixed argv
  arrays — no shell, no injection) and aggregates. Reasoning (`ask`/`classify`) is deterministic
  lookup over canon; on no-match it returns `UNRESOLVED` rather than guessing (ties to ADR-0003).
- **Consequences:** One enforcement implementation, not two. First run of `brain check` immediately
  surfaced real drift (**D-004**: 21 write-lane violations in the tool manifest) — proving wrap-don't-rebuild.

## ADR-0003 — Proof standard for closing gates and drift
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** Plausible explanations get promoted to "done" without evidence; stale plans claim work
  is needed when it is complete (see drift D-002).
- **Decision:** A release-gate box or drift row may be closed **only** with concrete evidence: a commit
  hash, a test count, or a command's log tail. "Probably works" / "should be fine" is never sufficient.
  When a plan and the repo disagree, verify against the repo and record the correction as drift.
- **Consequences:** Slower to claim done, faster to actually be done. The control plane proved its
  worth on day one by catching D-002 (Dais already built) before any duplicate code was written.

## ADR-0006 — Hardening (Week 1): wrap SEAL, enforce passport local-first + opt-in
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** The hardening spec wanted a new `seal.yml`, passport-on-every-commit, and `.ts` policy
  scripts. But **SEAL already exists** (`seal-gate-fast.yml`, the single required PR check) and its
  `governance-fast` job already enforces forbidden-paths, legacy-frontend, naming-lint, write-lane
  tests, and workbench compliance. Adding passport enforcement to that required gate would instantly
  block **every existing in-flight PR** (none have passports).
- **Decision:**
  1. **Wrap, don't fork SEAL.** No competing `seal.yml`. The Brain mirrors SEAL's forbidden-path rule
     locally for *earlier* feedback; SEAL stays the CI authority. The local mirror tracks
     AGENT_ENTRYPOINT's explicit forbidden scope (not SEAL's stricter superset) to avoid false positives.
  2. **Passport is local-first and opt-in.** `check-agent-passport.mjs` validates passports; the
     pre-commit gate enforces protected-paths + ports always, but requires a passport **only when
     `TF_BRAIN_PASSPORT=1`** — the deliberate graduation switch. Promote to a required SEAL step later.
  3. **`.mjs`, not `.ts`** for policy scripts (ADR-0004 convention) — runnable with zero build step.
- **Consequences:** Bypass prevention is real *today* (local block) without disrupting existing work.
  The path to "no passport, no commit" is a single env flag flip, then a SEAL step. No CI broken
  (`platform-lint` = 0 violations; no new workflow added).

## ADR-0007 — "Cortex" is the system identity; do not rename docs/brain → docs/cortex now
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** The power-layer spec names the system **Cortex** with `docs/cortex/` + `scripts/cortex/`.
  A wholesale rename would orphan the wired `.husky/pre-commit`, `package.json` scripts, every
  cross-link, and the memory pointers — creating two competing trees (the exact drift we fight).
- **Decision:** Adopt **Cortex as the identity** (`BRAIN_AUTHORITY.md`, help banner, modes). Keep the
  implementation at `docs/brain/` + `scripts/brain/` + `pnpm brain`, and add a `pnpm cortex` alias so
  `cortex …` commands work. A literal directory rename is a clean, separate sweep on explicit request.
- **Consequences:** Zero churn, no broken refs; the user's `cortex` muscle-memory works today.

## ADR-0008 — Risk + judgment engine (governed acceleration, not dumb blocking)
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** A gate that only says pass/fail can't help choose or nuance cross-lane work.
- **Decision:** `classify`/`judge` (canon.mjs) compute a deterministic **risk level R0–R5** (keyword
  rules: docs/tests→R1, single-suite→R2, persistence/API→R3, shell/cross-suite→R4, constitution/
  security→R5) and a **verdict**: Proceed · Proceed-with-constraints · Escalate · Defer · Block · Recover.
  Cross-lane intent (≥2 suites' concepts) → Proceed-with-constraints naming each bridge (service +
  TerraTrace), echoing the §20 example. Unresolved owner → Escalate. All deterministic; no guessing.
- **Consequences:** `brain classify`/`review-diff`/`today`/`release` give judgment, not booleans. Proven
  on the cross-lane "AI appeal summary packet to Dais" case (R4, bridges to Dossier + GPT named).

## ADR-0009 — Wiki is generated from Cortex; "Cortex Prime" engine fleet is deferred
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** Two asks: (a) a TerraFusion Wiki, (b) a "Prometheus-grade Cortex Prime" with ~10 engines
  (what-if simulation, trial, council, red-team agent, memory court, black-box, apply-patch membrane,
  full ontology, scorecard automation). The locked doctrine [[project_benton_truth_singular_gate]]
  forbids the "Prometheus-grade" framing until a full-corpus evidence artifact exists, and the standing
  failure mode is building speculative surfaces instead of the concrete next thing.
- **Decision:**
  1. **Build the Wiki as a generated view of governed truth**, not a hand-authored doc swamp.
     `scripts/brain/publish-wiki.mjs` (`pnpm brain wiki`) generates `wiki/**` from canon JSON + memory;
     pages carry graph-native frontmatter and a "do not hand-edit" banner; `brain wiki --check` fails if
     the wiki has drifted from canon (anti-drift enforcement, can graduate into pre-commit/SEAL).
  2. **Add only one cheap, deterministic power command now:** `brain what-if` (foresight over `judge`),
     including a Property Workbench-mandate BLOCK for standalone parcel-scoped surfaces (§8 example).
  3. **Defer the engine fleet** ([[deferred]]) — each becomes its own work order only when a concrete
     need proves it, post-1.0.
- **Consequences:** The wiki cannot drift (regenerated from canon). No speculative engine sprawl.
  Honors the doctrine while still delivering the real, requested, runnable capability.

## ADR-0010 — Reserved-suite artifacts (Clerk/Treasury/Audit): forward-stage, do not activate or delete
- **Date:** 2026-06-09 · **Status:** Accepted
- **Context:** `brain contradiction` surfaced real, substantial controllers
  `{Clerk,Treasury,Audit}Controller.cs` (344–448 lines, statute-grounded, CountyId+RBAC, delivered by
  **PR #656** with `R1Week5Cx24PR656IntegrityTests`) plus 19 manifest tools under suites
  `clerk/treasury/audit`. TF-052 **reserves** those suite names; `current-release.json` lists them under
  `explicitly_deferred`. Evidence: **no 1.0 dependency** — no frontend calls `api/clerk|treasury|audit`,
  none are in `must_ship`. They align with the documented municipal-OS vision (offices beyond assessment).
- **Decision (per the "quarantine unless a 1.0 dependency is proven" protocol):**
  - **Not delete** — they are real, tested, intentional future-office infrastructure.
  - **Not activate** — promoting a Reserved suite to Active is an **R5 constitutional** change to TF-052;
    that is the human architect's call and is **not made here** (FU-2).
  - **Forward-stage:** record the exact artifacts as a FROZEN, dated exception in
    `docs/brain/canon/reserved-staging.json`; add a ratchet `brain check reserved-staging` that blocks any
    NEW reserved-office controller so the footprint cannot grow silently.
  - **Scope boundary:** the controller `.cs` files and the 19 manifest tools are **not moved/edited** here
    (R3/R4, touches live routes + the agent tool runtime; needs consumer verification). FU-1 (tool
    quarantine to clear the write-lanes gate) is its own work order.
- **Consequences:** D-005 resolved (forward-staged + ratcheted). D-004 partially resolved — `brain check
  write-lanes` stays RED until FU-1. The ratchet caught + I corrected a false positive (`LevyAuditController`
  = levy-compliance audit, a Dais/levy function, not the reserved Auditor office) → exact-name matching only.
```md
## ADR-NNNN — <title>
- Date: YYYY-MM-DD · Status: Proposed / Accepted / Superseded by ADR-MMMM
- Context:
- Decision:
- Consequences:
```

---

## ADR-0011 — FU-1 correction: reserved offices are LIVE Workbench tabs; tool quarantine is unsafe
- **Date:** 2026-06-09 · **Status:** Accepted (supersedes the dependency claim in ADR-0010)
- **Context:** FU-1 set out to quarantine the 19 reserved-suite manifest tools to clear the write-lanes
  gate. Investigation (Brain `contradiction` → grep → file reads) found the footprint is far larger than
  ADR-0010 recorded: `Property{Clerk,Treasury,Audit}.tsx` are real Workbench tab components
  (427–517 lines) lazy-loaded in `Router.tsx` and registered **`enabled: true`** in
  `PropertyWorkbenchSurface.tsx:57-59`, invoking the 19 tools.
- **Correction:** ADR-0010 stated "no 1.0 frontend dependency." **Wrong** — it grepped API route strings,
  not components. There IS active frontend surface. (Proof standard: correcting my own claim on new evidence.)
- **Decision / doctrine:**
  - **Code presence does not equal constitutional activation** — but here code presence + active wiring
    (`enabled: true`) DOES present reserved offices as active, contradicting TF-052 §4.1. Recorded as the
    rule `reserved_code_presence_does_not_imply_activation` (reserved-staging.json), flagged **VIOLATED**
    on the active-frontend condition (drift **D-007**).
  - **Tool quarantine (FU-1's original goal) is UNSAFE** — the 19 tools back live tabs; removing them breaks
    the Workbench. `write-lanes` (D-004) stays honestly RED; quarantine is not the lever.
  - **The lever is FU-2** (R5 constitutional): activate Clerk/Treasury/Audit in TF-052, or gate the tabs
    `enabled:false`. Not done here — the human architect's decision, forbidden in FU-1 scope.
- **Consequences:** FU-1 produced the classifier outcome predicted ("first pass may not clear write-lanes —
  still progress"): proved *why* the tools can't be quarantined, escalated the real decision to FU-2.
  Nothing in frontend/TF-052/runtime touched.

---

## ADR-0012 — FU-2A: gate reserved municipal offices (Clerk/Treasury/Audit) for OS 1.0
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R5 (gate, not activate) / R3 (impl)
- **Context:** D-007 — reserved offices were rendered as active Workbench tabs, contradicting TF-052 §4.1
  and the route guard `CANONICAL_WORKBENCH_TABS` (both canonical 6). FU-1 proved the offices are real,
  tested, contract-tested (`VALID_WORKBENCH_TAB_IDS`=9), and runtime-loaded — not stray config.
- **Decision (operator's call):** **Gate, do not delete, do not activate.** Preserve all forward-staged
  code (components, controllers, tools, contract constants). Add a render-time gate
  `applyForwardStagedGate()` in `PropertyWorkbenchSurface.tsx` that hides clerk/treasury/audit tabs unless
  `VITE_TF_ENABLE_FORWARD_STAGED_OFFICES=true` (default **false**). TF-052 unchanged — code presence does
  not amend the Constitution; activation stays a future explicit R5 amendment.
- **Why a render-filter (not flipping `enabled` or editing constants):** contract tests assert the
  defining constants (`VALID_WORKBENCH_TAB_IDS`=9) + wiring; gating the *render* aligns the nav with the
  already-canonical route guard without overturning those contracts. Surface-test fixtures already mock
  the canonical 6, so the gate matches expected behavior.
- **Consequences:** D-007 resolved. Canonical 6-tab Workbench restored by default (also satisfies
  `MAX_WORKBENCH_TABS=6`). Proven: `reservedOfficeGating.test.ts` 3/3, contract tests 46/46, frontend
  type-check clean. **FU-2B remains** (the 19 tools still load into the TerraPilot runtime → `write-lanes`
  stays red; gate or accept as a documented exception — own work order). `brain what-if "enable clerk tabs"`
  now returns Block (R5/flag); `"keep clerk controller code"` returns Proceed-with-constraints.

---

## ADR-0013 — FU-2B: gate reserved-office tools out of the TerraPilot runtime
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R3 (runtime gating)
- **Context:** FU-1 proved the 19 reserved-office tools load into the live TerraPilot runtime via the
  only non-test loader, `dev-pilot-runtime.mjs:566` (`registry.initialize(terrapilot.tools.json)`).
  FU-2A gated the Workbench tabs; this is the second surface (runtime tool exposure).
- **Decision:** Gate at the loader, **not** the manifest or core `ToolRegistry.ts`. A pure helper
  `forwardStagedGate.mjs` (`filterReservedOfficeTools`, `forwardStagedOfficesEnabled`) filters out
  clerk/treasury/audit tools unless `TF_ENABLE_FORWARD_STAGED_OFFICES=true` (default false).
  `resolveTerrapilotManifestPath()` loads the real manifest when enabled, else writes a **filtered copy**
  to the OS temp dir and loads that — **the on-disk manifest is never modified**.
- **Why this point:** topology showed dev-pilot-runtime is the sole live loader (singleton's other
  callers are tests/proofs); gating there covers runtime exposure without editing the governed/frozen
  core or rebuilding generated `.js`. Pure helper keeps tests free of runtime side effects.
- **Consequences:** Both reserved-office exposure surfaces (UI + runtime) are now gated off by default;
  rule `reserved_code_presence_does_not_imply_activation` condition (3) satisfied. Proven:
  `forwardStagedGate.test.mjs` 3/3 (gated-off withholds, flag-on exposes, manifest unmutated),
  `node --check` clean. **`write-lanes` (SEAL) stays RED** — it statically validates the manifest FILE,
  which still declares reserved suites (by design: code preserved). D-004 narrows to: annotate the
  manifest tools as staged + teach write-lanes, OR accept the static red as a documented forward-staged
  exception. Not weakened, not faked. Activation remains a future R5 TF-052 amendment.

---

## ADR-0014 — FU-2C: narrow, exact static write-lane exception for forward-staged tools
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R3 (governance-check semantics)
- **Context:** After FU-2A (UI gate) + FU-2B (runtime gate), reserved-office tools are not exposed in OS
  1.0, yet `write-lanes` (SEAL `spec-gates.yml`, blocking) stayed red because it statically validates the
  manifest FILE, which still declares the reserved suites (code preserved by design). Path A = keep it red
  (stricter); Path B = teach the validator the exact, gated exception. Operator chose **Path B, narrow**.
- **Decision:** `scripts/spec-gates/reserved-staging-exception.mjs` (pure) exempts a tool ONLY if:
  (1) its exact `toolId` is in `reserved-staging.json` `footprint.manifest_tools.ids` (no suite-wide /
  pattern exemption), AND (2) `status` starts with `forward-staged`, AND (3) BOTH `gate.frontend` and
  `gate.runtime` are recorded. `write-lanes.mjs` skips those exact tools and **reports them transparently**
  ("19 forward-staged exempted; re-validate on activation") — it does not hide them.
- **Anti-backdoor proofs (`reserved-staging-exception.test.mjs` 5/5 + integration):** a NEW reserved-suite
  tool not in the 19 still fails; flipping `status` off → exception inactive → gate fails; dropping either
  gate → inactive → fails; missing register → no exemption (fails safe).
- **Consequences:** `write-lanes` PASSES (98 validated + 19 exempted) → **`brain check` ALL GREEN**, and it
  now reflects *actual product exposure* rather than a stale static red — without weakening the rule.
  D-004 resolved. The exemption is self-revoking: activation (R5/TF-052) or removing a gate forces
  re-validation, including `export_audit_bundle`'s trace-immutability concern. **Effect on CI is deferred
  until committed** (CI runs committed files; this Brain is uncommitted). Next slice: wire into SEAL.

---

## ADR-0015 — SEAL Enforces Generated Wiki and Reserved Staging
- **Canonical full text:** [`decisions/ADR-0015.md`](decisions/ADR-0015.md) (moved to a standalone file
  per the work-order spec; single source of truth — content not duplicated here).
- **Summary:** Wire `brain wiki --check` + `brain check reserved-staging` into `seal-gate-fast.yml`
  governance-fast (Option 2; `write-lanes` stays owned by `spec-gates.yml`, not duplicated). Both gates
  proven fail-closed (negative tests 2026-06-09). Sequence complete: gate UI → gate runtime → exact
  static exemption → SEAL enforcement. Effect on CI deferred until committed.

---

## ADR-0016 — Brain v0.3: work-order generation + review-diff enforcement (agent containment)
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R2 (Brain tooling)
- **Context:** The Brain was a governance checker; the next power jump is to make it the solo-dev
  execution loop so agents become bounded workers. Locked v0.3 doctrine: *no agent prompt without a work
  order; no agent output accepted without review-diff.*
- **Decision:** Build two commands (pure engine in `scripts/brain/workorder.mjs`):
  - `brain workorder create "<task>"` → classifies the task, derives a **scoped** policy (suite-scoped
    allowed hints; forbidden = protected paths + TF-052 + every *other* suite), and writes a human-readable
    work order with an embedded machine-policy json block to `docs/brain/workorders/active/WO-NNNN-slug.md`.
    Marked "REFINE before dispatch" — canon-derived defaults, not final scope.
  - `brain review-diff [--workorder WO-NNNN]` → runs the base checks AND, with a work order, enforces the
    changed-file set against its policy: **BLOCK** on forbidden files, **PROCEED WITH WARNINGS** on
    out-of-scope files, **PROCEED** when clean.
  Did **not** build `brain next` / `commit-plan` / `proof` yet — those are explicitly later v0.3 slices.
- **Proof:** `workorder.test.mjs` 6/6 (suite-scoped allowed, forbids other suites + TF-052, render↔parse
  round-trip, forbidden→BLOCK, in-scope→PROCEED, out-of-scope→WARN). Dogfood: generated WO-0001 (D-008
  stub cleanup); `review-diff --workorder WO-0001` correctly flagged the live diff as outside its scope
  (PROCEED WITH WARNINGS). `brain check` all green; wiki unaffected.
- **Consequences:** Agents can now be dispatched with a bounded packet and audited against it. The loop
  `workorder create → agent executes → review-diff` is real. Next v0.3 slices: `brain next`, `commit-plan`,
  `proof`. Then product gates remain (Shell-Contract verify, honesty sweep, ServiceRegistry).

---

## ADR-0017 — Brain v0.3 Slice 3: commit-plan + proof (close the execution loop)
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R2 (Brain tooling)
- **Context:** With `workorder create` + `review-diff` built (ADR-0016), the loop needs a clean-commit
  step and an evidence step. Doctrine: *no commit without proof bundle; no merge without commit-plan.*
- **Decision:** Add two commands to the Brain CLI:
  - `brain commit-plan [--workorder WO-NNNN]` → partitions the working diff (+untracked) into
    **include / exclude**. With a work order, uses its allowed/forbidden policy; without one, uses the
    **Brain governance footprint** glob set. Emits a suggested message + a **path-limited `git add`** and a
    DIFF-RISK warning when most files are out of scope. Advisory only — no git mutation.
  - `brain proof [--workorder WO-NNNN]` → runs the proof set (`brain check`, `wiki --check`), records
    pass/fail + working-tree size + open-drift risk, and writes `docs/brain/evidence/<id>-proof.md`.
- **Proof:** dogfood — `commit-plan` correctly isolated the 68-file Brain footprint from the unrelated
  fleet diff; `proof` ran both checks (PASS) and wrote `evidence/slice-2026-06-09-proof.md` (open drift
  P0=0 P1=0 P2=3 P3=1). `brain check` + `wiki --check` green.
- **Scope honesty:** `proof` runs the *positive* checks and references per-slice negatives in the ADR (it
  does not fabricate negative results). `commit-plan` is advisory; the human stages.
- **Consequences:** The v0.3 execution loop is complete: `workorder create → review-diff → proof →
  commit-plan → stop`. `brain next` (a thin reframe of `brain today`) intentionally NOT built — outside
  the locked Slice 3. Next: return to product gates (Shell-Contract verify, honesty sweep, ServiceRegistry)
  + D-008/D-009/D-010.

## ADR-0018 — Brain holds the OS surface contract as canon (anti-drift referee role)
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R2 (Brain doctrine/data)
- **Context:** Agents (Codex/Claude/fleet) repeatedly drift on the same architecture facts: confusing
  Workbench Forge tab with TerraForge Suite, proving routes instead of OS navigation, treating local
  proof as production proof, adding mock/fallback data, locking required features and calling them done.
  Operator directive (June 10 production loop): use the Brain as **memory + doctrine + decision register
  + anti-drift referee** — explicitly NOT as a product builder, UI designer, or source of new architecture.
- **Decision:** Add `docs/brain/canon/surface-contract.json` (registered in `scripts/brain/canon.mjs`)
  holding: the 11 OS surface-contract truths, the 7-question pre-slice check (any YES blocks the slice),
  the must-validate list (target surface, OS navigation path, allowed files, runtime data source,
  forbidden claims, definition of done), and the forbidden-confusion pairs. Doctrine line:
  **"Brain remembers the contract. Agents execute the slice. Browser proves the truth."**
  If Brain doctrine conflicts with a proposed implementation: stop and report; do not improvise architecture.
- **Consequences:** The surface contract is now machine-readable canon, loaded with the rest of the canon
  (zero-dep JSON, ADR-0004). Pure data + one-line loader registration — no new enforcement logic invented
  (ADR-0005 wrap-don't-rebuild respected). Pre-slice consultation is loop discipline recorded here; future
  `brain check` wiring may consume it, but that is a separate, explicitly-scoped slice.

## ADR-0019 — CompsForge comp-pool window: taxYear−3..taxYear (assessor-credible lookback)
- **Date:** 2026-06-09 · **Status:** Accepted · **Decision class:** R3 (business rule / API)
- **Context:** `/api/terraforge/comps-pool` filtered to `SalesYear == taxYear` only; for tax year 2026
  that produced 36 visible rows while `ComparableSales` holds 259,102 real Benton sales (2024=4,700,
  2025=4,867). The SaleDate lookback branch was dead code (only fired when SalesYear was null, but
  SalesYear is populated on virtually every row). **Real data, wrong window** — a business-rule defect,
  not sample data. Operator decided the window explicitly.
- **Decision:** Tax year N pools `SalesYear ∈ N−3..N` (2026 → **2023–2026**), with a SaleDate-window
  fallback for null-SalesYear rows. Visible pool stays qualification-screened (rejected/disqualified
  never enter). Response discloses `compWindow` + separated `poolCounts`
  (candidate / qualified / poolEligible / rejectedOrUnqualified / displayed); the UI shows
  "Comp window: 2023–2026" and the counts. **Completion rule:** CompsForge is not complete until
  browser proof through OS Dock → Forge → CompsForge shows a meaningful Benton pool AND the active window.
- **Proof:** `aae00fda9` — pool 36 → **9,102 pool-eligible of 13,900 candidates** (DB cross-check
  identical); 7 new backend contract tests + frontend lookback test (15/15); browser-proven with
  screenshot; no mock/fallback; no 401/500 (only the intentional 501 statewide-federation probe).
- **Consequences:** Suite COMPS POOL metric reads 9,102 from the same response. Ratio-study and
  sale-queue population rules intentionally NOT changed (different doctrine question; change only on
  operator decision). Recorded in `canon/surface-contract.json` → `compsforge_pool_doctrine`.
