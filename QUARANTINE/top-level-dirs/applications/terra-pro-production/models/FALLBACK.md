# Terrafusion Model Fallback Configuration

## Overview

This document describes the automatic fallback system implemented for the Terrafusion condition models. The fallback system ensures high availability and reliability by automatically switching to a previous, stable model version if the current model encounters errors.

## Configuration Status

**Fallback is currently ENABLED** to version 1.0.0.

This means that if the current model (v2.0.0) encounters any errors during loading or inference, the system will automatically:

1. Log the error
2. Attempt to load the fallback model (v1.0.0)
3. Continue operation with the fallback model
4. Log the recovery event

## How It Works

The automatic fallback mechanism is integrated into the `ConditionScorer` class in `backend/condition_inference.py`. When a model error occurs:

1. **Error Detection**: The system catches exceptions during model loading or inference
2. **Fallback Check**: The system checks if fallback is enabled via `get_fallback_model_version()`
3. **Model Switch**: If fallback is enabled, it loads the specified fallback version
4. **Recovery Logging**: The event is logged in the deployment events log
5. **Continued Operation**: The system continues to operate with the fallback model

## Benefits

- **High Availability**: The system continues to function even if the newer model has issues
- **Production Safety**: Reduces the risk of rolling out new models to production
- **Error Tracking**: All fallback events are logged for later analysis
- **No Downtime**: Users experience no service interruptions if a model fails

## Fallback Configurations

The fallback mechanism can be configured in several ways:

1. **Enabled/Disabled**: Fallback can be enabled or disabled completely
2. **Specific Version**: Fallback can target a specific version number
3. **Previous Version**: Fallback can automatically use the most recent previous version

## Managing Fallback

To modify the fallback configuration, use the direct fallback scripts:

- `scripts/direct_fallback_enable.py` - Enable fallback to v1.0.0
- `scripts/enable_fallback.py --enable --version X.Y.Z` - Enable fallback to specific version
- `scripts/enable_fallback.py --disable` - Disable fallback

## Deployment Logging

All fallback events and configuration changes are logged in:

- `models/deployment_logs/deployment_events.csv` - Chronological event log
- `models/deployment_logs/rollout_status.json` - Current fallback configuration

## Testing Fallback

To test that fallback is working correctly, you can:

1. Intentionally introduce an error in the current model loading
2. Run inference and check the logs for fallback activation
3. Verify that a score is still returned despite the initial error

## Best Practices

- Always have a fallback version enabled in production
- Test new models thoroughly before deploying to production
- Monitor fallback events to identify recurring model issues
- Keep older model versions available for fallback purposes
