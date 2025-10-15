#!/usr/bin/env python3

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def main():
    print("🚀 Starting TerraFlow - Workflow Management Engine")
    print("=" * 60)
    
    # Set the working directory to TerraFlow
    terraflow_dir = Path(__file__).parent.parent / "TerraFlow"
    os.chdir(terraflow_dir)
    
    print(f"📁 Working Directory: {terraflow_dir}")
    
    # Set up environment variables
    env = os.environ.copy()
    env.update({
        "FLASK_APP": "app.py",
        "FLASK_ENV": "development",
        "FLASK_DEBUG": "False",
        "SESSION_SECRET": "dev-secret-key-terraflow-2024",
        "DATABASE_URL": "sqlite:///terraflow.db",
        "UPLOAD_FOLDER": "uploads",
        "BYPASS_LDAP": "True",
        "DB_USE_SSL": "False"
    })
    
    print("🔧 Environment configured:")
    print(f"   - Database: SQLite (terraflow.db)")
    print(f"   - Port: 5001")
    print(f"   - Debug: False")
    print(f"   - LDAP: Bypassed (dev mode)")
    
    # Install dependencies if requirements.txt exists
    if os.path.exists("requirements.txt"):
        print("\n📦 Installing dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                         check=True, capture_output=True, text=True, env=env)
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Some dependencies failed to install: {e}")
            print("   Continuing with available packages...")
    
    # Create necessary directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("instance", exist_ok=True)
    
    print("\n🗃️  Directory structure ready")
    print("   - uploads/ directory created")
    print("   - instance/ directory created")
    
    # Start the Flask application
    print("\n🔥 Starting TerraFlow on port 5001...")
    print("   URL: http://localhost:5001")
    print("   Status: Starting up...")
    
    try:
        # Use Python to run the Flask application directly
        env["FLASK_RUN_PORT"] = "5001"
        env["FLASK_RUN_HOST"] = "0.0.0.0"
        
        # Start the application
        process = subprocess.Popen([
            sys.executable, "-c",
            "from app import app; app.run(host='0.0.0.0', port=5001, debug=False)"
        ], env=env)
        
        # Wait a moment for startup
        time.sleep(3)
        
        # Test if the application is responding
        try:
            response = requests.get("http://localhost:5001", timeout=5)
            if response.status_code == 200:
                print("✅ TerraFlow is LIVE and responding!")
                print("\n🎯 Access Points:")
                print("   - Main App: http://localhost:5001")
                print("   - File Manager: http://localhost:5001/files")
                print("   - Dashboard: http://localhost:5001/mcp-dashboard")
                print("   - API Tester: http://localhost:5001/api-tester")
            else:
                print(f"⚠️  TerraFlow started but returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️  TerraFlow started but connection test failed: {e}")
            print("   Application may still be initializing...")
        
        # Keep the process running
        print("\n📊 TerraFlow is running in background")
        print("   Process ID:", process.pid)
        print("   Press Ctrl+C to stop")
        
        # Wait for the process
        process.wait()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down TerraFlow...")
        process.terminate()
        process.wait()
        print("✅ TerraFlow stopped successfully")
    except Exception as e:
        print(f"❌ Error starting TerraFlow: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 