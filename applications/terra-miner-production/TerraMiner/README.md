# TerraMiner ETL Data Quality Enhancements

## Overview
This document outlines the latest enhancements to TerraMiner's ETL pipelines for real estate data ingestion, focusing on advanced deduplication and normalization strategies to ensure high data quality across all sources (Zillow, PACMLS, ATTOM).

## Enhanced Normalization
- **String Normalization:**
  - Removes punctuation, unifies whitespace, and applies canonical casing (title case).
- **Address Normalization:**
  - Normalizes all address fields (street, city, state, zip).
  - State is uppercased, ZIP is truncated to 5 digits.

## Deduplication Strategies
- **Strict Deduplication:**
  - Uses unique property keys (e.g., `property_id`, `id`, `attomid`, `apn`) to remove exact duplicates.
- **Fuzzy Deduplication:**
  - Uses address similarity (Levenshtein distance via `rapidfuzz`) to catch near-duplicates (e.g., "123 Main St" vs. "123 Main Street").
  - Deduplication is strict with street numbers: "123 Main St" and "124 Main St" are NOT merged.
  - Applied after strict deduplication in all ETL batch and search jobs.

## Per-Source Fuzzy Deduplication Thresholds
Each ETL pipeline supports a configurable fuzzy deduplication threshold to balance data quality and false positive/negative rates:

- **Zillow ETL** (`etl/zillow.py`): `fuzzy_threshold` (default: 98)
- **PACMLS ETL** (`etl/pacmls_etl.py`): `fuzzy_threshold` (default: 96)
- **ATTOM ETL** (`etl/attom_api_connector.py`): `fuzzy_threshold` (default: 95)

#### How to Adjust Thresholds
- Pass `fuzzy_threshold` in the ETL config (e.g., `ZillowPropertySearchETL(config={..., 'fuzzy_threshold': 97})`)
- Lower the threshold for messier data sources to catch more near-duplicates; raise it for stricter matching
- Defaults are tuned for production but can be adjusted as needed

#### Validating Thresholds
- Use integration tests in `tests/` to simulate real-world and edge-case scenarios
- Tests demonstrate deduplication behavior at various thresholds for each source
- Mocks are used in tests to ensure repeatability and isolation from external APIs

## Integration Points
- **Zillow ETL:**
  - Deduplication by `property_id`, then fuzzy deduplication by address.
- **PACMLS ETL:**
  - Deduplication by `id`, then fuzzy deduplication by address.
- **ATTOM Connector:**
  - Deduplication by best available key, then fuzzy deduplication by address.

## Usage Guide
- All deduplication and normalization utilities are in `etl/data_validation.py`.
- Fuzzy deduplication can be tuned by adjusting the similarity threshold (default: 98).
- Unit tests for all utilities are in `tests/test_data_validation.py`.

## Best Practices
- Always apply strict deduplication before fuzzy deduplication.
- Normalize data before deduplication for best results.
- Review and tune thresholds for your data sources as needed.
- Tune fuzzy deduplication thresholds based on data quality and source characteristics
- Monitor for false positives/negatives and adjust thresholds as needed
- Use integration tests with mocks to validate deduplication logic and threshold effects
- Document threshold changes and rationale for future reference

## Example
```python
from etl.data_validation import deduplicate_records, fuzzy_deduplicate_records

deduped = deduplicate_records(records, ["property_id"])
fuzzy_deduped = fuzzy_deduplicate_records(deduped, address_field="address", threshold=98)
```

## Changelog
- 2025-06-13: Added fuzzy deduplication and enhanced normalization to all ETL jobs. Updated tests and documentation.
