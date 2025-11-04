"""
Supabase Authentication Helper

This module provides functionality for authenticating users with Supabase,
and integrating Supabase Auth with Flask-Login.
"""

import os
import logging
import json
import time
from typing import Dict, Any, Optional, Tuple, Union, List, cast
from functools import wraps
from datetime import datetime, timedelta

try:
    from flask import session, current_app
    from flask_login import login_user as flask_login_user
    from flask_login import logout_user as flask_logout_user
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

# Local modules
from supabase_client import get_supabase_client, release_supabase_client
from set_supabase_env import ensure_supabase_env

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define User class for Flask-Login
class SupabaseUser:
    """User class for Flask-Login integration with Supabase Auth"""
    
    def __init__(self, user_data: Dict[str, Any]):
        """
        Initialize a new Supabase user.
        
        Args:
            user_data: User data from Supabase
        """
        self.id = user_data.get('id')
        self.email = user_data.get('email')
        self.phone = user_data.get('phone')
        self.last_sign_in_at = user_data.get('last_sign_in_at')
        self.created_at = user_data.get('created_at')
        self.updated_at = user_data.get('updated_at')
        self.confirmed_at = user_data.get('confirmed_at')
        self.email_confirmed_at = user_data.get('email_confirmed_at')
        self.phone_confirmed_at = user_data.get('phone_confirmed_at')
        self.app_metadata = user_data.get('app_metadata', {})
        self.user_metadata = user_data.get('user_metadata', {})
        self.identities = user_data.get('identities', [])
        self.aud = user_data.get('aud')
        self.role = user_data.get('role')
        self.is_anonymous = False
        self.is_authenticated = True
        self.is_active = True
    
    def get_id(self) -> str:
        """Get the user ID as a string (for Flask-Login)"""
        return str(self.id)
    
    def get_roles(self) -> List[str]:
        """Get the roles of the user"""
        # Get roles from user_metadata or app_metadata
        roles = self.user_metadata.get('roles', [])
        if not roles and isinstance(self.app_metadata, dict):
            roles = self.app_metadata.get('roles', [])
        
        # Ensure it's a list
        if isinstance(roles, str):
            roles = [roles]
        
        return roles
    
    def has_role(self, role: str) -> bool:
        """
        Check if the user has a specific role.
        
        Args:
            role: Role name
            
        Returns:
            True if the user has the role, False otherwise
        """
        roles = self.get_roles()
        return role in roles
    
    def has_permission(self, permission: str) -> bool:
        """
        Check if the user has a specific permission.
        
        Args:
            permission: Permission name
            
        Returns:
            True if the user has the permission, False otherwise
        """
        # Get permissions from user_metadata or app_metadata
        permissions = self.user_metadata.get('permissions', [])
        if not permissions and isinstance(self.app_metadata, dict):
            permissions = self.app_metadata.get('permissions', [])
        
        # Ensure it's a list
        if isinstance(permissions, str):
            permissions = [permissions]
        
        return permission in permissions
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the user to a dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'last_sign_in_at': self.last_sign_in_at,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'confirmed_at': self.confirmed_at,
            'email_confirmed_at': self.email_confirmed_at,
            'phone_confirmed_at': self.phone_confirmed_at,
            'app_metadata': self.app_metadata,
            'user_metadata': self.user_metadata,
            'identities': self.identities,
            'aud': self.aud,
            'role': self.role
        }

