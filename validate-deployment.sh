#!/bin/bash
# Quick validation of the TerraFusion deployment script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-terrafusion.sh"

echo "=== TerraFusion Deployment Script Validation ==="
echo ""

# Test 1: Script exists and is executable
echo "✓ Testing script existence and permissions..."
if [ ! -f "$DEPLOY_SCRIPT" ]; then
    echo "❌ Deploy script not found: $DEPLOY_SCRIPT"
    exit 1
fi

if [ ! -x "$DEPLOY_SCRIPT" ]; then
    echo "❌ Deploy script is not executable"
    exit 1
fi

# Test 2: Help function works
echo "✓ Testing help function..."
if ! "$DEPLOY_SCRIPT" --help > /dev/null; then
    echo "❌ Help function failed"
    exit 1
fi

# Test 3: Validate-only mode
echo "✓ Testing validate-only mode..."
if ! "$DEPLOY_SCRIPT" --validate-only > /dev/null 2>&1; then
    echo "❌ Validate-only mode failed"
    exit 1
fi

# Test 4: Check Docker Compose file validation
echo "✓ Testing Docker Compose validation..."
if [ -f "$SCRIPT_DIR/docker-compose.production.yml" ]; then
    if ! docker-compose -f "$SCRIPT_DIR/docker-compose.production.yml" config > /dev/null 2>&1; then
        echo "❌ Docker Compose file is invalid"
        exit 1
    fi
else
    echo "❌ Docker Compose production file not found"
    exit 1
fi

# Test 5: Check required directories exist
echo "✓ Testing required directory structure..."
required_dirs=(
    "consul-config"
    "rabbitmq-config"
    "monitoring"
    "message-coordinator"
    "progress-monitor"
    "ai-swarm-supreme-commander"
    "backup-manager"
    "tests"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$SCRIPT_DIR/$dir" ]; then
        echo "❌ Required directory missing: $dir"
        exit 1
    fi
done

# Test 6: Check configuration files
echo "✓ Testing configuration files..."
config_files=(
    "consul-config/consul.json"
    "rabbitmq-config/rabbitmq.conf"
    "monitoring/prometheus.yml"
)

for file in "${config_files[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$file" ]; then
        echo "❌ Required config file missing: $file"
        exit 1
    fi
done

# Test 7: Check Dockerfiles
echo "✓ Testing Dockerfiles..."
dockerfiles=(
    "message-coordinator/Dockerfile"
    "progress-monitor/Dockerfile"
    "ai-swarm-supreme-commander/Dockerfile"
    "backup-manager/Dockerfile"
)

for dockerfile in "${dockerfiles[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$dockerfile" ]; then
        echo "❌ Required Dockerfile missing: $dockerfile"
        exit 1
    fi
done

# Test 8: Test script syntax
echo "✓ Testing script syntax..."
if ! bash -n "$DEPLOY_SCRIPT"; then
    echo "❌ Deploy script has syntax errors"
    exit 1
fi

echo ""
echo "🎉 All validation tests passed!"
echo ""
echo "The TerraFusion OS 2.0 deployment infrastructure is ready!"
echo ""
echo "Usage examples:"
echo "  ./deploy-terrafusion.sh                    # Full production deployment"
echo "  ./deploy-terrafusion.sh --help             # Show help"
echo "  ./deploy-terrafusion.sh --validate-only    # Validate configuration only"
echo "  ./deploy-terrafusion.sh --force-rebuild    # Force rebuild all images"
echo ""
echo "Access points after deployment:"
echo "  • Consul UI:           http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo "  • Kong Admin:          http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo "  • RabbitMQ Management: http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo "  • Progress Monitor:    http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo "  • Supreme Commander:   http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo "  • Prometheus:          http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo "  • Grafana:             http://localhost:\${{TF_CONSUL_PORT:-8500}}"
echo ""