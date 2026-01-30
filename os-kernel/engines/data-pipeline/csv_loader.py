#!/usr/bin/env python3
"""
TerraFusion OS - CSV Data Loader
Reads CSV files and POSTs to the Data Pipeline
"""

import argparse
import csv
from pathlib import Path

import requests

# Configuration
PIPELINE_URL = "http://localhost:5002/api/ingest"
BATCH_SIZE = 100


def load_csv(
    filepath: str, parcel_col: str = None, owner_col: str = None, value_col: str = None
):
    """Load CSV and ingest into pipeline."""

    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        return

    print(f"📂 Loading CSV: {filepath}")

    records = []
    total = 0
    ingested = 0

    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames
        print(f"   Columns: {columns}")

        # Auto-detect column mappings if not specified
        parcel_col = parcel_col or next(
            (
                c
                for c in columns
                if "parcel" in c.lower() or "prop" in c.lower() or "id" in c.lower()
            ),
            columns[0],
        )
        owner_col = owner_col or next(
            (c for c in columns if "owner" in c.lower() or "name" in c.lower()), None
        )
        value_col = value_col or next(
            (
                c
                for c in columns
                if "value" in c.lower() or "price" in c.lower() or "amount" in c.lower()
            ),
            None,
        )

        print(f"   Mapping: parcel={parcel_col}, owner={owner_col}, value={value_col}")

        for row in reader:
            total += 1

            record = {
                "parcel_id": row.get(parcel_col, f"CSV-{total}"),
                "owner": row.get(owner_col, "UNKNOWN") if owner_col else "UNKNOWN",
                "value": float(row.get(value_col, 0))
                if value_col and row.get(value_col)
                else 0,
                "raw_data": row,  # Preserve all CSV columns
            }
            records.append(record)

            # Send batch
            if len(records) >= BATCH_SIZE:
                payload = {"source": f"csv:{path.name}", "records": records}
                try:
                    response = requests.post(PIPELINE_URL, json=payload, timeout=30)
                    if response.status_code == 202:
                        ingested += len(records)
                        print(f"   ✅ Batch: {ingested}/{total}")
                except Exception as e:
                    print(f"   ❌ Error: {e}")
                records = []

    # Final batch
    if records:
        payload = {"source": f"csv:{path.name}", "records": records}
        try:
            response = requests.post(PIPELINE_URL, json=payload, timeout=30)
            if response.status_code == 202:
                ingested += len(records)
        except:
            pass

    print("\n🎉 CSV load complete!")
    print(f"   Total rows: {total}")
    print(f"   Ingested: {ingested}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load CSV into TerraFusion Pipeline")
    parser.add_argument("filepath", help="Path to CSV file")
    parser.add_argument("--parcel", help="Column name for parcel ID")
    parser.add_argument("--owner", help="Column name for owner")
    parser.add_argument("--value", help="Column name for value")

    args = parser.parse_args()
    load_csv(args.filepath, args.parcel, args.owner, args.value)
