"""
Test cases for the Knowledge Sharing System core implementation
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch
import time
from typing import Dict, Any, List

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mcp.knowledge_sharing import KnowledgeEntry, KnowledgeBase, KnowledgeSharingSystem
from mcp.message_broker import MessageBroker


class TestKnowledgeBase(unittest.TestCase):
    """Test cases for the KnowledgeBase class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.knowledge_base = KnowledgeBase()
        
        # Create sample entries
        self.entry1 = KnowledgeEntry(
            entry_id="entry1",
            title="Test Entry 1",
            content="This is test content 1",
            entry_type="insight",
            source_agent_id="agent1",
            tags=["test", "insight"],
            context={"key1": "value1"},
            references=[]
        )
        
        self.entry2 = KnowledgeEntry(
            entry_id="entry2",
            title="Test Entry 2",
            content="This is test content 2",
            entry_type="warning",
            source_agent_id="agent2",
            tags=["test", "warning"],
            context={"key2": "value2"},
            references=["entry1"]
        )
    
    def test_add_entry(self):
        """Test adding entries to the knowledge base"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Check that entries were added correctly
        self.assertEqual(len(self.knowledge_base.entries), 2)
        self.assertEqual(self.knowledge_base.entries["entry1"], self.entry1)
        self.assertEqual(self.knowledge_base.entries["entry2"], self.entry2)
        
        # Check indexes
        self.assertIn("entry1", self.knowledge_base.entry_by_agent["agent1"])
        self.assertIn("entry2", self.knowledge_base.entry_by_agent["agent2"])
        self.assertIn("entry1", self.knowledge_base.entry_by_type["insight"])
        self.assertIn("entry2", self.knowledge_base.entry_by_type["warning"])
        self.assertIn("entry1", self.knowledge_base.entry_by_tag["test"])
        self.assertIn("entry2", self.knowledge_base.entry_by_tag["test"])
        self.assertIn("entry1", self.knowledge_base.entry_by_tag["insight"])
        self.assertIn("entry2", self.knowledge_base.entry_by_tag["warning"])
        self.assertIn("entry1", self.knowledge_base.references["entry2"])
    
    def test_get_entry(self):
        """Test retrieving entries from the knowledge base"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Get entries
        retrieved_entry1 = self.knowledge_base.get_entry("entry1")
        retrieved_entry2 = self.knowledge_base.get_entry("entry2")
        
        # Check retrieved entries
        self.assertEqual(retrieved_entry1, self.entry1)
        self.assertEqual(retrieved_entry2, self.entry2)
        
        # Try to get a non-existent entry
        self.assertIsNone(self.knowledge_base.get_entry("nonexistent"))
    
    def test_get_entries_by_agent(self):
        """Test retrieving entries by agent"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Get entries by agent
        agent1_entries = self.knowledge_base.get_entries_by_agent("agent1")
        agent2_entries = self.knowledge_base.get_entries_by_agent("agent2")
        
        # Check retrieved entries
        self.assertEqual(len(agent1_entries), 1)
        self.assertEqual(agent1_entries[0], self.entry1)
        self.assertEqual(len(agent2_entries), 1)
        self.assertEqual(agent2_entries[0], self.entry2)
        
        # Try to get entries for a non-existent agent
        self.assertEqual(self.knowledge_base.get_entries_by_agent("nonexistent"), [])
    
    def test_get_entries_by_type(self):
        """Test retrieving entries by type"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Get entries by type
        insight_entries = self.knowledge_base.get_entries_by_type("insight")
        warning_entries = self.knowledge_base.get_entries_by_type("warning")
        
        # Check retrieved entries
        self.assertEqual(len(insight_entries), 1)
        self.assertEqual(insight_entries[0], self.entry1)
        self.assertEqual(len(warning_entries), 1)
        self.assertEqual(warning_entries[0], self.entry2)
        
        # Try to get entries for a non-existent type
        self.assertEqual(self.knowledge_base.get_entries_by_type("nonexistent"), [])
    
    def test_get_entries_by_tag(self):
        """Test retrieving entries by tag"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Get entries by tag
        test_entries = self.knowledge_base.get_entries_by_tag("test")
        insight_entries = self.knowledge_base.get_entries_by_tag("insight")
        warning_entries = self.knowledge_base.get_entries_by_tag("warning")
        
        # Check retrieved entries
        self.assertEqual(len(test_entries), 2)
        self.assertIn(self.entry1, test_entries)
        self.assertIn(self.entry2, test_entries)
        self.assertEqual(len(insight_entries), 1)
        self.assertEqual(insight_entries[0], self.entry1)
        self.assertEqual(len(warning_entries), 1)
        self.assertEqual(warning_entries[0], self.entry2)
        
        # Try to get entries for a non-existent tag
        self.assertEqual(self.knowledge_base.get_entries_by_tag("nonexistent"), [])
    
    def test_get_referencing_entries(self):
        """Test retrieving entries that reference another entry"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Get referencing entries
        referencing_entries = self.knowledge_base.get_referencing_entries("entry1")
        
        # Check retrieved entries
        self.assertEqual(len(referencing_entries), 1)
        self.assertEqual(referencing_entries[0], self.entry2)
        
        # Try to get referencing entries for a non-existent entry
        self.assertEqual(self.knowledge_base.get_referencing_entries("nonexistent"), [])
    
    def test_remove_entry(self):
        """Test removing entries from the knowledge base"""
        # Add entries
        self.knowledge_base.add_entry(self.entry1)
        self.knowledge_base.add_entry(self.entry2)
        
        # Remove an entry
        self.knowledge_base.remove_entry("entry1")
        
        # Check that the entry was removed
        self.assertNotIn("entry1", self.knowledge_base.entries)
        self.assertNotIn("entry1", self.knowledge_base.entry_by_agent["agent1"])
        self.assertNotIn("entry1", self.knowledge_base.entry_by_type["insight"])
        self.assertNotIn("entry1", self.knowledge_base.entry_by_tag["test"])
        self.assertNotIn("entry1", self.knowledge_base.entry_by_tag["insight"])
        
        # Check that references were updated
        self.assertEqual(self.knowledge_base.references["entry2"], [])
        
        # Try to remove a non-existent entry (should not raise an exception)
        self.knowledge_base.remove_entry("nonexistent")


