import os
import time
from flask import session, redirect, url_for, flash, request, jsonify, current_app
from functools import wraps
import logging
import datetime
import json
from app import db

# Conditionally import ldap
try:
    import ldap
    HAS_LDAP = True
except ImportError:
    HAS_LDAP = False
    logging.getLogger(__name__).warning("LDAP module not available, authentication will be simplified")

# Conditionally import Azure AD libraries
try:
    import msal
    HAS_MSAL = True
except ImportError:
    HAS_MSAL = False
    logging.getLogger(__name__).warning("MSAL module not available, Azure AD authentication will be disabled")

# Conditionally import Supabase client
try:
    from supabase_client import sign_in, sign_up, sign_out, get_supabase_client
    from config_loader import is_supabase_enabled
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    logging.getLogger(__name__).warning("Supabase client not available, Supabase authentication will be disabled")

logger = logging.getLogger(__name__)

# LDAP configuration - get from environment variables or use defaults
LDAP_SERVER = os.environ.get('LDAP_SERVER', 'ldap://benton.local')
LDAP_BASE_DN = os.environ.get('LDAP_BASE_DN', 'dc=benton,dc=local')
LDAP_USER_DN = os.environ.get('LDAP_USER_DN', 'ou=users,dc=benton,dc=local')
LDAP_GROUP_DN = os.environ.get('LDAP_GROUP_DN', 'ou=groups,dc=benton,dc=local')
LDAP_BIND_USER = os.environ.get('LDAP_BIND_USER', '')  # Service account for binding
LDAP_BIND_PASSWORD = os.environ.get('LDAP_BIND_PASSWORD', '')  # Service account password
LDAP_DOMAIN = os.environ.get('LDAP_DOMAIN', 'benton')  # Domain for username format

# Azure AD configuration
AZURE_AD_TENANT_ID = os.environ.get('AZURE_AD_TENANT_ID', '')
AZURE_AD_CLIENT_ID = os.environ.get('AZURE_AD_CLIENT_ID', '')
AZURE_AD_CLIENT_SECRET = os.environ.get('AZURE_AD_CLIENT_SECRET', '')
AZURE_AD_REDIRECT_URI = os.environ.get('AZURE_AD_REDIRECT_URI', 'http://localhost:5000/auth/callback')

# In a dev environment, we might want to bypass LDAP for testing
# This should be set to False in production
BYPASS_LDAP = os.environ.get('BYPASS_LDAP', 'True').lower() == 'true'  # Enable bypass for testing

# Set authentication mode (ldap, azure_ad, supabase, or local)
AUTH_MODE = os.environ.get('AUTH_MODE', 'ldap')

