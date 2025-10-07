#!/usr/bin/env python3
"""
Day 7 Resilience Index (RI) Calculator
Calculates per-fault and overall RI scores from chaos test metrics.
Generates CSV per-fault breakdown and markdown summary report.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Any, List
from dataclasses import dataclass


@dataclass
class FaultThresholds:
    """Thresholds for fault scoring"""
    p95_ms: int
    error_rate: float
    recovery_sec: int
    data_integrity_errors: int = 0


@dataclass
class FaultMetrics:
    """Measured metrics for a fault scenario"""
    fault_id: str
    p95_ms: float
    error_rate: float
    recovery_sec: float
    data_integrity_errors: int


@dataclass
class FaultScore:
    """Calculated RI components and total for a fault"""
    fault_id: str
    p95_score: float
    error_rate_score: float
    recovery_score: float
    data_integrity_score: float
    ri: float
    weight: float


# Fault-specific thresholds (from scorecard/rubric.yaml)
FAULT_THRESHOLDS = {
    "F1": FaultThresholds(p95_ms=500, error_rate=0.01, recovery_sec=60),
    "F2": FaultThresholds(p95_ms=2000, error_rate=0.30, recovery_sec=60),
    "F3": FaultThresholds(p95_ms=800, error_rate=0.01, recovery_sec=120),
    "F4": FaultThresholds(p95_ms=1000, error_rate=0.01, recovery_sec=10),
    "F5": FaultThresholds(p95_ms=1000, error_rate=0.01, recovery_sec=300),
    "F6": FaultThresholds(p95_ms=800, error_rate=0.01, recovery_sec=120),
    "F7": FaultThresholds(p95_ms=600, error_rate=0.01, recovery_sec=60),
}

# Fault weights (from scorecard/rubric.yaml)
FAULT_WEIGHTS = {
    "F1": 0.20,
    "F2": 0.20,
    "F3": 0.15,
    "F4": 0.10,
    "F5": 0.10,
    "F6": 0.15,
    "F7": 0.10,
}

# RI component weights
RI_WEIGHTS = {
    "p95": 0.35,
    "error_rate": 0.25,
    "recovery": 0.25,
    "data_integrity": 0.15,
}

# Decision thresholds
DECISION_THRESHOLDS = {
    "GO": 0.95,
    "CONDITIONAL_GO": 0.90,
}


def calculate_p95_score(actual: float, threshold: int) -> float:
    """Calculate P95 latency score (higher is better)"""
    if actual <= 0:
        return 0.0
    score = min(1.0, threshold / actual)
    return round(score, 4)


def calculate_error_rate_score(actual: float, threshold: float) -> float:
    """Calculate error rate score (lower is better)"""
    if threshold <= 0:
        return 0.0
    score = max(0.0, 1.0 - (actual / threshold))
    return round(score, 4)


def calculate_recovery_score(actual: float, threshold: int) -> float:
    """Calculate recovery time score (faster is better)"""
    if actual <= 0:
        return 1.0  # Instant recovery
    score = min(1.0, threshold / actual)
    return round(score, 4)


def calculate_data_integrity_score(actual: int) -> float:
    """Calculate data integrity score (binary: 0 errors = 1.0, else 0.0)"""
    return 1.0 if actual == 0 else 0.0


def calculate_fault_ri(metrics: FaultMetrics, thresholds: FaultThresholds) -> FaultScore:
    """Calculate Resilience Index for a single fault"""
    
    # Calculate individual component scores
    p95_score = calculate_p95_score(metrics.p95_ms, thresholds.p95_ms)
    error_rate_score = calculate_error_rate_score(metrics.error_rate, thresholds.error_rate)
    recovery_score = calculate_recovery_score(metrics.recovery_sec, thresholds.recovery_sec)
    data_integrity_score = calculate_data_integrity_score(metrics.data_integrity_errors)
    
    # Calculate weighted RI for this fault
    ri = (
        RI_WEIGHTS["p95"] * p95_score +
        RI_WEIGHTS["error_rate"] * error_rate_score +
        RI_WEIGHTS["recovery"] * recovery_score +
        RI_WEIGHTS["data_integrity"] * data_integrity_score
    )
    
    return FaultScore(
        fault_id=metrics.fault_id,
        p95_score=p95_score,
        error_rate_score=error_rate_score,
        recovery_score=recovery_score,
        data_integrity_score=data_integrity_score,
        ri=round(ri, 4),
        weight=FAULT_WEIGHTS.get(metrics.fault_id, 0.0)
    )


def calculate_overall_ri(fault_scores: List[FaultScore]) -> float:
    """Calculate overall weighted RI across all faults"""
    overall_ri = sum(score.ri * score.weight for score in fault_scores)
    return round(overall_ri, 4)


def get_decision(overall_ri: float) -> str:
    """Determine GO/CONDITIONAL GO/NO-GO decision"""
    if overall_ri >= DECISION_THRESHOLDS["GO"]:
        return "GO"
    elif overall_ri >= DECISION_THRESHOLDS["CONDITIONAL_GO"]:
        return "CONDITIONAL GO"
    else:
        return "NO-GO"


def load_metrics(input_path: Path) -> Dict[str, FaultMetrics]:
    """Load metrics from JSON file"""
    try:
        with open(input_path, 'r') as f:
            data = json.load(f)
        
        metrics = {}
        for fault_id, fault_data in data.get("faults", {}).items():
            metrics[fault_id] = FaultMetrics(
                fault_id=fault_id,
                p95_ms=float(fault_data.get("p95_ms", 0)),
                error_rate=float(fault_data.get("error_rate", 0)),
                recovery_sec=float(fault_data.get("recovery_sec", 0)),
                data_integrity_errors=int(fault_data.get("data_integrity_errors", 0))
            )
        
        return metrics
    
    except Exception as e:
        print(f"Error loading metrics from {input_path}: {e}", file=sys.stderr)
        sys.exit(1)


def write_csv_report(fault_scores: List[FaultScore], output_path: Path):
    """Write per-fault scores to CSV"""
    try:
        with open(output_path, 'w') as f:
            # Header
            f.write("fault_id,p95_score,error_rate_score,recovery_score,data_integrity_score,ri,weight\n")
            
            # Fault rows
            for score in fault_scores:
                f.write(f"{score.fault_id},{score.p95_score},{score.error_rate_score},"
                       f"{score.recovery_score},{score.data_integrity_score},"
                       f"{score.ri},{score.weight}\n")
        
        print(f"✅ CSV report written to {output_path}")
    
    except Exception as e:
        print(f"Error writing CSV report: {e}", file=sys.stderr)
        sys.exit(1)


def write_markdown_report(fault_scores: List[FaultScore], overall_ri: float, 
                         decision: str, output_path: Path):
    """Write overall RI summary to markdown"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            # Header
            f.write("# Day 7 Chaos Test - Resilience Index Report\n\n")
            f.write(f"**Date:** {Path(__file__).stat().st_mtime}\n\n")
            
            # Overall RI
            f.write("## Overall Resilience Index\n\n")
            f.write(f"**Overall RI:** {overall_ri:.4f}\n\n")
            f.write(f"**Decision:** **{decision}**\n\n")
            
            # Decision explanation
            f.write("### Decision Matrix\n\n")
            if decision == "GO":
                f.write(f"- ✅ **GO** (RI ≥ {DECISION_THRESHOLDS['GO']:.2f})\n")
                f.write("  - System demonstrates excellent resilience under fault conditions\n")
                f.write("  - **Action:** Proceed to PROD-0 simulation on October 14\n")
                f.write("  - **Risk:** LOW - All fault scenarios handled gracefully\n\n")
            elif decision == "CONDITIONAL GO":
                f.write(f"- ⚠️ **CONDITIONAL GO** (RI {DECISION_THRESHOLDS['CONDITIONAL_GO']:.2f}–{DECISION_THRESHOLDS['GO']:.2f})\n")
                f.write("  - System shows good resilience but needs targeted improvements\n")
                f.write("  - **Action:** Address remediation items in Week 2, proceed to PROD-0 Oct 14-16\n")
                f.write("  - **Risk:** MEDIUM - Monitor closely, have rollback plan ready\n\n")
            else:
                f.write(f"- ❌ **NO-GO** (RI < {DECISION_THRESHOLDS['CONDITIONAL_GO']:.2f})\n")
                f.write("  - System requires significant resilience improvements\n")
                f.write("  - **Action:** Defer PROD-0 to October 21, execute Week 2 remediation plan\n")
                f.write("  - **Risk:** HIGH - Production deployment premature\n\n")
            
            # Per-fault breakdown
            f.write("## Per-Fault Resilience Index\n\n")
            f.write("| Fault | P95 Score | Error Rate Score | Recovery Score | Data Integrity Score | RI | Weight | Weighted Contribution |\n")
            f.write("|-------|-----------|------------------|----------------|----------------------|----|--------|-----------------------|\n")
            
            for score in fault_scores:
                contribution = score.ri * score.weight
                f.write(f"| {score.fault_id} | {score.p95_score:.4f} | {score.error_rate_score:.4f} | "
                       f"{score.recovery_score:.4f} | {score.data_integrity_score:.4f} | "
                       f"{score.ri:.4f} | {score.weight:.2f} | {contribution:.4f} |\n")
            
            # Summary
            f.write("\n## Summary\n\n")
            total_contribution = sum(score.ri * score.weight for score in fault_scores)
            f.write(f"- **Total Weighted Contribution:** {total_contribution:.4f}\n")
            f.write(f"- **Overall RI:** {overall_ri:.4f}\n")
            f.write(f"- **Decision:** {decision}\n\n")
            
            # Next Steps
            f.write("## Next Steps\n\n")
            if decision == "GO":
                f.write("1. ✅ Document test results in DAY_7_CHAOS_COMPLETE.md\n")
                f.write("2. ✅ Archive test artifacts (Prometheus exports, Jaeger traces, k6 outputs)\n")
                f.write("3. ✅ Update PROD-0 simulation plan for October 14\n")
                f.write("4. ✅ Communicate GO decision to stakeholders\n")
            elif decision == "CONDITIONAL GO":
                f.write("1. ⚠️ Review per-fault scores and identify remediation targets\n")
                f.write("2. ⚠️ Create Week 2 remediation plan (prioritize CRITICAL/HIGH items)\n")
                f.write("3. ⚠️ Set PROD-0 date (October 14-16, pending remediation completion)\n")
                f.write("4. ⚠️ Establish monitoring alerts for weak areas\n")
            else:
                f.write("1. ❌ Analyze root causes for low-scoring faults\n")
                f.write("2. ❌ Create comprehensive Week 2 remediation plan (60+ hours estimated)\n")
                f.write("3. ❌ Defer PROD-0 to October 21\n")
                f.write("4. ❌ Re-run Day 7 chaos tests after remediation\n")
            
            f.write("\n---\n\n")
            f.write("*Generated by day7_ri_calculator.py*\n")
        
        print(f"✅ Markdown report written to {output_path}")
    
    except Exception as e:
        print(f"Error writing markdown report: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Calculate Day 7 Resilience Index from chaos test metrics"
    )
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Path to input metrics JSON file"
    )
    parser.add_argument(
        "--out",
        type=str,
        default="day7_ri",
        help="Output file prefix (generates <prefix>_per_fault.csv and <prefix>_report.md)"
    )
    
    args = parser.parse_args()
    
    # Validate input file exists
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    print(f"🔄 Loading metrics from {args.input}...")
    metrics = load_metrics(args.input)
    
    if not metrics:
        print("Error: No fault metrics found in input file", file=sys.stderr)
        sys.exit(1)
    
    print(f"✅ Loaded metrics for {len(metrics)} faults: {', '.join(metrics.keys())}\n")
    
    # Calculate per-fault RI
    print("🔄 Calculating per-fault Resilience Index...")
    fault_scores = []
    for fault_id in sorted(metrics.keys()):
        if fault_id not in FAULT_THRESHOLDS:
            print(f"Warning: No thresholds defined for {fault_id}, skipping", file=sys.stderr)
            continue
        
        score = calculate_fault_ri(metrics[fault_id], FAULT_THRESHOLDS[fault_id])
        fault_scores.append(score)
        print(f"  {fault_id}: RI={score.ri:.4f} (P95={score.p95_score:.4f}, "
              f"Error={score.error_rate_score:.4f}, Recovery={score.recovery_score:.4f}, "
              f"Integrity={score.data_integrity_score:.4f})")
    
    # Calculate overall RI
    print("\n🔄 Calculating overall Resilience Index...")
    overall_ri = calculate_overall_ri(fault_scores)
    decision = get_decision(overall_ri)
    
    print(f"\n{'='*60}")
    print(f"  OVERALL RESILIENCE INDEX: {overall_ri:.4f}")
    print(f"  DECISION: {decision}")
    print(f"{'='*60}\n")
    
    # Write outputs
    csv_path = Path(f"{args.out}_per_fault.csv")
    md_path = Path(f"{args.out}_report.md")
    
    write_csv_report(fault_scores, csv_path)
    write_markdown_report(fault_scores, overall_ri, decision, md_path)
    
    print(f"\n✅ RI calculation complete!")
    print(f"   - CSV: {csv_path}")
    print(f"   - Report: {md_path}")
    print(f"\n{'='*60}")
    
    # Exit with appropriate code
    if decision == "GO":
        sys.exit(0)
    elif decision == "CONDITIONAL GO":
        sys.exit(1)  # Warning exit code
    else:
        sys.exit(2)  # Error exit code


if __name__ == "__main__":
    main()
