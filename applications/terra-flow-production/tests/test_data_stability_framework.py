"""
Unit tests for the Data Stability Framework
"""

import unittest
import os
import sys
import json
from unittest.mock import patch, MagicMock, Mock

# Add the parent directory to the path so we can import the application modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_stability_framework import DataStabilityFramework
from data_governance.data_classification import DataClassificationManager
from security.encryption import EncryptionManager
from ai_agents.agent_manager import AIAgentManager

class TestDataStabilityFramework(unittest.TestCase):
    """Test cases for the Data Stability Framework"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create a test configuration
        self.test_config = {
            "log_level": "INFO",
            "components_enabled": {
                "classification": True,
                "sovereignty": True,
                "encryption": True,
                "access_control": True,
                "security_monitoring": True,
                "audit_logging": True,
                "conversion_controls": True,
                "disaster_recovery": True,
                "ai_agents": True
            }
        }
        
        # Mock all the component managers
        self.mock_classification = MagicMock(spec=DataClassificationManager)
        self.mock_encryption = MagicMock(spec=EncryptionManager)
        self.mock_agent_manager = MagicMock(spec=AIAgentManager)
        
        # Patch the imports
        self.classification_patcher = patch('data_stability_framework.DataClassificationManager', 
                                          return_value=self.mock_classification)
        self.encryption_patcher = patch('data_stability_framework.EncryptionManager', 
                                       return_value=self.mock_encryption)
        self.agent_manager_patcher = patch('data_stability_framework.agent_manager', 
                                         return_value=self.mock_agent_manager)
        
        # Start the patches
        self.mock_class_manager = self.classification_patcher.start()
        self.mock_enc_manager = self.encryption_patcher.start()
        self.mock_agent_mgr = self.agent_manager_patcher.start()
    
    def tearDown(self):
        """Tear down test fixtures"""
        # Stop the patches
        self.classification_patcher.stop()
        self.encryption_patcher.stop()
        self.agent_manager_patcher.stop()
    
    def test_init(self):
        """Test framework initialization"""
        # We'll use patch.object to mock the _load_config method
        with patch.object(DataStabilityFramework, '_load_config', return_value=self.test_config):
            # Create framework instance
            framework = DataStabilityFramework()
            
            # Verify that the framework is initialized correctly
            self.assertTrue(framework.initialized)
            self.assertEqual(framework.config, self.test_config)
            
            # Verify that component managers are initialized
            self.mock_class_manager.assert_called_once()
            self.mock_enc_manager.assert_called_once()
    
    def test_load_config(self):
        """Test configuration loading"""
        # Create a temporary config file
        test_config_file = "test_config.json"
        test_config = {
            "log_level": "DEBUG",
            "components_enabled": {
                "classification": True,
                "encryption": True
            }
        }
        
        try:
            # Write the test config to a file
            with open(test_config_file, "w") as f:
                json.dump(test_config, f)
            
            # Create framework instance with the test config
            framework = DataStabilityFramework(config_path=test_config_file)
            
            # Verify that the config was loaded correctly
            self.assertEqual(framework.config["log_level"], "DEBUG")
            self.assertTrue(framework.config["components_enabled"]["classification"])
            self.assertTrue(framework.config["components_enabled"]["encryption"])
            
        finally:
            # Clean up the temporary file
            if os.path.exists(test_config_file):
                os.remove(test_config_file)
    
    def test_check_component_health(self):
        """Test component health checking"""
        # Create a framework instance with mocked dependencies
        with patch.object(DataStabilityFramework, '_load_config', return_value=self.test_config):
            framework = DataStabilityFramework()
            
            # Mock the component health check methods
            with patch.object(framework, '_check_classification_health', 
                             return_value={"status": "healthy", "message": "All good"}):
                with patch.object(framework, '_check_encryption_health', 
                                 return_value={"status": "degraded", "message": "Issues found"}):
                    
                    # Call the health check method
                    framework._check_component_health()
                    
                    # Verify the health check methods were called
                    framework._check_classification_health.assert_called_once()
                    framework._check_encryption_health.assert_called_once()

if __name__ == '__main__':
    unittest.main()