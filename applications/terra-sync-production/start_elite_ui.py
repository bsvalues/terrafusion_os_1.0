#!/usr/bin/env python3
"""
TerraFusion Elite UI Launcher
Quick launcher for the elite UI system
"""

import os
import sys
from datetime import datetime

def main():
    print("🚀 Starting TerraFusion Elite UI...")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Set environment variables
    os.environ['DATABASE_URL'] = 'sqlite:///terrafusionsync_elite.db'
    os.environ['FLASK_ENV'] = 'development'
    os.environ['SESSION_SECRET'] = 'elite-terrafusion-secret'
    
    # Import and run the app
    try:
        from app import app
        print("✅ App imported successfully")
        print("🌐 Starting Flask server on port 5003...")
        print("\n🎯 Elite UI URLs:")
        print("   🏠 Elite Home: http://localhost:5003/elite")
        print("   📊 Dashboard: http://localhost:5003/dashboard/elite")
        print("   🤖 AI Center: http://localhost:5003/ai-analysis/elite")
        print("   🗺️ GIS Command: http://localhost:5003/gis/elite")
        print("\n" + "=" * 50)
        
        app.run(host='0.0.0.0', port=5003, debug=True)
        
    except Exception as e:
        print(f"❌ Error starting app: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()