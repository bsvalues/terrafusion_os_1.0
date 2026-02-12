import unittest
import os
import sys

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, File, GISProject, QueryLog, IndexedDocument, db

class TestSystemArchitecture(unittest.TestCase):
    """Test the system architecture components"""
    
    def setUp(self):
        """Set up test app configuration"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
    
    def tearDown(self):
        """Clean up after tests"""
        self.app_context.pop()
    
    def test_database_connection(self):
        """Test database connection"""
        try:
            # Try to execute a simple query
            result = db.session.execute("SELECT 1").fetchone()
            self.assertEqual(result[0], 1)
        except Exception as e:
            self.fail(f"Database connection failed: {str(e)}")
    
    def test_model_relationships(self):
        """Test that model relationships are correctly defined"""
        # Create test user
        user = User(username='test_user', email='test@example.com')
        db.session.add(user)
        db.session.flush()
        
        # Create test project
        project = GISProject(name='Test Project', description='Test Description', user_id=user.id)
        db.session.add(project)
        db.session.flush()
        
        # Create test file
        file = File(
            filename='test.geojson',
            original_filename='test.geojson',
            file_path='/tmp/test.geojson',
            file_size=1024,
            file_type='geojson',
            description='Test File',
            user_id=user.id,
            project_id=project.id
        )
        db.session.add(file)
        db.session.flush()
        
        # Create test query log
        query_log = QueryLog(
            user_id=user.id,
            query='Test query',
            response='Test response',
            processing_time=0.5
        )
        db.session.add(query_log)
        db.session.flush()
        
        # Create test index document
        index_doc = IndexedDocument(
            file_id=file.id,
            chunk_count=5,
            status='indexed'
        )
        db.session.add(index_doc)
        db.session.flush()
        
        # Test relationships
        self.assertEqual(file.owner, user)
        self.assertEqual(file.project, project)
        self.assertEqual(project.owner, user)
        self.assertEqual(query_log.user, user)
        self.assertEqual(index_doc.file, file)
        
        # Test reverse relationships
        self.assertIn(file, user.files.all())
        self.assertIn(project, user.projects.all())
        self.assertIn(query_log, user.queries.all())
        self.assertIn(file, project.files.all())
        
        # Clean up
        db.session.rollback()

if __name__ == '__main__':
    unittest.main()