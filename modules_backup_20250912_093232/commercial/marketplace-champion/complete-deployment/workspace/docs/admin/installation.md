# Terrafusion Installation & Setup Guide

Complete guide for installing and configuring Terrafusion in production
environments.

## 🎯 Installation Overview

Terrafusion supports multiple deployment scenarios:

- **Single Server**: All-in-one deployment for small teams
- **Multi-Server**: Distributed deployment for scalability
- **Container**: Docker/Kubernetes deployment
- **Cloud**: AWS, Azure, GCP managed deployments

## 📋 System Requirements

### Minimum Requirements

| Component   | Requirement                                  |
| ----------- | -------------------------------------------- |
| **OS**      | Ubuntu 20.04+, RHEL 8+, Windows Server 2019+ |
| **CPU**     | 4 cores, 2.4 GHz                             |
| **Memory**  | 16 GB RAM                                    |
| **Storage** | 100 GB SSD                                   |
| **Network** | 1 Gbps connection                            |

### Recommended Requirements

| Component   | Requirement                        |
| ----------- | ---------------------------------- |
| **OS**      | Ubuntu 22.04 LTS                   |
| **CPU**     | 8 cores, 3.0 GHz+                  |
| **Memory**  | 32 GB RAM                          |
| **Storage** | 500 GB NVMe SSD                    |
| **Network** | 10 Gbps connection                 |
| **GPU**     | NVIDIA RTX 4090 (for ML inference) |

### Software Dependencies

- **Docker** 24.0+
- **Docker Compose** 2.0+
- **PostgreSQL** 15+
- **Redis** 7.0+
- **Nginx** 1.20+
- **Node.js** 18+ (for build tools)
- **Rust** 1.70+ (for core services)

---

## 🚀 Quick Installation (Docker)

### 1. Download and Extract

```bash
# Download Terrafusion release
wget https://releases.terrafusion.ai/v3.0.5/terrafusion-v3.0.5.tar.gz
tar -xzf terrafusion-v3.0.5.tar.gz
cd terrafusion-v3.0.5
```

### 2. Configure Environment

```bash
# Copy and edit configuration
cp .env.example .env.production

# Edit configuration file
nano .env.production
```

**Required Configuration:**

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=\${{TF_POSTGRES_PORT:-5432}}
POSTGRES_DB=terrafusion
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=your_secure_password

# Redis Configuration
REDIS_URL=redis://localhost:\${{TF_REDIS_PORT:-6379}}

# API Configuration
API_SECRET_KEY=your_256_bit_secret_key
JWT_SECRET=your_jwt_secret_key

# External Services
GOOGLE_MAPS_API_KEY=your_google_maps_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_app_password
```

### 3. Deploy Services

```bash
# Start infrastructure services
docker-compose up -d postgres redis nginx

# Initialize database
docker-compose exec postgres psql -U terrafusion -d terrafusion -f /docker-entrypoint-initdb.d/init.sql

# Start application services
docker-compose up -d

# Verify deployment
docker-compose ps
curl http://localhost/health
```

---

## 🏗️ Manual Installation

### 1. System Preparation

#### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl wget git build-essential pkg-config libssl-dev

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### RHEL/CentOS

```bash
# Update system
sudo dnf update -y

# Install dependencies
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y curl wget git openssl-devel

# Install Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. Database Setup

#### PostgreSQL Installation

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE terrafusion;
CREATE USER terrafusion WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE terrafusion TO terrafusion;
ALTER USER terrafusion CREATEDB;
\q
EOF

# Enable and start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### Database Initialization

```bash
# Download and apply schema
wget https://releases.terrafusion.ai/schema/v3.0.5/schema.sql
psql -h localhost -U terrafusion -d terrafusion -f schema.sql

# Apply initial data
wget https://releases.terrafusion.ai/schema/v3.0.5/initial-data.sql
psql -h localhost -U terrafusion -d terrafusion -f initial-data.sql
```

### 3. Redis Installation

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Key settings:
# maxmemory 2gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 4. Application Installation

#### Install Node.js and Rust

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup target add x86_64-unknown-linux-gnu
```

#### Build Application

```bash
# Clone or extract Terrafusion
git clone https://github.com/terrafusion/terrafusion-master-workspace.git
cd terrafusion-master-workspace

# Install dependencies
npm install

# Build frontend
npm run build:prod

# Build Rust services
cargo build --release

# Build desktop application (optional)
npm run tauri build
```

### 5. Web Server Configuration

#### Nginx Setup

```bash
# Install Nginx
sudo apt install -y nginx

