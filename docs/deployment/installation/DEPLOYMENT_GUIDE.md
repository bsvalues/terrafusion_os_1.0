# TerraFusion OS Deployment Guide
## Complete Installation and Configuration Guide

### 🎯 Pre-Deployment Checklist

#### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or newer
- **CPU**: 16+ cores (32+ recommended for production)
- **Memory**: 64GB RAM minimum (128GB recommended)
- **Storage**: 2TB SSD storage minimum
- **Network**: Gigabit Ethernet with redundant connections
- **Database**: PostgreSQL 14+ and Redis 6+

#### Security Prerequisites
- ✅ FISMA authorization obtained
- ✅ Security assessment completed
- ✅ Network security controls in place
- ✅ Government PKI certificates available
- ✅ Backup and recovery procedures tested

#### Personnel Requirements
- **System Administrator**: Certified in Linux administration
- **Database Administrator**: PostgreSQL expertise required
- **Security Administrator**: Government security clearance
- **Network Administrator**: Enterprise networking experience

### 🏗️ Infrastructure Setup

#### Production Environment Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                           │
│                     (Government Firewall)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     Application Servers                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Server 1      │  │   Server 2      │  │   Server 3      │ │
│  │  TerraFusion    │  │  TerraFusion    │  │  TerraFusion    │ │
│  │  Primary        │  │  Secondary      │  │  Backup         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Database Cluster                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL      │  │ PostgreSQL      │  │ Redis           │ │
│  │ Primary         │  │ Replica         │  │ Cache           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Network Configuration
```bash
# Configure government network settings
sudo nano /etc/netplan/01-government-config.yaml

network:
  version: 2
  ethernets:
    ens3:
      dhcp4: no
      addresses:
        - 10.100.1.10/24
      gateway4: 10.100.1.1
      nameservers:
        addresses: [10.100.1.5, 10.100.1.6]
        search: [bentoncounty.gov]

# Apply network configuration
sudo netplan apply
```

### 📦 Software Installation

#### Step 1: System Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
  docker.io \
  docker-compose \
  postgresql-14 \
  redis-server \
  nginx \
  certbot \
  fail2ban \
  ufw \
  htop \
  curl \
  git

# Configure Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

#### Step 2: Database Setup
```bash
# Configure PostgreSQL
sudo -u postgres createuser terrafusion_user
sudo -u postgres createdb terrafusion_production
sudo -u postgres psql

# In PostgreSQL shell:
ALTER USER terrafusion_user PASSWORD 'secure_government_password';
GRANT ALL PRIVILEGES ON DATABASE terrafusion_production TO terrafusion_user;
\q

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass government_redis_password
sudo systemctl restart redis-server
```

#### Step 3: TerraFusion OS Installation
```bash
# Clone TerraFusion OS repository
git clone https://github.com/terrafusion/terrafusion_os_1.0.git
cd terrafusion_os_1.0

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install

# Install .NET 8.0
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-8.0

# Build Rust Performance Engine
cd rust-performance-engine
cargo build --release
cd ..

# Configure environment
cp .env.production.example .env.production
nano .env.production
```

#### Step 4: Environment Configuration
```bash
# .env.production configuration
TF_API_PORT=5000
TF_FRONTEND_PORT=3104
DATABASE_URL=postgresql://terrafusion_user:secure_government_password@localhost:5432/terrafusion_production
REDIS_URL=redis://localhost:6379
JWT_SECRET=government_jwt_secret_key_256_bits
ENCRYPTION_KEY=government_encryption_key_aes256
DEPLOYMENT_ENVIRONMENT=production
COUNTY_NAME=Benton County
COUNTY_STATE=Washington
FISMA_LEVEL=HIGH
```

### 🔐 Security Configuration

#### SSL/TLS Certificate Setup
```bash
# Obtain government-issued certificates
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d terrafusion.bentoncounty.gov \
  -d api.terrafusion.bentoncounty.gov

# Configure Nginx with SSL
sudo nano /etc/nginx/sites-available/terrafusion
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name terrafusion.bentoncounty.gov;

    ssl_certificate /etc/letsencrypt/live/terrafusion.bentoncounty.gov/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/terrafusion.bentoncounty.gov/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3104;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.100.1.0/24 to any port 5432
sudo ufw enable
```

### 🚀 Application Deployment

#### Step 1: Build Applications
```bash
# Build backend API
cd backend/TerraFusion.API
dotnet publish -c Release -o /opt/terrafusion/api

# Build frontend
cd ../../frontend
npm run build:production
cp -r dist/* /opt/terrafusion/frontend/

# Build Rust engine
cd ../rust-performance-engine
cargo build --release
cp target/release/libterrafusion_engine.so /opt/terrafusion/lib/
```

#### Step 2: Create System Services
```bash
# Create API service
sudo nano /etc/systemd/system/terrafusion-api.service
```

