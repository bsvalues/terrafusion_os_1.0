"""
TerraFusion Platform - RBAC Management System

This module provides role-based access control management for the TerraFusion Platform,
enabling county IT staff to manage user permissions through a web interface.
"""

import os
import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from functools import wraps
from flask import request, jsonify, session
import logging
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

# RBAC Configuration
RBAC_ROLES = {
    'admin': {
        'name': 'Administrator',
        'description': 'Full system access including user management',
        'permissions': ['read', 'write', 'delete', 'admin', 'export', 'ai']
    },
    'manager': {
        'name': 'County Manager',
        'description': 'Manage county data and view reports',
        'permissions': ['read', 'write', 'export', 'ai']
    },
    'auditor': {
        'name': 'County Auditor',
        'description': 'Read-only access to all data with export capabilities',
        'permissions': ['read', 'export']
    },
    'viewer': {
        'name': 'Data Viewer',
        'description': 'Read-only access to county data',
        'permissions': ['read']
    },
    'ai_analyst': {
        'name': 'AI Analyst',
        'description': 'Access to AI analysis tools and data insights',
        'permissions': ['read', 'ai']
    },
    'gis_specialist': {
        'name': 'GIS Specialist',
        'description': 'GIS data access and export capabilities',
        'permissions': ['read', 'export']
    }
}