# Create Terrafusion configuration
sudo nano /etc/nginx/sites-available/terrafusion
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/terrafusion.crt;
    ssl_certificate_key /etc/ssl/private/terrafusion.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files
    location / {
        root /var/www/terrafusion/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:\${{TF_REDIS_PORT:-6379}}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:\${{TF_REDIS_PORT:-6379}}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/terrafusion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/terrafusion.key \
    -out /etc/ssl/certs/terrafusion.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

---

## 🔧 Service Configuration

### Systemd Services

#### Terrafusion API Service

```bash
sudo nano /etc/systemd/system/terrafusion-api.service
```

```ini
[Unit]
Description=Terrafusion API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=terrafusion
Group=terrafusion
WorkingDirectory=/opt/terrafusion
Environment=NODE_ENV=production
Environment=PORT=\${{TF_POSTGRES_PORT:-5432}}
EnvironmentFile=/opt/terrafusion/.env.production
ExecStart=/opt/terrafusion/target/release/terrafusion-api
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/terrafusion/logs

[Install]
WantedBy=multi-user.target
```

#### Terrafusion Worker Service

```bash
sudo nano /etc/systemd/system/terrafusion-worker.service
```

```ini
[Unit]
Description=Terrafusion Background Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=terrafusion
Group=terrafusion
WorkingDirectory=/opt/terrafusion
Environment=NODE_ENV=production
EnvironmentFile=/opt/terrafusion/.env.production
ExecStart=/opt/terrafusion/target/release/terrafusion-worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable terrafusion-api terrafusion-worker
sudo systemctl start terrafusion-api terrafusion-worker

# Check status
sudo systemctl status terrafusion-api
sudo systemctl status terrafusion-worker
```

---

## 🎛️ Environment Configuration

### Production Environment Variables

```bash
# /opt/terrafusion/.env.production

# Application
NODE_ENV=production
PORT=\${{TF_POSTGRES_PORT:-5432}}
WORKERS=4
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://terrafusion:password@localhost:\${{TF_REDIS_PORT:-6379}}/terrafusion
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:\${{TF_REDIS_PORT:-6379}}
REDIS_POOL_SIZE=10

# Security
JWT_SECRET=your_256_bit_jwt_secret
API_SECRET_KEY=your_256_bit_api_secret
ENCRYPTION_KEY=your_256_bit_encryption_key
CORS_ORIGINS=https://your-domain.com

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-west-2
AWS_S3_BUCKET=terrafusion-data

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
METRICS_ENABLED=true
METRICS_PORT=\${{TF_POSTGRES_PORT:-5432}}

# Features
ML_INFERENCE_ENABLED=true
REAL_TIME_UPDATES=true
BATCH_PROCESSING=true
```

---

## 🧪 Installation Verification

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "Terrafusion Health Check"
echo "======================="

# Check services
echo "Checking services..."
systemctl is-active postgresql && echo "✓ PostgreSQL running" || echo "✗ PostgreSQL not running"
systemctl is-active redis && echo "✓ Redis running" || echo "✗ Redis not running"
systemctl is-active nginx && echo "✓ Nginx running" || echo "✗ Nginx not running"
systemctl is-active terrafusion-api && echo "✓ Terrafusion API running" || echo "✗ Terrafusion API not running"

# Check database connection
psql -h localhost -U terrafusion -d terrafusion -c "SELECT 1;" &>/dev/null && echo "✓ Database connection OK" || echo "✗ Database connection failed"

# Check Redis connection
redis-cli ping &>/dev/null && echo "✓ Redis connection OK" || echo "✗ Redis connection failed"

# Check API endpoint
curl -s http://localhost:\${{TF_REDIS_PORT:-6379}}/health | grep -q "healthy" && echo "✓ API health check OK" || echo "✗ API health check failed"

# Check web interface
curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200" && echo "✓ Web interface OK" || echo "✗ Web interface failed"

echo "======================="
echo "Health check complete"
```

### Performance Test

```bash
#!/bin/bash
# performance-test.sh

echo "Running performance tests..."

# API response time
echo "Testing API response time..."
curl -w "Response time: %{time_total}s\n" -s -o /dev/null http://localhost:\${{TF_REDIS_PORT:-6379}}/api/v1/properties/search?limit=10

# Database query performance
echo "Testing database performance..."
psql -h localhost -U terrafusion -d terrafusion -c "\timing" -c "SELECT COUNT(*) FROM properties;"

# Memory usage
echo "Memory usage:"
free -h

# Disk usage
echo "Disk usage:"
df -h /opt/terrafusion

# Load average
echo "Load average:"
uptime
```

---

## 🔧 Post-Installation Tasks

### 1. Create Admin User

```bash
# Using Terrafusion CLI
./terrafusion-cli user create \
  --email admin@your-domain.com \
  --password secure_password \
  --role admin \
  --verified

# Or using SQL
psql -h localhost -U terrafusion -d terrafusion << EOF
INSERT INTO users (id, email, password_hash, role, verified, created_at)
VALUES (
  gen_random_uuid(),
  'admin@your-domain.com',
  crypt('secure_password', gen_salt('bf')),
  'admin',
  true,
  NOW()
);
EOF
```

### 2. Configure Backup

```bash
#!/bin/bash
# /opt/terrafusion/scripts/backup.sh

# Database backup
pg_dump -h localhost -U terrafusion terrafusion > /backup/terrafusion-$(date +%Y%m%d_%H%M%S).sql

# File backup
tar -czf /backup/terrafusion-files-$(date +%Y%m%d_%H%M%S).tar.gz /opt/terrafusion/uploads

# Cleanup old backups (keep 30 days)
find /backup -name "terrafusion-*" -mtime +30 -delete

# Add to crontab
# 0 2 * * * /opt/terrafusion/scripts/backup.sh
```

### 3. Setup Monitoring

```bash
# Install monitoring agent
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.0/node_exporter-1.6.0.linux-amd64.tar.gz
tar xvf node_exporter-1.6.0.linux-amd64.tar.gz
sudo mv node_exporter-1.6.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

---

## 📊 Next Steps

After successful installation:

1. **[Configuration Guide](./configuration.md)** - Detailed configuration
   options
2. **[Monitoring Setup](./monitoring.md)** - Set up comprehensive monitoring
3. **[Backup & Recovery](./backup-recovery.md)** - Configure backup procedures
4. **[Performance Tuning](./performance-tuning.md)** - Optimize for your
   workload
5. **[Security Hardening](../security/best-practices.md)** - Secure your
   installation

## 🆘 Troubleshooting

Common installation issues and solutions are documented in the
[Troubleshooting Guide](./troubleshooting.md).

For additional support:

- **Email**: support@terrafusion.ai
- **Documentation**: https://docs.terrafusion.ai
- **Community**: https://community.terrafusion.ai

---

_Installation guide last updated: August 3, 2025_