class TestKnowledgeSharingSystem(unittest.TestCase):
    """Test cases for the KnowledgeSharingSystem class"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create mock message broker
        self.message_broker = MagicMock(spec=MessageBroker)
        
        # Create the knowledge sharing system
        self.knowledge_system = KnowledgeSharingSystem(message_broker=self.message_broker)
        
        # Register test agents
        self.knowledge_system.register_agent("agent1")
        self.knowledge_system.register_agent("agent2")
    
    def test_add_knowledge(self):
        """Test adding knowledge entries"""
        # Add a knowledge entry
        entry_id = self.knowledge_system.add_knowledge(
            agent_id="agent1",
            title="Test Entry",
            content="This is test content",
            entry_type="insight",
            tags=["test", "insight"],
            context={"key": "value"},
            references=[]
        )
        
        # Check that an entry ID was returned
        self.assertIsNotNone(entry_id)
        
        # Check that the entry was added to the knowledge base
        entry = self.knowledge_system.get_entry(entry_id)
        self.assertIsNotNone(entry)
        self.assertEqual(entry["title"], "Test Entry")
        self.assertEqual(entry["content"], "This is test content")
        self.assertEqual(entry["entry_type"], "insight")
        self.assertEqual(entry["source_agent_id"], "agent1")
        self.assertEqual(entry["tags"], ["test", "insight"])
        self.assertEqual(entry["context"], {"key": "value"})
        self.assertEqual(entry["references"], [])
        
        # Check that a message was published
        self.message_broker.publish.assert_called_once()
    
    def test_query_knowledge(self):
        """Test querying knowledge entries"""
        # Add sample entries
        entry1_id = self.knowledge_system.add_knowledge(
            agent_id="agent1",
            title="Test Entry 1",
            content="This is test content 1",
            entry_type="insight",
            tags=["test", "insight"]
        )
        
        entry2_id = self.knowledge_system.add_knowledge(
            agent_id="agent2",
            title="Test Entry 2",
            content="This is test content 2",
            entry_type="warning",
            tags=["test", "warning"]
        )
        
        # Query by agent
        agent1_entries = self.knowledge_system.query_knowledge(
            agent_id="agent1",
            query_text="",
            entry_type="",
            tags=[]
        )
        self.assertEqual(len(agent1_entries), 1)
        self.assertEqual(agent1_entries[0]["entry_id"], entry1_id)
        
        # Query by entry type
        warning_entries = self.knowledge_system.query_knowledge(
            agent_id="agent1",
            query_text="",
            entry_type="warning",
            tags=[]
        )
        self.assertEqual(len(warning_entries), 1)
        self.assertEqual(warning_entries[0]["entry_id"], entry2_id)
        
        # Query by tag
        test_entries = self.knowledge_system.query_knowledge(
            agent_id="agent1",
            query_text="",
            entry_type="",
            tags=["test"]
        )
        self.assertEqual(len(test_entries), 2)
        
        # Query by text
        content1_entries = self.knowledge_system.query_knowledge(
            agent_id="agent1",
            query_text="content 1",
            entry_type="",
            tags=[]
        )
        self.assertEqual(len(content1_entries), 1)
        self.assertEqual(content1_entries[0]["entry_id"], entry1_id)
    
    def test_get_agent_knowledge(self):
        """Test retrieving knowledge entries for a specific agent"""
        # Add sample entries
        entry1_id = self.knowledge_system.add_knowledge(
            agent_id="agent1",
            title="Test Entry 1",
            content="This is test content 1",
            entry_type="insight",
            tags=["test", "insight"]
        )
        
        entry2_id = self.knowledge_system.add_knowledge(
            agent_id="agent2",
            title="Test Entry 2",
            content="This is test content 2",
            entry_type="warning",
            tags=["test", "warning"]
        )
        
        # Get agent knowledge
        agent1_entries = self.knowledge_system.get_agent_knowledge("agent1")
        agent2_entries = self.knowledge_system.get_agent_knowledge("agent2")
        
        # Check retrieved entries
        self.assertEqual(len(agent1_entries), 1)
        self.assertEqual(agent1_entries[0]["entry_id"], entry1_id)
        self.assertEqual(len(agent2_entries), 1)
        self.assertEqual(agent2_entries[0]["entry_id"], entry2_id)
    
    def test_provide_feedback(self):
        """Test providing feedback on knowledge entries"""
        # Add a knowledge entry
        entry_id = self.knowledge_system.add_knowledge(
            agent_id="agent1",
            title="Test Entry",
            content="This is test content",
            entry_type="insight",
            tags=["test"]
        )
        
        # Provide feedback
        result = self.knowledge_system.provide_feedback(
            agent_id="agent2",
            entry_id=entry_id,
            rating=4.5,
            feedback_text="Great entry!"
        )
        
        # Check that feedback was provided successfully
        self.assertTrue(result)
        
        # Check that the entry's rating was updated
        entry = self.knowledge_system.get_entry(entry_id)
        self.assertEqual(entry["rating"], 4.5)
        self.assertEqual(entry["rating_count"], 1)
        
        # Check that a message was published
        self.message_broker.publish.assert_called()
    
    def test_get_related_knowledge(self):
        """Test retrieving related knowledge entries"""
        # Add sample entries
        entry1_id = self.knowledge_system.add_knowledge(
            agent_id="agent1",
            title="Test Entry 1",
            content="This is test content 1",
            entry_type="insight",
            tags=["test", "insight"]
        )
        
        entry2_id = self.knowledge_system.add_knowledge(
            agent_id="agent2",
            title="Test Entry 2",
            content="This is test content 2",
            entry_type="warning",
            tags=["test", "warning"],
            references=[entry1_id]
        )
        
        # Get related entries
        related_entries = self.knowledge_system.get_related_knowledge(entry1_id)
        
        # Check retrieved entries
        self.assertEqual(len(related_entries), 1)
        self.assertEqual(related_entries[0]["entry_id"], entry2_id)
    
    def test_unregister_agent(self):
        """Test unregistering an agent"""
        # Add a knowledge entry
        entry_id = self.knowledge_system.add_knowledge(
            agent_id="agent1",
            title="Test Entry",
            content="This is test content",
            entry_type="insight",
            tags=["test"]
        )
        
        # Unregister the agent
        self.knowledge_system.unregister_agent("agent1")
        
        # Check that agent knowledge is still accessible
        entries = self.knowledge_system.get_agent_knowledge("agent1")
        self.assertEqual(len(entries), 1)
        
        # Check that a message was published
        self.message_broker.publish.assert_called()


if __name__ == '__main__':
    unittest.main()