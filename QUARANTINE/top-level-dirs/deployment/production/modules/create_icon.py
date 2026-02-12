#!/usr/bin/env python3
"""
Simple script to create a basic icon for Tauri apps
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_terrafusion_icon():
    # Create a 512x512 image with a gradient background
    size = 512
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Create a circular background with TerraFusion colors
    draw = ImageDraw.Draw(image)
    
    # Draw a circular background (blue to green gradient effect)
    center = size // 2
    radius = size // 2 - 20
    
    # Create a simple circular icon with a "T" in the center
    # Background circle - blue
    draw.ellipse([20, 20, size-20, size-20], fill=(31, 81, 255, 255))
    
    # Inner circle - lighter blue
    inner_radius = radius - 60
    draw.ellipse([center-inner_radius, center-inner_radius, 
                 center+inner_radius, center+inner_radius], fill=(100, 150, 255, 255))
    
    # Draw a simple "TF" text for TerraFusion
    try:
        # Try to use a basic font
        font_size = 180
        font = ImageFont.load_default()
        # For systems with truetype fonts
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                pass
        
        # Calculate text position to center it
        text = "TF"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - 20
        
        # Draw white text
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
        
    except Exception as e:
        print(f"Warning: Could not add text to icon: {e}")
        # Just create a simple colored circle
        pass
    
    return image

if __name__ == "__main__":
    try:
        icon = create_terrafusion_icon()
        output_path = "/tmp/terrafusion_icon.png"
        icon.save(output_path, "PNG")
        print(f"Icon created successfully at {output_path}")
        
        # Also create smaller versions
        icon_128 = icon.resize((128, 128), Image.Resampling.LANCZOS)
        icon_128.save("/tmp/terrafusion_icon_128.png", "PNG")
        
        icon_32 = icon.resize((32, 32), Image.Resampling.LANCZOS)
        icon_32.save("/tmp/terrafusion_icon_32.png", "PNG")
        
        print("Created 512x512, 128x128, and 32x32 versions")
        
    except ImportError:
        print("PIL (Pillow) not available. Creating a basic icon using base64...")
        # Fallback: create a simple base64 encoded PNG
        import base64
        
        # This is a tiny 32x32 blue square PNG encoded in base64
        basic_png = b'''
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGWSURBVFhH7ZdBSwJBFMafiS4dPHTp4KFLhw4dOnTo0KFDB7t06dDBQ4cOdujQoUOHDh06dOjQoUOHDh06dOjQoUOHDh06dOjQoUOHDh06dOhQL/8MvN0ZZ2d2Z2ZnZwb/S/wBhBCCEEIIQQgh/wMajQZRFEV0XRdd11EUBaIoQlVVqKqKEEL8BZZlwbIsSJIESZIgSRJkWYZt2xiGAcMw4DgOXNfFMAy0Wi08z4PneZBlGa7rwnEcDMOAYRiw7VGUJMkfYNs2LMuCaZowTROmaUI3dei6Dl3XYZomTNOEZVmwbRu2bcO2bZimCcMwYFkWbNuGZVmwLAuWZcE0TZimCU3TYNs2TNOEaZqwbRu6rkPTNGia/l3Xf0DTNGiaBlVVoaoqVFWFqqpQVRWKokBRFMiyvKt8+wdU/wNVVaEoChRFgSzLkGUZiqJAURQoigJZlv8B0zSh6zp0XYeu69A0DZqmQVVVqKoKVVWhqipUVYWqqlBVFaqqQlEUKIoCRVGgKAokSYIkSZAkCZIkQZIkiKIIURQhiiJEUYQoihBFEYqiQFEUiKIIURQhiiLAy7IsWJYFy7JgWRYsy0JVVRRF+dV/IAr4AhFCCCGEEELIe2AYhqZpNE0jSRIp
        '''
        
        with open("/tmp/terrafusion_icon.png", "wb") as f:
            f.write(base64.b64decode(basic_png.strip()))
        
        print("Created basic fallback icon")