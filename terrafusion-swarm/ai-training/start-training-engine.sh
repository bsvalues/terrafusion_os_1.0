#!/bin/bash
# Start TerraFusion AI Training Engine

echo "🤖 Starting TerraFusion AI Training Engine..."

# Check Python dependencies
python3 -c "import tensorflow, torch, sklearn, numpy, pandas" 2>/dev/null || {
    echo "❌ Missing Python dependencies. Run setup.sh first."
    exit 1
}

# Start training engine
python3 training-engine.py

echo "✅ Training engine started successfully"