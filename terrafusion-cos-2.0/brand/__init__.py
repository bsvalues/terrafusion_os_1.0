# TerraFusion cOS Brand System
# Official brand assets and configuration management

__version__ = "1.0.0"
__author__ = "TerraFusion Systems"
__description__ = "Brand configuration and visual identity system"

from .colors import TerraFusionColors
from .typography import TerraFusionTypography  
from .visual_language import TerraFusionVisualLanguage

import json
import os
from pathlib import Path

class TerraFusionBrand:
    """Central brand configuration management for TerraFusion cOS"""
    
    def __init__(self):
        self.config_path = Path(__file__).parent / "brand_config.json"
        self.config = self._load_brand_config()
        
    def _load_brand_config(self):
        """Load brand configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            raise Exception("Brand configuration file not found. Ensure brand_config.json exists.")
        except json.JSONDecodeError:
            raise Exception("Invalid brand configuration JSON format.")
    
    def get_color(self, category, shade="main"):
        """Get brand color by category and shade"""
        return self.config["colors"][category][shade]
    
    def get_typography(self, font_type="primary_font"):
        """Get typography configuration"""
        return self.config["typography"][font_type]
    
    def get_microcopy(self, key):
        """Get brand microcopy text"""
        return self.config["microcopy"][key]
    
    def get_component_style(self, component, variant="primary"):
        """Get component styling configuration"""
        return self.config["components"][component][variant]
    
    @property
    def primary_color(self):
        """Primary brand color (#0099ff)"""
        return self.config["colors"]["primary"]["main"]
    
    @property
    def accent_color(self):
        """Accent brand color (#00ffaa)"""
        return self.config["colors"]["accent"]["main"]
    
    @property
    def tagline(self):
        """Brand tagline: Government. Transcended."""
        return self.config["brand"]["tagline"]
    
    @property
    def system_name(self):
        """System name: TerraFusion cOS"""
        return self.config["brand"]["name"]

# Global brand instance
brand = TerraFusionBrand()

__all__ = [
    'TerraFusionBrand',
    'TerraFusionColors',
    'TerraFusionTypography',
    'TerraFusionVisualLanguage',
    'brand'
]