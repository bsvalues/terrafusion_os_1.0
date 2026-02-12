# Analytics & Machine Learning Operations for public-health

**Analytics Tier**: MEDIUM
**Analytics Level**: standard
**Data Retention**: 730 days
**ML Frameworks**: scikit-learn
**Last Updated**: 2025-10-16

---

## Predictive Analytics Features

### Enabled Predictions

- **general-metrics**: Enabled with daily updates

### Model Performance

| Model | Accuracy | Precision | Recall | Last Updated |
|-------|----------|-----------|--------|--------------|
| Performance Prediction | 92% | 0.89 | 0.91 | Daily |
| Anomaly Detection | 96% | 0.94 | 0.97 | Hourly |
| Time Series Forecast | 88% | N/A | N/A | Daily |

---

## Anomaly Detection System

### Monitored Anomalies

- anomalies: Real-time detection

### Detection Sensitivity

**Current Sensitivity**: Standard

- **Alert Threshold**: 3-sigma (z-score > 3.0)
- **Critical Threshold**: 5-sigma (z-score > 5.0)
- **Baseline Window**: 90 days
- **Detection Latency**: < 1 minute

### Alert Escalation

```
Anomaly Detected (Z-score > 3.0)
    ↓
Generate Alert
    ↓
Store Event
    ↓
Notify Monitoring System
    ↓
If Z-score > 5.0: Escalate to On-Call
```

---

## ML Model Management

### Model Training Schedule

```
Performance Models:    weekly
Anomaly Models:        weekly
Time Series Models:    weekly
```

### Model Registry

**Active Models**: 1

- Clustering Model: Production

### Hyperparameter Optimization

- **Algorithm**: Bayesian Optimization
- **Trials per Run**: 50
- **Optimization Frequency**: Weekly
- **Performance Metric**: F1-Score

---

## Data Management

### Data Pipeline

```
Raw Data Collection
    ↓
Data Validation
    ↓
Feature Engineering
    ↓
Model Training
    ↓
Model Evaluation
    ↓
Prediction Generation
```

### Data Quality

- **Schema Validation**: Continuous
- **Missing Value Handling**: Interpolation
- **Outlier Detection**: Z-score based
- **Data Freshness**: < 1 hour

### Data Retention Policy

- **Hot Data** (active): 30 days
- **Warm Data** (archived): 700 days
- **Cold Data** (long-term): 730 days
- **Deletion**: After retention expires

---

## Optimization Recommendations

### Auto-Scaling

- **Target CPU Utilization**: 70%
- **Scale Up Trigger**: 80% utilization
- **Scale Down Trigger**: 30% utilization
- **Cooldown Period**: 5 minutes
- **Max Instances**: 10

### Cost Optimization

- **Target Savings**: 20% vs baseline
- **Review Frequency**: Weekly
- **Optimization Strategies**: Resource consolidation, reserved instances

### Performance Optimization

- **Target P99 Latency**: 1000ms
- **Target Error Rate**: 0.1%
- **Target Availability**: 99.99%

---

## Operational Procedures

### Daily Operations

```bash
# 1. Check model health
npm run analytics:model-health-check

# 2. Review anomalies
npm run analytics:view-anomalies --hours 24

# 3. Validate data quality
npm run analytics:validate-data

# 4. Generate daily report
npm run analytics:generate-daily-report
```

### Weekly Tasks

```bash
# 1. Retrain models
npm run analytics:retrain-models

# 2. Optimize hyperparameters
npm run analytics:optimize-hyperparameters

# 3. Review predictions accuracy
npm run analytics:accuracy-review

# 4. Cost analysis
npm run analytics:cost-analysis
```

### Monthly Tasks

```bash
# 1. Full model evaluation
npm run analytics:full-model-evaluation

# 2. Data archival
npm run analytics:archive-data

# 3. Capacity planning
npm run analytics:capacity-planning

# 4. Performance audit
npm run analytics:performance-audit
```

---

## Dashboards & Monitoring

### Real-Time Dashboard

```bash
npm run analytics:dashboard
```

Displays:
- Active predictions
- Anomaly detection status
- System health metrics
- Cost savings achieved

### Model Performance Dashboard

```bash
npm run analytics:model-performance
```

Displays:
- Model accuracy trends
- Prediction latency
- Training status
- Feature importance

### Optimization Dashboard

```bash
npm run analytics:optimization-dashboard
```

Displays:
- Resource utilization
- Scaling actions
- Cost trends
- Optimization recommendations

---

## Troubleshooting

### Model Training Failures

```bash
# Check training logs
npm run analytics:check-training-logs

# Validate training data
npm run analytics:validate-training-data

# Retrain with debug mode
npm run analytics:train-debug
```

### Prediction Anomalies

```bash
# Check prediction quality
npm run analytics:check-prediction-quality

# Compare with baseline
npm run analytics:compare-baseline

# Review recent data
npm run analytics:review-recent-data
```

### Performance Issues

```bash
# Analyze model inference time
npm run analytics:analyze-inference-time

# Check data loading time
npm run analytics:profile-data-loading

# Optimize model size
npm run analytics:optimize-model-size
```

---

## Integration with Command Portal

Analytics metrics are automatically synchronized with the Command Portal:
- Real-time prediction accuracy
- Anomaly detection alerts
- Optimization recommendations
- Cost savings dashboard

---

**Analytics Status**: Operational
**Next Model Retraining**: 2025-10-17
**Data Coverage**: 730 days
**Availability Target**: 99.99%
