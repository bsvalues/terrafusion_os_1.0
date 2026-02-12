# Terrafusion Infrastructure Monitoring Runbooks

## High CPU Usage (high-cpu)

### Alert: HighCPUUsage

**Severity:** Warning  
**Threshold:** CPU usage > 85% for 5 minutes

### Immediate Actions

1. **Verify the alert**: Check Grafana dashboard to confirm high CPU usage
2. **Identify the cause**:

   ```bash
   # Check top processes
   top -o %CPU
   htop

   # Check system load
   uptime
   cat /proc/loadavg
   ```

3. **Check for specific processes**:

   ```bash
   # Find CPU-intensive processes
   ps aux --sort=-%cpu | head -20

   # Check for runaway processes
   ps -eo pid,ppid,cmd,%cpu --sort=-%cpu | head -20
   ```

### Investigation Steps

1. **Analyze CPU usage patterns**:
   - Check if this is a recurring pattern
   - Look at historical data in Grafana
   - Identify if it correlates with specific operations

2. **Check application metrics**:
   - Review application performance metrics
   - Look for increased request rates
   - Check for inefficient database queries

### Mitigation Steps

1. **Immediate relief**:

   ```bash
   # Kill problematic processes if safe
   kill -TERM <pid>

   # Restart services if necessary
   systemctl restart <service>
   ```

2. **Scale resources** (if in cloud environment):
   - Increase CPU allocation
   - Scale horizontally if possible

3. **Optimize workloads**:
   - Defer non-critical tasks
   - Enable rate limiting
   - Optimize database queries

### Prevention

- Monitor trends and predict capacity needs
- Implement auto-scaling
- Regular performance testing
- Code profiling and optimization

---

## High Memory Usage (high-memory)

### Alert: HighMemoryUsage

**Severity:** Critical  
**Threshold:** Memory usage > 90% for 5 minutes

### Immediate Actions

1. **Check memory usage**:

   ```bash
   free -h
   cat /proc/meminfo
   ```

2. **Identify memory-consuming processes**:

   ```bash
   ps aux --sort=-%mem | head -20
   top -o %MEM
   ```

3. **Check for memory leaks**:
   ```bash
   # Monitor memory usage over time
   watch -n 1 'free -h && echo "---" && ps aux --sort=-%mem | head -10'
   ```

### Investigation Steps

1. **Analyze memory patterns**:
   - Check if usage is growing over time
   - Look for sudden spikes
   - Review application logs for memory-related errors

2. **Check swap usage**:
   ```bash
   swapon -s
   cat /proc/swaps
   ```

### Mitigation Steps

1. **Free up memory**:

   ```bash
   # Clear page cache (if safe)
   echo 1 > /proc/sys/vm/drop_caches

   # Restart memory-intensive services
   systemctl restart <service>
   ```

2. **Kill non-essential processes**:

   ```bash
   # Kill processes safely
   pkill -f "non-essential-process"
   ```

