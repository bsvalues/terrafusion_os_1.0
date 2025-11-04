# Terrafusion Condition Model Registry

This directory contains models and the model registry for Terrafusion's property condition prediction system.

## Directory Structure

- `condition_model.pth` - The current production model (symlink to the active version)
- `registry/` - Contains the model registry metadata and versioning information
- `archive/` - Contains archived versions of models with their version numbers

## Versioning System

Terrafusion uses a sophisticated model versioning system that:

1. Tracks all model versions with proper semantic versioning
2. Maintains performance metrics for each model version
3. Allows for rollback to previous versions if needed
4. Enables comparison between model versions to track improvements

## Using the Model Registry

### Command Line Tools

Several scripts are provided to interact with the model registry:

#### Initialize the Registry

```
python scripts/manage_model_registry.py init
```

This will initialize the model registry with the current model.

#### Register a New Model

```
python scripts/manage_model_registry.py register models/condition_model_v2.pth --version "2.0.0" --description "Trained on user feedback data"
```

This will register a new model in the registry.

#### List Available Models

```
python scripts/manage_model_registry.py list
```

This will show all available model versions and their metrics.

#### Set Current Version

```
python scripts/manage_model_registry.py set-current "2.0.0"
```

This will set the current active model version.

#### Compare Model Versions

```
python scripts/manage_model_registry.py compare "1.0.0" "2.0.0"
```

This will compare metrics between two model versions.

### Deploying a New Model

To deploy a newly trained model (e.g., from the training notebook), use:

```
python scripts/deploy_v2_model.py path/to/condition_model_v2.pth --metrics path/to/metrics.json
```

This will register the model with an automatically incremented version number and set it as the current version.

### In Code

The model versioning system is integrated into the `ConditionScorer` class and automatically uses the current version of the model unless specified otherwise.

```python
from backend.condition_inference import ConditionScorer

# Use current version
scorer = ConditionScorer()

# Use specific version
scorer = ConditionScorer(version="1.0.0")

# Use specific model file (will be registered if not already in registry)
scorer = ConditionScorer(model_path="/path/to/model.pth")
```

## Model Training Workflow

1. Collect user feedback via the `/api/condition_feedback` endpoint
2. Retrain model using the `notebooks/train_condition_model_v2.ipynb` notebook
3. Deploy the new model using `scripts/deploy_v2_model.py`
4. The system will automatically use the new model for all future predictions

This approach allows for continuous improvement of the model based on real user feedback.
