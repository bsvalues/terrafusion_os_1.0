# TerraFusion OS - Production Database Infrastructure

## 🏛️ Core Production Databases

TerraFusion OS operates on **5 critical production databases** that power government operations across 39+ Washington State counties:

### 1. **TerraFlow_PRODUCTION** 🔄
- **Purpose**: AI Workflow Coordination & Agent Orchestration
- **Port**: 5435
- **Priority**: CRITICAL
- **Capabilities**:
  - Workflow engine with state management
  - Process automation orchestration
  - 1,008+ AI agent coordination
  - Task queuing and execution
  - State transition management

### 2. **TerraFusionSync_PRODUCTION** 🔗
- **Purpose**: Government System Synchronization & Harris PACS Integration
- **Port**: 5436
- **Priority**: CRITICAL
- **Capabilities**:
  - Cross-system data synchronization
  - Harris PACS real-time integration
  - ETL pipeline management
  - Change detection and tracking
  - Conflict resolution
  - Audit trail for all sync operations

### 3. **TerraFusionAssessor_PRODUCTION** 🏘️
- **Purpose**: CAMA Mass Appraisal & Property Assessment
- **Port**: 5437
- **Priority**: CRITICAL
- **Capabilities**:
  - Computer Assisted Mass Appraisal (CAMA)
  - Property valuation models
  - Assessment roll management
  - Neighborhood analysis
  - Sales validation
  - Statistical modeling

### 4. **BCBSGISPRO_PRODUCTION** 🗺️
- **Purpose**: GIS Parcel Mapping & Spatial Analysis
- **Port**: 5438
- **Priority**: CRITICAL
- **Capabilities**:
  - Parcel mapping and boundaries
  - Spatial analysis with PostGIS
  - GIS data management
  - Coordinate system transformations
  - Map layer management
  - Spatial queries

### 5. **BSIncomeValuation_PRODUCTION** 💰
- **Purpose**: Income Capitalization & Commercial Valuation
- **Port**: 5439
- **Priority**: HIGH
- **Capabilities**:
  - Income approach valuation
  - Net Operating Income (NOI) calculation
  - Capitalization rate analysis
  - Discounted Cash Flow (DCF) modeling
  - Commercial property assessment
  - Rent roll analysis

---

## 🚀 Deployment Instructions

### Prerequisites

1. **PostgreSQL 15.4+** installed and running
2. **Python 3.11+** with `psycopg2-binary` package
3. **Database credentials** configured in environment variables

### Environment Setup

Create a `.env` file in `infrastructure/database/`:

```bash
# PostgreSQL Master Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TF_DB_Master_2025_Secure!
```

### Step 1: Validate Current State

Check if production databases already exist:

```bash
cd terrafusion_os_1.0
python infrastructure/database/validate-production-databases.py
```

**Expected Output**:
- ✅ PostgreSQL Master: Available
- Database status for each of the 5 production systems
- Validation report saved to `validation_report_*.json`

### Step 2: Deploy Production Databases

Run the automated deployment system:

```bash
python infrastructure/database/deploy-production-databases.py
```

**Deployment Process**:
1. ✅ Prerequisites validation (PostgreSQL, Docker, paths)
2. 🏗️ Database creation with government-grade settings
3. 📋 Schema creation (tables, indexes, audit trails)
4. 🔄 Legacy data migration (if available)
5. ✅ Validation of deployed databases
6. 🔗 Connection string generation
7. 📊 Comprehensive deployment report

**Interactive Prompts**:
- If database exists: Choose to drop and recreate or skip
- Legacy system detection: Automated migration if files found

### Step 3: Verify Deployment

Re-run validation to confirm successful deployment:

```bash
python infrastructure/database/validate-production-databases.py
```

**Success Criteria**:
- ✅ All 5 databases: Found
- ✅ All 5 databases: Accessible
- ✅ Tables created with audit schemas
- ✅ Extensions enabled (uuid-ossp, postgis, pg_stat_statements)

---

## 📊 Database Architecture

### Standard Table Structure

All production databases follow government-grade table standards:

```sql
CREATE TABLE {table_name} (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    county_id VARCHAR(50),          -- County data isolation
    status VARCHAR(50) DEFAULT 'active',
    data JSONB,                     -- Flexible data storage
    metadata JSONB                  -- Additional metadata
);

-- Standard indexes for performance
CREATE INDEX idx_{table_name}_created_at ON {table_name}(created_at DESC);
CREATE INDEX idx_{table_name}_county_id ON {table_name}(county_id);
CREATE INDEX idx_{table_name}_status ON {table_name}(status);
```

### Audit Schema

Every database includes comprehensive audit logging:

```sql
CREATE SCHEMA audit;

CREATE TABLE audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    user_name VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB,
    change_summary TEXT
);
```

### Enabled Extensions

- **uuid-ossp**: UUID generation for primary keys
- **postgis**: Spatial analysis (critical for BCBSGISPRO)
- **pg_stat_statements**: Query performance monitoring
- **pg_trgm**: Full-text search capabilities

---

## 🔗 Connection Configuration

### Backend Integration (.NET)

After deployment, connection strings are saved to:
```
infrastructure/database/.env.production.databases
```

**Example Connection String**:
```
TERRAFLOW_PRODUCTION_CONNECTION_STRING=postgresql://postgres:password@localhost:5435/terraflow_production?sslmode=require
```

