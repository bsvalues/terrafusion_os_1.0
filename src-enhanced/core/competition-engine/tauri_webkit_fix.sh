#!/bin/bash

# SWARM GAMMA - The Builder
# Tauri WebKit 4.1 Compatibility Fix
# 
# This script applies the workaround for systems that have webkit2gtk-4.1 
# but Tauri apps are configured for webkit2gtk-4.0

echo "🔧 SWARM GAMMA - Applying Tauri WebKit 4.1 Compatibility Fix"

# Step 1: Create compatibility pkgconfig files
echo "Creating compatibility pkg-config files..."
mkdir -p ~/.local/lib/pkgconfig

# Copy and modify libsoup-3.0 -> libsoup-2.4
cp /usr/lib/x86_64-linux-gnu/pkgconfig/libsoup-3.0.pc ~/.local/lib/pkgconfig/libsoup-2.4.pc
sed -i 's/Version: .*/Version: 2.62.0/' ~/.local/lib/pkgconfig/libsoup-2.4.pc

# Copy javascriptcoregtk-4.1 -> javascriptcoregtk-4.0
cp /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc ~/.local/lib/pkgconfig/javascriptcoregtk-4.0.pc

# Copy webkit2gtk-4.1 -> webkit2gtk-4.0
cp /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc ~/.local/lib/pkgconfig/webkit2gtk-4.0.pc

# Step 2: Create compatibility library symlinks
echo "Creating compatibility library symlinks..."
mkdir -p ~/.local/lib
cd ~/.local/lib

ln -sf /usr/lib/x86_64-linux-gnu/libwebkit2gtk-4.1.so libwebkit2gtk-4.0.so
ln -sf /usr/lib/x86_64-linux-gnu/libjavascriptcoregtk-4.1.so libjavascriptcoregtk-4.0.so  
ln -sf /usr/lib/x86_64-linux-gnu/libsoup-3.0.so libsoup-2.4.so

# Step 3: Set environment variables for building
export PKG_CONFIG_PATH="/home/bsval/.local/lib/pkgconfig:/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
export LD_LIBRARY_PATH="/home/bsval/.local/lib:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
export LIBRARY_PATH="/home/bsval/.local/lib:/usr/lib/x86_64-linux-gnu:$LIBRARY_PATH"

echo "✅ WebKit compatibility fix applied!"
echo "📋 Use these environment variables when building:"
echo "export PKG_CONFIG_PATH=\"/home/bsval/.local/lib/pkgconfig:/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig\""
echo "export LD_LIBRARY_PATH=\"/home/bsval/.local/lib:/usr/lib/x86_64-linux-gnu:\$LD_LIBRARY_PATH\""
echo "export LIBRARY_PATH=\"/home/bsval/.local/lib:/usr/lib/x86_64-linux-gnu:\$LIBRARY_PATH\""

# Verify the fix
echo "🔍 Verifying compatibility packages:"
pkg-config --exists libsoup-2.4 && echo "  ✅ libsoup-2.4 found" || echo "  ❌ libsoup-2.4 NOT found"
pkg-config --exists javascriptcoregtk-4.0 && echo "  ✅ javascriptcoregtk-4.0 found" || echo "  ❌ javascriptcoregtk-4.0 NOT found"  
pkg-config --exists webkit2gtk-4.0 && echo "  ✅ webkit2gtk-4.0 found" || echo "  ❌ webkit2gtk-4.0 NOT found"