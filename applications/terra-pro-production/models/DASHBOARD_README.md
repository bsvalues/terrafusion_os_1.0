# Terrafusion Model Monitoring Dashboard

## Overview

The Terrafusion Model Monitoring Dashboard provides real-time insights into the performance and behavior of our property condition scoring models. This dashboard helps you monitor model drift, understand feature importance, and analyze the audit trail of model inferences.

## Getting Started

### Launch the Dashboard

1. Make sure you have Python installed
2. Run the dashboard using our startup script:

```bash
# From the project root directory
./scripts/start_dashboard.sh
```

3. Open your web browser and navigate to: [http://localhost:8050](http://localhost:8050)

### Dashboard Features

The dashboard consists of four main tabs:

1. **Overview**: Summary statistics and charts showing model performance
2. **Model Drift**: Analysis of differences between AI predictions and user corrections
3. **SHAP Values**: Feature importance visualization using SHAP (SHapley Additive exPlanations)
4. **Audit Log**: Detailed log of all model inferences with filtering capabilities

## Using the Dashboard

### Overview Tab

The Overview tab provides a high-level summary of model performance:

- **Statistics Cards**: Show total predictions, average scores, user feedback count, and more
- **Score Distribution**: Histogram showing the distribution of condition scores
- **Version Usage**: Pie chart showing which model versions are being used
- **Recent Activity**: Table showing the most recent model inferences

Use this tab to quickly gauge the overall health and activity of the system.

### Model Drift Tab

The Model Drift tab tracks the differences between AI predictions and user corrections:

- **Time Range Selection**: Filter to view drift over different time periods
- **Model Version Selection**: Compare drift across different model versions
- **Drift Over Time Chart**: Line chart showing how drift changes over time
- **Feedback Volume Chart**: Bar chart showing how many user corrections are received each day
- **Drift Statistics**: Cards showing key drift metrics such as average drift and drift status
- **Drift Direction Breakdown**: Pie charts showing the proportion of conservative, neutral, and optimistic predictions

Use this tab to identify when models are consistently over or under-estimating property conditions, which may indicate a need for retraining.

### SHAP Values Tab

The SHAP Values tab provides feature importance visualizations:

- **Condition Selection**: Choose from different property condition categories
- **Property Image**: View a representative property image for the selected condition
- **Feature Contributions**: Waterfall chart showing how each feature contributes to the final prediction

Use this tab to understand why properties receive particular condition scores and which features have the greatest impact on the predictions.

### Audit Log Tab

The Audit Log tab provides detailed logging of model inferences:

- **Filter Controls**: Filter by model version, score range, and fallback usage
- **Audit Table**: Detailed table of model inferences with sortable columns
- **Metrics Over Time**: Line chart showing how scores, execution times, and fallback rates change over time

Use this tab to investigate specific model behaviors, identify patterns, and troubleshoot issues.

## Understanding the Data

### Drift Interpretation

- **Positive Drift** means the model scores properties lower than users (conservative)
- **Negative Drift** means the model scores properties higher than users (optimistic)
- **Magnitude matters**: Larger absolute values indicate greater disagreement between the model and users

### SHAP Value Interpretation

- **Positive SHAP values** (red bars) push predictions higher
- **Negative SHAP values** (blue bars) push predictions lower
- **Larger values** (longer bars) have more impact on the prediction

For more details on interpreting SHAP values, see [SHAP_EXPLAINER.md](SHAP_EXPLAINER.md).

## Common Tasks

### Identifying Model Drift

1. Go to the Model Drift tab
2. Select "Last 30 Days" for Time Range
3. Look for consistent positive or negative drift values
4. If absolute drift exceeds 0.5, consider retraining the model

### Understanding Feature Importance

1. Go to the SHAP Values tab
2. Select the property condition category of interest
3. Observe which features have the largest positive and negative effects
4. Use these insights to improve the model or explain predictions to stakeholders

### Auditing Model Performance

1. Go to the Audit Log tab
2. Use filters to focus on specific model versions or score ranges
3. Look for patterns in fallback usage or execution times
4. Identify potential performance issues or anomalies

## Troubleshooting

### Dashboard Won't Start

1. Ensure Python is installed
2. Check if required packages are installed: `pip install dash plotly`
3. Verify the script has execute permissions: `chmod +x scripts/start_dashboard.sh`

### No Data Appears

1. Check if data directories exist: `models/audit_logs`, `models/feedback`, `models/drift_logs`
2. If real data doesn't exist, the dashboard will use demo data for visualization purposes

### Browser Can't Connect

1. Verify the dashboard is running by checking terminal output
2. Try accessing with the full URL: `http://localhost:8050`
3. Check if another service is already using port 8050
