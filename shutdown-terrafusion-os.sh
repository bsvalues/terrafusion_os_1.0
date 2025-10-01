#!/bin/bash

# TerraFusion OS Shutdown Script

echo "🛑 TerraFusion OS Shutdown Sequence"
echo "=================================="

# Load process IDs
if [ -f "terrafusion-os.pid" ]; then
    source terrafusion-os.pid
    
    echo "🔍 Stopping TerraFusion OS processes..."
    
    # Stop web server
    if [ -n "$WEBSERVER_PID" ] && kill -0 $WEBSERVER_PID 2>/dev/null; then
        echo "   Stopping Web Server (PID: $WEBSERVER_PID)..."
        kill $WEBSERVER_PID
    fi
    
    # Stop backend API
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        echo "   Stopping Backend API (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    
    # Stop kernel
    if [ -n "$KERNEL_PID" ] && kill -0 $KERNEL_PID 2>/dev/null; then
        echo "   Stopping OS Kernel (PID: $KERNEL_PID)..."
        kill $KERNEL_PID
    fi
    
    # Wait for processes to terminate
    sleep 2
    
    # Force kill if necessary
    pkill -f "python3 -m http.server" 2>/dev/null
    pkill -f "python3 boot.py" 2>/dev/null
    pkill -f "dotnet run" 2>/dev/null
    
    # Clean up
    rm -f terrafusion-os.pid
    
    echo "✅ TerraFusion OS shutdown complete."
    
else
    echo "❌ No process ID file found. Attempting manual cleanup..."
    pkill -f "python3 -m http.server" 2>/dev/null
    pkill -f "python3 boot.py" 2>/dev/null
    pkill -f "dotnet run" 2>/dev/null
    echo "✅ Manual cleanup complete."
fi

echo "🏛️ Government. Transcended. (Offline)"