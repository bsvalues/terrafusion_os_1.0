"""
Unit tests for the AI Agent system
"""

import unittest
import os
import sys
import time
import threading
import queue
from unittest.mock import patch, MagicMock, Mock

# Add the parent directory to the path so we can import the application modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ai_agents.agent_manager import AIAgentManager
from ai_agents.base_agent import AIAgent
from ai_agents.anomaly_detection_agent import AnomalyDetectionAgent


class TestAgentManager(unittest.TestCase):
    """Test cases for the AI Agent Manager"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create a new agent manager instance for each test
        self.agent_manager = AIAgentManager()
        
        # Create a mock agent class
        self.MockAgent = MagicMock(spec=AIAgent)
        
        # Register the mock agent type
        self.agent_manager.register_agent_type("mock_agent", self.MockAgent)
    
    def tearDown(self):
        """Tear down test fixtures"""
        # Stop the agent manager if it's running
        if self.agent_manager.running:
            self.agent_manager.stop()
    
    def test_start_stop(self):
        """Test starting and stopping the agent manager"""
        # Start the agent manager
        self.agent_manager.start()
        self.assertTrue(self.agent_manager.running)
        self.assertTrue(self.agent_manager.monitor_running)
        self.assertIsNotNone(self.agent_manager.monitor_thread)
        
        # Stop the agent manager
        self.agent_manager.stop()
        self.assertFalse(self.agent_manager.running)
        self.assertFalse(self.agent_manager.monitor_running)
    
    def test_register_agent_type(self):
        """Test registering an agent type"""
        # Check that the mock agent type was registered in setUp
        self.assertIn("mock_agent", self.agent_manager.agent_types)
        self.assertEqual(self.agent_manager.agent_types["mock_agent"], self.MockAgent)
        
        # Register another agent type
        mock_agent2 = MagicMock()
        self.agent_manager.register_agent_type("mock_agent2", mock_agent2)
        self.assertIn("mock_agent2", self.agent_manager.agent_types)
        self.assertEqual(self.agent_manager.agent_types["mock_agent2"], mock_agent2)
    
    def test_create_agent(self):
        """Test creating an agent"""
        # Create a mock agent instance
        mock_agent_instance = MagicMock()
        self.MockAgent.return_value = mock_agent_instance
        mock_agent_instance.agent_id = "test_agent_id"
        mock_agent_instance.name = "Test Agent"
        mock_agent_instance.status = "initialized"
        
        # Create an agent
        agent = self.agent_manager.create_agent(
            agent_type="mock_agent",
            name="Test Agent",
            description="Test agent description"
        )
        
        # Verify that the agent was created and registered
        self.assertEqual(agent, mock_agent_instance)
        self.assertIn(mock_agent_instance.agent_id, self.agent_manager.agents)
        self.assertEqual(self.agent_manager.agents[mock_agent_instance.agent_id], mock_agent_instance)
        
        # Test creating an agent with an unknown type
        agent = self.agent_manager.create_agent(agent_type="unknown_type")
        self.assertIsNone(agent)


class TestAnomalyDetectionAgent(unittest.TestCase):
    """Test cases for the Anomaly Detection Agent"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create a mock message queue
        self.message_queue = queue.Queue()
        
        # Create mock dependencies
        self.mock_db = MagicMock()
        
        # Create a test agent instance
        self.agent = AnomalyDetectionAgent(
            agent_id="test_agent",
            name="Test Anomaly Agent",
            description="Test anomaly detection agent",
            scan_interval=1  # 1 second for faster testing
        )
        
        # Replace the agent's message queue with our mock
        self.agent.message_queue = self.message_queue
        
        # Mock the database connection
        self.db_patcher = patch('ai_agents.anomaly_detection_agent.db', self.mock_db)
        self.mock_db_connection = self.db_patcher.start()
    
    def tearDown(self):
        """Tear down test fixtures"""
        # Stop the agent if it's running
        if self.agent.status == "running":
            self.agent.stop()
        
        # Stop the patchers
        self.db_patcher.stop()
    
    def test_init(self):
        """Test agent initialization"""
        # Verify the agent is initialized correctly
        self.assertEqual(self.agent.agent_id, "test_agent")
        self.assertEqual(self.agent.name, "Test Anomaly Agent")
        self.assertEqual(self.agent.description, "Test anomaly detection agent")
        self.assertEqual(self.agent.scan_interval, 1)
        self.assertEqual(self.agent.status, "initialized")
        self.assertEqual(self.agent.agent_type, "anomaly_detection")
        
    def test_start_stop(self):
        """Test starting and stopping the agent"""
        # Start the agent
        self.agent.start()
        self.assertEqual(self.agent.status, "running")
        self.assertTrue(self.agent.running)
        self.assertIsNotNone(self.agent.agent_thread)
        
        # Stop the agent
        self.agent.stop()
        self.assertEqual(self.agent.status, "stopped")
        self.assertFalse(self.agent.running)
    
    def test_message_handling(self):
        """Test handling messages"""
        # Start the agent with a mocked _process_messages method
        with patch.object(self.agent, '_process_messages') as mock_process:
            with patch.object(self.agent, '_scan_for_anomalies') as mock_scan:
                self.agent.start()
                
                # Send a test message
                test_message = {
                    "type": "command",
                    "command": "scan_now",
                    "timestamp": time.time()
                }
                self.message_queue.put(test_message)
                
                # Give the agent time to process the message
                time.sleep(0.1)
                
                # Verify the message was processed
                mock_process.assert_called()
                
                # Stop the agent
                self.agent.stop()


if __name__ == '__main__':
    unittest.main()