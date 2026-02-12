#!/usr/bin/env python3
"""
BCBSLevy Production Deployment Script
TerraFusion Platform - Tax Levy Calculator Application

This script starts the BCBSLevy application as part of the TerraFusion platform.
BCBSLevy provides comprehensive tax levy calculations, forecasting, and analysis
for Benton County Washington.

Port: 8007
Application: Tax Levy Calculator & Analysis
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def main():
    print("🏛️ TerraFusion Platform - BCBSLevy Deployment")
    print("=" * 60)
    print("🔢 Starting Tax Levy Calculator Application")
    print("🌐 Port: 8007")
    print("📊 Features: Levy calculations, forecasting, data analysis")
    print("=" * 60)
    
    # Navigate to BCBSLevy directory
    bcbs_levy_dir = Path(__file__).parent / "BCBSLevy_PRODUCTION"
    
    if not bcbs_levy_dir.exists():
        print(f"❌ ERROR: BCBSLevy directory not found at {bcbs_levy_dir}")
        return 1
    
    os.chdir(bcbs_levy_dir)
    print(f"📁 Working directory: {bcbs_levy_dir}")
    
    # Set environment variables
    env = os.environ.copy()
    env['PORT'] = '8007'
    env['FLASK_APP'] = 'main.py'
    env['FLASK_ENV'] = 'development'
    env['DATABASE_URL'] = 'sqlite:///bcbs_levy.db'
    env['SESSION_SECRET'] = 'bcbs-levy-dev-secret'
    
    print("⚙️  Environment Configuration:")
    print(f"   📍 Port: {env['PORT']}")
    print(f"   🗄️  Database: SQLite (local)")
    print(f"   🔐 Session: Development secret")
    print()
    
    try:
        # Check if requirements need to be installed
        print("🔧 Checking Python dependencies...")
        
        # Install requirements if needed
        try:
            import flask
            print("✅ Flask available")
        except ImportError:
            print("📦 Installing Python dependencies...")
            subprocess.run([sys.executable, "-m", "pip", "install", "flask", "flask-sqlalchemy", "flask-migrate"], 
                          check=True)
        
        # Start the application
        print("🚀 Starting BCBSLevy Tax Levy Calculator...")
        print("🌐 Access at: http://localhost:8007")
        print("📋 Features available:")
        print("   • Tax levy calculations")
        print("   • Budget forecasting") 
        print("   • Historical analysis")
        print("   • Data management")
        print("   • Compliance reporting")
        print()
        print("🔄 Application starting...")
        
        # Run the Flask application
        subprocess.run([sys.executable, "main.py"], env=env, check=True)
        
    except KeyboardInterrupt:
        print("\n⏹️  Shutdown requested by user")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting application: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 