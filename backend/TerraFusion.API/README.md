# Terrafusion OS API Documentation

## Overview

Terrafusion OS is an enterprise-grade property assessment and AI-powered valuation system built with .NET 8.0. This API provides comprehensive endpoints for property management, AI-driven valuations, cost analysis, and system monitoring.

## Features

- **Property Management**: CRUD operations for properties with comprehensive data validation
- **AI-Powered Valuations**: Machine learning models for property value estimation
- **Cost Analysis**: Advanced cost matrix calculations and market trend analysis
- **Real-time Communication**: SignalR hubs for live updates and notifications
- **Health Monitoring**: Comprehensive system health checks and metrics
- **Security**: JWT authentication with role-based authorization
- **Error Handling**: Robust error handling with detailed API responses

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- SQLite (for development)
- Visual Studio 2022 or VS Code

### Installation

1. Clone the repository
2. Navigate to the API project directory
3. Restore dependencies:
   ```bash
   dotnet restore
   ```
4. Update the database:
   ```bash
   dotnet ef database update
   ```
5. Run the application:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:7001` (HTTPS) and `http://localhost:5001` (HTTP).

### Configuration

Key configuration settings in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=terrafusion.db"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key-here",
    "Issuer": "Terrafusion.API",
    "Audience": "Terrafusion.Client",
    "ExpirationMinutes": 60
  },
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://localhost:3001"
  ]
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Properties
- `GET /api/properties` - Get paginated properties list
- `GET /api/properties/{id}` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property
- `GET /api/properties/stats` - Get property statistics

### AI Models
- `GET /api/aimodels` - Get available AI models
- `GET /api/aimodels/{id}` - Get AI model details
- `POST /api/aimodels/{id}/predict` - Run prediction
- `POST /api/aimodels/{id}/train` - Train model
- `GET /api/aimodels/{id}/health` - Get model health status

### Cost Analysis
- `POST /api/costforge/analyze` - Analyze property costs
- `POST /api/costforge/compare` - Compare multiple properties
- `POST /api/costforge/forecast` - Generate cost forecasts
- `GET /api/costforge/matrices` - Get cost matrices

### AI Command
- `GET /api/aicommand/swarm/status` - Get AI swarm status
- `POST /api/aicommand/execute` - Execute AI command
- `GET /api/aicommand/agents` - Get active agents
- `GET /api/aicommand/tasks` - Get active tasks
- `GET /api/aicommand/metrics` - Get swarm metrics

### Health & Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health information
- `GET /api/health/metrics` - System metrics

### SignalR Hubs
- `/hub/system` - System notifications and real-time updates

## Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Example Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "expiresAt": "2024-01-01T12:00:00Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "roles": ["User"]
  }
}
```

## Data Models

### PropertyDto

```json
{
  "id": 1,
  "parcelNumber": "123-456-789",
  "address": "123 Main St, City, State 12345",
  "ownerName": "John Doe",
  "assessedValue": 250000.00,
  "landValue": 75000.00,
  "improvementValue": 175000.00,
  "countyId": 1,
  "countyName": "Example County",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### PredictionResultDto

```json
{
  "modelId": "model-guid",
  "confidence": 0.95,
  "predictions": {
    "estimatedValue": 275000.00,
    "priceRange": {
      "min": 260000.00,
      "max": 290000.00
    }
  },
  "processingTimeMs": 150.5,
  "timestamp": "2024-01-01T12:00:00Z",
  "metadata": {
    "modelVersion": "v3.2",
    "featuresUsed": 25
  }
}
```

## Error Handling

The API returns standardized error responses following RFC 7807 (Problem Details):

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "The request contains invalid data",
  "instance": "/api/properties",
  "errors": {
    "ParcelNumber": ["The ParcelNumber field is required."]
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authenticated users**: Higher limits based on subscription tier
- **Rate limit headers** included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Monitoring & Observability

### Health Checks

The API provides comprehensive health checks:

- **Database connectivity** - Verifies database connection and query performance
- **AI Engine status** - Checks AI model availability and performance
- **System resources** - Monitors memory, CPU, and disk usage
- **External dependencies** - Validates third-party service connectivity

### Metrics

Key performance metrics are exposed:

- Request/response times
- Error rates
- AI model accuracy
- System resource utilization
- Database query performance

### Logging

Structured logging using Serilog:

- **Console output** for development
- **File logging** with daily rotation
- **Correlation IDs** for request tracing
- **Performance logging** for slow queries

## Security

### Security Headers

The API automatically adds security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'`

### Input Validation

- **Model validation** using Data Annotations
- **Request size limits** (10MB maximum)
- **Content-type validation** for POST/PUT requests
- **SQL injection protection** via Entity Framework

### CORS Configuration

CORS is configured for specific origins:

```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://localhost:3001",
    "https://your-production-domain.com"
  ]
}
```

## Development

### Project Structure

```
Terrafusion.API/
├── Controllers/           # API controllers
├── Hubs/                 # SignalR hubs
├── Middleware/           # Custom middleware
├── Program.cs            # Application entry point
├── appsettings.json      # Configuration
└── README.md            # This file

Terrafusion.Core/
├── DTOs/                # Data transfer objects
├── Entities/            # Domain entities
├── Enums/               # Enumerations
├── Services/            # Service interfaces
└── Mapping/             # AutoMapper profiles

Terrafusion.Data/
├── TerraFusionContext.cs # EF DbContext
└── Migrations/          # Database migrations

Terrafusion.AI/
└── Services/            # AI service implementations
```

### Adding New Endpoints

1. Create controller in `Controllers/` directory
2. Add service interface in `Terrafusion.Core/Services/`
3. Implement service in appropriate project
4. Register service in `Program.cs`
5. Add integration tests

### Database Migrations

```bash
# Add new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Remove last migration
dotnet ef migrations remove
```

## Support

For technical support or questions:

- **Email**: support@terrafusion.com
- **Documentation**: https://docs.terrafusion.com
- **API Status**: https://status.terrafusion.com

## License

Copyright © 2024 Terrafusion Technologies. All rights reserved.
