#!/usr/bin/env python3
"""
TerraFusion Quantum ROI Calculator
Demonstrate return on investment for quantum-enhanced municipal software
"""

import json
from datetime import datetime

def calculate_quantum_roi():
    print("💰 TerraFusion Quantum ROI Calculator")
    print("=" * 40)
    
    # Baseline assumptions
    county_staff = 50
    avg_salary = 65000
    properties_per_assessor = 2000
    assessment_time_classical = 0.25  # seconds
    assessment_time_quantum = 0.014838  # seconds (from benchmark)
    
    # Calculate time savings
    time_savings = assessment_time_classical / assessment_time_quantum
    productivity_gain = time_savings - 1
    
    # Calculate cost savings
    total_salary_cost = county_staff * avg_salary
    quantum_cost_savings = total_salary_cost * (productivity_gain / (1 + productivity_gain))
    
    # Calculate ROI
    quantum_investment = 500000  # Estimated quantum system cost
    annual_savings = quantum_cost_savings
    roi_percentage = (annual_savings / quantum_investment) * 100
    
    results = {
        "county_staff": county_staff,
        "avg_salary": avg_salary,
        "total_salary_cost": total_salary_cost,
        "classical_assessment_time": assessment_time_classical,
        "quantum_assessment_time": assessment_time_quantum,
        "time_savings_factor": time_savings,
        "productivity_gain_percentage": productivity_gain * 100,
        "annual_cost_savings": quantum_cost_savings,
        "quantum_investment": quantum_investment,
        "roi_percentage": roi_percentage,
        "payback_period_months": (quantum_investment / annual_savings) * 12
    }
    
    print(f"👥 County Staff: {county_staff}")
    print(f"💰 Average Salary: ${avg_salary:,}")
    print(f"⏱️ Classical Assessment Time: {assessment_time_classical}ms")
    print(f"⚡ Quantum Assessment Time: {assessment_time_quantum:.3f}ms")
    print(f"🚀 Time Savings: {time_savings:.0f}x faster")
    print(f"📈 Productivity Gain: {productivity_gain*100:.1f}%")
    print(f"💵 Annual Cost Savings: ${quantum_cost_savings:,.0f}")
    print(f"🎯 ROI: {roi_percentage:.1f}%")
    print(f"⏰ Payback Period: {results['payback_period_months']:.1f} months")
    
    with open("quantum_roi_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    return results

if __name__ == "__main__":
    calculate_quantum_roi() 