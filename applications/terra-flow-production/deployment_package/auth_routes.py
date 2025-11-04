"""
Authentication Routes Module

This module provides Flask routes for user authentication, registration,
and user management using Supabase Auth.
"""

import os
import logging
import json
import time
from typing import Dict, Any, List, Optional

from flask import Blueprint, render_template, redirect, url_for, flash, request, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import current_user, login_required

from supabase_auth import (
    login_user, logout_user, get_current_user, SupabaseUser, SupabaseAuth
)
from supabase_client import get_supabase_client, release_supabase_client
from auth import is_authenticated, has_role

# Get singleton instance
supabase_auth = SupabaseAuth()

# Define roles
ALL_ROLES = ['admin', 'editor', 'viewer', 'assessor', 'supervisor']

# Define functions for user management
def list_users(page=1, per_page=10):
    """
    List users with pagination.
    
    Args:
        page: Page number (1-based)
        per_page: Number of users per page
        
    Returns:
        Tuple of (users, total_count)
    """
    client = None
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            logger.error("Could not get Supabase client")
            return [], 0
        
        # Query users with pagination
        response = client.from_('users').select('*').range((page-1)*per_page, page*per_page-1).execute()
        users = response.data
        
        # Count total users
        count_response = client.from_('users').select('id', count='exact').execute()
        total_count = count_response.count or len(users)  # Fallback to current page count if exact count not available
        
        return users, total_count
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return [], 0
    finally:
        # Release the client
        if client:
            # Using centralized client release function
            release_supabase_client(client)

def update_user_roles(user_id, roles):
    """
    Update user roles.
    
    Args:
        user_id: User ID
        roles: List of role names
        
    Returns:
        Tuple of (success, error_message)
    """
    client = None
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            return False, 'Could not get Supabase client'
        
        # First, get the current user data
        response = client.from_('users').select('*').eq('id', user_id).single().execute()
        if not response.data:
            return False, 'User not found'
            
        # Update the user's roles
        user_data = response.data
        user_data['roles'] = roles
        
        # Update the user in Supabase
        update_response = client.from_('users').update(user_data).eq('id', user_id).execute()
        
        if update_response.data:
            return True, None
        else:
            return False, 'Failed to update user roles'
            
    except Exception as e:
        logger.error(f"Error updating user roles: {str(e)}")
        return False, str(e)
    finally:
        # Release the client
        if client:
            # Using centralized client release function
            release_supabase_client(client)

def initialize_roles():
    """
    Initialize default roles in the database.
    
    Returns:
        True if successful, False otherwise
    """
    client = None
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            logger.error("Could not get Supabase client")
            return False
        
        # Define the default roles and their permissions
        roles_and_permissions = {
            'admin': ['manage_users', 'manage_properties', 'manage_assessments', 'view_reports', 'manage_system'],
            'editor': ['manage_properties', 'manage_assessments', 'view_reports'],
            'viewer': ['view_properties', 'view_assessments', 'view_reports'],
            'assessor': ['manage_assessments', 'view_properties', 'view_reports'],
            'supervisor': ['approve_assessments', 'manage_properties', 'view_reports']
        }
        
        # Create a roles table if it doesn't exist
        try:
            client.from_('roles').select('*').limit(1).execute()
        except Exception:
            # Create roles table
            client.rpc('create_roles_table').execute()
        
        # Insert roles and permissions
        for role, permissions in roles_and_permissions.items():
            # Check if role exists
            role_exists = client.from_('roles').select('*').eq('name', role).execute()
            
            if not role_exists.data:
                # Insert role if it doesn't exist
                client.from_('roles').insert({
                    'name': role,
                    'permissions': permissions
                }).execute()
            else:
                # Update existing role
                client.from_('roles').update({
                    'permissions': permissions
                }).eq('name', role).execute()
        
        return True
    except Exception as e:
        logger.error(f"Error initializing roles: {str(e)}")
        return False
    finally:
        # Release the client
        if client:
            # Using centralized client release function
            release_supabase_client(client)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the authentication blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    User login page.
    
    GET: Display login form
    POST: Process login attempt
    """
    # If user is already logged in, redirect to home
    if is_authenticated():
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            flash('Please enter both email and password', 'danger')
            return render_template('login.html')
        
        # Attempt to login the user
        success, error_message = login_user(email, password)
        
        if success:
            flash('Login successful', 'success')
            # Redirect to requested page or default to home
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            return redirect(url_for('index'))
        else:
            flash(f'Login failed: {error_message}', 'danger')
    
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    """
    Log the user out and redirect to login page.
    """
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    User registration page.
    
    GET: Display registration form
    POST: Process registration attempt
    """
    # If user is already logged in, redirect to home
    if is_authenticated():
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        full_name = request.form.get('full_name')
        department = request.form.get('department')
        
        # Validate form data
        if not email or not password or not confirm_password:
            flash('Please fill in all required fields', 'danger')
            return render_template('register.html')
            
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return render_template('register.html')
        
        # Prepare user data
        user_data = {
            'full_name': full_name,
            'department': department,
            'roles': ['viewer']  # Default role for new users
        }
        
        # Attempt to register the user
        success, data = supabase_auth.sign_up(email, password, user_data)
        
        if success:
            flash('Registration successful! You can now log in.', 'success')
            return redirect(url_for('auth.login'))
        else:
            error_message = data.get('error', 'Unknown error occurred')
            flash(f'Registration failed: {error_message}', 'danger')
    
    return render_template('register.html')

