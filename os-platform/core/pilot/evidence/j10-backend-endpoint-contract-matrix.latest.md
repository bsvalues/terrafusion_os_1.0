# Backend Endpoint Contract Matrix

- Generated: 2026-06-01T11:53:25.211Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: d576e854b644ef62e0ef19312307632609fe197ef8e9e5fe238204bedc831530

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | 1281 |
| Safe dev39 GET candidates | 544 |
| Static-only endpoints | 737 |
| Live dev39 probed endpoints | 544 |

## Classification Counts

| Classification | Count |
| --- | ---: |
| live | 253 |
| protected | 526 |
| broken | 184 |
| mock | 11 |
| dead | 47 |
| not_applicable | 0 |
| unknown | 260 |

## Method Counts

- GET: 782
- POST: 428
- PATCH: 21
- DELETE: 22
- PUT: 28

## Live Dev39 Broken/Dead Sample

- GET /api/adjustment/proposals: broken (500)
- GET /api/adjustment/sets: broken (500)
- GET /api/adjustment/runs: broken (500)
- GET /api/adjustment/recommend: broken (400)
- GET /api/aiassistant/health: broken (500)
- GET /api/aimodels/status: dead (404)
- GET /api/aimodels/sentiment-trends: dead (404)
- GET /api/aiorchestration/health: broken (500)
- GET /api/aiorchestration/performance-analytics: broken (500)
- GET /api/aisuperiority/swarm/status: broken (500)
- GET /api/aisuperiority/performance/comparison: broken (500)
- GET /api/aisuperiority/scenarios: broken (500)
- GET /api/aisuperiority/battalions: broken (500)
- GET /api/aiswarm/status: dead (501)
- GET /api/aiswarm/performance: dead (501)
- GET /api/aiswarm/workflows: dead (501)
- GET /api/atlas/gis/geocode: broken (500)
- GET /api/atlas/gis/spatial-query: broken (500)
- GET /api/levy/v1/banked-capacity: broken (400)
- GET /api/levy/budget/visualization: broken (500)
- GET /api/levy/budget/scenarios: broken (500)
- GET /api/calibrationmemo: dead (404)
- GET /api/costforge/data-quality/canonical: broken (400)
- GET /api/debug/canonical-counts: dead (404)
- GET /api/debug/sync-pop-2/pacs-table-columns: dead (404)
- GET /api/debug/pacs-counts: dead (404)
- GET /api/codex/collaboration/health: broken (500)
- GET /api/codex/notifications/history: dead (501)
- GET /api/codex/performance/system-wide: broken (500)
- GET /api/codex/performance/foundation: broken (500)
- GET /api/codex/performance/amplification: broken (500)
- GET /api/codex/performance/ultimate-power: broken (500)
- GET /api/codex/performance/alerts: broken (500)
- GET /api/codex/performance/metrics: broken (500)
- GET /api/codex/performance/cache/statistics: broken (500)
- GET /api/codex/performance/health: broken (500)
- GET /api/codex/reports/daily: broken (500)
- GET /api/codex/reports/weekly: broken (500)
- GET /api/codex/reports/monthly: broken (500)
- GET /api/codex/reports/quarterly: broken (500)
- GET /api/codex/reports/annual: broken (500)
- GET /api/collaboration/users: broken (500)
- GET /api/collaboration/teams: broken (500)
- GET /api/collaboration/projects: broken (500)
- GET /api/collaboration/metrics/teams: broken (500)
- GET /api/collaboration/metrics/tasks: broken (500)
- GET /api/compliance/dashboard: broken (500)
- GET /api/connectors/registry: dead (404)
- GET /api/connectors: broken (500)
- GET /api/ai/consciousness: dead (501)

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
