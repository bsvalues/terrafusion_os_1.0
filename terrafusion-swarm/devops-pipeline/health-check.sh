#!/bin/bash
# TerraFusion DevOps Pipeline Health Check

echo "🏥 TerraFusion DevOps Pipeline Health Check"
echo "=========================================="

# Check directories
echo "📁 Directory structure:"
for dir in pipelines configs scripts tests logs artifacts monitoring; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir"
    else
        echo "   ❌ $dir (missing)"
    fi
done

# Check configuration files
echo "⚙️  Configuration files:"
for file in devops-config.json package.json; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
    fi
done

# Check Node.js dependencies
echo "📦 Node.js dependencies:"
if [ -d "node_modules" ]; then
    echo "   ✅ Node modules installed"
else
    echo "   ❌ Node modules (run 'npm install')"
fi

# Check ports
echo "🌐 Port availability:"
if ! lsof -i:5002 >/dev/null 2>&1; then
    echo "   ✅ Port \${{TF_API_5002_PORT:-5002}} available"
else
    echo "   ⚠️  Port \${{TF_API_5002_PORT:-5002}} in use"
fi

# Check environment configurations
echo "🌍 Environment configurations:"
for env in development staging production; do
    if [ -f "configs/environments/$env.json" ]; then
        echo "   ✅ $env"
    else
        echo "   ❌ $env (missing)"
    fi
done

echo ""
echo "🚀 DevOps pipeline ready for government operations!"
