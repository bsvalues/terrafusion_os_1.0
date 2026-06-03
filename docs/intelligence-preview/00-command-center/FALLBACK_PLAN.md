# Fallback Plan

> The conference must NOT depend on internet, database, or live AI.

## Fallback tiers (best → safest)

| Tier | What runs | When to use |
|---|---|---|
| 0 | Full live app (routes + backend + AI) | Everything healthy, good network |
| 1 | App with hardcoded demo data (no backend/AI) | Network flaky or backend down |
| 2 | Static screenshots clicked through in order | App won't start |
| 3 | Printed/exported PDFs + spoken script | Total failure / no laptop |

## Static package to prepare (Pod 4)

- [x] Atlas Property Dossier — PDF (`10-demo-package/pdfs/02-atlas-dossier.pdf`)
- [x] County Pulse — PDF (`03-county-pulse.pdf`)
- [x] Academy Codex (10 entries) — PDF (`codex-*.pdf` × 10)
- [x] Demo front door + Ask Academy — PDF (`01-demo-front-door.pdf`, `05-ask-academy.pdf`)
- [x] Screenshots of every route, in demo order (`10-demo-package/screenshots/*.png`)
- [x] 3-minute script — drafted in `DEMO_SCRIPT.md` (print before conference)
- [x] 10-minute script — drafted in `DEMO_SCRIPT.md` (print before conference)

All PDFs/screenshots captured via headless Chrome (no network/extension); each PDF verified
(`%PDF` header + non-trivial size). Tier-3 fallback is ready: the demo can run from these alone.

## Transition triggers (decide BEFORE you're on stage)

- Backend health check fails → drop to Tier 1.
- App fails to render within 5s → Tier 2.
- No display/laptop → Tier 3, talk from the PDFs.

## Pre-flight checklist (morning of)

- [ ] App boots offline with demo data
- [ ] All 8 smoke routes render
- [ ] PDFs on laptop AND phone AND USB
- [ ] Screenshots folder current
- [ ] Scripts printed on paper