### Backend API Configuration

Update `backend/appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "TerraFlowProduction": "postgresql://postgres:password@localhost:5435/terraflow_production",
    "TerraFusionSyncProduction": "postgresql://postgres:password@localhost:5436/terrafusionsync_production",
    "TerraFusionAssessorProduction": "postgresql://postgres:password@localhost:5437/terrafusionassessor_production",
    "BCBSGISPROProduction": "postgresql://postgres:password@localhost:5438/bcbsgispro_production",
    "BSIncomeValuationProduction": "postgresql://postgres:password@localhost:5439/bsincomevaluation_production"
  }
}
```

### Entity Framework Core Integration

Each database has its own `DbContext`:

```csharp
// TerraFusion.Data/TerraFlowDbContext.cs
public class TerraFlowDbContext : DbContext
{
    public TerraFlowDbContext(DbContextOptions<TerraFlowDbContext> options)
        : base(options) { }

    public DbSet<Workflow> Workflows { get; set; }
    public DbSet<Task> Tasks { get; set; }
    public DbSet<Agent> Agents { get; set; }
}
```

**Startup Registration**:
```csharp
services.AddDbContext<TerraFlowDbContext>(options =>
    options.UseNpgsql(
        Configuration.GetConnectionString("TerraFlowProduction"),
        npgsqlOptions => npgsqlOptions.EnableRetryOnFailure()
    ));
```

---

## 🛡️ Security & Compliance

### Government-Grade Security

- ✅ **FISMA-High Compliance**: All databases meet federal security standards
- ✅ **County Data Isolation**: Sovereign county model with `county_id` filtering
- ✅ **Audit Logging**: Complete audit trail for all operations
- ✅ **Encryption**: SSL/TLS required for all connections
- ✅ **Role-Based Access Control (RBAC)**: Granular permissions

### Connection Security

**Production Connection Requirements**:
- SSL/TLS encryption (`sslmode=require`)
- Strong password authentication (scram-sha-256)
- Connection pooling via PgBouncer
- Timeout settings for idle connections

### Backup Strategy

**Automated Backups**:
- Daily full backups at 2 AM
- 30-day retention policy
- Point-in-time recovery enabled
- WAL archiving for transaction replay

---

## 📈 Performance Optimization

### Connection Pooling

**PgBouncer Configuration**:
```ini
[databases]
terraflow_production = host=localhost port=5435 dbname=terraflow_production
terrafusionsync_production = host=localhost port=5436 dbname=terrafusionsync_production

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Query Performance

**Enabled Features**:
- `pg_stat_statements` for query analysis
- Automatic VACUUM and ANALYZE scheduling
- Index optimization for county-based queries
- JSONB indexing for flexible data columns

### Master-Replica Architecture

**Read Scaling**:
- Primary database: Write operations
- Replica 1: General read operations
- Replica 2: Analytics and reporting queries

---

## 🔧 Maintenance Operations

### Database Size Monitoring

```bash
python infrastructure/database/validate-production-databases.py
```

Shows database sizes and table counts for all production databases.

### Manual Backup

```bash
pg_dump -h localhost -p 5435 -U postgres -d terraflow_production \
  -F c -b -v -f backups/terraflow_production_$(date +%Y%m%d).backup
```

### Restore from Backup

```bash
pg_restore -h localhost -p 5435 -U postgres -d terraflow_production \
  -v backups/terraflow_production_20251027.backup
```

---

## 📚 Related Documentation

- **Backend Integration**: `backend/TerraFusion.Data/README.md`
- **Database Migrations**: `infrastructure/database/migrations/README.md`
- **Docker Compose Setup**: `infrastructure/database/docker-compose-postgresql.yml`
- **Kubernetes Deployment**: `infrastructure/kubernetes/databases/`

---

## 🏆 Production Readiness Checklist

Before deploying to production:

- [ ] ✅ PostgreSQL 15.4+ installed and configured
- [ ] ✅ All 5 production databases created and validated
- [ ] ✅ Connection strings configured in backend
- [ ] ✅ SSL/TLS certificates configured
- [ ] ✅ Backup strategy implemented and tested
- [ ] ✅ Monitoring and alerting configured
- [ ] ✅ Load testing completed
- [ ] ✅ Disaster recovery plan documented
- [ ] ✅ Security audit passed (FISMA-High)
- [ ] ✅ County data isolation validated

---

## 💡 Troubleshooting

### Connection Failed

**Issue**: `connection to server at "localhost", port 5432 failed`

**Solution**:
1. Verify PostgreSQL is running: `systemctl status postgresql` (Linux) or check Services (Windows)
2. Check credentials in `.env` file
3. Test connection: `psql -h localhost -U postgres`

### Database Already Exists

**Issue**: Database exists but deployment fails

**Solution**:
1. Run validation: `python infrastructure/database/validate-production-databases.py`
2. Choose "yes" when deployment script asks to drop and recreate
3. Ensure no active connections: Check `pg_stat_activity`

### Legacy Data Migration

**Issue**: Legacy system found but migration fails

**Solution**:
1. Verify legacy path exists: `c:\Users\bsval\OneDrive\Desktop\from D\{SYSTEM_NAME}_PRODUCTION`
2. Check database file formats (.mdf, .sql)
3. Use manual migration scripts if automated fails

---

**Government. Transcended.** 🏛️

For support: Contact TerraFusion Elite Engineering Team
