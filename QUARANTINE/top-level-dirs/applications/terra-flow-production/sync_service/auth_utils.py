"""
Authentication utilities for sync service routes.

These functions provide authentication and authorization for the sync service routes.
They are wrappers around the main application auth functions to maintain
separation of concerns.
"""

import functools
from flask import session, redirect, url_for, flash, request
from auth import is_authenticated, has_permission, has_role

def login_required(f):
    """Decorator to require login for view functions"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role for view functions"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login', next=request.url))
        
        if not has_role('admin'):
            flash('You do not have permission to access this page.', 'danger')
            return redirect(url_for('index'))
        
        return f(*args, **kwargs)
    return decorated_function

def permission_required(permission_name):
    """Decorator to require specific permission for a view function"""
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_authenticated():
                flash('Please log in to access this page.', 'warning')
                return redirect(url_for('login', next=request.url))
            
            if not has_permission(permission_name):
                flash(f'You do not have the required permission: {permission_name}', 'danger')
                return redirect(url_for('index'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator