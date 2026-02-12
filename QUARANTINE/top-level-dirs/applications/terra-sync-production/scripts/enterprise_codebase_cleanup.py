#!/usr/bin/env python3
"""
Enterprise Codebase Cleanup and Organization Tool
TerraFusion Platform - Production Ready Deployment
"""

import os
import shutil
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set
import subprocess

class EnterpriseCodebaseManager:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.setup_logging()
        self.cleanup_report = {
            "timestamp": datetime.now().isoformat(),
            "files_archived": [],
            "directories_cleaned": [],
            "dependencies_updated": [],
            "security_improvements": [],
            "performance_optimizations": []
        }
    
    def setup_logging(self):
        log_dir = self.project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / "enterprise_cleanup.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def identify_unused_files(self) -> Dict[str, List[str]]:
        """Identify files that should be archived"""
        unused_patterns = {
            "development_scripts": [
                "test_*.py", "debug_*.py", "fix_*.py", "run_*.py",
                "isolated_*.py", "quick_*.py", "direct_*.py"
            ],
            "legacy_configs": [
                "*.old", "*.bak", "*.tmp", "*_legacy.*"
            ],
            "duplicate_files": [],
            "experimental_code": [
                "*_experimental.*", "*_demo.*", "*_prototype.*"
            ]
        }
        
        files_to_archive = {"development_scripts": [], "legacy_configs": [], 
                           "duplicate_files": [], "experimental_code": []}
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip already archived directories
            if "archive" in Path(root).parts:
                continue
                
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.project_root)
                
                # Check against patterns
                for category, patterns in unused_patterns.items():
                    for pattern in patterns:
                        if file_path.match(pattern):
                            files_to_archive[category].append(str(relative_path))
                            break
        
        return files_to_archive
    
    def create_production_env_template(self):
        """Create production environment configuration"""
        env_template = """# TerraFusion Enterprise Production Configuration
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/terrafusion_prod
PGHOST=localhost
PGPORT=5432
PGUSER=terrafusion_user
PGPASSWORD=secure_password_here
PGDATABASE=terrafusion_prod

# Security Configuration
SESSION_SECRET=your-super-secure-session-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# API Keys and External Services
OPENAI_API_KEY=your-openai-api-key-here
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# Application Configuration
FLASK_ENV=production
FLASK_DEBUG=false
PORT=5000
HOST=0.0.0.0

# Monitoring and Logging
LOG_LEVEL=INFO
MONITORING_ENABLED=true
METRICS_ENDPOINT=/metrics

# SSL Configuration
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
FORCE_HTTPS=true

# Performance Tuning
MAX_WORKERS=4
WORKER_TIMEOUT=30
KEEPALIVE=5

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
"""
        
        env_file = self.project_root / ".env.production.template"
        with open(env_file, 'w') as f:
            f.write(env_template)
        
        self.logger.info("Created production environment template")
        self.cleanup_report["security_improvements"].append("Production .env template created")
    
    def organize_source_structure(self):
        """Organize source code into proper structure"""
        # Core directories that should exist in production
        production_dirs = [
            "src/core",
            "src/api", 
            "src/services",
            "src/utils",
            "templates/production",
            "static/production",
            "config/production",
            "deployment/production",
            "docs/production",
            "security/production"
        ]
        
        for dir_path in production_dirs:
            full_path = self.project_root / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            
            # Create __init__.py for Python packages
            if dir_path.startswith("src/"):
                init_file = full_path / "__init__.py"
                if not init_file.exists():
                    init_file.write_text("")
        
        self.logger.info("Organized production source structure")
    
    def clean_python_cache(self):
        """Remove Python cache files and temporary files"""
        cache_patterns = ["__pycache__", "*.pyc", "*.pyo", ".pytest_cache", ".coverage"]
        
        for root, dirs, files in os.walk(self.project_root):
            # Remove cache directories
            for dir_name in dirs[:]:
                if dir_name in ["__pycache__", ".pytest_cache"]:
                    cache_dir = Path(root) / dir_name
                    shutil.rmtree(cache_dir, ignore_errors=True)
                    dirs.remove(dir_name)
                    self.cleanup_report["directories_cleaned"].append(str(cache_dir))
            
            # Remove cache files
            for file_name in files:
                if any(file_name.endswith(pattern.replace("*", "")) for pattern in cache_patterns if not pattern.startswith(".")):
                    cache_file = Path(root) / file_name
                    cache_file.unlink(missing_ok=True)
                    self.cleanup_report["files_archived"].append(str(cache_file))
    
    def optimize_dependencies(self):
        """Optimize and secure dependencies"""
        requirements_content = """# TerraFusion Enterprise Production Dependencies
# Web Framework
flask==2.3.3
flask-sqlalchemy==3.0.5
flask-login==0.6.3
gunicorn==21.2.0
werkzeug==2.3.7

# Database
psycopg2-binary==2.9.7
sqlalchemy==2.0.21

# Security
pyjwt==2.8.0
cryptography==41.0.4
python-dotenv==1.0.0

# Data Processing
pandas==2.1.1
numpy==1.24.3
shapely==2.0.1

# HTTP Clients
requests==2.31.0
aiohttp==3.8.5

# API Framework
fastapi==0.103.1
uvicorn==0.23.2

# Monitoring and Logging
prometheus-client==0.17.1
structlog==23.1.0

# Development Tools (Remove in production)
# pytest==7.4.2
# black==23.7.0
# flake8==6.0.0
"""
        
        req_file = self.project_root / "requirements.production.txt"
        with open(req_file, 'w') as f:
            f.write(requirements_content)
        
        self.cleanup_report["dependencies_updated"].append("Production requirements created")
        self.logger.info("Created optimized production requirements")
    
    def create_deployment_scripts(self):
        """Create enterprise deployment scripts"""
        deploy_script = """#!/bin/bash
# TerraFusion Enterprise Deployment Script
set -e

echo "🚀 Starting TerraFusion Enterprise Deployment..."

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "Python 3 required but not installed."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL client required but not installed."; exit 1; }

# Environment setup
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from template..."
    cp .env.production.template .env
    echo "✅ Please configure .env file with your production values"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Database setup
echo "🗄️  Setting up database..."
python3 -c "
import os
import psycopg2
from urllib.parse import urlparse

try:
    url = urlparse(os.environ['DATABASE_URL'])
    conn = psycopg2.connect(
        host=url.hostname,
        port=url.port,
        user=url.username,
        password=url.password,
        database=url.path[1:]
    )
    print('✅ Database connection successful')
    conn.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Install dependencies
echo "📦 Installing production dependencies..."
pip3 install -r requirements.production.txt

# Security check
echo "🔒 Running security validation..."
python3 scripts/security_validation.py

# Database migrations
echo "🔄 Running database migrations..."
python3 -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('✅ Database tables created')
"

# SSL certificate check
if [ ! -f "security/certificates/cert.pem" ] || [ ! -f "security/certificates/key.pem" ]; then
    echo "⚠️  SSL certificates not found. HTTPS will be disabled."
fi

# Start services
echo "🎯 Starting TerraFusion services..."
gunicorn --bind 0.0.0.0:${PORT:-5000} --workers ${MAX_WORKERS:-4} --timeout ${WORKER_TIMEOUT:-30} main:app &
MAIN_PID=$!

# Health check
sleep 5
if curl -f http://localhost:${PORT:-5000}/health >/dev/null 2>&1; then
    echo "✅ TerraFusion Enterprise deployed successfully!"
    echo "🌐 Access your application at: http://localhost:${PORT:-5000}"
else
    echo "❌ Deployment failed - health check unsuccessful"
    kill $MAIN_PID
    exit 1
fi

echo "📊 Deployment complete. Service PID: $MAIN_PID"
"""
        
        deploy_file = self.project_root / "scripts" / "deploy_production.sh"
        deploy_file.parent.mkdir(exist_ok=True)
        with open(deploy_file, 'w') as f:
            f.write(deploy_script)
        deploy_file.chmod(0o755)
        
        self.logger.info("Created production deployment script")
    
    def create_security_validation(self):
        """Create security validation script"""
        security_script = """#!/usr/bin/env python3
import os
import sys
import json
from pathlib import Path

def validate_environment():
    required_vars = [
        'DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET'
    ]
    
    missing = []
    for var in required_vars:
        if not os.environ.get(var):
            missing.append(var)
    
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

def check_file_permissions():
    sensitive_files = ['.env', 'config/database.json']
    issues = []
    
    for file_path in sensitive_files:
        if os.path.exists(file_path):
            stat = os.stat(file_path)
            if stat.st_mode & 0o077:
                issues.append(f"{file_path} has overly permissive permissions")
    
    if issues:
        print(f"⚠️  Permission issues: {'; '.join(issues)}")
        return False
    
    print("✅ File permissions are secure")
    return True

def validate_ssl_config():
    cert_path = os.environ.get('SSL_CERT_PATH', 'security/certificates/cert.pem')
    key_path = os.environ.get('SSL_KEY_PATH', 'security/certificates/key.pem')
    
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        print("⚠️  SSL certificates not found - HTTPS disabled")
        return False
    
    print("✅ SSL certificates configured")
    return True

def main():
    print("🔒 TerraFusion Security Validation")
    print("=" * 40)
    
    checks = [
        validate_environment,
        check_file_permissions,
        validate_ssl_config
    ]
    
    passed = 0
    for check in checks:
        if check():
            passed += 1
    
    print(f"\\n📊 Security Check Results: {passed}/{len(checks)} passed")
    
    if passed == len(checks):
        print("✅ Security validation successful")
        sys.exit(0)
    else:
        print("❌ Security validation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
"""
        
        security_file = self.project_root / "scripts" / "security_validation.py"
        with open(security_file, 'w') as f:
            f.write(security_script)
        security_file.chmod(0o755)
        
        self.logger.info("Created security validation script")
    
    def archive_unused_files(self):
        """Archive unused files systematically"""
        unused_files = self.identify_unused_files()
        archive_base = self.project_root / "archive" / "cleanup_session" / datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for category, files in unused_files.items():
            if not files:
                continue
                
            category_dir = archive_base / category
            category_dir.mkdir(parents=True, exist_ok=True)
            
            for file_path in files:
                source = self.project_root / file_path
                if source.exists():
                    dest = category_dir / source.name
                    try:
                        shutil.move(str(source), str(dest))
                        self.cleanup_report["files_archived"].append(str(file_path))
                        self.logger.info(f"Archived: {file_path}")
                    except Exception as e:
                        self.logger.error(f"Failed to archive {file_path}: {e}")
    
    def generate_cleanup_report(self):
        """Generate comprehensive cleanup report"""
        report_file = self.project_root / "enterprise_cleanup_report.json"
        with open(report_file, 'w') as f:
            json.dump(self.cleanup_report, f, indent=2)
        
        # Generate human-readable summary
        summary = f"""
# TerraFusion Enterprise Cleanup Report
Generated: {self.cleanup_report['timestamp']}

## Summary
- Files Archived: {len(self.cleanup_report['files_archived'])}
- Directories Cleaned: {len(self.cleanup_report['directories_cleaned'])}
- Security Improvements: {len(self.cleanup_report['security_improvements'])}
- Performance Optimizations: {len(self.cleanup_report['performance_optimizations'])}

## Next Steps
1. Review and configure .env.production.template
2. Run security validation: python3 scripts/security_validation.py
3. Deploy with: bash scripts/deploy_production.sh
4. Monitor logs in logs/ directory
5. Set up automated backups
"""
        
        summary_file = self.project_root / "CLEANUP_SUMMARY.md"
        with open(summary_file, 'w') as f:
            f.write(summary)
        
        self.logger.info("Generated cleanup report and summary")
    
    def run_full_cleanup(self):
        """Execute complete enterprise cleanup process"""
        self.logger.info("Starting enterprise codebase cleanup...")
        
        try:
            # Step 1: Clean Python cache
            self.clean_python_cache()
            
            # Step 2: Organize source structure
            self.organize_source_structure()
            
            # Step 3: Create production configurations
            self.create_production_env_template()
            self.optimize_dependencies()
            
            # Step 4: Create deployment infrastructure
            self.create_deployment_scripts()
            self.create_security_validation()
            
            # Step 5: Archive unused files
            self.archive_unused_files()
            
            # Step 6: Generate reports
            self.generate_cleanup_report()
            
            self.logger.info("Enterprise cleanup completed successfully!")
            
        except Exception as e:
            self.logger.error(f"Cleanup failed: {e}")
            raise

if __name__ == "__main__":
    manager = EnterpriseCodebaseManager()
    manager.run_full_cleanup()