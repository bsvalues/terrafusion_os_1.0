"""
Global test fixtures for GeoAssessmentPro.
"""
import os
import sys
import pytest
import datetime
import uuid
from flask import Flask
from flask.testing import FlaskClient
from typing import Dict, Any, Generator, Tuple

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app, db
from models import User, Role, Permission, Property, Assessment, TaxRecord


@pytest.fixture(scope="session")
def app() -> Flask:
    """
    Create a Flask application for testing.
    
    Returns:
        Flask: The Flask application instance
    """
    # Set the testing configuration
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": os.environ.get("TEST_DATABASE_URL") or "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False,
        "SERVER_NAME": "localhost.localdomain",
    })
    
    # Create an application context
    with flask_app.app_context():
        # Create all tables in the test database
        db.create_all()
        
        # Seed test data
        _seed_test_data()
        
        yield flask_app
        
        # Clean up after the tests
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app: Flask) -> FlaskClient:
    """
    Create a test client for the Flask application.
    
    Args:
        app: The Flask application fixture
        
    Returns:
        FlaskClient: The Flask test client
    """
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture(scope="function")
def db_session(app: Flask) -> Generator:
    """
    Create a database session for testing.
    
    Args:
        app: The Flask application fixture
        
    Returns:
        Generator: The database session
    """
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        
        session = db.session
        
        yield session
        
        # Roll back the transaction
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    """
    Create an admin user for testing.
    
    Args:
        db_session: The database session fixture
        
    Returns:
        User: The admin user
    """
    # Check if admin user already exists
    admin = User.query.filter_by(username="admin_test").first()
    if admin:
        return admin
    
    # Create admin role if it doesn't exist
    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator role")
        db_session.add(admin_role)
        db_session.commit()
    
    # Create admin user
    admin = User(
        username="admin_test",
        email="admin@example.com",
        full_name="Admin User",
        department="IT",
        active=True
    )
    
    # Add admin role to user
    admin.roles.append(admin_role)
    
    db_session.add(admin)
    db_session.commit()
    
    return admin


@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    """
    Create a regular user for testing.
    
    Args:
        db_session: The database session fixture
        
    Returns:
        User: The regular user
    """
    # Check if regular user already exists
    user = User.query.filter_by(username="user_test").first()
    if user:
        return user
    
    # Create regular role if it doesn't exist
    role = Role.query.filter_by(name="user").first()
    if not role:
        role = Role(name="user", description="Regular user role")
        db_session.add(role)
        db_session.commit()
    
    # Create regular user
    user = User(
        username="user_test",
        email="user@example.com",
        full_name="Regular User",
        department="Assessment",
        active=True
    )
    
    # Add role to user
    user.roles.append(role)
    
    db_session.add(user)
    db_session.commit()
    
    return user


@pytest.fixture(scope="function")
def auth_token(client: FlaskClient, admin_user: User) -> str:
    """
    Get an authentication token for the admin user.
    
    Args:
        client: The Flask test client
        admin_user: The admin user fixture
        
    Returns:
        str: The authentication token
    """
    response = client.post('/api/auth/token', json={
        'username': admin_user.username,
        'password': 'test_password'  # This would typically use an environment variable
    })
    
    return response.json['token']


@pytest.fixture(scope="function")
def test_property(db_session, regular_user) -> Tuple[Property, Dict[str, Any]]:
    """
    Create a test property for testing.
    
    Args:
        db_session: The database session fixture
        regular_user: The regular user fixture
        
    Returns:
        Tuple[Property, Dict]: The property instance and its data as a dictionary
    """
    # Create test property
    property_id = uuid.uuid4()
    
    property_data = {
        "id": property_id,
        "parcel_id": f"TEST-PARCEL-{property_id.hex[:8]}",
        "address": "123 Test Street",
        "city": "Kennewick",
        "state": "WA",
        "zip_code": "99336",
        "property_type": "residential",
        "lot_size": 5000.0,
        "year_built": 2000,
        "bedrooms": 3,
        "bathrooms": 2.0,
        "total_area": 2200.0,
        "owner_name": "Test Owner",
        "owner_address": "123 Test Street, Kennewick, WA 99336",
        "purchase_date": datetime.date(2019, 1, 15),
        "purchase_price": 350000.0,
        "features": {
            "garage": True,
            "pool": False,
            "fireplace": True,
            "basement": True
        },
        "location": {
            "type": "Point",
            "coordinates": [-119.2020, 46.2090]
        }
    }
    
    property_obj = Property(**property_data)
    
    db_session.add(property_obj)
    db_session.commit()
    
    return property_obj, property_data


@pytest.fixture(scope="function")
def test_assessment(db_session, test_property, admin_user) -> Assessment:
    """
    Create a test assessment for testing.
    
    Args:
        db_session: The database session fixture
        test_property: The test property fixture
        admin_user: The admin user fixture
        
    Returns:
        Assessment: The assessment instance
    """
    property_obj, _ = test_property
    
    # Create test assessment
    assessment = Assessment(
        property_id=property_obj.id,
        assessment_date=datetime.date.today(),
        assessor_id=admin_user.id,
        land_value=125000.0,
        improvement_value=250000.0,
        total_value=375000.0,
        valuation_method="market",
        status="complete",
        notes="Test assessment"
    )
    
    db_session.add(assessment)
    db_session.commit()
    
    return assessment


def _seed_test_data() -> None:
    """
    Seed the test database with initial data.
    """
    # Create permissions
    permissions = [
        Permission(name="create_property", description="Create property records"),
        Permission(name="read_property", description="Read property records"),
        Permission(name="update_property", description="Update property records"),
        Permission(name="delete_property", description="Delete property records"),
        Permission(name="create_assessment", description="Create assessments"),
        Permission(name="read_assessment", description="Read assessments"),
        Permission(name="update_assessment", description="Update assessments"),
        Permission(name="delete_assessment", description="Delete assessments"),
        Permission(name="admin_access", description="Access admin features"),
    ]
    
    for permission in permissions:
        existing = Permission.query.filter_by(name=permission.name).first()
        if not existing:
            db.session.add(permission)
    
    # Create roles
    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator role")
        db.session.add(admin_role)
    
    user_role = Role.query.filter_by(name="user").first()
    if not user_role:
        user_role = Role(name="user", description="Regular user role")
        db.session.add(user_role)
    
    readonly_role = Role.query.filter_by(name="readonly").first()
    if not readonly_role:
        readonly_role = Role(name="readonly", description="Read-only role")
        db.session.add(readonly_role)
    
    db.session.commit()
    
    # Assign permissions to roles
    admin_role = Role.query.filter_by(name="admin").first()
    user_role = Role.query.filter_by(name="user").first()
    readonly_role = Role.query.filter_by(name="readonly").first()
    
    # Admin gets all permissions
    for permission in Permission.query.all():
        if permission not in admin_role.permissions:
            admin_role.permissions.append(permission)
    
    # User gets certain permissions
    for permission_name in ["read_property", "read_assessment", "create_assessment", "update_assessment"]:
        permission = Permission.query.filter_by(name=permission_name).first()
        if permission and permission not in user_role.permissions:
            user_role.permissions.append(permission)
    
    # Readonly gets only read permissions
    for permission_name in ["read_property", "read_assessment"]:
        permission = Permission.query.filter_by(name=permission_name).first()
        if permission and permission not in readonly_role.permissions:
            readonly_role.permissions.append(permission)
    
    db.session.commit()