#!/usr/bin/env python3
"""
TerraFusionPilt Launcher
AI That Understands Land - PILT Management System
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def print_banner():
    print("="*80)
    print("🏛️ TERRAFUSIONPILT - PILT MANAGEMENT SYSTEM")
    print("AI That Understands Land")
    print("Payment in Lieu of Taxes • Federal Compliance • Enterprise Analytics")
    print("="*80)
    print(f"⏰ Launch Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎯 Port: 5009")
    print("="*80 + "\n")

def check_node_installed():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Node.js version: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js not found. Please install Node.js to run TerraFusionPilt.")
        return False

def check_dependencies():
    """Check if node_modules exists"""
    if os.path.exists('node_modules'):
        print("✅ Dependencies installed")
        return True
    else:
        print("⚠️  Dependencies not found. Installing...")
        try:
            subprocess.run(['npm', 'install'], check=True)
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies")
            return False

def launch_terrafusionpilt():
    """Launch the TerraFusionPilt application"""
    print("🚀 Starting TerraFusionPilt...")
    print("🌐 Access URL: http://localhost:5009")
    print("📊 Features: PILT Dashboard, Federal Reporting, Data Analytics")
    print("\nPress Ctrl+C to stop the application...\n")
    
    try:
        # Set environment variables for production
        env = os.environ.copy()
        env['NODE_ENV'] = 'production'
        env['PORT'] = '5009'
        
        # Start the application
        process = subprocess.run(['npm', 'run', 'dev'], env=env)
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down TerraFusionPilt...")
        print("✅ TerraFusionPilt stopped gracefully")
    except Exception as e:
        print(f"❌ Error running TerraFusionPilt: {e}")

def main():
    print_banner()
    
    # Check prerequisites
    if not check_node_installed():
        return
    
    if not check_dependencies():
        return
    
    # Launch the application
    launch_terrafusionpilt()
    
    print("\n🎯 Thank you for using TerraFusionPilt!")
    print("AI That Understands Land - Enterprise PILT Management")

if __name__ == "__main__":
    main() 