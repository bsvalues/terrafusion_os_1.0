# CLAUDE-backend.md

Backend development guidance for Terrafusion OS .NET 8.0 API services with complete DevOps integration and AI swarm orchestration.

## Backend Architecture (.NET 8.0) - PRODUCTION READY

### Solution Structure - ENHANCED WITH AI SWARM & 32 MODULE SYSTEM
- **Terrafusion.API**: Main API gateway with controllers and SignalR hubs ✅
- **Terrafusion.Core**: Business logic, entities, DTOs, and services ✅
- **Terrafusion.Data**: Entity Framework Core data access layer ✅
- **Terrafusion.AI**: AI services including ML models and property valuation ✅
- **DevOps Orchestration**: Complete AI swarm integration with 1,008 agents ✅
- **Claude-Flow Integration**: v2.0.0 Alpha with 87 MCP tools ✅
- **Legacy Integration Services**: LegacyDatabaseService, HarrisPacsLegacyService ✅
- **Module Backend Services**: 32 modules with C# service layer integration ✅
- **TerraFusionSync Integration**: Central orchestration hub for all legacy systems ✅
- **Harris PACS Integration**: v12.4.7 with 89,247 Benton County parcels ✅
- **Solution Structure**: Located in `backend/Terrafusion.sln`

### COMPLETED BACKEND ENHANCEMENTS ✅

**DevOps & AI Swarm Integration:**
- **AI Swarm Orchestrator** - Python FastAPI service managing 1,008 agents
- **Claude-Flow v2.0.0** - TypeScript service with hive-mind coordination
- **DevOps Orchestration Service** - C# backend with realistic 3.9x performance optimization
- **Enhanced Docker Compose** - Full stack with PostgreSQL, Redis, monitoring
- **Security Hardening** - Multi-stage builds, non-root users, vulnerability scanning
- **Government Compliance** - FISMA-HIGH controls and audit trails
- **32-Module Service Architecture** - Each module has dedicated C# backend services
- **Legacy Database Adapters** - Universal support for Harris PACS, Tyler, Aumentum, Vision
- **TerraFusionSync Backend** - Rust + C# hybrid for maximum performance
- **Module Hot-Reload Service** - Dynamic module loading and configuration

### Backend Commands

#### Development
```bash
# Start backend only (.NET API)
npm run backend:dev

# .NET code formatting
cd backend && dotnet format
```

#### Build & Deploy
```bash
# Backend build (.NET publish)
npm run backend:build

# Docker production build
npm run deploy:docker

# Terraform infrastructure deployment
npm run deploy:terraform
```

#### Testing
```bash
# Backend tests (.NET)
npm run backend:test
```

## Key Backend Configuration

### Configuration Files
- `backend/Terrafusion.API/appsettings.json`: API configuration
- `backend/Terrafusion.API/appsettings.Development.json`: Dev settings
- `backend/Terrafusion.sln`: Visual Studio solution file
- `backend/api-unified/`: Unified API configuration

### Infrastructure Configuration
- `docker-compose.dev.yml`: Development containerization
- `infrastructure/kubernetes/`: Kubernetes deployment manifests
- `deployment/`: Production deployment configurations

## Database & Data Layer

### Database Schema

#### Primary Entities
- **Properties**: Property records with assessment data
- **Counties**: Government jurisdiction information
- **Valuations**: AI-powered property valuations
- **AIModels**: Metadata for AI model deployments
- **SystemLogs**: Audit trails and monitoring

### Migration Strategy
- Entity Framework Core migrations in `Terrafusion.Data`
- Data consolidation scripts in `migration/`
- Backup and recovery procedures documented

### Database Commands
```bash
# Run data migration scripts
npm run migrate:data

# Migrate modules
npm run migrate:modules

# Validate system after migration
npm run validate
```

## Development Patterns

### Code Organization
- Follow domain-driven design in backend services
- Use repository pattern for data access
- Apply CQRS with MediatR for complex operations
- Implement clean architecture principles

### API Design
- RESTful API design patterns
- OpenAPI/Swagger documentation
- Versioning strategy for API evolution
- Consistent error handling and responses

### Performance Considerations
- Redis caching for frequently accessed data
- SignalR for real-time communication
- Optimize database queries with Entity Framework
- Async/await patterns for scalability

## Security & Compliance

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Multi-factor authentication support
- Government security standards compliance

### Data Protection
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- FISMA and NIST compliance framework
- Audit logging for all operations

### Security Implementation
- Input validation and sanitization
- SQL injection prevention
- Rate limiting and throttling
- Security headers implementation

## DevOps & Operations

### Container Management
```bash
# Build all services
docker-compose build

# Start infrastructure services only
docker-compose up -d postgres redis elasticsearch

# Scale specific services
docker-compose up -d --scale api=3
```

### Database Operations
```bash
# Database backup
./scripts/backup-database.sh production

# Database performance testing
./scripts/db-performance-test.sh

# Check connection pool
# SQL: SELECT * FROM pg_stat_activity;
```

### Monitoring & Logging
- Application performance monitoring
- Database query analysis with Entity Framework logging
- Redis monitoring for cache performance
- Structured logging with Serilog

## Production Deployment

### Environment Configuration
```bash
# Development
export ASPNETCORE_ENVIRONMENT=Development
export CONNECTION_STRING="Host=localhost;Database=terrafusion_dev"

# Production
export ASPNETCORE_ENVIRONMENT=Production
export CONNECTION_STRING="Host=prod-db-cluster;Database=terrafusion_prod"
```

### Deployment Patterns
- Blue-green deployments
- Rolling updates with zero downtime
- Canary deployments for testing
- Health checks and readiness probes

### Infrastructure as Code
```bash
# Terraform operations
cd infrastructure/terraform
terraform init
terraform plan -var-file="environments/production.tfvars"
terraform apply

# Kubernetes operations
kubectl apply -f infrastructure/kubernetes/
kubectl get pods -n terrafusion-system
```

## Performance & Scalability

### Optimization Strategies
- Database connection pooling
- Response caching strategies
- Background job processing
- Load balancing configuration

### Monitoring & Metrics
```bash
# Check application metrics
curl http://localhost:9090/metrics

# Health check endpoints
curl http://localhost:5000/health
curl http://localhost:5000/health/ready
curl http://localhost:5000/health/live
```

## API Integration

### External Systems
- ERP system integration patterns
- Government system connectivity
- Third-party service integration
- API gateway management

### Message Queues
- Background task processing
- Event-driven architecture
- Message reliability patterns
- Queue monitoring and management

## Troubleshooting

### Common Backend Issues
- **Database Connection**: Verify PostgreSQL and connection strings
- **Performance Issues**: Check query optimization and caching
- **Memory Leaks**: Monitor application memory usage
- **API Errors**: Review logs and error handling

### Debugging Tools
- .NET diagnostics tools for backend analysis
- Entity Framework logging and profiling
- Application Insights for production monitoring
- Database performance monitoring tools

## Multi-County Architecture

### County-Specific Deployment
```bash
# Deploy new county from template
./scripts/deploy-county.sh --county=clark --template=benton

# County-specific customization
./scripts/customize-county-config.sh --county=island

# Multi-county data synchronization
./scripts/data-synchronization.sh --multi-county --real-time
```

### Scalability Considerations
- Multi-tenant architecture patterns
- County data isolation
- Cross-county resource sharing
- Performance optimization per county