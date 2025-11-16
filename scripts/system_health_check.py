#!/usr/bin/env python3
"""
TerraFusion OS - System Health Check
Comprehensive validation of deployed AI system
"""

import os
import json
import subprocess
from datetime import datetime

def check_system_health():
    print("=== TERRAFUSION OS SYSTEM HEALTH CHECK ===")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 50)
    
    # Check current directory
    print(f"Current Directory: {os.getcwd()}")
    
    # Check Python processes
    try:
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, text=True, shell=True)
        python_processes = result.stdout.count('python.exe')
        print(f"Active Python Processes: {python_processes}")
    except:
        print("Active Python Processes: Unable to check")
    
    # Check available disk space
    try:
        import shutil
        total, used, free = shutil.disk_usage("C:\\")
        print(f"Disk Usage: {used // (1024**3)} GB used, {free // (1024**3)} GB free")
    except:
        print("Disk Usage: Unable to check")
    
    # Check AI coordination status
    try:
        if os.path.exists("backend/mcp-core/ai_coordination_activator.py"):
            print("✅ AI Coordination Activator: Found")
        else:
            print("❌ AI Coordination Activator: Missing")
    except:
        print("❌ AI Coordination Activator: Error checking")
    
    # Check MCP configuration
    try:
        if os.path.exists("mcp.json"):
            print("✅ MCP Configuration: Found")
        else:
            print("❌ MCP Configuration: Missing")
    except:
        print("❌ MCP Configuration: Error checking")
    
    print("=" * 50)
    return True

if __name__ == "__main__":
    check_system_health()
