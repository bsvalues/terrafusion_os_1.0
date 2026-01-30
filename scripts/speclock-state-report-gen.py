#!/usr/bin/env python3
"""
SpecLock State Report Generator
===============================
Generates state report schema with quorum validation from speclock.spec.json
"""

import argparse
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Generate state-report artifacts")
    parser.add_argument("--lock", required=True, help="Lock ID (e.g., statereport.v1)")
    parser.add_argument("--out", required=True, help="Output file path")
    args = parser.parse_args()

    out_path = Path(args.out)
    out_dir = out_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    artifact_name = out_path.name

    # Load spec to get report_types and quorum_config
    spec_path = Path(__file__).parent.parent / "docs" / "spec-lock" / "locks" / "state-report" / "state-report.v1" / "speclock.spec.json"
    spec = {}
    if spec_path.exists():
        with open(spec_path) as f:
            spec = json.load(f)

    report_types = spec.get("report_types", [
        "annual_assessment_summary", "levy_rate_comparison", "compliance_audit", "interop_certification"
    ])
    quorum_config = spec.get("quorum_config", {"threshold": 3, "total_participants": 5, "algorithm": "frost_ed25519"})

    # Generate state-report.schema.json - matches test expectations exactly
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "TerraFusion State Report",
        "description": "Federated state-level reports requiring county quorum signatures",
        "type": "object",
        "required": [
            "report_id",
            "report_type",
            "issued_at",
            "nbf",
            "exp",
            "county_set",
            "data_sha256",
            "signing"
        ],
        "properties": {
            "report_id": {
                "type": "string",
                "pattern": "^sr-[a-z0-9]{1,63}$",
                "description": "Unique state report identifier"
            },
            "report_type": {
                "type": "string",
                "enum": report_types,
                "description": "Type of state report"
            },
            "issued_at": {
                "type": "string",
                "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
                "description": "Timestamp when report was issued (RFC3339 UTC)"
            },
            "nbf": {
                "type": "string",
                "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
                "description": "Not-before timestamp (RFC3339 UTC)"
            },
            "exp": {
                "type": "string",
                "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
                "description": "Expiration timestamp (RFC3339 UTC)"
            },
            "period_start": {
                "type": "string",
                "format": "date",
                "description": "Report period start date"
            },
            "period_end": {
                "type": "string",
                "format": "date",
                "description": "Report period end date"
            },
            "county_set": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "string",
                    "description": "County ID included in report"
                },
                "description": "Set of counties included in report"
            },
            "aggregation_method": {
                "type": "string",
                "enum": ["sum", "average", "weighted_average", "merge"],
                "description": "Method used to aggregate county data"
            },
            "data_sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "SHA-256 hash of report data (lowercase hex)"
            },
            "signing": {
                "type": "object",
                "required": ["mode", "threshold", "participants", "group_pub_sha256", "signature_sha256"],
                "properties": {
                    "mode": {
                        "type": "string",
                        "enum": ["cosmic_tss", "state_quorum"],
                        "description": "Signing mode (cosmic_tss for state-level)"
                    },
                    "threshold": {
                        "type": "integer",
                        "minimum": quorum_config.get("threshold", 3),
                        "description": "Minimum signatures required"
                    },
                    "participants": {
                        "type": "array",
                        "minItems": quorum_config.get("threshold", 3),
                        "items": {
                            "type": "object",
                            "properties": {
                                "county_id": {"type": "string"},
                                "signed_at": {"type": "string"},
                                "signature_sha256": {
                                    "type": "string",
                                    "pattern": "^[a-f0-9]{64}$"
                                }
                            }
                        },
                        "description": "County participants in signing"
                    },
                    "group_pub_sha256": {
                        "type": "string",
                        "pattern": "^[a-f0-9]{64}$",
                        "description": "SHA-256 of group public key"
                    },
                    "signature_sha256": {
                        "type": "string",
                        "pattern": "^[a-f0-9]{64}$",
                        "description": "SHA-256 of final signature"
                    },
                    "proof_path": {
                        "type": "string",
                        "description": "Path to verification proof (optional)"
                    }
                }
            },
            "data": {
                "type": "object",
                "description": "Report data payload (optional)"
            }
        }
    }

    # Determine which artifact to generate based on output filename
    if "schema" in artifact_name:
        with open(out_path, "w") as f:
            json.dump(schema, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "openapi" in artifact_name:
        openapi = {
            "openapi": "3.0.3",
            "info": {"title": "State Report API", "version": "1.0.0"},
            "paths": {
                "/ops/state-reports": {
                    "get": {"summary": "List state reports", "responses": {"200": {"description": "OK"}}},
                    "post": {"summary": "Initiate state report", "responses": {"201": {"description": "Created"}}}
                },
                "/ops/state-reports/{reportId}": {
                    "get": {"summary": "Get state report", "responses": {"200": {"description": "OK"}}}
                },
                "/ops/state-reports/{reportId}/sign": {
                    "post": {"summary": "Add county signature", "responses": {"200": {"description": "Signed"}}}
                },
                "/ops/state-reports/{reportId}/quorum": {
                    "get": {"summary": "Check quorum status", "responses": {"200": {"description": "OK"}}}
                }
            }
        }
        with open(out_path, "w") as f:
            json.dump(openapi, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "quorum" in artifact_name:
        quorum_rules = {
            "version": "1.0.0",
            "defaultQuorum": {"percentage": 67, "minimum": 3},
            "reportTypeOverrides": {
                "budget": {"percentage": 75, "minimum": 5},
                "compliance": {"percentage": 80, "minimum": 10}
            },
            "signatureExpiry": "7d",
            "meshProofRequired": True
        }
        with open(out_path, "w") as f:
            json.dump(quorum_rules, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "template" in artifact_name:
        template = {
            "version": "1.0.0",
            "reportTypes": {
                "assessment-rollup": {
                    "title": "County Assessment Rollup",
                    "requiredFields": ["countyId", "assessmentYear", "totalParcels", "totalAssessedValue"],
                    "aggregations": ["sum", "count", "average"]
                },
                "compliance": {
                    "title": "Compliance Status Report",
                    "requiredFields": ["countyId", "complianceItems", "passRate"],
                    "aggregations": ["count", "percentage"]
                },
                "budget": {
                    "title": "Budget Summary Report",
                    "requiredFields": ["countyId", "fiscalYear", "allocations", "expenditures"],
                    "aggregations": ["sum", "delta"]
                }
            },
            "stateAggregation": {
                "method": "merge",
                "quorumValidation": True
            }
        }
        with open(out_path, "w") as f:
            json.dump(template, f, indent=2)
        print(f"✅ Generated: {out_path}")
    else:
        print(f"⚠️  Unknown artifact type: {artifact_name}")
        return 1

    print(f"\n✅ State Report artifact generated for {args.lock}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
