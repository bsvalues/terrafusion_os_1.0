# Backend Endpoint Contract Matrix

- Generated: 2026-06-02T04:04:11.444Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: e3c78e7ef151001c0a2b0f45d12bdd9c922b29da81daa9c5a7ee096b097c3c75

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | 1281 |
| Safe dev39 GET candidates | 388 |
| Static-only endpoints | 862 |
| Live dev39 probed endpoints | 419 |

## Classification Counts

| Classification | Count |
| --- | ---: |
| live | 269 |
| protected | 676 |
| broken | 48 |
| mock | 0 |
| dead | 172 |
| not_applicable | 104 |
| unknown | 12 |

## Method Counts

- GET: 782
- POST: 428
- PATCH: 21
- DELETE: 22
- PUT: 28

## Live Dev39 Broken/Dead Sample

- GET /api/aiassistant/health: broken (500)
- GET /api/aimodels/status: dead (404)
- GET /api/aimodels/sentiment-trends: dead (404)
- GET /api/aiswarm/status: dead (501)
- GET /api/aiswarm/performance: dead (501)
- GET /api/aiswarm/workflows: dead (501)
- GET /api/atlas/spatial: broken (503)
- GET /api/atlas/gis/geocode: dead (404)
- GET /api/levy/v1/banked-capacity: broken (400)
- GET /api/calibrationmemo: dead (404)
- GET /api/costforge/data-quality/canonical: broken (400)
- GET /api/debug/canonical-counts: dead (404)
- GET /api/debug/sync-pop-2/pacs-table-columns: dead (404)
- GET /api/debug/pacs-counts: dead (404)
- GET /api/codex/collaboration/health: broken (500)
- GET /api/compliance/dashboard: broken (500)
- GET /api/ai/consciousness: dead (501)
- GET /api/ai/consciousness/enhanced: dead (501)
- GET /api/ai/consciousness/system-status: dead (501)
- GET /api/ai/consciousness/status: dead (501)
- GET /api/costforge-test/status: dead (404)
- GET /api/costforge-test/metrics: dead (404)
- GET /api/costforge-test/agents/status: dead (404)
- GET /api/county-study/studies: broken (400)
- GET /api/dataimport/api/files: dead (404)
- GET /api/dataimport/api/import-history: dead (404)
- GET /api/dataquality/report: broken (500)
- GET /api/dataquality/issues: broken (500)
- GET /api/ecosystem/enhancement-modules: broken (500)
- GET /api/forge/cost/batch/preview: broken (503)
- GET /api/forge/cost/batch/history: broken (503)
- GET /api/gis/geocode: dead (404)
- GET /api/levy/glossary/terms: dead (501)
- GET /api/levy/glossary/categories: dead (501)
- GET /api/compliance/government/dashboard: dead (404)
- GET /api/compliance/certification: broken (503)
- GET /api/gpt/search: broken (400)
- GET /api/harrispacsenhancement/sessions: broken (500)
- GET /api/levy/historical/trends: broken (500)
- GET /api/levy/historical/anomalies: broken (500)
- GET /api/levy/audit/dashboard: broken (500)
- GET /api/levy/calculate: broken (400)
- GET /api/levy/data/districts: broken (500)
- GET /api/levy/v1/data-quality/district-risk-summary: broken (500)
- GET /api/levy/forecast/dashboard: broken (500)
- GET /api/levy/forecast/compare: broken (400)
- GET /api/levy/search/search: broken (400)
- GET /api/levy/search/autocomplete: broken (500)
- GET /api/migrationpathways/active: broken (500)
- GET /api/migrationpathways/health: broken (500)

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
