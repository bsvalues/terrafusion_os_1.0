"""
auth.py

Provides role-based access control (RBAC) decorators for Flask routes.
"""
from functools import wraps
from flask import session, redirect, url_for, flash, request

# Example user roles: 'admin', 'manager', 'user'

def require_role(role):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user = session.get('user')
            if not user or 'role' not in user or user['role'] != role:
                flash('You do not have permission to perform this action.', 'danger')
                return redirect(url_for('index', next=request.url))
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Example usage:
# @require_role('admin')
# def protected_route():
#     ...
