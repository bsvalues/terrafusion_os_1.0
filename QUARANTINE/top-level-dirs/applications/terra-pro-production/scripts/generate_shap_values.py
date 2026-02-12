#!/usr/bin/env python3
"""
TerraFusion SHAP Value Generator
Generates sample SHAP values for model explanation
"""

import os
import json
import numpy as np
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Add the project root to the path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Define paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLE_IMAGES_PATH = os.path.join(PROJECT_ROOT, "data", "sample_images")
SHAP_VALUES_PATH = os.path.join(PROJECT_ROOT, "models", "shap_values")

# Ensure directories exist
os.makedirs(SAMPLE_IMAGES_PATH, exist_ok=True)
os.makedirs(SHAP_VALUES_PATH, exist_ok=True)

# Features that influence property condition
FEATURES = [
    "Roof Condition",
    "Exterior Paint",
    "Windows",
    "Siding",
    "Foundation",
    "Landscaping",
    "Driveway",
    "Gutters",
    "Exterior Doors",
    "Overall Cleanliness"
]

# Different condition categories and their baseline scores
CONDITIONS = {
    "excellent": {"base_score": 4.5, "color": (50, 205, 50)},     # Green
    "good": {"base_score": 3.5, "color": (30, 144, 255)},         # DodgerBlue
    "average": {"base_score": 2.5, "color": (255, 165, 0)},       # Orange
    "fair": {"base_score": 1.8, "color": (255, 69, 0)},           # OrangeRed
    "poor": {"base_score": 1.0, "color": (220, 20, 60)}           # Crimson
}

