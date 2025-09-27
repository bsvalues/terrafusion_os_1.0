#!/usr/bin/env python3
"""
BSIncomeValuation Production Deployment Script
TerraFusion Platform - Income Approach Valuation Application

This script starts the BSIncomeValuation application as part of the TerraFusion platform.
BSIncomeValuation provides comprehensive income approach property valuations
specialized for commercial and investment properties.

Port: 8008
Application: Income Approach Property Valuation
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def main():
    print("🏢 TerraFusion Platform - BSIncomeValuation Deployment")
    print("=" * 60)
    print("💰 Starting Income Approach Valuation Application")
    print("🌐 Port: 8008")
    print("📊 Features: Income approach, DCF analysis, cap rate calculations")
    print("=" * 60)
    
    # Navigate to BSIncomeValuation directory
    app_dir = Path(__file__).parent / "BSIncomeValuation_PRODUCTION"
    
    if not app_dir.exists():
        print(f"❌ ERROR: BSIncomeValuation directory not found at {app_dir}")
        return 1
    
    os.chdir(app_dir)
    print(f"📁 Working directory: {app_dir}")
    
    # Set environment variables
    env = os.environ.copy()
    env['PORT'] = '8008'
    env['NODE_ENV'] = 'development'
    env['DATABASE_URL'] = 'sqlite:bsincome_valuation.db'
    env['SESSION_SECRET'] = 'bsincome-dev-secret'
    env['JWT_SECRET'] = 'bsincome-jwt-secret'
    
    print("⚙️  Environment Configuration:")
    print(f"   📍 Port: {env['PORT']}")
    print(f"   🗄️  Database: SQLite (local)")
    print(f"   🔐 Session: Development secret")
    print()
    
    try:
        # Check if Node.js dependencies are installed
        print("🔧 Checking Node.js dependencies...")
        
        if not (app_dir / "node_modules").exists():
            print("📦 Installing Node.js dependencies...")
            result = subprocess.run(["npm", "install"], 
                                  cwd=app_dir, 
                                  capture_output=True, 
                                  text=True)
            if result.returncode != 0:
                print(f"⚠️  npm install had issues: {result.stderr}")
                print("🔄 Continuing with existing setup...")
        else:
            print("✅ Node.js dependencies already installed")
        
        # Start the application using tsx directly
        print("🚀 Starting BSIncomeValuation Income Approach Application...")
        print("🌐 Access at: http://localhost:\${{TF_SERVICE_8008_PORT:-8008}}")
        print("📋 Features available:")
        print("   • Income approach valuations")
        print("   • DCF (Discounted Cash Flow) analysis") 
        print("   • Cap rate calculations")
        print("   • Commercial property assessment")
        print("   • Investment property analysis")
        print("   • Net Operating Income (NOI) calculations")
        print()
        print("🔄 Application starting...")
        
        # Run the application using npx tsx
        subprocess.run(["npx", "tsx", "server/index.ts"], 
                      env=env, 
                      cwd=app_dir, 
                      check=True)
        
    except KeyboardInterrupt:
        print("\n⏹️  Shutdown requested by user")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting application: {e}")
        print("🔄 This may be due to TypeScript compilation issues")
        print("💡 Try accessing other working applications:")
        print("   • http://localhost:\${{TF_SERVICE_8008_PORT:-8008}} - TerraFusion Comprehensive")
        print("   • http://localhost:\${{TF_SERVICE_8008_PORT:-8008}} - TerraAgent AI")
        print("   • http://localhost:\${{TF_SERVICE_8008_PORT:-8008}} - TerraMiner Analytics")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 