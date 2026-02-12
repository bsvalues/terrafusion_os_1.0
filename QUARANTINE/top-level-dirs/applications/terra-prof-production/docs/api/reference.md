# TerraFusionPro API Reference

This document provides detailed specifications for the TerraFusionPro API endpoints.

## Base URLs

- **Development**: `http://localhost:5002`
- **Production**: `https://api.terrafusionpro.com`

## Authentication

Most API endpoints require authentication using a JWT token.

### Headers

```
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "appraiser"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "expiresIn": "24h"
}
```

#### Register

```
POST /api/auth/register
```

Request body:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

Response:
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "appraiser"
}
```

#### Verify Token

```
GET /api/auth/verify
```

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "appraiser"
  },
  "valid": true
}
```

## User Endpoints

### Get All Users (Admin/Reviewer only)

```
GET /api/users
```

Query parameters:
- `limit` (optional): Number of users to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `sortBy` (optional): Field to sort by (default: id)
- `sortOrder` (optional): Sort order, `asc` or `desc` (default: asc)
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status

Response:
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "appraiser",
      "company": "ABC Appraisals",
      "licenseNumber": "AP12345",
      "isActive": true
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### Get User by ID

```
GET /api/users/:id
```

Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "appraiser",
  "company": "ABC Appraisals",
  "licenseNumber": "AP12345",
  "isActive": true
}
```

### Create User (Admin only)

```
POST /api/users
```

Request body:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "appraiser",
  "company": "XYZ Appraisals",
  "licenseNumber": "AP67890",
  "licenseState": "CA"
}
```

Response:
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "appraiser",
  "company": "XYZ Appraisals",
  "licenseNumber": "AP67890",
  "licenseState": "CA",
  "isActive": true
}
```

### Update User

```
PUT /api/users/:id
```

Request body:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Updated Company"
}
```

