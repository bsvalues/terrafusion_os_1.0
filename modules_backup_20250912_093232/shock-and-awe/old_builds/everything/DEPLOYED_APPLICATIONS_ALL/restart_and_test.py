#!/usr/bin/env python3

import subprocess
import time
import signal
import os
import sys

def restart_and_test():
    """Restart the TerraFusion server and test card readability"""
    
    print("🔄 TerraFusion Server Restart & Test")
    print("=" * 40)
    
    # Kill any existing Python processes running the server
    print("🛑 Stopping existing server processes...")
    try:
        # For Windows, use taskkill to stop Python processes
        subprocess.run(['taskkill', '/f', '/im', 'python.exe'], 
                      capture_output=True, text=True)
        time.sleep(2)
        print("  ✅ Stopped existing processes")
    except Exception as e:
        print(f"  ⚠️ Could not stop processes: {e}")
    
    # Start the server in background
    print("🚀 Starting TerraFusion Build server...")
    try:
        # Start the server process
        server_process = subprocess.Popen(
            [sys.executable, 'terrafusion_build_ENTERPRISE_COMPLETE.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to start
        print("  ⏳ Waiting for server to initialize...")
        time.sleep(5)
        
        # Check if process is still running
        if server_process.poll() is None:
            print("  ✅ Server started successfully")
            
            # Run the card readability test
            print("\n🧪 Running card readability test...")
            test_result = subprocess.run(
                [sys.executable, 'test_card_readability.py'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            print(test_result.stdout)
            if test_result.stderr:
                print("Errors:", test_result.stderr)
            
            # Stop the server
            print("\n🛑 Stopping test server...")
            server_process.terminate()
            time.sleep(2)
            if server_process.poll() is None:
                server_process.kill()
            print("  ✅ Server stopped")
            
        else:
            print("  ❌ Server failed to start")
            stdout, stderr = server_process.communicate()
            print(f"Error: {stderr}")
            
    except Exception as e:
        print(f"❌ Error during restart and test: {e}")
    
    print("\n✅ Restart and test completed!")

if __name__ == "__main__":
    restart_and_test() 