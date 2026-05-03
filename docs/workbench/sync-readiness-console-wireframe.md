# Sync Readiness Console Wireframe

**Slice:** OPS-1 (companion to
`docs/workbench/sync-readiness-console-policy.md`).

**Status (post-OPS-2 closeout):** authoritative. The OPS-1
family read path is COMPLETE; see
`docs/workbench/sync-readiness-console-completion-handoff.md`
for the binding closeout. Wireframe amendments require a fresh
OPS-2-* policy slice.

**Status (original):** docs-only. Pins the visual layout, panel structure,
state semantics, and interaction model for the OPS-1-B
implementation. Does NOT pin pixel-perfect layout, font sizes,
or component-library choices — OPS-1-B picks those within the
existing TerraFusion shell-app design system.

## Layout — single screen, one click

The console is one route, one screen, one column on narrow
viewports / two columns on wide viewports. No tabs. No nested
nav. No modals (per the existing TerraFusion brand guideline
that operator surfaces minimize chrome).

```text
┌──────────────────────────────────────────────────────────────────────┐
│  TerraFusion / Workbench / Sync Readiness                            │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Scope:                                                              │
│    County       : WA-Benton  (19190019-...-919191919191)             │
│    Workbook     : Benton PACS OLTP Mapping Workbook  (Mapped)        │
│    PACS source  : Benton PACS OLTP (tf-mssql)                        │
│                                                                      │
│  [ Refresh diagnostics ]   last refreshed: 2026-05-02T05:04:15Z      │
│                                                                      │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  ┌── 1. Is Harris PACS reachable? ────────────────┐ ┌── 2. Schema ──┐│
│  │  ●  YES                                         │ │  ●  YES        ││
│  │  Connected to localhost,1433/pacs_oltp          │ │  IsClean=true  ││
│  │  Probed 2026-05-02T05:03:11Z                    │ │  2229 / 32750  ││
│  │                                                 │ │  / 210 dicts   ││
│  └─────────────────────────────────────────────────┘ └────────────────┘│
│                                                                      │
│  ┌── 3. Are invariants clean? ────────────────────┐ ┌── 4. Preflights┐│
│  │  ●  WARN                                        │ │  ●  YES        ││
│  │  0 errors, 721 warnings                         │ │  Fk Pass×1     ││
│  │  ↳ FK-006 × 721 (operator-promotion             │ │  Era Pass×1    ││
│  │    candidates; not defects)                     │ │  Pii Pass×1    ││
│  └─────────────────────────────────────────────────┘ └────────────────┘│
│                                                                      │
│  ┌── 5. Are canonical rows stale or missing? ─────────────────────────┐│
│  │  ●  NO                                                              ││
│  │  Forward gap: 50 rows (PACS has rows; canonical empty for scope)   ││
│  │  Backward gap: 0 (inconclusive — bounded scan max-sales=50)        ││
│  │  Drift: 0                                                           ││
│  │  ▸ See sample (50 entries, ChgOfOwnerId only)                      ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌── 6. Last successful proof per surface ────────────────────────────┐│
│  │  Catalog health    : 2026-05-02T01:09:00Z   (BENTON-SYNC-3)        ││
│  │  Invariant artifact: 2026-05-02T01:27:36Z   (BENTON-SYNC-5)        ││
│  │  Preflight evidence: 2026-05-02T04:25:51Z   (BENTON-SYNC-6-C)      ││
│  │  Coverage smoke    : 2026-05-02T05:04:15Z   (BENTON-SYNC-7-C)      ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

(All values above are illustrative — the live console renders
whatever the captured artifacts contain.)

## Panel structure

Each of the six question panels has the same shape:

1. **Status badge** — circle + label (YES / WARN / NO / UNKNOWN).
2. **Headline** — the question, repeated verbatim from the
   policy doc's table.
3. **One-line summary** — the most-important number (counts,
   timestamps, or status string).
4. **Optional detail line** — context that explains the status
   without requiring the operator to click.
5. **Optional disclosure** — a `▸ See sample` toggle that
   expands the in-page sample list (only for question 5; the
   other questions are summary-only).

Panels MUST be self-explanatory. An operator scanning the
console for less than 10 seconds should be able to answer
"is the bridge healthy?" without clicking anything.

## Status color semantics

| Status   | Token              | Visual cue                  | When                         |
|----------|--------------------|----------------------------|------------------------------|
| YES      | `terra-green`      | Filled circle, light bg    | Surface fully clean           |
| WARN     | `terra-amber`      | Filled circle, light bg    | Non-fatal advisories         |
| NO       | `terra-red`        | Filled circle, light bg    | Fatal — operator action needed |
| UNKNOWN  | `terra-grey`       | Outlined circle, no bg     | Before first capture          |

These tokens already exist in the TerraFusion design system per
the brand guide; OPS-1 does NOT introduce new ones.

## Interaction model

### Page load

1. Read the URL params for
   `(CountyId, WorkbookId, SourceConnectionId)`.
2. If any are missing → render the empty selector page (a
   form with three GUID inputs and a "Load" button).
3. If all three are supplied → query the artifact directory for
   the most-recent run for each surface.
4. Render each panel's status from whatever artifact is found;
   render UNKNOWN if nothing is found.
5. Show "last refreshed" as the most-recent artifact's RunId,
   OR "never" if no artifact exists.

NO automatic refresh, NO polling, NO probes on page load. The
operator decides when to query live state.

### Refresh button

1. Operator clicks "Refresh diagnostics".
2. Spinner state appears next to each panel; status badge
   greys out.
3. Server-side handler runs:
   - PACS connection probe (60s timeout).
   - `sync-atlas --schema-catalog-health` (600s timeout).
   - `sync-atlas --load-pacs-dictionary --table property_use`
     (60s timeout).
   - `sync-atlas --qualify-sales-coverage` (300s timeout).
4. Each invocation writes to the ephemeral session artifact
   directory.
5. Console polls the artifact directory; as each artifact
   appears, the corresponding panel updates.
6. When all four invocations complete, the spinner state
   clears.
7. "last refreshed" updates to the most-recent RunId.

### Sample drilldown (question 5 only)

The coverage report can carry up to 50 sample entries per gap
bucket (forward / backward / drift). The console renders the
sample as an in-page table when the operator clicks
`▸ See sample`. Each row shows ONLY:

- ChgOfOwnerId
- canonicalStatus (or "—" for forward gaps)
- freshStatus (or "—" for backward gaps)

NO row data. NO PII. The sample is forensic context, not an
exfiltration surface. (This is structurally guaranteed by the
upstream artifact's no-PII guard from BENTON-SYNC-7-A — the
console just renders what's already there.)

## Empty / error states

### No scope selected

```text
┌──────────────────────────────────────────────────────────────────────┐
│  TerraFusion / Workbench / Sync Readiness                            │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Pick a scope to inspect:                                            │
│                                                                      │
│  County id:        [_______________________]                         │
│  Workbook id:      [_______________________]                         │
│  PACS source id:   [_______________________]                         │
│                                                                      │
│  [ Load ]                                                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Scope selected but no artifacts

