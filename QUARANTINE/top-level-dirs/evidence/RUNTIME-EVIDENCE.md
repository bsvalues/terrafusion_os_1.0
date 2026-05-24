# TerraForge Runtime Production Evidence

**Date:** 2026-05-23  
**Environment:** Ubuntu 22.04 / Node.js 22.13.0 / Vite 7.3.3 / Vitest  
**Branch:** main (post PR #851 + #852)

---

## 1. Frontend Runtime — All 9 Module Pages

The TerraForge SPA was built with `vite build` (production mode) and served via static server. All 9 pages render correctly with full navigation, form controls, and interactive elements.

| # | Page | Route | Status | Screenshot |
|---|------|-------|--------|------------|
| 1 | Ratio Study | `/ratio-study` | RENDERS | `screenshots/01-ratio-study.webp` |
| 2 | Comparable Sales | `/comps` | RENDERS | `screenshots/02-comps.webp` |
| 3 | Sale Qualification | `/sale-qualification` | RENDERS | `screenshots/03-sale-qualification.webp` |
| 4 | OLS Regression | `/regression` | RENDERS | `screenshots/04-regression.webp` |
| 5 | Cost Approach | `/cost-schedules` | RENDERS | `screenshots/05-cost-schedules.webp` |
| 6 | Levy Rates | `/levy` | RENDERS | `screenshots/06-levy.webp` |
| 7 | Current Use Program | `/current-use` | RENDERS | `screenshots/07-current-use.webp` |
| 8 | Interest Rates | `/current-use/interest` | RENDERS | `screenshots/08-interest-rates.webp` |
| 9 | Removals & Exceptions | `/current-use/removals` | RENDERS | `screenshots/09-removals-exceptions.webp` |

**Note:** "SyntaxError: Unexpected token '<'" errors are expected — the frontend attempts to fetch JSON from `/api/*` endpoints which are not running in this static-only test. The UI gracefully displays the error and remains fully functional. When the .NET backend is running, these resolve to live data.

---

## 2. Report Engine — 4 Report Types Generated

All 4 official report types generated successfully with SHA-256 audit hashes:

| Report Type | Size | SHA-256 (prefix) | Screenshot |
|-------------|------|-------------------|------------|
| Rollback Notice (RCW 84.34.108) | 7,345 bytes | `3c6eb9195205ba69` | `screenshots/10-report-rollback-notice.webp` |
| Levy Certification (RCW 84.52.070) | 3,227 bytes | `8183883ca869209c` | `screenshots/11-report-levy-certification.webp` |
| Cost Valuation (IAAO) | 4,895 bytes | `18b69834c6eef2ee` | `screenshots/12-report-cost-valuation.webp` |
| Ratio Study (IAAO) | 3,509 bytes | `efab0abfd0d42f60` | `screenshots/13-report-ratio-study.webp` |

---

## 3. Test Suite Results

### Node.js Report Engine Tests (22/22 passing)

```
# tests 22
# suites 3
# pass 22
# fail 0
# duration_ms 1006.318808
```

### Vitest Frontend Contract Tests (620/620 passing)

```
Test Files  34 passed (34)
     Tests  620 passed (620)
  Duration  13.35s
```

---

## 4. Production Build Metrics

```
vite v7.3.3 building client environment for production...
✓ 43 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.29 kB
dist/assets/index-DJYgtXp-.css    3.88 kB │ gzip:  1.28 kB
dist/assets/index-2j7h1YdI.js   325.87 kB │ gzip: 88.60 kB
✓ built in 1.91s
```

**Total bundle:** 330.21 kB (90.17 kB gzipped)

---

## 5. Architecture Verification

- **SPA Routing:** React Router with 7 top-level routes + 3 nested routes
- **Design System:** Consistent dark theme, responsive layout, accessible form controls
- **Navigation:** Full nav bar with active state highlighting
- **Error Handling:** Graceful error display when backend unavailable
- **Export Controls:** CSV download buttons on all data pages
- **Report Downloads:** PDF/HTML report generation buttons on calculator pages
- **Legal Compliance:** RCW citations throughout (84.33, 84.34, 84.52, 84.55)
- **IAAO Standards:** COD, PRD, PRB metrics with compliance thresholds

---

## 6. Evidence Artifacts

```
evidence/
├── RUNTIME-EVIDENCE.md          (this file)
├── generate-samples.mjs         (report generation script)
├── report-generation-output.txt (generation log with hashes)
├── test-results-reports.txt     (Node.js test output)
├── vitest-results.txt           (Vitest 620-test output)
├── sample-rollback-notice.html  (generated report)
├── sample-levy-certification.html
├── sample-cost-valuation.html
├── sample-ratio-study.html
└── screenshots/
    ├── 01-ratio-study.webp
    ├── 02-comps.webp
    ├── 03-sale-qualification.webp
    ├── 04-regression.webp
    ├── 05-cost-schedules.webp
    ├── 06-levy.webp
    ├── 07-current-use.webp
    ├── 08-interest-rates.webp
    ├── 09-removals-exceptions.webp
    ├── 10-report-rollback-notice.webp
    ├── 11-report-levy-certification.webp
    ├── 12-report-cost-valuation.webp
    └── 13-report-ratio-study.webp
```
