#!/bin/bash

# TerraFusion Dashboard Launcher
# This script starts the TerraFusion interactive model monitoring dashboard

echo "Starting TerraFusion Model Monitoring Dashboard..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed. Please install Python to continue."
    exit 1
fi

# Check for required packages
echo "Checking required packages..."
required_packages=("dash" "plotly")
missing_packages=()

for package in "${required_packages[@]}"; do
    python -c "import $package" 2>/dev/null
    if [ $? -ne 0 ]; then
        missing_packages+=("$package")
    fi
done

# Install missing packages if any
if [ ${#missing_packages[@]} -ne 0 ]; then
    echo "The following packages are required and will be installed: ${missing_packages[@]}"
    pip install ${missing_packages[@]}
fi

# Launch the dashboard
echo "Launching dashboard. Press Ctrl+C to stop."
echo "Once started, access the dashboard at: http://localhost:8050"
echo ""

# Run the dashboard
cd "$(dirname "$0")/.."
python scripts/terrafusion_dash_app.py

# Exit gracefully
echo "Dashboard stopped"
exit 0