def login_required(f):
    """Decorator to require login for view functions"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            flash('Please log in to access this page', 'warning')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def permission_required(permission_name):
    """Decorator to require specific permission for a view function"""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if not has_permission(permission_name):
                flash(f'You do not have permission to access this page: {permission_name} required', 'danger')
                return redirect(url_for('index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def role_required(role_name):
    """Decorator to require specific role for a view function"""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if not has_role(role_name):
                flash(f'You do not have permission to access this page: {role_name} role required', 'danger')
                return redirect(url_for('index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def is_authenticated():
    """Check if user is authenticated"""
    # For development, create a test user in session if bypass is enabled
    if BYPASS_LDAP and 'user' not in session:
        from models import User
        # Retrieve the user from the database to include roles and permissions
        dev_user = User.query.filter_by(username='dev_user').first()
        if dev_user:
            session['user'] = {
                'id': dev_user.id,
                'username': dev_user.username,
                'email': dev_user.email,
                'full_name': dev_user.full_name,
                'department': dev_user.department,
                'roles': [role.name for role in dev_user.roles],
                'permissions': dev_user.get_permissions()
            }
            logger.warning("Using development test user for authentication bypass")
        
    return 'user' in session

def has_role(role_name):
    """Check if the current user has a specific role"""
    if not is_authenticated():
        return False
    
    # If user has roles stored in session, check there first
    if 'roles' in session['user']:
        return role_name in session['user']['roles']
    
    # Otherwise, check the database
    from models import User, Role
    user = User.query.get(session['user']['id'])
    if user:
        return user.has_role(role_name)
    
    return False

def has_permission(permission_name):
    """Check if the current user has a specific permission"""
    if not is_authenticated():
        return False
    
    # If user has permissions stored in session, check there first
    if 'permissions' in session['user']:
        return permission_name in session['user']['permissions']
    
    # Otherwise, check the database
    from models import User
    user = User.query.get(session['user']['id'])
    if user:
        return user.has_permission(permission_name)
    
    return False

def get_user_permissions():
    """Get all permissions for the current user"""
    if not is_authenticated():
        return []
        
    # If user has permissions stored in session, return them
    if 'permissions' in session['user']:
        return session['user']['permissions']
    
    # Otherwise, get them from the database
    from models import User
    user = User.query.get(session['user']['id'])
    if user:
        return user.get_permissions()
    
    return []

def authenticate_user(username, password):
    """Authenticate user against LDAP or Azure AD"""
    if BYPASS_LDAP:
        # For development/testing only - bypass LDAP authentication
        logger.warning("LDAP authentication bypassed for development mode")
        # For demonstration purposes only - accept any username/password combo
        # that isn't empty in dev/test mode
        if username and password:
            # Log this authentication in the audit log
            from models import AuditLog
            audit_log = AuditLog(
                user_id=1,  # dev_user ID
                action='login',
                details={'method': 'bypass', 'success': True},
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string
            )
            db.session.add(audit_log)
            db.session.commit()
            return True
        return False
    
    # Determine authentication method
    auth_method = request.form.get('auth_method', AUTH_MODE)
    
    # Use the appropriate authentication method
    if auth_method == 'azure_ad' and HAS_MSAL:
        return _authenticate_azure_ad()
    elif auth_method == 'ldap' and HAS_LDAP:
        return _authenticate_ldap(username, password)
    elif auth_method == 'supabase' and HAS_SUPABASE:
        return _authenticate_supabase(username, password)
    else:
        # If we don't have a working authentication method, log and fail
        logger.error(f"No valid authentication method available: {auth_method}")
        flash("Authentication service is currently unavailable. Please contact your administrator.", "danger")
        return False

def map_ad_groups_to_roles(user, ad_groups):
    """Map AD groups to application roles"""
    if not ad_groups:
        return
        
    # Import models
    from models import Role, db
    
    # Define mapping of AD group names to application roles
    # This mapping should be moved to a configuration file or database in production
    GROUP_ROLE_MAPPING = {
        'GIS-Administrators': 'administrator',
        'GIS-Assessors': 'assessor',
        'GIS-Analysts': 'gis_analyst',
        'GIS-IT': 'it_staff',
        'GIS-Users': 'readonly',
        # Add more mappings as needed
    }
    
    # Remove any existing roles first to ensure clean mapping
    # user.roles.clear()  # SQLAlchemy 2.0 style
    # For SQLAlchemy 1.4 compatibility:
    user.roles = []
    
    # Add roles based on group membership
    roles_added = []
    for group in ad_groups:
        if group in GROUP_ROLE_MAPPING:
            role_name = GROUP_ROLE_MAPPING[group]
            role = Role.query.filter_by(name=role_name).first()
            if role:
                user.roles.append(role)
                roles_added.append(role_name)
    
    # If no roles were added, assign the default readonly role
    if not roles_added:
        role = Role.query.filter_by(name='readonly').first()
        if role:
            user.roles.append(role)
            roles_added.append('readonly')
    
    # Save changes
    db.session.commit()
    
    logger.info(f"Mapped AD groups to roles for user {user.username}: {roles_added}")
    return roles_added

def _authenticate_ldap(username, password):
    """Authenticate user against LDAP/Active Directory"""
    if not HAS_LDAP:
        logger.error("LDAP module not available")
        return False
        
    if not username or not password:
        return False
    
    # Format the username to match expected LDAP format
    user_principal = username
    # Check if username already has domain format
    if '@' not in user_principal and '\\' not in user_principal:
        if LDAP_DOMAIN:
            user_principal = f"{LDAP_DOMAIN}\\{username}"  # Format for Windows AD
            # Alternative format: f"{username}@{LDAP_DOMAIN}.local"
    
    try:
        # Initialize connection to LDAP server
        ldap_client = ldap.initialize(LDAP_SERVER)
        ldap_client.set_option(ldap.OPT_REFERRALS, 0)
        ldap_client.protocol_version = 3
        
        # First, try to bind directly with the user credentials
        try:
            ldap_client.simple_bind_s(user_principal, password)
            authenticated = True
        except ldap.INVALID_CREDENTIALS:
            authenticated = False
            raise  # Re-raise to be caught by outer exception handler
            
        # If authentication failed and we have service account credentials, try that
        if not authenticated and LDAP_BIND_USER and LDAP_BIND_PASSWORD:
            ldap_client.simple_bind_s(LDAP_BIND_USER, LDAP_BIND_PASSWORD)
            
            # Use service account to verify user's password
            # This technique depends on LDAP server capabilities
            # Not all LDAP servers support password verification this way
            # This is a simplified example; more complex implementations may be needed
            logger.debug("Using service account to authenticate user")
        
        # Get user information from LDAP
        user_info = {}
        search_filter = f"(sAMAccountName={username})"
        if '@' in username:
            username = username.split('@')[0]  # Extract username part
            search_filter = f"(sAMAccountName={username})"
            
        try:
            # Search for the user to get their information
            results = ldap_client.search_s(
                LDAP_BASE_DN,
                ldap.SCOPE_SUBTREE,
                search_filter,
                ['displayName', 'mail', 'department', 'objectGUID', 'memberOf']
            )
            
            if results and len(results) > 0:
                dn, attributes = results[0]
                if attributes:
                    if 'displayName' in attributes and attributes['displayName']:
                        user_info['full_name'] = attributes['displayName'][0].decode('utf-8')
                    if 'mail' in attributes and attributes['mail']:
                        user_info['email'] = attributes['mail'][0].decode('utf-8')
                    if 'department' in attributes and attributes['department']:
                        user_info['department'] = attributes['department'][0].decode('utf-8')
                    if 'objectGUID' in attributes and attributes['objectGUID']:
                        # Store object GUID for future reference
                        user_info['ad_object_id'] = attributes['objectGUID'][0].hex()
                    
                    # Get group memberships for role mapping
                    if 'memberOf' in attributes and attributes['memberOf']:
                        groups = []
                        for group_dn in attributes['memberOf']:
                            # Extract the CN part (common name) from the DN
                            group_dn_decoded = group_dn.decode('utf-8')
                            cn_match = group_dn_decoded.split(',')[0]
                            if cn_match.startswith('CN='):
                                groups.append(cn_match[3:])  # Remove 'CN=' prefix
                        user_info['groups'] = groups
                        logger.debug(f"User is member of groups: {groups}")
        except Exception as e:
            logger.warning(f"Error retrieving user info from LDAP: {str(e)}")
                
        ldap_client.unbind_s()
        
        # Log this authentication in the audit log
        from models import User, AuditLog
        user = User.query.filter_by(username=username).first()
        if user:
            audit_log = AuditLog(
                user_id=user.id,
                action='login',
                details={'method': 'ldap', 'success': True},
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string
            )
            db.session.add(audit_log)
            
            # Update the user's last login time
            user.last_login = datetime.datetime.utcnow()
            db.session.commit()

        logger.info(f"Successfully authenticated user: {username}")
        
        # Return the user info for account creation/update
        return True, user_info if user_info else True
    
    except Exception as e:
        # Only access LDAP exception types if we have the module
        if HAS_LDAP and isinstance(e, ldap.INVALID_CREDENTIALS):
            logger.warning(f"Invalid credentials for user: {username}")
            
            # Log failed login attempt
            from models import User, AuditLog
            user = User.query.filter_by(username=username).first()
            if user:
                audit_log = AuditLog(
                    user_id=user.id,
                    action='login_failed',
                    details={'method': 'ldap', 'reason': 'invalid_credentials'},
                    ip_address=request.remote_addr,
                    user_agent=request.user_agent.string
                )
                db.session.add(audit_log)
                db.session.commit()
                
            return False
        elif HAS_LDAP and isinstance(e, ldap.SERVER_DOWN):
            logger.error("LDAP server unavailable")
            flash("Authentication service unavailable. Please try again later.", "danger")
            return False
        
        logger.error(f"Authentication error: {str(e)}")
        return False

def _authenticate_azure_ad():
    """Authenticate user using Azure AD (OAuth flow)"""
    if not HAS_MSAL:
        logger.error("MSAL module not available for Azure AD authentication")
        return False
        
    # This would be the start of the Azure AD authentication flow
    # We would redirect to Azure AD login page and handle the callback
    # For now, just return False as placeholder
    
    # Implementation will vary based on specific Azure AD integration requirements
    logger.warning("Azure AD authentication not yet implemented")
    return False

def _authenticate_supabase(username, password):
    """Authenticate user using Supabase Authentication"""
    if not HAS_SUPABASE:
        logger.error("Supabase client not available")
        return False
        
    if not username or not password:
        return False
    
    try:
        # Try to sign in using Supabase
        auth_result = sign_in(username, password)
        
        if "error" in auth_result:
            logger.warning(f"Supabase authentication failed: {auth_result['error']}")
            
            # Log failed login attempt
            from models import User, AuditLog
            user = User.query.filter_by(username=username).first()
            if user:
                audit_log = AuditLog(
                    user_id=user.id,
                    action='login_failed',
                    details={'method': 'supabase', 'reason': auth_result['error']},
                    ip_address=request.remote_addr,
                    user_agent=request.user_agent.string
                )
                db.session.add(audit_log)
                db.session.commit()
                
            return False
        
        # Extract user info from Supabase response
        supabase_user = auth_result.get('user')
        if not supabase_user:
            logger.error("Supabase authentication returned no user data")
            return False
            
        # Prepare user info to return
        user_info = {
            'email': supabase_user.get('email'),
            'supabase_id': supabase_user.get('id'),
            'full_name': supabase_user.get('user_metadata', {}).get('full_name', ''),
            'department': supabase_user.get('user_metadata', {}).get('department', ''),
        }
        
        # Log successful authentication
        from models import User, AuditLog
        user = User.query.filter_by(username=username).first()
        if user:
            audit_log = AuditLog(
                user_id=user.id,
                action='login',
                details={'method': 'supabase', 'success': True},
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string
            )
            db.session.add(audit_log)
            
            # Update the user's last login time
            user.last_login = datetime.datetime.utcnow()
            db.session.commit()
        
        logger.info(f"Successfully authenticated user with Supabase: {username}")
        
        # Return success and user_info for account creation/update
        return True, user_info
        
    except Exception as e:
        logger.error(f"Error during Supabase authentication: {str(e)}")
        return False

def logout_user():
    """Remove user from session and log the logout"""
    
    # Log the logout in the audit log if the user was authenticated
    if 'user' in session:
        from models import AuditLog
        
        try:
            audit_log = AuditLog(
                user_id=session['user']['id'],
                action='logout',
                details={'method': 'explicit_logout'},
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string
            )
            db.session.add(audit_log)
            db.session.commit()
            
            # If Supabase auth is enabled, also sign out there
            if is_supabase_enabled() and HAS_SUPABASE:
                sign_out()
                
        except Exception as e:
            logger.error(f"Error logging logout: {str(e)}")
    
    # Clear the session
    session.pop('user', None)
