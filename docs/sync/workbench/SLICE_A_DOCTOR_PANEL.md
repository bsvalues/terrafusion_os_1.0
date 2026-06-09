# Workbench Slice A — Doctor Panel

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700`  
**Wraps**: `tools/sync/tf-sync-doctor.mjs`  
**Design spec**: `TERRAFUSION_SYNC_WORKBENCH_MVP.md` §9 (First Clickable MVP)

---

## Purpose

The Doctor Panel is the first visible surface of the TerraFusion Sync Workbench.  
It answers one question:

> **Can I safely start a Sync session?**

No drain buttons. No commit buttons. No mapping editor. Read-only.

---

## Start

```bash
node tools/sync/workbench/server.mjs
```

Then open `http://127.0.0.1:7700` in any browser.

The server listens on `127.0.0.1:7700` (local only — not reachable from outside this machine).  
No `npm install` required. Built-in Node modules only.

---

## Usage

1. Click **Run Doctor**
2. Wait ~30–60 seconds while the four automation checks run
3. Read the verdict cards

Expected Benton steady-state: **OVERALL: ⚠ WARN** — substrate clean, safe to work.

---

## Verdict interpretation

| Overall | Meaning | Action |
|---------|---------|--------|
| ✓ PASS | All checks clean | Safe to drain or inspect |
| ⚠ WARN | Substrate clean, known deferred items | Safe to work; review WARN lines before owner-link or F2 |
| ✗ FAIL | Identity break or seal failure | **DO NOT DRAIN** — resolve FAIL items first |

---

## Step cards

| Card | Automation tool | Expected Benton state |
|------|-----------------|----------------------|
| #0 Harris PACS Pack Validator | `harris-pacs-pack-validator.sql` | ✓ PASS (65 checks, 1 info) |
| #1 Identity-Drift Detector | `identity-drift-detector.sql` | ⚠ WARN (owner-link 1.4M rows, deferred) |
| #2 Seal-Check Runner | `seal-check-runner.sql` | ✓ PASS (22/22 gates) |
| #3 Domain-Coverage Audit | `domain-coverage-audit.sql` | ⚠ WARN (12 SEALED + expected deferrals) |

The `#1` WARN on `canonical_tf.tf_parcel_owner_link` is a known-deferred item —
not F1-class. Do not repair it without explicitly opening that workstream.

---

## Environment overrides

The server passes environment variables through to the doctor:

```bash
PG_HOST=myserver PG_DB=mydb PGPASSWORD=secret \
  node tools/sync/workbench/server.mjs
```

| Variable | Default |
|----------|---------|
| `PG_HOST` | `127.0.0.1` |
| `PG_PORT` | `5432` |
| `PG_DB` | `terrafusion` |
| `PG_USER` | `postgres` |
| `PGPASSWORD` | `devpassword123` |

---

## Files

```
tools/sync/workbench/
  server.mjs              Node.js http server (no npm install needed)
  panel/
    index.html            Dashboard shell
    app.js                Client JS — parses doctor output, renders cards
    styles.css            Minimal professional styling

docs/sync/workbench/
  SLICE_A_DOCTOR_PANEL.md  This file
```

---

## Non-goals (this slice)

- No drain buttons
- No commit buttons
- No mapping editor
- No quarantine editor
- No schema or data mutation
- No external npm packages

---

## Acceptance criteria

- [ ] `node tools/sync/workbench/server.mjs` starts without error on Node 18+
- [ ] Browser at `http://127.0.0.1:7700` loads the page
- [ ] **Run Doctor** button executes `tf-sync-doctor.mjs`
- [ ] Four step cards render with PASS/WARN/FAIL status
- [ ] Benton shows OVERALL: WARN
- [ ] `#1` shows the known deferred owner-link warning
- [ ] FAIL state shows "DO NOT DRAIN" message
- [ ] No write-capable actions exist on the page
- [ ] Raw output collapsible shows the full doctor stdout

---

## Next slice

**Slice B — Domain Coverage Panel**: renders the domain-coverage audit results
as a status grid (SEALED / LANDED_ONLY / DISCOVERED_DEFERRED / EMPTY_IN_SOURCE)
so the operator can see at a glance what is done and what is deferred.

See `TERRAFUSION_SYNC_WORKBENCH_MVP.md` for the full slice roadmap.
