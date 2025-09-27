#!/bin/bash
# TerraFusion AI Training System Health Check

echo "🏥 TerraFusion AI Training System Health Check"
echo "============================================="

# Check directories
echo "📁 Directory structure:"
for dir in training-data models certifications logs exports; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir"
    else
        echo "   ❌ $dir (missing)"
    fi
done

# Check configuration files
echo "⚙️  Configuration files:"
for file in training-config.json package.json; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
    fi
done

# Check Python dependencies
echo "🐍 Python dependencies:"
python3 -c "
import sys
try:
    import tensorflow as tf
    print('   ✅ TensorFlow', tf.__version__)
except:
    print('   ❌ TensorFlow (missing)')

try:
    import torch
    print('   ✅ PyTorch', torch.__version__)
except:
    print('   ❌ PyTorch (missing)')

try:
    import sklearn
    print('   ✅ Scikit-learn', sklearn.__version__)
except:
    print('   ❌ Scikit-learn (missing)')
" 2>/dev/null || echo "   ❌ Python dependency check failed"

# Check Node.js dependencies
echo "📦 Node.js dependencies:"
if [ -d "node_modules" ]; then
    echo "   ✅ Node modules installed"
else
    echo "   ❌ Node modules (run 'npm install')"
fi

# Check ports
echo "🌐 Port availability:"
if ! lsof -i:5001 >/dev/null 2>&1; then
    echo "   ✅ Port \${{TF_API_HTTPS_PORT:-5001}} available"
else
    echo "   ⚠️  Port \${{TF_API_HTTPS_PORT:-5001}} in use"
fi

echo ""
echo "🚀 System ready for AI training operations!"