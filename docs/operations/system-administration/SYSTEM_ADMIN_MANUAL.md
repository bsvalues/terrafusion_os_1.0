# TerraFusion OS System Administration Manual
## Government Operations - Production Environment

### 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Administrative Access](#administrative-access)
3. [System Monitoring](#system-monitoring)
4. [User Management](#user-management)
5. [Module Management](#module-management)
6. [Database Administration](#database-administration)
7. [Security Operations](#security-operations)
8. [Backup and Recovery](#backup-and-recovery)
9. [Performance Tuning](#performance-tuning)
10. [Troubleshooting](#troubleshooting)

## System Overview

TerraFusion OS is a complete government operating system designed for county-level operations. The system consists of:

- **.NET 8.0 API Gateway**: Core backend services (Port 5000)
- **Elite Rust Performance Engine**: 6-crate high-performance engine
- **React PWA Frontend**: Government interface (Port 3104)
- **AI Swarm Coordination**: 50,000+ agents with Supreme Commander Claude
- **Module Ecosystem**: 33+ hot-swappable government applications

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Citizens      │    │ Government      │    │ Administrators  │
│   Portal        │    │ Staff Interface │    │ Dashboard       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (.NET 8.0)                      │
│                      Port 5000                                 │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Elite Rust      │    │ AI Swarm        │    │ Government      │
│ Performance     │    │ Coordination    │    │ Modules         │
│ Engine          │    │ (50,000 agents) │    │ (33+ modules)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│              Database Layer (PostgreSQL + Redis)               │
└─────────────────────────────────────────────────────────────────┘
```

## Administrative Access

### Primary Administrative Interface
Access the main administration dashboard at:
```
https://terrafusion.bentoncounty.gov/admin
```

### SSH Access (Emergency Only)
```bash
# Production server access
ssh terrafusion-admin@production-server.bentoncounty.gov

# Secondary site access
ssh terrafusion-admin@secondary-server.bentoncounty.gov
```

### Database Access
```bash
# PostgreSQL database
psql -h localhost -U terrafusion_admin -d terrafusion_production

# Redis cache
redis-cli -h localhost -p 6379
```

## System Monitoring

### Health Check Endpoints
```bash
# System health
curl https://terrafusion.bentoncounty.gov/health

# API health
curl https://terrafusion.bentoncounty.gov/api/health

# AI Swarm status
curl https://terrafusion.bentoncounty.gov/ai-swarm/status

# Module health
curl https://terrafusion.bentoncounty.gov/modules/health
```

### Monitoring Dashboard
Access real-time monitoring at:
```
https://terrafusion.bentoncounty.gov/monitoring
```

Key metrics to monitor:
- **API Response Time**: Target <50ms average
- **Database Performance**: <10ms query time
- **AI Agent Count**: 45,000+ active agents
- **System Load**: <70% CPU utilization
- **Memory Usage**: <80% RAM utilization

### Log Locations
```bash
# Application logs
/var/log/terrafusion/application.log

# Error logs
/var/log/terrafusion/error.log

# Security logs
/var/log/terrafusion/security.log

# AI Swarm logs
/var/log/terrafusion/ai-swarm.log

# Audit logs
/var/log/terrafusion/audit.log
```

## User Management

### Adding Government Staff Users
```bash
# Add new government user
curl -X POST https://terrafusion.bentoncounty.gov/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.smith",
    "email": "john.smith@bentoncounty.gov",
    "role": "government_staff",
    "department": "Assessment",
    "clearance_level": "confidential"
  }'
```

### User Roles and Permissions
- **System Administrator**: Full system access
- **Government Staff**: Department-specific access
- **Supervisor**: Multi-department access
- **Citizen**: Public portal access only
- **Emergency Personnel**: Priority system access

### Password Policy
- Minimum 12 characters
- Must include: uppercase, lowercase, numbers, symbols
- 90-day expiration for government staff
- Multi-factor authentication required

## Module Management

### Installing New Modules
```bash
# Install government module
npm run module:install [module-name]

# Example: Install new tax collection module
npm run module:install tax-collection-pro
```

### Module Configuration
```bash
# Configure module settings
curl -X PUT https://terrafusion.bentoncounty.gov/api/modules/[module-name]/config \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "priority": "high"}'
```

### Hot-Swapping Modules
```bash
# Restart module without system downtime
npm run module:restart [module-name]

# Update module to latest version
npm run module:update [module-name]
```

## Database Administration

### Daily Maintenance Tasks
```sql
-- Update database statistics
ANALYZE;

-- Cleanup old data (run weekly)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';

-- Optimize table performance
REINDEX DATABASE terrafusion_production;
```

### Backup Procedures
```bash
# Create full database backup
pg_dump -h localhost -U terrafusion_admin terrafusion_production | gzip > backup_$(date +%Y%m%d).sql.gz

# Verify backup integrity
gunzip -t backup_$(date +%Y%m%d).sql.gz
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Monitor database connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

## Security Operations

### Security Monitoring
```bash
# Check failed login attempts
grep "authentication failed" /var/log/terrafusion/security.log

# Monitor suspicious activity
tail -f /var/log/terrafusion/security.log | grep "ALERT"

# Verify SSL certificate status
openssl x509 -in /etc/ssl/certs/terrafusion.crt -text -noout
```

### Access Control
```bash
# Review user permissions
curl https://terrafusion.bentoncounty.gov/api/security/audit/permissions

# Update security policies
curl -X PUT https://terrafusion.bentoncounty.gov/api/security/policies \
  -H "Content-Type: application/json" \
  -d '{"login_attempts": 3, "session_timeout": 3600}'
```

### Incident Response
1. **Immediate Response** (0-15 minutes)
   - Assess threat level
   - Isolate affected systems
   - Alert security team

2. **Investigation** (15-60 minutes)
   - Analyze logs and evidence
   - Determine scope of impact
   - Document findings

3. **Recovery** (1-4 hours)
   - Implement countermeasures
   - Restore affected services
   - Verify system integrity

4. **Post-Incident** (24-72 hours)
   - Complete incident report
   - Update security policies
   - Conduct lessons learned

## Backup and Recovery

### Automated Backup Schedule
- **Continuous**: Transaction log backup
- **Hourly**: Incremental database backup
- **Daily**: Full system backup (2:00 AM)
- **Weekly**: Complete data validation
- **Monthly**: Long-term archival backup

### Recovery Procedures
```bash
# Database recovery from backup
service terrafusion stop
dropdb terrafusion_production
createdb terrafusion_production
gunzip -c backup_latest.sql.gz | psql terrafusion_production
service terrafusion start
```

### Disaster Recovery Testing
```bash
# Execute DR test
./operations/disaster-recovery/dr-testing.sh

# Validate secondary site
curl https://secondary.terrafusion.bentoncounty.gov/health
```

## Performance Tuning

### Database Optimization
```sql
-- Update PostgreSQL configuration
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### Application Performance
```bash
# Monitor API performance
curl https://terrafusion.bentoncounty.gov/api/metrics

# Optimize AI Swarm performance
node scripts/ai-performance-optimizer.js

# Cache optimization
redis-cli FLUSHDB
```

### System Resources
```bash
# Monitor system resources
htop
iotop
nethogs

# Optimize system performance
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

## Troubleshooting

### Common Issues and Solutions

#### High CPU Usage
```bash
# Identify high CPU processes
top -p $(pgrep -d',' -f terrafusion)

# Solution: Scale AI agents if needed
curl -X POST https://terrafusion.bentoncounty.gov/ai-swarm/scale \
  -d '{"target_agents": 45000}'
```

#### Database Connection Issues
```bash
# Check database status
systemctl status postgresql

# Restart database if needed
systemctl restart postgresql

# Verify connections
netstat -an | grep 5432
```

#### Module Loading Failures
```bash
# Check module status
npm run module:status

# Restart failed module
npm run module:restart [module-name]

# Check module logs
tail -f /var/log/terrafusion/modules/[module-name].log
```

#### AI Swarm Coordination Issues
```bash
# Check Supreme Commander Claude status
curl https://terrafusion.bentoncounty.gov/ai-swarm/supreme-commander/status

# Restart AI coordination
node scripts/ai-coordination-restart.js

# Verify agent count
curl https://terrafusion.bentoncounty.gov/ai-swarm/agent-count
```

### Emergency Contacts
- **System Administrator**: (509) 736-3000 ext. 1001
- **Database Administrator**: (509) 736-3000 ext. 1002
- **Security Team**: (509) 736-3000 ext. 1003
- **TerraFusion Support**: support@terrafusion.gov

### Escalation Procedures
1. **Level 1**: Local IT team resolution
2. **Level 2**: County IT Director involvement
3. **Level 3**: TerraFusion engineering team
4. **Level 4**: Emergency government protocols

---

**Document Information**
- Version: 1.0 Production
- Classification: Government Operations - Restricted
- Owner: Benton County IT Department
- Last Updated: September 19, 2025
- Review Schedule: Monthly
