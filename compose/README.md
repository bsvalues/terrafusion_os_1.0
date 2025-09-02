# compose - Container Orchestration Hub

**Status**: Operational ✅  
**Purpose**: Docker Compose orchestration and AI service composition  
**Classification**: Container Orchestration and Multi-Environment Deployment  

## Quick Start

### Basic Container Operations
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start production environment
docker-compose -f docker-compose.production.yml up -d

# Start AI services only
docker-compose -f docker-compose.ai.yml up --scale ai-swarm=3

# Start county-specific environment
docker-compose -f docker-compose.yakima-flagship.yml up
```

### Multi-Environment Orchestration
```bash
# Combined AI and development
docker-compose -f docker-compose.dev.yml -f docker-compose.ai.yml up

# Minimal deployment
docker-compose -f docker-compose.minimal.yml up

# Observability stack
docker-compose -f docker-compose.obs.yml up
```

## Available Environments

### Core Environments
```yaml
environments:
  development: "docker-compose.dev.yml"
  production: "docker-compose.production.yml"
  monitoring: "docker-compose.monitoring.yml"
  minimal: "docker-compose.minimal.yml"
```

### Specialized Environments
```yaml
specialized:
  ai_services: "docker-compose.ai.yml"
  observability: "docker-compose.obs.yml"
  demo: "docker-compose.demo.yml"
```

### County-Specific Deployments
```yaml
counties:
  yakima: "docker-compose.yakima-flagship.yml"
  cowlitz: "docker-compose.cowlitz.yml"
  benton: "docker-compose.benton.yml"
```

## Service Architecture

### Core Services
```yaml
core_services:
  api:
    image: "terrafusion/api:latest"
    ports: ["5000:5000"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
    
  frontend:
    image: "terrafusion/frontend:latest"
    ports: ["3000:3000"]
    environment:
      - API_URL=http://api:5000
    
  database:
    image: "postgres:15"
    ports: ["5432:5432"]
    environment:
      - POSTGRES_DB=terrafusion
    volumes:
      - "postgres_data:/var/lib/postgresql/data"
```

### AI Services Composition
```yaml
ai_services:
  ai-command-brain:
    image: "terrafusion/ai-command-brain:latest"
    environment:
      - AI_AGENT_COUNT=1008
      - AI_COORDINATION_MODE=strategic
    resources:
      limits:
        memory: "8G"
        cpus: "4.0"
  
  ai-swarm:
    image: "terrafusion/ai-swarm:latest"
    environment:
      - SWARM_SIZE=1008
      - COORDINATION_PROTOCOL=hierarchical
    resources:
      limits:
        memory: "16G"
        cpus: "8.0"
  
  ai-advanced:
    image: "terrafusion/ai-advanced:latest"
    environment:
      - ML_MODEL_PATH=/app/models
      - AI_PROCESSING_MODE=advanced
    resources:
      limits:
        memory: "12G"
        cpus: "6.0"
```

## Environment Configuration

### Development Features
```yaml
development:
  features:
    - Hot reload enabled
    - Debug ports exposed
    - Development volumes mounted
    - Seed data available
    
  optimization:
    - Fast startup times
    - Live code changes
    - Development debugging
    - Test data seeding
```

### Production Features
```yaml
production:
  features:
    - High availability (3+ replicas)
    - Resource limits enforced
    - Health checks configured
    - Secrets management
    
  optimization:
    - Performance tuning
    - Auto-scaling enabled
    - Load balancing
    - Monitoring integration
```

### AI Service Features
```yaml
ai_services:
  capabilities:
    - 1,008 agent swarm coordination
    - Hierarchical AI command structure
    - Advanced processing algorithms
    - Consciousness layer integration
    
  optimization:
    - GPU acceleration support
    - Dynamic scaling
    - Workload distribution
    - Performance monitoring
```

## Container Management

### Service Discovery
```yaml
networking:
  service_discovery:
    - DNS-based service resolution
    - Automatic service registration
    - Health-based routing
    - Load balancing integration
    
  communication:
    - Inter-service messaging
    - API gateway integration
    - WebSocket support
    - gRPC coordination
```

### Health Monitoring
```yaml
health_checks:
  api_service:
    test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    
  ai_services:
    test: ["CMD", "python", "health_check.py"]
    interval: 60s
    timeout: 30s
    retries: 2
```

### Resource Management
```yaml
resources:
  api_service:
    limits:
      memory: "2G"
      cpus: "1.0"
    reservations:
      memory: "1G"
      cpus: "0.5"
      
  ai_swarm:
    limits:
      memory: "16G"
      cpus: "8.0"
    reservations:
      memory: "8G"
      cpus: "4.0"
```

## Government Integration

### Multi-County Support
- **Yakima County**: Flagship deployment with full AI optimization
- **Cowlitz County**: County-specific workflow customization
- **Benton County**: Production deployment with Harris PACS integration

### Compliance Features
```yaml
compliance:
  security:
    - FISMA-compliant container security
    - Secrets management integration
    - Audit logging automation
    - Network security enforcement
    
  monitoring:
    - Real-time health monitoring
    - Performance metrics collection
    - Compliance validation
    - Audit trail generation
```

## Usage Examples

### Development Workflow
```bash
# Start development stack
docker-compose -f docker-compose.dev.yml up --build

# View service logs
docker-compose -f docker-compose.dev.yml logs -f api

# Scale specific services
docker-compose -f docker-compose.dev.yml up --scale api=3

# Stop and clean up
docker-compose -f docker-compose.dev.yml down --volumes
```

### Production Deployment
```bash
# Deploy production environment
docker-compose -f docker-compose.production.yml up -d

# Check service health
docker-compose -f docker-compose.production.yml ps

# View production logs
docker-compose -f docker-compose.production.yml logs --tail=100 -f

# Rolling update
docker-compose -f docker-compose.production.yml up -d --no-deps api
```

### AI Service Management
```bash
# Start AI services with scaling
docker-compose -f docker-compose.ai.yml up --scale ai-swarm=3

# Monitor AI service performance
docker-compose -f docker-compose.ai.yml exec ai-command-brain python monitor.py

# AI service health check
docker-compose -f docker-compose.ai.yml exec ai-swarm python health_check.py
```

### County-Specific Deployment
```bash
# Deploy Yakima County environment
docker-compose -f docker-compose.yakima-flagship.yml up -d

# Cowlitz County deployment
docker-compose -f docker-compose.cowlitz.yml up -d

# Benton County production
docker-compose -f docker-compose.benton.yml up -d
```

---

## Container Orchestration Excellence

Terrafusion OS compose directory provides comprehensive container orchestration with Docker Compose configurations for development, production, AI services, and county-specific deployments. The system features multi-environment support, AI service composition, and government-grade security.

**Ready for Government Deployment**: Complete container orchestration with multi-county support and compliance integration.

**Authority**: Terrafusion Container Orchestration Division  
**Last Updated**: August 27, 2025