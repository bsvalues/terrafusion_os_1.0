# Terrafusion Common Issues & Solutions

This guide covers the most frequently encountered issues and their solutions.
Issues are organized by category and severity level.

## 🔍 Quick Diagnostic Tools

### System Health Check

```bash
# Check all services status
curl http://localhost/health | jq

# Check individual service health
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/health/detailed | jq

# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check Redis connectivity
redis-cli -u $REDIS_URL ping
```

### Log Analysis

```bash
# View recent application logs
docker-compose logs --tail=100 api

# Search for errors in logs
docker-compose logs api | grep -i error

# Monitor logs in real-time
docker-compose logs -f api
```

---

## 🚨 Critical Issues (Severity 1)

### 1. Service Completely Down

**Symptoms:**

- Application not responding
- 502/503 error messages
- Health check failures

**Quick Fix:**

```bash
# Restart all services
docker-compose restart

# Check service status
docker-compose ps

# View startup logs
docker-compose logs api frontend
```

**Root Cause Analysis:**

```bash
# Check system resources
free -h
df -h
docker system df

# Check for OOM kills
dmesg | grep -i "killed process"

# Check container resource usage
docker stats
```

**Solutions:**

1. **Insufficient Memory:**

   ```bash
   # Increase memory allocation
   # Edit docker-compose.yml
   services:
     api:
       deploy:
         resources:
           limits:
             memory: 2G
           reservations:
             memory: 1G
   ```

2. **Disk Full:**

   ```bash
   # Clean up Docker resources
   docker system prune -a

   # Clean up logs
   docker-compose logs --tail=1000 > /tmp/logs.txt
   docker-compose down
   docker-compose up -d
   ```

3. **Database Connection Issues:**

   ```bash
   # Restart database
   docker-compose restart postgres

   # Check database logs
   docker-compose logs postgres

   # Verify connection string
   echo $DATABASE_URL
   ```

### 2. Database Connection Failures

**Symptoms:**

- "Connection refused" errors
- "ECONNRESET" in logs
- API endpoints returning 500 errors

**Diagnostic Steps:**

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check PostgreSQL status
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres | tail -50

# Test connection from API container
docker-compose exec api psql $DATABASE_URL -c "SELECT 1;"
```

**Solutions:**

1. **Database Not Running:**

   ```bash
   docker-compose up -d postgres
   docker-compose logs postgres
   ```

2. **Connection Pool Exhausted:**

   ```bash
   # Increase pool size in .env
   DATABASE_POOL_SIZE=25
   DATABASE_POOL_TIMEOUT=30000

   # Restart API service
   docker-compose restart api
   ```

3. **Database Corruption:**

   ```bash
   # Check database integrity
   docker-compose exec postgres pg_dump --schema-only terrafusion > schema_backup.sql

   # Restore from backup if needed
   docker-compose exec postgres psql terrafusion < backup.sql
   ```

### 3. Authentication System Failure

**Symptoms:**

- Users cannot login
- "Invalid token" errors
- JWT verification failures

**Diagnostic Steps:**

```bash
# Check JWT secret configuration
echo $JWT_SECRET | wc -c  # Should be >= 32 characters

# Test token generation
curl -X POST http://localhost:\${{TF_ADMIN_PORT:-8080}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check Redis for session storage
redis-cli -u $REDIS_URL keys "session:*"
```

**Solutions:**

1. **Invalid JWT Secret:**

   ```bash
   # Generate new JWT secret
   openssl rand -base64 32

   # Update .env file
   JWT_SECRET=generated_secret_here

   # Restart API service
   docker-compose restart api
   ```

2. **Redis Session Storage Issues:**

   ```bash
   # Clear Redis cache
   redis-cli -u $REDIS_URL FLUSHALL

   # Restart Redis
   docker-compose restart redis
   ```

---

## ⚠️ High Priority Issues (Severity 2)

### 1. Slow API Response Times

**Symptoms:**

- API responses > 5 seconds
- Timeout errors
- Poor user experience

**Diagnostic Steps:**

```bash
# Monitor API response times
curl -w "Response time: %{time_total}s\n" -s http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/v1/properties/search

# Check database query performance
docker-compose exec postgres psql terrafusion -c "
  SELECT query, mean_time, calls
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;"

