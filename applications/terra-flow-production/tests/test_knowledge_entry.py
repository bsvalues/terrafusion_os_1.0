"""
Test cases for the KnowledgeEntry class
"""

import sys
import os
import unittest
import time
from typing import Dict, Any, List

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mcp.knowledge_sharing import KnowledgeEntry


class TestKnowledgeEntry(unittest.TestCase):
    """Test cases for the KnowledgeEntry class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.entry = KnowledgeEntry(
            entry_id="test_entry",
            title="Test Entry",
            content="This is test content",
            entry_type="insight",
            source_agent_id="test_agent",
            tags=["test", "insight"],
            context={"key": "value"},
            references=["ref1", "ref2"]
        )
    
    def test_initialization(self):
        """Test basic initialization of a KnowledgeEntry"""
        self.assertEqual(self.entry.entry_id, "test_entry")
        self.assertEqual(self.entry.title, "Test Entry")
        self.assertEqual(self.entry.content, "This is test content")
        self.assertEqual(self.entry.entry_type, "insight")
        self.assertEqual(self.entry.source_agent_id, "test_agent")
        self.assertEqual(self.entry.tags, ["test", "insight"])
        self.assertEqual(self.entry.context, {"key": "value"})
        self.assertEqual(self.entry.references, ["ref1", "ref2"])
        self.assertAlmostEqual(self.entry.created_at, time.time(), delta=5)
        self.assertAlmostEqual(self.entry.updated_at, time.time(), delta=5)
        self.assertEqual(self.entry.rating, 0.0)
        self.assertEqual(self.entry.rating_count, 0)
    
    def test_to_dict(self):
        """Test conversion of a KnowledgeEntry to a dictionary"""
        entry_dict = self.entry.to_dict()
        self.assertEqual(entry_dict["entry_id"], "test_entry")
        self.assertEqual(entry_dict["title"], "Test Entry")
        self.assertEqual(entry_dict["content"], "This is test content")
        self.assertEqual(entry_dict["entry_type"], "insight")
        self.assertEqual(entry_dict["source_agent_id"], "test_agent")
        self.assertEqual(entry_dict["tags"], ["test", "insight"])
        self.assertEqual(entry_dict["context"], {"key": "value"})
        self.assertEqual(entry_dict["references"], ["ref1", "ref2"])
        self.assertAlmostEqual(entry_dict["created_at"], time.time(), delta=5)
        self.assertAlmostEqual(entry_dict["updated_at"], time.time(), delta=5)
        self.assertEqual(entry_dict["rating"], 0.0)
        self.assertEqual(entry_dict["rating_count"], 0)
    
    def test_from_dict(self):
        """Test creation of a KnowledgeEntry from a dictionary"""
        entry_dict = {
            "entry_id": "dict_entry",
            "title": "Dict Entry",
            "content": "This is from a dictionary",
            "entry_type": "warning",
            "source_agent_id": "dict_agent",
            "tags": ["dict", "warning"],
            "context": {"dict_key": "dict_value"},
            "references": ["dict_ref1"],
            "created_at": 1617234567.0,
            "updated_at": 1617234568.0,
            "rating": 4.5,
            "rating_count": 2
        }
        
        entry = KnowledgeEntry.from_dict(entry_dict)
        self.assertEqual(entry.entry_id, "dict_entry")
        self.assertEqual(entry.title, "Dict Entry")
        self.assertEqual(entry.content, "This is from a dictionary")
        self.assertEqual(entry.entry_type, "warning")
        self.assertEqual(entry.source_agent_id, "dict_agent")
        self.assertEqual(entry.tags, ["dict", "warning"])
        self.assertEqual(entry.context, {"dict_key": "dict_value"})
        self.assertEqual(entry.references, ["dict_ref1"])
        self.assertEqual(entry.created_at, 1617234567.0)
        self.assertEqual(entry.updated_at, 1617234568.0)
        self.assertEqual(entry.rating, 4.5)
        self.assertEqual(entry.rating_count, 2)
    
    def test_update_rating(self):
        """Test updating the entry's rating"""
        # Initial rating should be 0.0
        self.assertEqual(self.entry.rating, 0.0)
        self.assertEqual(self.entry.rating_count, 0)
        
        # Update with a new rating
        self.entry.update_rating(4.0)
        self.assertEqual(self.entry.rating, 4.0)
        self.assertEqual(self.entry.rating_count, 1)
        
        # Update with another rating
        self.entry.update_rating(2.0)
        self.assertEqual(self.entry.rating, 3.0)  # Average of 4.0 and 2.0
        self.assertEqual(self.entry.rating_count, 2)
        
        # Try an invalid rating (should be ignored)
        self.entry.update_rating(6.0)
        self.assertEqual(self.entry.rating, 3.0)  # No change
        self.assertEqual(self.entry.rating_count, 2)  # No change
    
    def test_add_reference(self):
        """Test adding a reference to another entry"""
        # Add a new reference
        self.entry.add_reference("new_ref")
        self.assertIn("new_ref", self.entry.references)
        
        # Add a duplicate reference (should be ignored)
        self.entry.add_reference("ref1")
        self.assertEqual(self.entry.references.count("ref1"), 1)
    
    def test_update_content(self):
        """Test updating the entry's content"""
        self.entry.update_content("Updated content")
        self.assertEqual(self.entry.content, "Updated content")
        
        # Check that updated_at was changed
        self.assertGreater(self.entry.updated_at, self.entry.created_at)
    
    def test_add_tag(self):
        """Test adding a tag to the entry"""
        # Add a new tag
        self.entry.add_tag("new_tag")
        self.assertIn("new_tag", self.entry.tags)
        
        # Add a duplicate tag (should be ignored)
        self.entry.add_tag("test")
        self.assertEqual(self.entry.tags.count("test"), 1)
    
    def test_add_context(self):
        """Test adding context information to the entry"""
        self.entry.add_context("new_key", "new_value")
        self.assertEqual(self.entry.context["new_key"], "new_value")
        
        # Update an existing context key
        self.entry.add_context("key", "updated_value")
        self.assertEqual(self.entry.context["key"], "updated_value")


if __name__ == '__main__':
    unittest.main()