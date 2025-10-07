# ADR-008: Fairness Monitoring and Alerting

**Status:** DRAFT  
**Date:** October 7, 2025  
**Author:** AI Ethics Team + AI Platform Team  
**Reviewers:** Architecture Review Council, Legal, Compliance  
**Decision:** Pending ARC approval

---

## Context

AI-powered property valuations must comply with **Fair Housing Act** and avoid systematic bias across protected classes and geographic regions. After Phase 4 completion, our models show:

- ✅ 92.1% accuracy overall
- ✅ 2.1% demographic parity (well below 5% threshold)
- ⚠️ Slight accuracy variation across zip codes (needs investigation)

**Problem:**

We validated fairness **once** during Phase 4. We need **continuous fairness monitoring** in production to:

1. Detect fairness drift over time
2. Alert on fairness violations before they impact users
3. Provide evidence for compliance audits
4. Enable rapid remediation

**Regulatory Context:**

- **Fair Housing Act (1968):** Prohibits discrimination in housing based on race, color, religion, sex, disability, familial status, national origin
- **Equal Credit Opportunity Act (ECOA):** Similar protections for lending decisions
- **Disparate Impact Doctrine:** Policies with disproportionate adverse effect on protected classes are illegal, even if unintentional

---

## Decision

Implement **Continuous Fairness Validation Pipeline** with three components:

### Component 1: Fairness Metrics Definition

Track **three fairness metrics** aligned with legal standards:

#### 1. Demographic Parity

**Definition:** Prediction accuracy should be similar across groups.

```python
# fairness/metrics.py

def demographic_parity(predictions, actuals, protected_attribute):
    """
    Calculate demographic parity across groups
    
    Formula: max|P(Ŷ=1|A=a) - P(Ŷ=1|A=a')|
    
    For regression: "positive" = within 10% of actual value
    
    Returns:
        float: Max difference in positive rates across groups
    """
    unique_groups = np.unique(protected_attribute)
    positive_rates = []
    
    for group in unique_groups:
        mask = protected_attribute == group
        group_preds = predictions[mask]
        group_actuals = actuals[mask]
        
        # Positive = prediction within 10% of actual
        positive_rate = np.mean(
            np.abs((group_preds - group_actuals) / group_actuals) < 0.10
        )
        positive_rates.append(positive_rate)
    
    return max(positive_rates) - min(positive_rates)
```

**Target:** <5% difference across groups  
**Alert Threshold:** >7% difference  
**Critical Threshold:** >10% difference

#### 2. Equalized Odds

**Definition:** Error rates should be similar across groups.

```python
def equalized_odds(predictions, actuals, protected_attribute):
    """
    Calculate equalized odds (TPR and FPR parity)
    
    Returns:
        float: Max difference in TPR/FPR across groups
    """
    unique_groups = np.unique(protected_attribute)
    tpr_list = []
    fpr_list = []
    
    for group in unique_groups:
        mask = protected_attribute == group
        group_preds = predictions[mask]
        group_actuals = actuals[mask]
        
        # True Positive Rate
        correct = np.abs((group_preds - group_actuals) / group_actuals) < 0.10
        tpr = np.mean(correct)
        fpr = 1 - tpr
        
        tpr_list.append(tpr)
        fpr_list.append(fpr)
    
    tpr_diff = max(tpr_list) - min(tpr_list)
    fpr_diff = max(fpr_list) - min(fpr_list)
    
    return max(tpr_diff, fpr_diff)
```

**Target:** <5% difference  
**Alert Threshold:** >7%  
**Critical Threshold:** >10%

#### 3. Calibration Parity

**Definition:** Model confidence should be equally calibrated across groups.

```python
def calibration_parity(predictions, actuals, confidences, protected_attribute):
    """
    Calculate calibration error parity
    
    Returns:
        float: Max difference in calibration error across groups
    """
    unique_groups = np.unique(protected_attribute)
    calibration_errors = []
    
    for group in unique_groups:
        mask = protected_attribute == group
        group_preds = predictions[mask]
        group_actuals = actuals[mask]
        group_confidences = confidences[mask]
        
        cal_error = expected_calibration_error(
            group_preds, group_actuals, group_confidences
        )
        calibration_errors.append(cal_error)
    
    return max(calibration_errors) - min(calibration_errors)
```

**Target:** <3% difference  
**Alert Threshold:** >5%  
**Critical Threshold:** >8%

---

### Component 2: Protected Attributes

**Primary Protected Attributes:**

| Attribute      | Source                  | Why Protected                     |
| -------------- | ----------------------- | --------------------------------- |
| `zip_code`     | Property address        | Proxy for race, income (redlining risk) |
| `neighborhood` | Property address        | Proxy for demographics            |
| `property_age` | Year built              | Correlates with neighborhood development patterns |

**Derived Metrics:**

- Accuracy variance across zip codes
- Prediction error distribution by neighborhood
- Under/over-valuation patterns by region

**NOT Using (Too Sensitive):**

- ❌ Median household income by zip
- ❌ Racial demographics by census tract
- ❌ School district ratings (proxy for demographics)

**Rationale:** Using these directly could lead to **intentional discrimination**. We monitor for disparate impact using neutral geographic proxies.

---

### Component 3: Continuous Monitoring Pipeline

#### Architecture

```
┌─────────────┐
│ Production  │
│ Predictions │
└──────┬──────┘
       │
       │ Stream predictions + metadata
       ▼
┌─────────────────────┐
│ Fairness Validator  │
│ (Real-time service) │
└──────┬──────────────┘
       │
       │ Aggregate hourly
       ▼
┌─────────────────────┐
│ Fairness Metrics DB │
│ (TimescaleDB)       │
└──────┬──────────────┘
       │
       │ Query
       ▼
┌─────────────────────┐       ┌──────────────┐
│ Grafana Dashboard   │◄──────┤ Prometheus   │
│ (Fairness Monitor)  │       │ Alerts       │
└─────────────────────┘       └──────────────┘
```

#### Implementation

