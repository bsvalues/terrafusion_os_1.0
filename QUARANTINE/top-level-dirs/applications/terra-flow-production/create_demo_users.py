#!/usr/bin/env python
"""
Create demo users for the GeoAssessmentPro demonstration.
"""

import os
import sys
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Role, GISProject, Permission, user_roles, role_permissions

def create_demo_users():
    """Create demo users for the GeoAssessmentPro demonstration"""
    print("Creating demo users for GeoAssessmentPro...")
    
    # Check if users already exist
    if User.query.filter(User.username.in_(['admin_demo', 'assessor_demo', 'viewer_demo'])).count() > 0:
        print("Demo users already exist. Skipping creation.")
        return

    # Create demo roles if they don't exist
    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator with full access")
        db.session.add(admin_role)
    
    assessor_role = Role.query.filter_by(name="assessor").first()
    if not assessor_role:
        assessor_role = Role(name="assessor", description="Property assessor with edit access")
        db.session.add(assessor_role)
    
    viewer_role = Role.query.filter_by(name="viewer").first()
    if not viewer_role:
        viewer_role = Role(name="viewer", description="Read-only viewer")
        db.session.add(viewer_role)
    
    db.session.flush()  # Generate IDs without committing
    
    # Create permissions if they don't exist
    permissions = {
        "view_maps": "Access to view map data",
        "edit_maps": "Edit map data and property information",
        "manage_users": "Manage user accounts",
        "export_data": "Export assessment data",
        "view_reports": "View assessment reports",
        "create_reports": "Create new assessment reports",
        "admin_access": "Administrator level access",
        "view_properties": "View property details",
        "edit_properties": "Edit property details",
    }
    
    for perm_name, perm_desc in permissions.items():
        perm = Permission.query.filter_by(name=perm_name).first()
        if not perm:
            perm = Permission(name=perm_name, description=perm_desc)
            db.session.add(perm)
    
    db.session.flush()  # Generate IDs without committing
    
    # Assign permissions to roles
    admin_perms = Permission.query.all()
    for perm in admin_perms:
        if not db.session.query(role_permissions).filter_by(
            role_id=admin_role.id, permission_id=perm.id).first():
            admin_role.permissions.append(perm)
    
    assessor_perms = Permission.query.filter(Permission.name.in_([
        "view_maps", "edit_maps", "export_data", "view_reports", 
        "create_reports", "view_properties", "edit_properties"
    ])).all()
    
    for perm in assessor_perms:
        if not db.session.query(role_permissions).filter_by(
            role_id=assessor_role.id, permission_id=perm.id).first():
            assessor_role.permissions.append(perm)
    
    viewer_perms = Permission.query.filter(Permission.name.in_([
        "view_maps", "view_reports", "view_properties"
    ])).all()
    
    for perm in viewer_perms:
        if not db.session.query(role_permissions).filter_by(
            role_id=viewer_role.id, permission_id=perm.id).first():
            viewer_role.permissions.append(perm)
    
    # Create demo users
    admin_user = User(
        username="admin_demo",
        email="admin@bentonassessor.test",
        full_name="Admin Demo",
        department="Administration",
        password_hash=generate_password_hash("demo_password")
    )
    db.session.add(admin_user)
    db.session.flush()
    admin_user.roles.append(admin_role)
    
    assessor_user = User(
        username="assessor_demo",
        email="assessor@bentonassessor.test",
        full_name="Assessor Demo",
        department="Property Assessment",
        password_hash=generate_password_hash("demo_password")
    )
    db.session.add(assessor_user)
    db.session.flush()
    assessor_user.roles.append(assessor_role)
    
    viewer_user = User(
        username="viewer_demo",
        email="viewer@bentonassessor.test",
        full_name="Viewer Demo",
        department="Public Access",
        password_hash=generate_password_hash("demo_password")
    )
    db.session.add(viewer_user)
    db.session.flush()
    viewer_user.roles.append(viewer_role)
    
    db.session.commit()
    print("Demo users created successfully!")
    return admin_user, assessor_user, viewer_user

def create_demo_projects(users):
    """Create demo GIS projects for the users"""
    print("Creating demo GIS projects...")
    
    admin_user, assessor_user, viewer_user = users
    
    # Create projects for admin user
    admin_projects = [
        GISProject(
            name="Benton County Assessment Overview",
            description="Comprehensive property assessment view for all of Benton County",
            user_id=admin_user.id
        ),
        GISProject(
            name="Commercial District Analysis",
            description="Detailed analysis of commercial properties in key business districts",
            user_id=admin_user.id
        )
    ]
    
    # Create projects for assessor user
    assessor_projects = [
        GISProject(
            name="Residential Valuations 2025",
            description="Residential property valuations for the 2025 assessment cycle",
            user_id=assessor_user.id
        ),
        GISProject(
            name="Agricultural Land Assessment",
            description="Agricultural property assessment for farm and ranch lands",
            user_id=assessor_user.id
        )
    ]
    
    # Create project for viewer user
    viewer_projects = [
        GISProject(
            name="Public Parcels View",
            description="Public-facing view of Benton County parcel data",
            user_id=viewer_user.id
        )
    ]
    
    # Add all projects to the database
    for project in admin_projects + assessor_projects + viewer_projects:
        db.session.add(project)
    
    db.session.commit()
    print("Demo GIS projects created successfully!")

if __name__ == "__main__":
    with app.app_context():
        users = create_demo_users()
        if users:
            create_demo_projects(users)
        print("Demo setup complete!")