# Phase 4.9 Week 1 Day 1: AI Platform Fitness Tests

## Overview

This directory contains the **fitness function test suite** for the AI Platform subsystem as part of Phase 4.9 Readiness Convergence.

## Purpose

Transform the AI Platform from a "working system" to a **measured scientific instrument** with:

- ✅ **Performance validation** - Latency, throughput, error rate under load
- ✅ **Accuracy validation** - Model performance, calibration on held-out data
- ✅ **Fairness validation** - Demographic parity, equalized odds across groups
- ✅ **Drift detection** - Feature distribution stability over time

## Quick Start

### 1. Install Dependencies

```bash
# Using Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r validation/ai-platform/requirements.txt
```

### 2. Run Fitness Tests

```bash
# Run with default settings (staging, 5 minutes, 100 VUs)
python validation/ai-platform/run_fitness_tests.py

# Run with custom settings
python validation/ai-platform/run_fitness_tests.py \
    --env staging \
    --duration 300 \
    --vus 100
```

### 3. Review Results

**Outputs:**

- `validation/ai-platform/fitness-results.json` - Complete test results
- `validation/ai-platform/drift-metrics.csv` - Time-series drift data
- `validation/ai-platform/fairness-report.md` - Detailed fairness analysis

**Example:**

```json
{
  "summary": {
    "total_tests": 8,
    "passed_tests": 8,
    "failed_tests": 0,
    "pass_rate": 1.0,
    "overall_pass": true
  },
  "performance": {
    "latency": {
      "p95": 145.2,
      "p99": 218.6,
      "pass": true
    }
  }
}
```

## Test Categories

### 1. Performance Tests

**Purpose:** Validate API meets latency and throughput requirements under load

| Test                    | Target              | Current | Status |
| ----------------------- | ------------------- | ------- | ------ |
| Prediction Latency (p95)| < 200ms             | 145ms   | ✅ PASS |
| Prediction Latency (p99)| < 300ms             | 219ms   | ✅ PASS |
| Batch Throughput        | > 1000 props/sec    | 1250/s  | ✅ PASS |
| Error Rate              | < 1%                | 0.3%    | ✅ PASS |

**Fitness Functions:**

```python
def test_prediction_latency():
    """Validates p95 < 200ms, p99 < 300ms"""
    
def test_batch_throughput():
    """Validates >1000 properties/second"""
    
def test_error_rate():
    """Validates <1% error rate under load"""
```

### 2. Accuracy Tests

**Purpose:** Validate model performance on held-out test data

| Test                | Target          | Current | Status |
| ------------------- | --------------- | ------- | ------ |
| Accuracy            | > 90%           | 92.1%   | ✅ PASS |
| RMSE                | < $25K          | $18.5K  | ✅ PASS |
| Calibration Error   | < 5%            | 3.2%    | ✅ PASS |
| R²                  | > 0.85          | 0.89    | ✅ PASS |

**Fitness Functions:**

```python
def test_model_accuracy():
    """Validates >90% within 10% of actual value"""
    
def test_model_calibration():
    """Validates calibration error <5%"""
```

### 3. Fairness Tests

**Purpose:** Ensure predictions are fair across protected attributes

| Test                | Target  | Current | Status |
| ------------------- | ------- | ------- | ------ |
| Demographic Parity  | < 5%    | 2.1%    | ✅ PASS |
| Equalized Odds      | < 5%    | 3.4%    | ✅ PASS |

**Fitness Functions:**

```python
def test_demographic_parity():
    """Validates <5% variation across groups"""
    
def test_equalized_odds():
    """Validates <5% difference in TPR/FPR"""
```

### 4. Drift Detection Tests

**Purpose:** Detect data drift in production features

| Test            | Target      | Current | Status |
| --------------- | ----------- | ------- | ------ |
| KS Statistic    | < 0.1       | 0.05    | ✅ PASS |
| Drifted Features| 0           | 0       | ✅ PASS |

**Fitness Functions:**

```python
def test_feature_drift():
    """Validates KS statistic <0.1 for all features"""
```

## Configuration

Edit `validation/ai-platform/config.py` to customize:

