# Terrafusion Production Hardening Checklist

## Web Server Configuration

- [ ] **Backend Server**: Configure Gunicorn/Uvicorn for Python backend
  - [ ] Set worker count based on CPU cores
  - [ ] Configure timeouts appropriately
  - [ ] Enable access logging
  - [ ] Set up health check endpoint
- [ ] **AI Engine Server**: Configure production ASGI server
  - [ ] Use Uvicorn with proper worker configuration
  - [ ] Enable auto-restart on failure
  - [ ] Configure request size limits
- [ ] **Frontend Server**: Configure Nginx for React app
  - [ ] Enable gzip compression
  - [ ] Configure cache headers
  - [ ] Set up reverse proxy for API calls
  - [ ] Configure rate limiting

## Security & Secrets Management

- [ ] **API Keys & Secrets Rotation**
  - [ ] Rotate all development API keys
  - [ ] Store secrets in environment variables or secret manager
  - [ ] Remove hardcoded credentials from code
  - [ ] Update `.env.example` with required variables
- [ ] **Database Security**
  - [ ] Change default PostgreSQL password
  - [ ] Create application-specific database user
  - [ ] Restrict database access to application servers only
  - [ ] Enable SSL for database connections
- [ ] **Redis Security**
  - [ ] Set Redis password
  - [ ] Bind to localhost only
  - [ ] Configure maxmemory policy

## Backup & Recovery

- [ ] **PostgreSQL Backups**
  - [ ] Set up daily automated backups
  - [ ] Configure backup retention (30 days)
  - [ ] Test restore procedure monthly
  - [ ] Store backups in secure location (S3/GCS)
- [ ] **Redis Persistence**
  - [ ] Enable RDB snapshots
  - [ ] Configure AOF if needed
  - [ ] Test Redis recovery

## Network Security

- [ ] **Firewall Configuration**
  - [ ] Allow port 443 (HTTPS) for public access
  - [ ] Allow port 80 (HTTP) redirect to HTTPS only
  - [ ] Block all other ports except SSH (restricted IPs)
  - [ ] Configure internal network for service communication
- [ ] **SSL/TLS Certificates**
  - [ ] Obtain SSL certificates (Let's Encrypt or commercial)
  - [ ] Configure auto-renewal
  - [ ] Enable HTTPS redirect
  - [ ] Configure HSTS headers

## Monitoring & Alerting

- [ ] **Application Monitoring**
  - [ ] Set up Prometheus/Grafana or equivalent
  - [ ] Monitor CPU, memory, disk usage
  - [ ] Track API response times
  - [ ] Monitor error rates
- [ ] **Database Monitoring**
  - [ ] Monitor connection pool usage
  - [ ] Track query performance
  - [ ] Alert on replication lag
  - [ ] Monitor disk space
- [ ] **Log Management**
  - [ ] Centralize logs (ELK stack or cloud solution)
  - [ ] Set up log rotation
  - [ ] Configure error alerting
  - [ ] Enable audit logging

## Documentation

- [ ] **Operations Manual**
  - [ ] Service start/stop procedures
  - [ ] Log file locations
  - [ ] Configuration file locations
  - [ ] Health check URLs
- [ ] **Emergency Procedures**
  - [ ] Contact information
  - [ ] Escalation procedures
  - [ ] Rollback procedures
  - [ ] Data recovery steps

## Performance Optimization

- [ ] **Database Optimization**
  - [ ] Create necessary indexes
  - [ ] Configure connection pooling
  - [ ] Set up query optimization
  - [ ] Enable query caching where appropriate
- [ ] **Application Optimization**
  - [ ] Enable production build optimizations
  - [ ] Configure CDN for static assets
  - [ ] Enable HTTP/2
  - [ ] Implement caching strategy

## Compliance & Audit

- [ ] **Security Audit**
  - [ ] Run vulnerability scanner
  - [ ] Review OWASP top 10
  - [ ] Penetration testing
  - [ ] Code security review
- [ ] **Compliance Requirements**
  - [ ] GDPR compliance (if applicable)
  - [ ] Data retention policies
  - [ ] User consent mechanisms
  - [ ] Data export capabilities

## Final Verification

- [ ] All services start automatically on boot
- [ ] All services recover from crashes
- [ ] Backup restoration tested
- [ ] Monitoring alerts working
- [ ] Documentation complete and accessible
- [ ] Team trained on procedures
