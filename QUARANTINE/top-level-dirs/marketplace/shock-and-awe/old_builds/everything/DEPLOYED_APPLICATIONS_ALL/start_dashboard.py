#!/usr/bin/env python3
"""
🌟 TerraFusion Executive Command Center Dashboard Launcher
Quick start script for the terminal dashboard (ported to web)
"""

import subprocess
import time
import os
import sys
from pathlib import Path

def start_dashboard():
    """Start the TerraFusion Executive Command Center Dashboard"""
    
    print("🌟 TerraFusion Executive Command Center Dashboard")
    print("=" * 60)
    print("🚀 Starting your ported terminal dashboard...")
    
    # Navigate to dashboard directory
    dashboard_dir = Path("TerraFusionDashboard_PRODUCTION/TerraFusionDashboard")
    
    if not dashboard_dir.exists():
        print("❌ Dashboard directory not found!")
        return False
    
    os.chdir(dashboard_dir)
    
    # Set up environment for Windows
    env = os.environ.copy()
    env.update({
        'NODE_ENV': 'production',
        'DATABASE_URL': 'sqlite:///terrafusion_dashboard.db',  # Simple SQLite for quick start
        'PORT': '5000',
        'JWT_SECRET': 'terrafusion-dev-secret-key',
        'SESSION_SECRET': 'terrafusion-session-key'
    })
    
    print("📁 Working Directory:", os.getcwd())
    print("🔧 Environment: Production")
    print("💾 Database: SQLite (Quick Start)")
    print("🌐 Port: 5000")
    print()
    
    try:
        print("🔨 Building dashboard...")
        build_result = subprocess.run(['npm', 'run', 'build'], 
                                    capture_output=True, text=True, env=env)
        
        if build_result.returncode != 0:
            print("⚠️ Build had issues, but trying to start anyway...")
            print("Build output:", build_result.stdout)
            print("Build errors:", build_result.stderr)
        else:
            print("✅ Build completed!")
        
        print("🚀 Starting TerraFusion Executive Command Center Dashboard...")
        print("🌐 Opening at: http://localhost:5000")
        print("🎯 Your ported terminal dashboard is loading...")
        print()
        print("=" * 60)
        print("📊 EXECUTIVE COMMAND CENTER DASHBOARD")
        print("📱 Application Cards & Launch Controls") 
        print("📈 Auto-Refreshing Status Displays")
        print("🎮 Interactive Command Hub")
        print("=" * 60)
        print()
        print("💡 Press Ctrl+C to stop the dashboard")
        print()
        
        # Start the dashboard
        process = subprocess.Popen(['node', 'dist/index.js'], 
                                 env=env, cwd=dashboard_dir)
        
        # Wait a moment for startup
        time.sleep(3)
        
        # Open browser
        try:
            subprocess.run(['start', 'http://localhost:5000'], shell=True)
        except:
            print("🌐 Please open http://localhost:5000 in your browser")
        
        # Keep running
        try:
            process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping TerraFusion Executive Command Center Dashboard...")
            process.terminate()
            print("✅ Dashboard stopped!")
            
        return True
        
    except Exception as e:
        print(f"❌ Error starting dashboard: {e}")
        return False

if __name__ == "__main__":
    start_dashboard() 