# Monitor system resources
htop
iotop
```

**Solutions:**

1. **Database Query Optimization:**

   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_properties_location
   ON properties USING GIN(location);

   CREATE INDEX CONCURRENTLY idx_properties_price_type
   ON properties(price, property_type);

   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM properties WHERE location @> '{"city": "Seattle"}';
   ```

2. **Enable Caching:**

   ```bash
   # Update .env
   CACHE_ENABLED=true
   CACHE_TTL=3600
   REDIS_URL=redis://redis:6379

   # Restart services
   docker-compose restart api
   ```

3. **Scale Services:**

   ```bash
   # Scale API service
   docker-compose up -d --scale api=3

   # Add load balancer configuration
   # Edit nginx.conf for upstream load balancing
   ```

### 2. Memory Leaks

**Symptoms:**

- Gradually increasing memory usage
- Out of memory errors
- Container restarts

**Diagnostic Steps:**

```bash
# Monitor memory usage over time
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check for memory leaks in Node.js
docker-compose exec api node --inspect=0.0.0.0:\${{TF_PORT_9229:-9229}} server.js

# Analyze heap dumps
docker-compose exec api kill -USR2 $(pgrep node)
```

**Solutions:**

1. **Enable Memory Monitoring:**

   ```javascript
   // Add to server.js
   const memoryUsage = process.memoryUsage();
   console.log('Memory usage:', {
     rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
     heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
     heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
   });
   ```

2. **Fix Common Memory Issues:**

   ```javascript
   // Properly close database connections
   process.on('SIGTERM', async () => {
     await pool.end();
     process.exit(0);
   });

   // Clear large objects from memory
   largeDataArray = null;
   if (global.gc) {
     global.gc();
   }
   ```

### 3. File Upload Issues

**Symptoms:**

- Upload timeouts
- "File too large" errors
- Corrupted files

**Diagnostic Steps:**

```bash
# Check nginx upload limits
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep client_max_body_size

# Check disk space
df -h

# Test upload directly
curl -X POST -F "file=@test.jpg" http://localhost:\${{TF_ADMIN_PORT:-8080}}/upload
```

**Solutions:**

1. **Increase Upload Limits:**

   ```nginx
   # nginx.conf
   client_max_body_size 50M;
   client_body_timeout 120s;
   ```

2. **Configure API Upload Limits:**
   ```javascript
   // Express configuration
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ limit: '50mb', extended: true }));
   ```

---

## 📊 Medium Priority Issues (Severity 3)

### 1. Search Results Inconsistency

**Symptoms:**

- Different results for same query
- Missing properties in results
- Outdated information

**Diagnostic Steps:**

```bash
# Check search index status
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/admin/search/status

# Compare database vs search results
psql $DATABASE_URL -c "SELECT COUNT(*) FROM properties WHERE city='Seattle';"

# Check Elasticsearch/search service
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/_cluster/health
```

**Solutions:**

1. **Rebuild Search Index:**

   ```bash
   # Trigger index rebuild
   curl -X POST http://localhost:\${{TF_ADMIN_PORT:-8080}}/admin/search/rebuild

   # Monitor rebuild progress
   curl http://localhost:\${{TF_ADMIN_PORT:-8080}}/admin/search/rebuild/status
   ```

2. **Fix Index Synchronization:**
   ```javascript
   // Add database triggers for automatic indexing
   CREATE OR REPLACE FUNCTION update_search_index()
   RETURNS TRIGGER AS $$
   BEGIN
     PERFORM pg_notify('property_updated', row_to_json(NEW)::text);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

### 2. Email Notifications Not Working

**Symptoms:**

- Users not receiving emails
- Email delivery failures
- SMTP connection errors

**Diagnostic Steps:**

```bash
# Test SMTP configuration
docker-compose exec api node -e "
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  transporter.verify().then(console.log).catch(console.error);
"

# Check email queue
redis-cli -u $REDIS_URL llen email_queue
```

**Solutions:**

1. **Fix SMTP Configuration:**

   ```bash
   # Update .env with correct SMTP settings
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your_sendgrid_api_key

   # Restart services
   docker-compose restart api
   ```

2. **Implement Email Queue Processing:**

   ```javascript
   // Add email worker
   const Queue = require('bull');
   const emailQueue = new Queue('email processing', process.env.REDIS_URL);

   emailQueue.process(async job => {
     const { to, subject, body } = job.data;
     await sendEmail(to, subject, body);
   });
   ```

---

## 🔧 Low Priority Issues (Severity 4)

### 1. UI/UX Issues

**Symptoms:**

- Layout problems
- Slow page loads
- JavaScript errors

**Diagnostic Steps:**

```bash
# Check frontend build
docker-compose logs frontend

