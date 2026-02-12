#!/usr/bin/env python3
import os
import sys

print("🚀 Simple TerraFusionSync Test")
print("=" * 40)

# Set the CORRECT environment variable that the app actually reads
os.environ['DATABASE_URL'] = 'sqlite:///terrafusionsync_real.db'
print("✅ DATABASE_URL set to SQLite")

try:
    print("📦 Importing app...")
    import app
    print("✅ App imported successfully")
    
    print("🌐 Starting Flask server on http://localhost:5002")
    app.app.run(host='localhost', port=5002, debug=True)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    input("Press Enter to exit...") 