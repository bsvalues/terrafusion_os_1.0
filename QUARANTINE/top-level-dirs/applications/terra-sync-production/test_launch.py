#!/usr/bin/env python3
import sys
import os

print("🚀 TerraFusionSync Test Launcher")
print("=" * 50)

try:
    print("✅ Testing imports...")
    import flask
    print(f"✅ Flask version: {flask.__version__}")
    
    import requests
    print(f"✅ Requests available")
    
    print("✅ Starting TerraFusionSync...")
    
    # Import and run the app
    import app
    print("✅ App module imported successfully")
    
    print("🌐 Starting server on http://localhost:5002")
    app.app.run(host='localhost', port=5002, debug=False)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    input("Press Enter to exit...") 