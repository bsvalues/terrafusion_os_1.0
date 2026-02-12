"""
TerraFusionPlatform Authentication Manager

This module handles user authentication, session management, and access control.
"""

import os
import json
import time
import hmac
import uuid
from hashlib import sha256
from typing import Dict, Any, Optional, Tuple

# Authentication directory and file paths
AUTH_DIR = 'auth'
USERS_FILE = os.path.join(AUTH_DIR, 'users.json')
SESSIONS_FILE = os.path.join(AUTH_DIR, 'sessions.json')

# Session expiration time (24 hours)
SESSION_EXPIRY = 60 * 60 * 24

def ensure_auth_files_exist() -> None:
    """Ensure authentication files and directories exist."""
    # Create auth directory if it doesn't exist
    if not os.path.exists(AUTH_DIR):
        os.makedirs(AUTH_DIR)
    
    # Create users file if it doesn't exist
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({"users": {}}, f, indent=4)
    
    # Create sessions file if it doesn't exist
    if not os.path.exists(SESSIONS_FILE):
        with open(SESSIONS_FILE, 'w') as f:
            json.dump({"sessions": {}}, f, indent=4)

def hash_password(password: str) -> Tuple[str, str]:
    """
    Hash a password with a random salt.
    
    Args:
        password: The password to hash
        
    Returns:
        Tuple containing (password_hash, salt)
    """
    # Generate a random salt
    salt = os.urandom(32).hex()
    
    # Hash the password with the salt
    password_hash = hmac.new(
        salt.encode(),
        password.encode(),
        sha256
    ).hexdigest()
    
    return password_hash, salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """
    Verify a password against a hash and salt.
    
    Args:
        password: The password to verify
        password_hash: The stored password hash
        salt: The salt used to hash the password
        
    Returns:
        True if the password is correct, False otherwise
    """
    # Hash the provided password with the stored salt
    computed_hash = hmac.new(
        salt.encode(),
        password.encode(),
        sha256
    ).hexdigest()
    
    # Compare the computed hash with the stored hash
    return hmac.compare_digest(computed_hash, password_hash)

def create_user(username: str, password: str, role: str = "user") -> bool:
    """
    Create a new user.
    
    Args:
        username: Username for the new user
        password: Password for the new user
        role: Role for the new user (default: 'user')
        
    Returns:
        True if user was created successfully, False if username already exists
    """
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load existing users
    with open(USERS_FILE, 'r') as f:
        user_data = json.load(f)
    
    # Check if username already exists
    if username in user_data["users"]:
        return False
    
    # Hash the password
    password_hash, salt = hash_password(password)
    
    # Add the new user
    user_data["users"][username] = {
        "password_hash": password_hash,
        "salt": salt,
        "role": role,
        "created_at": time.time()
    }
    
    # Save updated user data
    with open(USERS_FILE, 'w') as f:
        json.dump(user_data, f, indent=4)
    
    return True

def authenticate_user(username: str, password: str) -> bool:
    """
    Authenticate a user with a username and password.
    
    Args:
        username: The username to authenticate
        password: The password to authenticate
        
    Returns:
        True if authentication is successful, False otherwise
    """
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load users
    with open(USERS_FILE, 'r') as f:
        user_data = json.load(f)
    
    # Check if user exists
    if username not in user_data["users"]:
        return False
    
    # Get user info
    user_info = user_data["users"][username]
    
    # Verify password
    return verify_password(
        password,
        user_info["password_hash"],
        user_info["salt"]
    )

def create_session(username: str) -> str:
    """
    Create a new session for a user.
    
    Args:
        username: Username to create session for
        
    Returns:
        Session token
    """
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load sessions
    with open(SESSIONS_FILE, 'r') as f:
        session_data = json.load(f)
    
    # Generate a session token
    session_token = str(uuid.uuid4())
    
    # Create session
    session_data["sessions"][session_token] = {
        "username": username,
        "created_at": time.time(),
        "expires_at": time.time() + SESSION_EXPIRY
    }
    
    # Save updated session data
    with open(SESSIONS_FILE, 'w') as f:
        json.dump(session_data, f, indent=4)
    
    return session_token

def validate_session(session_token: str) -> Optional[Dict[str, Any]]:
    """
    Validate a session token and return user data if valid.
    
    Args:
        session_token: Session token to validate
        
    Returns:
        User data if session is valid, None otherwise
    """
    # Check if session token is provided
    if not session_token:
        return None
    
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load sessions
    with open(SESSIONS_FILE, 'r') as f:
        session_data = json.load(f)
    
    # Check if session exists
    if session_token not in session_data["sessions"]:
        return None
    
    # Get session info
    session_info = session_data["sessions"][session_token]
    
    # Check if session has expired
    if session_info["expires_at"] < time.time():
        # Remove expired session
        del session_data["sessions"][session_token]
        with open(SESSIONS_FILE, 'w') as f:
            json.dump(session_data, f, indent=4)
        return None
    
    # Load users
    with open(USERS_FILE, 'r') as f:
        user_data = json.load(f)
    
    # Check if user exists
    username = session_info["username"]
    if username not in user_data["users"]:
        return None
    
    # Get user info
    user_info = user_data["users"][username]
    
    # Return user data
    return {
        "username": username,
        "role": user_info["role"]
    }

def invalidate_session(session_token: str) -> None:
    """
    Invalidate a session token.
    
    Args:
        session_token: Session token to invalidate
    """
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load sessions
    with open(SESSIONS_FILE, 'r') as f:
        session_data = json.load(f)
    
    # Check if session exists
    if session_token in session_data["sessions"]:
        # Remove session
        del session_data["sessions"][session_token]
        
        # Save updated session data
        with open(SESSIONS_FILE, 'w') as f:
            json.dump(session_data, f, indent=4)

def get_all_users() -> Dict[str, Dict[str, Any]]:
    """
    Get all users.
    
    Returns:
        Dictionary mapping usernames to user data
    """
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load users
    with open(USERS_FILE, 'r') as f:
        user_data = json.load(f)
    
    # Return users
    return user_data["users"]

def delete_user(username: str) -> bool:
    """
    Delete a user.
    
    Args:
        username: Username of the user to delete
        
    Returns:
        True if user was deleted successfully, False if user doesn't exist
    """
    # Ensure auth files exist
    ensure_auth_files_exist()
    
    # Load users
    with open(USERS_FILE, 'r') as f:
        user_data = json.load(f)
    
    # Check if user exists
    if username not in user_data["users"]:
        return False
    
    # Remove user
    del user_data["users"][username]
    
    # Save updated user data
    with open(USERS_FILE, 'w') as f:
        json.dump(user_data, f, indent=4)
    
    # Load sessions
    with open(SESSIONS_FILE, 'r') as f:
        session_data = json.load(f)
    
    # Remove any sessions for this user
    for session_token, session_info in list(session_data["sessions"].items()):
        if session_info["username"] == username:
            del session_data["sessions"][session_token]
    
    # Save updated session data
    with open(SESSIONS_FILE, 'w') as f:
        json.dump(session_data, f, indent=4)
    
    return True