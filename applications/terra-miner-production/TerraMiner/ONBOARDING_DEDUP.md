# TerraMiner Deduplication Onboarding Guide

Welcome to the TerraMiner ETL deduplication system! This guide will help new team members understand, monitor, and tune the deduplication logic across Zillow, PACMLS, and ATTOM pipelines.

---

## 1. Overview
- **Purpose:** Prevent duplicate property records and maintain high data quality.
- **Techniques:**
  - **Normalization:** Canonicalizes addresses (case, punctuation, whitespace, ZIP).
  - **Strict Deduplication:** By unique keys (property_id, id, attomid, apn).
  - **Fuzzy Deduplication:** Uses address similarity (Levenshtein/rapidfuzz) and street number matching.
- **Parameterization:** Each ETL source has a configurable fuzzy deduplication threshold.

---

## 2. Monitoring Deduplication Rates
- **Metrics:** Each ETL run logs to `dedup_metrics.csv`:
  - Timestamp
  - Source (zillow, pacmls, attom)
  - Input count
  - Strict dedup count
  - Fuzzy dedup count
  - Threshold used
- **Dashboard:**
  - Run `python dedup_dashboard.py` and visit [http://localhost:5001](http://localhost:5001) to view deduplication rates and trends.
  - The dashboard shows the deduplication rate (fuzzy/strict) over time for each source.

---

## 3. Tuning Thresholds
- **Where:**
  - Zillow: `etl/zillow.py` (`fuzzy_threshold`, default 98)
  - PACMLS: `etl/pacmls_etl.py` (`fuzzy_threshold`, default 96)
  - ATTOM: `etl/attom_api_connector.py` (`fuzzy_threshold`, default 95)
- **How:**
  - Pass `fuzzy_threshold` in the ETL config or set as an attribute.
  - Lower threshold for messier data, raise for stricter matching.
- **Best Practices:**
  - Start with defaults, monitor dashboard, and adjust as needed.
  - Document threshold changes and rationale in code comments or docs.

---

## 4. Alerts and Anomalies
- **What to Watch:**
  - Sudden drops or spikes in deduplication rates.
  - Consistent trends away from expected rates.
- **Next Steps:**
  - Investigate data quality, normalization, or ETL changes.
  - Consider adjusting thresholds or normalization logic.
  - Add alerting logic (e.g., email/slack) to `dedup_dashboard.py` as needed.

---

## 5. Testing & Validation
- **Integration Tests:**
  - Located in `tests/` (see `test_etl_zillow_integration.py`, `test_etl_pacmls_integration.py`, `test_etl_attom_integration.py`).
  - Use mocks to simulate edge cases and validate deduplication logic.
- **How to Run:**
  - `python -m unittest discover tests`

---

## 6. Troubleshooting
- **Common Issues:**
  - No metrics in dashboard: Check ETL jobs are running and logging.
  - Test failures: Check for recent code changes or dependency issues.
  - Unexpected deduplication: Review normalization and threshold logic.

---

## 7. Resources
- `README.md`: Data quality and deduplication documentation.
- `dedup_dashboard.py`: Dashboard source code.
- `etl/data_validation.py`: Core normalization and deduplication utilities.
- Ask a senior team member or lead for help if stuck!

---

Welcome aboard, and happy deduplicating!
