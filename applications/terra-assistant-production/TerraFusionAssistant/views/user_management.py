"""
TerraFusionPlatform User Management View

This module handles user management functionality for administrators.
"""

import streamlit as st
import os
import json
import time
from datetime import datetime
import pandas as pd
from typing import Dict, List, Any, Optional

# Import from auth manager
from auth_manager import AUTH_DIR, USERS_FILE, create_user, hash_password

# Import components and design system
from design_system import section_title, alert

def load_user_data() -> Dict[str, Any]:
    """
    Load user data from the users file.
    
    Returns:
        Dict containing user data
    """
    # Check if users file exists
    if not os.path.exists(USERS_FILE):
        return {"users": {}}
    
    # Load users
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def change_user_password(username: str, new_password: str) -> bool:
    """
    Change a user's password.
    
    Args:
        username: Username of the user
        new_password: New password for the user
        
    Returns:
        True if password changed successfully, False otherwise
    """
    # Load user data
    with open(USERS_FILE, 'r') as f:
        data = json.load(f)
    
    # Check if user exists
    if username not in data["users"]:
        return False
    
    # Hash new password
    password_hash, salt = hash_password(new_password)
    
    # Update user data
    data["users"][username]["password_hash"] = password_hash
    data["users"][username]["salt"] = salt
    
    # Save updated user data
    with open(USERS_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    
    return True

def display_user_list() -> None:
    """Display a list of users with basic information."""
    st.markdown("### 📋 User List")
    
    # Load user data
    user_data = load_user_data()
    
    if not user_data["users"]:
        st.info("No users found.")
        return
    
    # Display users in a table
    user_list = []
    for username, user_info in user_data["users"].items():
        created_at = datetime.fromtimestamp(user_info["created_at"]).strftime("%Y-%m-%d %H:%M")
        user_list.append({
            "Username": username,
            "Role": user_info["role"].capitalize(),
            "Created": created_at
        })
    
    # Convert to DataFrame for display
    df = pd.DataFrame(user_list)
    st.dataframe(df, use_container_width=True)

def display_create_user_form() -> None:
    """Display a form to create a new user."""
    st.markdown("### ➕ Create New User")
    
    with st.form("create_user_form"):
        new_username = st.text_input("Username", key="new_username")
        new_password = st.text_input("Password", type="password", key="new_password")
        confirm_password = st.text_input("Confirm Password", type="password", key="confirm_password")
        role = st.selectbox("Role", ["user", "admin"], key="new_role")
        
        submit_button = st.form_submit_button("Create User")
        
        if submit_button:
            if not new_username or not new_password:
                st.error("Username and password are required.")
            elif new_password != confirm_password:
                st.error("Passwords do not match.")
            else:
                # Attempt to create user
                result = create_user(new_username, new_password, role)
                if result:
                    st.success(f"User '{new_username}' created successfully.")
                    # Clear form inputs
                    st.session_state["new_username"] = ""
                    st.session_state["new_password"] = ""
                    st.session_state["confirm_password"] = ""
                else:
                    st.error(f"Username '{new_username}' already exists.")

def display_change_password_form() -> None:
    """Display a form to change a user's password."""
    st.markdown("### 🔑 Change Password")
    
    # Load user data
    user_data = load_user_data()
    usernames = list(user_data["users"].keys())
    
    with st.form("change_password_form"):
        username = st.selectbox("Select User", usernames, key="change_pwd_username")
        new_password = st.text_input("New Password", type="password", key="change_pwd_password")
        confirm_password = st.text_input("Confirm Password", type="password", key="change_pwd_confirm")
        
        submit_button = st.form_submit_button("Change Password")
        
        if submit_button:
            if not new_password:
                st.error("New password is required.")
            elif new_password != confirm_password:
                st.error("Passwords do not match.")
            else:
                # Change the password
                success = change_user_password(username, new_password)
                if success:
                    st.success(f"Password for '{username}' changed successfully.")
                    # Clear form inputs
                    st.session_state["change_pwd_password"] = ""
                    st.session_state["change_pwd_confirm"] = ""
                else:
                    st.error("An error occurred while changing the password.")

def display_user_management_page() -> None:
    """Display the user management page for administrators."""
    # Display title
    section_title("User Management", "Manage platform users and access")
    
    # Create tabs for different user management functions
    user_tabs = st.tabs(["User List", "Create User", "Change Password"])
    
    # User List tab
    with user_tabs[0]:
        display_user_list()
    
    # Create User tab
    with user_tabs[1]:
        display_create_user_form()
    
    # Change Password tab
    with user_tabs[2]:
        display_change_password_form()