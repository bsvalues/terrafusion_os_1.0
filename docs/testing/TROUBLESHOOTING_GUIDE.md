# Testing Troubleshooting Guide

**Terrafusion OS 1.0 - PHASE 6 Testing Issues Resolution**

## Overview

This guide provides solutions for common issues encountered during comprehensive testing execution, organized by test category and severity level.

## Quick Reference

### Emergency Contacts
- **DevOps Team**: devops@terrafusion.gov
- **Security Team**: security@terrafusion.gov  
- **Database Team**: dba@terrafusion.gov
- **24/7 Support**: +1-800-TERRA-OS

### Critical Issue Response
1. **Stop all testing immediately**
2. **Preserve logs and evidence**
3. **Contact appropriate team**
4. **Document incident details**

## System Integration Issues

### Connection Failures

#### API Endpoint Unreachable
```
Error: ECONNREFUSED 127.0.0.1:5000
```

**Diagnosis Steps**:
```bash
# Check if API is running
curl -f http://localhost:5000/api/health

# Verify Docker containers
docker-compose -f docker-compose.testing.yml ps

# Check port availability
netstat -tulpn | grep :5000
```

**Solutions**:
1. **Restart API service**:
   ```bash
   docker-compose -f docker-compose.testing.yml restart terrafusion-api
   ```

2. **Check environment variables**:
   ```bash
   echo $TEST_API_URL
   # Should output: http://localhost:5000
   ```

3. **Verify network connectivity**:
   ```bash
   ping localhost
   telnet localhost 5000
   ```

#### WebSocket Connection Issues
```
Error: WebSocket connection failed
```

**Diagnosis Steps**:
```bash
# Test WebSocket endpoint
wscat -c ws://localhost:5000/hubs/system

# Check nginx configuration
docker-compose -f docker-compose.testing.yml logs nginx
```

**Solutions**:
1. **Update nginx configuration** for WebSocket support:
   ```nginx
   location /hubs/ {
       proxy_pass http://terrafusion_api;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

2. **Restart load balancer**:
   ```bash
   docker-compose -f docker-compose.testing.yml restart nginx
   ```

### Database Connection Issues

#### PostgreSQL Connection Refused
```
Error: connection to server at "localhost" (127.0.0.1), port 5432 failed
```

**Diagnosis Steps**:
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.testing.yml exec postgres pg_isready

# View PostgreSQL logs
docker-compose -f docker-compose.testing.yml logs postgres

# Test connection manually
psql -h localhost -U test_user -d terrafusion_test
```

**Solutions**:
1. **Restart PostgreSQL**:
   ```bash
   docker-compose -f docker-compose.testing.yml restart postgres
   ```

2. **Reset database with fresh data**:
   ```bash
   docker-compose -f docker-compose.testing.yml down -v
   docker-compose -f docker-compose.testing.yml up -d postgres
   npm run db:migrate:testing
   ```

3. **Check connection limits**:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   SELECT setting FROM pg_settings WHERE name = 'max_connections';
   ```

## Performance Testing Issues

### Load Test Failures

#### High Response Times
```
Error: Response time P95 > 5000ms (target: < 2000ms)
```

**Diagnosis Steps**:
```bash
# Check system resources
top
htop
iostat -x 1

# Monitor database performance
docker-compose -f docker-compose.testing.yml exec postgres \
  psql -U test_user -d terrafusion_test -c "
    SELECT query, mean_time, calls 
    FROM pg_stat_statements 
    ORDER BY mean_time DESC LIMIT 10;"
```

**Solutions**:
1. **Optimize database queries**:
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_properties_jurisdiction 
   ON properties(jurisdiction_id);
   
   -- Update table statistics
   ANALYZE properties;
   ```

2. **Increase system resources**:
   ```yaml
   # docker-compose.testing.yml
   services:
     terrafusion-api:
       deploy:
         resources:
           limits:
             memory: 8G
             cpus: '4.0'
   ```

3. **Enable Redis caching**:
   ```bash
   # Verify Redis is running
   docker-compose -f docker-compose.testing.yml exec redis redis-cli ping
   
   # Check cache hit rate
   docker-compose -f docker-compose.testing.yml exec redis \
     redis-cli info stats | grep keyspace
   ```

#### Memory Leaks
```
Error: Memory usage exceeds 16GB limit
```

