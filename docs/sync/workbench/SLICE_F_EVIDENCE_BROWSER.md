# Workbench Slice F — Evidence Packet Browser

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700` (same server as Slices A–E)  
**Extends**: `SLICE_E_IDENTITY_SPINE.md`  
**Design spec**: `TERRAFUSION_SYNC_WORKBENCH_MVP.md` §12

---

## Purpose

The Evidence Packet Browser answers:

> **Why should I trust the green cards?**

It makes every proof artifact browsable directly from the cockpit without
requiring the operator to dig through the repo. Documents open in a new tab
via `GET /api/doc?p=docs/sync/…` — served as plain text.

Read-only. Static catalog. No doctor run required.

---

## Always visible

Unlike Slices B–E (which fire after a doctor run), the Evidence Browser
renders immediately on page load. It is always present at the bottom of the
cockpit, regardless of whether a run has been started.

---

## Seven artifact groups

| Group | What it proves |
|-------|----------------|
| **Seal Packets** | Primary proof: spine seal, lane status, solo-dev closeout |
| **Revenue Addenda** | Revenue spine stage 1 / 2B / 3A seal addenda |
| **Readback Evidence** | Production readback checklist + results (post-F1) |
| **Source Packs** | Harris PACS source pack — shape spec, validator, application guide |
| **Automation Docs** | tf-sync-doctor and the four SQL automation scripts |
| **Doctor Evidence** | Benton baseline artifacts from live doctor runs |
| **Doctrine** | Core sync doctrine, boundary policy, PACS→canonical identity policy |

Total: **25 documents** across seven groups.

---

## How it works

The catalog is a static JS constant `EVIDENCE_CATALOG` in `app.js`. File
paths are relative to the repo root. On page load, `renderEvidenceBrowser()`
iterates the catalog and renders `<details>/<summary>` groups using only
`createElement`/`textContent` (no innerHTML).

Each file link points to `GET /api/doc?p=…` with the path URL-encoded.
`server.mjs` serves files under `REPO_ROOT/docs/sync/` only — paths outside
that tree return 403.

### Security

The `/api/doc` endpoint enforces two guards:
1. `p` must start with `docs/sync/` (prefix check)
2. `p` must not contain `..` (traversal check)
3. The resolved path must `startsWith(docRoot)` (double-check after `join()`)

Any request that fails any guard returns `403 Forbidden`.

---

## Files changed

```
tools/sync/workbench/
  server.mjs                      MODIFIED (Slice F): GET /api/doc endpoint
                                  (added in same commit as Slice F)

tools/sync/workbench/panel/
  app.js                          MODIFIED: EVIDENCE_CATALOG constant,
                                  renderEvidenceBrowser(), page-load call
  index.html                      MODIFIED: added <section id="evidence-browser">
                                  (no hidden class — always visible)
  styles.css                      MODIFIED: ep-* styles
                                  (ep-group, ep-file-list, ep-file-link, etc.)

docs/sync/workbench/
  SLICE_F_EVIDENCE_BROWSER.md     This file
```

---

## Non-goals (this slice)

- No search or filter
- No in-page markdown rendering (plain text in new tab only)
- No download links
- No write actions of any kind
- No live file discovery (static catalog only)

---

## Acceptance criteria

- [ ] Evidence browser visible on page load without running the doctor
- [ ] Seven collapsed groups with labels and file counts
- [ ] Each group expands to show file list with link + path
- [ ] Links open in a new tab
- [ ] File content served as text/plain from `GET /api/doc?p=…`
- [ ] Paths outside `docs/sync/` return 403
- [ ] All 25 catalog files are real paths that exist in the repo
