# TerraFusion Elite - Operations Runbook

## 🎯 Quick Reference

### Essential Commands
```powershell
# Start API
.\scripts\start-api.ps1

# Health Monitoring
.\scripts\monitor-health.ps1
.\scripts\monitor-health.ps1 -Continuous -Interval 10

# Performance Benchmarking
.\scripts\benchmark-performance.ps1 -TestType Quick
.\scripts\benchmark-performance.ps1 -TestType Load -Iterations 1000

# Database Management
.\scripts\manage-database.ps1 -Action Status
.\scripts\manage-database.ps1 -Action Migrate
.\scripts\manage-database.ps1 -Action Backup

# Validation
.\scripts\validate-backend.ps1
```

---

## 📊 Health Monitoring

### Real-Time Monitoring
```powershell
# Single check
.\scripts\monitor-health.ps1

# Continuous monitoring (30s interval)
.\scripts\monitor-health.ps1 -Continuous

# Custom interval
.\scripts\monitor-health.ps1 -Continuous -Interval 5
```

### What It Monitors
- ✅ Core API endpoints (Root, Health, Swarm, Database)
- 💻 System resources (CPU, Memory)
- 🔧 Backend processes (TerraFusion.API)
- 🌐 Network ports (5000)

### Health Status Codes
- **✅ HEALTHY**: Service responding normally
- **⚠️ WARNING**: Partial degradation
- **❌ DOWN**: Service unavailable

---

## 🚀 Performance Benchmarking

### Test Types

#### Quick Test (10 iterations)
Fast sanity check for basic functionality:
```powershell
.\scripts\benchmark-performance.ps1 -TestType Quick
```

#### Standard Test (100 iterations)
Default comprehensive test:
```powershell
.\scripts\benchmark-performance.ps1 -TestType Standard
```

#### Comprehensive Test (500 iterations)
Extended testing for reliability:
```powershell
.\scripts\benchmark-performance.ps1 -TestType Comprehensive
```

#### Load Test (1000 iterations)
Simulate moderate load:
```powershell
.\scripts\benchmark-performance.ps1 -TestType Load
```

#### Stress Test (5000 iterations)
Maximum capacity testing:
```powershell
.\scripts\benchmark-performance.ps1 -TestType Stress
```

### Custom Iterations
```powershell
.\scripts\benchmark-performance.ps1 -TestType Load -Iterations 2500
```

### Performance Metrics
- **Success Rate**: % of successful requests
- **Avg Response Time**: Average latency (ms)
- **Min/Max**: Best and worst response times
- **P95**: 95th percentile latency
- **Throughput**: Requests per second

### Performance Grades
| Grade | Success Rate | Avg Response Time |
|-------|--------------|-------------------|
| A+    | ≥99.5%       | <100ms           |
| A     | ≥98%         | <200ms           |
| B     | ≥95%         | <500ms           |
| C     | ≥90%         | Any              |
| D     | <90%         | Any              |

---

## 💾 Database Management

### Status Check
```powershell
.\scripts\manage-database.ps1 -Action Status
```

Displays:
- EF Core tools version
- Pending migrations
- Database connectivity (PostgreSQL/SQLite)
- Existing database files

### Run Migrations
```powershell
.\scripts\manage-database.ps1 -Action Migrate -Environment Development
```

### Seed Data
```powershell
.\scripts\manage-database.ps1 -Action Seed
```

### Backup Database
```powershell
.\scripts\manage-database.ps1 -Action Backup
```

Backups saved to: `backend\Backups\{dbname}_{timestamp}.db`

### Reset Database (DESTRUCTIVE)
```powershell
.\scripts\manage-database.ps1 -Action Reset
```

⚠️ **WARNING**: This deletes all data! Requires typing 'RESET' to confirm.

---

## 🔍 System Validation

### Full Backend Validation
```powershell
.\scripts\validate-backend.ps1
```

Validates:
- All 8 core projects build successfully
- No compilation errors
- Dependency resolution
- Configuration validity

### Expected Output
```
🔧 Core Projects:
  ✅ TerraFusion.API              PASS  0 errors
  ✅ TerraFusion.Core             PASS  0 errors
  ✅ TerraFusion.AI               PASS  0 errors
  ✅ TerraFusion.Data             PASS  0 errors
  ✅ TerraFusion.Abstractions     PASS  0 errors
  ✅ TerraFusion.Consciousness    PASS  0 errors
  ✅ TerraFusion.CostForge        PASS  0 errors
  ✅ TerraFusion.Operations       PASS  0 errors

📊 Validation Summary:
  Total Projects:    8
  Passed:            8
  Failed:            0
  Total Errors:      0
```

