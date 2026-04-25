# Frontend Data Mode Runbook

**Applies to:** TerraForge, Atlas, Dais, Dossier suite homes and any surface using `useDataMode` or `useCountyStats`
**Post:** commit `74e3e42d4` (data mode hardening, 2026-04-09)
**Owner:** bsval

---

## Invariants

1. Non-live mode (`snapshot` / `fixtures`) must be explicit — never silent.
2. Non-live mode requires an explicit allow flag (`VITE_ALLOW_NON_LIVE_MODE=1`).
3. UI mode indicators derive from provider diagnostics — not from independent network checks.
4. `sourceDisclosure` banner is the user-visible contract of data provenance. If it is absent, data is live.

---

## Pre-Start Verification (run before every dev session)

```bash
echo "VITE_DATA_MODE=${VITE_DATA_MODE:-<unset>}"
echo "VITE_ALLOW_NON_LIVE_MODE=${VITE_ALLOW_NON_LIVE_MODE:-<unset>}"
echo "VITE_SHOW_MODE_DIAGNOSTICS=${VITE_SHOW_MODE_DIAGNOSTICS:-<unset>}"
```

---

## Allowed Startup Modes

### Default — live PACS (recommended for all non-testing work)

```bash
# No env vars needed. Defaults to live.
npm run dev
```

Expected: chip reads **"Live metrics"** (green). No disclosure banner.

### Intentional snapshot mode (local debug only)

```bash
VITE_DATA_MODE=snapshot VITE_ALLOW_NON_LIVE_MODE=1 npm run dev
```

Expected: chip reads **"Snapshot-backed"** (amber). Disclosure banner visible.

### Intentional fixtures mode (test harness only)

```bash
VITE_DATA_MODE=fixtures VITE_ALLOW_NON_LIVE_MODE=1 npm run dev
```

Expected: chip reads **"Snapshot-backed"** (amber). Disclosure banner visible.

### Enable diagnostics pill (dev debugging)

```bash
VITE_SHOW_MODE_DIAGNOSTICS=1 VITE_DATA_MODE=snapshot VITE_ALLOW_NON_LIVE_MODE=1 npm run dev
```

Expected: small `mode:snapshot` chip in suite home header alongside the standard chips.

---

## Expected Fail-Fast

If `VITE_DATA_MODE=snapshot|fixtures` is set without `VITE_ALLOW_NON_LIVE_MODE=1`, the app throws at startup:

```
[DataProvider] VITE_DATA_MODE="snapshot" requires VITE_ALLOW_NON_LIVE_MODE=1.
Non-live modes must be explicitly opted into to prevent snapshot data reaching
production. Add VITE_ALLOW_NON_LIVE_MODE=1 to your .env.development file.
```

This is intentional. Fix: add the allow flag or clear `VITE_DATA_MODE`.

---

## Operator Triage — TerraForge appears reverted / shows wrong data

Work through in order:

**Step 1 — Read the chip**

| Chip text | Chip colour | What it means |
|-----------|-------------|---------------|
| "Live metrics" | Green | Provider is live |
| "Snapshot-backed" | Amber | Provider is snapshot or fixtures |

**Step 2 — Check disclosure banner**

If chip says "Live metrics" but you suspect stale data:
- Presence of `forge-source-disclosure` banner (`data-testid`) means disclosure is working.
- Absence means either data is genuinely live, or the provider/hook diverged (see step 3).

**Step 3 — Print env vars and confirm diagnostics**

```bash
# From shell where you started the dev server
echo "VITE_DATA_MODE=${VITE_DATA_MODE:-<unset>}"
echo "VITE_ALLOW_NON_LIVE_MODE=${VITE_ALLOW_NON_LIVE_MODE:-<unset>}"
```

Enable the diagnostics pill temporarily:
```bash
VITE_SHOW_MODE_DIAGNOSTICS=1 npm run dev
```
The pill shows `mode:<actual-provider-mode>`. If pill says `mode:snapshot` but chip says "Live metrics" — a downstream consumer is still using `/health/live` independently (audit it).

**Step 4 — Check for leaked non-live env from shell session**

```bash
env | grep VITE_DATA_MODE
```

If set: `unset VITE_DATA_MODE VITE_ALLOW_NON_LIVE_MODE` and restart.

**Step 5 — Confirm provider reset**

Hard-refresh the browser (clears module cache). The provider singleton is session-scoped — a stale hot-reload may hold a cached mode.

---

## Incident Recording Requirement

Any mode mismatch incident must record (minimum):

- Effective env var values (Step 3 output)
- `getDataProviderDiagnostics()` result: `{ mode, reason, initializedAt }`
- Screenshot of suite home chip + disclosure state
- Root cause and corrective action
- Reference to: `docs/incidents/_TEMPLATE_incident-memory-record.md`

See `docs/incidents/IMR-20260409-001-forge-mode-drift.md` as the canonical example.

---

## Audit — Other Suite Homes

The following surfaces were built before `74e3e42d4` and may still carry a local `getSourceDisclosure()` helper instead of reading `useCountyStats().sourceDisclosure`. Audit before ship:

- [ ] `AtlasSuiteHome.tsx`
- [ ] `DaisSuiteHome.tsx`
- [ ] `DossierSuiteHome.tsx`
- [ ] Any surface that renders a data-mode chip independently

Pattern to grep:
```bash
grep -rn "getSourceDisclosure\|health/live" frontend/apps/os-shell/src/pages/suites/
```

Zero matches = clean. Any match = migrate to `useCountyStats().sourceDisclosure`.
