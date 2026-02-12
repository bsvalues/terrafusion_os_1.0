"""
TerraFusionPlatform Authentication View

This module handles user authentication and session management UI.
"""

import streamlit as st
import json
import os
import time
from hashlib import sha256
import hmac

# Import from auth manager
from auth_manager import authenticate_user, create_session, AUTH_DIR, USERS_FILE

# Import design system
from design_system import apply_design_system, alert

def display_login_page() -> bool:
    """
    Display the login page and handle authentication.
    
    Returns:
        True if user is authenticated, False otherwise
    """
    # Check if user is already authenticated
    if "auth_token" in st.session_state and "username" in st.session_state:
        return True
    
    # Apply the design system to ensure consistent styling
    apply_design_system()
    
    # Center the login form
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("<h1 style='text-align: center;'>🚀 TerraFusionPlatform</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center;'>AI-Driven DevOps Framework</p>", unsafe_allow_html=True)
        
        # Login form
        with st.form("login_form"):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            submit_button = st.form_submit_button("Login")
            
            if submit_button:
                if not username or not password:
                    st.error("Username and password are required.")
                    return False
                
                # Authenticate user
                result = authenticate_user(username, password)
                if result:
                    # Create a new session
                    session_token = create_session(username)
                    
                    # Store session token and username in session state
                    st.session_state.auth_token = session_token
                    st.session_state.username = username
                    
                    # Reload the page to display authenticated content
                    st.rerun()
                    return True
                else:
                    st.error("Invalid username or password.")
                    return False
        
        # Check if users file exists
        if not os.path.exists(USERS_FILE):
            if not os.path.exists(AUTH_DIR):
                os.makedirs(AUTH_DIR)
            
            # Create users with initial user
            with st.form("create_initial_user_form"):
                st.markdown("### Create Initial Admin User")
                admin_username = st.text_input("Admin Username")
                admin_password = st.text_input("Admin Password", type="password")
                confirm_password = st.text_input("Confirm Password", type="password")
                
                create_button = st.form_submit_button("Create Admin User")
                
                if create_button:
                    if not admin_username or not admin_password:
                        st.error("Username and password are required.")
                        return False
                        
                    if admin_password != confirm_password:
                        st.error("Passwords do not match.")
                        return False
                    
                    # Generate salt and hash password
                    salt = os.urandom(32).hex()
                    password_hash = hmac.new(
                        salt.encode(),
                        admin_password.encode(),
                        sha256
                    ).hexdigest()
                    
                    # Create users file with admin user
                    user_data = {
                        "users": {
                            admin_username: {
                                "password_hash": password_hash,
                                "salt": salt,
                                "role": "admin",
                                "created_at": time.time()
                            }
                        }
                    }
                    
                    with open(USERS_FILE, 'w') as f:
                        json.dump(user_data, f, indent=4)
                    
                    alert(f"Admin user '{admin_username}' created successfully.", "success")
                    return False
    
    return False

def handle_logout() -> None:
    """Handle user logout."""
    # Clear the auth token and username from session state
    if "auth_token" in st.session_state:
        del st.session_state["auth_token"]
    if "username" in st.session_state:
        del st.session_state["username"]
    
    # Reload the page to display login form
    st.rerun()