class RBACManager:
    """
    Role-Based Access Control Manager for TerraFusion Platform.
    
    Provides:
    - User management with role assignments
    - County-based access control
    - JWT token generation and validation
    - Audit logging for all changes
    """
    
    def __init__(self):
        """Initialize the RBAC Manager."""
        self.db_url = os.environ.get('DATABASE_URL')
        self.jwt_secret = os.environ.get('JWT_SECRET', self._generate_jwt_secret())
        self.jwt_algorithm = 'HS256'
        self.token_expiry_hours = 24
        
    def _generate_jwt_secret(self) -> str:
        """Generate a secure JWT secret if none exists."""
        return secrets.token_urlsafe(32)
        
    def get_db_connection(self):
        """Get database connection."""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
    
    def initialize_rbac_tables(self):
        """Initialize RBAC database tables."""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Create rbac_users table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS rbac_users (
                            id SERIAL PRIMARY KEY,
                            username VARCHAR(64) UNIQUE NOT NULL,
                            email VARCHAR(120) UNIQUE NOT NULL,
                            password_hash VARCHAR(256),
                            role VARCHAR(32) NOT NULL DEFAULT 'viewer',
                            county_id VARCHAR(64),
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            last_login TIMESTAMP
                        )
                    """)
                    
                    # Create rbac_audit_log table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS rbac_audit_log (
                            id SERIAL PRIMARY KEY,
                            action_type VARCHAR(32) NOT NULL,
                            target_user_id INTEGER,
                            target_username VARCHAR(64),
                            admin_user_id INTEGER,
                            admin_username VARCHAR(64),
                            details JSONB,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            ip_address INET
                        )
                    """)
                    
                    # Create rbac_sessions table for active sessions
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS rbac_sessions (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER REFERENCES rbac_users(id),
                            session_token VARCHAR(255) UNIQUE NOT NULL,
                            jwt_token TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            expires_at TIMESTAMP NOT NULL,
                            is_active BOOLEAN DEFAULT TRUE,
                            ip_address INET,
                            user_agent TEXT
                        )
                    """)
                    
                    conn.commit()
                    logger.info("RBAC tables initialized successfully")
                    
        except Exception as e:
            logger.error(f"Failed to initialize RBAC tables: {e}")
            raise
    
    def create_user(self, username: str, email: str, password: str, role: str, 
                   county_id: str = None, admin_user_id: int = None) -> Dict:
        """
        Create a new user with specified role and county access.
        
        Args:
            username: Unique username
            email: User email address
            password: Plain text password (will be hashed)
            role: User role from RBAC_ROLES
            county_id: Optional county restriction
            admin_user_id: ID of admin creating this user
            
        Returns:
            Dictionary with user creation result
        """
        try:
            if role not in RBAC_ROLES:
                raise ValueError(f"Invalid role: {role}")
                
            password_hash = self._hash_password(password)
            
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO rbac_users (username, email, password_hash, role, county_id)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, username, email, role, county_id, created_at
                    """, (username, email, password_hash, role, county_id))
                    
                    user = dict(cur.fetchone())
                    conn.commit()
                    
                    # Log the creation
                    self._log_audit_action(
                        'user_created',
                        target_user_id=user['id'],
                        target_username=username,
                        admin_user_id=admin_user_id,
                        details={
                            'role': role,
                            'county_id': county_id,
                            'email': email
                        }
                    )
                    
                    logger.info(f"User created: {username} with role {role}")
                    return {
                        'success': True,
                        'user': user,
                        'message': f'User {username} created successfully'
                    }
                    
        except psycopg2.IntegrityError as e:
            if 'username' in str(e):
                return {'success': False, 'error': 'Username already exists'}
            elif 'email' in str(e):
                return {'success': False, 'error': 'Email already exists'}
            else:
                return {'success': False, 'error': 'Database constraint violation'}
        except Exception as e:
            logger.error(f"Failed to create user {username}: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_user(self, user_id: int, updates: Dict, admin_user_id: int = None) -> Dict:
        """
        Update user details and permissions.
        
        Args:
            user_id: ID of user to update
            updates: Dictionary of fields to update
            admin_user_id: ID of admin making changes
            
        Returns:
            Dictionary with update result
        """
        try:
            allowed_fields = ['email', 'role', 'county_id', 'is_active']
            update_fields = {k: v for k, v in updates.items() if k in allowed_fields}
            
            if 'role' in update_fields and update_fields['role'] not in RBAC_ROLES:
                return {'success': False, 'error': f"Invalid role: {update_fields['role']}"}
            
            if not update_fields:
                return {'success': False, 'error': 'No valid fields to update'}
            
            # Build dynamic update query
            set_clause = ', '.join([f"{field} = %s" for field in update_fields.keys()])
            set_clause += ', updated_at = CURRENT_TIMESTAMP'
            values = list(update_fields.values()) + [user_id]
            
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Get original user data for audit
                    cur.execute("SELECT username, role, county_id FROM rbac_users WHERE id = %s", (user_id,))
                    original_user = dict(cur.fetchone() or {})
                    
                    # Update user
                    cur.execute(f"""
                        UPDATE rbac_users 
                        SET {set_clause}
                        WHERE id = %s
                        RETURNING id, username, email, role, county_id, is_active, updated_at
                    """, values)
                    
                    updated_user = dict(cur.fetchone())
                    conn.commit()
                    
                    # Log the update
                    self._log_audit_action(
                        'user_updated',
                        target_user_id=user_id,
                        target_username=updated_user['username'],
                        admin_user_id=admin_user_id,
                        details={
                            'original': original_user,
                            'updates': update_fields
                        }
                    )
                    
                    logger.info(f"User updated: {updated_user['username']}")
                    return {
                        'success': True,
                        'user': updated_user,
                        'message': f'User {updated_user["username"]} updated successfully'
                    }
                    
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    def delete_user(self, user_id: int, admin_user_id: int = None) -> Dict:
        """
        Delete a user (sets is_active = False for audit trail).
        
        Args:
            user_id: ID of user to delete
            admin_user_id: ID of admin deleting user
            
        Returns:
            Dictionary with deletion result
        """
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Get user info before deletion
                    cur.execute("SELECT username FROM rbac_users WHERE id = %s", (user_id,))
                    user_row = cur.fetchone()
                    if not user_row:
                        return {'success': False, 'error': 'User not found'}
                    
                    username = user_row['username']
                    
                    # Soft delete (deactivate)
                    cur.execute("""
                        UPDATE rbac_users 
                        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (user_id,))
                    
                    # Deactivate all sessions
                    cur.execute("""
                        UPDATE rbac_sessions 
                        SET is_active = FALSE
                        WHERE user_id = %s
                    """, (user_id,))
                    
                    conn.commit()
                    
                    # Log the deletion
                    self._log_audit_action(
                        'user_deleted',
                        target_user_id=user_id,
                        target_username=username,
                        admin_user_id=admin_user_id
                    )
                    
                    logger.info(f"User deleted: {username}")
                    return {
                        'success': True,
                        'message': f'User {username} deleted successfully'
                    }
                    
        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    def list_users(self, county_id: str = None, include_inactive: bool = False) -> List[Dict]:
        """
        List all users with optional filtering.
        
        Args:
            county_id: Optional filter by county
            include_inactive: Whether to include inactive users
            
        Returns:
            List of user dictionaries
        """
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    query = """
                        SELECT id, username, email, role, county_id, is_active, 
                               created_at, updated_at, last_login
                        FROM rbac_users
                        WHERE 1=1
                    """
                    params = []
                    
                    if not include_inactive:
                        query += " AND is_active = TRUE"
                    
                    if county_id:
                        query += " AND (county_id = %s OR county_id IS NULL)"
                        params.append(county_id)
                    
                    query += " ORDER BY created_at DESC"
                    
                    cur.execute(query, params)
                    users = [dict(row) for row in cur.fetchall()]
                    
                    # Add role information
                    for user in users:
                        user['role_info'] = RBAC_ROLES.get(user['role'], {})
                    
                    return users
                    
        except Exception as e:
            logger.error(f"Failed to list users: {e}")
            return []
    
    def authenticate_user(self, username: str, password: str) -> Dict:
        """
        Authenticate user credentials and generate JWT token.
        
        Args:
            username: Username or email
            password: Plain text password
            
        Returns:
            Dictionary with authentication result
        """
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Find user by username or email
                    cur.execute("""
                        SELECT id, username, email, password_hash, role, county_id, is_active
                        FROM rbac_users
                        WHERE (username = %s OR email = %s) AND is_active = TRUE
                    """, (username, username))
                    
                    user_row = cur.fetchone()
                    if not user_row:
                        return {'success': False, 'error': 'Invalid credentials'}
                    
                    user = dict(user_row)
                    
                    # Verify password
                    if not self._verify_password(password, user['password_hash']):
                        return {'success': False, 'error': 'Invalid credentials'}
                    
                    # Generate JWT token
                    token = self._generate_jwt_token(user)
                    session_token = secrets.token_urlsafe(32)
                    
                    # Create session record
                    expires_at = datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
                    cur.execute("""
                        INSERT INTO rbac_sessions (user_id, session_token, jwt_token, expires_at, ip_address)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    """, (user['id'], session_token, token, expires_at, request.remote_addr if request else None))
                    
                    session_id = cur.fetchone()['id']
                    
                    # Update last login
                    cur.execute("""
                        UPDATE rbac_users 
                        SET last_login = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (user['id'],))
                    
                    conn.commit()
                    
                    logger.info(f"User authenticated: {username}")
                    return {
                        'success': True,
                        'token': token,
                        'session_token': session_token,
                        'session_id': session_id,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email'],
                            'role': user['role'],
                            'county_id': user['county_id'],
                            'permissions': RBAC_ROLES.get(user['role'], {}).get('permissions', [])
                        }
                    }
                    
        except Exception as e:
            logger.error(f"Authentication failed for {username}: {e}")
            return {'success': False, 'error': 'Authentication failed'}
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """
        Verify JWT token and return user information.
        
        Args:
            token: JWT token to verify
            
        Returns:
            User information if token is valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            
            # Check if token is expired
            if datetime.utcnow().timestamp() > payload.get('exp', 0):
                return None
            
            # Verify session is still active
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT u.id, u.username, u.email, u.role, u.county_id, u.is_active
                        FROM rbac_users u
                        JOIN rbac_sessions s ON u.id = s.user_id
                        WHERE u.id = %s AND s.jwt_token = %s 
                        AND s.is_active = TRUE AND s.expires_at > CURRENT_TIMESTAMP
                        AND u.is_active = TRUE
                    """, (payload.get('user_id'), token))
                    
                    user_row = cur.fetchone()
                    if not user_row:
                        return None
                    
                    user = dict(user_row)
                    user['permissions'] = RBAC_ROLES.get(user['role'], {}).get('permissions', [])
                    return user
                    
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA256 with salt."""
        salt = secrets.token_hex(32)
        return salt + ':' + hashlib.sha256((salt + password).encode()).hexdigest()
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        try:
            salt, hash_value = password_hash.split(':', 1)
            return hashlib.sha256((salt + password).encode()).hexdigest() == hash_value
        except ValueError:
            return False
    
    def _generate_jwt_token(self, user: Dict) -> str:
        """Generate JWT token for user."""
        payload = {
            'user_id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'county_id': user['county_id'],
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def _log_audit_action(self, action_type: str, target_user_id: int = None, 
                         target_username: str = None, admin_user_id: int = None,
                         admin_username: str = None, details: Dict = None):
        """Log audit action to database."""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO rbac_audit_log 
                        (action_type, target_user_id, target_username, admin_user_id, 
                         admin_username, details, ip_address)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        action_type, target_user_id, target_username, admin_user_id,
                        admin_username, details, request.remote_addr if request else None
                    ))
                    conn.commit()
        except Exception as e:
            logger.error(f"Failed to log audit action: {e}")

def require_role(required_roles: List[str] = None, required_permissions: List[str] = None):
    """
    Decorator to require specific roles or permissions for route access.
    
    Args:
        required_roles: List of required roles
        required_permissions: List of required permissions
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get token from Authorization header or session
            token = None
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            elif 'jwt_token' in session:
                token = session['jwt_token']
            
            if not token:
                return jsonify({'error': 'Authentication required'}), 401
            
            rbac = RBACManager()
            user = rbac.verify_token(token)
            
            if not user:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Check role requirements
            if required_roles and user['role'] not in required_roles:
                return jsonify({'error': 'Insufficient privileges'}), 403
            
            # Check permission requirements
            if required_permissions:
                user_permissions = set(user.get('permissions', []))
                if not set(required_permissions).issubset(user_permissions):
                    return jsonify({'error': 'Insufficient permissions'}), 403
            
            # Add user to request context
            request.current_user = user
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# Global RBAC instance
rbac_manager = RBACManager()