# Backend Endpoint Contract Matrix

- Generated: 2026-06-02T02:22:12.458Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: fe49fedf1127411a612158ece99065301ca1d309ddf6e9dc60a28757af601696

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | 1281 |
| Safe dev39 GET candidates | 424 |
| Static-only endpoints | 829 |
| Live dev39 probed endpoints | 452 |

## Classification Counts

| Classification | Count |
| --- | ---: |
| live | 275 |
| protected | 696 |
| broken | 77 |
| mock | 0 |
| dead | 152 |
| not_applicable | 62 |
| unknown | 19 |

## Method Counts

- GET: 782
- POST: 428
- PATCH: 21
- DELETE: 22
- PUT: 28

## Live Dev39 Broken/Dead Sample

- GET /api/aimodels/status: dead (404)
- GET /api/aimodels/sentiment-trends: dead (404)
- GET /api/aiorchestration/health: broken (500)
- GET /api/aiorchestration/performance-analytics: broken (500)
- GET /api/aiswarm/status: dead (501)
- GET /api/aiswarm/performance: dead (501)
- GET /api/aiswarm/workflows: dead (501)
- GET /api/atlas/spatial: broken (503)
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
- GET /api/ai/consciousness: dead (501)
- GET /api/ai/consciousness/enhanced: dead (501)
- GET /api/ai/consciousness/system-status: dead (501)
- GET /api/ai/consciousness/status: dead (501)
- GET /api/costforge/matrix: broken (400)
- GET /api/costforge/neighborhoods: broken (503)
- GET /api/costforge/traces: broken (400)
- GET /api/costforge-test/status: dead (404)
- GET /api/costforge-test/metrics: dead (404)
- GET /api/costforge-test/agents/status: dead (404)
- GET /api/county-study/studies: broken (400)
- GET /api/dataimport/api/files: dead (404)
- GET /api/dataimport/api/import-history: dead (404)
- GET /api/dataquality/report: broken (500)
- GET /api/dataquality/issues: broken (500)
- GET /api/sync/doctrine/state: broken (0)
- GET /api/sync/doctrine/lanes: broken (0)
- GET /api/ecosystem/enhancement-modules: broken (500)
- GET /api/equity/metrics: broken (400)
- GET /api/equity/rollup: broken (400)
- GET /api/forge/cost/batch/preview: broken (503)
- GET /api/forge/cost/batch/history: broken (503)
- GET /api/gis/geocode: broken (500)
- GET /api/gis/parcels/spatial: broken (500)
- GET /api/gis/layers: broken (500)
- GET /api/gis/proximity: broken (500)
- GET /api/levy/glossary/terms: dead (501)
- GET /api/levy/glossary/categories: dead (501)
- GET /api/compliance/certification: broken (503)
- GET /api/gpt/search: broken (400)
- GET /api/harrispacsenhancement/sessions: broken (500)

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
