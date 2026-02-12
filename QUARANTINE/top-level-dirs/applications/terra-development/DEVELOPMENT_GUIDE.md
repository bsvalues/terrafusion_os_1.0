# TerraFusion Development Guide
**Complete Developer Onboarding & Daily Workflow**

## 🚀 Getting Started (New Developer - 10 Minutes)

### Step 1: Understanding the Platform
1. **Read** `PLATFORM_ARCHITECTURE.md` - 5 minutes to understand what you're working with
2. **Review** `APPLICATION_REGISTRY.json` - See all 16 applications and their purposes
3. **Check** `README.md` - Platform overview and quick commands

### Step 2: Environment Setup
```bash
# 1. Copy environment template
cp ENVIRONMENT_CONFIG.template .env

# 2. Fill in your specific values in .env
# Required minimums:
# - OPENAI_API_KEY
# - Database passwords
# - API keys for external systems you'll use

# 3. Run setup script (when available)
./scripts/setup_development.sh
```

### Step 3: Verify Setup
```bash
# Start the platform
./scripts/start_platform.sh

# Check all services are running
./scripts/health_check.sh

# If everything is green, you're ready to develop!
```

---

## 📋 Platform Understanding

### What is TerraFusion?
**TerraFusion is a comprehensive enterprise platform for county assessor offices** that provides:
- **AI-powered property assessment** using advanced ML models
- **Real-time integration** with county systems (PACS, CIAPS, ArcGIS)
- **Multi-agent intelligence** for automated assessment workflows
- **Comprehensive data management** for properties, permits, and assessments

### Key Numbers You Should Know
- **16 Applications** total (12 production-ready, 4 in development)
- **94,149 Real Properties** in the Benton County database
- **113,087 Addresses** with complete geocoding
- **48,056 Building Permits** with historical data
- **37MB** main database with real production data

### Architecture Overview
```
TerraFusion Platform
├── Core Applications (6)      # Main business logic
├── Specialized Systems (4)    # Domain-specific tools
├── AI & Intelligence (2)      # Machine learning & agents
├── Development Tools (3)      # Support & monitoring
└── Quantum Architecture (1)   # Next-generation backend
```

---

## 🏗️ Development Workflow

### Daily Development Commands
```bash
# Start your development day
./scripts/start_platform.sh          # Start entire platform
./scripts/health_check.sh            # Verify all services running

# Working with specific applications
./scripts/start_app.sh terra-agent   # Start specific application
./scripts/logs.sh terra-agent        # View logs for debugging
./scripts/restart_app.sh terra-agent # Restart after changes

# Testing and quality
./scripts/run_tests.sh               # Run full test suite
./scripts/lint_code.sh               # Code quality checks
./scripts/type_check.sh              # Type checking

# End of day cleanup
./scripts/stop_all.sh                # Clean shutdown
```

### Making Changes
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-assessment-algorithm
   ```

2. **Make Your Changes**
   - Edit code in the appropriate application directory
   - Follow the existing code patterns
   - Add tests for new functionality

3. **Test Your Changes**
   ```bash
   ./scripts/run_tests.sh [app-name]
   ./scripts/integration_test.sh
   ```

4. **Deploy Changes**
   ```bash
   ./scripts/deploy.sh development     # Deploy to dev environment
   ./scripts/deploy.sh production      # Deploy to production (with approval)
   ```

### Code Quality Standards
- **Python**: Use `ruff` for linting, `mypy` for type checking
- **JavaScript/TypeScript**: Use `ESLint` and TypeScript compiler
- **Test Coverage**: Maintain 85%+ coverage for all applications
- **Documentation**: Update API docs for any public interface changes

---

## 🎯 Application Directory Guide

### Core Production Applications
| Directory | Purpose | When to Work Here |
|-----------|---------|------------------|
| `TerraFusionSync_PRODUCTION/` | Project management & sync | Task tracking, project workflows |
| `TerraAgent_PRODUCTION/` | AI property assessment | ML models, assessment algorithms |
| `CostForge/` | ML cost estimation | Construction cost models |
| `TerraLevy/` | Tax levy management | Tax calculations, levy processing |
| `TerraFlow/` | Data flow orchestration | ETL pipelines, data workflows |
| `TerraMiner/` | Data mining & analytics | Data analysis, reporting |

### Specialized Systems
| Directory | Purpose | When to Work Here |
|-----------|---------|------------------|
| `TerraFusionPermit/` | Building permits | Permit processing, approvals |
| `TerraFusionGIS/` | GIS integration | Spatial data, mapping |
| `TerraInsight/` | Business intelligence | Dashboards, analytics |
| `WebAuditTracker/` | Web audit management | Compliance, auditing |

### AI & Intelligence
| Directory | Purpose | When to Work Here |
|-----------|---------|------------------|
| `MCP_Servers_PRODUCTION/` | Multi-agent platform | Agent coordination, MCP protocol |
| `TerraFusionAssistant_PRODUCTION/` | AI assistant | Natural language processing |

---

## 🗄️ Database Guide

### Primary Databases
- **`terrafusionsync_real.db`** (37MB) - Main property database
  - 94,149 properties with complete assessment data
  - Real Benton County data - **treat with respect**
  - Used by TerraFusionSync, TerraAgent, and most applications

- **`real_pacs.db`** (25MB) - PACS integration data
  - Legacy system integration data
  - Used for backwards compatibility

### Database Access Patterns
```python
# Standard database connection (SQLite for development)
DATABASE_URL = "sqlite:///./terrafusionsync_real.db"

# PostgreSQL for production
POSTGRES_URL = "postgresql://user:pass@localhost/terrafusion"