Response:
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "appraiser",
  "company": "Updated Company",
  "licenseNumber": "AP67890",
  "licenseState": "CA",
  "isActive": true
}
```

### Delete User (Admin only)

```
DELETE /api/users/:id
```

Response: `204 No Content`

### Change Password

```
POST /api/users/:id/change-password
```

Request body:
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Property Endpoints

### Get All Properties

```
GET /api/properties
```

Query parameters:
- `limit` (optional): Number of properties to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `sortBy` (optional): Field to sort by (default: id)
- `sortOrder` (optional): Sort order, `asc` or `desc` (default: asc)
- `propertyType` (optional): Filter by property type
- `city` (optional): Filter by city
- `state` (optional): Filter by state

Response:
```json
{
  "properties": [
    {
      "id": 1,
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "propertyType": "residential",
      "yearBuilt": 2005,
      "bedrooms": 3,
      "bathrooms": 2,
      "buildingSize": 2000,
      "lotSize": 5000
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### Get Property by ID

```
GET /api/properties/:id
```

Response:
```json
{
  "id": 1,
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "propertyType": "residential",
  "yearBuilt": 2005,
  "bedrooms": 3,
  "bathrooms": 2,
  "buildingSize": 2000,
  "lotSize": 5000,
  "images": [
    {
      "id": 1,
      "url": "https://example.com/property1-exterior.jpg",
      "caption": "Front view",
      "type": "exterior",
      "isPrimary": true
    }
  ]
}
```

### Create Property

```
POST /api/properties
```

Request body:
```json
{
  "address": "456 Elm St",
  "city": "Othertown",
  "state": "NY",
  "zipCode": "54321",
  "propertyType": "residential",
  "yearBuilt": 1998,
  "bedrooms": 4,
  "bathrooms": 2.5,
  "buildingSize": 2500,
  "lotSize": 7500
}
```

Response:
```json
{
  "id": 2,
  "address": "456 Elm St",
  "city": "Othertown",
  "state": "NY",
  "zipCode": "54321",
  "propertyType": "residential",
  "yearBuilt": 1998,
  "bedrooms": 4,
  "bathrooms": 2.5,
  "buildingSize": 2500,
  "lotSize": 7500
}
```

### Update Property

```
PUT /api/properties/:id
```

Request body:
```json
{
  "yearBuilt": 1999,
  "bedrooms": 5
}
```

Response:
```json
{
  "id": 2,
  "address": "456 Elm St",
  "city": "Othertown",
  "state": "NY",
  "zipCode": "54321",
  "propertyType": "residential",
  "yearBuilt": 1999,
  "bedrooms": 5,
  "bathrooms": 2.5,
  "buildingSize": 2500,
  "lotSize": 7500
}
```

### Delete Property

```
DELETE /api/properties/:id
```

Response: `204 No Content`

### Get Property Images

```
GET /api/properties/:id/images
```

Response:
```json
{
  "images": [
    {
      "id": 1,
      "propertyId": 1,
      "url": "https://example.com/property1-exterior.jpg",
      "caption": "Front view",
      "type": "exterior",
      "isPrimary": true
    }
  ]
}
```

### Add Property Image

```
POST /api/properties/:id/images
```

Request body:
```json
{
  "url": "https://example.com/property1-interior.jpg",
  "caption": "Living room",
  "type": "interior",
  "isPrimary": false
}
```

Response:
```json
{
  "id": 2,
  "propertyId": 1,
  "url": "https://example.com/property1-interior.jpg",
  "caption": "Living room",
  "type": "interior",
  "isPrimary": false
}
```

## Report Endpoints

### Get All Reports

```
GET /api/reports
```

Query parameters:
- `limit` (optional): Number of reports to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `sortBy` (optional): Field to sort by (default: id)
- `sortOrder` (optional): Sort order, `asc` or `desc` (default: desc)
- `status` (optional): Filter by status

Response:
```json
{
  "reports": [
    {
      "id": 1,
      "reportNumber": "TFP-20250425-1234",
      "propertyId": 1,
      "status": "draft",
      "effectiveDate": "2025-04-25",
      "property": {
        "id": 1,
        "address": "123 Main St",
        "city": "Anytown",
        "state": "CA"
      },
      "appraiser": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### Get Report by ID

```
GET /api/reports/:id
```

Response:
```json
{
  "id": 1,
  "reportNumber": "TFP-20250425-1234",
  "propertyId": 1,
  "status": "draft",
  "effectiveDate": "2025-04-25",
  "property": {
    "id": 1,
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA"
  },
  "appraiser": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe"
  },
  "comparables": [
    {
      "id": 1,
      "reportId": 1,
      "address": "456 Oak St",
      "salePrice": 450000,
      "saleDate": "2025-03-15"
    }
  ]
}
```

### Create Report

```
POST /api/reports
```

Request body:
```json
{
  "propertyId": 1,
  "effectiveDate": "2025-04-25",
  "purpose": "Refinance"
}
```

Response:
```json
{
  "id": 1,
  "reportNumber": "TFP-20250425-1234",
  "propertyId": 1,
  "appraiserId": 1,
  "status": "draft",
  "effectiveDate": "2025-04-25",
  "purpose": "Refinance"
}
```

### Update Report

```
PUT /api/reports/:id
```

Request body:
```json
{
  "status": "pending_review",
  "estimatedValue": 450000
}
```

Response:
```json
{
  "id": 1,
  "reportNumber": "TFP-20250425-1234",
  "propertyId": 1,
  "appraiserId": 1,
  "status": "pending_review",
  "effectiveDate": "2025-04-25",
  "purpose": "Refinance",
  "estimatedValue": 450000,
  "submittedAt": "2025-04-25T16:30:00Z"
}
```

### Delete Report (Admin only)

```
DELETE /api/reports/:id
```

Response: `204 No Content`

## Comparables Endpoints

### Get Comparables for Report

```
GET /api/comparables/report/:reportId
```

Response:
```json
{
  "comparables": [
    {
      "id": 1,
      "reportId": 1,
      "address": "456 Oak St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "propertyType": "residential",
      "yearBuilt": 2003,
      "salePrice": 450000,
      "saleDate": "2025-03-15",
      "adjustedPrice": 440000,
      "adjustments": {
        "size": -5000,
        "age": -2000,
        "bathrooms": -3000
      }
    }
  ]
}
```

### Add Comparable

```
POST /api/comparables
```

Request body:
```json
{
  "reportId": 1,
  "address": "789 Pine St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "propertyType": "residential",
  "yearBuilt": 2000,
  "bedrooms": 3,
  "bathrooms": 2,
  "buildingSize": 1800,
  "salePrice": 420000,
  "saleDate": "2025-02-10"
}
```

Response:
```json
{
  "id": 2,
  "reportId": 1,
  "address": "789 Pine St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "propertyType": "residential",
  "yearBuilt": 2000,
  "bedrooms": 3,
  "bathrooms": 2,
  "buildingSize": 1800,
  "salePrice": 420000,
  "saleDate": "2025-02-10",
  "addedBy": 1,
  "addedAt": "2025-04-25T16:32:00Z"
}
```

## Form Endpoints

### Get All Forms

```
GET /api/forms
```

Query parameters:
- `limit` (optional): Number of forms to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `sortBy` (optional): Field to sort by (default: id)
- `sortOrder` (optional): Sort order, `asc` or `desc` (default: asc)
- `type` (optional): Filter by form type
- `isActive` (optional): Filter by active status

Response:
```json
{
  "forms": [
    {
      "id": 1,
      "title": "Property Details Form",
      "description": "Collect basic property information",
      "type": "property_details",
      "version": 1,
      "isActive": true
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### Get Form by ID

```
GET /api/forms/:id
```

Response:
```json
{
  "id": 1,
  "title": "Property Details Form",
  "description": "Collect basic property information",
  "type": "property_details",
  "schema": "{\"type\":\"object\",\"properties\":{...}}",
  "uiSchema": "{\"ui:order\":[...]}",
  "version": 1,
  "isActive": true,
  "isRequired": true,
  "propertyTypes": "[\"residential\",\"commercial\"]"
}
```

## Market Analysis Endpoints

### Get Market Data

```
GET /api/market/data
```

Query parameters:
- `location` (required): Location to get market data for (city, zip code, etc.)
- `propertyType` (optional): Property type to filter by
- `period` (optional): Time period to filter by

Response:
```json
{
  "marketData": [
    {
      "id": 1,
      "location": "Anytown, CA",
      "propertyType": "residential",
      "period": "2025-Q1",
      "medianPrice": 450000,
      "averagePrice": 475000,
      "inventoryCount": 120,
      "daysOnMarket": 25,
      "monthsOfSupply": 3.2,
      "soldCount": 45,
      "pricePerSqFt": 237.5,
      "yearOverYearChange": 5.2
    }
  ]
}
```

### Generate Market Analysis

```
POST /api/market/analyze
```

Request body:
```json
{
  "location": {
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  },
  "salesData": [
    {
      "price": 450000,
      "date": "2025-03-10",
      "daysOnMarket": 15
    },
    {
      "price": 425000,
      "date": "2025-02-20",
      "daysOnMarket": 30
    }
  ],
  "timeframe": 12
}
```

Response:
```json
{
  "location": {
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  },
  "metrics": {
    "count": 2,
    "avgPrice": 437500,
    "medianPrice": 437500,
    "minPrice": 425000,
    "maxPrice": 450000,
    "avgDaysOnMarket": 22.5
  },
  "trends": {
    "priceChange": 25000,
    "percentChange": 5.9,
    "daysOnMarketChange": -5,
    "inventoryChange": -3,
    "trend": "Moderate growth"
  },
  "conditions": {
    "marketType": "Seller's Market",
    "demand": "Strong",
    "priceDirection": "Rising",
    "overall": "Good"
  },
  "summary": "The Anytown, CA 12345 real estate market is currently a Seller's Market with strong buyer demand. Property values are rising, with an average price of $437,500 and a median price of $437,500. The average property spends 22.5 days on the market before selling. Overall market conditions are good."
}
```

## Valuation Endpoints

### Find Comparable Properties

```
POST /api/valuation/find-comps
```

Request body:
```json
{
  "subject": {
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "propertyType": "residential",
    "yearBuilt": 2005,
    "bedrooms": 3,
    "bathrooms": 2,
    "buildingSize": 2000
  },
  "reportId": 1,
  "maxResults": 5
}
```

Response:
```json
{
  "subject": {
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "propertyType": "residential",
    "yearBuilt": 2005,
    "bedrooms": 3,
    "bathrooms": 2,
    "buildingSize": 2000
  },
  "comparables": [
    {
      "id": 1,
      "address": "456 Oak St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "propertyType": "residential",
      "yearBuilt": 2003,
      "bedrooms": 3,
      "bathrooms": 2,
      "buildingSize": 1800,
      "salePrice": 450000,
      "saleDate": "2025-03-15",
      "scores": {
        "location": 0.95,
        "size": 0.9,
        "age": 0.92,
        "features": 0.85,
        "total": 0.92
      },
      "adjustments": {
        "buildingSize": 20000,
        "age": 2000
      },
      "adjustedPrice": 472000
    }
  ],
  "recommendedValue": 472000,
  "analysisDate": "2025-04-25T16:35:00Z"
}
```

### Calculate Adjustments

```
POST /api/valuation/calculate-adjustments
```

Request body:
```json
{
  "subject": {
    "yearBuilt": 2005,
    "bedrooms": 3,
    "bathrooms": 2,
    "buildingSize": 2000
  },
  "comparable": {
    "yearBuilt": 2000,
    "bedrooms": 3,
    "bathrooms": 1.5,
    "buildingSize": 1800,
    "salePrice": 430000
  }
}
```

Response:
```json
{
  "adjustments": {
    "buildingSize": 20000,
    "bathrooms": 3750,
    "age": 5000
  },
  "adjustedPrice": 458750,
  "originalPrice": 430000
}
```

## Quality Control Endpoints

### Run QC Check on Report

```
POST /api/qc/check
```

Request body:
```json
{
  "reportId": 1
}
```

Response:
```json
{
  "score": 0.85,
  "status": "approved",
  "completeness": {
    "propertyDescriptionComplete": true,
    "propertyFeaturesComplete": true,
    "comparablesAdequate": true,
    "photosAdequate": false,
    "valuesJustified": true
  },
  "calculations": {
    "adjustmentsConsistent": true,
    "mathAccurate": true,
    "priceInMarketRange": true
  },
  "compliance": {
    "meetsStandards": true,
    "followsMethodology": true,
    "datesCurrent": true
  },
  "issues": [
    {
      "severity": "medium",
      "type": "completeness",
      "message": "Need more property photos"
    }
  ],
  "reviewDate": "2025-04-25T16:37:00Z"
}
```

## PDF Generation Endpoints

### Generate PDF Report

```
POST /api/pdf/generate
```

Request body:
```json
{
  "reportId": 1
}
```

Response:
```json
{
  "success": true,
  "pdfUrl": "https://api.terrafusionpro.com/pdf/1.pdf",
  "generatedAt": "2025-04-25T16:38:00Z"
}
```