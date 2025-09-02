# Terrafusion REST API Reference

Complete reference for the Terrafusion REST API v1.

## Base URL
```
https://api.terrafusion.ai/v1
```

## Authentication
All API requests require authentication via API Key and JWT Bearer Token:

```bash
curl -H "X-API-Key: your-api-key" \
     -H "Authorization: Bearer jwt-token" \
     -H "Content-Type: application/json"
```

---

## 🏠 Properties API

### List Properties
```http
GET /properties
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | integer | Number of results (max 100) | `limit=20` |
| `offset` | integer | Pagination offset | `offset=40` |
| `location` | string | City, state, or ZIP code | `location=Seattle,WA` |
| `type` | string | Property type | `type=residential` |
| `min_price` | number | Minimum price filter | `min_price=100000` |
| `max_price` | number | Maximum price filter | `max_price=500000` |
| `bedrooms` | integer | Number of bedrooms | `bedrooms=3` |
| `bathrooms` | number | Number of bathrooms | `bathrooms=2.5` |
| `min_sqft` | integer | Minimum square footage | `min_sqft=1200` |
| `max_sqft` | integer | Maximum square footage | `max_sqft=3000` |

**Example Request:**
```bash
GET /v1/properties?location=Seattle,WA&type=residential&min_price=300000&max_price=600000&bedrooms=3
```

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "prop_abc123",
        "address": {
          "street": "123 Main St",
          "city": "Seattle",
          "state": "WA",
          "zip": "98101",
          "country": "US"
        },
        "type": "residential",
        "subtype": "single_family",
        "bedrooms": 3,
        "bathrooms": 2.5,
        "sqft": 2100,
        "lot_size": 0.25,
        "year_built": 1995,
        "current_value": {
          "estimate": 575000,
          "confidence": 0.87,
          "last_updated": "2025-08-03T10:30:00Z"
        },
        "features": [
          "garage",
          "fireplace",
          "hardwood_floors"
        ],
        "coordinates": {
          "lat": 47.6062,
          "lng": -122.3321
        },
        "images": [
          "https://images.terrafusion.ai/prop_abc123/exterior_1.jpg"
        ]
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 1247,
      "has_more": true
    }
  },
  "meta": {
    "timestamp": "2025-08-03T12:00:00Z",
    "request_id": "req_xyz789"
  }
}
```

### Get Property Details
```http
GET /properties/{property_id}
```

**Path Parameters:**
- `property_id` (string, required): Unique property identifier

**Example Request:**
```bash
GET /v1/properties/prop_abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "prop_abc123",
      "address": {
        "street": "123 Main St",
        "city": "Seattle",
        "state": "WA",
        "zip": "98101",
        "country": "US",
        "formatted": "123 Main St, Seattle, WA 98101"
      },
      "type": "residential",
      "subtype": "single_family",
      "bedrooms": 3,
      "bathrooms": 2.5,
      "sqft": 2100,
      "lot_size": 0.25,
      "year_built": 1995,
      "current_value": {
        "estimate": 575000,
        "confidence": 0.87,
        "range": {
          "low": 520000,
          "high": 630000
        },
        "last_updated": "2025-08-03T10:30:00Z"
      },
      "value_history": [
        {
          "date": "2025-07-01",
          "estimate": 570000
        },
        {
          "date": "2025-06-01",
          "estimate": 565000
        }
      ],
      "features": [
        "garage",
        "fireplace",
        "hardwood_floors",
        "updated_kitchen",
        "fenced_yard"
      ],
      "coordinates": {
        "lat": 47.6062,
        "lng": -122.3321
      },
      "zoning": "R-1",
      "school_district": "Seattle Public Schools",
      "tax_info": {
        "assessed_value": 520000,
        "annual_tax": 8320,
        "tax_rate": 0.016
      },
      "neighborhood": {
        "name": "Capitol Hill",
        "walk_score": 89,
        "transit_score": 78,
        "bike_score": 82
      },
      "images": [
        {
          "url": "https://images.terrafusion.ai/prop_abc123/exterior_1.jpg",
          "type": "exterior",
          "caption": "Front view of property"
        }
      ],
      "virtual_tour": "https://tours.terrafusion.ai/prop_abc123"
    }
  }
}
```

### Create Property
```http
POST /properties
```

**Request Body:**
```json
{
  "address": {
    "street": "456 Oak Ave",
    "city": "Portland",
    "state": "OR",
    "zip": "97201"
  },
  "type": "residential",
  "subtype": "condo",
  "bedrooms": 2,
  "bathrooms": 2,
  "sqft": 1200,
  "year_built": 2010,
  "features": ["balcony", "in_unit_laundry"]
}
```

---

## 💰 Valuations API

### Get Property Valuation
```http
POST /valuations
```

**Request Body:**
```json
{
  "property_id": "prop_abc123",
  "valuation_type": "comprehensive",
  "include_comparables": true,
  "include_market_analysis": true,
  "custom_adjustments": {
    "renovation_value": 25000,
    "condition_adjustment": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valuation": {
      "id": "val_def456",
      "property_id": "prop_abc123",
      "estimate": 575000,
      "confidence": 0.87,
      "range": {
        "low": 520000,
        "high": 630000
      },
      "methodology": "hybrid_ml_comparative",
      "factors": {
        "location_score": 0.92,
        "condition_score": 0.85,
        "market_trends": 0.78,
        "comparable_properties": 0.89
      },
      "comparables": [
        {
          "property_id": "prop_ghi789",
          "address": "789 Pine St, Seattle, WA",
          "sale_price": 560000,
          "sale_date": "2025-06-15",
          "similarity_score": 0.94,
          "adjustments": {
            "size": 5000,
            "age": -8000,
            "condition": 3000
          }
        }
      ],
      "market_analysis": {
        "median_price": 550000,
        "price_per_sqft": 274,
        "days_on_market": 18,
        "price_trend_3m": 0.03,
        "price_trend_12m": 0.08
      },
      "generated_at": "2025-08-03T12:00:00Z",
      "valid_until": "2025-08-10T12:00:00Z"
    }
  }
}
```

