"""
Script to initialize roles and permissions in the database
"""

from app import app, db
from models import Role, Permission, User
import datetime

def main():
    """Initialize the database with default roles and permissions"""
    with app.app_context():
        # Create permissions
        permissions = {
            # File Management
            'file_upload': 'Can upload files',
            'file_download': 'Can download files',
            'file_delete': 'Can delete files',
            # Map Permissions
            'map_view': 'Can view maps',
            'map_create': 'Can create maps',
            # Query Permissions
            'power_query_run': 'Can run Power Queries',
            'power_query_create': 'Can create Power Queries',
            # API Permissions
            'api_access': 'Can access the API',
            # Admin Permissions
            'user_manage': 'Can manage users',
            'system_config': 'Can configure system settings'
        }
        
        print("Creating permissions...")
        for name, description in permissions.items():
            if not Permission.query.filter_by(name=name).first():
                perm = Permission(name=name, description=description)
                db.session.add(perm)
                print(f"Added permission: {name}")
        
        db.session.commit()
        
        # Create roles
        roles = {
            'administrator': {
                'description': 'Full system access',
                'permissions': list(permissions.keys())
            },
            'assessor': {
                'description': 'County assessor staff',
                'permissions': ['file_upload', 'file_download', 'file_delete', 'map_view', 'map_create', 
                               'power_query_run', 'power_query_create', 'api_access']
            },
            'gis_analyst': {
                'description': 'GIS specialist',
                'permissions': ['file_upload', 'file_download', 'map_view', 'map_create', 
                               'power_query_run', 'api_access']
            },
            'it_staff': {
                'description': 'IT support staff',
                'permissions': ['file_download', 'map_view', 'power_query_run', 'api_access', 'system_config']
            },
            'readonly': {
                'description': 'Read-only access',
                'permissions': ['file_download', 'map_view', 'api_access']
            }
        }
        
        print("Creating roles...")
        for role_name, role_data in roles.items():
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name, description=role_data['description'])
                db.session.add(role)
                db.session.flush()
                print(f"Added role: {role_name}")
            
            # Assign permissions
            for perm_name in role_data['permissions']:
                perm = Permission.query.filter_by(name=perm_name).first()
                if perm and perm not in role.permissions:
                    role.permissions.append(perm)
        
        db.session.commit()
        
        # Create admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@co.benton.wa.us',
                full_name='System Administrator',
                department='IT Department',
                last_login=datetime.datetime.utcnow(),
                active=True
            )
            db.session.add(admin)
            db.session.flush()
            
            # Assign administrator role
            admin_role = Role.query.filter_by(name='administrator').first()
            if admin_role:
                admin.roles.append(admin_role)
            
            db.session.commit()
            print("Created admin user")
        
        print("Database initialization complete")

if __name__ == '__main__':
    main()