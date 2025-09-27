#!/bin/bash
# Start TerraFusion AI Training Dashboard

echo "📊 Starting TerraFusion AI Training Dashboard..."

# Check Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "❌ Missing Node.js dependencies. Run 'npm install' first."
    exit 1
fi

# Start dashboard
npm run start

echo "✅ Training dashboard started on http://localhost:\${{TF_API_HTTPS_PORT:-5001}}"