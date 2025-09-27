# CLAUDE-api.md

API development and integration guidance for Terrafusion OS RESTful services and
external integrations.

## API Architecture

### RESTful API Design

- **Main API Gateway**: Terrafusion.API with controllers and SignalR hubs
- **Unified API**: Consolidated API in `backend/api-unified/`
- **OpenAPI Documentation**: Swagger/OpenAPI specification
- **Versioning Strategy**: API versioning for backward compatibility

### API Configuration

- `backend/Terrafusion.API/appsettings.json`: Main API settings
- `backend/api-unified/appsettings.json`: Unified API configuration
- `backend/Terrafusion.API/Program.cs`: API startup configuration
- `backend/api-unified/Terrafusion.API.http`: HTTP request examples

## API Development Commands

### Development & Testing

```bash
# Start API development server
npm run backend:dev

# Test API endpoints
# Use backend/api-unified/Terrafusion.API.http for testing

# API documentation generation
./scripts/api-documentation-sync.sh --swagger-enhanced --government-standards
```

### API Gateway Management

```bash
# API gateway optimization
./scripts/api-gateway-optimization.sh --throughput=1M-requests --latency=sub-50ms

# External API monitoring
./scripts/external-api-monitoring.sh --sla=99.99% --government-compliance
```

## Core API Controllers

### Properties Controller

- **Location**: `backend/Terrafusion.API/Controllers/PropertiesController.cs`
- **Endpoints**: Property CRUD operations, valuation, assessment
- **Features**: Property search, filtering, bulk operations
- **Security**: Role-based access control, audit logging

### Security Controller

- **Location**: `backend/Terrafusion.API/Controllers/SecurityController.cs`
- **Endpoints**: Authentication, authorization, user management
- **Features**: JWT token management, MFA, role assignment
- **Compliance**: Government security standards

## API Design Patterns

### Request/Response Patterns

- Consistent JSON structure
- Standard HTTP status codes
- Error response standardization
- Pagination for large datasets
- Filtering and sorting capabilities

### Authentication & Authorization

```json
{
  "Authorization": "Bearer {JWT_TOKEN}",
  "Content-Type": "application/json"
}
```

### Error Handling

```json
{
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Property with ID 12345 not found",
    "details": "Additional context information",
    "timestamp": "2025-08-21T10:30:00Z"
  }
}
```

## API Security

### Security Implementation

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- API rate limiting and throttling
- Input validation and sanitization
- CORS configuration for cross-origin requests

### Government Security Compliance

- FISMA compliance requirements
- NIST security framework adherence
- Audit logging for all API operations
- Data encryption in transit and at rest

### Security Headers

```http
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

## External System Integration

### ERP System Integration

```bash
# ERP integration setup
./scripts/integrate-erp-system.sh --vendor=sap --module=financials --real-time

# Government system connectivity
./scripts/government-system-integration.sh --department=revenue --sync=bidirectional
```

### Third-Party APIs

- Banking integration for tax payments
- Insurance system connectivity
- Utility company integrations
- GIS system integration (ESRI)
- Document management systems

### Integration Patterns

- API-first integration approach
- Event-driven architecture
- Message queue integration
- Webhook implementations
- Real-time data synchronization

## API Documentation

### OpenAPI/Swagger Specification

- Comprehensive API documentation
- Interactive API explorer
- Code generation capabilities
- Government-standard documentation
- Version-controlled API specs

### Documentation Generation

```bash
# Generate API documentation
./scripts/generate-api-docs.sh --format=openapi --government-standards

# Update Swagger documentation
./scripts/update-swagger-docs.sh --auto-generate --validate
```

## Real-Time Communication

### SignalR Implementation

- Real-time property updates
- Live dashboard notifications
- Multi-user collaboration features
- System status broadcasting
- Performance monitoring streams

### WebSocket Patterns

- Connection management
- Message broadcasting
- Group communications
- Scalable real-time architecture
- Graceful degradation handling

## API Performance

### Performance Optimization

- Response caching strategies
- Database query optimization
- Async/await implementation
- Connection pooling
- Background job processing

### Monitoring & Metrics

```bash
# API performance monitoring
curl http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/metrics

# Response time analysis
./scripts/api-response-time-analysis.sh --endpoints=all

# Throughput measurement
./scripts/api-throughput-monitoring.sh --concurrent-users=1000
```

### Load Balancing

- Multi-instance deployment
- Health check endpoints
- Circuit breaker patterns
- Retry mechanisms
- Failover strategies

## Multi-County API Architecture

### County-Specific Endpoints

- County isolation patterns
- Multi-tenant architecture
- County-specific configurations
- Data sovereignty compliance
- Cross-county data sharing protocols

### County API Management

```bash
# Deploy county-specific API
./scripts/deploy-county-api.sh --county=benton --configuration=production

# Multi-county API coordination
./scripts/multi-county-api-sync.sh --counties=all --real-time
```

## API Versioning & Evolution

### Versioning Strategy

- Semantic versioning (v1, v2, etc.)
- Backward compatibility maintenance
- Deprecation policies
- Migration guidance
- Version lifecycle management

### API Evolution

- Non-breaking changes priority
- Feature flags for new functionality
- Gradual rollout strategies
- Client notification systems
- Migration tooling

## API Testing

### Testing Strategies

- Unit tests for controllers
- Integration tests for endpoints
- Contract testing with consumers
- Load testing for performance
- Security testing for vulnerabilities

### Test Automation

```bash
# API test execution
./scripts/api-test-suite.sh --endpoints=all --coverage=comprehensive

# Contract testing
./scripts/api-contract-testing.sh --consumers=frontend,mobile

# Load testing
./scripts/api-load-testing.sh --concurrent-users=10000 --duration=1hour
```

## Government API Standards

### Compliance Requirements

- Section 508 accessibility
- Government data standards
- Privacy regulation compliance
- Audit trail requirements
- Data retention policies

### API Governance

- API design standards
- Security review processes
- Performance requirements
- Documentation standards
- Change management procedures

## Troubleshooting APIs

### Common API Issues

- **Authentication Failures**: JWT token validation, expiration
- **Performance Problems**: Database queries, caching issues
- **Integration Errors**: External service connectivity
- **Rate Limiting**: Request throttling, quota management

### Debugging Tools

- API logging and monitoring
- Request/response tracing
- Performance profiling
- Error tracking and alerting
- Health check monitoring

### API Health Monitoring

```bash
# API health checks
curl http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health
curl http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health/ready
curl http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health/live

# API status dashboard
./scripts/api-health-dashboard.sh --real-time --all-endpoints
```

## Message Queue Integration

### Queue Implementation

- Background task processing
- Event-driven architecture
- Message reliability patterns
- Dead letter queue handling
- Priority queue management

### Queue Monitoring

```bash
# Message queue health
./scripts/message-queue-monitoring.sh --queues=all --metrics=depth,throughput

# Queue performance optimization
./scripts/queue-performance-tuning.sh --latency=minimal --throughput=maximum
```

## API Deployment

### Deployment Patterns

- Blue-green deployments
- Canary releases
- Rolling updates
- Feature flag deployments
- Zero-downtime deployments

### Production Configuration

- Environment-specific settings
- Secret management
- SSL/TLS configuration
- Load balancer setup
- CDN integration

### Scaling Strategies

- Horizontal scaling patterns
- Auto-scaling configuration
- Resource allocation optimization
- Performance monitoring
- Capacity planning