# Always use connection pooling in production
```

### Database Safety Rules
1. **Never run destructive queries without WHERE clauses**
2. **Always use transactions for multi-table operations**
3. **Test queries on development data first**
4. **Include LIMIT clauses when exploring data**

---

## 🔧 Common Development Tasks

### Adding a New Feature
1. **Identify the correct application** using `APPLICATION_REGISTRY.json`
2. **Check existing patterns** in that application
3. **Add your feature** following the established architecture
4. **Write tests** for your new functionality
5. **Update documentation** if adding public APIs

### Debugging Issues
1. **Check application logs**
   ```bash
   ./scripts/logs.sh [app-name]
   ```

2. **Verify service health**
   ```bash
   ./scripts/health_check.sh
   ```

3. **Check database connections**
   ```bash
   ./scripts/db_health.sh
   ```

4. **Run diagnostics**
   ```bash
   ./scripts/diagnose.sh [app-name]
   ```

### Performance Optimization
1. **Profile your code**
   ```bash
   ./scripts/profile.sh [app-name]
   ```

2. **Check database query performance**
   ```bash
   ./scripts/query_analyzer.sh
   ```

3. **Monitor resource usage**
   ```bash
   ./scripts/resource_monitor.sh
   ```

---

## 🚀 Deployment Guide

### Development Deployment
```bash
# Deploy to development environment
./scripts/deploy.sh development

# Verify deployment
./scripts/verify_deployment.sh development
```

### Production Deployment
```bash
# Deploy to production (requires approval)
./scripts/deploy.sh production

# Monitor deployment
./scripts/monitor_deployment.sh production

# Rollback if needed
./scripts/rollback.sh production
```

### Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Performance impact assessed
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

---

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### Port Conflicts
```bash
# Check what's using ports
./scripts/check_ports.sh

# Kill conflicting processes
./scripts/kill_port.sh [port-number]
```

#### Database Issues
```bash
# Check database health
./scripts/db_health.sh

# Repair database connections
./scripts/db_repair.sh

# Reset database (development only)
./scripts/db_reset.sh
```

#### Application Startup Failures
```bash
# Diagnose startup issues
./scripts/diagnose.sh [app-name]

# Check dependencies
./scripts/check_deps.sh [app-name]

# Restart with debug logging
./scripts/debug_start.sh [app-name]
```

#### Performance Issues
```bash
# Check system resources
./scripts/resource_check.sh

# Profile application performance
./scripts/performance_profile.sh [app-name]

# Analyze slow queries
./scripts/slow_query_analysis.sh
```

---

## 📚 Advanced Topics

### Working with AI/ML Components
- **TerraAgent**: Property assessment ML models
- **CostForge**: Construction cost estimation algorithms
- **MCP_Servers**: Multi-agent coordination

### GIS Integration
- **TerraFusionGIS**: Spatial data processing
- **ArcGIS Integration**: External GIS system connectivity
- **Mapping Components**: Interactive map interfaces

### External System Integration
- **PACS**: Legacy property assessment system
- **CIAPS**: County assessment processing
- **ArcGIS**: Geographic information systems
- **Spatialest**: Spatial data services

---

## 🎓 Learning Resources

### Essential Reading
1. **Platform Architecture** - `PLATFORM_ARCHITECTURE.md`
2. **API Documentation** - `API_REFERENCE.md`
3. **Deployment Guide** - `DEPLOYMENT_GUIDE.md`
4. **Application Registry** - `APPLICATION_REGISTRY.json`

### Code Examples
- **Property Assessment**: See `TerraAgent_PRODUCTION/examples/`
- **Data Processing**: See `TerraFlow/examples/`
- **GIS Integration**: See `TerraFusionGIS/examples/`

### External Documentation
- **Flask**: https://flask.palletsprojects.com/
- **FastAPI**: https://fastapi.tiangolo.com/
- **LangChain**: https://python.langchain.com/
- **ArcGIS**: https://developers.arcgis.com/

---

## 🤝 Team Collaboration

### Code Review Process
1. Create feature branch
2. Make changes with tests
3. Submit pull request
4. Code review required
5. Automated testing
6. Deployment approval

### Communication Channels
- **Technical Issues**: GitHub Issues
- **Architecture Decisions**: Architecture Review Board
- **Daily Updates**: Team Standup
- **Emergency Issues**: Emergency Contact Protocol

### Documentation Standards
- **API Changes**: Update OpenAPI specs
- **New Features**: Add to user documentation
- **Breaking Changes**: Update migration guides
- **Performance Changes**: Update performance benchmarks

---

## 🆘 Emergency Procedures

### System Down
```bash
# Emergency restart
./scripts/emergency_restart.sh

# Check system status
./scripts/system_status.sh

# Contact emergency support
./scripts/emergency_contact.sh
```

### Data Issues
```bash
# Backup current state
./scripts/emergency_backup.sh

# Restore from backup
./scripts/restore_backup.sh [backup-name]

# Verify data integrity
./scripts/data_integrity_check.sh
```

### Security Incidents
```bash
# Lock down system
./scripts/security_lockdown.sh

# Audit system access
./scripts/security_audit.sh

# Contact security team
./scripts/security_contact.sh
```

---

## 📞 Support Contacts

### Technical Support
- **Platform Issues**: See `TROUBLESHOOTING.md`
- **Database Issues**: See `DATABASE_GUIDE.md`
- **Deployment Issues**: See `DEPLOYMENT_GUIDE.md`

### Business Support
- **Feature Requests**: Create GitHub issue
- **Bug Reports**: Use bug report template
- **Performance Issues**: Use performance report template

---

*This guide is designed to eliminate confusion and get you productive immediately.*
*If something is unclear, please update this guide for the next developer.*

**Last Updated**: 2024-01-15  
**Guide Version**: 2.0.0  
**Platform Version**: 2.0.0 