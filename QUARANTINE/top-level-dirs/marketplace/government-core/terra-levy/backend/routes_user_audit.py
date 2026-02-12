"""
Routes for the User Audit module.

This module provides routes for:
- User activity tracking and reporting
- Levy override management and approval
- User behavior analytics
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, session, abort, current_app
from flask_login import login_required, current_user
from sqlalchemy import func, desc, and_, or_, case, extract

from app import db
from models import (
    User, UserActionLog, LevyOverrideLog, TaxDistrict, TaxCode, 
    LevyRate, TaxCodeHistoricalRate
)

# Create blueprint
user_audit_bp = Blueprint("user_audit", __name__, url_prefix="/user-audit")

# Configure logging
logger = logging.getLogger(__name__)

@user_audit_bp.route("/", methods=["GET"])
@login_required
def index():
    """User Audit Dashboard page."""
    # Check if user is admin or has appropriate permissions
    if not current_user.is_admin:
        flash("You do not have permission to access the user audit module.", "warning")
        return redirect(url_for("dashboard.index"))
    
    # Get quick stats for the dashboard
    stats = {
        "total_users": User.query.count(),
        "active_users": User.query.filter_by(is_active=True).count(),
        "user_actions_today": UserActionLog.query.filter(
            UserActionLog.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0)
        ).count(),
        "pending_overrides": LevyOverrideLog.query.filter_by(
            requires_approval=True, 
            approved=None
        ).count()
    }
    
    # Get recent user actions
    recent_actions = UserActionLog.query.order_by(
        UserActionLog.timestamp.desc()
    ).limit(10).all()
    
    # Get pending levy overrides requiring approval
    pending_overrides = LevyOverrideLog.query.filter_by(
        requires_approval=True, 
        approved=None
    ).order_by(LevyOverrideLog.timestamp.desc()).limit(5).all()
    
    return render_template(
        "user_audit/index.html",
        stats=stats,
        recent_actions=recent_actions,
        pending_overrides=pending_overrides,
        title="User Audit Dashboard"
    )

@user_audit_bp.route("/activity", methods=["GET"])
@login_required
def user_activity():
    """User activity tracking and analytics."""
    if not current_user.is_admin:
        flash("You do not have permission to access user activity tracking.", "warning")
        return redirect(url_for("dashboard.index"))
    
    # Get filter parameters
    user_id = request.args.get("user_id", type=int)
    action_type = request.args.get("action_type")
    module = request.args.get("module")
    days = request.args.get("days", 7, type=int)
    
    # Build query
    query = UserActionLog.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    if action_type:
        query = query.filter_by(action_type=action_type)
    
    if module:
        query = query.filter_by(module=module)
    
    # Date filter
    if days:
        since_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(UserActionLog.timestamp >= since_date)
    
    # Get results with pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 25, type=int)
    
    pagination = query.order_by(UserActionLog.timestamp.desc()).paginate(
        page=page, per_page=per_page
    )
    
    # Get distinct action types and modules for filters
    action_types = db.session.query(
        UserActionLog.action_type, func.count(UserActionLog.id)
    ).group_by(UserActionLog.action_type).order_by(func.count(UserActionLog.id).desc()).all()
    
    modules = db.session.query(
        UserActionLog.module, func.count(UserActionLog.id)
    ).group_by(UserActionLog.module).order_by(func.count(UserActionLog.id).desc()).all()
    
    # Get all users for the user filter
    users = User.query.all()
    
    return render_template(
        "user_audit/activity.html",
        pagination=pagination,
        action_types=action_types,
        modules=modules,
        users=users,
        selected_user_id=user_id,
        selected_action_type=action_type,
        selected_module=module,
        selected_days=days,
        title="User Activity Logs"
    )

@user_audit_bp.route("/levy-overrides", methods=["GET"])
@login_required
def levy_overrides():
    """Levy override management and approval."""
    if not current_user.is_admin:
        flash("You do not have permission to access levy override management.", "warning")
        return redirect(url_for("dashboard.index"))
    
    # Get filter parameters
    user_id = request.args.get("user_id", type=int)
    tax_district_id = request.args.get("tax_district_id", type=int)
    status = request.args.get("status")  # pending, approved, rejected, all
    year = request.args.get("year", type=int)
    
    # Build query
    query = LevyOverrideLog.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    if tax_district_id:
        query = query.filter_by(tax_district_id=tax_district_id)
    
    if year:
        query = query.filter_by(year=year)
    
    if status:
        if status == "pending":
            query = query.filter_by(requires_approval=True, approved=None)
        elif status == "approved":
            query = query.filter_by(approved=True)
        elif status == "rejected":
            query = query.filter_by(approved=False)
    
    # Get results with pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 25, type=int)
    
    pagination = query.order_by(LevyOverrideLog.timestamp.desc()).paginate(
        page=page, per_page=per_page
    )
    
    # Get all tax districts for filter
    districts = TaxDistrict.query.order_by(TaxDistrict.district_name).all()
    
    # Get all users for the user filter
    users = User.query.all()
    
    # Get available years
    years = db.session.query(LevyOverrideLog.year).distinct().order_by(LevyOverrideLog.year.desc()).all()
    years = [y[0] for y in years]
    
    return render_template(
        "user_audit/levy_overrides.html",
        pagination=pagination,
        districts=districts,
        users=users,
        years=years,
        selected_user_id=user_id,
        selected_tax_district_id=tax_district_id,
        selected_status=status,
        selected_year=year,
        title="Levy Override Management"
    )

@user_audit_bp.route("/levy-override/<int:override_id>/approve", methods=["POST"])
@login_required
def approve_override(override_id):
    """Approve a levy override."""
    if not current_user.is_admin:
        flash("You do not have permission to approve levy overrides.", "warning")
        return redirect(url_for("dashboard.index"))
    
    override = LevyOverrideLog.query.get_or_404(override_id)
    
    # Check if already processed
    if override.approved is not None:
        flash("This override has already been processed.", "warning")
        return redirect(url_for("user_audit.levy_overrides"))
    
    # Get approval notes
    notes = request.form.get("approval_notes")
    
    # Update the override
    override.approved = True
    override.approver_id = current_user.id
    override.approval_timestamp = datetime.utcnow()
    override.approval_notes = notes
    
    # Commit changes
    try:
        db.session.commit()
        flash("Override has been approved successfully.", "success")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error approving override: {str(e)}")
        flash(f"Error approving override: {str(e)}", "danger")
    
    return redirect(url_for("user_audit.levy_overrides"))

@user_audit_bp.route("/levy-override/<int:override_id>/reject", methods=["POST"])
@login_required
def reject_override(override_id):
    """Reject a levy override."""
    if not current_user.is_admin:
        flash("You do not have permission to reject levy overrides.", "warning")
        return redirect(url_for("dashboard.index"))
    
    override = LevyOverrideLog.query.get_or_404(override_id)
    
    # Check if already processed
    if override.approved is not None:
        flash("This override has already been processed.", "warning")
        return redirect(url_for("user_audit.levy_overrides"))
    
    # Get rejection notes
    notes = request.form.get("approval_notes")
    
    # Update the override
    override.approved = False
    override.approver_id = current_user.id
    override.approval_timestamp = datetime.utcnow()
    override.approval_notes = notes
    
    # Commit changes
    try:
        db.session.commit()
        flash("Override has been rejected.", "success")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error rejecting override: {str(e)}")
        flash(f"Error rejecting override: {str(e)}", "danger")
    
    return redirect(url_for("user_audit.levy_overrides"))

@user_audit_bp.route("/analytics", methods=["GET"])
@login_required
def analytics():
    """User behavior analytics dashboard."""
    if not current_user.is_admin:
        flash("You do not have permission to access user analytics.", "warning")
        return redirect(url_for("dashboard.index"))
    
    # Set time frame for analytics
    days = request.args.get("days", 30, type=int)
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # User activity by day
    daily_activity = db.session.query(
        func.date(UserActionLog.timestamp).label("date"),
        func.count(UserActionLog.id).label("count")
    ).filter(
        UserActionLog.timestamp >= since_date
    ).group_by(
        func.date(UserActionLog.timestamp)
    ).order_by(
        func.date(UserActionLog.timestamp)
    ).all()
    
    # Activity by module
    module_activity = db.session.query(
        UserActionLog.module,
        func.count(UserActionLog.id).label("count")
    ).filter(
        UserActionLog.timestamp >= since_date
    ).group_by(
        UserActionLog.module
    ).order_by(
        func.count(UserActionLog.id).desc()
    ).all()
    
    # Activity by action type
    action_type_activity = db.session.query(
        UserActionLog.action_type,
        func.count(UserActionLog.id).label("count")
    ).filter(
        UserActionLog.timestamp >= since_date
    ).group_by(
        UserActionLog.action_type
    ).order_by(
        func.count(UserActionLog.id).desc()
    ).all()
    
    # Most active users
    active_users = db.session.query(
        UserActionLog.user_id,
        User.username,
        func.count(UserActionLog.id).label("count")
    ).join(
        User, UserActionLog.user_id == User.id
    ).filter(
        UserActionLog.timestamp >= since_date
    ).group_by(
        UserActionLog.user_id, User.username
    ).order_by(
        func.count(UserActionLog.id).desc()
    ).limit(10).all()
    
    # Error rates by module
    error_rates = db.session.query(
        UserActionLog.module,
        func.count(UserActionLog.id).label("total"),
        func.sum(case((UserActionLog.success == False, 1), else_=0)).label("errors")
    ).filter(
        UserActionLog.timestamp >= since_date
    ).group_by(
        UserActionLog.module
    ).order_by(
        func.sum(case((UserActionLog.success == False, 1), else_=0)).desc()
    ).all()
    
    # Prepare chart data
    daily_chart_data = {
        "labels": [str(day.date) for day in daily_activity],
        "values": [day.count for day in daily_activity]
    }
    
    module_chart_data = {
        "labels": [module.module for module in module_activity],
        "values": [module.count for module in module_activity]
    }
    
    action_chart_data = {
        "labels": [action.action_type for action in action_type_activity],
        "values": [action.count for action in action_type_activity]
    }
    
    return render_template(
        "user_audit/analytics.html",
        days=days,
        daily_chart_data=daily_chart_data,
        module_chart_data=module_chart_data,
        action_chart_data=action_chart_data,
        active_users=active_users,
        error_rates=error_rates,
        title="User Analytics Dashboard"
    )

@user_audit_bp.route("/user/<int:user_id>", methods=["GET"])
@login_required
def user_detail(user_id):
    """Detailed view of a specific user's activity."""
    if not current_user.is_admin and current_user.id != user_id:
        flash("You do not have permission to view this user's details.", "warning")
        return redirect(url_for("dashboard.index"))
    
    # Get the user
    user = User.query.get_or_404(user_id)
    
    # Set time frame
    days = request.args.get("days", 30, type=int)
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Get user's activity
    actions = UserActionLog.query.filter_by(
        user_id=user_id
    ).filter(
        UserActionLog.timestamp >= since_date
    ).order_by(UserActionLog.timestamp.desc()).limit(100).all()
    
    # Get user's levy overrides
    overrides = LevyOverrideLog.query.filter_by(
        user_id=user_id
    ).order_by(LevyOverrideLog.timestamp.desc()).limit(50).all()
    
    # Activity by module for this user
    module_activity = db.session.query(
        UserActionLog.module,
        func.count(UserActionLog.id).label("count")
    ).filter(
        UserActionLog.user_id == user_id,
        UserActionLog.timestamp >= since_date
    ).group_by(
        UserActionLog.module
    ).order_by(
        func.count(UserActionLog.id).desc()
    ).all()
    
    # Activity by day for this user
    daily_activity = db.session.query(
        func.date(UserActionLog.timestamp).label("date"),
        func.count(UserActionLog.id).label("count")
    ).filter(
        UserActionLog.user_id == user_id,
        UserActionLog.timestamp >= since_date
    ).group_by(
        func.date(UserActionLog.timestamp)
    ).order_by(
        func.date(UserActionLog.timestamp)
    ).all()
    
    # Prepare chart data
    module_chart_data = {
        "labels": [module.module for module in module_activity],
        "values": [module.count for module in module_activity]
    }
    
    daily_chart_data = {
        "labels": [str(day.date) for day in daily_activity],
        "values": [day.count for day in daily_activity]
    }
    
    return render_template(
        "user_audit/user_detail.html",
        user=user,
        actions=actions,
        overrides=overrides,
        days=days,
        module_chart_data=module_chart_data,
        daily_chart_data=daily_chart_data,
        title=f"User Activity: {user.username}"
    )

def register_user_audit_routes(app):
    """Initialize user audit routes with the Flask app."""
    app.register_blueprint(user_audit_bp)
    app.logger.info('User audit routes initialized')