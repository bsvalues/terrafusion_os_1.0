# WO-TUOP-003 — Shell-Lineage Canon Drift Fix (evidence)

**Program:** TerraFusion Owner-Usable Product V1 · **Authority:** `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` (Issue #1589)
**Risk:** R3 — governance/metadata only. Rebuilds nothing.
**Base:** main `214d26d17` · **Executed:** 2026-09-11

## Defect

Root `package.json` declared `"main": "frontend/electron/main.js"` — the single artifact contradicting
the proven canonical UI/runtime lineage (`frontend/apps/os-shell` → `native-shell/ui/dist` →
TerraFusion API; Step Zero reconciliation, PR #1592). `frontend/electron/` is SUPERSEDED: it loads
`frontend/dist`, a directory `platform.json` lists under `deprecated.outputDirs`.

## Consumer-safety check (the WO's stop-condition gate — cleared before editing)

The field could only be touched after proving no live consumer breaks. Bounded `git grep` over
`scripts/`, `tools/`, `frontend/electron/`, `os-platform/`, `.github/workflows/` on `origin/main`:

| Candidate consumer | Finding | Reads root `main`? |
| --- | --- | --- |
| `os-platform/core/tests/local-agent-cockpit-skeleton.test.mjs:37` | asserts `pkg.main === 'main.js'` on **`apps/agent-cockpit/package.json`** (`@terrafusion/agent-cockpit`, private, "never pins electron at runtime") — a different package; corroborates the supersession direction | NO |
| `scripts/comprehensive-testing-framework.mjs:1572-1611` | reads root `package.json`, spreads `.scripts` and `.devDependencies` only; never touches `.main` (and is a generator script, not a runtime consumer) | NO |
| `frontend/electron` scripts (`electron`, `electron:dev`) | `cd frontend/electron && npm run electron` — use **`frontend/electron/package.json`'s own** `main: main.js`, not the root field | NO |
| Workflows / tools reading a `main` field | none found | NO |

Root package context: `"private": true`, `"type": "module"`, no `exports`, no `files`, `bin` =
`tools/bin/tf.mjs`. A private ESM workspace root is never imported by name, so `main` is
**vestigial metadata** — its only effect was misdirecting agents toward the dead electron lineage.
**Stop condition NOT triggered.**

## Change

Removed the single line `"main": "frontend/electron/main.js",` from root `package.json`.
**Deliberately NOT repointed at the WPF shell:** Step Zero rev 2 (owner-corrected) leaves the native
executable host *unproven* — WPF `Terrafusion.Shell` is the surviving **candidate** pending
release-proof in WO-TUOP-004. Replacing one unproven claim with another would repeat the exact
error the owner corrected. Removing the false pointer is the only honest move; WO-TUOP-004's
release-proof decides what (if anything) belongs there.

## Supersession record (where future agents read it)

- This evidence file + the registry record for WO-TUOP-003 carry the classification permanently.
- Canon chain: `docs/brain/evidence/WO-TUOP-000-STEP-ZERO-SHELL-LINEAGE-RECONCILIATION.md`
  (verdict + component table) and the program file's Step Zero section.
- Classification: `frontend/electron/` = **SUPERSEDED / NON-CANONICAL current UI host** — retained
  in-tree as historical; must not be launched, packaged, or rebuilt as the product. No lane may
  treat root `package.json#main` (removed) or electron's `frontend/dist` target (deprecated) as
  release truth.

## Post-change verification

- `package.json` parses; `main` absent; `bin`/`private`/`type`/scripts (incl. both electron scripts,
  untouched — script removal is out of this WO's bounded scope) all intact; 1-line deletion diff.
- Registry: WO-TUOP-003 → `pr_open` with this evidence recorded; schema-valid; wo-tool tests green.

`RESULT: COMPLETED` (pending protected merge) · `ACTIVE_WO: WO-TUOP-003` · `NEXT_WO: WO-TUOP-005 (ready, independent) then WO-TUOP-004 (unblocks on 003 merge)` · `STOP_TYPE: NONE`