# Test frontend directly
curl http://localhost:\${{TF_ADMIN_PORT:-8080}}

# Check browser console errors
# Open DevTools → Console
```

**Solutions:**

1. **Fix Build Issues:**

   ```bash
   # Rebuild frontend
   docker-compose build frontend
   docker-compose up -d frontend

   # Clear browser cache
   # Ctrl+Shift+R (hard refresh)
   ```

2. **Optimize Frontend Performance:**

   ```javascript
   // Add compression middleware
   const compression = require('compression');
   app.use(compression());

   // Enable browser caching
   app.use(
     express.static('public', {
       maxAge: '1y',
       etag: false,
     })
   );
   ```

---

## 🛠️ Self-Service Diagnostic Tools

### Automated Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "Terrafusion Health Check Report"
echo "================================"
echo "Timestamp: $(date)"
echo ""

# Check services
echo "Service Status:"
docker-compose ps

echo ""
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "API Health:"
curl -s http://localhost:\${{TF_ADMIN_PORT:-8080}}/health | jq . || echo "API not responding"

echo ""
echo "Database Status:"
psql $DATABASE_URL -c "SELECT version();" || echo "Database connection failed"

echo ""
echo "Recent Errors (last 50 lines):"
docker-compose logs --tail=50 api | grep -i error || echo "No errors found"

echo ""
echo "================================"
echo "Health check complete"
```

### Performance Monitoring Script

```bash
#!/bin/bash
# performance-monitor.sh

echo "Performance Monitoring Report"
echo "============================="

# API response times
echo "API Response Times:"
for endpoint in "/health" "/api/v1/properties/search?limit=10" "/api/v1/market/trends"; do
  time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:\${{TF_ADMIN_PORT:-8080}}$endpoint)
  echo "$endpoint: ${time}s"
done

echo ""
echo "Database Performance:"
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC
  LIMIT 10;
"

echo ""
echo "Redis Performance:"
redis-cli -u $REDIS_URL info stats | grep -E "(instantaneous_ops_per_sec|used_memory_human|connected_clients)"
```

---

## 📞 Escalation Procedures

### When to Escalate

| Issue Type               | Escalate If              | Contact                           |
| ------------------------ | ------------------------ | --------------------------------- |
| **Critical System Down** | > 15 minutes downtime    | Emergency: +1-800-TERRA-911       |
| **Data Loss/Corruption** | Any data integrity issue | Critical: critical@terrafusion.ai |
| **Security Incident**    | Suspected breach         | Security: security@terrafusion.ai |
| **Performance Issues**   | > 1 hour degradation     | Support: support@terrafusion.ai   |

### Escalation Information to Provide

1. **Issue Description**: Clear, concise problem statement
2. **Impact Assessment**: Users affected, business impact
3. **Timeline**: When issue started, duration
4. **Steps Taken**: Troubleshooting attempts
5. **System Information**: Environment, version, configuration
6. **Logs**: Relevant error logs and stack traces

---

## 📋 Issue Prevention Checklist

### Daily Monitoring

- [ ] Check system resource usage
- [ ] Review error logs
- [ ] Monitor API response times
- [ ] Verify backup completion
- [ ] Check database performance

### Weekly Reviews

- [ ] Analyze performance trends
- [ ] Review security logs
- [ ] Update documentation
- [ ] Plan capacity upgrades
- [ ] Test disaster recovery procedures

### Monthly Maintenance

- [ ] Update dependencies
- [ ] Optimize database indexes
- [ ] Clean up old logs and data
- [ ] Review monitoring alerts
- [ ] Conduct security assessments

---

## 🆘 Emergency Contacts

- **24/7 Emergency**: +1-800-TERRA-911
- **Critical Issues**: critical@terrafusion.ai
- **Security Issues**: security@terrafusion.ai
- **Technical Support**: support@terrafusion.ai
- **DevOps Team**: devops@terrafusion.ai

---

_Troubleshooting guide last updated: August 3, 2025_
