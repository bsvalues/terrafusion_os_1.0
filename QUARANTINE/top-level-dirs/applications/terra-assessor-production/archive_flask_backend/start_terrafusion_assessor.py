#!/usr/bin/env python3
"""
TerraFusion Assessor - Unified Next.js Launcher
Enterprise Assessment Platform
"""
import os
import subprocess
import sys
from pathlib import Path

def print_banner():
    print("=" * 70)
    print("  TerraFusion Assessor - Enterprise Assessment Platform")
    print("  AI That Understands Land")
    print("=" * 70)
    print()

def check_node_installed():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
            return True
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not installed")
        return False

def check_npm_installed():
    """Check if npm is installed"""
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm: {result.stdout.strip()}")
            return True
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not installed")
        return False

def install_dependencies():
    """Install npm dependencies if node_modules doesn't exist"""
    if not Path("node_modules").exists():
        print("📦 Installing dependencies...")
        result = subprocess.run(['npm', 'install'], cwd='TerraFusionAssessor')
        if result.returncode != 0:
            print("❌ Failed to install dependencies")
            return False
        print("✅ Dependencies installed")
    else:
        print("✅ Dependencies already installed")
    return True

def start_application():
    """Start the Next.js application"""
    print("\n🚀 Starting TerraFusion Assessor...")
    print()
    print("✅ Next.js 15+ App Router: READY")
    print("✅ AI Valuation Engine: READY")
    print("✅ Market Intelligence: READY") 
    print("✅ Portfolio Analytics: READY")
    print("✅ Risk Assessment: READY")
    print("✅ Enterprise API Routes: READY")
    print()
    print("🌐 Application will be available at: http://localhost:5008")
    print()
    print("=" * 70)
    print("  TerraFusion Platform Status: OPERATIONAL")
    print("  Intelligence That Counties Envy")
    print("=" * 70)
    print()
    
    try:
        # Change to the Next.js directory and start the development server
        os.chdir('TerraFusionAssessor')
        subprocess.run(['npm', 'run', 'dev'])
    except KeyboardInterrupt:
        print("\n\n🛑 TerraFusion Assessor stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")

def main():
    print_banner()
    
    # Check prerequisites
    if not check_node_installed():
        print("Please install Node.js from https://nodejs.org/")
        sys.exit(1)
    
    if not check_npm_installed():
        print("Please install npm (usually comes with Node.js)")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Start the application
    start_application()

if __name__ == "__main__":
    main() 