# Legacy Usage Snapshots

Weekly JSON snapshots from `/dev/legacy-metrics` viewer.

## Format

`YYYY-MM-DD.json` — Full `legacy_ui_metrics` export

## Weekly Ritual

1. `pnpm run dev` → `http://localhost:5173/dev/legacy-metrics`
2. Filter `modules.*`, sort by count
3. **Copy JSON** button → clipboard
4. Paste into `.governance/legacy_snapshots/YYYY-MM-DD.json`
5. Commit: `docs(governance): legacy usage snapshot YYYY-MM-DD`

## Trend Analysis

Compare snapshots week-over-week to track burn-down:
- Decreasing `count` → legacy surface usage declining
- No activity in 2+ weeks → candidate for removal

## Evidence Chain

These snapshots provide the evidence trail for FISMA-compliant
legacy surface deprecation decisions.