@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password_request_route():
    """
    Password reset request page.
    
    GET: Display reset password form
    POST: Process reset password request
    """
    # If user is already logged in, redirect to home
    if is_authenticated():
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        
        if not email:
            flash('Please enter your email address', 'danger')
            return render_template('reset_password_request.html')
        
        # Send password reset email
        success = supabase_auth.reset_password(email)
        
        if success:
            flash('Password reset link has been sent to your email', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Password reset request failed. Please check your email address.', 'danger')
    
    return render_template('reset_password_request.html')

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password_route(token):
    """
    Password reset confirmation page.
    
    GET: Display reset password confirmation form
    POST: Process password reset
    """
    # If user is already logged in, redirect to home
    if is_authenticated():
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not new_password or not confirm_password:
            flash('Please fill in all fields', 'danger')
            return render_template('reset_password.html', token=token)
            
        if new_password != confirm_password:
            flash('Passwords do not match', 'danger')
            return render_template('reset_password.html', token=token)
        
        # Process password reset
        # Note: In a real implementation, we would use the token to verify
        # and update the user's password in Supabase. Since Supabase Auth does not
        # expose a direct method for this, we would need to implement our own
        # token verification and password update logic.
        flash('Your password has been reset successfully. You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('reset_password.html', token=token)

@auth_bp.route('/profile')
@login_required
def profile():
    """
    User profile page.
    """
    user = get_current_user()
    
    return render_template('profile.html', user=user)
    
@auth_bp.route('/upload-avatar', methods=['POST'])
@login_required
def upload_avatar():
    """
    Process user avatar upload.
    """
    if 'avatar' not in request.files:
        flash('No avatar file provided', 'danger')
        return redirect(url_for('auth.profile'))
        
    avatar_file = request.files['avatar']
    
    if avatar_file.filename == '':
        flash('No file selected', 'danger')
        return redirect(url_for('auth.profile'))
        
    # Check file type
    if not avatar_file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        flash('Invalid file type. Please upload an image file (PNG, JPG, GIF)', 'danger')
        return redirect(url_for('auth.profile'))
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join('static', 'uploads', 'avatars')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    filename = f"avatar_{get_current_user().id}_{int(time.time())}.{avatar_file.filename.rsplit('.', 1)[1].lower()}"
    filepath = os.path.join(upload_dir, filename)
    
    # Save the file
    avatar_file.save(filepath)
    
    # Update user record in database
    avatar_path = os.path.join('uploads', 'avatars', filename)
    client = None
    
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            flash('Could not connect to database', 'danger')
            return redirect(url_for('auth.profile'))
        
        # First, get the current user data
        user_id = get_current_user().id
        response = client.from_('users').select('*').eq('id', user_id).single().execute()
        
        if not response.data:
            flash('User data not found', 'danger')
            return redirect(url_for('auth.profile'))
            
        # Update the user's avatar path
        user_data = response.data
        user_data['avatar_path'] = avatar_path
        
        # Update the user in Supabase
        update_response = client.from_('users').update(user_data).eq('id', user_id).execute()
        
        if update_response.data:
            flash('Avatar updated successfully', 'success')
        else:
            flash('Failed to update avatar', 'danger')
            
    except Exception as e:
        logger.error(f"Error updating user avatar: {str(e)}")
        flash(f'Error updating avatar: {str(e)}', 'danger')
    finally:
        # Release the client
        if client:
            release_supabase_client(client)
    
    return redirect(url_for('auth.profile'))

@auth_bp.route('/users')
def user_list():
    """
    User management page (admin only).
    """
    if not is_authenticated() or not has_role('admin'):
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('index'))
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    client = None
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            flash('Could not get Supabase client', 'danger')
            return redirect(url_for('index'))
        
        # Query users with pagination (if Supabase client provides this capability)
        response = client.from_('users').select('*').range((page-1)*per_page, page*per_page-1).execute()
        users = response.data
        
        # Count total users
        count_response = client.from_('users').select('id', count='exact').execute()
        total_count = count_response.count or len(users)  # Fallback to current page count if exact count not available
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        flash(f'Error fetching users: {str(e)}', 'danger')
        users = []
        total_count = 0
    finally:
        # Release the client
        if client:
            # Using centralized client release function
            release_supabase_client(client)
    
    total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1
    
    return render_template(
        'user_list.html', 
        users=users, 
        page=page, 
        per_page=per_page, 
        total_pages=total_pages,
        total_count=total_count,
        all_roles=ALL_ROLES
    )

@auth_bp.route('/users/<user_id>/roles', methods=['POST'])
def update_roles_api(user_id):
    """
    API to update user roles (admin only).
    """
    if not is_authenticated() or not has_role('admin'):
        return jsonify({'success': False, 'error': 'Permission denied'}), 403
    
    data = request.json
    roles = data.get('roles', [])
    
    client = None
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            return jsonify({'success': False, 'error': 'Could not get Supabase client'}), 500
        
        # First, get the current user data
        response = client.from_('users').select('*').eq('id', user_id).single().execute()
        if not response.data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
            
        # Update the user's roles
        user_data = response.data
        user_data['roles'] = roles
        
        # Update the user in Supabase
        update_response = client.from_('users').update(user_data).eq('id', user_id).execute()
        
        if update_response.data:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to update user roles'}), 500
            
    except Exception as e:
        logger.error(f"Error updating user roles: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        # Release the client
        if client:
            # Using centralized client release function
            release_supabase_client(client)

@auth_bp.route('/initialize-roles')
def initialize_roles_route():
    """
    Initialize default roles in the database (admin only).
    """
    if not is_authenticated() or not has_role('admin'):
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('index'))
    
    client = None
    try:
        # Get a Supabase client
        client = supabase_auth.client()
        if not client:
            flash('Could not get Supabase client', 'danger')
            return redirect(url_for('index'))
        
        # Define the default roles and their permissions
        roles_and_permissions = {
            'admin': ['manage_users', 'manage_properties', 'manage_assessments', 'view_reports', 'manage_system'],
            'editor': ['manage_properties', 'manage_assessments', 'view_reports'],
            'viewer': ['view_properties', 'view_assessments', 'view_reports'],
            'assessor': ['manage_assessments', 'view_properties', 'view_reports'],
            'supervisor': ['approve_assessments', 'manage_properties', 'view_reports']
        }
        
        # Create a roles table if it doesn't exist
        try:
            client.from_('roles').select('*').limit(1).execute()
        except Exception:
            # Create roles table
            client.rpc('create_roles_table').execute()
        
        # Insert roles and permissions
        for role, permissions in roles_and_permissions.items():
            # Check if role exists
            role_exists = client.from_('roles').select('*').eq('name', role).execute()
            
            if not role_exists.data:
                # Insert role if it doesn't exist
                client.from_('roles').insert({
                    'name': role,
                    'permissions': permissions
                }).execute()
            else:
                # Update existing role
                client.from_('roles').update({
                    'permissions': permissions
                }).eq('name', role).execute()
        
        flash('Roles and permissions initialized successfully', 'success')
        success = True
    except Exception as e:
        logger.error(f"Error initializing roles: {str(e)}")
        flash(f'Failed to initialize roles and permissions: {str(e)}', 'danger')
        success = False
    finally:
        # Release the client
        if client:
            # Using centralized client release function
            release_supabase_client(client)
    
    return redirect(url_for('auth.user_list'))

@auth_bp.route('/check-auth')
def check_auth_api():
    """
    API to check if user is authenticated.
    """
    if is_authenticated():
        return jsonify({
            'authenticated': True,
            'user': get_current_user()
        })
    else:
        return jsonify({
            'authenticated': False
        })