# MVP Progress Reporting API Documentation

## Overview

The Progress Reporting API provides endpoints for tracking and updating the progress of various components in the GeoAssessmentPro MVP (Minimum Viable Product). The API allows for tracking overall progress, component-level progress, subcomponent progress, and completion criteria status.

## Base URL

All API endpoints are prefixed with `/mcp/progress/`.

## Authentication

Most endpoints require authentication. For testing, the system provides a development test user that is automatically authorized.

## Endpoints

### Get Progress Report

Retrieve the current MVP progress report with all component and completion information.

- **URL**: `/mcp/progress/report`
- **Method**: `GET`
- **Authentication Required**: Yes
- **Response Format**: JSON

**Response Example**:
```json
{
  "status": "success",
  "report": {
    "timestamp": "2025-04-14T02:50:32",
    "date": "2025-04-14",
    "overall_progress": 76,
    "components": {
      "data_quality_module": {
        "name": "Data Quality & Compliance Module",
        "completion": 89,
        "subcomponents": {
          "data_sanitization": {
            "name": "Data Sanitization",
            "completion": 90
          },
          "quality_alerts": {
            "name": "Quality Alerts",
            "completion": 95
          },
          "compliance_checks": {
            "name": "Compliance Checks",
            "completion": 80
          },
          "validation_rules": {
            "name": "Validation Rules",
            "completion": 90
          }
        }
      },
      // Other components...
    },
    "completion_criteria": {
      "functional_requirements": {
        // Criteria and their completion status
      },
      "performance_criteria": {
        // Criteria and their completion status
      }
      // Other criteria categories...
    },
    "remaining_work": [
      // List of remaining work items with priority
    ],
    "critical_path": [
      // Items on the critical path
    ]
  }
}
```

### Get HTML Progress Report

Generate and download an HTML version of the progress report.

- **URL**: `/mcp/progress/html`
- **Method**: `GET`
- **Authentication Required**: Yes
- **Response**: HTML file download

### Update Component Progress

Update the completion percentage for a specific component.

- **URL**: `/mcp/progress/update/component`
- **Method**: `POST`
- **Authentication Required**: Yes
- **Content Type**: `application/json`
- **Request Body**:
  ```json
  {
    "component_id": "data_quality_module",
    "completion_percentage": 88
  }
  ```
  *Note: The field `completion` can be used instead of `completion_percentage` if preferred.*

- **Response Format**: JSON

**Response Example**:
```json
{
  "status": "success",
  "message": "Updated progress for component data_quality_module to 88%"
}
```

### Update Subcomponent Progress

Update the completion percentage for a specific subcomponent within a component.

- **URL**: `/mcp/progress/update/subcomponent`
- **Method**: `POST`
- **Authentication Required**: Yes
- **Content Type**: `application/json`
- **Request Body**:
  ```json
  {
    "component_id": "data_quality_module",
    "subcomponent_id": "data_sanitization",
    "completion_percentage": 90
  }
  ```
  *Note: The field `completion` can be used instead of `completion_percentage` if preferred.*

- **Response Format**: JSON

**Response Example**:
```json
{
  "status": "success",
  "message": "Updated progress for subcomponent data_quality_module.data_sanitization to 90%"
}
```

### Update Completion Criterion

Update the completion status for a specific criterion.

- **URL**: `/mcp/progress/update/criterion`
- **Method**: `POST`
- **Authentication Required**: Yes
- **Content Type**: `application/json`
- **Request Body**:
  ```json
  {
    "category": "functional_requirements",
    "criterion_name": "data_quality_analytics",
    "complete": true
  }
  ```

- **Response Format**: JSON

**Response Example**:
```json
{
  "status": "success",
  "message": "Updated status for criterion functional_requirements.data_quality_analytics to True"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes along with error messages in case of failure.

**Common Error Responses**:

- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Unexpected server error

**Error Response Example**:
```json
{
  "status": "error",
  "message": "Missing required fields: component_id, completion_percentage"
}
```

## Implementation Notes

- The component progress update may trigger an automatic recalculation of the overall progress.
- Criteria status updates are stored and tracked separately from component/subcomponent progress.
- HTML reports include formatted progress bars and visual indicators for completion status.