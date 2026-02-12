# TerraFusionPlatform - Complete System

TerraFusionPlatform is an advanced AI-powered property tax and appraisal ecosystem that transforms infrastructure assessment through intelligent image analysis and comprehensive model monitoring.

## AI Valuation System

The Terrafusion platform includes a powerful AI valuation engine that can accurately predict property values based on detailed property characteristics, market data, and proprietary algorithms.

### Architecture Overview

The AI valuation system consists of the following components:

1. **PropertyValuationModel** - Core engine that implements both heuristic and machine learning approaches for property valuation, located in `backend/valuation_engine.py`.

2. **Valuation API Endpoints** - RESTful API endpoints that expose the valuation model:

   - `GET /api/ai/value/:property_id` - Get valuation by property ID
   - `POST /api/ai/value` - Get valuation by providing property details

3. **Valuation Service** - Node.js service layer that handles valuation requests, located in `server/valuation-service.js`.

4. **Frontend Integration** - React components that interface with the API, primarily in `client/src/pages/AIValuationPage.tsx`.

### API Response Format

The valuation API returns a comprehensive response with the following structure:

```json
{
  "estimatedValue": 299000,
  "confidenceLevel": "high",
  "valueRange": {
    "min": 284050,
    "max": 313950
  },
  "adjustments": [
    {
      "factor": "Condition",
      "description": "Property condition: Excellent",
      "amount": 15000,
      "reasoning": "Property in Excellent condition affects base value"
    },
    {
      "factor": "Special Feature",
      "description": "Updated Kitchen",
      "amount": 15000,
      "reasoning": "Updated Kitchen adds value to the property"
    }
  ],
  "marketAnalysis": "The real estate market in TestCity, TS has been showing moderate growth...",
  "valuationMethodology": "ML-Enhanced Heuristic Model",
  "modelVersion": "1.0.0",
  "timestamp": "2025-05-09T01:02:27.959Z"
}
```

### Implementation Details

The AI valuation system uses a hybrid approach combining:

1. **Base Heuristic Model** - Calculates initial property values based on square footage, location, and property type.

2. **Feature Adjustment** - Applies value adjustments for property features like fireplaces, updated kitchens, etc.

3. **Machine Learning Enhancement** - Refines the valuation using market trends and comparable sales data.

4. **Confidence Scoring** - Provides confidence levels and value ranges based on data quality and market volatility.

### Usage Examples

#### Example 1: Getting valuation by property ID

```javascript
const response = await fetch("/api/ai/value/1");
const valuation = await response.json();
console.log(`Estimated Value: ${valuation.estimatedValue}`);
```

#### Example 2: Getting valuation by property details

```javascript
const propertyDetails = {
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    zipCode: "12345",
  },
  propertyType: "single-family",
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1800,
  yearBuilt: 1990,
  lotSize: 0.25,
  features: [{ name: "Fireplace" }, { name: "Hardwood Floors" }],
  condition: "Good",
};

const response = await fetch("/api/ai/value", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(propertyDetails),
});

const valuation = await response.json();
```

### Testing

Use the included `test-ai-valuation.js` script to test the API endpoints:

```
node test-ai-valuation.js
```

## Core Features

- Advanced AI property valuation engine
- Comprehensive market analysis
- Detailed adjustment breakdowns
- Confidence scoring
- Multiple API endpoints
- Seamless frontend integration
- Robust error handling
- Fallback mechanisms for reliability
