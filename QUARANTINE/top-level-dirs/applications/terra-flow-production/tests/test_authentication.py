import unittest
import os
import sys
from unittest.mock import patch

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, db
from auth import authenticate_user, is_authenticated, logout_user

class TestAuthentication(unittest.TestCase):
    """Test the authentication functionality"""
    
    def setUp(self):
        """Set up test app configuration"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
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
        # Clean up database
        with app.app_context():
            db.session.query(User).filter_by(id=self.user_id).delete()
            db.session.commit()
        
        self.app_context.pop()
    
    @patch('auth.BYPASS_LDAP', True)  # Mock BYPASS_LDAP to always be True for testing
    def test_authenticate_user_bypass(self):
        """Test user authentication with LDAP bypass enabled"""
        # Since BYPASS_LDAP is True, this should succeed regardless of credentials
        self.assertTrue(authenticate_user('test_user', 'any_password'))
    
    @patch('auth.BYPASS_LDAP', False)  # Mock BYPASS_LDAP to be False
    @patch('ldap.initialize')
    def test_authenticate_user_ldap(self, mock_ldap_initialize):
        """Test user authentication with LDAP"""
        # Set up the LDAP mock
        mock_ldap = mock_ldap_initialize.return_value
        
        # Test successful authentication
        mock_ldap.simple_bind_s.return_value = True
        self.assertTrue(authenticate_user('test_user', 'correct_password'))
        
        # Test failed authentication
        mock_ldap.simple_bind_s.side_effect = Exception("Invalid credentials")
        self.assertFalse(authenticate_user('test_user', 'incorrect_password'))
    
    def test_is_authenticated(self):
        """Test is_authenticated function"""
        with app.test_request_context():
            # Initially not authenticated
            self.assertFalse(is_authenticated())
            
            # Set session
            from flask import session
            session['user'] = {'id': self.user_id, 'username': 'test_user'}
            
            # Now should be authenticated
            self.assertTrue(is_authenticated())
    
    def test_logout_user(self):
        """Test logout_user function"""
        with app.test_request_context():
            # Set session
            from flask import session
            session['user'] = {'id': self.user_id, 'username': 'test_user'}
            
            # Logout
            logout_user()
            
            # Should be logged out
            self.assertFalse('user' in session)

if __name__ == '__main__':
    unittest.main()