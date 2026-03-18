#!/usr/bin/env python3
"""
TFT-194: Data pipeline execution script.

Orchestrates extract-transform-load for configured data sources.
canon-sync = synchronization, connectors, orchestration. No appraisal math.

Usage:
    python scripts/run_data_pipeline.py \
        --pipeline property_sync \
        --source pacs_benton \
        --output-dir ./output \
        --validate-only
"""

import argparse
import json
import logging
import os
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("data_pipeline")

# ---------------------------------------------------------------------------
# Pipeline configuration
# ---------------------------------------------------------------------------

PIPELINES: dict[str, dict[str, Any]] = {
    "property_sync": {
        "description": "Sync property records from PACS to TerraFusion",
        "steps": ["extract", "transform", "validate", "load"],
        "default_source": "pacs_benton",
    },
    "sales_sync": {
        "description": "Sync sales records from PACS to TerraFusion",
        "steps": ["extract", "transform", "validate", "load"],
        "default_source": "pacs_benton",
    },
    "csv_import": {
        "description": "Import data from CSV files",
        "steps": ["extract", "validate", "load"],
        "default_source": "csv_upload",
    },
    "excel_import": {
        "description": "Import data from Excel workbooks",
        "steps": ["extract", "transform", "validate", "load"],
        "default_source": "excel_upload",
    },
}


@dataclass
class StepResult:
    step: str
    status: str = "pending"  # pending, running, completed, failed, skipped
    records_in: int = 0
    records_out: int = 0
    errors: list[str] = field(default_factory=list)
    duration_seconds: float = 0.0


@dataclass
class PipelineResult:
    pipeline: str
    source: str
    validate_only: bool
    steps: list[StepResult] = field(default_factory=list)
    overall_status: str = "pending"
    started_at: str = ""
    completed_at: str = ""


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------

def step_extract(source: str, output_dir: Path) -> StepResult:
    """Extract data from source."""
    result = StepResult(step="extract")
    log.info(f"Extracting from source: {source}")

    # In production: connect to source and read records.
    # For now, check if the output directory exists and is writable.
    output_dir.mkdir(parents=True, exist_ok=True)

    result.status = "completed"
    result.records_out = 0  # Real implementation populates this
    log.info(f"Extract completed: {result.records_out} records")
    return result


def step_transform(records_in: int) -> StepResult:
    """Apply transformations to extracted data."""
    result = StepResult(step="transform", records_in=records_in)
    log.info("Applying transformations...")

    # Transformation logic: field renaming, type coercion, normalization
    result.records_out = records_in
    result.status = "completed"
    log.info(f"Transform completed: {result.records_out} records")
    return result


def step_validate(records_in: int) -> StepResult:
    """Validate records against quality rules."""
    result = StepResult(step="validate", records_in=records_in)
    log.info("Validating records...")

    # In production: run validation rules from validationService equivalent
    result.records_out = records_in
    result.status = "completed"
    log.info(f"Validate completed: {result.records_out} records passed")
    return result


def step_load(records_in: int, validate_only: bool) -> StepResult:
    """Load validated records into TerraFusion database."""
    result = StepResult(step="load", records_in=records_in)

    if validate_only:
        log.info("Validate-only mode; skipping load.")
        result.status = "skipped"
        result.records_out = 0
        return result

    log.info("Loading records into TerraFusion DB...")
    # In production: insert/upsert into database
    result.records_out = records_in
    result.status = "completed"
    log.info(f"Load completed: {result.records_out} records loaded")
    return result


STEP_FUNCTIONS = {
    "extract": None,  # handled separately (needs source + output_dir)
    "transform": step_transform,
    "validate": step_validate,
    "load": None,  # handled separately (needs validate_only flag)
}


# ---------------------------------------------------------------------------
# Pipeline runner
# ---------------------------------------------------------------------------

def run_pipeline(
    pipeline_name: str,
    source: str,
    output_dir: Path,
    validate_only: bool,
) -> PipelineResult:
    """Execute a named pipeline."""
    config = PIPELINES.get(pipeline_name)
    if not config:
        raise ValueError(
            f"Unknown pipeline: {pipeline_name}. "
            f"Available: {', '.join(sorted(PIPELINES))}"
        )

    result = PipelineResult(
        pipeline=pipeline_name,
        source=source,
        validate_only=validate_only,
        started_at=datetime.now(timezone.utc).isoformat(),
    )

    log.info(f"Running pipeline '{pipeline_name}' from source '{source}'")
    log.info(f"Steps: {config['steps']}")

    records_count = 0

    for step_name in config["steps"]:
        try:
            if step_name == "extract":
                sr = step_extract(source, output_dir)
            elif step_name == "load":
                sr = step_load(records_count, validate_only)
            else:
                fn = STEP_FUNCTIONS.get(step_name)
                if fn is None:
                    log.warning(f"Unknown step: {step_name}, skipping")
                    sr = StepResult(step=step_name, status="skipped")
                else:
                    sr = fn(records_count)

            records_count = sr.records_out
            result.steps.append(sr)

            if sr.status == "failed":
                log.error(f"Step '{step_name}' failed: {sr.errors}")
                result.overall_status = "failed"
                break
        except Exception as exc:
            sr = StepResult(step=step_name, status="failed", errors=[str(exc)])
            result.steps.append(sr)
            result.overall_status = "failed"
            log.error(f"Step '{step_name}' raised exception: {exc}")
            break
    else:
        result.overall_status = "completed"

    result.completed_at = datetime.now(timezone.utc).isoformat()
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Data pipeline execution script")
    parser.add_argument(
        "--pipeline",
        required=True,
        help=f"Pipeline name. Available: {', '.join(sorted(PIPELINES))}",
    )
    parser.add_argument(
        "--source",
        default=None,
        help="Data source name (overrides pipeline default)",
    )
    parser.add_argument(
        "--output-dir",
        default="./output/pipeline",
        help="Directory for pipeline artifacts",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Run extract, transform, and validate steps without loading",
    )
    args = parser.parse_args()

    config = PIPELINES.get(args.pipeline)
    if not config:
        log.error(f"Unknown pipeline: {args.pipeline}")
        log.info(f"Available pipelines: {', '.join(sorted(PIPELINES))}")
        return 1

    source = args.source or config.get("default_source", "unknown")
    output_dir = Path(args.output_dir)

    result = run_pipeline(args.pipeline, source, output_dir, args.validate_only)

    summary = asdict(result)
    print(json.dumps(summary, indent=2))

    return 0 if result.overall_status == "completed" else 1


if __name__ == "__main__":
    sys.exit(main())
