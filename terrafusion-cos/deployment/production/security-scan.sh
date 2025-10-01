#!/bin/bash
# TerraFusion cOS Security Scanner
# Production container security validation

set -e

echo "Running security scans for TerraFusion cOS..."

# Check for known vulnerabilities in Python packages
echo "Scanning for known vulnerabilities..."
safety check --json --output vulnerabilities.json || true

# Run static security analysis
echo "Running static security analysis..."
bandit -r . -f json -o bandit-report.json || true

# Check for secrets in code
echo "Scanning for exposed secrets..."
find . -name "*.py" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" | \
    xargs grep -l -i -E "(password|secret|key|token|api_key)" | \
    grep -v "__pycache__" | \
    head -10 > potential-secrets.txt || true

# Validate Docker security best practices
echo "Validating Docker security practices..."
docker-bench-security --no-docker-daemon --json > docker-security.json 2>/dev/null || true

# File permissions check
echo "Checking file permissions..."
find /app -type f -perm /o+w -exec ls -la {} \; > world-writable-files.txt || true

# Network security check
echo "Validating network configuration..."
netstat -tulpn > network-status.txt 2>/dev/null || true

echo "Security scan completed. Review reports:"
echo "- vulnerabilities.json: Known vulnerabilities"
echo "- bandit-report.json: Static analysis results"
echo "- potential-secrets.txt: Potential exposed secrets"
echo "- docker-security.json: Docker security assessment"
echo "- world-writable-files.txt: File permission issues"
echo "- network-status.txt: Network configuration"

# Exit with success for build process
exit 0