import unittest
import os
import sys
import json
import tempfile

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from gis_utils import extract_geojson_metadata, validate_geojson

class TestGISUtils(unittest.TestCase):
    """Test the GIS utility functions"""
    
    def setUp(self):
        """Set up test app configuration"""
        app.config['TESTING'] = True
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create a temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up after tests"""
        # Remove temporary directory
        import shutil
        shutil.rmtree(self.temp_dir)
        
        self.app_context.pop()
    
    def test_validate_geojson(self):
        """Test the validate_geojson function"""
        # Valid GeoJSON
        valid_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": "Test Feature"},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-119.8, 46.2]
                    }
                }
            ]
        }
        
        # Invalid GeoJSON (missing type)
        invalid_geojson = {
            "features": [
                {
                    "properties": {"name": "Test Feature"},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-119.8, 46.2]
                    }
                }
            ]
        }
        
        # Write valid GeoJSON to file
        valid_file_path = os.path.join(self.temp_dir, 'valid.geojson')
        with open(valid_file_path, 'w') as f:
            json.dump(valid_geojson, f)
        
        # Write invalid GeoJSON to file
        invalid_file_path = os.path.join(self.temp_dir, 'invalid.geojson')
        with open(invalid_file_path, 'w') as f:
            json.dump(invalid_geojson, f)
        
        # Test validation
        self.assertTrue(validate_geojson(valid_file_path))
        self.assertFalse(validate_geojson(invalid_file_path))
    
    def test_extract_geojson_metadata(self):
        """Test the extract_geojson_metadata function"""
        # GeoJSON with properties and multiple features
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Feature 1",
                        "category": "Test",
                        "value": 42
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-119.8, 46.2]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Feature 2",
                        "category": "Test",
                        "value": 84
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-119.9, 46.3]
                    }
                }
            ]
        }
        
        # Write GeoJSON to file
        file_path = os.path.join(self.temp_dir, 'test.geojson')
        with open(file_path, 'w') as f:
            json.dump(geojson, f)
        
        # Extract metadata
        metadata = extract_geojson_metadata(file_path)
        
        # Check metadata
        self.assertIsNotNone(metadata)
        self.assertEqual(metadata['type'], 'GeoJSON')
        self.assertEqual(metadata['feature_count'], 2)
        self.assertEqual(metadata['geojson_type'], 'FeatureCollection')
        
        # Check that property names were extracted
        self.assertIn('property_names', metadata)
        self.assertIn('name', metadata['property_names'])
        self.assertIn('category', metadata['property_names'])
        self.assertIn('value', metadata['property_names'])
        
        # Check bounds (if implemented)
        if 'bounds' in metadata:
            self.assertTrue(isinstance(metadata['bounds'], dict))
            self.assertIn('minx', metadata['bounds'])
            self.assertIn('miny', metadata['bounds'])
            self.assertIn('maxx', metadata['bounds'])
            self.assertIn('maxy', metadata['bounds'])

if __name__ == '__main__':
    unittest.main()