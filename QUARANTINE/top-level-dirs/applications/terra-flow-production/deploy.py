#!/usr/bin/env python3
"""
Deployment script for GeoAssessmentPro
This script packages the application for deployment, creating all necessary
configuration files and organizing the deployment structure.
"""
import os
import sys
import shutil
import subprocess
import logging
import json
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('deployment.log')
    ]
)
logger = logging.getLogger('deploy')

# Configuration
DEPLOYMENT_DIR = 'deployment_package'
EXCLUDE_DIRS = [
    '__pycache__', 
    'venv', 
    '.git', 
    'node_modules', 
    'tests',
    'deployment_package'
]
EXCLUDE_FILES = [
    '.git*',
    '*.pyc',
    '*.pyo',
    '.DS_Store',
    '.env.local',
    'deployment.log'
]

def create_deployment_directory():
    """Create the deployment directory structure"""
    logger.info("Creating deployment directory structure")
    
    if os.path.exists(DEPLOYMENT_DIR):
        logger.info(f"Removing existing {DEPLOYMENT_DIR} directory")
        shutil.rmtree(DEPLOYMENT_DIR)
    
    os.mkdir(DEPLOYMENT_DIR)
    os.mkdir(os.path.join(DEPLOYMENT_DIR, 'config'))
    os.mkdir(os.path.join(DEPLOYMENT_DIR, 'logs'))
    os.mkdir(os.path.join(DEPLOYMENT_DIR, 'scripts'))
    
    logger.info("Deployment directory structure created")

def copy_application_files():
    """Copy application files to deployment directory"""
    logger.info("Copying application files")
    
    def should_ignore(dir_name, file_list):
        ignored = []
        for file in file_list:
            # Skip directories we want to exclude
            if file in EXCLUDE_DIRS:
                ignored.append(file)
                continue
                
            # Skip files we want to exclude
            for pattern in EXCLUDE_FILES:
                if pattern.startswith('*') and file.endswith(pattern[1:]):
                    ignored.append(file)
                    break
                elif pattern == file:
                    ignored.append(file)
                    break
        
        return ignored
    
    # Copy the application files, excluding test and development specific files
    shutil.copytree(
        '.', 
        DEPLOYMENT_DIR, 
        ignore=should_ignore,
        dirs_exist_ok=True
    )
    
    logger.info("Application files copied")

