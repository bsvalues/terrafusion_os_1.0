#!/usr/bin/env python3
"""
GeoAssessmentPro Deployment Script

This script automates the deployment process for the GeoAssessmentPro application.
It handles database migrations, static asset compilation, and service configuration.
"""

import argparse
import json
import logging
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('deployment/logs/deploy.log', mode='a')
    ]
)
logger = logging.getLogger('deploy')

# Default paths
ROOT_DIR = Path(__file__).resolve().parents[2]
CONFIGS_DIR = ROOT_DIR / 'deployment' / 'configs'
STATIC_DIR = ROOT_DIR / 'static'
TEMPLATES_DIR = ROOT_DIR / 'templates'

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Deploy GeoAssessmentPro')
    parser.add_argument('--env', '-e', 
                      choices=['development', 'staging', 'production', 'test'],
                      default='development',
                      help='Deployment environment')
    parser.add_argument('--skip-migration', '-m', action='store_true',
                      help='Skip database migration')
    parser.add_argument('--skip-tests', '-t', action='store_true',
                      help='Skip running tests')
    parser.add_argument('--debug', '-d', action='store_true',
                      help='Enable debug output')
    parser.add_argument('--backup', '-b', action='store_true',
                      help='Perform database backup before deployment')
    return parser.parse_args()

def load_config(env):
    """Load environment-specific configuration"""
    config_file = CONFIGS_DIR / f'{env}.json'
    
    if not config_file.exists():
        logger.error(f"Configuration file not found: {config_file}")
        sys.exit(1)
    
    with open(config_file, 'r') as f:
        return json.load(f)

def backup_database(config):
    """Backup the database before deployment"""
    logger.info("Creating database backup...")
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = ROOT_DIR / 'backup' / timestamp
    os.makedirs(backup_dir, exist_ok=True)
    
    try:
        # Set environment variables for db connection
        env = os.environ.copy()
        env['PGPASSWORD'] = config['database']['password']
        
        # Execute pg_dump
        cmd = [
            'pg_dump',
            '-h', config['database']['host'],
            '-p', str(config['database']['port']),
            '-U', config['database']['user'],
            '-F', 'c',  # Custom format (compressed)
            '-f', str(backup_dir / 'database.dump'),
            config['database']['name']
        ]
        
        subprocess.run(cmd, env=env, check=True)
        logger.info(f"Database backup created at {backup_dir / 'database.dump'}")
        
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Database backup failed: {e}")
        return False

def run_tests():
    """Run test suite before deployment"""
    logger.info("Running test suite...")
    
    try:
        result = subprocess.run(['python', '-m', 'pytest'], cwd=ROOT_DIR, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Tests failed: {result.stderr}")
            logger.error("Aborting deployment")
            return False
        
        logger.info("Tests passed successfully")
        return True
    except Exception as e:
        logger.error(f"Error running tests: {e}")
        return False

def run_database_migration():
    """Run database migrations"""
    logger.info("Running database migrations...")
    
    try:
        result = subprocess.run(
            ['flask', 'db', 'upgrade'],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"Migration failed: {result.stderr}")
            logger.error("Aborting deployment")
            return False
        
        logger.info("Database migration completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        return False

def compile_static_assets():
    """Compile and optimize static assets"""
    logger.info("Compiling static assets...")
    
    # Create build directory
    build_dir = STATIC_DIR / 'build'
    os.makedirs(build_dir, exist_ok=True)
    
    try:
        # Copy and minify CSS
        css_files = list(STATIC_DIR.glob('css/*.css'))
        for css_file in css_files:
            logger.info(f"Processing CSS: {css_file}")
            # In a real deployment, you'd use a CSS minifier here
            shutil.copy2(css_file, build_dir / css_file.name)
        
        # Copy and minify JS
        js_files = list(STATIC_DIR.glob('js/*.js'))
        for js_file in js_files:
            logger.info(f"Processing JS: {js_file}")
            # In a real deployment, you'd use a JS minifier here
            shutil.copy2(js_file, build_dir / js_file.name)
        
        # Copy images and other assets
        for asset_dir in ['img', 'icons', 'fonts']:
            src_dir = STATIC_DIR / asset_dir
            if src_dir.exists():
                dst_dir = build_dir / asset_dir
                os.makedirs(dst_dir, exist_ok=True)
                for file in src_dir.glob('*.*'):
                    shutil.copy2(file, dst_dir / file.name)
        
        logger.info("Static asset compilation completed")
        return True
    except Exception as e:
        logger.error(f"Error compiling static assets: {e}")
        return False

def update_version_info():
    """Update version information file"""
    version_file = ROOT_DIR / 'static' / 'version.json'
    
    version_info = {
        "version": "1.0.0",  # In production, this would be dynamically generated
        "build_timestamp": datetime.now().isoformat(),
        "build_id": datetime.now().strftime('%Y%m%d%H%M%S'),
        "git_commit": "main"  # In production, this would be the actual git commit
    }
    
    with open(version_file, 'w') as f:
        json.dump(version_info, f, indent=2)
    
    logger.info(f"Version information updated: {version_info}")
    return True

def restart_services(config):
    """Restart application services"""
    logger.info("Restarting application services...")
    
    try:
        # In a production environment, this would restart the actual services
        # For example, using systemctl:
        #
        # subprocess.run(['sudo', 'systemctl', 'restart', 'geoassessmentpro'])
        # subprocess.run(['sudo', 'systemctl', 'restart', 'nginx'])
        
        # For demonstration purposes, we'll just log the steps
        logger.info("Would restart: gunicorn service")
        logger.info("Would restart: nginx service")
        
        return True
    except Exception as e:
        logger.error(f"Error restarting services: {e}")
        return False

def clear_cache():
    """Clear application caches"""
    logger.info("Clearing application caches...")
    
    cache_dir = ROOT_DIR / 'instance' / 'cache'
    if cache_dir.exists():
        try:
            for item in cache_dir.glob('*'):
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            
            logger.info("Application caches cleared")
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False
    
    return True

def main():
    """Main deployment function"""
    args = parse_args()
    
    # Configure logging level
    if args.debug:
        logger.setLevel(logging.DEBUG)
    
    try:
        logger.info(f"Starting deployment for environment: {args.env}")
        
        # Create logs directory if it doesn't exist
        os.makedirs('deployment/logs', exist_ok=True)
        
        # Load configuration
        config = load_config(args.env)
        logger.debug(f"Loaded configuration for {args.env}")
        
        # Backup database if requested
        if args.backup:
            if not backup_database(config):
                logger.error("Database backup failed, aborting deployment")
                return 1
        
        # Run tests if not skipped
        if not args.skip_tests:
            if not run_tests():
                return 1
        
        # Run database migration if not skipped
        if not args.skip_migration:
            if not run_database_migration():
                return 1
        
        # Compile static assets
        if not compile_static_assets():
            return 1
        
        # Update version information
        if not update_version_info():
            return 1
        
        # Clear application caches
        if not clear_cache():
            return 1
        
        # Restart services
        if not restart_services(config):
            return 1
        
        logger.info(f"Deployment to {args.env} completed successfully")
        return 0
    
    except Exception as e:
        logger.error(f"Deployment failed with error: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())