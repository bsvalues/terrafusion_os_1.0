#!/bin/bash

# TerraFusion OS HAProxy Health Check Script
# Government-grade monitoring and validation

set -e

# Configuration
HAPROXY_STATS_URL="http://localhost:8404"
API_HEALTH_URL="http://terrafusion-api:5000/health"
MAX_RETRIES=3
RETRY_DELAY=2

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] HEALTH_CHECK: $1"
}

# Check if HAProxy is responding
check_haproxy_stats() {
    log "Checking HAProxy stats endpoint..."
    
    if curl -s -f --max-time 5 "$HAPROXY_STATS_URL" > /dev/null; then
        log "HAProxy stats endpoint is responding"
        return 0
    else
        log "ERROR: HAProxy stats endpoint is not responding"
        return 1
    fi
}

# Check backend services health
check_backend_health() {
    log "Checking backend services health..."
    
    # Check main API health
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s -f --max-time 5 "$API_HEALTH_URL" > /dev/null; then
            log "Backend API is healthy"
            return 0
        else
            log "Backend API check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    log "ERROR: Backend API is not healthy after $MAX_RETRIES attempts"
    return 1
}

# Check HAProxy process
check_haproxy_process() {
    log "Checking HAProxy process..."
    
    if pgrep haproxy > /dev/null; then
        log "HAProxy process is running"
        return 0
    else
        log "ERROR: HAProxy process is not running"
        return 1
    fi
}

# Main health check function
main() {
    log "Starting TerraFusion OS Load Balancer health check..."
    
    # Check HAProxy process
    if ! check_haproxy_process; then
        exit 1
    fi
    
    # Check HAProxy stats
    if ! check_haproxy_stats; then
        exit 1
    fi
    
    # Check backend health (optional - might fail during startup)
    if check_backend_health; then
        log "All health checks passed - Load balancer is healthy"
    else
        log "WARNING: Backend health check failed, but HAProxy is operational"
        # Don't fail the container if backends are starting up
    fi
    
    exit 0
}

# Execute main function
main "$@"