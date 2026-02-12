"""
Test cases for the Knowledge Routes module
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch
import json

# Add the project root to the path so we can import from there
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock Flask components
class MockRequest:
    """Mock Flask request object"""
    def __init__(self, form=None, args=None, json_data=None):
        self.form = form or {}
        self.args = args or {}
        self._json = json_data
    
    def get_json(self):
        """Return JSON data"""
        return self._json

class MockG:
    """Mock Flask g object"""
    def __init__(self, user=None):
        self.user = user

class MockFlask:
    """Mock Flask app object for testing"""
    def __init__(self):
        self.routes = {}
        
    def route(self, route_str, **kwargs):
        """Mock route decorator"""
        def decorator(f):
            self.routes[route_str] = f
            return f
        return decorator

# Create the test class
class TestKnowledgeRoutes(unittest.TestCase):
    """Test cases for the Knowledge Routes module"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create mock MCP instance
        self.mock_mcp = MagicMock()
        
        # Create sample knowledge entries
        self.sample_entries = [
            {
                'id': 'entry1',
                'title': 'Test Entry 1',
                'content': 'This is test content 1',
                'entry_type': 'insight',
                'tags': ['test', 'insight'],
                'source_agent_id': 'agent1',
                'created_at': 1617234567.0,
                'updated_at': 1617234567.0,
                'rating': 4.5,
                'rating_count': 2
            },
            {
                'id': 'entry2',
                'title': 'Test Entry 2',
                'content': 'This is test content 2',
                'entry_type': 'warning',
                'tags': ['test', 'warning'],
                'source_agent_id': 'agent2',
                'created_at': 1617234568.0,
                'updated_at': 1617234568.0,
                'rating': 3.0,
                'rating_count': 1
            }
        ]
        
        # Patch mcp_instance
        self.patcher = patch('knowledge_routes.mcp_instance', self.mock_mcp)
        self.mock_mcp_instance = self.patcher.start()
        
        # Patch Flask components
        self.request_patcher = patch('knowledge_routes.request')
        self.mock_request = self.request_patcher.start()
        
        self.jsonify_patcher = patch('knowledge_routes.jsonify', side_effect=lambda x: x)
        self.mock_jsonify = self.jsonify_patcher.start()
        
        self.render_template_patcher = patch('knowledge_routes.render_template', side_effect=lambda *args, **kwargs: {'template': args[0], 'context': kwargs})
        self.mock_render_template = self.render_template_patcher.start()
        
        self.g_patcher = patch('knowledge_routes.g', MockG(user={'username': 'test_user'}))
        self.mock_g = self.g_patcher.start()
        
        # Import the module (after patching)
        import knowledge_routes
        self.knowledge_routes = knowledge_routes
        
    def tearDown(self):
        """Tear down test fixtures"""
        # Stop all patchers
        self.patcher.stop()
        self.request_patcher.stop()
        self.jsonify_patcher.stop()
        self.render_template_patcher.stop()
        self.g_patcher.stop()
    
    def test_knowledge_base(self):
        """Test the knowledge_base route"""
        # Configure mock MCP instance
        self.mock_mcp.get_agent_info.return_value = {'agent1': {}, 'agent2': {}}
        self.mock_mcp.get_agent_knowledge.return_value = self.sample_entries
        
        # Call the route handler
        result = self.knowledge_routes.knowledge_base()
        
        # Check that the correct template is rendered
        self.assertEqual(result['template'], 'knowledge_base.html')
        
        # Check that entries, tags, and type counts are present in the context
        self.assertIn('entries', result['context'])
        self.assertIn('tags', result['context'])
        self.assertIn('tag_counts', result['context'])
        self.assertIn('type_counts', result['context'])
        
        # Check that the entries are correctly passed to the template
        self.assertEqual(len(result['context']['entries']), 2)
    
    def test_get_entry(self):
        """Test the get_entry route"""
        # Configure mock MCP instance
        self.mock_mcp.get_knowledge_entry.return_value = self.sample_entries[0]
        self.mock_mcp.get_related_knowledge.return_value = [self.sample_entries[1]]
        
        # Call the route handler
        result = self.knowledge_routes.get_entry('entry1')
        
        # Check that the correct data is returned
        self.assertTrue(result['success'])
        self.assertEqual(result['entry']['id'], 'entry1')
        self.assertEqual(len(result['related']), 1)
    
    def test_add_knowledge(self):
        """Test the add_knowledge route"""
        # Configure mock request
        self.mock_request.form = {
            'title': 'New Test Entry',
            'content': 'This is a new test entry',
            'entry_type': 'insight',
            'tags': json.dumps(['test', 'new']),
            'references': json.dumps(['ref1'])
        }
        
        # Configure mock MCP instance
        self.mock_mcp.add_knowledge.return_value = 'new_entry_id'
        
        # Call the route handler
        result = self.knowledge_routes.add_knowledge()
        
        # Check that the knowledge was added
        self.assertTrue(result['success'])
        self.assertEqual(result['entry_id'], 'new_entry_id')
        
        # Check that add_knowledge was called with the correct arguments
        self.mock_mcp.add_knowledge.assert_called_once()
    
    def test_search_knowledge(self):
        """Test the search_knowledge route"""
        # Configure mock request
        self.mock_request.args = {
            'q': 'test query',
            'type': 'insight',
            'tags': 'test,insight'
        }
        
        # Configure mock MCP instance
        self.mock_mcp.query_knowledge.return_value = [self.sample_entries[0]]
        
        # Call the route handler
        result = self.knowledge_routes.search_knowledge()
        
        # Check that the correct data is returned
        self.assertTrue(result['success'])
        self.assertEqual(len(result['results']), 1)
        self.assertEqual(result['count'], 1)
        
        # Check that query_knowledge was called with the correct arguments
        self.mock_mcp.query_knowledge.assert_called_once()
    
    def test_knowledge_dashboard(self):
        """Test the knowledge_dashboard route"""
        # Call the route handler
        result = self.knowledge_routes.knowledge_dashboard()
        
        # Check that the correct template is rendered
        self.assertEqual(result['template'], 'knowledge_dashboard.html')
    
    def test_dashboard_data(self):
        """Test the dashboard_data route"""
        # Configure mock request
        self.mock_request.args = {'days': '30'}
        
        # Configure mock MCP instance
        self.mock_mcp.get_agent_info.return_value = {'agent1': {}, 'agent2': {}}
        self.mock_mcp.get_agent_knowledge.return_value = self.sample_entries
        
        # Call the route handler
        result = self.knowledge_routes.dashboard_data()
        
        # Check that the correct data is returned
        self.assertTrue(result['success'])
        self.assertIn('metrics', result)
        self.assertIn('entries_by_type', result)
        self.assertIn('knowledge_growth', result)
        self.assertIn('top_tags', result)
        self.assertIn('agent_contributions', result)
        self.assertIn('rating_distribution', result)
        
        # Check that the metrics are calculated correctly
        self.assertEqual(result['metrics']['total_entries'], 2)
        
    def test_error_handling(self):
        """Test error handling in the routes"""
        # Configure mock MCP instance to raise an exception
        self.mock_mcp.get_agent_info.side_effect = Exception("Test error")
        
        # Call the route handler
        result = self.knowledge_routes.knowledge_base()
        
        # Check that the error is handled
        self.assertIn('error', result['context'])
        self.assertEqual(result['context']['entries'], [])


if __name__ == '__main__':
    unittest.main()