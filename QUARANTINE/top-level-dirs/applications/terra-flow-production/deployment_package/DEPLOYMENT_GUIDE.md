# GeoAssessmentPro Deployment Guide

This guide provides detailed instructions for deploying GeoAssessmentPro to a production environment. Follow these steps carefully to ensure a successful deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Preparation](#server-preparation)
3. [Database Setup](#database-setup)
4. [Application Installation](#application-installation)
5. [Configuration](#configuration)
6. [Database Migration](#database-migration)
7. [Web Server Configuration](#web-server-configuration)
8. [Service Configuration](#service-configuration)
9. [Initial Setup](#initial-setup)
10. [Verification](#verification)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

Before beginning the deployment, ensure you have:

- Administrator access to the target server
- PostgreSQL database server with PostGIS extensions
- Domain name configured in DNS (if applicable)
- SSL certificates (if using HTTPS)
- Network access configured (firewall rules, etc.)
- Backup strategy in place

## Server Preparation

### System Requirements

- Ubuntu 22.04 LTS or equivalent
- Python 3.9+
- PostgreSQL 14+ with PostGIS 3.2+
- 4+ CPU cores, 8+ GB RAM, 100+ GB storage
- Nginx or Apache web server

### Required Packages

Install the required system packages:

```bash
# Update package lists
sudo apt update

# Install required packages
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib postgis \
                    nginx supervisor git curl build-essential libpq-dev gdal-bin libgdal-dev
```

### Create Service User

Create a dedicated user for running the application:

```bash
sudo useradd -m -s /bin/bash geoapp
sudo usermod -aG sudo geoapp
```

## Database Setup

### PostgreSQL Configuration

1. Install PostgreSQL and PostGIS:

```bash
sudo apt install -y postgresql postgresql-contrib postgis postgresql-14-postgis-3
```

2. Configure PostgreSQL for production:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add/modify these settings:

```
max_connections = 100
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 20MB
maintenance_work_mem = 512MB
random_page_cost = 1.1
effective_io_concurrency = 200
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
```

3. Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Create Database

1. Switch to PostgreSQL user:

```bash
sudo -i -u postgres
```

2. Create database and user:

```bash
createuser --interactive --pwprompt geoapp
# Enter password when prompted

createdb --owner=geoapp geoassessment
```

3. Enable PostGIS extension:

```bash
psql -d geoassessment -c "CREATE EXTENSION postgis;"
psql -d geoassessment -c "CREATE EXTENSION postgis_topology;"
```

4. Exit PostgreSQL user:

```bash
exit
```

## Application Installation

### Directory Setup

1. Create application directory:

```bash
sudo mkdir -p /opt/geoassessmentpro
sudo chown geoapp:geoapp /opt/geoassessmentpro
```

2. Switch to application user:

```bash
sudo su - geoapp
```

3. Create application directories:

```bash
mkdir -p /opt/geoassessmentpro/{app,config,logs,uploads,backups}
```

### Deploy Application Files

1. Extract the deployment package:

```bash
unzip GeoAssessmentPro_Deployment_*.zip -d /tmp/geoapp_deploy
cp -r /tmp/geoapp_deploy/* /opt/geoassessmentpro/app/
```

2. Create Python virtual environment:

```bash
cd /opt/geoassessmentpro
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r app/requirements.txt
```

## Configuration

### Environment Variables

1. Create environment file:

```bash
cp /opt/geoassessmentpro/app/config/.env.template /opt/geoassessmentpro/config/.env
nano /opt/geoassessmentpro/config/.env
```

2. Configure environment variables:

```
# Database Configuration
DATABASE_URL=postgresql://geoapp:your_password@localhost:5432/geoassessment

# Supabase Configuration (if applicable)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Security Configuration
SESSION_SECRET=generate_a_strong_random_secret_here

# Deployment Configuration
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
```

Generate a secure random secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### File Permissions

Set appropriate file permissions:

```bash
chmod -R 750 /opt/geoassessmentpro/app
chmod -R 770 /opt/geoassessmentpro/logs
chmod -R 770 /opt/geoassessmentpro/uploads
```

## Database Migration

Run database migrations to set up the schema:

```bash
cd /opt/geoassessmentpro/app
export FLASK_APP=main.py
source /opt/geoassessmentpro/config/.env
/opt/geoassessmentpro/venv/bin/flask db upgrade
```

Initialize roles and basic data:

```bash
/opt/geoassessmentpro/venv/bin/python populate_roles.py
```

## Web Server Configuration

### Nginx Configuration

1. Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/geoassessmentpro
```

2. Add the following configuration (adjust as needed):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
    
    # Static files
    location /static {
        alias /opt/geoassessmentpro/app/static;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # Uploads
    location /uploads {
        alias /opt/geoassessmentpro/uploads;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # Logging
    access_log /var/log/nginx/geoassessmentpro_access.log;
    error_log /var/log/nginx/geoassessmentpro_error.log;
}
```

3. Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/geoassessmentpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Service Configuration

### Supervisor Configuration

1. Create supervisor configuration:

```bash
sudo nano /etc/supervisor/conf.d/geoassessmentpro.conf
```

2. Add the following configuration:

```ini
[program:geoassessmentpro]
command=/opt/geoassessmentpro/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 --timeout 120 main:app
directory=/opt/geoassessmentpro/app
user=geoapp
group=geoapp
environment=PATH="/opt/geoassessmentpro/venv/bin",PYTHONPATH="/opt/geoassessmentpro/app"
autostart=true
autorestart=true
stdout_logfile=/opt/geoassessmentpro/logs/gunicorn_stdout.log
stderr_logfile=/opt/geoassessmentpro/logs/gunicorn_stderr.log
stopasgroup=true
killasgroup=true

[program:geoassessmentpro_scheduler]
command=/opt/geoassessmentpro/venv/bin/python scheduler.py
directory=/opt/geoassessmentpro/app
user=geoapp
group=geoapp
environment=PATH="/opt/geoassessmentpro/venv/bin",PYTHONPATH="/opt/geoassessmentpro/app"
autostart=true
autorestart=true
stdout_logfile=/opt/geoassessmentpro/logs/scheduler_stdout.log
stderr_logfile=/opt/geoassessmentpro/logs/scheduler_stderr.log
stopasgroup=true
killasgroup=true
```

3. Update supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

### Systemd Service (Alternative)

If you prefer using systemd instead of supervisor:

1. Create systemd service file:

```bash
sudo nano /etc/systemd/system/geoassessmentpro.service
```

2. Add the following configuration:

```ini
[Unit]
Description=GeoAssessmentPro Application
After=network.target postgresql.service

[Service]
User=geoapp
Group=geoapp
WorkingDirectory=/opt/geoassessmentpro/app
Environment="PATH=/opt/geoassessmentpro/venv/bin"
EnvironmentFile=/opt/geoassessmentpro/config/.env
ExecStart=/opt/geoassessmentpro/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 --timeout 120 main:app
Restart=always
RestartSec=5
SyslogIdentifier=geoassessmentpro

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable geoassessmentpro
sudo systemctl start geoassessmentpro
sudo systemctl status geoassessmentpro
```

## Initial Setup

### Create Admin User

1. Create an admin user:

```bash
cd /opt/geoassessmentpro/app
source /opt/geoassessmentpro/venv/bin/activate
export FLASK_APP=main.py
flask create-admin-user
```

### Schedule Backups

Set up a cron job to run backups:

```bash
sudo crontab -e
```

Add the following line:

```
0 2 * * * /opt/geoassessmentpro/app/scripts/backup.sh >> /opt/geoassessmentpro/logs/backup.log 2>&1
```

This will run the backup script daily at 2:00 AM.

## Verification

### Deployment Verification

Run the deployment verification script:

```bash
cd /opt/geoassessmentpro/app
python deployment_verification.py
```

### Manual Verification

1. Check that the application is running:

```bash
sudo supervisorctl status geoassessmentpro
# or
sudo systemctl status geoassessmentpro
```

2. Check that Nginx is running:

```bash
sudo systemctl status nginx
```

3. Check logs for errors:

```bash
tail -n 50 /opt/geoassessmentpro/logs/gunicorn_stderr.log
```

4. Access the application in a web browser:

```
https://your-domain.com
```

5. Verify key functionality:
   - Login works
   - Map visualization renders correctly
   - Data queries return results
   - File uploads work
   - User roles are applied correctly

## Backup and Recovery

### Regular Backups

The backup script is configured to run daily via cron. Backups are stored in:

```
/opt/geoassessmentpro/backups
```

### Manual Backup

To perform a manual backup:

```bash
cd /opt/geoassessmentpro/app
./scripts/backup.sh
```

### Recovery Procedure

To restore from a backup:

1. Stop the application:

```bash
sudo supervisorctl stop geoassessmentpro
# or
sudo systemctl stop geoassessmentpro
```

2. Restore the database:

```bash
gunzip -c /opt/geoassessmentpro/backups/geoassessmentpro_YYYY-MM-DD_HH-MM-SS.sql.gz | sudo -u postgres psql geoassessment
```

3. Start the application:

```bash
sudo supervisorctl start geoassessmentpro
# or
sudo systemctl start geoassessmentpro
```

## Troubleshooting

### Application Won't Start

1. Check logs:

```bash
tail -n 100 /opt/geoassessmentpro/logs/gunicorn_stderr.log
```

2. Verify environment variables:

```bash
cat /opt/geoassessmentpro/config/.env
```

3. Check database connection:

```bash
psql -U geoapp -h localhost -d geoassessment
```

### Database Migration Errors

1. Check the database migration logs:

```bash
cd /opt/geoassessmentpro/app
export FLASK_APP=main.py
flask db history
```

2. Reset the migration (if necessary):

```bash
flask db stamp head
flask db migrate
flask db upgrade
```

### Web Server Issues

1. Check Nginx configuration:

```bash
sudo nginx -t
```

2. Check Nginx logs:

```bash
sudo tail -n 100 /var/log/nginx/geoassessmentpro_error.log
```

3. Check if the port is in use:

```bash
sudo netstat -tlnp | grep 5000
```

### Permission Issues

1. Check file ownership:

```bash
ls -la /opt/geoassessmentpro
```

2. Set correct permissions:

```bash
sudo chown -R geoapp:geoapp /opt/geoassessmentpro
chmod -R 750 /opt/geoassessmentpro/app
chmod -R 770 /opt/geoassessmentpro/logs
chmod -R 770 /opt/geoassessmentpro/uploads
```

### Common Error Messages

- **"Unable to connect to database"**: Check the DATABASE_URL in the .env file and ensure PostgreSQL is running.
- **"Module not found" errors**: Ensure all dependencies are installed in the virtual environment.
- **"Permission denied" errors**: Check file and directory permissions.
- **"Address already in use" errors**: Another process is using port 5000, either stop it or configure the application to use a different port.

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Supervisor Documentation](http://supervisord.org/)