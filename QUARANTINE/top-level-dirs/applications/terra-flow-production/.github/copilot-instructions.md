# TerraFlow/TerraFusion Development Guide

## Architecture Overview

**TerraFlow** is a comprehensive GIS property assessment platform for Benton County Assessor's Office built on Flask with PostgreSQL/PostGIS. It's part of the larger **TerraFusion Platform** and features a multi-environment setup (development/training/production), AI-powered agents, and sophisticated data stability frameworks.

### Core Components

- **Flask Application**: Multi-service architecture with `main.py` entry point and `app.py` core app
- **Multi-Agent Coordination Platform (MCP)**: AI agent orchestration system in `ai_agents/mcp_core.py`
- **Data Stability Framework**: Comprehensive data quality, security, and governance in `data_stability_framework.py`
- **Multi-Environment Support**: Development, training, and production configurations via `config_loader.py`
- **Supabase Integration**: Optional cloud database and authentication provider with environment-specific configs

## Key Development Patterns

### Configuration Management

Always use `config_loader.py` for environment-aware configuration:

```python
from config_loader import get_config, is_supabase_enabled, get_database_config

# Environment-aware database config
db_config = get_database_config()
env_mode = get_config("env_mode")  # development, training, production
```

Environment variables follow suffix pattern: `SUPABASE_URL_TRAINING`, `DATABASE_URL_PRODUCTION`, etc.

### Database Models & Migrations

- Models in `models.py` use SQLAlchemy with PostGIS extensions
- Role-based access control with `User`, `Role`, `Permission` models using association tables
- Migration scripts in root directory (e.g., `migrate_database.py`)
- Use UUID primary keys and JSONB columns for flexible data storage

### AI Agent Integration

The MCP (Multi-Agent Coordination Platform) manages specialized AI agents with task queues and priorities:

```python
from ai_agents.mcp_core import get_mcp
from ai_agents.geospatial_analysis_agent import GeospatialAnalysisAgent

mcp = get_mcp()
mcp.register_agent_type("GeospatialAnalysisAgent", GeospatialAnalysisAgent)

# Dispatch tasks with priority levels
task_id = mcp.dispatch_task("GeospatialAnalysisAgent", task_data, priority=TaskPriority.HIGH)
```

Available agents: GeospatialAnalysis, DataValidation, SecurityMonitoring, PropertyValuation, AnomalyDetection, DataRecovery, PredictiveAnalytics.

### Multi-Service Architecture Pattern

TerraFlow coordinates multiple services:
- **TerraFlow**: Port 5001 (workflow management) - `app.py`
- **TerraFusion Build**: Port 5000 (main GIS application) - `main.py`
- **Data Hub**: Port 5002 (backend services)

Use `DATA_HUB_URL = "http://localhost:5002"` and `verify_connectivity()` for service integration.

### Data Stability Framework

Core framework in `data_stability_framework.py` provides:
- Data classification and sovereignty management
- Encryption and access control via dedicated security modules
- Security monitoring and audit logging
- Validation and recovery mechanisms through AI agents

### API Structure

RESTful API architecture with modular blueprints:
- Authentication via API keys (`X-API-Key` header)
- Generic CRUD endpoints: `/api/v1/data/{table_name}`
- Custom queries: `POST /api/v1/query`
- GIS-specific endpoints: `/api/v1/gis/{layer_name}`
- Health monitoring: `/health` and `/health/dashboard`

## Development Workflow

### Local Development Setup

```bash
# Use Docker Compose for consistent development environment
docker compose up --build

# Manual setup (if needed)
python initialize_environment.py development
python main.py
```

Services run on:
- **TerraFlow**: Port 5001 (workflow management)
- **TerraFusion Build**: Port 5000 (main GIS application)
- **Data Hub**: Port 5002 (backend services)

### Environment Management

Switch environments using dedicated scripts:

```bash
python switch_environment.py training
python deploy.py production --skip-migrations
```

### Critical Initialization Sequence

`main.py` follows specific initialization order:
1. Supabase environment setup (`set_supabase_env`, `supabase_env_manager`)
2. MCP Core initialization and agent registration
3. Data Stability Framework setup
4. Agent Recovery System initialization
5. Sync Services (legacy and TerraFusion) integration
6. Route registration (mobile, UI components, API, monitoring, maps, reports)

### Testing & Quality

- Use `pytest` with coverage reporting
- Security scanning via Snyk (see `.cursor/rules/snyk_rules.mdc`)
- Code formatting: Black + isort
- Linting: flake8

## Critical Integration Points

### Supabase Integration

Optional cloud provider enabled via environment variables:
- Automatically configures database, auth, and storage when `SUPABASE_URL` + `SUPABASE_KEY` are set
- Check status: `is_supabase_enabled()`
- Supports environment-specific configurations

### Data Hub Connectivity

TerraFlow connects to TerraFusion Data Hub:

```python
DATA_HUB_URL = "http://localhost:5002"
# Check connectivity with verify_connectivity()
```

### Monitoring & Observability

- Prometheus metrics on port 9090
- Grafana dashboards on port 3000
- Health checks at `/health` and `/health/dashboard`
- Performance optimization in `performance/` directory

## Security Considerations

- **LDAP bypass**: Set `BYPASS_LDAP=true` for development
- **Secret management**: Use GitHub Secrets, never commit secrets
- **Database permissions**: Implement role-based access control
- **API security**: Require API keys for all external access

## Deployment Patterns

### CI/CD Pipeline

GitHub Actions workflow in `.github/workflows/`:
- Runs tests with PostGIS container
- Linting and code quality checks
- Staging deployment on main branch push
- Production deployment via manual workflow dispatch

### Multi-Environment Deployment

Each environment has dedicated database URLs and configurations:
- Development: Local PostGIS container
- Training: SQL Server integration
- Production: PostgreSQL with full monitoring

## File Organization

```
├── ai_agents/          # MCP and specialized AI agents
├── api/               # RESTful API endpoints
├── data_governance/   # Data classification and sovereignty
├── deployment/        # Deployment scripts and configs
├── docs/             # Architecture and API documentation
├── monitoring/       # Prometheus and Grafana configs
├── performance/      # Optimization frameworks
├── security/         # Encryption, access control, auditing
├── sync_service/     # Data synchronization between environments
├── tools/            # Development and maintenance utilities
├── main.py           # Application entry point
├── app.py            # Core Flask application
├── models.py         # SQLAlchemy database models
└── config_loader.py  # Environment-aware configuration
```

## Common Operations

- **Database migration**: `python migrate_database.py`
- **Create test data**: `python create_demo_properties.py`
- **Environment initialization**: `python initialize_environment.py {env}`
- **Health monitoring**: Visit `/health/dashboard`
- **API status**: `GET /api/v1/status`

Always check the health dashboard and verify data hub connectivity before major operations.