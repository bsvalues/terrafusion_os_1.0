#!/usr/bin/env python3
"""
TerraFusion OS - Legacy SQLite to PostgreSQL Bridge
Extracts data from terrafusionsync_real.db and POSTs to the new Data Pipeline
"""

import sqlite3
from pathlib import Path

import requests

# Configuration
LEGACY_DB = Path(__file__).parent / "terrafusionsync_real.db"
PIPELINE_URL = "http://localhost:5002/api/ingest"
BATCH_SIZE = 100


def extract_and_migrate():
    """Extract legacy data and push to new pipeline."""

    if not LEGACY_DB.exists():
        print(f"❌ Legacy database not found: {LEGACY_DB}")
        return

    print(f"🔍 Connecting to legacy database: {LEGACY_DB}")
    conn = sqlite3.connect(str(LEGACY_DB))
    conn.row_factory = sqlite3.Row  # Enable dict-like access
    cursor = conn.cursor()

    # Get table list
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"📋 Found tables: {tables}")

    # Try to extract properties
    property_tables = ["properties", "property", "parcels", "parcel"]
    found_table = None

    for table in property_tables:
        if table in tables:
            found_table = table
            break

    if not found_table:
        print("⚠️ No property table found. Checking first available table...")
        if tables:
            found_table = tables[0]

    if found_table:
        print(f"📊 Extracting from table: {found_table}")
        cursor.execute(f"SELECT * FROM {found_table} LIMIT 5")
        columns = [desc[0] for desc in cursor.description]
        print(f"   Columns: {columns}")

        # Get total count
        cursor.execute(f"SELECT COUNT(*) FROM {found_table}")
        total = cursor.fetchone()[0]
        print(f"   Total records: {total}")

        # Extract in batches
        offset = 0
        migrated = 0

        while offset < total:
            cursor.execute(
                f"SELECT * FROM {found_table} LIMIT {BATCH_SIZE} OFFSET {offset}"
            )
            rows = cursor.fetchall()

            if not rows:
                break

            # Convert to list of dicts
            records = []
            for row in rows:
                record = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert non-JSON-serializable types
                    if isinstance(value, bytes):
                        value = value.decode("utf-8", errors="ignore")
                    record[col] = value

                # Map to standard schema
                records.append(
                    {
                        "parcel_id": record.get("prop_id")
                        or record.get("geo_id")
                        or record.get("parcel_number")
                        or f"LEGACY-{offset + len(records)}",
                        "owner": record.get("owner_name")
                        or record.get("owner")
                        or "UNKNOWN",
                        "address": record.get("situs_display")
                        or record.get("property_address")
                        or "",
                        "value": record.get("market_value")
                        or record.get("assessed_value")
                        or 0,
                        "raw_legacy": record,  # Preserve all original data
                    }
                )

            # POST to pipeline
            payload = {"source": "legacy-sqlite-migration", "records": records}

            try:
                response = requests.post(PIPELINE_URL, json=payload, timeout=30)
                if response.status_code == 202:
                    migrated += len(records)
                    print(
                        f"   ✅ Migrated batch: {offset + 1}-{offset + len(records)} of {total}"
                    )
                else:
                    print(
                        f"   ❌ Failed batch: {response.status_code} - {response.text}"
                    )
            except Exception as e:
                print(f"   ❌ Error: {e}")

            offset += BATCH_SIZE

        print(f"\n🎉 Migration complete! Total records migrated: {migrated}")

    conn.close()


if __name__ == "__main__":
    extract_and_migrate()
