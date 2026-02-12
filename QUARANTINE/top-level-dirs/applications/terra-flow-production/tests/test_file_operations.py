import unittest
import os
import sys
import tempfile
import json
from io import BytesIO

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, File, db
from file_handlers import allowed_file, process_file_upload, get_user_files, delete_file

class TestFileOperations(unittest.TestCase):
    """Test the file handling operations"""
    
    def setUp(self):
        """Set up test app configuration"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
        app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
        app.config['ALLOWED_EXTENSIONS'] = {'geojson', 'json', 'shp', 'zip'}
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create a test user
        with app.app_context():
            self.user = User(username='test_user', email='test@example.com')
            db.session.add(self.user)
            db.session.commit()
            self.user_id = self.user.id
    
    def tearDown(self):
        """Clean up after tests"""
        # Clean up files
        if os.path.exists(app.config['UPLOAD_FOLDER']):
            import shutil
            shutil.rmtree(app.config['UPLOAD_FOLDER'])
        
        # Clean up database
        with app.app_context():
            db.session.query(File).filter_by(user_id=self.user_id).delete()
            db.session.query(User).filter_by(id=self.user_id).delete()
            db.session.commit()
        
        self.app_context.pop()
    
    def test_allowed_file(self):
        """Test the allowed_file function"""
        # Test allowed extensions
        self.assertTrue(allowed_file('test.geojson'))
        self.assertTrue(allowed_file('test.json'))
        self.assertTrue(allowed_file('test.shp'))
        self.assertTrue(allowed_file('test.zip'))
        
        # Test disallowed extensions
        self.assertFalse(allowed_file('test.exe'))
        self.assertFalse(allowed_file('test.js'))
        self.assertFalse(allowed_file('test.php'))
    
    def test_file_upload_process(self):
        """Test the file upload processing"""
        # Create a test GeoJSON file
        geojson_content = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": "Test Feature"},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-119.8, 46.2]  # Coordinates in Benton County area
                    }
                }
            ]
        }
        
        # Create a BytesIO object with the GeoJSON content
        file_content = BytesIO(json.dumps(geojson_content).encode('utf-8'))
        
        with app.app_context():
            # Process the file upload
            file_record = process_file_upload(
                file=file_content,
                filename='test.geojson',
                user_id=self.user_id,
                project_name='Test Project',
                description='Test Description'
            )
            
            # Check that file record was created properly
            self.assertIsNotNone(file_record)
            self.assertEqual(file_record.filename, 'test.geojson')
            self.assertEqual(file_record.user_id, self.user_id)
            self.assertEqual(file_record.description, 'Test Description')
            
            # Check that file was saved to disk
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], str(file_record.id), 'test.geojson')
            self.assertTrue(os.path.exists(file_path))
            
            # Test get_user_files function
            user_files = get_user_files(self.user_id)
            self.assertEqual(len(user_files), 1)
            self.assertEqual(user_files[0].id, file_record.id)
            
            # Test delete_file function
            delete_file(file_record.id, self.user_id)
            user_files_after_delete = get_user_files(self.user_id)
            self.assertEqual(len(user_files_after_delete), 0)
            self.assertFalse(os.path.exists(file_path))

if __name__ == '__main__':
    unittest.main()