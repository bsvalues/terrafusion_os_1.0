# Terrafusion Government Marketplace - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Terrafusion Government Marketplace in production environments. The system is designed for government compliance, security, and scalability.

## System Architecture

### Frontend Components
- **React/TypeScript Application**: Modern government UI with Terrafusion 2024 branding
- **Government Dashboard**: Multi-tab interface for county operations
- **Plugin Marketplace**: Government-specific software catalog
- **AI Assistant**: Multi-persona intelligent automation system

### Backend Services
- **Government API Service**: County and plugin management
- **Authentication Service**: Role-based access control with MFA
- **Performance Service**: Caching and optimization
- **Notification Service**: Real-time compliance alerts
- **AI Assistant Service**: Intelligent automation workflows

### Security Features
- Government-grade authentication and authorization
- Role-based access control (7 user roles)
- Multi-factor authentication support
- Comprehensive audit trails
- FISMA, State DOE, and County Audit compliance

## Pre-Deployment Requirements

### Infrastructure Requirements
```yaml
Minimum System Requirements:
  CPU: 4 cores, 2.4GHz
  RAM: 8GB minimum, 16GB recommended
  Storage: 100GB SSD minimum
  Network: 1Gbps connection
  OS: Windows Server 2019+, Ubuntu 20.04+, or RHEL 8+

Recommended Production Setup:
  CPU: 8 cores, 3.0GHz
  RAM: 32GB
  Storage: 500GB NVMe SSD
  Network: 10Gbps connection
  Load Balancer: Nginx or Apache
  Database: PostgreSQL 13+ or SQL Server 2019+
```

### Software Dependencies
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0",
  "typescript": ">=4.9.0",
  "react": ">=18.0.0",
  "vite": ">=4.0.0"
}
```

### Security Requirements
- SSL/TLS certificates (government-approved CA)
- Firewall configuration for required ports
- Network segmentation for government compliance
- Backup and disaster recovery procedures
- Security monitoring and logging

## Deployment Steps

### 1. Environment Preparation

#### 1.1 Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 8.x.x or higher

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### 1.2 Database Setup
```sql
-- PostgreSQL setup (recommended)
CREATE DATABASE terrafusion_marketplace;
CREATE USER tf_app WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE terrafusion_marketplace TO tf_app;

-- Create required tables
\c terrafusion_marketplace;

CREATE TABLE counties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    population INTEGER,
    federation_status VARCHAR(20),
    compliance_score INTEGER,
    security_level VARCHAR(20),
    last_audit DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plugins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20),
    category VARCHAR(50),
    government_tier VARCHAR(30),
    description TEXT,
    publisher VARCHAR(100),
    license_type VARCHAR(20),
    validation_status VARCHAR(20),
    security_rating DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Add indexes for performance
CREATE INDEX idx_counties_federation_status ON counties(federation_status);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_government_tier ON plugins(government_tier);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
```

### 2. Application Deployment

#### 2.1 Code Deployment
```bash
# Create application directory
sudo mkdir -p /opt/terrafusion
sudo chown $USER:$USER /opt/terrafusion
cd /opt/terrafusion

# Clone or copy application files
# (Replace with your actual deployment method)
git clone https://github.com/your-org/terrafusion-marketplace.git .
# OR
# rsync -av /path/to/local/files/ /opt/terrafusion/

# Navigate to UI directory
cd marketplace/ui

# Install dependencies
npm ci --production

# Build application
npm run build

