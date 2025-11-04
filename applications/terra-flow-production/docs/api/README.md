# GeoAssessmentPro API Documentation

This section provides comprehensive documentation for the GeoAssessmentPro API, enabling integration with third-party applications and scripts.

## API Overview

The GeoAssessmentPro API is a RESTful interface providing access to property assessment data, geospatial information, and system functionality. The API follows REST principles and uses JSON for data exchange.

Base URL: `/api`

## Authentication

### [Authentication Guide](./authentication.md)
- Token-based authentication
- API key management
- Permission scopes
- Rate limiting

## API Endpoints

### Core API

#### [Property API](./endpoints/property_api.md)
- GET /api/properties - List properties with pagination and filtering
- GET /api/properties/{parcel_id} - Get details for a specific property
- POST /api/properties - Create a new property (admin only)
- PUT /api/properties/{parcel_id} - Update a property (admin only)
- DELETE /api/properties/{parcel_id} - Delete a property (admin only)

#### [Assessment API](./endpoints/assessment_api.md)
- GET /api/assessments - List assessments with filtering
- GET /api/properties/{parcel_id}/assessments - Get assessments for a property
- POST /api/properties/{parcel_id}/assessments - Create a new assessment
- PUT /api/assessments/{id} - Update an assessment
- DELETE /api/assessments/{id} - Delete an assessment (admin only)

#### [Geospatial API](./endpoints/geospatial_api.md)
- GET /api/spatial/layers - List available GIS layers
- GET /api/spatial/properties - Get property data with geospatial information
- GET /api/spatial/boundaries - Get boundary data for a specified region
- POST /api/spatial/query - Perform a spatial query

### Administrative API

#### [User Management API](./endpoints/user_api.md)
- GET /api/users - List users (admin only)
- GET /api/users/{id} - Get user details (admin only)
- POST /api/users - Create a user (admin only)
- PUT /api/users/{id} - Update a user (admin or self)
- DELETE /api/users/{id} - Delete a user (admin only)

#### [Data Quality API](./endpoints/data_quality_api.md)
- GET /api/data-quality/alerts - List data quality alerts
- GET /api/data-quality/reports - Get data quality reports
- POST /api/data-quality/check - Run a data quality check
- PUT /api/data-quality/alerts/{id}/resolve - Resolve a data quality alert

## Integration Examples

### [Integration Guide](./integration_guide.md)
- Authentication examples
- Common workflows
- Error handling
- Best practices

### [Code Examples](./code_examples.md)
- Python examples
- JavaScript examples
- PowerShell examples
- Curl examples

## API Versioning

The API uses a versioning scheme to ensure backward compatibility. The current version is v1.

- All endpoints should include the version in the URL (e.g., `/api/v1/properties`)
- Breaking changes will be introduced in new versions
- Deprecation notices will be provided for endpoints scheduled for removal

## Error Handling

The API uses standard HTTP status codes and includes detailed error messages in the response body. See the [Error Handling Guide](./error_handling.md) for more information.