```python
# fairness/continuous_monitor.py

class FairnessMonitor:
    """Real-time fairness monitoring service"""
    
    def __init__(self, db_connection, alert_manager):
        self.db = db_connection
        self.alerts = alert_manager
        self.buffer = []  # Prediction buffer for batch processing
        self.buffer_size = 1000
        
    def record_prediction(self, prediction_event: dict):
        """
        Record prediction for fairness analysis
        
        Args:
            prediction_event: {
                'prediction_id': uuid,
                'tenant_id': str,
                'property_id': str,
                'predicted_value': float,
                'actual_value': float (if available),
                'confidence': float,
                'zip_code': str,
                'neighborhood': str,
                'timestamp': datetime
            }
        """
        self.buffer.append(prediction_event)
        
        if len(self.buffer) >= self.buffer_size:
            self._process_buffer()
    
    def _process_buffer(self):
        """Compute fairness metrics on buffered predictions"""
        df = pd.DataFrame(self.buffer)
        
        # Group by tenant (county)
        for tenant_id, tenant_df in df.groupby('tenant_id'):
            
            # Compute fairness metrics
            metrics = self._compute_fairness_metrics(tenant_df)
            
            # Store in TimescaleDB
            self._store_metrics(tenant_id, metrics)
            
            # Check for violations
            self._check_violations(tenant_id, metrics)
        
        # Clear buffer
        self.buffer = []
    
    def _compute_fairness_metrics(self, df: pd.DataFrame) -> dict:
        """Compute all fairness metrics"""
        
        # Filter to only predictions with actuals (for accuracy)
        with_actuals = df[df['actual_value'].notna()]
        
        if len(with_actuals) < 100:
            # Not enough data for reliable metrics
            return {'status': 'insufficient_data'}
        
        predictions = with_actuals['predicted_value'].values
        actuals = with_actuals['actual_value'].values
        confidences = with_actuals['confidence'].values
        
        metrics = {
            'timestamp': datetime.now(),
            'sample_size': len(with_actuals),
        }
        
        # Demographic parity by zip code
        zip_codes = with_actuals['zip_code'].values
        metrics['demographic_parity_zip'] = demographic_parity(
            predictions, actuals, zip_codes
        )
        
        # Equalized odds by zip code
        metrics['equalized_odds_zip'] = equalized_odds(
            predictions, actuals, zip_codes
        )
        
        # Calibration parity by neighborhood
        neighborhoods = with_actuals['neighborhood'].values
        metrics['calibration_parity_neighborhood'] = calibration_parity(
            predictions, actuals, confidences, neighborhoods
        )
        
        return metrics
    
    def _check_violations(self, tenant_id: str, metrics: dict):
        """Check for fairness violations and alert"""
        
        violations = []
        
        # Demographic parity check
        if metrics.get('demographic_parity_zip', 0) > 0.07:
            violations.append({
                'metric': 'demographic_parity',
                'value': metrics['demographic_parity_zip'],
                'threshold': 0.07,
                'severity': 'warning' if metrics['demographic_parity_zip'] < 0.10 else 'critical'
            })
        
        # Equalized odds check
        if metrics.get('equalized_odds_zip', 0) > 0.07:
            violations.append({
                'metric': 'equalized_odds',
                'value': metrics['equalized_odds_zip'],
                'threshold': 0.07,
                'severity': 'warning' if metrics['equalized_odds_zip'] < 0.10 else 'critical'
            })
        
        # Calibration parity check
        if metrics.get('calibration_parity_neighborhood', 0) > 0.05:
            violations.append({
                'metric': 'calibration_parity',
                'value': metrics['calibration_parity_neighborhood'],
                'threshold': 0.05,
                'severity': 'warning' if metrics['calibration_parity_neighborhood'] < 0.08 else 'critical'
            })
        
        # Send alerts
        for violation in violations:
            self.alerts.send_alert(
                tenant_id=tenant_id,
                metric=violation['metric'],
                value=violation['value'],
                threshold=violation['threshold'],
                severity=violation['severity']
            )
```

#### Grafana Dashboard

```yaml
# dashboards/fairness-monitor.json (excerpt)

{
  "dashboard": {
    "title": "AI Fairness Monitor",
    "panels": [
      {
        "title": "Demographic Parity (Zip Code)",
        "targets": [{
          "expr": "ai_fairness_demographic_parity{attribute='zip_code'}",
          "legendFormat": "{{ tenant_id }}"
        }],
        "thresholds": [
          {"value": 0.05, "color": "green"},
          {"value": 0.07, "color": "yellow"},
          {"value": 0.10, "color": "red"}
        ]
      },
      {
        "title": "Accuracy by Zip Code",
        "type": "heatmap",
        "targets": [{
          "query": "SELECT zip_code, AVG(accuracy) FROM fairness_metrics GROUP BY zip_code"
        }]
      },
      {
        "title": "Fairness Violations (Last 24h)",
        "type": "stat",
        "targets": [{
          "expr": "increase(ai_fairness_violations_total[24h])"
        }]
      }
    ]
  }
}
```

---

## Alerting

### Alert Definitions