```ini
[Unit]
Description=TerraFusion OS API Gateway
After=network.target

[Service]
Type=notify
User=terrafusion
Group=terrafusion
WorkingDirectory=/opt/terrafusion/api
ExecStart=/usr/bin/dotnet TerraFusion.API.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=terrafusion-api
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

```bash
# Create frontend service
sudo nano /etc/systemd/system/terrafusion-frontend.service
```

```ini
[Unit]
Description=TerraFusion OS Frontend
After=network.target

[Service]
Type=simple
User=terrafusion
Group=terrafusion
WorkingDirectory=/opt/terrafusion/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Step 3: Start Services
```bash
# Enable and start services
sudo systemctl enable terrafusion-api
sudo systemctl enable terrafusion-frontend
sudo systemctl start terrafusion-api
sudo systemctl start terrafusion-frontend

# Verify services
sudo systemctl status terrafusion-api
sudo systemctl status terrafusion-frontend
```

### 📊 Data Migration

#### Step 1: Import County Data
```bash
# Run data migration scripts
cd /opt/terrafusion
python3 scripts/import_benton_county_data.py \
  --source /data/harris_pacs_export.csv \
  --validate \
  --commit

# Verify data integrity
python3 scripts/validate_data_migration.py
```

#### Step 2: Initialize AI Swarm
```bash
# Deploy AI agents
npm run ai-swarm:deploy
npm run ai-swarm:validate

# Initialize Supreme Commander Claude
node scripts/initialize-supreme-commander.js
```

### 🔧 Module Configuration

#### Step 1: Install Core Modules
```bash
# Install essential government modules
npm run module:install ai-swarm
npm run module:install government-edition
npm run module:install costforge-ai
npm run module:install terra-collections
npm run module:install gispro

# Configure module permissions
node scripts/configure-module-permissions.js
```

#### Step 2: Module Marketplace Setup
```bash
# Initialize marketplace
npm run marketplace:initialize
npm run marketplace:sync-pricing

# Validate module integrations
npm run module:test-integrations
```

### 🧪 Post-Deployment Testing

#### Step 1: System Health Verification
```bash
# Run comprehensive health checks
curl https://terrafusion.bentoncounty.gov/health
curl https://terrafusion.bentoncounty.gov/api/health

# Test AI Swarm coordination
curl https://terrafusion.bentoncounty.gov/api/ai-swarm/status

# Verify database connectivity
npm run test:database
```

#### Step 2: Load Testing
```bash
# Execute production load tests
node scripts/government-scale-load-tester.cjs

# Monitor system performance
htop
iotop
nethogs
```

#### Step 3: Security Validation
```bash
# Run security compliance tests
npm run security:scan
npm run compliance:audit

# Verify encryption
npm run test:encryption
```

### 📋 Go-Live Checklist

#### Pre-Go-Live (24 hours before)
- [ ] Final security scan completed
- [ ] Database backup created and verified
- [ ] Load testing passed all benchmarks
- [ ] All team members notified
- [ ] Rollback procedures documented
- [ ] Monitoring systems active

#### Go-Live (Day of deployment)
- [ ] System health verified
- [ ] DNS records updated
- [ ] SSL certificates validated
- [ ] User acceptance testing completed
- [ ] Staff training completed
- [ ] Public announcement prepared

#### Post-Go-Live (First 24 hours)
- [ ] System monitoring active
- [ ] Performance metrics within targets
- [ ] User feedback collected
- [ ] Incident response team on standby
- [ ] Backup systems verified
- [ ] Success metrics documented

### 🆘 Troubleshooting

#### Common Issues

**API Service Not Starting**
```bash
# Check logs
sudo journalctl -u terrafusion-api -f

# Verify database connection
sudo -u postgres psql -c "SELECT 1;"

# Restart service
sudo systemctl restart terrafusion-api
```

**Frontend Build Errors**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild frontend
npm run build:production
```

**Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify network connectivity
telnet localhost 5432

# Review connection settings
sudo -u postgres psql -c "SHOW port;"
```

### 📞 Support and Escalation

#### Level 1 Support
- **County IT Help Desk**: (509) 736-3000
- **Response Time**: 4 hours
- **Coverage**: Business hours (8 AM - 5 PM)

#### Level 2 Support
- **TerraFusion Engineering**: support@terrafusion.gov
- **Response Time**: 2 hours
- **Coverage**: 24/7 for critical issues

#### Level 3 Support
- **TerraFusion Architects**: emergency@terrafusion.gov
- **Response Time**: 30 minutes
- **Coverage**: 24/7 for system-down situations

---

**Document Information**
- Version: 1.0 Production Deployment
- Classification: Government Operations - Restricted
- Owner: TerraFusion Deployment Team
- Last Updated: September 19, 2025
- Review Schedule: After each deployment
