import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class TestKnowledgeRoutesBasic(unittest.TestCase):
    """Basic test for the knowledge_routes module"""
    
    def test_import(self):
        """Test basic import of knowledge_routes module"""
        try:
            import knowledge_routes
            # If we get here, the import worked
            imported = True
        except Exception as e:
            print(f"Import failed: {str(e)}")
            imported = False
        
        self.assertTrue(imported, "Failed to import knowledge_routes module")
    
    def test_format_date(self):
        """Test the format_date function"""
        import knowledge_routes
        
        # Test with a valid timestamp
        result = knowledge_routes.format_date(1617234567.0)
        self.assertIsInstance(result, str)
        
        # Test with None
        result = knowledge_routes.format_date(None)
        self.assertEqual(result, "Unknown")

if __name__ == '__main__':
    unittest.main()