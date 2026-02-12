#!/bin/bash

# Safe Restart Script for TerraFusion
# This script safely restarts the server by handling port conflicts and graceful shutdown

echo "🔄 Performing safe server restart..."

# Check if Node processes are running
NODE_PIDS=$(ps aux | grep "[n]ode" | awk '{print $2}')

if [ -n "$NODE_PIDS" ]; then
  echo "📊 Found Node.js processes: $NODE_PIDS"
  
  # Send SIGTERM to each process to trigger graceful shutdown
  for PID in $NODE_PIDS; do
    echo "⏹ Stopping Node.js process $PID..."
    kill -15 $PID
    
    # Wait for process to exit
    for i in {1..10}; do
      if ! ps -p $PID > /dev/null; then
        echo "✅ Process $PID stopped gracefully"
        break
      fi
      echo "⌛ Waiting for process $PID to exit... ($i/10)"
      sleep 1
    done
    
    # Force kill if still running
    if ps -p $PID > /dev/null; then
      echo "⚠️ Process $PID did not exit gracefully, forcing..."
      kill -9 $PID
    fi
  done
  
  # Wait a bit for ports to be released
  echo "⌛ Waiting for ports to be released..."
  sleep 3
fi

# Check if the port is still in use
PORT_IN_USE=$(lsof -i:5000 -t)
if [ -n "$PORT_IN_USE" ]; then
  echo "⚠️ Port 5000 is still in use by process $PORT_IN_USE"
  echo "⚠️ Attempting to force release port..."
  kill -9 $PORT_IN_USE
  sleep 2
fi

# Start the server
echo "🚀 Starting server..."
cd "$(dirname "$0")/.."
npm run dev