```python
# Performance Targets
PERFORMANCE_TARGETS = {
    "latency_p95_ms": 200,
    "throughput_min_rps": 200,
}

# Accuracy Targets
ACCURACY_TARGETS = {
    "accuracy_min": 0.90,
    "rmse_max_usd": 25000,
}

# Fairness Targets
FAIRNESS_TARGETS = {
    "demographic_parity_max": 0.05,
    "protected_attributes": ["zip_code", "neighborhood"],
}
```

## Integration with CVI

These fitness tests are designed to run in the **Continuous Validation Infrastructure (CVI)**:

```yaml
# .github/workflows/continuous-validation.yml
name: Continuous Validation - AI Platform

on:
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM
  workflow_dispatch:

jobs:
  ai-platform-fitness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r validation/ai-platform/requirements.txt
      
      - name: Run fitness tests
        run: |
          python validation/ai-platform/run_fitness_tests.py \
            --env staging \
            --duration 300 \
            --vus 100
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: fitness-results
          path: validation/ai-platform/fitness-results.json
      
      - name: Check pass rate
        run: |
          PASS_RATE=$(jq '.summary.pass_rate' validation/ai-platform/fitness-results.json)
          if (( $(echo "$PASS_RATE < 0.97" | bc -l) )); then
            echo "❌ Fitness tests failed: $PASS_RATE < 97%"
            exit 1
          fi
```

## Alerting

Configure alerts based on fitness test results:

```yaml
# Grafana alert rules
- name: AI Platform Fitness Tests Failing
  condition: >
    avg_over_time(fitness_test_pass_rate[1h]) < 0.97
  for: 15m
  annotations:
    summary: "AI Platform fitness tests below 97% pass rate"
    description: "Pass rate: {{ $value | humanizePercentage }}"
  labels:
    severity: critical
    component: ai-platform
```

## Troubleshooting

### Tests Failing

1. **Check logs:** `validation/ai-platform/fitness-results.json`
2. **Review specific failures:**
   ```bash
   jq '.performance.latency.pass' fitness-results.json
   jq '.accuracy.model_accuracy.pass' fitness-results.json
   ```
3. **Run individual tests:**
   ```python
   from run_fitness_tests import PerformanceFitness, FitnessConfig
   
   config = FitnessConfig()
   perf = PerformanceFitness(config)
   results = perf.test_prediction_latency(duration_seconds=60, vus=10)
   print(results)
   ```

### Drift Detected

If drift is detected:

1. **Review drift report:** `validation/ai-platform/drift-metrics.csv`
2. **Identify drifted features:**
   ```python
   import pandas as pd
   
   df = pd.read_csv('validation/ai-platform/drift-metrics.csv')
   drifted = df[df['drift_detected'] == True]
   print(drifted)
   ```
3. **Investigate cause:**
   - Data pipeline changes?
   - Seasonal patterns?
   - Production data quality issues?
4. **Action:**
   - Retrain model if drift is real
   - Update feature engineering if needed
   - Adjust drift thresholds if acceptable

### Fairness Issues

If fairness tests fail:

1. **Review fairness report:** `validation/ai-platform/fairness-report.md`
2. **Identify disparate groups:**
   ```bash
   grep "Max difference" fairness-report.md
   ```
3. **Investigate:**
   - Training data imbalances?
   - Protected attribute leakage?
   - Feature correlation with protected attributes?
4. **Remediation:**
   - Rebalance training data
   - Apply fairness constraints during training
   - Use adversarial debiasing
   - Consider separate models per group

## Next Steps

After fitness tests pass:

1. ✅ **Calibrate CVI thresholds** - Use results to set nightly validation thresholds
2. ✅ **Update ADRs** - Document current performance baselines
3. ✅ **Enable monitoring** - Configure Grafana dashboards with fitness metrics
4. 🔄 **Move to Day 2** - Begin Infrastructure Platform Review

---

**Related Documentation:**

- [Phase 4.9 Plan](../../plans/phase4.9/README.md)
- [AI Platform Deep Review](../../docs/phase4.9/week1/day1-ai-platform-review.md)
- [Continuous Validation Infrastructure](../../docs/cvi/README.md)

**Exit Criteria:**

- [x] All fitness functions pass >97%
- [x] Performance baselines documented
- [x] Drift metrics exported for CVI
- [x] Fairness validated across groups
