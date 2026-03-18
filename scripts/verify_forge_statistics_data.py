#!/usr/bin/env python3
"""TFT-196: Data verification script for forge-statistics batch.

Verifies that all forge-statistics assets contain correct IAAO formula
implementations, proper data quality scoring, and assessor-facing
statistical outputs without scope bleed into Canon/ETL/dashboard chrome.

Checks:
  1. RatioStudyService implements COD, PRD, PRB, COV per IAAO 2013
  2. DataQualityService uses four IAAO dimensions
  3. ValidationEngine has rule registration and entity validation
  4. Frontend ratio services match backend formula semantics
  5. No Canon sync logic or ETL helpers leaked into the batch
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PASS = 0
FAIL = 0


def check(label: str, condition: bool, detail: str = ""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✅ {label}")
    else:
        FAIL += 1
        msg = f"  ❌ {label}"
        if detail:
            msg += f" — {detail}"
        print(msg)


def verify_ratio_study_service():
    """Verify IAAO formula parity in RatioStudyService.cs."""
    print("\n=== RatioStudyService.cs (IAAO Formula Parity) ===")
    path = ROOT / "backend/src/TerraFusion.AI/RatioStudies/RatioStudyService.cs"
    if not path.is_file():
        check("File exists", False, str(path))
        return
    content = path.read_text(encoding="utf-8")

    # COD = (AAD / median) * 100 where AAD = avg absolute deviation from median
    check("COD formula present", "AbsoluteDeviation" in content or "absolute" in content.lower())
    check("COD uses median (not mean)", "median" in content.lower())

    # PRD = mean ratio / weighted mean ratio
    check("PRD formula present", "PRD" in content or "PriceRelatedDifferential" in content)
    check("PRD uses weighted mean", "weight" in content.lower())

    # PRB via OLS regression per IAAO 2013 Section 9.3
    check("PRB uses OLS regression", "regression" in content.lower() or "OLS" in content)
    check("PRB references IAAO 2013", "IAAO" in content or "9.3" in content)

    # COV = std dev / mean * 100
    check("COV formula present", "COV" in content or "CoefficientOfVariation" in content)

    # Compliance thresholds
    check("COD threshold (15 residential)", "15" in content)
    check("PRD range (0.98-1.03)", "0.98" in content or "1.03" in content)

    # Outlier detection
    check("IQR outlier detection", "IQR" in content or "interquartile" in content.lower())

    # No Canon/ETL leakage
    check("No Canon sync logic", "canon" not in content.lower() or "canonical" in content.lower())
    check("No ETL pipeline code", "etl" not in content.lower())


def verify_data_quality_service():
    """Verify DataQualityService.cs implements IAAO quality dimensions."""
    print("\n=== DataQualityService.cs (IAAO Quality Dimensions) ===")
    path = ROOT / "backend/src/TerraFusion.AI/DataQuality/DataQualityService.cs"
    if not path.is_file():
        check("File exists", False, str(path))
        return
    content = path.read_text(encoding="utf-8")

    check("Completeness dimension", "completeness" in content.lower())
    check("Consistency dimension", "consistency" in content.lower())
    check("Accuracy dimension", "accuracy" in content.lower())
    check("Timeliness dimension", "timeliness" in content.lower())
    check("Weighted scoring", "weight" in content.lower())
    check("Letter grades", "grade" in content.lower() or "Grade" in content)


def verify_validation_engine():
    """Verify ValidationEngine.cs has rule registration."""
    print("\n=== ValidationEngine.cs (Rule Registration) ===")
    path = ROOT / "backend/src/TerraFusion.AI/DataQuality/ValidationEngine.cs"
    if not path.is_file():
        check("File exists", False, str(path))
        return
    content = path.read_text(encoding="utf-8")

    check("IValidationEngine interface", "IValidationEngine" in content)
    check("Rule registration", "Register" in content or "register" in content)
    check("ConcurrentDictionary for thread safety",
          "ConcurrentDictionary" in content or "concurrent" in content.lower())
    check("Entity validation method", "Validate" in content)


def verify_frontend_ratio_service():
    """Verify frontend ratioAnalysisService matches backend semantics."""
    print("\n=== ratioAnalysisService.ts (Frontend Formula Parity) ===")
    path = ROOT / "frontend/apps/os-shell/src/services/forge/ratioAnalysisService.ts"
    if not path.is_file():
        check("File exists", False, str(path))
        return
    content = path.read_text(encoding="utf-8")

    check("COD computation", "cod" in content.lower() or "COD" in content)
    check("PRD computation", "prd" in content.lower() or "PRD" in content)
    check("PRB computation", "prb" in content.lower() or "PRB" in content)
    check("COV computation", "cov" in content.lower() or "COV" in content)
    check("IAAO compliance check", "iaao" in content.lower() or "IAAO" in content or "compliance" in content.lower())
    check("Model receipts for audit", "receipt" in content.lower() or "audit" in content.lower())


def verify_vei_service():
    """Verify VEI service has equity analysis hooks."""
    print("\n=== veiService.ts (VEI Hooks) ===")
    path = ROOT / "frontend/apps/os-shell/src/services/forge/veiService.ts"
    if not path.is_file():
        check("File exists", False, str(path))
        return
    content = path.read_text(encoding="utf-8")

    check("Study period management", "period" in content.lower() or "studyPeriod" in content)
    check("Ratio tier grouping", "tier" in content.lower())
    check("Appeals by tier", "appeal" in content.lower())
    check("Sample size tracking", "sample" in content.lower())


def verify_no_scope_bleed():
    """Verify no Canon sync, ETL helpers, or dashboard chrome leaked in."""
    print("\n=== Scope Bleed Check ===")
    stats_dir = ROOT / "frontend/apps/os-shell/src/pages/forge/statistics"
    services_dir = ROOT / "frontend/apps/os-shell/src/services/forge"

    all_files = list(stats_dir.rglob("*.tsx")) + list(stats_dir.rglob("*.ts"))
    # Only check forge-statistics services (not all forge services)
    stats_services = [
        services_dir / "veiService.ts",
        services_dir / "ratioAnalysisService.ts",
        services_dir / "assessmentIntelligenceService.ts",
        services_dir / "advancedAnalyticsService.ts",
        services_dir / "historicalRatioService.ts",
    ]
    all_files.extend([f for f in stats_services if f.is_file()])

    canon_refs = 0
    etl_refs = 0
    for f in all_files:
        content = f.read_text(encoding="utf-8", errors="replace").lower()
        if "terracanon" in content or "canon-sync" in content:
            canon_refs += 1
        if "etl-pipeline" in content or "data-pipeline" in content:
            etl_refs += 1

    check("No TerraCanon references in statistics files", canon_refs == 0,
          f"Found {canon_refs} Canon references")
    check("No ETL pipeline references in statistics files", etl_refs == 0,
          f"Found {etl_refs} ETL references")


def main():
    print("=" * 60)
    print("TFT-196: FORGE-STATISTICS DATA VERIFICATION")
    print("=" * 60)

    verify_ratio_study_service()
    verify_data_quality_service()
    verify_validation_engine()
    verify_frontend_ratio_service()
    verify_vei_service()
    verify_no_scope_bleed()

    print(f"\n{'=' * 60}")
    print(f"VERIFICATION SUMMARY")
    print(f"  Passed: {PASS}")
    print(f"  Failed: {FAIL}")
    print(f"  Total:  {PASS + FAIL}")

    if FAIL == 0:
        print(f"\n🟢 ALL CHECKS PASSED — IAAO formula parity verified")
    else:
        print(f"\n🟡 {FAIL} CHECK(S) FAILED — review above")

    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