def generate_sample_image(condition, size=(500, 350)):
    """Generate a sample image for a condition category"""
    # Create a colored background based on condition
    color = CONDITIONS[condition]["color"]
    
    # Adjust color to make it lighter (more pastel)
    lighter_color = tuple(min(c + 100, 255) for c in color)
    
    # Create image with gradient background
    img = Image.new('RGB', size, lighter_color)
    draw = ImageDraw.Draw(img)
    
    # Add text
    try:
        # Try to load a font, fall back to default if not available
        font = ImageFont.truetype("arial.ttf", 36)
    except IOError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        except:
            font = ImageFont.load_default()
    
    # Draw text
    condition_text = condition.upper()
    text_width = draw.textlength(condition_text, font=font) if hasattr(draw, 'textlength') else 200
    position = ((size[0] - text_width) // 2, size[1] // 2 - 20)
    
    # Add a semi-transparent box behind text
    text_bbox = (position[0] - 10, position[1] - 10, 
                 position[0] + text_width + 10, position[1] + 50)
    draw.rectangle(text_bbox, fill=(255, 255, 255, 128))
    
    # Draw text
    draw.text(position, condition_text, fill=(0, 0, 0), font=font)
    
    # Add property condition score
    score = CONDITIONS[condition]["base_score"]
    score_text = f"Score: {score}"
    score_width = draw.textlength(score_text, font=font) if hasattr(draw, 'textlength') else 150
    score_position = ((size[0] - score_width) // 2, position[1] + 50)
    draw.text(score_position, score_text, fill=(0, 0, 0), font=font)
    
    return img

def generate_shap_values(condition):
    """Generate sample SHAP values for a property condition"""
    base_score = CONDITIONS[condition]["base_score"]
    
    # Generate random SHAP values based on the condition
    if condition == "excellent":
        # For excellent properties, most features contribute positively
        values = np.random.normal(0.3, 0.2, len(FEATURES))
        # Ensure some features have higher positive impact
        values[0:3] = np.abs(values[0:3]) * 1.5  # Make top features more positive
        
    elif condition == "good":
        # For good properties, mix of positive and slightly negative
        values = np.random.normal(0.2, 0.3, len(FEATURES))
        values[0:2] = np.abs(values[0:2]) * 1.2  # Make top features positive
        values[-2:] = -np.abs(values[-2:]) * 0.5  # Make bottom features negative
        
    elif condition == "average":
        # For average properties, mix of small positive and negative
        values = np.random.normal(0, 0.3, len(FEATURES))
        
    elif condition == "fair":
        # For fair properties, more negative values
        values = np.random.normal(-0.2, 0.3, len(FEATURES))
        values[-3:] = -np.abs(values[-3:]) * 1.2  # Make bottom features more negative
        
    else:  # poor
        # For poor properties, mostly negative values
        values = np.random.normal(-0.3, 0.2, len(FEATURES))
        values[-4:] = -np.abs(values[-4:]) * 1.5  # Make bottom features very negative
    
    # Sort features by absolute value of SHAP values
    abs_values = np.abs(values)
    sorted_indices = np.argsort(abs_values)[::-1]  # Sort in descending order
    sorted_features = [FEATURES[i] for i in sorted_indices]
    sorted_values = [float(values[i]) for i in sorted_indices]
    
    # Take top 6 most important features
    top_features = sorted_features[:6]
    top_values = sorted_values[:6]
    
    # Round values to 2 decimal places
    top_values = [round(v, 2) for v in top_values]
    
    # Calculate final score (base + sum of contributions)
    final_score = round(base_score + sum(top_values), 1)
    # Ensure score is within valid range
    final_score = max(1.0, min(5.0, final_score))
    
    # Create the SHAP data dictionary
    shap_data = {
        "condition": condition,
        "base_score": base_score,
        "final_score": final_score,
        "features": top_features,
        "values": top_values,
        "image_path": os.path.join(SAMPLE_IMAGES_PATH, f"{condition}_condition.png")
    }
    
    return shap_data

def generate_all_samples():
    """Generate SHAP values and sample images for all conditions"""
    all_shap_data = {}
    
    for condition in CONDITIONS.keys():
        # Generate and save sample image
        img = generate_sample_image(condition)
        img_path = os.path.join(SAMPLE_IMAGES_PATH, f"{condition}_condition.png")
        img.save(img_path)
        print(f"Generated sample image for {condition} condition: {img_path}")
        
        # Generate SHAP values
        shap_data = generate_shap_values(condition)
        all_shap_data[condition] = shap_data
        
        # Save individual SHAP values
        shap_path = os.path.join(SHAP_VALUES_PATH, f"{condition}_shap.json")
        with open(shap_path, 'w') as f:
            json.dump(shap_data, f, indent=2)
        print(f"Generated SHAP values for {condition} condition: {shap_path}")
    
    # Save all SHAP values to a single file
    all_shap_path = os.path.join(SHAP_VALUES_PATH, "all_shap_values.json")
    with open(all_shap_path, 'w') as f:
        json.dump(all_shap_data, f, indent=2)
    print(f"Generated combined SHAP values: {all_shap_path}")
    
    return all_shap_data

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Generate sample SHAP values for model explanation")
    parser.add_argument('--condition', choices=CONDITIONS.keys(), help='Generate for specific condition only')
    args = parser.parse_args()
    
    # Create necessary directories
    os.makedirs(SAMPLE_IMAGES_PATH, exist_ok=True)
    os.makedirs(SHAP_VALUES_PATH, exist_ok=True)
    
    if args.condition:
        # Generate for specific condition
        condition = args.condition
        img = generate_sample_image(condition)
        img_path = os.path.join(SAMPLE_IMAGES_PATH, f"{condition}_condition.png")
        img.save(img_path)
        print(f"Generated sample image for {condition} condition: {img_path}")
        
        shap_data = generate_shap_values(condition)
        shap_path = os.path.join(SHAP_VALUES_PATH, f"{condition}_shap.json")
        with open(shap_path, 'w') as f:
            json.dump(shap_data, f, indent=2)
        print(f"Generated SHAP values for {condition} condition: {shap_path}")
    else:
        # Generate for all conditions
        generate_all_samples()
    
    print("Done generating SHAP values and sample images!")

if __name__ == "__main__":
    main()