3. **Add swap space** (temporary solution):
   ```bash
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

### Prevention

- Regular memory leak testing
- Implement memory limits for containers
- Monitor memory trends
- Capacity planning

---

## Service Down (service-down)

### Alert: ServiceDown

**Severity:** Critical  
**Threshold:** Service not responding for 1 minute

### Immediate Actions

1. **Verify service status**:

   ```bash
   systemctl status <service>
   curl -f http://localhost:port/health
   ```

2. **Check service logs**:

   ```bash
   journalctl -u <service> -f
   tail -f /var/log/<service>.log
   ```

3. **Attempt restart**:
   ```bash
   systemctl restart <service>
   systemctl status <service>
   ```

### Investigation Steps

1. **Check dependencies**:
   - Database connectivity
   - External service availability
   - Network connectivity
   - SSL certificate validity

2. **Review recent changes**:
   - Recent deployments
   - Configuration changes
   - Infrastructure modifications

3. **Check resource availability**:
   - Disk space
   - Memory usage
   - File descriptor limits

### Mitigation Steps

1. **Service recovery**:

   ```bash
   # If restart fails, try force restart
   systemctl kill <service>
   systemctl start <service>
   ```

2. **Fallback procedures**:
   - Route traffic to healthy instances
   - Enable maintenance mode
   - Rollback recent changes if necessary

3. **Scale horizontally**:
   - Start additional instances
   - Load balance across healthy nodes

### Prevention

- Health check endpoints
- Circuit breakers
- Graceful degradation
- Redundancy and failover

---

## Disk Space Low (disk-space)

### Alert: DiskSpaceLow

**Severity:** Warning  
**Threshold:** Disk usage > 90% for 10 minutes

### Immediate Actions

1. **Check disk usage**:

   ```bash
   df -h
   du -sh /* | sort -rh | head -10
   ```

2. **Find large files**:

   ```bash
   find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null
   ncdu /  # Interactive disk usage analyzer
   ```

3. **Clean up temporary files**:

   ```bash
   # Clean temporary files
   rm -rf /tmp/*
   rm -rf /var/tmp/*

   # Clean old logs
   find /var/log -name "*.log" -type f -mtime +30 -delete
   ```

### Investigation Steps

1. **Identify space consumers**:
   - Application logs
   - Database files
   - Cache directories
   - Old backups

2. **Check log rotation**:
   ```bash
   ls -la /etc/logrotate.d/
   logrotate -d /etc/logrotate.conf
   ```

### Mitigation Steps

1. **Free up space**:

   ```bash
   # Compress old logs
   gzip /var/log/*.log

   # Clean package caches
   apt clean  # Ubuntu/Debian
   yum clean all  # CentOS/RHEL

   # Remove old Docker images
   docker system prune -af
   ```

2. **Archive data**:
   - Move old data to archive storage
   - Compress infrequently accessed files

3. **Extend storage**:
   - Add new disk volumes
   - Resize existing volumes

### Prevention

- Automated log rotation
- Regular cleanup scripts
- Monitoring disk usage trends
- Capacity planning

---

## Network Issues (network-issues)

### Common Network Problems

#### High Network Latency

```bash
# Check network latency
ping -c 10 <target>
mtr <target>  # My TraceRoute

# Check network interfaces
ip link show
ethtool <interface>
```

#### Packet Loss

```bash
# Monitor packet loss
ping -f <target>
iperf3 -c <server> -t 60

# Check network statistics
netstat -i
cat /proc/net/dev
```

#### DNS Issues

```bash
# Test DNS resolution
nslookup <domain>
dig <domain>

# Check DNS configuration
cat /etc/resolv.conf
systemd-resolve --status
```

### Mitigation Steps

1. **Network troubleshooting**:

   ```bash
   # Restart network service
   systemctl restart networking

   # Flush DNS cache
   systemctl restart systemd-resolved

   # Check routing table
   ip route show
   ```

2. **Quality of Service**:
   - Implement traffic shaping
   - Prioritize critical traffic
   - Implement connection pooling

### Prevention

- Network monitoring
- Redundant network paths
- Regular network performance testing
- Capacity planning

---

## Database Issues (database-issues)

### Connection Failures

```bash
# Check database status
systemctl status postgresql  # or mysql/mongodb
ps aux | grep postgres

# Test connections
psql -h localhost -U user -d database
mysql -h localhost -u user -p database
```

### Slow Queries

```bash
# PostgreSQL slow query log
tail -f /var/log/postgresql/postgresql.log

# MySQL slow query log
tail -f /var/log/mysql/slow.log

# Check active connections
SELECT * FROM pg_stat_activity;  -- PostgreSQL
SHOW PROCESSLIST;  -- MySQL
```

### Mitigation Steps

1. **Connection pool management**:
   - Restart connection pools
   - Increase connection limits
   - Optimize connection settings

2. **Query optimization**:
   - Kill long-running queries
   - Add database indexes
   - Optimize application queries

3. **Resource scaling**:
   - Increase database resources
   - Implement read replicas
   - Consider database sharding

### Prevention

- Regular performance monitoring
- Query optimization
- Connection pool tuning
- Database maintenance
