#!/bin/bash
# fix-git-config.sh - Clean up Git configuration warnings for TerraFusion OS

set -e

echo "🧹 Cleaning Git configuration warnings..."

# Remove all Windows D:/ and E:/ drive safe.directory entries
echo "Removing Windows path entries from git config..."
git config --global --unset-all safe.directory 2>/dev/null || echo "No safe.directory entries found to remove"

# Add current workspace as safe directory
echo "Adding current workspace as safe directory..."
git config --global --add safe.directory "/workspaces/terrafusion_os_1.0"

# Set up optimal git configuration for TerraFusion OS development
echo "Setting up optimal git configuration..."
git config --global user.name "${GIT_AUTHOR_NAME:-TerraFusion-Developer}" 2>/dev/null || true
git config --global user.email "${GIT_AUTHOR_EMAIL:-dev@terrafusion.gov}" 2>/dev/null || true

# Configure git for better performance in large repositories
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256

# Configure git for TerraFusion OS workflow
git config --global pull.rebase false
git config --global init.defaultBranch main
git config --global push.default simple

# Configure git to work well with VS Code
git config --global diff.tool vscode
git config --global merge.tool vscode

echo "✅ Git configuration cleaned and optimized for TerraFusion OS"
echo "📊 Current git config:"
git config --global --list | head -10
