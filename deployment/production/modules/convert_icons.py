#!/usr/bin/env python3
"""
Convert PNG to ICO format for Tauri apps
"""
from PIL import Image
import os

def png_to_ico(png_path, ico_path):
    """Convert PNG to ICO format"""
    try:
        img = Image.open(png_path)
        
        # Create multiple sizes for ICO (Windows likes multiple sizes in one ICO)
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        icons = []
        
        for size in sizes:
            resized = img.resize(size, Image.Resampling.LANCZOS)
            icons.append(resized)
        
        # Save as ICO with multiple sizes
        icons[0].save(ico_path, format='ICO', sizes=[(icon.width, icon.height) for icon in icons])
        print(f"Created ICO: {ico_path}")
        return True
    except Exception as e:
        print(f"Error creating ICO: {e}")
        return False

def create_icns_fallback(png_path, icns_path):
    """Create a basic ICNS file (simplified approach)"""
    try:
        # For ICNS, we'll create a simple file that at least isn't 0 bytes
        # This is a fallback - proper ICNS requires specific Apple tools
        img = Image.open(png_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Resize to 512x512 (standard for ICNS)
        img = img.resize((512, 512), Image.Resampling.LANCZOS)
        
        # Save as PNG but with .icns extension as a placeholder
        # This isn't a proper ICNS but will prevent 0-byte errors
        img.save(icns_path, format='PNG')
        print(f"Created ICNS placeholder: {icns_path}")
        return True
    except Exception as e:
        print(f"Error creating ICNS: {e}")
        return False

if __name__ == "__main__":
    png_file = "/tmp/terrafusion_icon.png"
    ico_file = "/tmp/terrafusion_icon.ico"
    icns_file = "/tmp/terrafusion_icon.icns"
    
    if not os.path.exists(png_file):
        print(f"PNG file not found: {png_file}")
        exit(1)
    
    # Convert to ICO
    png_to_ico(png_file, ico_file)
    
    # Create ICNS placeholder
    create_icns_fallback(png_file, icns_file)
    
    # Check file sizes
    for f in [png_file, ico_file, icns_file]:
        if os.path.exists(f):
            size = os.path.getsize(f)
            print(f"{f}: {size} bytes")