def create_deployment_configurations():
    """Create deployment configuration files"""
    logger.info("Creating deployment configuration files")
    
    # Create environment template file
    env_template = """# GeoAssessmentPro Environment Configuration
# Database Configuration
DATABASE_URL=postgresql://user:password@hostname:5432/database
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
# Security Configuration
SESSION_SECRET=generate_a_strong_random_secret
# Deployment Configuration
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
"""
    
    with open(os.path.join(DEPLOYMENT_DIR, 'config', '.env.template'), 'w') as f:
        f.write(env_template)
    
    # Create nginx configuration template
    nginx_conf = """server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static {
        alias /path/to/geoassessmentpro/static;
        expires 30d;
    }
}
"""
    
    with open(os.path.join(DEPLOYMENT_DIR, 'config', 'nginx.conf.template'), 'w') as f:
        f.write(nginx_conf)
    
    # Create systemd service template
    systemd_service = """[Unit]
Description=GeoAssessmentPro Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/geoassessmentpro
Environment="PATH=/path/to/geoassessmentpro/venv/bin"
EnvironmentFile=/path/to/geoassessmentpro/config/.env
ExecStart=/path/to/geoassessmentpro/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:5000 main:app
Restart=always

[Install]
WantedBy=multi-user.target
"""
    
    with open(os.path.join(DEPLOYMENT_DIR, 'config', 'geoassessmentpro.service.template'), 'w') as f:
        f.write(systemd_service)
    
    # Create deployment README
    readme = """# GeoAssessmentPro Deployment

This directory contains the deployment package for GeoAssessmentPro.

## Deployment Steps

1. Copy the deployment package to the target server
2. Create a Python virtual environment: `python -m venv venv`
3. Activate the virtual environment: `source venv/bin/activate`
4. Install the requirements: `pip install -r requirements.txt`
5. Configure the environment:
   - Copy `config/.env.template` to `config/.env`
   - Edit `config/.env` with your production settings
6. Set up the database:
   - Run database migrations: `flask db upgrade`
   - Initialize roles: `python populate_roles.py`
7. Configure NGINX:
   - Copy `config/nginx.conf.template` to `/etc/nginx/sites-available/geoassessmentpro`
   - Edit the configuration with your domain and paths
   - Enable the site: `ln -s /etc/nginx/sites-available/geoassessmentpro /etc/nginx/sites-enabled/`
8. Configure systemd:
   - Copy `config/geoassessmentpro.service.template` to `/etc/systemd/system/geoassessmentpro.service`
   - Edit the service file with your paths
   - Enable the service: `systemctl enable geoassessmentpro`
   - Start the service: `systemctl start geoassessmentpro`
9. Verify the deployment:
   - Check the logs: `journalctl -u geoassessmentpro`
   - Visit your domain to ensure the site is running

## Directory Structure

- `config/` - Configuration templates
- `logs/` - Log directory for the application
- `scripts/` - Helper scripts for deployment and management
- `static/` - Static files (CSS, JS, images)
- `templates/` - HTML templates
- `main.py` - The main application entry point

## Required External Services

- PostgreSQL database with PostGIS extensions
- Supabase account (if using Supabase features)
- SMTP server for email notifications

## Maintenance

- Backup the database regularly
- Monitor the logs in `logs/` and via `journalctl -u geoassessmentpro`
- Update the application by deploying a new version and restarting the service

For more information, refer to the full documentation.
"""
    
    with open(os.path.join(DEPLOYMENT_DIR, 'README.md'), 'w') as f:
        f.write(readme)
    
    # Create deployment scripts
    # Backup script
    backup_script = """#!/bin/bash
# Database backup script for GeoAssessmentPro
# This script should be run as a cron job to create regular backups

# Load environment variables
source /path/to/geoassessmentpro/config/.env

# Configuration
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/geoassessmentpro_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Extract database connection info from DATABASE_URL
DB_URL=$DATABASE_URL
DB_USER=$(echo $DB_URL | sed -r 's/.*:\/\/([^:]+):.*/\\1/')
DB_PASS=$(echo $DB_URL | sed -r 's/.*:\/\/[^:]+:([^@]+).*/\\1/')
DB_HOST=$(echo $DB_URL | sed -r 's/.*@([^:]+):.*/\\1/')
DB_PORT=$(echo $DB_URL | sed -r 's/.*:([0-9]+)\/.*/\\1/')
DB_NAME=$(echo $DB_URL | sed -r 's/.*\/([^?]+).*/\\1/')

# Create backup
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -b -v -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "geoassessmentpro_*.sql.gz" -type f -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
"""
    
    with open(os.path.join(DEPLOYMENT_DIR, 'scripts', 'backup.sh'), 'w') as f:
        f.write(backup_script)
    os.chmod(os.path.join(DEPLOYMENT_DIR, 'scripts', 'backup.sh'), 0o755)
    
    # Update script
    update_script = """#!/bin/bash
# Update script for GeoAssessmentPro
# This script updates the application from a new deployment package

# Configuration
APP_DIR="/path/to/geoassessmentpro"
BACKUP_DIR="$APP_DIR/backup"
DEPLOYMENT_PACKAGE=$1

# Validate input
if [ -z "$DEPLOYMENT_PACKAGE" ]; then
    echo "Usage: $0 /path/to/deployment_package.zip"
    exit 1
fi

if [ ! -f "$DEPLOYMENT_PACKAGE" ]; then
    echo "Deployment package not found: $DEPLOYMENT_PACKAGE"
    exit 1
fi

# Create backup of current application
echo "Creating backup of current application..."
mkdir -p $BACKUP_DIR
BACKUP_DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/app_backup_$BACKUP_DATE.tar.gz"
tar -czf $BACKUP_FILE -C $APP_DIR --exclude="./venv" --exclude="./backup" .

# Stop the application
echo "Stopping application..."
sudo systemctl stop geoassessmentpro

# Extract the new deployment package
echo "Extracting new deployment package..."
TMP_DIR=$(mktemp -d)
unzip -q $DEPLOYMENT_PACKAGE -d $TMP_DIR

# Update application files
echo "Updating application files..."
rsync -av --exclude="venv" --exclude="backup" --exclude="config/.env" $TMP_DIR/ $APP_DIR/

# Update dependencies
echo "Updating dependencies..."
source $APP_DIR/venv/bin/activate
pip install -r $APP_DIR/requirements.txt

# Apply database migrations
echo "Applying database migrations..."
cd $APP_DIR
flask db upgrade

# Restart application
echo "Starting application..."
sudo systemctl start geoassessmentpro

# Clean up
echo "Cleaning up..."
rm -rf $TMP_DIR

echo "Update completed successfully!"
"""
    
    with open(os.path.join(DEPLOYMENT_DIR, 'scripts', 'update.sh'), 'w') as f:
        f.write(update_script)
    os.chmod(os.path.join(DEPLOYMENT_DIR, 'scripts', 'update.sh'), 0o755)
    
    logger.info("Deployment configuration files created")

def create_requirements_file():
    """Create a requirements.txt file for deployment"""
    logger.info("Creating requirements.txt file")
    
    # Run pip freeze to get the current dependencies
    try:
        with open(os.path.join(DEPLOYMENT_DIR, 'requirements.txt'), 'w') as f:
            subprocess.run(
                ['pip', 'freeze'], 
                stdout=f, 
                check=True
            )
        logger.info("requirements.txt file created")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create requirements.txt: {e}")
        sys.exit(1)

def create_deployment_manifest():
    """Create a deployment manifest file with version info"""
    logger.info("Creating deployment manifest")
    
    manifest = {
        "name": "GeoAssessmentPro",
        "version": "1.0.0",
        "description": "GeoAssessmentPro - Property Assessment Management System",
        "deployment_date": datetime.now().isoformat(),
        "python_version": sys.version,
    }
    
    with open(os.path.join(DEPLOYMENT_DIR, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    
    logger.info("Deployment manifest created")

def create_deployment_package():
    """Create a zip file of the deployment package"""
    logger.info("Creating deployment zip package")
    
    # Create a zip file of the deployment directory
    deployment_zip = f"GeoAssessmentPro_Deployment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    shutil.make_archive(
        deployment_zip.replace('.zip', ''),
        'zip',
        '.',
        DEPLOYMENT_DIR
    )
    
    logger.info(f"Deployment package created: {deployment_zip}")
    return deployment_zip

def main():
    """Main deployment function"""
    logger.info("Starting deployment process")
    
    try:
        create_deployment_directory()
        copy_application_files()
        create_deployment_configurations()
        create_requirements_file()
        create_deployment_manifest()
        deployment_zip = create_deployment_package()
        
        logger.info("Deployment process completed successfully")
        logger.info(f"Deployment package: {deployment_zip}")
        
        print(f"\nDeployment package created successfully: {deployment_zip}")
        print("The package contains everything needed to deploy GeoAssessmentPro.")
        print("Follow the instructions in the README.md file inside the package.")
        
    except Exception as e:
        logger.error(f"Deployment failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()