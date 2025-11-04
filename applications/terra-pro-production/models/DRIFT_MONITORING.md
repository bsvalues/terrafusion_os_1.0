# Terrafusion Model Drift Monitoring

## Overview

The Model Drift Monitoring system tracks the differences between AI model predictions and user corrections over time. This enables you to identify when models are consistently under or over-estimating property conditions, and provides guidance on when retraining might be necessary.

## Features

- **Real-time Feedback Logging**: Every time a user corrects an AI score, the difference is logged
- **Drift Analysis by Model Version**: Track how different model versions perform over time
- **Automated Drift Reports**: Generate visualizations and HTML reports showing drift patterns
- **Drift Direction Classification**:
  - **Conservative Drift**: Model scores properties lower than users (positive difference)
  - **Optimistic Drift**: Model scores properties higher than users (negative difference)
  - **Neutral**: Model is aligned with user perceptions (near-zero difference)

## Drift Visualization

The system generates two primary visualizations:

1. **Drift Over Time**: Shows how the average difference between AI and user scores changes over time, broken down by model version
2. **Feedback Volume**: Tracks how many user corrections are received each day

## HTML Reports

The comprehensive HTML reports include:

- Overall drift statistics
- Version-specific drift analysis
- Pie charts showing drift direction distributions
- Actionable recommendations based on observed patterns

## Using the System

### Monitoring Drift

A drift report is automatically generated daily and saved to `models/reports/`. You can also generate one on-demand:

```bash
python scripts/generate_drift_report.py --days 30
```

This creates:

- A visualization image: `models/reports/drift_visualization_*.png`
- An HTML report: `models/reports/drift_report_*.html`

### Understanding Drift Patterns

- **Positive Drift** means the model is scoring properties lower than users (conservative)
- **Negative Drift** means the model is scoring properties higher than users (optimistic)
- **Significant Drift** (magnitude > 0.5) suggests the model may need retraining
- **Minor Drift** (magnitude 0.2-0.5) indicates potential bias but may be acceptable

### When to Take Action

The drift report provides specific recommendations, but generally:

1. **Retrain When**:

   - Absolute drift exceeds 0.5 points consistently
   - Drift is increasing over time
   - Newer model versions show larger drift than older ones

2. **Monitor When**:
   - Minor drift is detected (0.2-0.5 points)
   - Drift patterns are inconsistent across versions
   - Feedback volume is low

## Implementation Details

The system comprises several components:

- `backend/drift_monitor.py`: Core drift calculation and visualization logic
- `backend/routes/condition_analysis.py`: Integrates drift logging into the feedback endpoint
- `models/feedback/condition_feedback.csv`: Raw user feedback data
- `models/drift_logs/condition_drift_log.csv`: Aggregated daily drift metrics
- `scripts/generate_drift_report.py`: CLI tool for generating reports

## Technical Implementation

1. When users provide feedback, we log:

   - Original AI score
   - User corrected score
   - The difference (user - AI)
   - Model version used
   - Timestamp

2. Daily aggregation calculates:

   - Mean drift by model version
   - Median drift
   - Standard deviation of drift
   - Drift direction classification

3. Reports visualize these metrics and provide recommendations based on drift magnitude and patterns.

## Extending the System

The drift monitoring system can be extended to:

1. Set up automatic email alerts when drift exceeds thresholds
2. Add a drift dashboard to the web UI
3. Implement automatic model version switching based on drift patterns
4. Add A/B testing to evaluate new model versions against existing ones
