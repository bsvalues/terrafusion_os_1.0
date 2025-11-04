# Model Deployment Logs

This directory contains deployment logs and rollout status for Terrafusion's model versioning system.

## Files

- `deployment_events.csv` - Chronological log of all deployment events (deployments, rollbacks, errors, recoveries)
- `rollout_status.json` - Current deployment status and fallback configuration

## Event Types

The system logs the following types of events:

- **deployment** - When a new model version is deployed
- **rollback** - When a model is rolled back to a previous version
- **error** - When an error occurs during model loading or inference
- **recovery** - When the system recovers using a fallback model
- **config_change** - When the deployment configuration is changed

## Automatic Fallback System

Terrafusion's model deployment system includes an automatic fallback mechanism that can:

1. Detect failures in the primary model
2. Automatically fall back to a specified previous version
3. Log the recovery event for later analysis
4. Continue operation without service interruption

## Managing Fallback Configuration

Use the `scripts/enable_fallback.py` script to manage fallback settings:

```
# Enable fallback to a specific version
python scripts/enable_fallback.py --enable --version 1.0.0

# Enable fallback to the most recent previous version
python scripts/enable_fallback.py --enable

# Disable fallback
python scripts/enable_fallback.py --disable

# Show current status
python scripts/enable_fallback.py --status
```

## Logging Deployment Events

Use the `scripts/log_deployment.py` script to manually log deployment events:

```
# Log a deployment event
python scripts/log_deployment.py --event deployment --model condition_model --version 2.0.0 --message "Deployed new model"

# Log a rollback event
python scripts/log_deployment.py --event rollback --model condition_model --version 1.0.0 --message "Rolled back due to performance issues"
```

## Monitoring

The deployment logs can be used to monitor the health of the model deployment system and track issues over time. Consider setting up alerts for error events to proactively address issues.
