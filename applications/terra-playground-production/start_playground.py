#!/usr/bin/env python3
"""
TerraFusion Playground Startup Script
Launches the enterprise application launcher with proper branding
"""

import os
import sys
import time
import webbrowser
import subprocess
import threading
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import flask
        import flask_cors
        print("✅ Dependencies verified")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Installing required packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask', 'flask-cors'])
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies")
            return False

def open_browser():
    """Open the browser to the playground after a delay"""
    time.sleep(2)  # Give the server time to start
    url = "http://localhost:3000"
    print(f"🌐 Opening TerraFusion Playground: {url}")
    webbrowser.open(url)

def main():
    """Main startup function"""
    print("🚀 TerraFusion Playground - Enterprise Application Launcher")
    print("=" * 60)
    print("Intelligence That Counties Envy | Development Environment")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Cannot start playground due to missing dependencies")
        input("Press Enter to exit...")
        return
    
    # Verify we're in the right directory
    current_dir = Path.cwd()
    if not (current_dir / "index.html").exists():
        print("❌ index.html not found. Please run from TerraFusionPlayground_PRODUCTION directory")
        input("Press Enter to exit...")
        return
    
    print("✅ Starting TerraFusion Playground Backend Server...")
    
    # Start browser in background thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start the Flask server
    try:
        from app_server import app
        app.run(
            host='localhost',
            port=3000,
            debug=False,  # Disable debug for cleaner output
            use_reloader=False
        )
    except KeyboardInterrupt:
        print("\n🛑 TerraFusion Playground shutting down...")
    except Exception as e:
        print(f"❌ Error starting playground: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main() 