### Get Valuation History
```http
GET /properties/{property_id}/valuations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Start date (ISO 8601) |
| `end_date` | string | End date (ISO 8601) |
| `interval` | string | Data interval (daily, weekly, monthly) |

---

## 🔍 Search API

### Advanced Property Search
```http
POST /search/properties
```

**Request Body:**
```json
{
  "filters": {
    "location": {
      "center": {
        "lat": 47.6062,
        "lng": -122.3321
      },
      "radius": 5,
      "unit": "miles"
    },
    "property_type": ["residential"],
    "price_range": {
      "min": 300000,
      "max": 700000
    },
    "bedrooms": {
      "min": 2,
      "max": 4
    },
    "features": ["garage", "fireplace"]
  },
  "sort": [
    {
      "field": "current_value.estimate",
      "order": "desc"
    }
  ],
  "pagination": {
    "limit": 25,
    "offset": 0
  }
}
```

### Saved Searches
```http
POST /search/saved
```

**Request Body:**
```json
{
  "name": "Seattle Family Homes",
  "criteria": {
    "location": "Seattle, WA",
    "type": "residential",
    "bedrooms": 3,
    "max_price": 600000
  },
  "notifications": {
    "email": true,
    "frequency": "daily"
  }
}
```

---

## 📊 Analytics API

### Market Analytics
```http
GET /analytics/market
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `location` | string | Geographic area |
| `property_type` | string | Property type filter |
| `time_period` | string | Analysis period (1m, 3m, 6m, 1y) |

**Response:**
```json
{
  "success": true,
  "data": {
    "market_stats": {
      "median_price": 625000,
      "average_price": 680000,
      "price_per_sqft": 295,
      "total_inventory": 2847,
      "new_listings": 156,
      "sales_volume": 89,
      "average_dom": 21,
      "month_over_month_change": 0.023,
      "year_over_year_change": 0.087
    },
    "price_trends": [
      {
        "date": "2025-07-01",
        "median_price": 620000,
        "average_price": 675000
      }
    ],
    "inventory_trends": [
      {
        "date": "2025-07-01",
        "active_listings": 2901,
        "new_listings": 142,
        "sold_listings": 95
      }
    ]
  }
}
```

### Portfolio Analytics
```http
POST /analytics/portfolio
```

**Request Body:**
```json
{
  "properties": ["prop_abc123", "prop_def456", "prop_ghi789"],
  "analysis_type": "comprehensive",
  "include_projections": true,
  "projection_years": 5
}
```

---

## 🗺️ Geospatial API

### Geocoding
```http
GET /geo/geocode
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | Address to geocode |
| `components` | boolean | Return address components |

### Reverse Geocoding
```http
GET /geo/reverse
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `level` | string | Detail level (address, neighborhood, city) |

### Neighborhood Information
```http
GET /geo/neighborhoods/{neighborhood_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "neighborhood": {
      "id": "nbr_cap001",
      "name": "Capitol Hill",
      "city": "Seattle",
      "state": "WA",
      "boundaries": {
        "type": "Polygon",
        "coordinates": [...]
      },
      "demographics": {
        "population": 26000,
        "median_age": 32,
        "median_income": 78000,
        "education_level": "bachelor_plus"
      },
      "amenities": {
        "walk_score": 89,
        "transit_score": 78,
        "bike_score": 82,
        "restaurants": 127,
        "parks": 5,
        "schools": 8
      },
      "market_stats": {
        "median_home_price": 675000,
        "price_per_sqft": 315,
        "appreciation_1y": 0.092
      }
    }
  }
}
```

---

## 📈 Market Intelligence API

### Market Trends
```http
GET /market/trends
```

### Economic Indicators
```http
GET /market/indicators
```

### Forecasting
```http
POST /market/forecast
```

**Request Body:**
```json
{
  "location": "Seattle, WA",
  "property_type": "residential",
  "forecast_horizon": 12,
  "confidence_level": 0.95
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field_errors": {
        "bedrooms": "Must be a positive integer",
        "price_range.max": "Must be greater than min price"
      }
    }
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "Invalid or expired authentication token",
    "details": {
      "expired_at": "2025-08-03T10:00:00Z"
    }
  }
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": 3600,
      "retry_after": 2847
    }
  }
}
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const Terrafusion = require('@terrafusion/sdk');

const client = new Terrafusion({
  apiKey: 'your-api-key',
  token: 'your-jwt-token'
});

// Get property details
const property = await client.properties.get('prop_abc123');

// Search properties
const results = await client.properties.search({
  location: 'Seattle, WA',
  type: 'residential',
  maxPrice: 600000
});

// Get valuation
const valuation = await client.valuations.create({
  propertyId: 'prop_abc123',
  type: 'comprehensive'
});
```

### Python
```python
from terrafusion import TerraFusionClient

client = TerraFusionClient(
    api_key='your-api-key',
    token='your-jwt-token'
)

# Get property details
property = client.properties.get('prop_abc123')

# Search properties
results = client.properties.search(
    location='Seattle, WA',
    property_type='residential',
    max_price=600000
)

# Get valuation
valuation = client.valuations.create(
    property_id='prop_abc123',
    valuation_type='comprehensive'
)
```

---

*For more examples and detailed usage, see our [SDK Documentation](./sdks/) and [API Examples](./examples/).*