**Diagnosis Steps**:
```bash
# Monitor memory usage over time
while true; do
  docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"
  sleep 10
done

# Check for memory leaks in application
docker-compose -f docker-compose.testing.yml exec terrafusion-api \
  dotnet-dump collect -p 1
```

**Solutions**:
1. **Enable garbage collection tuning**:
   ```bash
   export DOTNET_gcServer=1
   export DOTNET_GCHeapHardLimit=8000000000
   ```

2. **Restart services periodically**:
   ```bash
   # Add to crontab for long-running tests
   0 */4 * * * docker-compose -f docker-compose.testing.yml restart terrafusion-api
   ```

### Timeout Issues

#### Test Execution Timeouts
```
Error: Timeout of 30000ms exceeded
```

**Solutions**:
1. **Increase timeout values**:
   ```typescript
   // In test configuration
   const config = {
     timeout: 120000, // 2 minutes
     retries: 3
   };
   ```

2. **Implement retry logic**:
   ```typescript
   async function retryRequest(url: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await axios.get(url, { timeout: 30000 });
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   }
   ```

## Security Testing Issues

### Authentication Failures

#### Invalid Credentials
```
Error: Authentication failed for security testing
```

**Diagnosis Steps**:
```bash
# Verify test user exists
docker-compose -f docker-compose.testing.yml exec postgres \
  psql -U test_user -d terrafusion_test -c "
    SELECT username, role FROM users WHERE username = 'security-tester';"

# Check authentication endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"security-tester","password":"SecureTest123!"}'
```

**Solutions**:
1. **Create test user**:
   ```sql
   INSERT INTO users (username, password_hash, role, created_at) 
   VALUES ('security-tester', 
           '$2b$12$encrypted_password_hash', 
           'admin', 
           NOW());
   ```

2. **Reset test credentials**:
   ```bash
   export SECURITY_TEST_USER=security-tester
   export SECURITY_TEST_PASS=SecureTest123!
   ```

### Penetration Test Issues

#### False Positives
```
Warning: SQL injection detected (false positive)
```

**Solutions**:
1. **Verify with manual testing**:
   ```bash
   # Test actual SQL injection
   curl "http://localhost:5000/api/properties/search?q=' OR '1'='1"
   
   # Should return 400 Bad Request with input validation error
   ```

2. **Update test exclusions**:
   ```typescript
   const excludePatterns = [
     '/api/health',
     '/api/metrics',
     '/api/documentation'
   ];
   ```

## Scalability Testing Issues

### Kubernetes Issues

#### Pod Scaling Failures
```
Error: HorizontalPodAutoscaler failed to scale
```

**Diagnosis Steps**:
```bash
# Check HPA status
kubectl describe hpa terrafusion-api-hpa -n terrafusion-testing

# View pod metrics
kubectl top pods -n terrafusion-testing

# Check resource limits
kubectl describe deployment terrafusion-api -n terrafusion-testing
```

**Solutions**:
1. **Adjust HPA configuration**:
   ```yaml
   spec:
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 50  # Reduced from 70
   ```

2. **Increase resource limits**:
   ```yaml
   resources:
     limits:
       memory: "8Gi"  # Increased from 4Gi
       cpu: "4000m"   # Increased from 2000m
   ```

#### Node Resource Exhaustion
```
Error: Insufficient CPU/Memory on nodes
```

**Solutions**:
1. **Add more nodes to cluster**:
   ```bash
   # For cloud providers
   kubectl scale --replicas=5 deployment/cluster-autoscaler
   ```

2. **Optimize resource requests**:
   ```yaml
   resources:
     requests:
       memory: "1Gi"  # Reduced from 2Gi
       cpu: "500m"    # Reduced from 1000m
   ```

### Load Balancer Issues

#### Connection Limits Exceeded
```
Error: Too many connections to load balancer
```

**Solutions**:
1. **Increase nginx connection limits**:
   ```nginx
   events {
       worker_connections 4096;  # Increased from 1024
   }
   
   http {
       upstream terrafusion_api {
           least_conn;
           server terrafusion-api:5000 max_conns=1000;
           keepalive 32;
       }
   }
   ```

2. **Enable connection pooling**:
   ```csharp
   // In API configuration
   services.AddDbContext<TerraFusionContext>(options =>
       options.UseNpgsql(connectionString, npgsqlOptions =>
           npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3)
       )
   );
   ```

## Environment-Specific Issues

### Development Environment

#### Docker Desktop Issues
```
Error: Docker daemon not responding
```

