# Terrafusion Model Inference Audit Trail

## Overview

The Model Inference Audit Trail is a comprehensive tracking system for monitoring AI model usage and performance. It logs every prediction made by the property condition scoring models, along with detailed metadata about each inference.

## Features

- **Complete Traceability**: Every prediction is logged with timestamp, model version, and score
- **Fallback Tracking**: Automatic recording of when fallback models are used
- **Performance Metrics**: Execution time tracking for each inference
- **User Feedback Integration**: Correlates user corrections with model predictions
- **Version Analysis**: Track performance across different model versions

## Audit Trail Structure

The audit trail is stored in a CSV file at `models/audit_logs/inference_audit_log.csv` with the following columns:

| Column              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `timestamp`         | UTC timestamp of when the inference was made              |
| `filename`          | The filename of the uploaded image                        |
| `model_name`        | Name of the model (e.g., "condition_model")               |
| `model_version`     | Version of the model (e.g., "1.0.0", "2.0.0")             |
| `score`             | The predicted condition score (1.0-5.0)                   |
| `confidence`        | Confidence level of the prediction (optional)             |
| `execution_time_ms` | Time taken for inference in milliseconds                  |
| `fallback_used`     | Whether a fallback model was used (true/false)            |
| `user_id`           | Identifier for the user who uploaded the image (optional) |
| `metadata`          | Additional information about the inference                |

## Monitoring and Analysis

### Dashboard

A real-time monitoring dashboard is available to visualize model performance metrics:

```bash
python scripts/model_monitoring_dashboard.py --dashboard
```

The dashboard provides:

- Overview metrics (total inferences, average score, fallback rate)
- Version comparison analysis
- User feedback correlation
- Fallback rate monitoring
- Raw logs viewer with filtering

### HTML Reports

Generate static HTML reports for model performance analysis:

```bash
python scripts/model_monitoring_dashboard.py --report
```

This creates an HTML report with visualizations and metrics that can be shared with stakeholders.

### Data Export

Export audit logs for external analysis:

```bash
python scripts/export_audit_log.py --format csv --output audit_export.csv
python scripts/export_audit_log.py --format json --output audit_export.json
```

Generate statistics reports:

```bash
python scripts/export_audit_log.py --stats --days 7 --output stats_report.json
```

## Implementation

The audit trail is automatically integrated into both the property condition analysis endpoint and the feedback endpoint. Each prediction triggers an audit log entry with detailed information about the inference.

## Continuous Improvement

The audit trail serves two critical purposes:

1. **Accountability**: Provides a complete record of all AI-generated predictions
2. **Model Improvement**: Captures data to identify areas where the model can be improved

By analyzing the audit logs, you can:

- Detect when the model is underperforming on certain types of images
- Track the effectiveness of new model versions
- Monitor the need for fallback mechanisms
- Identify patterns in user feedback

## Integration with Versioning and Deployment

The audit trail works seamlessly with the model versioning and fallback systems:

- Records which model version made each prediction
- Tracks when fallbacks occur
- Provides data to inform decisions about deploying new versions

## Security and Privacy

The audit log does not store the actual images, only references to filenames. This helps maintain privacy while still providing accountability for model predictions.
