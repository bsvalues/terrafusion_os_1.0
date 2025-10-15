#!/usr/bin/env python3
"""
TerraFusionPro Production Deployment Script
TerraFusion Platform - Professional Appraiser Tools

This script starts the TerraFusionPro application as part of the TerraFusion platform.
TerraFusionPro provides comprehensive professional-grade appraiser tools designed
for both county assessors and fee appraisers with advanced analytics, AI integration,
and complete workflow management.

Port: 8009
Application: Professional Appraiser Tools (County + Fee)
Features: Advanced analytics, AI integration, workflow management, reporting
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def main():
    print("👨‍💼 TerraFusion Platform - TerraFusionPro Deployment")
    print("=" * 60)
    print("🏆 Starting Professional Appraiser Tools")
    print("🌐 Port: 8009")
    print("📊 Features: Advanced analytics, AI integration, professional workflow")
    print("🎯 Market: County assessors AND fee appraisers")
    print("=" * 60)
    
    # Navigate to TerraFusionPro directory
    app_dir = Path(__file__).parent / "TerraFusionPro_PRODUCTION"
    
    if not app_dir.exists():
        print(f"❌ ERROR: TerraFusionPro directory not found at {app_dir}")
        return 1
    
    os.chdir(app_dir)
    print(f"📁 Working directory: {app_dir}")
    
    # Set environment variables
    env = os.environ.copy()
    env['PORT'] = '8009'
    env['NODE_ENV'] = 'development'
    env['DATABASE_URL'] = 'sqlite:terrafusion_pro.db'
    env['SESSION_SECRET'] = 'terrafusion-pro-dev-secret-2025'
    env['JWT_SECRET'] = 'terrafusion-pro-jwt-secret'
    env['APP_NAME'] = 'TerraFusionPro'
    env['APP_VERSION'] = 'v3.0-Professional'
    
    print("⚙️  Environment Configuration:")
    print(f"   📍 Port: {env['PORT']}")
    print(f"   🗄️  Database: SQLite (professional grade)")
    print(f"   🔐 Session: Development secret")
    print(f"   🏆 Version: Professional Edition")
    print()
    
    try:
        # Check if Node.js dependencies are installed
        print("🔧 Checking Node.js dependencies...")
        
        if not (app_dir / "node_modules").exists():
            print("📦 Installing Node.js professional dependencies...")
            print("⏳ This may take longer due to professional packages...")
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
        print("🚀 Starting TerraFusionPro Professional Application...")
        print("🌐 Access at: http://localhost:8009")
        print("📋 Professional Features available:")
        print("   • 🏛️  County Assessor Tools")
        print("     - Mass appraisal workflows")
        print("     - Assessment roll management")
        print("     - Appeal processing")
        print("     - Compliance reporting")
        print()
        print("   • 👨‍💼 Fee Appraiser Tools")
        print("     - Individual property reports")
        print("     - Client management")
        print("     - USPAP compliance")
        print("     - Professional report generation")
        print()
        print("   • 🤖 AI-Powered Features")
        print("     - Automated comparable selection")
        print("     - Value prediction models")
        print("     - Market trend analysis")
        print("     - Quality assurance checks")
        print()
        print("   • 📊 Analytics & Reporting")
        print("     - Market analytics dashboard")
        print("     - Performance metrics")
        print("     - Custom report builder")
        print("     - Data visualization tools")
        print()
        print("🔄 Professional application starting...")
        
        # Run the application using npx tsx
        subprocess.run(["npx", "tsx", "server/index.ts"], 
                      env=env, 
                      cwd=app_dir, 
                      check=True)
        
    except KeyboardInterrupt:
        print("\n⏹️  Shutdown requested by user")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting TerraFusionPro: {e}")
        print("🔄 This may be due to TypeScript compilation issues")
        print("💡 Try accessing other working applications:")
        print("   • http://localhost:8001 - TerraFusion Comprehensive")
        print("   • http://localhost:8002 - TerraAgent AI")
        print("   • http://localhost:8003 - TerraMiner Analytics")
        print("   • http://localhost:8008 - BSIncomeValuation")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 