```yaml
# prometheus/alerts/fairness.yml

groups:
  - name: fairness
    interval: 5m
    rules:
      
      # Warning: Fairness drift detected
      - alert: FairnessWarning
        expr: |
          ai_fairness_demographic_parity > 0.07
          or ai_fairness_equalized_odds > 0.07
          or ai_fairness_calibration_parity > 0.05
        for: 15m
        labels:
          severity: warning
          component: ai-platform
          category: fairness
        annotations:
          summary: "Fairness metric exceeding warning threshold"
          description: |
            Tenant {{ $labels.tenant_id }} fairness violation:
            - Metric: {{ $labels.metric }}
            - Value: {{ $value | humanizePercentage }}
            - Threshold: {{ $labels.threshold }}
          runbook: https://wiki.terrafusion.dev/runbooks/fairness-violation
      
      # Critical: Severe fairness violation
      - alert: FairnessCritical
        expr: |
          ai_fairness_demographic_parity > 0.10
          or ai_fairness_equalized_odds > 0.10
          or ai_fairness_calibration_parity > 0.08
        for: 5m
        labels:
          severity: critical
          component: ai-platform
          category: fairness
        annotations:
          summary: "CRITICAL fairness violation detected"
          description: |
            Tenant {{ $labels.tenant_id }} CRITICAL fairness violation:
            - Metric: {{ $labels.metric }}
            - Value: {{ $value | humanizePercentage }}
            - Threshold: {{ $labels.threshold }}
            
            IMMEDIATE ACTION REQUIRED:
            1. Page on-call AI/ML engineer
            2. Investigate affected groups
            3. Consider model rollback if needed
          runbook: https://wiki.terrafusion.dev/runbooks/fairness-critical
```

### Alert Routing

```yaml
# alertmanager/config.yml

route:
  receiver: default
  group_by: ['tenant_id', 'metric']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    # Fairness warnings → Slack + Email
    - match:
        severity: warning
        category: fairness
      receiver: fairness-warnings
      continue: true
    
    # Fairness critical → Page + Slack + Email + Incident
    - match:
        severity: critical
        category: fairness
      receiver: fairness-critical
      
receivers:
  - name: fairness-warnings
    slack_configs:
      - channel: '#ai-fairness-alerts'
        title: '⚠️ Fairness Warning: {{ .GroupLabels.tenant_id }}'
        text: '{{ .CommonAnnotations.description }}'
    email_configs:
      - to: 'ai-team@terrafusion.dev'
  
  - name: fairness-critical
    pagerduty_configs:
      - service_key: '<PAGERDUTY_KEY>'
        severity: 'critical'
    slack_configs:
      - channel: '#incidents'
        title: '🚨 CRITICAL Fairness Violation'
        text: '{{ .CommonAnnotations.description }}'
    email_configs:
      - to: 'ai-team@terrafusion.dev, legal@terrafusion.dev, compliance@terrafusion.dev'
```

---

## Remediation Playbook

When fairness alert triggers:

### Phase 1: Investigation (15 minutes)

1. **Identify affected groups:**
   ```sql
   SELECT zip_code, AVG(accuracy) as avg_accuracy, COUNT(*) as sample_size
   FROM predictions
   WHERE tenant_id = '{tenant_id}'
     AND timestamp > NOW() - INTERVAL '24 hours'
   GROUP BY zip_code
   ORDER BY avg_accuracy ASC;
   ```

2. **Check for data drift:**
   - Compare current feature distributions to training data
   - Look for recent changes in data pipeline

3. **Review recent model updates:**
   - Check if new model version deployed recently
   - Compare fairness metrics before/after update

### Phase 2: Immediate Mitigation (30 minutes)

**Option A: Model Rollback**

```bash
# Rollback to previous model version
kubectl set image deployment/ai-platform-api \
  api=terrafusion/ai-platform-api:v2.3.0  # Previous version

# Verify rollback
curl https://ai-api.terrafusion.dev/health | jq '.model_version'
```

**Option B: Feature Adjustment**

```python
# If specific feature causing bias, temporarily remove
model.set_feature_weights({
    'problematic_feature': 0.0  # Disable feature
})
model.redeploy()
```

**Option C: Prediction Filtering**

```python
# For affected zip codes, flag predictions for manual review
if zip_code in AFFECTED_ZIP_CODES:
    prediction.confidence = 0.5  # Reduce confidence
    prediction.flag_for_review = True
```

### Phase 3: Root Cause Analysis (2-4 hours)

