"""
Test cases for the Knowledge Sharing System integration with MCP
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from typing import Dict, Any, List

# Add the project root to the path so we can import from there
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mcp.core import MCP
from mcp.message_broker import MessageBroker
from mcp.agent_protocol import AgentProtocol
from mcp.experience_buffer import ExperienceBuffer
from mcp.status_reporter import StatusReporter
from mcp.knowledge_sharing import KnowledgeSharingSystem, KnowledgeEntry


class TestKnowledgeSharing(unittest.TestCase):
    """Test cases for the Knowledge Sharing System integration"""

    def setUp(self):
        """Set up test fixtures"""
        # Create mock components
        self.message_broker = MagicMock(spec=MessageBroker)
        self.protocol = MagicMock(spec=AgentProtocol)
        self.experience_buffer = MagicMock(spec=ExperienceBuffer)
        self.status_reporter = MagicMock(spec=StatusReporter)
        self.knowledge_sharing = MagicMock(spec=KnowledgeSharingSystem)
        
        # Create MCP instance with mock components
        self.mcp = MCP(
            message_broker=self.message_broker,
            protocol=self.protocol,
            experience_buffer=self.experience_buffer,
            status_reporter=self.status_reporter,
            knowledge_sharing=self.knowledge_sharing
        )
        
        # Create a test agent
        self.agent = MagicMock()
        self.agent.capabilities = ["test"]
        self.agent.status = "normal"
        
        # Register the agent
        self.mcp.register_agent("test_agent", self.agent)

    def test_register_agent_knowledge_sharing(self):
        """Test that agents are registered with the knowledge sharing system when registered with MCP"""
        # Assert that knowledge_sharing.register_agent was called with the correct agent_id
        self.knowledge_sharing.register_agent.assert_called_with("test_agent")

    def test_deregister_agent_knowledge_sharing(self):
        """Test that agents are deregistered from the knowledge sharing system when deregistered from MCP"""
        # Deregister the agent
        self.mcp.deregister_agent("test_agent")
        
        # Assert that knowledge_sharing.unregister_agent was called with the correct agent_id
        self.knowledge_sharing.unregister_agent.assert_called_with("test_agent")

    def test_add_knowledge(self):
        """Test adding a knowledge entry"""
        # Setup mock return value
        mock_entry_id = "test_entry_123"
        self.knowledge_sharing.add_knowledge.return_value = mock_entry_id
        
        # Call the method
        result = self.mcp.add_knowledge(
            agent_id="test_agent",
            title="Test Title",
            content="Test Content",
            entry_type="test",
            tags=["tag1", "tag2"],
            context={"key": "value"},
            references=["ref1", "ref2"]
        )
        
        # Assert results
        self.assertEqual(result, mock_entry_id)
        self.knowledge_sharing.add_knowledge.assert_called_once_with(
            agent_id="test_agent",
            title="Test Title",
            content="Test Content",
            entry_type="test",
            tags=["tag1", "tag2"],
            context={"key": "value"},
            references=["ref1", "ref2"]
        )

    def test_query_knowledge(self):
        """Test querying knowledge entries"""
        # Setup mock return value
        mock_results = [{"id": "entry1", "title": "Title 1"}, {"id": "entry2", "title": "Title 2"}]
        self.knowledge_sharing.query_knowledge.return_value = mock_results
        
        # Call the method
        results = self.mcp.query_knowledge(
            agent_id="test_agent",
            query_text="test query",
            entry_type="test",
            tags=["tag1"],
            limit=10
        )
        
        # Assert results
        self.assertEqual(results, mock_results)
        self.knowledge_sharing.query_knowledge.assert_called_once_with(
            agent_id="test_agent",
            query_text="test query",
            entry_type="test",
            tags=["tag1"],
            limit=10
        )

    def test_get_knowledge_entry(self):
        """Test retrieving a specific knowledge entry"""
        # Setup mock return value
        mock_entry = {"id": "entry1", "title": "Title 1"}
        self.knowledge_sharing.get_entry.return_value = mock_entry
        
        # Call the method
        entry = self.mcp.get_knowledge_entry("entry1")
        
        # Assert results
        self.assertEqual(entry, mock_entry)
        self.knowledge_sharing.get_entry.assert_called_once_with("entry1")

    def test_get_agent_knowledge(self):
        """Test retrieving knowledge entries from a specific agent"""
        # Setup mock return value
        mock_entries = [{"id": "entry1", "title": "Title 1"}]
        self.knowledge_sharing.get_agent_knowledge.return_value = mock_entries
        
        # Call the method
        entries = self.mcp.get_agent_knowledge("test_agent", limit=50)
        
        # Assert results
        self.assertEqual(entries, mock_entries)
        self.knowledge_sharing.get_agent_knowledge.assert_called_once_with("test_agent", 50)

    def test_provide_knowledge_feedback(self):
        """Test providing feedback on a knowledge entry"""
        # Setup mock return value
        self.knowledge_sharing.provide_feedback.return_value = True
        
        # Call the method
        success = self.mcp.provide_knowledge_feedback(
            agent_id="test_agent",
            entry_id="entry1",
            rating=4.5,
            feedback_text="Great entry"
        )
        
        # Assert results
        self.assertTrue(success)
        self.knowledge_sharing.provide_feedback.assert_called_once_with(
            agent_id="test_agent",
            entry_id="entry1",
            rating=4.5,
            feedback_text="Great entry"
        )

    def test_error_handling_in_add_knowledge(self):
        """Test error handling when adding knowledge"""
        # Setup mock to raise an exception
        self.knowledge_sharing.add_knowledge.side_effect = Exception("Test error")
        
        # Call the method
        result = self.mcp.add_knowledge(
            agent_id="test_agent",
            title="Test Title",
            content="Test Content",
            entry_type="test"
        )
        
        # Assert results
        self.assertIsNone(result)

    def test_invalid_agent_in_add_knowledge(self):
        """Test adding knowledge with an invalid agent ID"""
        # Call the method with an invalid agent ID
        result = self.mcp.add_knowledge(
            agent_id="nonexistent_agent",
            title="Test Title",
            content="Test Content",
            entry_type="test"
        )
        
        # Assert that the method returns None
        self.assertIsNone(result)
        
        # Assert that add_knowledge was not called
        self.knowledge_sharing.add_knowledge.assert_not_called()


if __name__ == '__main__':
    unittest.main()