# Copy built files to web server directory
sudo cp -r dist/* /var/www/terrafusion/
```

#### 2.2 Environment Configuration
```bash
# Create environment configuration
cat > /opt/terrafusion/.env << EOF
# Application Configuration
NODE_ENV=production
PORT=3010
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=terrafusion_marketplace
DB_USER=tf_app
DB_PASSWORD=secure_password_here
DB_SSL=true

# Security Configuration
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
SESSION_SECRET=your_session_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Government Compliance
AUDIT_RETENTION_DAYS=2555  # 7 years
COMPLIANCE_MODE=government
SECURITY_LEVEL=high

# AI Assistant Configuration
AI_SERVICE_URL=https://your-ai-service.gov
AI_API_KEY=your_ai_api_key_here
AI_TIMEOUT=30000

# Notification Configuration
SMTP_HOST=your-smtp-server.gov
SMTP_PORT=587
SMTP_USER=notifications@your-county.gov
SMTP_PASS=smtp_password_here
SMTP_SECURE=true

# Performance Configuration
CACHE_TTL=3600
CACHE_SIZE=1000
ENABLE_COMPRESSION=true
ENABLE_RATE_LIMITING=true

# Monitoring Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/terrafusion/app.log
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
EOF

# Secure environment file
chmod 600 /opt/terrafusion/.env
```

#### 2.3 Process Management
```bash
# Create PM2 ecosystem file
cat > /opt/terrafusion/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'terrafusion-marketplace',
    script: 'npm',
    args: 'run preview',
    cwd: '/opt/terrafusion/marketplace/ui',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    error_file: '/var/log/terrafusion/error.log',
    out_file: '/var/log/terrafusion/out.log',
    log_file: '/var/log/terrafusion/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/terrafusion
sudo chown $USER:$USER /var/log/terrafusion

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Web Server Configuration

#### 3.1 Nginx Configuration
```nginx
# /etc/nginx/sites-available/terrafusion
server {
    listen 80;
    server_name your-domain.gov;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.gov;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss:";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Main Application
    location / {
        try_files $uri $uri/ @proxy;
    }

    location @proxy {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login Rate Limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @proxy;
    }

    # Health Check
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:3010/health;
    }

    # Logging
    access_log /var/log/nginx/terrafusion_access.log;
    error_log /var/log/nginx/terrafusion_error.log;
}
```

#### 3.2 Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/terrafusion /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Security Hardening

#### 4.1 Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# For database server (if separate)
sudo ufw allow from your_app_server_ip to any port 5432
```

#### 4.2 SSL Certificate Setup
```bash
# Using Let's Encrypt (for development/testing)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.gov

# For production, use government-approved certificates
# Copy certificates to appropriate locations
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/
sudo chmod 644 /etc/ssl/certs/your-certificate.crt
sudo chmod 600 /etc/ssl/private/your-private.key
```

#### 4.3 System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs fail2ban

# Configure fail2ban for SSH protection
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Set up log rotation
sudo cat > /etc/logrotate.d/terrafusion << EOF
/var/log/terrafusion/*.log {
    daily
    missingok
    rotate 365
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 5. Backup and Recovery

#### 5.1 Database Backup
```bash
# Create backup script
sudo cat > /opt/terrafusion/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/terrafusion"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="terrafusion_marketplace"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U tf_app -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /opt/terrafusion/backup-db.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/terrafusion/backup-db.sh") | crontab -
```

#### 5.2 Application Backup
```bash
# Create application backup script
sudo cat > /opt/terrafusion/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/terrafusion"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/terrafusion"

mkdir -p $BACKUP_DIR

# Create application backup (excluding node_modules)
tar --exclude='node_modules' --exclude='dist' --exclude='.git' \
    -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of application backups
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"
EOF

chmod +x /opt/terrafusion/backup-app.sh

# Schedule weekly application backups
(crontab -l 2>/dev/null; echo "0 3 * * 0 /opt/terrafusion/backup-app.sh") | crontab -
```

### 6. Health Monitoring

#### 6.1 Application Health Checks
```bash
# Create health check script
cat > /opt/terrafusion/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="https://your-domain.gov/health"
LOG_FILE="/var/log/terrafusion/health-check.log"

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date): Health check passed" >> $LOG_FILE
else
    echo "$(date): Health check failed - HTTP $response" >> $LOG_FILE
    # Send alert (configure your notification method)
    # mail -s "Terrafusion Health Check Failed" admin@your-county.gov < /dev/null
fi
EOF

chmod +x /opt/terrafusion/health-check.sh

# Schedule health checks every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/terrafusion/health-check.sh") | crontab -
```

#### 6.2 System Monitoring
```bash
# Install and configure system monitoring
sudo apt install prometheus-node-exporter

# Create custom metrics script
cat > /opt/terrafusion/metrics.sh << 'EOF'
#!/bin/bash
METRICS_FILE="/var/lib/node_exporter/textfile_collector/terrafusion.prom"

# Application metrics
APP_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")
DB_CONNECTIONS=$(psql -h localhost -U tf_app -d terrafusion_marketplace -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ' || echo "0")

# Write metrics
cat > $METRICS_FILE << METRICS
# HELP terrafusion_app_status Application status (1=online, 0=offline)
# TYPE terrafusion_app_status gauge
terrafusion_app_status{status="$APP_STATUS"} $([ "$APP_STATUS" = "online" ] && echo 1 || echo 0)

# HELP terrafusion_db_connections Database connections
# TYPE terrafusion_db_connections gauge
terrafusion_db_connections $DB_CONNECTIONS
METRICS
EOF

chmod +x /opt/terrafusion/metrics.sh

# Run metrics collection every minute
(crontab -l 2>/dev/null; echo "* * * * * /opt/terrafusion/metrics.sh") | crontab -
```

## Post-Deployment Verification

### 1. Functional Testing
```bash
# Test application endpoints
curl -k https://your-domain.gov/health
curl -k https://your-domain.gov/api/counties
curl -k https://your-domain.gov/api/plugins

# Test AI Assistant (requires authentication)
# Use browser or API testing tool
```

### 2. Performance Testing
```bash
# Install Apache Bench for load testing
sudo apt install apache2-utils

# Basic load test (adjust as needed)
ab -n 1000 -c 10 https://your-domain.gov/

# Monitor during load test
htop
iotop
```

### 3. Security Verification
```bash
# SSL/TLS testing
openssl s_client -connect your-domain.gov:443 -servername your-domain.gov

# Security headers check
curl -I https://your-domain.gov/

# Port scanning (from external network)
nmap -sS -O your-domain.gov
```

## Maintenance Procedures

### Daily Tasks
- Monitor application logs
- Check system resources
- Verify backup completion
- Review security alerts

### Weekly Tasks
- Update system packages
- Review performance metrics
- Analyze user activity logs
- Test backup restoration

### Monthly Tasks
- Security vulnerability scanning
- Performance optimization review
- Capacity planning assessment
- Documentation updates

### Quarterly Tasks
- Security audit and penetration testing
- Disaster recovery testing
- User access review
- Compliance certification renewal

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs terrafusion-marketplace

# Check system resources
free -h
df -h

# Restart application
pm2 restart terrafusion-marketplace
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U tf_app -d terrafusion_marketplace -c "SELECT version();"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart application if needed
pm2 restart terrafusion-marketplace

# Consider scaling up resources
```

### Emergency Procedures

#### Complete System Failure
1. Check system status and logs
2. Attempt service restart
3. Restore from backup if necessary
4. Notify stakeholders
5. Document incident

#### Security Breach
1. Isolate affected systems
2. Preserve evidence
3. Notify security team
4. Follow incident response plan
5. Conduct post-incident review

## Support and Contacts

### Technical Support
- **Development Team**: Terrafusion Engineering
- **System Administration**: IT Operations Team
- **Security Team**: Information Security Office
- **Database Administration**: Database Team

### Emergency Contacts
- **24/7 Support**: [Emergency phone number]
- **Security Incidents**: [Security team contact]
- **System Outages**: [Operations team contact]

### Documentation
- **User Guide**: `/docs/USER_TESTING_GUIDE.md`
- **API Documentation**: `/docs/API_REFERENCE.md`
- **Security Policies**: `/docs/SECURITY_POLICIES.md`
- **Compliance Documentation**: `/docs/COMPLIANCE_GUIDE.md`

---

**Document Version**: 1.0  
**Last Updated**: July 31, 2025  
**Next Review**: August 31, 2025  

This deployment guide ensures secure, scalable, and compliant deployment of the Terrafusion Government Marketplace in production environments.
