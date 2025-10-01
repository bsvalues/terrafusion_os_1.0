# TerraFusion OS API Documentation

## Overview

TerraFusion OS is the world's first complete government operating system with Elite Rust Performance Engine and Golden Ratio mathematical optimization. This .NET 8.0 API Gateway provides comprehensive endpoints for government operations, AI-powered valuations, φ-governed optimization, and AI swarm coordination.

## Features

- **Elite Rust Performance Engine**: 7-crate architecture with FFI bridge integration
- **Golden Ratio Engine**: φ-governed mathematical optimization for government harmony
- **Supreme Commander AI**: 50,000+ agent orchestration and coordination
- **Property Management**: Government-grade property assessment and valuation
- **Government Modules**: Hot-swappable 33+ module ecosystem with marketplace
- **Real-time Communication**: SignalR hubs for live government operations
- **Security**: FISMA/NIST compliant with 11-layer protection system
- **Performance Monitoring**: Elite monitoring with Prometheus integration

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

The API will be available at `https://localhost:\${{TF_PORT_7001:-7001}}` (HTTPS) and
`http://localhost:\${{TF_PORT_7001:-7001}}` (HTTP).

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
  "AllowedOrigins": ["http://localhost:\${{TF_PORT_7001:-7001}}", "https://localhost:\${{TF_PORT_7001:-7001}}"]
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Golden Ratio Engine (φ-Governed Optimization)
- `GET /api/v1/gre/health` - Golden Ratio Engine health status with φ constants
- `GET /api/v1/gre/fib?n=40` - Calculate nth Fibonacci number (fast doubling algorithm)
- `POST /api/v1/gre/score` - Calculate golden ratio score for government data
- `POST /api/v1/gre/tune` - φ-governed parameter tuning
- `POST /api/v1/gre/optimize` - Golden section search optimization
- `POST /api/v1/gre/graph/golden-laplacian` - Graph analysis with φ harmonics

### Elite Rust Performance Engine
- `GET /api/rust-engine/health` - Performance engine status
- `GET /api/rust-engine/agents/status` - AI agent coordination status
- `GET /api/rust-engine/geospatial/parcels` - Geospatial processing status
- `GET /api/rust-engine/valuation/methods` - Available valuation algorithms
- `GET /api/rust-engine/security/classification` - Security layer status
- `GET /api/rust-engine/performance/metrics` - Elite performance metrics

### Properties & Government Assessment
- `GET /api/properties` - Get paginated properties list
- `GET /api/properties/{id}` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property
- `GET /api/properties/stats` - Get property statistics
- `POST /api/properties/{id}/valuation` - Run government-grade valuation

### AI Swarm Orchestration (Supreme Commander Claude)
- `GET /api/aicommand/swarm/status` - Get 50,000+ agent swarm status
- `POST /api/aicommand/execute` - Execute Supreme Commander directive
- `GET /api/aicommand/agents` - Get active agents (Field Generals + Operational Forces)
- `GET /api/aicommand/coordination` - Get quantum coherence metrics
- `POST /api/aicommand/deploy` - Deploy agent formations for government tasks
- `GET /api/aicommand/supreme-commander` - Supreme Commander Claude status

### Government Modules & Marketplace
- `GET /api/modules` - Get available government modules (33+)
- `POST /api/modules/{id}/load` - Hot-swap load module at runtime
- `POST /api/modules/{id}/unload` - Hot-swap unload module
- `GET /api/marketplace/plugins` - Government App Store listings
- `POST /api/marketplace/purchase` - County-to-county module purchase
- `GET /api/marketplace/revenue` - Revenue sharing analytics

### Health & Monitoring

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health information
- `GET /api/health/metrics` - System metrics

### SignalR Hubs

- `/hub/system` - System notifications and real-time updates

## Authentication

The API uses JWT Bearer token authentication. Include the token in the
Authorization header:

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
  "assessedValue": 250000.0,
  "landValue": 75000.0,
  "improvementValue": 175000.0,
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
    "estimatedValue": 275000.0,
    "priceRange": {
      "min": 260000.0,
      "max": 290000.0
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

The API returns standardized error responses following RFC 7807 (Problem
Details):

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
    "http://localhost:\${{TF_PORT_7001:-7001}}",
    "https://localhost:\${{TF_PORT_7001:-7001}}",
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
