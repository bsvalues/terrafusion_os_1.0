#!/usr/bin/env python3
"""
TerraFusion Core AI Valuator API Launcher
This script starts the FastAPI backend on port 8000
"""
import os
import sys
import uvicorn

# Ensure modules can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    """Run the FastAPI app with uvicorn server"""
    print("Starting TerraFusion Core AI Valuator API...")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main()