class SupabaseAuth:
    """
    Supabase Auth Helper
    
    This class provides functionality for authenticating users with Supabase,
    and integrating Supabase Auth with Flask-Login.
    """
    
    def __init__(self):
        """Initialize the Supabase Auth helper"""
        # Ensure environment variables are set
        ensure_supabase_env()
        
        # Get environment variables
        self.url = os.environ.get('SUPABASE_URL')
        self.key = os.environ.get('SUPABASE_KEY')
        
        if not self.url or not self.key:
            logger.error('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY')
        
        # Initialize session
        self.session_token = None
        self.refresh_token = None
        self.user_id = None
        
    def client(self):
        """
        Get a Supabase client. This should be used in a context manager or with proper release.
        
        Example:
            client = supabase_auth.client()
            try:
                # Use client
                result = client.from_('table').select('*').execute()
            finally:
                # Release client back to the centralized client manager
                release_supabase_client(client)
                
        Returns:
            Supabase client from the centralized client manager
        """
        if not self.url or not self.key:
            logger.error('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY')
            return None
        
        return get_supabase_client(self.url, self.key)
    
    def sign_up(self, email: str, password: str, user_metadata: Optional[Dict[str, Any]] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Sign up a new user with email and password.
        
        Args:
            email: User email
            password: User password
            user_metadata: Optional user metadata
            
        Returns:
            Tuple of (success, data)
        """
        if not self.url or not self.key:
            return False, {'error': 'Missing required environment variables: SUPABASE_URL, SUPABASE_KEY'}
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Sign up
            response = client.auth.sign_up({
                'email': email,
                'password': password,
                'options': {
                    'data': user_metadata or {}
                }
            })
            
            # Check if successful
            if response.user and response.session:
                # Store session
                self.session_token = response.session.access_token
                self.refresh_token = response.session.refresh_token
                self.user_id = response.user.id
                
                # Return success
                return True, {
                    'user': response.user.model_dump(),
                    'session': {
                        'access_token': response.session.access_token,
                        'expires_at': response.session.expires_at,
                        'refresh_token': response.session.refresh_token
                    }
                }
            else:
                # Return error
                return False, {'error': 'Failed to sign up user', 'user': None, 'session': None}
        except Exception as e:
            logger.error(f'Error signing up user: {str(e)}')
            return False, {'error': str(e)}
        finally:
            # Release the client
            release_supabase_client(client)
    
    def sign_in(self, email: str, password: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Sign in a user with email and password.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Tuple of (success, data)
        """
        if not self.url or not self.key:
            return False, {'error': 'Missing required environment variables: SUPABASE_URL, SUPABASE_KEY'}
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Sign in
            response = client.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            
            # Check if successful
            if response.user and response.session:
                # Store session
                self.session_token = response.session.access_token
                self.refresh_token = response.session.refresh_token
                self.user_id = response.user.id
                
                # Return success
                return True, {
                    'user': response.user.model_dump(),
                    'session': {
                        'access_token': response.session.access_token,
                        'expires_at': response.session.expires_at,
                        'refresh_token': response.session.refresh_token
                    }
                }
            else:
                # Return error
                return False, {'error': 'Failed to sign in user', 'user': None, 'session': None}
        except Exception as e:
            logger.error(f'Error signing in user: {str(e)}')
            return False, {'error': str(e)}
        finally:
            # Release the client
            release_supabase_client(client)
    
    def sign_out(self) -> bool:
        """
        Sign out the current user.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.url or not self.key:
            return False
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Sign out
            client.auth.sign_out()
            
            # Clear session
            self.session_token = None
            self.refresh_token = None
            self.user_id = None
            
            # Return success
            return True
        except Exception as e:
            logger.error(f'Error signing out user: {str(e)}')
            return False
        finally:
            # Release the client
            release_supabase_client(client)
    
    def get_user(self) -> Optional[SupabaseUser]:
        """
        Get the current user.
        
        Returns:
            User object if authenticated, None otherwise
        """
        if not self.url or not self.key:
            return None
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Get user
            response = client.auth.get_user()
            
            # Check if successful
            if response and response.user:
                # Return user
                return SupabaseUser(response.user.model_dump())
            else:
                # Return None
                return None
        except Exception as e:
            logger.error(f'Error getting user: {str(e)}')
            return None
        finally:
            # Release the client
            release_supabase_client(client)
    
    def get_session(self) -> Optional[Dict[str, Any]]:
        """
        Get the current session.
        
        Returns:
            Session object if authenticated, None otherwise
        """
        if not self.url or not self.key:
            return None
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Get session
            response = client.auth.get_session()
            
            # Check if successful
            if response and response.session:
                # Return session
                return {
                    'access_token': response.session.access_token,
                    'expires_at': response.session.expires_at,
                    'refresh_token': response.session.refresh_token
                }
            else:
                # Return None
                return None
        except Exception as e:
            logger.error(f'Error getting session: {str(e)}')
            return None
        finally:
            # Release the client
            release_supabase_client(client)
    
    def refresh_session(self) -> bool:
        """
        Refresh the current session.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.url or not self.key or not self.refresh_token:
            return False
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Refresh session
            response = client.auth.refresh_session()
            
            # Check if successful
            if response and response.session:
                # Store session
                self.session_token = response.session.access_token
                self.refresh_token = response.session.refresh_token
                
                # Return success
                return True
            else:
                # Return error
                return False
        except Exception as e:
            logger.error(f'Error refreshing session: {str(e)}')
            return False
        finally:
            # Release the client
            release_supabase_client(client)
    
    def reset_password(self, email: str) -> bool:
        """
        Reset a user's password.
        
        Args:
            email: User email
            
        Returns:
            True if successful, False otherwise
        """
        if not self.url or not self.key:
            return False
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Reset password
            client.auth.reset_password_email(email)
            
            # Return success
            return True
        except Exception as e:
            logger.error(f'Error resetting password: {str(e)}')
            return False
        finally:
            # Release the client
            release_supabase_client(client)
    
    def update_user(self, user_metadata: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """
        Update the current user's metadata.
        
        Args:
            user_metadata: User metadata
            
        Returns:
            Tuple of (success, data)
        """
        if not self.url or not self.key:
            return False, {'error': 'Missing required environment variables: SUPABASE_URL, SUPABASE_KEY'}
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Update user
            response = client.auth.update_user({
                'data': user_metadata
            })
            
            # Check if successful
            if response and response.user:
                # Return success
                return True, {'user': response.user.model_dump()}
            else:
                # Return error
                return False, {'error': 'Failed to update user', 'user': None}
        except Exception as e:
            logger.error(f'Error updating user: {str(e)}')
            return False, {'error': str(e)}
        finally:
            # Release the client
            release_supabase_client(client)
    
    def get_user_by_id(self, user_id: str) -> Optional[SupabaseUser]:
        """
        Get a user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object if found, None otherwise
        """
        if not self.url or not self.key:
            return None
        
        # Get a client
        client = get_supabase_client(self.url, self.key)
        
        try:
            # Get user
            response = client.from_('users').select('*').eq('id', user_id).execute()
            
            # Check if successful
            if response and response.data and len(response.data) > 0:
                # Return user
                return SupabaseUser(response.data[0])
            else:
                # Return None
                return None
        except Exception as e:
            logger.error(f'Error getting user by ID: {str(e)}')
            return None
        finally:
            # Release the client
            release_supabase_client(client)

# Create a singleton instance
supabase_auth = SupabaseAuth()

def login_user(email: str, password: str, remember: bool = False) -> Tuple[bool, Dict[str, Any]]:
    """
    Login a user with Flask-Login.
    
    Args:
        email: User email
        password: User password
        remember: Whether to remember the user
        
    Returns:
        Tuple of (success, data)
    """
    if not FLASK_AVAILABLE:
        return False, {"error": "Flask is not available"}
    
    # Authenticate with Supabase
    success, data = supabase_auth.sign_in(email, password)
    
    if not success:
        return False, data
    
    # Create user object for Flask-Login
    user_data = data.get("user", {})
    if not user_data:
        return False, {"error": "User data not returned from Supabase"}
    
    # Create user object
    user = SupabaseUser(user_data)
    
    try:
        # Login with Flask-Login
        flask_login_user(user, remember=remember)
        
        # Store session info in Flask session
        session["supabase_session"] = {
            "access_token": data.get("session", {}).get("access_token"),
            "refresh_token": data.get("session", {}).get("refresh_token"),
            "expires_at": data.get("session", {}).get("expires_at")
        }
        
        return True, {"user": user_data}
    except Exception as e:
        logger.error(f"Error logging in user with Flask-Login: {str(e)}")
        return False, {"error": str(e)}

def logout_user() -> bool:
    """
    Logout a user with Flask-Login.
    
    Returns:
        True if successful, False otherwise
    """
    if not FLASK_AVAILABLE:
        return False
    
    try:
        # Sign out from Supabase
        supabase_auth.sign_out()
        
        # Logout with Flask-Login
        flask_logout_user()
        
        # Clear session
        if "supabase_session" in session:
            del session["supabase_session"]
        
        return True
    except Exception as e:
        logger.error(f"Error logging out user: {str(e)}")
        return False
        
def get_current_user() -> Optional[SupabaseUser]:
    """
    Get the current user from Flask-Login.
    
    Returns:
        User object if logged in, None otherwise
    """
    if not FLASK_AVAILABLE:
        return None
    
    try:
        from flask_login import current_user
        
        if current_user and current_user.is_authenticated:
            # Check if we need to refresh the session
            if "supabase_session" in session:
                expires_at = session["supabase_session"].get("expires_at")
                
                if expires_at:
                    # Convert to datetime
                    try:
                        expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                        
                        # Refresh if expires in less than 5 minutes
                        if expires_at - timedelta(minutes=5) < datetime.now(expires_at.tzinfo):
                            logger.debug("Refreshing Supabase session")
                            supabase_auth.refresh_session()
                    except Exception as e:
                        logger.warning(f"Error checking session expiry: {str(e)}")
            
            # Return current user
            return current_user
        
        return None
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        return None