#!/bin/bash
# Start TerraFusion DevOps Pipeline

echo "🚀 Starting TerraFusion DevOps Pipeline..."

# Check Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "❌ Missing Node.js dependencies. Run 'npm install' first."
    exit 1
fi

# Start pipeline orchestrator
npm run start

echo "✅ DevOps pipeline started on http://localhost:\${{TF_API_5002_PORT:-5002}}"
