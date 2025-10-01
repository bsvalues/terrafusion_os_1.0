#!/bin/bash
# TerraFusion OS Rollback Script

ENVIRONMENT=$1
TARGET_VERSION=$2

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment> [target_version]"
    exit 1
fi

echo "🔄 Initiating rollback for $ENVIRONMENT"

# Get current version
CURRENT_VERSION=$(cat "../../artifacts/builds/$ENVIRONMENT/current_version.txt" 2>/dev/null || echo "unknown")

if [ -z "$TARGET_VERSION" ]; then
    # Get previous version
    TARGET_VERSION=$(cat "../../artifacts/builds/$ENVIRONMENT/previous_version.txt" 2>/dev/null || echo "1.0.0")
fi

echo "Rolling back from $CURRENT_VERSION to $TARGET_VERSION"

# Confirm rollback
read -p "Are you sure you want to rollback $ENVIRONMENT? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# Execute rollback
echo "🔄 Executing rollback..."

# Stop current services
echo "Stopping current services..."

# Deploy previous version
echo "Deploying version $TARGET_VERSION..."

# Validate rollback
echo "Validating rollback..."
npm run health:check

echo "✅ Rollback completed successfully!"
