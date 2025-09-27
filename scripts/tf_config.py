#!/usr/bin/env python3
"""
TerraFusion Dynamic Configuration Loader
Provides centralized configuration management for all Python scripts
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import logging

class TerraFusionConfig:
    """Centralized configuration manager for TerraFusion OS"""
    
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path) if base_path else Path(__file__).parent.parent
        self._config_cache = {}
        self.logger = logging.getLogger(__name__)
        
    def load_ai_swarm_config(self) -> Dict[str, Any]:
        """Load AI swarm configuration with agent counts and capabilities"""
        config_path = self.base_path / "configs" / "ai-swarm-config.json"
        return self._load_config_file(config_path, "ai_swarm")
    
    def load_terrafusion_config(self) -> Dict[str, Any]:
        """Load main TerraFusion system configuration"""
        config_path = self.base_path / "terrafusion-config.json"
        return self._load_config_file(config_path, "terrafusion")
    
    def load_env_config(self) -> Dict[str, str]:
        """Load environment variables from .env file"""
        env_path = self.base_path / ".env"
        env_config = {}
        
        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # Remove quotes if present
                        value = value.strip('"\'')
                        env_config[key] = value
        
        # Override with actual environment variables
        env_config.update(os.environ)
        return env_config
    
    def load_county_config(self, county_name: Optional[str] = None) -> Dict[str, Any]:
        """Load county-specific configuration"""
        env_config = self.load_env_config()
        if not county_name:
            county_name = env_config.get('COUNTY_NAME', 'Benton County, WA')
        
        # Map county names to config files
        county_mapping = {
            'Benton County, WA': 'benton-county-deployment.yaml',
            'San Juan County, WA': 'sanjuan-county-deployment.yaml',
            'King County, WA': 'king-county-deployment.yaml'
        }
        
        config_file = county_mapping.get(county_name, 'benton-county-deployment.yaml')
        config_path = self.base_path / "configs" / config_file
        
        if config_path.exists():
            return self._load_config_file(config_path, f"county_{county_name}")
        else:
            # Return default county configuration
            return {
                "name": county_name,
                "properties": 89447,
                "agents": {
                    "field_generals": 1220,
                    "operational_forces": 48779
                }
            }
    
    def get_ports(self) -> Dict[str, int]:
        """Get dynamic port configuration"""
        env_config = self.load_env_config()
        
        return {
            "api": int(env_config.get('TF_API_PORT', 5046)),
            "frontend": int(env_config.get('TF_FRONTEND_PORT', 3102)),
            "shell": int(env_config.get('TF_SHELL_PORT', 3103)),
            "desktop": int(env_config.get('TF_DESKTOP_PORT', 3104)),
            "static": int(env_config.get('TF_STATIC_PORT', 8080))
        }
    
    def get_agent_counts(self) -> Dict[str, int]:
        """Get current AI agent distribution"""
        ai_config = self.load_ai_swarm_config()
        agents = ai_config.get('agents', {})
        
        return {
            "total": ai_config.get('deployment', {}).get('total_agents', 50000),
            "supreme_commander": agents.get('supreme_commander_claude', 1),
            "field_generals": agents.get('field_generals', 1220),
            "operational_forces": agents.get('operational_forces', 48779),
            "claude_flow_hive_minds": agents.get('claude_flow_hive_minds', 240),
            "neural_cognitive_systems": agents.get('neural_cognitive_systems', 27)
        }
    
    def get_pricing_config(self) -> Dict[str, Any]:
        """Get marketplace pricing configuration"""
        terrafusion_config = self.load_terrafusion_config()
        
        # Check if pricing is in config, otherwise use environment
        pricing = terrafusion_config.get('marketplace', {}).get('pricing', {})
        
        if not pricing:
            env_config = self.load_env_config()
            pricing = {
                "base_subscription": int(env_config.get('BASE_SUBSCRIPTION', 477)),
                "marketplace_arpu": int(env_config.get('MARKETPLACE_ARPU', 142)),
                "total_monthly": int(env_config.get('TOTAL_MONTHLY', 619))
            }
        
        return pricing
    
    def get_county_properties(self, county_name: Optional[str] = None) -> int:
        """Get property count for specific county"""
        county_config = self.load_county_config(county_name)
        
        # Map county names to property counts from real data
        county_properties = {
            'Benton County, WA': 94149,
            'San Juan County, WA': 18000,
            'King County, WA': 890000,
            'Pierce County, WA': 378000,
            'Snohomish County, WA': 312000
        }
        
        env_config = self.load_env_config()
        current_county = county_name or env_config.get('COUNTY_NAME', 'Benton County, WA')
        
        return county_properties.get(current_county, county_config.get('properties', 89447))
    
    def get_api_urls(self) -> Dict[str, str]:
        """Get dynamic API endpoint URLs"""
        ports = self.get_ports()
        env_config = self.load_env_config()
        
        host = env_config.get('API_HOST', 'localhost')
        
        return {
            "api_base": f"http://{host}:{ports['api']}",
            "health": f"http://{host}:{ports['api']}/health",
            "ai_swarm_status": f"http://{host}:{ports['api']}/ai-swarm/status",
            "performance_metrics": f"http://{host}:{ports['api']}/performance/metrics",
            "modules_status": f"http://{host}:{ports['api']}/modules/status",
            "frontend": f"http://{host}:{ports['frontend']}",
            "shell": f"http://{host}:{ports['shell']}"
        }
    
    def _load_config_file(self, config_path: Path, cache_key: str) -> Dict[str, Any]:
        """Load and cache configuration file"""
        if cache_key in self._config_cache:
            return self._config_cache[cache_key]
        
        try:
            if config_path.exists():
                with open(config_path, 'r') as f:
                    if config_path.suffix.lower() == '.json':
                        config = json.load(f)
                    elif config_path.suffix.lower() in ['.yaml', '.yml']:
                        try:
                            import yaml
                            config = yaml.safe_load(f)
                        except ImportError:
                            self.logger.warning(f"YAML library not available, skipping {config_path}")
                            config = {}
                    else:
                        config = {}
                
                self._config_cache[cache_key] = config
                return config
            else:
                self.logger.warning(f"Configuration file not found: {config_path}")
                return {}
                
        except Exception as e:
            self.logger.error(f"Error loading config {config_path}: {e}")
            return {}
    
    def refresh_cache(self):
        """Clear configuration cache to force reload"""
        self._config_cache.clear()

# Global configuration instance
tf_config = TerraFusionConfig()

# Convenience functions for common operations
def get_agent_counts() -> Dict[str, int]:
    """Get current AI agent distribution"""
    return tf_config.get_agent_counts()

def get_ports() -> Dict[str, int]:
    """Get dynamic port configuration"""
    return tf_config.get_ports()

def get_api_urls() -> Dict[str, str]:
    """Get dynamic API endpoint URLs"""
    return tf_config.get_api_urls()

def get_county_properties(county_name: Optional[str] = None) -> int:
    """Get property count for specific county"""
    return tf_config.get_county_properties(county_name)

def get_pricing_config() -> Dict[str, Any]:
    """Get marketplace pricing configuration"""
    return tf_config.get_pricing_config()

if __name__ == "__main__":
    # Test configuration loading
    print("🔧 TerraFusion Dynamic Configuration Test")
    print("=" * 50)
    
    print("AI Agent Counts:")
    agents = get_agent_counts()
    for key, value in agents.items():
        print(f"  {key}: {value:,}")
    
    print("\nPorts:")
    ports = get_ports()
    for key, value in ports.items():
        print(f"  {key}: {value}")
    
    print("\nAPI URLs:")
    urls = get_api_urls()
    for key, value in urls.items():
        print(f"  {key}: {value}")
    
    print(f"\nCounty Properties: {get_county_properties():,}")
    
    print("\nPricing:")
    pricing = get_pricing_config()
    for key, value in pricing.items():
        print(f"  {key}: ${value}")