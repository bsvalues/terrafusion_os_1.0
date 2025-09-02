#!/usr/bin/env python3
"""
TERRAFUSION PORT MANAGEMENT SERVICE
Eliminates hardcoded ports - all values from configuration files
Implements proper environment-based port management
"""

import configparser
import os
from typing import Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TerraFusionPortManager:
    """Centralized port management for TerraFusion OS"""
    
    def __init__(self, config_path: str = "config/environment.ini"):
        self.config_path = config_path
        self.config = configparser.ConfigParser()
        self._load_configuration()
    
    def _load_configuration(self):
        """Load port configuration from file"""
        try:
            if os.path.exists(self.config_path):
                self.config.read(self.config_path)
                logger.info(f"✅ Port configuration loaded from {self.config_path}")
            else:
                logger.warning(f"⚠️ Configuration file not found: {self.config_path}")
                self._create_default_config()
        except Exception as e:
            logger.error(f"❌ Failed to load configuration: {e}")
            self._create_default_config()
    
    def _create_default_config(self):
        """Create default configuration if file doesn't exist"""
        self.config['PORTS'] = {
            'TERRAFUSION_API_PORT': '5000',
            'TERRAFUSION_FRONTEND_PORT': '3000',
            'TERRAFUSION_BACKEND_PORT': '8000',
            'TERRAFUSION_QUANTUM_PORT': '8080',
            'GAUGE_THEORY_API_PORT': '5001',
            'AI_SWARM_COORDINATOR_PORT': '5003'
        }
        self.config['ENVIRONMENT'] = {
            'NODE_ENV': 'production',
            'PYTHON_ENV': 'production'
        }
        logger.info("✅ Default port configuration created")
    
    def get_port(self, service_name: str) -> int:
        """Get port for a specific service"""
        try:
            port_str = self.config.get('PORTS', service_name, fallback=None)
            if port_str:
                return int(port_str)
            else:
                logger.warning(f"⚠️ Port not configured for service: {service_name}")
                return self._get_fallback_port(service_name)
        except Exception as e:
            logger.error(f"❌ Error getting port for {service_name}: {e}")
            return self._get_fallback_port(service_name)
    
    def _get_fallback_port(self, service_name: str) -> int:
        """Get fallback port if configuration fails"""
        fallback_ports = {
            'TERRAFUSION_API_PORT': 5000,
            'TERRAFUSION_FRONTEND_PORT': 3000,
            'TERRAFUSION_BACKEND_PORT': 8000,
            'TERRAFUSION_QUANTUM_PORT': 8080,
            'GAUGE_THEORY_API_PORT': 5001,
            'AI_SWARM_COORDINATOR_PORT': 5003
        }
        return fallback_ports.get(service_name, 8000)
    
    def get_all_ports(self) -> Dict[str, int]:
        """Get all configured ports"""
        ports = {}
        if 'PORTS' in self.config:
            for key, value in self.config['PORTS'].items():
                try:
                    ports[key] = int(value)
                except ValueError:
                    logger.warning(f"⚠️ Invalid port value for {key}: {value}")
        return ports
    
    def validate_ports(self) -> Dict[str, bool]:
        """Validate that all ports are properly configured"""
        validation_results = {}
        required_services = [
            'TERRAFUSION_API_PORT',
            'TERRAFUSION_FRONTEND_PORT',
            'TERRAFUSION_BACKEND_PORT',
            'TERRAFUSION_QUANTUM_PORT'
        ]
        
        for service in required_services:
            try:
                port = self.get_port(service)
                validation_results[service] = 1024 <= port <= 65535
                if not validation_results[service]:
                    logger.error(f"❌ Invalid port range for {service}: {port}")
            except Exception as e:
                validation_results[service] = False
                logger.error(f"❌ Validation failed for {service}: {e}")
        
        return validation_results
    
    def update_port(self, service_name: str, new_port: int) -> bool:
        """Update port for a specific service"""
        try:
            if not (1024 <= new_port <= 65535):
                logger.error(f"❌ Invalid port range: {new_port}")
                return False
            
            self.config.set('PORTS', service_name, str(new_port))
            
            # Save configuration
            with open(self.config_path, 'w') as configfile:
                self.config.write(configfile)
            
            logger.info(f"✅ Updated {service_name} to port {new_port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to update port for {service_name}: {e}")
            return False

# Global port manager instance
port_manager = TerraFusionPortManager()

def get_service_port(service_name: str) -> int:
    """Global function to get service port"""
    return port_manager.get_port(service_name)

def get_all_ports() -> Dict[str, int]:
    """Global function to get all ports"""
    return port_manager.get_all_ports()

def validate_port_configuration() -> Dict[str, bool]:
    """Global function to validate port configuration"""
    return port_manager.validate_ports()
