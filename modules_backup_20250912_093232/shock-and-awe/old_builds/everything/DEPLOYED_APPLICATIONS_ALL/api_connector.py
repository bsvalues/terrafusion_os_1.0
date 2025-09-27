#!/usr/bin/env python3
"""
TerraFusion API Connector - Unified Data Access
Execute with Excellence - No Workarounds
"""

import requests
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class TerraFusionAPI:
    def __init__(self, base_url: str = "http://localhost:\${{TF_API_5002_PORT:-5002}}"):
        self.base_url = base_url.rstrip('/')
        self.api_base = f"{self.base_url}/api/v1"
        self.session = requests.Session()
        
    def verify_connection(self) -> bool:
        """Verify connection to TerraFusionSync"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_property_data(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get property data from TerraFusionSync"""
        try:
            response = self.session.get(f"{self.api_base}/properties/{property_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get property data: {e}")
            return None
    
    def calculate_ai_valuation(self, property_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Calculate AI-powered valuation"""
        try:
            response = self.session.post(f"{self.api_base}/analytics/valuation", json=property_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to calculate valuation: {e}")
            return None

# Global connector
terrafusion_api = TerraFusionAPI()

def verify_connectivity():
    """Test connectivity"""
    if terrafusion_api.verify_connection():
        print("✅ TerraFusion API: CONNECTED")
        return True
    else:
        print("❌ TerraFusion API: DISCONNECTED")
        return False

if __name__ == "__main__":
    verify_connectivity() 