#!/bin/bash

# TerraFusionPlatform Audit Archive Packager
# This script creates a lean audit archive with real files and directory structure

echo "Packaging TerraFusionPlatform Audit Archive..."

# Create archive directory if it doesn't exist
mkdir -p terrafusion_audit_package

# Copy main manifest file
cp audit_manifest.md terrafusion_audit_package/

# Copy executive summary
cp exports/executive_summary.md terrafusion_audit_package/

# Create directories for audit categories
mkdir -p terrafusion_audit_package/architecture
mkdir -p terrafusion_audit_package/security
mkdir -p terrafusion_audit_package/performance
mkdir -p terrafusion_audit_package/code_quality

# Copy audit reports
cp exports/architecture/architecture_audit.md terrafusion_audit_package/architecture/
cp exports/security/security_audit.md terrafusion_audit_package/security/
cp exports/performance/performance_audit.md terrafusion_audit_package/performance/
cp exports/code_quality/code_quality_audit.md terrafusion_audit_package/code_quality/

# Create readme file
cat > terrafusion_audit_package/README.md << 'EOF'
# TerraFusionPlatform Audit Package

This audit package contains a comprehensive assessment of the TerraFusionPlatform, including:

- Architecture evaluation
- Security analysis
- Performance testing results
- Code quality assessment

## Package Contents

- `audit_manifest.md` - Overview of the project structure
- `executive_summary.md` - Summary of key findings and recommendations
- `/architecture` - Architecture analysis and diagrams
- `/security` - Security audit findings and recommendations
- `/performance` - Performance metrics and optimization suggestions
- `/code_quality` - Code quality assessment and best practices

## How to Use This Package

1. Start with the `executive_summary.md` for a high-level overview
2. Review the `audit_manifest.md` to understand the project structure
3. Explore each subdirectory for detailed analysis in specific areas
4. Use the recommendations to prioritize improvements

For questions or clarifications, please contact the audit team.
EOF

echo "Audit package created successfully in terrafusion_audit_package/"
echo "To create a compressed archive, run: tar -czvf terrafusion_audit.tar.gz terrafusion_audit_package/"