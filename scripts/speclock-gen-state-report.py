#!/usr/bin/env python3
"""
StateReportLock Generator

Generates:
  - docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json
  - docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.template.json

Deterministic output (sorted keys, consistent formatting).
"""

import json
from pathlib import Path

LOCK_DIR = Path("docs/spec-lock/locks/state-report/state-report.v1")
OUT_SCHEMA = LOCK_DIR / "generated/state-report.schema.json"
OUT_TEMPLATE = LOCK_DIR / "generated/state-report.template.json"


def main():
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "TerraFusion State Report v1",
        "type": "object",
        "required": [
            "report_id",
            "report_type",
            "issued_at",
            "nbf",
            "exp",
            "county_set",
            "data_sha256",
            "speclock_manifest_sha256",
            "signing"
        ],
        "properties": {
            "report_id": {"type": "string"},
            "report_type": {
                "type": "string",
                "enum": ["levy_summary", "assessment_roll_summary", "ops_health", "other"]
            },
            "issued_at": {"type": "string"},
            "nbf": {"type": "string"},
            "exp": {"type": "string"},
            "county_set": {"type": "array", "items": {"type": "string"}},
            "data_sha256": {"type": "string"},
            "speclock_manifest_sha256": {"type": "string"},
            "signing": {
                "type": "object",
                "required": ["mode", "group_pub_sha256", "signature_sha256", "participants_used"],
                "properties": {
                    "mode": {"type": "string", "enum": ["cosmic_tss"]},
                    "group_pub_sha256": {"type": "string"},
                    "signature_sha256": {"type": "string"},
                    "participants_used": {"type": "array", "items": {"type": "integer"}}
                },
                "additionalProperties": False
            }
        },
        "additionalProperties": False
    }

    template = {
        "report_id": "state_report_0001",
        "report_type": "ops_health",
        "issued_at": "2025-12-13T00:00:00Z",
        "nbf": "2025-12-13T00:00:00Z",
        "exp": "2026-01-13T00:00:00Z",
        "county_set": ["county_a", "county_b", "county_c"],
        "data_sha256": "0" * 64,
        "speclock_manifest_sha256": "0" * 64,
        "signing": {
            "mode": "cosmic_tss",
            "group_pub_sha256": "0" * 64,
            "signature_sha256": "0" * 64,
            "participants_used": [1, 2, 3]
        }
    }

    OUT_SCHEMA.parent.mkdir(parents=True, exist_ok=True)
    OUT_SCHEMA.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    OUT_TEMPLATE.write_text(json.dumps(template, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"✅ Wrote {OUT_SCHEMA}")
    print(f"✅ Wrote {OUT_TEMPLATE}")


if __name__ == "__main__":
    main()
