"""
Populate the database with initial roles and permissions

This script creates the default roles and permissions for the application.
"""

import sys
import os
import time

# Add the current directory to the path to allow importing app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import db, app
from models import Role, Permission, User

def populate_roles():
    """Populate the database with initial roles and permissions"""
    
    with app.app_context():
        # Create default roles
        administrator = Role.query.filter_by(name='administrator').first()
        if not administrator:
            administrator = Role(name='administrator', description='System Administrator')
            db.session.add(administrator)
            
        assessor = Role.query.filter_by(name='assessor').first()
        if not assessor:
            assessor = Role(name='assessor', description='Assessor Staff')
            db.session.add(assessor)
            
        it_staff = Role.query.filter_by(name='it_staff').first()
        if not it_staff:
            it_staff = Role(name='it_staff', description='IT Staff')
            db.session.add(it_staff)
            
        gis_analyst = Role.query.filter_by(name='gis_analyst').first()
        if not gis_analyst:
            gis_analyst = Role(name='gis_analyst', description='GIS Analyst')
            db.session.add(gis_analyst)
            
        readonly = Role.query.filter_by(name='readonly').first()
        if not readonly:
            readonly = Role(name='readonly', description='Read-only User')
            db.session.add(readonly)
        
        # Define permissions
        permissions = [
            # File management permissions
            ('upload_files', 'Can upload files'),
            ('download_files', 'Can download files'),
            ('delete_files', 'Can delete files'),
            ('view_files', 'Can view files'),
            
            # Map viewer permissions
            ('view_maps', 'Can view maps'),
            ('edit_maps', 'Can edit maps'),
            ('export_maps', 'Can export maps'),
            
            # User management permissions
            ('manage_users', 'Can manage users'),
            ('manage_roles', 'Can manage roles'),
            
            # API permissions
            ('use_api', 'Can use the API'),
            ('manage_api_tokens', 'Can manage API tokens'),
            
            # Sync permissions
            ('run_sync', 'Can run sync jobs'),
            ('configure_sync', 'Can configure sync settings'),
            ('view_sync_logs', 'Can view sync logs'),
            
            # System permissions
            ('view_system_info', 'Can view system information'),
            ('manage_system', 'Can manage system settings'),
            
            # Search permissions
            ('search_basic', 'Can perform basic searches'),
            ('search_advanced', 'Can perform advanced searches')
        ]
        
        # Create permissions if they don't exist
        for name, description in permissions:
            perm = Permission.query.filter_by(name=name).first()
            if not perm:
                perm = Permission(name=name, description=description)
                db.session.add(perm)
                
        # Commit to get IDs for the permissions
        db.session.commit()
        
        # Map permissions to roles
        
        # Administrator gets all permissions
        all_permissions = Permission.query.all()
        for perm in all_permissions:
            if perm not in administrator.permissions:
                administrator.permissions.append(perm)
        
        # Assessor permissions
        assessor_perms = ['upload_files', 'download_files', 'view_files', 'view_maps', 
                         'edit_maps', 'export_maps', 'view_sync_logs', 'search_basic', 
                         'search_advanced', 'run_sync']
        
        for perm_name in assessor_perms:
            perm = Permission.query.filter_by(name=perm_name).first()
            if perm and perm not in assessor.permissions:
                assessor.permissions.append(perm)
        
        # IT Staff permissions
        it_perms = ['upload_files', 'download_files', 'view_files', 'delete_files', 
                   'view_maps', 'export_maps', 'manage_users', 'manage_api_tokens', 
                   'view_sync_logs', 'view_system_info', 'search_basic', 'search_advanced',
                   'run_sync', 'configure_sync']
                   
        for perm_name in it_perms:
            perm = Permission.query.filter_by(name=perm_name).first()
            if perm and perm not in it_staff.permissions:
                it_staff.permissions.append(perm)
                
        # GIS Analyst permissions
        gis_perms = ['upload_files', 'download_files', 'view_files', 
                    'view_maps', 'edit_maps', 'export_maps', 
                    'view_sync_logs', 'search_basic', 'search_advanced',
                    'use_api']
                    
        for perm_name in gis_perms:
            perm = Permission.query.filter_by(name=perm_name).first()
            if perm and perm not in gis_analyst.permissions:
                gis_analyst.permissions.append(perm)
        
        # Read-only permissions
        readonly_perms = ['view_files', 'view_maps', 'search_basic', 'view_sync_logs']
        
        for perm_name in readonly_perms:
            perm = Permission.query.filter_by(name=perm_name).first()
            if perm and perm not in readonly.permissions:
                readonly.permissions.append(perm)
        
        # Commit all role-permission mappings
        db.session.commit()
        
        # Create a development user with administrator role if it doesn't exist
        dev_user = User.query.filter_by(username='dev_user').first()
        if not dev_user:
            dev_user = User(
                username='dev_user',
                email='dev@example.com',
                full_name='Development User',
                department='IT'
            )
            db.session.add(dev_user)
            db.session.commit()
            
            # Assign administrator role
            if administrator not in dev_user.roles:
                dev_user.roles.append(administrator)
                db.session.commit()
                print(f"Created development user with administrator role: {dev_user.username}")
        
        print("Roles and permissions created successfully")

if __name__ == '__main__':
    populate_roles()