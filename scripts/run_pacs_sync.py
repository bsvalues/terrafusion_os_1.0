#!/usr/bin/env python3
"""
TFT-183: Standalone PACS sync execution script.

Connects to PACS SQL Server, extracts property/sales/ownership data,
validates, and loads to TerraFusion DB.

canon-sync = synchronization, connectors, orchestration. No appraisal math.

Usage:
    python scripts/run_pacs_sync.py \
        --connection-string "Driver={ODBC Driver 17 for SQL Server};Server=..." \
        --tables property,sales,ownership \
        --mode full \
        --dry-run
"""

import argparse
import json
import logging
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("pacs_sync")

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

VALID_TABLES = {"property", "sales", "ownership"}
VALID_MODES = {"full", "delta"}


@dataclass
class SyncStats:
    table: str = ""
    records_read: int = 0
    records_inserted: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    records_failed: int = 0
    errors: list[str] = field(default_factory=list)
    started_at: str = ""
    completed_at: str = ""
    duration_seconds: float = 0.0


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def validate_parcel_id(pid: Any) -> list[str]:
    """Basic parcel-id validation. Returns list of error messages."""
    errors = []
    if not pid:
        errors.append("parcel_id is empty")
        return errors
    s = str(pid).strip()
    if len(s) < 5:
        errors.append(f"parcel_id '{s}' too short")
    if len(s) > 30:
        errors.append(f"parcel_id '{s}' too long")
    return errors


def validate_record(table: str, row: dict[str, Any]) -> list[str]:
    """Run lightweight validation on a row before loading."""
    errors = validate_parcel_id(row.get("parcel_id") or row.get("ParcelID"))

    if table == "sales":
        price = row.get("sale_price") or row.get("SalePrice")
        if price is not None:
            try:
                if float(price) < 0:
                    errors.append("sale_price is negative")
            except (TypeError, ValueError):
                errors.append("sale_price is not numeric")

    return errors


# ---------------------------------------------------------------------------
# PACS connector (stub – replace with real pyodbc calls)
# ---------------------------------------------------------------------------

def connect_pacs(connection_string: str):
    """
    Connect to PACS SQL Server.
    In production, uses pyodbc. This stub validates the connection string.
    """
    if not connection_string:
        raise ValueError("connection-string is required")

    try:
        import pyodbc  # noqa: F401
        log.info("pyodbc available; connecting to PACS...")
        conn = pyodbc.connect(connection_string, timeout=30)
        log.info("Connected to PACS SQL Server.")
        return conn
    except ImportError:
        log.warning("pyodbc not installed. Running in stub mode (no real connection).")
        return None


def extract_table(conn, table: str, mode: str) -> list[dict[str, Any]]:
    """
    Extract rows from a PACS table.
    In stub mode, returns an empty list.
    """
    if conn is None:
        log.info(f"[stub] Would extract '{table}' in {mode} mode.")
        return []

    query_map = {
        "property": "SELECT * FROM dbo.Property",
        "sales": "SELECT * FROM dbo.Sales",
        "ownership": "SELECT * FROM dbo.Ownership",
    }

    base_query = query_map.get(table)
    if not base_query:
        raise ValueError(f"Unknown table: {table}")

    if mode == "delta":
        base_query += " WHERE ModifiedDate > DATEADD(day, -1, GETDATE())"

    cursor = conn.cursor()
    cursor.execute(base_query)
    columns = [desc[0] for desc in cursor.description]
    rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
    log.info(f"Extracted {len(rows)} rows from {table}.")
    return rows


# ---------------------------------------------------------------------------
# Load (stub – replace with real DB insert/upsert)
# ---------------------------------------------------------------------------

def load_records(
    table: str, records: list[dict[str, Any]], dry_run: bool
) -> SyncStats:
    """Validate and load records into TerraFusion DB."""
    stats = SyncStats(
        table=table,
        started_at=datetime.now(timezone.utc).isoformat(),
    )

    for row in records:
        stats.records_read += 1
        errs = validate_record(table, row)
        if errs:
            stats.records_failed += 1
            stats.errors.extend(errs[:3])  # cap stored errors
            continue

        if dry_run:
            stats.records_skipped += 1
        else:
            # In production: upsert into TerraFusion tables
            stats.records_inserted += 1

    stats.completed_at = datetime.now(timezone.utc).isoformat()
    t0 = datetime.fromisoformat(stats.started_at)
    t1 = datetime.fromisoformat(stats.completed_at)
    stats.duration_seconds = (t1 - t0).total_seconds()
    return stats


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="PACS sync execution script")
    parser.add_argument(
        "--connection-string",
        required=True,
        help="ODBC connection string for PACS SQL Server",
    )
    parser.add_argument(
        "--tables",
        default="property,sales,ownership",
        help=f"Comma-separated tables to sync. Valid: {', '.join(sorted(VALID_TABLES))}",
    )
    parser.add_argument(
        "--mode",
        choices=sorted(VALID_MODES),
        default="full",
        help="Sync mode: full (all records) or delta (recent changes)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate without writing to the database",
    )
    args = parser.parse_args()

    tables = [t.strip().lower() for t in args.tables.split(",") if t.strip()]
    unknown = set(tables) - VALID_TABLES
    if unknown:
        log.error(f"Unknown tables: {unknown}")
        return 1

    log.info(f"PACS Sync: tables={tables}, mode={args.mode}, dry_run={args.dry_run}")

    conn = connect_pacs(args.connection_string)

    all_stats: list[SyncStats] = []
    overall_ok = True

    for table in tables:
        log.info(f"--- Syncing table: {table} ---")
        try:
            rows = extract_table(conn, table, args.mode)
            stats = load_records(table, rows, dry_run=args.dry_run)
            all_stats.append(stats)

            log.info(
                f"  read={stats.records_read} inserted={stats.records_inserted} "
                f"updated={stats.records_updated} skipped={stats.records_skipped} "
                f"failed={stats.records_failed} duration={stats.duration_seconds:.2f}s"
            )
            if stats.records_failed > 0:
                overall_ok = False
        except Exception as exc:
            log.error(f"Failed to sync table {table}: {exc}")
            overall_ok = False

    if conn is not None:
        conn.close()

    # Print summary as JSON
    summary = {
        "sync_type": "pacs",
        "mode": args.mode,
        "dry_run": args.dry_run,
        "tables": [asdict(s) for s in all_stats],
        "overall_success": overall_ok,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    print(json.dumps(summary, indent=2))

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
