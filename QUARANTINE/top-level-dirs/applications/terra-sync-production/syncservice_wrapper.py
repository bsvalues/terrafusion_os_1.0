"""
Wrapper script for the SyncService API.

This module provides integration with the SyncService FastAPI application
running on port 8000.
"""
import os
import sys
import subprocess
import time

def main():
    """
    Start the SyncService API on port 8000.
    """
    print("Starting SyncService on port 8000")
    
    # Change directory to the SyncService application
    os.chdir("apps/backend/syncservice")
    
    # Run the start.py script
    process = subprocess.Popen([sys.executable, "start.py"])
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # Handle keyboard interrupt (Ctrl+C)
        print("Stopping SyncService")
        process.terminate()
        process.wait()
        
    return 0

if __name__ == "__main__":
    sys.exit(main())