1. Generate fairness audit report
2. Analyze training data for imbalances
3. Review feature importance by group
4. Check for inadvertent proxy variables

### Phase 4: Long-Term Fix (1-2 weeks)

**Options:**

1. **Rebalance training data:**
   - Over-sample underrepresented groups
   - Collect more data for affected regions

2. **Fairness-aware training:**
   ```python
   from fairlearn.reductions import ExponentiatedGradient
   
   # Train with fairness constraints
   mitigator = ExponentiatedGradient(
       estimator=base_model,
       constraints=DemographicParity()
   )
   mitigator.fit(X_train, y_train, sensitive_features=zip_codes)
   ```

3. **Post-processing calibration:**
   ```python
   # Calibrate predictions per group
   for zip_code in unique_zips:
       calibrator = IsotonicRegression()
       calibrator.fit(
           predictions[zip_code], 
           actuals[zip_code]
       )
       predictions[zip_code] = calibrator.transform(predictions[zip_code])
   ```

---

## Compliance & Reporting

### Quarterly Fairness Audit

```python
# reports/fairness_audit.py

def generate_quarterly_fairness_report(tenant_id: str, quarter: str):
    """
    Generate comprehensive fairness audit for compliance
    """
    report = {
        'tenant_id': tenant_id,
        'quarter': quarter,
        'generated_at': datetime.now(),
        'sections': []
    }
    
    # Section 1: Summary Statistics
    report['sections'].append({
        'title': 'Summary Statistics',
        'total_predictions': get_prediction_count(tenant_id, quarter),
        'unique_properties': get_unique_properties(tenant_id, quarter),
        'zip_codes_covered': get_zip_code_count(tenant_id, quarter),
    })
    
    # Section 2: Fairness Metrics
    metrics = compute_quarterly_fairness_metrics(tenant_id, quarter)
    report['sections'].append({
        'title': 'Fairness Metrics',
        'demographic_parity': metrics['demographic_parity'],
        'equalized_odds': metrics['equalized_odds'],
        'calibration_parity': metrics['calibration_parity'],
        'pass_fail': 'PASS' if all_metrics_passing(metrics) else 'FAIL',
    })
    
    # Section 3: Violations
    violations = get_fairness_violations(tenant_id, quarter)
    report['sections'].append({
        'title': 'Violations',
        'count': len(violations),
        'violations': violations,
        'remediation_actions': get_remediation_actions(violations),
    })
    
    # Section 4: Model Performance by Group
    report['sections'].append({
        'title': 'Performance by Group',
        'by_zip_code': compute_metrics_by_zip(tenant_id, quarter),
        'by_neighborhood': compute_metrics_by_neighborhood(tenant_id, quarter),
    })
    
    # Export as PDF for compliance
    export_to_pdf(report, f'fairness_audit_{tenant_id}_{quarter}.pdf')
    
    return report
```

**Report Recipients:**

- Compliance team
- Legal team
- County partners
- External auditors (upon request)

---

## Success Criteria

- ✅ Fairness monitoring operational 24/7
- ✅ Alert latency <15 minutes from violation detection
- ✅ Zero fairness violations >10% in production (first 90 days)
- ✅ Quarterly fairness audits generated automatically
- ✅ Runbooks tested through tabletop exercise
- ✅ ARC approval

---

## References

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Fair Housing Act (42 U.S.C. § 3601)](https://www.justice.gov/crt/fair-housing-act-1)
- [Disparate Impact Analysis](https://www.justice.gov/crt/case-document/file/1022256/download)
- [Fairlearn: Fairness in ML](https://fairlearn.org/)
- [Google's ML Fairness Guide](https://developers.google.com/machine-learning/fairness-overview)

---

**Next Review:** Phase 4.9 Week 1 (October 13, 2025)  
**ARC Decision Date:** TBD  
**Implementation Target:** Phase 4.9 Week 2 (October 20, 2025)
