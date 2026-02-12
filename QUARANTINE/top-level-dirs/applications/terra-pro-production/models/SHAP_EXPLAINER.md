# Terrafusion SHAP Value Explainer

## Overview

SHAP (SHapley Additive exPlanations) values are used in Terrafusion to provide transparency into how our AI property condition models make decisions. This document explains how to interpret SHAP values and how they're implemented in our system.

## What are SHAP Values?

SHAP values are based on game theory and provide a unified measure of feature importance. They show:

1. **Which features** influenced a prediction the most
2. **How much** each feature contributed to pushing the prediction higher or lower
3. **The direction** of each feature's influence (positive or negative)

## How to Interpret SHAP Visualizations

### SHAP Waterfall Charts

The SHAP waterfall chart in our dashboard shows:

- **Base value**: The expected value of the model output (starting point)
- **Feature bars**: Each bar shows how much a feature contributes to the final prediction
  - **Blue bars** push the prediction lower (decrease property condition score)
  - **Red bars** push the prediction higher (increase property condition score)
- **Final prediction**: The sum of the base value and all feature contributions

### Example Interpretation

For a property with a final condition score of 4.2:

```
Base Score: 3.5
+ Roof Condition: +0.67
+ Exterior Paint: +0.48
+ Windows: +0.22
- Foundation: -0.35
- Siding: -0.12
- Landscaping: -0.20
= Final Score: 4.2
```

This tells you that the excellent roof condition and exterior paint were the biggest positive factors, while foundation issues were the most significant negative factor.

## SHAP for Property Condition Features

Our property condition model analyzes images and extracts features like:

1. **Roof Condition**: Shingle damage, sagging, moss growth
2. **Exterior Paint**: Peeling, fading, stains
3. **Windows**: Cracked glass, broken frames, condensation
4. **Siding**: Cracks, warping, missing pieces
5. **Foundation**: Cracks, settling, water damage
6. **Landscaping**: Overgrowth, dead plants, irrigation issues

Each feature has a SHAP value showing its contribution to the final condition score.

## Implementing SHAP Values

### Technical Implementation

1. **Model Training**: During training, we structure the model to extract meaningful features from property images
2. **Feature Extraction**: When analyzing an image, the model extracts visual features
3. **SHAP Calculation**: We use TreeExplainer or DeepExplainer (depending on the model) to calculate SHAP values
4. **Visualization**: The dashboard displays these values in an intuitive waterfall chart

### Sample Code

```python
import shap
import numpy as np
from PIL import Image

# Load a pre-trained model and image
model = load_model('condition_model_v2.h5')
image = preprocess_image('property_image.jpg')

# Generate a prediction
prediction = model.predict(np.expand_dims(image, axis=0))[0]

# Create a background dataset (sample of training data)
background = dataset[np.random.choice(dataset.shape[0], 100, replace=False)]

# Use DeepExplainer for deep learning models
explainer = shap.DeepExplainer(model, background)

# Calculate SHAP values
shap_values = explainer.shap_values(np.expand_dims(image, axis=0))

# Visualize
shap.waterfall_plot(explainer.expected_value, shap_values[0], feature_names=feature_names)
```

## Benefits of SHAP Values

SHAP values provide several benefits:

1. **Transparency**: Users understand why a property received a particular condition score
2. **Trust**: Clear explanations build trust in the AI system
3. **Improvement**: Identify which features are most important for the model
4. **Fairness**: Detect and correct potential biases in the model

## Interactive SHAP Explorer

Our dashboard includes an interactive SHAP explorer where you can:

1. Select different property condition categories
2. View the relevant property image
3. See SHAP values for the predicted score
4. Understand which features influenced the prediction most

## Conclusion

SHAP values make our property condition scoring more transparent and trustworthy. By understanding why a property received a particular score, users can make more informed decisions and provide better feedback to improve the model.
