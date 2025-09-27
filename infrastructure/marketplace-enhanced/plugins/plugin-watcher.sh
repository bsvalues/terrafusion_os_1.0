#!/bin/bash

# Plugin Auto-Refresh Watcher
# Monitors for new plugins and triggers UI reload

PLUGIN_DIR="/marketplace/plugins"
RELOAD_TRIGGER="/tmp/.plugin_reload"

echo "🔄 Starting plugin watcher..."

# Use inotifywait if available, otherwise fall back to polling
if command -v inotifywait &> /dev/null; then
    echo "Using inotify for real-time monitoring"
    while true; do
        inotifywait -e create,modify,delete "$PLUGIN_DIR" 2>/dev/null
        echo "📦 Plugin change detected!"
        touch "$RELOAD_TRIGGER"
        # Send websocket notification if available
        curl -X POST http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/plugins/reload 2>/dev/null || true
    done
else
    echo "Using polling mode (checking every 5 seconds)"
    LAST_HASH=""
    while true; do
        CURRENT_HASH=$(find "$PLUGIN_DIR" -name "*.json" -exec md5sum {} \; | sort | md5sum)
        if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
            echo "📦 Plugin change detected!"
            touch "$RELOAD_TRIGGER"
            curl -X POST http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/plugins/reload 2>/dev/null || true
            LAST_HASH=$CURRENT_HASH
        fi
        sleep 5
    done
fi