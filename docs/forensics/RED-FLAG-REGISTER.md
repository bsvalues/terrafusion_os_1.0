# Red Flag Register

*Loop 3 synthesis deliverable.* Consolidates the forensic findings into six
**hidden-system / false-authority generators**, severity-ranked. Each red flag cites the
lane deliverable(s) that evidence it. This is the single page to read before any recovery.

Recovery lock: **ACTIVE**.

## Severity ranking (blunt)

| Rank | Red flag | Bucket | Severity |
|---|---|---|---|
| 1 | **Schema / persistence fracture** | data truth | 🔴 highest |
| 2 | **False authority / false completion** | narrative truth | 🔴 highest |
| 3 | **Config topology fracture** | runtime-control truth | 🔴 high |
| 4 | **CI signal distortion** | governance-signal truth | 🟠 high (clarifying) |
| 5 | **Ghost authority (workspace/structure)** | structural truth | 🟠 high (clarifying) |
| 6 | *(dependency truth — CLEAN, no red flag)* | — | ✅ green |

---

## RF-1 — Schema / persistence fracture 🔴
**Source:** F14, + runtime grounding (`TerraFusion.API/Program.cs`).
- **3 EF DbContexts with separate migration lineages:** `TerraFusionDbContext` (197 files),
  `LevyDbContext` (9), `CurrentUseDbContext` (2, hardcoded PG schema) + orphaned raw-SQL Experiments.
- **`LevyCertification` defined twice, incompatibly** (Core int-PK vs Levy Guid-PK/40+fields),
  **both registered as `DbSet` in the SAME live API process** (`Program.cs:2271` TerraFusionDbContext + `:2477` LevyDbContext) → ambiguity is *loaded at runtime*, not hypothetical.
- **Registration sprawl:** `AddDbContext<TerraFusionDbContext>` appears ~20+ times in `Program.cs`; a *separately named* `TerraFusionContext` also registered (`Program.cs:2293`, Consciousness `Program.cs:91`) — possible second core-context.
- **Provider drift:** CurrentUse breaks on SQLite; `fix/currentuse-sqlite-provider-fix` unmerged.
- **Rule triggered:** Hard Rule 2 — schema must be lineage-classified before any persistence recovery.

## RF-2 — False authority / false completion 🔴
**Source:** F16, Lane 9, Lane 6.
- Recovery-spine surfaces (**workbench, Dais, registry**) are **UNOWNED** in CODEOWNERS.
- **~412 `*COMPLETE.md`/`*SUCCESS.md` docs; only ~2 evidence-backed** (W5F, scoped Phase-20).
- Fabricated metrics: **"1,008 agents"** (hardcoded) and **"50,000+ agents"** (fiction).
- AuditableEntityInterceptor claimed but not implemented.
- **Rule triggered:** Hard Rule 4 — no "complete" claim valid without runtime/build/merge proof.

## RF-3 — Config topology fracture 🔴
**Source:** F15. *(Note: secret-exposure sub-risk is MITIGATED — keys rotated 2026-06-24 — but topology fracture remains; rotation does not close F15.)*
- `config/` vs `configs/` duplication; `appsettings` (TerraFusion.API) vs `api-unified` duplication.
- Dev-compose **port contract broken** (`5000/3000` hardcoded vs `platform.json` `5046/3102`); env-var port config is partly theater.
- Stale hardcoded (now-rotated) secret values still committed → externalize to `${TF_*}`.
- **Rule triggered:** Hard Rule 3 — rotated secrets do not close F15 until config topology is singular and runtime contracts validated.

## RF-4 — CI signal distortion 🟠
**Source:** F13, + observed on PR #1080.
- ~91 workflows, **one real merge gate**; ~44 dormant/decorative.
- **Seal Gate "cancelled-as-failed" foot-gun** (`seal-gate-fast.yml` `case` default): cancelled/superseded upstream jobs reported as FAILED → **phantom failures** (reproduced live on PR #1080 superseded commits).
- Governance tests soft-fail **until 2026-06-30**, then auto-harden.
- **Consequence:** apparent branch/PR instability may be **governance-signal noise, not code failure** → must not poison branch disposition.
- **Rule triggered:** Hard Rule 5 — classify every CI failure as real-fail / governance-fail / workflow-foot-gun before it influences disposition.

## RF-5 — Ghost authority (workspace / structure) 🟠
**Source:** F11.
- `.workspace-map.json` is a **misleading ghost map** (Windows root `c:\Users\bsval\…`, declares non-existent dirs `ai-workspace-companion/`, `src/`, `SDK/`, `applications/`).
- `tools/dev/dev-os.mjs` scans a **missing `applications/`** dir.
- 92+ dead `*.code-workspace` in QUARANTINE imply alternate roots.
- **Authoritative structure truth = `platform.json` + `pnpm-workspace.yaml` + `terrafusion.app.json`** only.
- **Rule triggered:** Hard Rule 1 — workspace artifacts are non-authoritative unless runtime/build truth confirms them.

## RF-6 — (cleared) Dependency truth ✅
**Source:** F12. pnpm + NuGet authoritative, single lockfiles, no vendored deps, exclusions
documented. **Not a hidden-system generator** — explicitly de-risked; stop spending time here.

---

## How this reframes the mission
We are no longer asking *"where is the system?"* We are separating TerraFusion into:
**authoritative truth layers** · **misleading ghost layers (RF-5)** · **fractured
persistence/config layers (RF-1, RF-3)** · **false-completion narrative layers (RF-2)** ·
**distorted governance signals (RF-4)** · and **the actual recovery spine** (which RF-2
shows is currently unowned).