**Solutions**:
1. **Restart Docker Desktop**
2. **Increase Docker memory allocation** to 8GB+
3. **Clear Docker cache**:
   ```bash
   docker system prune -a --volumes
   ```

### Staging Environment

#### SSL Certificate Issues
```
Error: SSL certificate verification failed
```

**Solutions**:
1. **Update certificate**:
   ```bash
   # Generate new certificate
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout ssl/staging.key -out ssl/staging.crt
   ```

2. **Add certificate to trust store**:
   ```bash
   # Linux
   sudo cp ssl/staging.crt /usr/local/share/ca-certificates/
   sudo update-ca-certificates
   ```

### Production Environment

#### Firewall Restrictions
```
Error: Connection blocked by firewall
```

**Solutions**:
1. **Update firewall rules**:
   ```bash
   # Allow testing traffic
   sudo ufw allow from 10.0.0.0/8 to any port 5000
   sudo ufw allow from 172.16.0.0/12 to any port 5000
   ```

2. **Use VPN for testing**:
   ```bash
   # Connect to government VPN before testing
   openvpn --config government-testing.ovpn
   ```

## Monitoring and Logging

### Log Analysis

#### Finding Relevant Logs
```bash
# API logs
docker-compose -f docker-compose.testing.yml logs -f terrafusion-api

# Database logs
docker-compose -f docker-compose.testing.yml logs -f postgres

# All service logs with timestamps
docker-compose -f docker-compose.testing.yml logs -f -t

# Filter for errors only
docker-compose -f docker-compose.testing.yml logs | grep -i error
```

#### Log Aggregation
```bash
# Export all logs for analysis
docker-compose -f docker-compose.testing.yml logs --no-color > testing-logs.txt

# Parse structured logs
cat testing-logs.txt | jq -r 'select(.level == "ERROR") | .message'
```

### Performance Monitoring

#### Real-time Metrics
```bash
# System resources
watch -n 1 'docker stats --no-stream'

# Database connections
watch -n 5 'docker-compose -f docker-compose.testing.yml exec postgres \
  psql -U test_user -d terrafusion_test -c "
    SELECT count(*) as active_connections 
    FROM pg_stat_activity 
    WHERE state = '\''active'\'';"'
```

## Recovery Procedures

### Complete Environment Reset

#### Nuclear Option - Full Reset
```bash
#!/bin/bash
# complete-reset.sh

echo "Stopping all services..."
docker-compose -f docker-compose.testing.yml down -v

echo "Removing all containers and images..."
docker system prune -a --volumes -f

echo "Rebuilding environment..."
docker-compose -f docker-compose.testing.yml build --no-cache

echo "Starting fresh environment..."
docker-compose -f docker-compose.testing.yml up -d

echo "Waiting for services to be ready..."
sleep 30

echo "Running database migrations..."
npm run db:migrate:testing

echo "Seeding test data..."
npm run db:seed:testing

echo "Environment reset complete!"
```

### Partial Recovery

#### Service-Specific Recovery
```bash
# Reset only API service
docker-compose -f docker-compose.testing.yml restart terrafusion-api

# Reset only database
docker-compose -f docker-compose.testing.yml down postgres
docker volume rm terrafusion-os-10_postgres_data
docker-compose -f docker-compose.testing.yml up -d postgres
npm run db:migrate:testing

# Reset only cache
docker-compose -f docker-compose.testing.yml exec redis redis-cli FLUSHALL
```

## Prevention Strategies

### Pre-Test Validation

#### Environment Health Check
```bash
#!/bin/bash
# pre-test-validation.sh

echo "Validating test environment..."

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running"
    exit 1
fi

# Check services
if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "ERROR: API is not responding"
    exit 1
fi

# Check database
if ! docker-compose -f docker-compose.testing.yml exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "ERROR: Database is not ready"
    exit 1
fi

echo "Environment validation passed!"
```

### Resource Monitoring

#### Automated Alerts
```bash
# Add to crontab
*/5 * * * * /path/to/check-resources.sh

# check-resources.sh
#!/bin/bash
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "High memory usage: ${MEMORY_USAGE}%" | mail -s "Testing Alert" admin@terrafusion.gov
fi
```

---

**Document Version**: 1.0  
**Last Updated**: August 18, 2025  
**Emergency Contact**: +1-800-TERRA-OS  
**Classification**: Government Use - Controlled Unclassified Information (CUI)
