"""
Main routes for the Levy Calculation System.

This module defines the main routes for navigating the application,
including the landing page, dashboard, and authentication.
"""

import os
from datetime import datetime
from functools import wraps

from flask import (
    Blueprint, render_template, redirect, url_for, flash, request,
    jsonify, current_app, session, abort
)
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user

from app import db
from models import User, TaxDistrict, TaxCode, Property, ImportLog, LevyRate


# Create the main blueprint
main_bp = Blueprint('main', __name__)


@main_bp.route('/index')
@main_bp.route('/dashboard')
@login_required
def index():
    """
    Main dashboard for authenticated users.
    
    Displays summary information and key metrics for the user.
    """
    # Get current tax year
    current_year = datetime.now().year
    
    # Count records for dashboard metrics
    district_count = TaxDistrict.query.filter_by(year=current_year).count()
    tax_code_count = TaxCode.query.filter_by(year=current_year).count()
    property_count = Property.query.filter_by(year=current_year).count()
    
    # Get recent imports
    recent_imports = ImportLog.query.filter_by(
        user_id=current_user.id
    ).order_by(ImportLog.created_at.desc()).limit(5).all()
    
    # Calculate aggregate metrics
    total_assessed_value = db.session.query(
        db.func.sum(TaxCode.total_assessed_value)
    ).filter_by(year=current_year).scalar() or 0
    
    total_levy_amount = db.session.query(
        db.func.sum(LevyRate.levy_amount)
    ).filter_by(year=current_year).scalar() or 0
    
    # Calculate average levy rate (weighted by assessed value)
    if total_assessed_value > 0:
        avg_levy_rate = total_levy_amount / total_assessed_value * 1000
    else:
        avg_levy_rate = 0
    
    # Render the dashboard template with context data
    return render_template(
        'index.html',
        title='Dashboard',
        district_count=district_count,
        tax_code_count=tax_code_count, 
        property_count=property_count,
        recent_imports=recent_imports,
        total_assessed_value=total_assessed_value,
        total_levy_amount=total_levy_amount,
        avg_levy_rate=avg_levy_rate,
        current_year=current_year
    )


@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    User login route.
    
    Authenticates users and redirects to the dashboard on success.
    """
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    # Handle form submission
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        # Find the user by username
        user = User.query.filter_by(username=username).first()
        
        # Check if user exists and password is correct
        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=remember)
            
            # Update last login timestamp
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Redirect to the requested page or dashboard
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            return redirect(url_for('main.index'))
        
        # Invalid login attempt
        flash('Invalid username or password', 'danger')
    
    # Render login template for GET requests
    return render_template('login.html', title='Log In')


@main_bp.route('/logout')
@login_required
def logout():
    """
    User logout route.
    
    Ends the user session and redirects to login page.
    """
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('main.login'))


@main_bp.route('/profile')
@login_required
def profile():
    """
    User profile page.
    
    Displays user information and account settings.
    """
    return render_template('profile.html', title='User Profile')


@main_bp.route('/profile/update', methods=['POST'])
@login_required
def update_profile():
    """
    Update user profile information.
    
    Handles form submission to update user details.
    """
    # Get form data
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    email = request.form.get('email')
    
    # Update user record
    current_user.first_name = first_name
    current_user.last_name = last_name
    
    # Only update email if it has changed and is not in use
    if email != current_user.email:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email is already in use', 'danger')
            return redirect(url_for('main.profile'))
        current_user.email = email
    
    # Commit changes to database
    db.session.commit()
    
    flash('Profile updated successfully', 'success')
    return redirect(url_for('main.profile'))


@main_bp.route('/profile/change-password', methods=['POST'])
@login_required
def change_password():
    """
    Change user password.
    
    Validates current password and updates to new password.
    """
    # Get form data
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Validate current password
    if not check_password_hash(current_user.password_hash, current_password):
        flash('Current password is incorrect', 'danger')
        return redirect(url_for('main.profile'))
    
    # Validate new password
    if new_password != confirm_password:
        flash('New passwords do not match', 'danger')
        return redirect(url_for('main.profile'))
    
    # Update password
    current_user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    flash('Password updated successfully', 'success')
    return redirect(url_for('main.profile'))


@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    New user registration.
    
    Creates a new user account with the provided details.
    """
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    # Handle form submission
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validate passwords match
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('main.register'))
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'danger')
            return redirect(url_for('main.register'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'danger')
            return redirect(url_for('main.register'))
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Add to database
        db.session.add(new_user)
        db.session.commit()
        
        flash('Account created successfully. You can now log in.', 'success')
        return redirect(url_for('main.login'))
    
    # Render registration form for GET requests
    return render_template('register.html', title='Register')


@main_bp.route('/about')
def about():
    """
    About page with application information.
    """
    return render_template('about.html', title='About')


@main_bp.route('/help')
def help_page():
    """
    Help page with user documentation.
    """
    return render_template('help.html', title='Help')