#!/bin/bash

# 🛡️ BULLETPROOF GATEWAY STARTUP SCRIPT
# Championship-Level Service Mesh Integration
# Government-Grade Zero-Downtime Deployment

set -euo pipefail

# 🎯 Configuration
export TERRAFUSION_SERVICE_NAME="${SERVICE_NAME:-gateway}"
export TERRAFUSION_SERVICE_PORT="${SERVICE_PORT:-5000}"
export TERRAFUSION_MESH_ENABLED="${ISTIO_SIDECAR_ENABLED:-true}"
export ENVOY_ADMIN_PORT="${ENVOY_ADMIN_PORT:-15090}"

# 🎨 Championship Console Output
echo "🛡️ ========================================================"
echo "   TERRAFUSION BULLETPROOF GATEWAY INITIALIZING"
echo "   Government-Grade Service Mesh Integration"
echo "🛡️ ========================================================"
echo ""
echo "🎯 SERVICE: $TERRAFUSION_SERVICE_NAME"
echo "🔌 PORT: $TERRAFUSION_SERVICE_PORT"
echo "🌐 MESH: $TERRAFUSION_MESH_ENABLED"
echo "📊 ENVOY ADMIN: $ENVOY_ADMIN_PORT"
echo ""

# 🔍 Health Check Function
check_service_health() {
    local service_url="$1"
    local max_retries="$2"
    local retry_interval="$3"

    for ((i=1; i<=max_retries; i++)); do
        if curl -f -s "$service_url" > /dev/null 2>&1; then
            echo "✅ Service healthy: $service_url"
            return 0
        fi

        echo "⏳ Health check attempt $i/$max_retries for $service_url"
        sleep "$retry_interval"
    done

    echo "❌ Service failed health check: $service_url"
    return 1
}

# 🌐 Start Envoy Sidecar (if mesh enabled)
start_envoy_sidecar() {
    if [[ "$TERRAFUSION_MESH_ENABLED" == "true" ]]; then
        echo "🌐 Starting Envoy sidecar proxy..."

        # Validate Envoy configuration
        if /usr/local/bin/envoy --mode validate -c /etc/envoy/envoy.yaml; then
            echo "✅ Envoy configuration validated"
        else
            echo "❌ Envoy configuration invalid - continuing without sidecar"
            export TERRAFUSION_MESH_ENABLED="false"
            return 1
        fi

        # Start Envoy in background
        /usr/local/bin/envoy -c /etc/envoy/envoy.yaml &
        export ENVOY_PID=$!
        echo "🚀 Envoy sidecar started (PID: $ENVOY_PID)"

        # Wait for Envoy to be ready
        echo "⏳ Waiting for Envoy sidecar to be ready..."
        if check_service_health "http://localhost:$ENVOY_ADMIN_PORT/ready" 30 2; then
            echo "✅ Envoy sidecar ready"
        else
            echo "⚠️ Envoy sidecar not ready - continuing anyway"
        fi
    else
        echo "⚠️ Service mesh disabled - starting without Envoy sidecar"
    fi
}

# 🔧 Configure Application Settings
configure_application() {
    echo "🔧 Configuring TerraFusion Gateway..."

    # Set environment-specific configurations
    export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Production}"
    export ASPNETCORE_URLS="http://0.0.0.0:$TERRAFUSION_SERVICE_PORT"

    # Circuit breaker configuration
    export CIRCUIT_BREAKER_ENABLED="${CIRCUIT_BREAKER_ENABLED:-true}"
    export CIRCUIT_BREAKER_THRESHOLD="${CIRCUIT_BREAKER_THRESHOLD:-5}"
    export CIRCUIT_BREAKER_TIMEOUT="${CIRCUIT_BREAKER_TIMEOUT:-30000}"

    # Service discovery configuration
    export SERVICE_DISCOVERY_ENABLED="true"
    export CONSUL_HOST="${CONSUL_HOST:-consul}"
    export CONSUL_PORT="${CONSUL_PORT:-8500}"

    # Government compliance settings
    export GOVERNMENT_COMPLIANCE_LEVEL="FISMA-HIGH"
    export AUDIT_LOGGING_ENABLED="true"
    export ENCRYPTION_ENABLED="true"

    echo "✅ Application configuration complete"
}

# 🚀 Start TerraFusion Gateway
start_gateway() {
    echo "🚀 Starting TerraFusion Gateway..."

    # Pre-flight checks
    echo "🔍 Performing pre-flight checks..."

    # Check required environment variables
    if [[ -z "${CONNECTION_STRING:-}" ]]; then
        echo "⚠️ CONNECTION_STRING not set - using default"
        export CONNECTION_STRING="Host=postgres-primary;Database=terrafusion_os;Username=terrafusion;Password=TerraFusion2024!"
    fi

    if [[ -z "${REDIS_CONNECTION:-}" ]]; then
        echo "⚠️ REDIS_CONNECTION not set - using default"
        export REDIS_CONNECTION="redis-primary:6379"
    fi

    # Wait for dependencies
    echo "⏳ Waiting for database connectivity..."
    for ((i=1; i<=30; i++)); do
        if timeout 5 bash -c "</dev/tcp/postgres-primary/5432" 2>/dev/null; then
            echo "✅ Database connectivity confirmed"
            break
        fi
        echo "⏳ Database check attempt $i/30"
        sleep 5
    done

    echo "⏳ Waiting for Redis connectivity..."
    for ((i=1; i<=30; i++)); do
        if timeout 5 bash -c "</dev/tcp/redis-primary/6379" 2>/dev/null; then
            echo "✅ Redis connectivity confirmed"
            break
        fi
        echo "⏳ Redis check attempt $i/30"
        sleep 5
    done

    # Start the .NET application
    echo "🎯 Launching TerraFusion Gateway application..."
    exec dotnet TerraFusion.Gateway.dll
}

# 🛡️ Graceful Shutdown Handler
cleanup() {
    echo ""
    echo "🛡️ Initiating graceful shutdown..."

    if [[ -n "${ENVOY_PID:-}" ]]; then
        echo "🌐 Stopping Envoy sidecar..."
        kill -TERM "$ENVOY_PID" 2>/dev/null || true
        wait "$ENVOY_PID" 2>/dev/null || true
        echo "✅ Envoy sidecar stopped"
    fi

    echo "✅ Bulletproof Gateway shutdown complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# 🎯 Main Execution Flow
main() {
    echo "🚀 Bulletproof Gateway startup initiated..."

    # Configure application
    configure_application

    # Start Envoy sidecar (if enabled)
    start_envoy_sidecar

    # Start the gateway
    start_gateway
}

# Execute main function
main "$@"
