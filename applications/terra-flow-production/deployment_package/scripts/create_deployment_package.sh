#!/bin/bash
# Create a deployment package for GeoAssessmentPro

# Set up variables
DEPLOY_DIR="deployment_package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="GeoAssessmentPro_Deployment_${TIMESTAMP}"

echo "Creating deployment package for GeoAssessmentPro..."

# Create deployment directory
if [ -d "$DEPLOY_DIR" ]; then
    echo "Removing existing deployment directory..."
    rm -rf "$DEPLOY_DIR"
fi

echo "Creating deployment directory structure..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/config"
mkdir -p "$DEPLOY_DIR/logs"
mkdir -p "$DEPLOY_DIR/scripts"

# Copy essential files
echo "Copying application files..."
cp -r ai_agents "$DEPLOY_DIR/"
cp -r api "$DEPLOY_DIR/"
cp -r migrations "$DEPLOY_DIR/"
cp -r static "$DEPLOY_DIR/"
cp -r templates "$DEPLOY_DIR/"
cp *.py "$DEPLOY_DIR/"
cp *.md "$DEPLOY_DIR/"
cp requirements.txt "$DEPLOY_DIR/" 2>/dev/null || pip freeze > "$DEPLOY_DIR/requirements.txt"
cp .env.template "$DEPLOY_DIR/config/"

# Create directory for logs
touch "$DEPLOY_DIR/logs/.gitkeep"

# Copy deployment scripts
cp create_deployment_package.sh "$DEPLOY_DIR/scripts/"
cp deployment_verification.py "$DEPLOY_DIR/scripts/"

# Copy documentation
cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/"
cp RELEASE_NOTES.md "$DEPLOY_DIR/"
cp deployment_checklist.md "$DEPLOY_DIR/"

# Create a manifest file
echo "Creating deployment manifest..."
cat > "$DEPLOY_DIR/manifest.json" << EOF
{
  "name": "GeoAssessmentPro",
  "version": "1.0.0",
  "description": "GeoAssessmentPro - Property Assessment Management System",
  "deployment_date": "$(date -Iseconds)",
  "python_version": "$(python --version | cut -d' ' -f2)"
}
EOF

# Create a tar archive
echo "Creating deployment archive package..."
tar -czf "${PACKAGE_NAME}.tar.gz" "$DEPLOY_DIR"

echo "Deployment package created: ${PACKAGE_NAME}.tar.gz"
echo "The package contains everything needed to deploy GeoAssessmentPro."
echo "Follow the instructions in DEPLOYMENT_GUIDE.md for deployment steps."