"""
Configuration file for AI Platform fitness tests
"""

# API Endpoints
STAGING_API_URL = "http://ai-platform-api.staging.svc.cluster.local"
PRODUCTION_API_URL = "http://ai-platform-api.production.svc.cluster.local"

# Performance Targets
PERFORMANCE_TARGETS = {
    "latency_p95_ms": 200,
    "latency_p99_ms": 300,
    "throughput_min_rps": 200,
    "error_rate_max": 0.01,
    "batch_throughput_min": 1000,  # properties/second
}

# Accuracy Targets
ACCURACY_TARGETS = {
    "accuracy_min": 0.90,  # 90% within 10% of actual
    "calibration_error_max": 0.05,
    "rmse_max_usd": 25000,
    "mae_max_usd": 18000,
    "r2_min": 0.85,
}

# Fairness Targets
FAIRNESS_TARGETS = {
    "demographic_parity_max": 0.05,  # 5% max difference
    "equalized_odds_max": 0.05,
    "protected_attributes": ["zip_code", "neighborhood"],
}

# Drift Detection Targets
DRIFT_TARGETS = {
    "ks_statistic_max": 0.1,
    "production_days": 7,  # Days of production data to analyze
    "key_features": [
        "square_footage",
        "year_built",
        "bedrooms",
        "bathrooms",
        "lot_size",
    ],
}

# Test Data Paths (set to None to use simulation)
TEST_DATA_PATHS = {
    "accuracy_test_set": None,  # "data/test/benton_county_holdout.csv"
    "calibration_test_set": None,
    "fairness_test_set": None,
    "production_features": None,
    "training_features": None,
}

# Load Test Configuration
LOAD_TEST_CONFIG = {
    "default_duration_seconds": 300,  # 5 minutes
    "default_vus": 100,
    "ramp_up_seconds": 30,
    "ramp_down_seconds": 30,
}

# Output Paths
OUTPUT_PATHS = {
    "results_json": "validation/ai-platform/fitness-results.json",
    "drift_csv": "validation/ai-platform/drift-metrics.csv",
    "fairness_report": "validation/ai-platform/fairness-report.md",
}

# Alert Thresholds (for continuous monitoring)
ALERT_THRESHOLDS = {
    "latency_p95_ms": 250,  # Alert if p95 > 250ms
    "error_rate": 0.02,  # Alert if error rate > 2%
    "accuracy": 0.85,  # Alert if accuracy drops below 85%
    "drift_ks": 0.15,  # Alert if any feature drift > 0.15
    "fairness_parity": 0.07,  # Alert if parity > 7%
}
