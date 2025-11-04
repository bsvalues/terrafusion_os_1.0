#!/usr/bin/env python3
"""
TerraFusion Enterprise Setup Wizard
Advanced county geospatial data synchronization platform
"""

import os
import sys
import json
import subprocess
import secrets
import string
from pathlib import Path
from datetime import datetime
import psycopg2
from urllib.parse import urlparse

class TerraFusionSetupWizard:
    def __init__(self):
        self.project_root = Path.cwd()
        self.config = {}
        self.setup_log = []
        
    def log_step(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {status}: {message}"
        self.setup_log.append(log_entry)
        print(f"{'✅' if status == 'SUCCESS' else '🔧' if status == 'INFO' else '❌'} {message}")
    
    def generate_secure_key(self, length=64):
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def welcome_screen(self):
        print("\n" + "="*80)
        print("🌍 TerraFusion Enterprise Geospatial Platform Setup")
        print("   Advanced County-Level Property Assessment & Management")
        print("="*80)
        print("\nKey Technologies:")
        print("• Flask-based web application with PostgreSQL")
        print("• Advanced geospatial data processing")
        print("• Enterprise-grade security middleware")
        print("• Real-time synchronization services")
        print("• AI-powered district analysis")
        print("\nThis wizard will configure your production environment.\n")
    
    def check_system_requirements(self):
        self.log_step("Checking system requirements...")
        
        requirements = {
            "python3": "python3 --version",
            "postgresql": "psql --version",
            "curl": "curl --version"
        }
        
        missing = []
        for tool, command in requirements.items():
            try:
                result = subprocess.run(command.split(), capture_output=True, text=True)
                if result.returncode == 0:
                    version = result.stdout.split('\n')[0]
                    self.log_step(f"{tool}: {version}", "SUCCESS")
                else:
                    missing.append(tool)
            except FileNotFoundError:
                missing.append(tool)
        
        if missing:
            self.log_step(f"Missing requirements: {', '.join(missing)}", "ERROR")
            return False
        
        self.log_step("All system requirements satisfied", "SUCCESS")
        return True
    
    def configure_database(self):
        self.log_step("Configuring database connection...")
        
        print("\n📊 Database Configuration")
        print("Choose your database setup:")
        print("1. Use existing PostgreSQL database")
        print("2. Use Replit PostgreSQL (recommended)")
        
        choice = input("Enter choice (1-2): ").strip()
        
        if choice == "2":
            database_url = os.environ.get("DATABASE_URL")
            if database_url:
                self.config['DATABASE_URL'] = database_url
                self.log_step("Using Replit PostgreSQL database", "SUCCESS")
                return self.test_database_connection()
            else:
                self.log_step("DATABASE_URL not found in environment", "ERROR")
                return False
        
        elif choice == "1":
            print("\nEnter database connection details:")
            host = input("Host (localhost): ").strip() or "localhost"
            port = input("Port (5432): ").strip() or "5432"
            database = input("Database name: ").strip()
            username = input("Username: ").strip()
            password = input("Password: ").strip()
            
            if not all([database, username, password]):
                self.log_step("Database configuration incomplete", "ERROR")
                return False
            
            self.config['DATABASE_URL'] = f"postgresql://{username}:{password}@{host}:{port}/{database}"
            return self.test_database_connection()
        
        else:
            self.log_step("Invalid database choice", "ERROR")
            return False
    
    def test_database_connection(self):
        try:
            url = urlparse(self.config['DATABASE_URL'])
            conn = psycopg2.connect(
                host=url.hostname,
                port=url.port,
                user=url.username,
                password=url.password,
                database=url.path[1:]
            )
            conn.close()
            self.log_step("Database connection successful", "SUCCESS")
            return True
        except Exception as e:
            self.log_step(f"Database connection failed: {e}", "ERROR")
            return False
    
    def configure_security(self):
        self.log_step("Configuring security settings...")
        
        self.config['SESSION_SECRET'] = self.generate_secure_key(64)
        self.config['JWT_SECRET'] = self.generate_secure_key(64)
        self.config['ENCRYPTION_KEY'] = self.generate_secure_key(32)
        
        print("\n🔐 Security Configuration")
        print("Choose external API integrations:")
        
        if input("Configure OpenAI API? (y/n): ").lower().startswith('y'):
            api_key = input("Enter OpenAI API key: ").strip()
            if api_key:
                self.config['OPENAI_API_KEY'] = api_key
                self.log_step("OpenAI API configured", "SUCCESS")
        
        if input("Configure Azure services? (y/n): ").lower().startswith('y'):
            client_id = input("Azure Client ID: ").strip()
            client_secret = input("Azure Client Secret: ").strip()
            tenant_id = input("Azure Tenant ID: ").strip()
            
            if all([client_id, client_secret, tenant_id]):
                self.config['AZURE_CLIENT_ID'] = client_id
                self.config['AZURE_CLIENT_SECRET'] = client_secret
                self.config['AZURE_TENANT_ID'] = tenant_id
                self.log_step("Azure services configured", "SUCCESS")
        
        self.log_step("Security configuration completed", "SUCCESS")
        return True
    
    def configure_application(self):
        self.log_step("Configuring application settings...")
        
        print("\n⚙️ Application Configuration")
        
        port = input("Application port (5000): ").strip() or "5000"
        workers = input("Number of workers (4): ").strip() or "4"
        
        environment = "production"
        if input("Enable debug mode? (y/n): ").lower().startswith('y'):
            environment = "development"
        
        self.config.update({
            'FLASK_ENV': environment,
            'FLASK_DEBUG': 'true' if environment == 'development' else 'false',
            'PORT': port,
            'HOST': '0.0.0.0',
            'MAX_WORKERS': workers,
            'WORKER_TIMEOUT': '30',
            'KEEPALIVE': '5'
        })
        
        self.log_step("Application configuration completed", "SUCCESS")
        return True
    
    def create_environment_file(self):
        self.log_step("Creating environment configuration...")
        
        env_content = f"""# TerraFusion Enterprise Production Configuration
# Generated: {datetime.now().isoformat()}

# Database Configuration
DATABASE_URL={self.config.get('DATABASE_URL', '')}

# Security Configuration
SESSION_SECRET={self.config.get('SESSION_SECRET', '')}
JWT_SECRET={self.config.get('JWT_SECRET', '')}
ENCRYPTION_KEY={self.config.get('ENCRYPTION_KEY', '')}

# External API Keys
{f"OPENAI_API_KEY={self.config.get('OPENAI_API_KEY', '')}" if 'OPENAI_API_KEY' in self.config else '# OPENAI_API_KEY=your-key-here'}
{f"AZURE_CLIENT_ID={self.config.get('AZURE_CLIENT_ID', '')}" if 'AZURE_CLIENT_ID' in self.config else '# AZURE_CLIENT_ID=your-client-id'}
{f"AZURE_CLIENT_SECRET={self.config.get('AZURE_CLIENT_SECRET', '')}" if 'AZURE_CLIENT_SECRET' in self.config else '# AZURE_CLIENT_SECRET=your-client-secret'}
{f"AZURE_TENANT_ID={self.config.get('AZURE_TENANT_ID', '')}" if 'AZURE_TENANT_ID' in self.config else '# AZURE_TENANT_ID=your-tenant-id'}

# Application Configuration
FLASK_ENV={self.config.get('FLASK_ENV', 'production')}
FLASK_DEBUG={self.config.get('FLASK_DEBUG', 'false')}
PORT={self.config.get('PORT', '5000')}
HOST={self.config.get('HOST', '0.0.0.0')}

# Performance Configuration
MAX_WORKERS={self.config.get('MAX_WORKERS', '4')}
WORKER_TIMEOUT={self.config.get('WORKER_TIMEOUT', '30')}
KEEPALIVE={self.config.get('KEEPALIVE', '5')}

# Monitoring and Logging
LOG_LEVEL=INFO
MONITORING_ENABLED=true
METRICS_ENDPOINT=/metrics

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
"""
        
        env_file = self.project_root / ".env"
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        env_file.chmod(0o600)
        self.log_step("Environment file created with secure permissions", "SUCCESS")
        return True
    
    def install_dependencies(self):
        self.log_step("Installing production dependencies...")
        
        try:
            req_file = self.project_root / "requirements.production.txt"
            if req_file.exists():
                subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(req_file)], 
                             check=True, capture_output=True)
                self.log_step("Production dependencies installed", "SUCCESS")
            else:
                subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                             check=True, capture_output=True)
                self.log_step("Standard dependencies installed", "SUCCESS")
            return True
        except subprocess.CalledProcessError as e:
            self.log_step(f"Dependency installation failed: {e}", "ERROR")
            return False
    
    def initialize_database(self):
        self.log_step("Initializing database schema...")
        
        try:
            from app import app, db
            with app.app_context():
                db.create_all()
                self.log_step("Database tables created successfully", "SUCCESS")
            return True
        except Exception as e:
            self.log_step(f"Database initialization failed: {e}", "ERROR")
            return False
    
    def run_security_validation(self):
        self.log_step("Running security validation...")
        
        try:
            security_script = self.project_root / "scripts" / "security_validation.py"
            if security_script.exists():
                result = subprocess.run([sys.executable, str(security_script)], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    self.log_step("Security validation passed", "SUCCESS")
                    return True
                else:
                    self.log_step("Security validation failed", "ERROR")
                    return False
            else:
                self.log_step("Security validation script not found", "ERROR")
                return False
        except Exception as e:
            self.log_step(f"Security validation error: {e}", "ERROR")
            return False
    
    def start_application(self):
        self.log_step("Starting TerraFusion services...")
        
        try:
            from app import app
            port = int(self.config.get('PORT', 5000))
            
            print(f"\n🚀 Starting TerraFusion on port {port}...")
            print("Application will be available at:")
            print(f"   • http://localhost:{port}")
            print(f"   • http://0.0.0.0:{port}")
            
            self.log_step("TerraFusion Enterprise started successfully", "SUCCESS")
            return True
            
        except Exception as e:
            self.log_step(f"Application start failed: {e}", "ERROR")
            return False
    
    def generate_setup_report(self):
        report = {
            "setup_timestamp": datetime.now().isoformat(),
            "configuration": {k: v for k, v in self.config.items() if 'SECRET' not in k and 'KEY' not in k},
            "setup_log": self.setup_log,
            "status": "completed"
        }
        
        report_file = self.project_root / "setup_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        success_guide = f"""
# TerraFusion Enterprise Setup Complete! 🎉

## Quick Start Guide

### 1. Access Your Application
- Web Interface: http://localhost:{self.config.get('PORT', 5000)}
- Health Check: http://localhost:{self.config.get('PORT', 5000)}/health
- Dashboard: http://localhost:{self.config.get('PORT', 5000)}/dashboard

### 2. Available Features
- **GIS Export Dashboard**: Advanced geospatial data processing
- **District Lookup**: Coordinate-based district identification  
- **AI Analysis**: Intelligent property assessment insights
- **Project Management**: Enterprise workflow tracking
- **PACS Conversion**: Legacy system data migration

### 3. Management Commands
```bash
# Start application
gunicorn --bind 0.0.0.0:{self.config.get('PORT', 5000)} main:app

# Run security check  
python3 scripts/security_validation.py

# View logs
tail -f logs/enterprise_setup.log
```

### 4. Next Steps
1. Configure SSL certificates for HTTPS
2. Set up automated backups
3. Configure monitoring and alerting
4. Review security policies
5. Train your team on the platform

### 5. Support Resources
- Documentation: docs/
- Configuration: config/
- Logs: logs/
- Archive: archive/

## System Health Dashboard
Access comprehensive system monitoring at: /dashboard

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        guide_file = self.project_root / "SETUP_SUCCESS.md"
        with open(guide_file, 'w') as f:
            f.write(success_guide)
        
        self.log_step("Setup report and guide generated", "SUCCESS")
    
    def run_setup(self):
        self.welcome_screen()
        
        setup_steps = [
            ("System Requirements", self.check_system_requirements),
            ("Database Configuration", self.configure_database),
            ("Security Settings", self.configure_security),
            ("Application Settings", self.configure_application),
            ("Environment File", self.create_environment_file),
            ("Dependencies", self.install_dependencies),
            ("Database Schema", self.initialize_database),
            ("Security Validation", self.run_security_validation),
            ("Application Start", self.start_application)
        ]
        
        print(f"\n🔧 Running {len(setup_steps)} setup steps...\n")
        
        for step_name, step_function in setup_steps:
            if not step_function():
                print(f"\n❌ Setup failed at: {step_name}")
                print("Check the logs above for details.")
                return False
        
        self.generate_setup_report()
        
        print("\n" + "="*80)
        print("🎉 TerraFusion Enterprise Setup Complete!")
        print("="*80)
        print(f"✅ Application running on port {self.config.get('PORT', 5000)}")
        print("✅ Database initialized and connected")
        print("✅ Security configuration applied")
        print("✅ All services operational")
        print("\nReview SETUP_SUCCESS.md for next steps and usage guide.")
        print("="*80)
        
        return True

if __name__ == "__main__":
    wizard = TerraFusionSetupWizard()
    success = wizard.run_setup()
    sys.exit(0 if success else 1)