#!/bin/bash

# TerraFusion Master Control Center Deployment Script
# Target: terrafusionmarket.io

echo "🚀 TERRAFUSION CHAMPIONSHIP DEPLOYMENT"
echo "======================================"
echo "Target: terrafusionmarket.io"
echo "Package: terrafusion-championship-deployment.tar.gz"
echo ""

# Check if package exists
if [ ! -f "terrafusion-championship-deployment.tar.gz" ]; then
    echo "❌ Error: Deployment package not found!"
    exit 1
fi

echo "📦 Package found: $(ls -lh terrafusion-championship-deployment.tar.gz | awk '{print $5}')"
echo ""

# Create deployment directory structure
echo "📁 Preparing deployment structure..."
mkdir -p deployment-staging
cd deployment-staging

# Extract package
echo "📂 Extracting deployment package..."
tar -xzf ../terrafusion-championship-deployment.tar.gz

# Create index.html with proper paths for web deployment
echo "🔧 Configuring for web deployment..."
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/tauri.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TerraFusion Master Control Center</title>
    <meta name="description" content="Master Control Center for 14 Government Applications">
    <script type="module" crossorigin src="/assets/index-bd704578.js"></script>
    <link rel="stylesheet" href="/assets/index-2718f921.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# Create .htaccess for proper routing
echo "🔒 Setting up routing configuration..."
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
EOF

# Create deployment info file
echo "📊 Creating deployment manifest..."
cat > dist/deployment-info.json << EOF
{
  "deployed": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "apps": 14,
  "domain": "terrafusionmarket.io",
  "status": "production"
}
EOF

# Package final deployment
echo "📦 Creating final deployment archive..."
cd dist
tar -czf ../../terrafusion-web-ready.tar.gz .
cd ../..

echo ""
echo "✅ DEPLOYMENT PACKAGE READY"
echo "============================"
echo "File: terrafusion-web-ready.tar.gz"
echo "Size: $(ls -lh terrafusion-web-ready.tar.gz | awk '{print $5}')"
echo ""
echo "📤 DEPLOYMENT STEPS:"
echo "1. Upload to terrafusionmarket.io"
echo "2. Extract in web root directory"
echo "3. Verify .htaccess is enabled"
echo "4. Access https://terrafusionmarket.io"
echo ""
echo "🏆 CHAMPIONSHIP DEPLOYMENT PREPARED!"