```text
All six panels render UNKNOWN with status text "No capture yet".
The Refresh button is enabled.
```

### Refresh in progress

```text
Each panel's status badge greys out. A spinner appears next
to the badge. The Refresh button is disabled.
```

### Refresh failure (per panel)

```text
The panel's status badge becomes UNKNOWN with status text
"Capture failed". A small ⓘ icon shows the stderr summary on
hover. Other panels keep their per-panel state — partial
failures do NOT blank the entire console.
```

## Brand / design system

- Use existing terracotta brand tokens: `terra-midnight` for
  page background, `terra-cyan` for primary text accents,
  the four `terra-{green,amber,red,grey}` tokens for status,
  `terra-stone` for panel borders.
- Typography: existing TerraFusion shell typography stack;
  no new fonts.
- Iconography: status circles + a small `▸` disclosure
  triangle for the sample drilldown. No additional icons.
- No animations beyond the spinner during Refresh.
- No charts. The data is small enough that text + status badge
  is more honest than a sparkline.

## Accessibility

- Keyboard-navigable: tab order goes scope-form →
  Refresh button → each panel's disclosure (in panel order
  1-6).
- Screen-reader: each panel has an aria-label of the
  question; status is announced as "Status: YES" etc.
- Color is NEVER the only signal. Each status badge carries
  the YES / WARN / NO / UNKNOWN text label alongside the
  color circle.
- Per the existing FISMA-HIGH WCAG 2.1 AA contract.

## Out of scope (in the wireframe specifically)

- Pixel-perfect grid spec. OPS-1-B picks within the existing
  shell design system.
- Component library choices (Radix vs. custom vs. shadcn).
  OPS-1-B picks consistent with the rest of the shell app.
- Internationalization. OPS-1 is English-only; an OPS-1-I18N
  slice can land later.
- Multi-county view. The scope form takes ONE county; a
  multi-county dashboard is a separate OPS-2+ slice.
- Auth / permissions gating beyond what the shell app already
  enforces. Per existing pattern.