---

## 🛠️ Troubleshooting

### API Not Starting

**Issue**: Port 5000 already in use
```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Kill process if necessary
Stop-Process -Id <PID> -Force
```

**Issue**: .NET SDK not found
```powershell
# Check .NET version
dotnet --version

# Should be 8.0 or higher
# Install from: https://dotnet.microsoft.com/download
```

### Database Issues

**Issue**: Cannot connect to PostgreSQL
```powershell
# Check PostgreSQL status
Get-Service -Name postgresql*

# Or use SQLite fallback (automatic in code)
```

**Issue**: Migration errors
```powershell
# Reset and rebuild
.\scripts\manage-database.ps1 -Action Reset
.\scripts\manage-database.ps1 -Action Migrate
```

### Build Failures

**Issue**: Compilation errors
```powershell
# Clean and rebuild
dotnet clean
dotnet restore
.\scripts\validate-backend.ps1
```

**Issue**: Dependency conflicts
```powershell
# Clear NuGet cache
dotnet nuget locals all --clear
dotnet restore
```

---

## 📈 Performance Optimization

### Response Time Optimization
1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Enable Redis for distributed caching
3. **Connection Pooling**: Configure in `appsettings.json`
4. **Async Operations**: All I/O operations should be async

### Memory Optimization
1. **Object Pooling**: Use ArrayPool for large arrays
2. **String Allocation**: Use string interpolation carefully
3. **Dispose Patterns**: Ensure proper IDisposable implementation
4. **GC Settings**: Configure server GC in project file

### Scaling Strategies
1. **Horizontal Scaling**: Deploy multiple API instances
2. **Load Balancing**: Use Azure Load Balancer or Application Gateway
3. **Database Read Replicas**: For read-heavy workloads
4. **Caching Layer**: Redis cluster for distributed caching

---

## 🔒 Security Checklist

### Before Deployment
- [ ] Change default secrets in `appsettings.json`
- [ ] Enable HTTPS with valid certificate
- [ ] Configure CORS policies
- [ ] Set up authentication/authorization
- [ ] Enable rate limiting
- [ ] Configure API key validation
- [ ] Review security headers
- [ ] Enable audit logging

### During Operation
- [ ] Monitor failed authentication attempts
- [ ] Review access logs regularly
- [ ] Keep dependencies updated
- [ ] Perform security scans
- [ ] Backup databases regularly
- [ ] Monitor resource usage
- [ ] Implement alerting

---

## 📞 Emergency Procedures

### Critical API Failure
1. Check health monitor: `.\scripts\monitor-health.ps1`
2. Review logs: `backend\logs\`
3. Restart API: `.\scripts\start-api.ps1`
4. If persistent, check database connectivity
5. Escalate if unresolved within 15 minutes

### Database Corruption
1. Stop all services
2. Restore from latest backup
3. Run migrations: `.\scripts\manage-database.ps1 -Action Migrate`
4. Validate data integrity
5. Restart services

### Performance Degradation
1. Run benchmark: `.\scripts\benchmark-performance.ps1 -TestType Quick`
2. Check system resources (CPU, Memory)
3. Review recent changes
4. Scale horizontally if needed
5. Investigate slow queries

---

## 📚 Additional Resources

### Documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [STATUS.md](./STATUS.md) - Current system status
- [README.md](./README.md) - Project overview

### Monitoring Dashboards
- **Health**: http://localhost:5000/health
- **Swagger**: http://localhost:5000/swagger
- **Metrics**: http://localhost:5000/metrics (if enabled)

### Support
- GitHub Issues: [Project Repository]
- Internal Wiki: [Internal Documentation]
- On-Call: [Contact Information]

---

## 🎓 Best Practices

### Daily Operations
1. Run health check every morning
2. Review logs for errors/warnings
3. Monitor performance metrics
4. Check for pending updates
5. Verify backup completion

### Weekly Maintenance
1. Run comprehensive benchmarks
2. Review security logs
3. Update dependencies
4. Cleanup old logs/backups
5. Performance tuning based on metrics

### Monthly Tasks
1. Disaster recovery drill
2. Security vulnerability scan
3. Capacity planning review
4. Documentation updates
5. Team training/knowledge sharing

---

*Last Updated: 2025-02-07*  
*Version: 1.0*  
*Owner: TerraFusion Elite Engineering Team*
