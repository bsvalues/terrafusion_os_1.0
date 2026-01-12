# Data Ingestion Pipeline

## Overview
This service handles the ingestion of parcel and property data into the TerraFusion OS Kernel.

## Ingestion Tools

### 1. Synthetic Data Generator (`synthetic_generator.py`)
Generates realistic Benton County property data for stress testing.
- **Usage:** `python synthetic_generator.py`
- **Output:** Ingests 1000 records (configurable) into the pipeline.

### 2. Legacy Bridge (`legacy_bridge.py`)
Migrates data from the legacy `terrafusionsync_real.db` SQLite database.
- **Usage:** Put `terrafusionsync_real.db` in this directory and run `python legacy_bridge.py`.

### 3. CSV Loader (`csv_loader.py`)
Loads arbitrary CSV files.
- **Usage:** `python csv_loader.py path/to/file.csv --parcel "Parcel ID" --owner "Owner Name" --value "Assessed Value"`

## API Endpoints
- `POST /api/ingest`: Accepts JSON payload with `records` array.
- `GET /api/ingest/stats`: Returns current ingestion statistics.
