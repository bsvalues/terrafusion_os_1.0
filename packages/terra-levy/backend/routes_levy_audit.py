"""
Routes for the Levy Audit module with AI-powered assistance.

This module provides routes for:
- Levy compliance auditing with AI assistance
- Interactive levy guidance and consulting
- Levy optimization recommendations
- Natural language levy query processing
- Levy calculation verification
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, session
from flask_login import login_required, current_user
from sqlalchemy import func, desc

from app import db
from models import (
    TaxDistrict, TaxCode, TaxCodeHistoricalRate, ImportLog, 
    ExportLog, AuditLog, LevyAuditRecord
)
from utils.levy_audit_agent import get_levy_audit_agent
from utils.html_sanitizer import sanitize_html

# Create blueprint
levy_audit_bp = Blueprint("levy_audit", __name__, url_prefix="/levy-audit")

# Configure logging
logger = logging.getLogger(__name__)

@levy_audit_bp.route("/", methods=["GET"])
@login_required
def index():
    """
    Render the levy audit dashboard.
    """
    # Get all tax districts for dropdown
    districts = TaxDistrict.query.order_by(TaxDistrict.name).all()
    
    # Get all available years from historical rates
    years_query = db.session.query(
        TaxCodeHistoricalRate.year
    ).distinct().order_by(
        TaxCodeHistoricalRate.year.desc()
    ).all()
    available_years = [year[0] for year in years_query]
    
    # Get recent audit logs
    try:
        recent_audits = db.session.query(LevyAuditRecord).order_by(
            desc(LevyAuditRecord.created_at)
        ).limit(5).all()
    except:
        # Handle the case where the table might not exist yet
        recent_audits = []
    
    return render_template(
        "levy_audit/index.html",
        districts=districts,
        available_years=available_years,
        recent_audits=recent_audits
    )

@levy_audit_bp.route("/compliance-audit", methods=["GET", "POST"])
@login_required
def compliance_audit():
    """
    Run a compliance audit on a specific district and year.
    """
    # Get all tax districts for dropdown
    districts = TaxDistrict.query.order_by(TaxDistrict.name).all()
    
    # Get all available years from historical rates
    years_query = db.session.query(
        TaxCodeHistoricalRate.year
    ).distinct().order_by(
        TaxCodeHistoricalRate.year.desc()
    ).all()
    available_years = [year[0] for year in years_query]
    
    # Initialize results
    audit_results = None
    district_obj = None
    year = None
    
    if request.method == "POST":
        # Get form data
        district_id = request.form.get("district_id")
        year = request.form.get("year")
        full_audit = request.form.get("full_audit") == "on"
        
        if not district_id or not year:
            flash("Please provide both district and year", "warning")
            return render_template(
                "levy_audit/compliance_audit.html",
                districts=districts,
                available_years=available_years
            )
        
        try:
            # Get the district object
            district_obj = TaxDistrict.query.get(district_id)
            if not district_obj:
                flash(f"District not found", "warning")
                return render_template(
                    "levy_audit/compliance_audit.html",
                    districts=districts,
                    available_years=available_years
                )
            
            # Convert year to int
            year = int(year)
            
            # Initialize Lev, the levy audit agent
            levy_agent = get_levy_audit_agent()
            if not levy_agent:
                flash("Levy audit agent is not available", "warning")
                return render_template(
                    "levy_audit/compliance_audit.html",
                    districts=districts,
                    available_years=available_years
                )
            
            # Run the audit
            audit_results = levy_agent.audit_levy_compliance(
                district_id=district_id,
                year=year,
                full_audit=full_audit
            )
            
            # Check for errors
            if "error" in audit_results:
                flash(f"Error running audit: {audit_results['error']}", "danger")
                return render_template(
                    "levy_audit/compliance_audit.html",
                    districts=districts,
                    available_years=available_years
                )
            
            # Save audit results to database
            try:
                # Check if the LevyAuditRecord model is available
                # If not, we'll skip the database save but still show results
                audit_record = LevyAuditRecord(
                    user_id=current_user.id,
                    tax_district_id=district_id,
                    year=year,
                    audit_type="COMPLIANCE",
                    full_audit=full_audit,
                    compliance_score=audit_results.get("compliance_score", 0.0),
                    results=audit_results,
                    status="COMPLETED"
                )
                db.session.add(audit_record)
                db.session.commit()
                
                flash("Compliance audit completed successfully", "success")
            except Exception as e:
                logger.warning(f"Could not save audit record: {str(e)}")
                # Don't fail the operation, just continue without saving
                flash("Audit completed but could not be saved to history", "info")
            
        except Exception as e:
            flash(f"Error running compliance audit: {str(e)}", "danger")
    
    return render_template(
        "levy_audit/compliance_audit.html",
        districts=districts,
        available_years=available_years,
        audit_results=audit_results,
        district=district_obj,
        year=year
    )

@levy_audit_bp.route("/levy-assistant", methods=["GET", "POST"])
@login_required
def levy_assistant():
    """
    Interactive assistant for levy questions and guidance.
    """
    # Initialize conversation history
    if "levy_conversation" not in session:
        session["levy_conversation"] = []
    
    # Get conversation history
    conversation = session.get("levy_conversation", [])
    
    if request.method == "POST":
        query = request.form.get("query")
        
        if not query:
            flash("Please enter a question", "warning")
            return render_template(
                "levy_audit/levy_assistant.html",
                conversation=conversation
            )
        
        try:
            # Initialize Lev, the levy audit agent
            levy_agent = get_levy_audit_agent()
            if not levy_agent:
                flash("Levy assistant is not available", "warning")
                return render_template(
                    "levy_audit/levy_assistant.html",
                    conversation=conversation
                )
            
            # Process the query
            response = levy_agent.process_levy_query(
                query=query,
                add_to_history=True
            )
            
            # Check for errors
            if "error" in response:
                flash(f"Error processing query: {response['error']}", "danger")
                return render_template(
                    "levy_audit/levy_assistant.html",
                    conversation=conversation
                )
            
            # Add to conversation history
            conversation.append({
                "role": "user",
                "content": query,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            conversation.append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Update session
            session["levy_conversation"] = conversation
            
        except Exception as e:
            flash(f"Error processing query: {str(e)}", "danger")
    
    return render_template(
        "levy_audit/levy_assistant.html",
        conversation=conversation
    )

@levy_audit_bp.route("/verify-calculation", methods=["GET", "POST"])
@login_required
def verify_calculation():
    """
    Verify a levy calculation with expert analysis.
    """
    # Get all tax codes for dropdown
    tax_codes = TaxCode.query.order_by(TaxCode.tax_code).all()
    
    # Get all available years from historical rates
    years_query = db.session.query(
        TaxCodeHistoricalRate.year
    ).distinct().order_by(
        TaxCodeHistoricalRate.year.desc()
    ).all()
    available_years = [year[0] for year in years_query]
    
    # Initialize results
    verification_results = None
    
    if request.method == "POST":
        # Get form data
        tax_code_id = request.form.get("tax_code_id")
        property_value = request.form.get("property_value")
        year = request.form.get("year")
        
        if not tax_code_id or not property_value:
            flash("Please provide both tax code and property value", "warning")
            return render_template(
                "levy_audit/verify_calculation.html",
                tax_codes=tax_codes,
                available_years=available_years
            )
        
        try:
            # Convert property value to float
            property_value = float(property_value)
            
            # Convert year to int if provided
            if year:
                year = int(year)
            
            # Initialize Lev, the levy audit agent
            levy_agent = get_levy_audit_agent()
            if not levy_agent:
                flash("Levy verification agent is not available", "warning")
                return render_template(
                    "levy_audit/verify_calculation.html",
                    tax_codes=tax_codes,
                    available_years=available_years
                )
            
            # Verify the calculation
            verification_results = levy_agent.verify_levy_calculation(
                tax_code_id=tax_code_id,
                property_value=property_value,
                year=year
            )
            
            # Check for errors
            if "error" in verification_results:
                flash(f"Error verifying calculation: {verification_results['error']}", "danger")
                return render_template(
                    "levy_audit/verify_calculation.html",
                    tax_codes=tax_codes,
                    available_years=available_years
                )
            
            flash("Calculation verified successfully", "success")
            
        except Exception as e:
            flash(f"Error verifying calculation: {str(e)}", "danger")
    
    return render_template(
        "levy_audit/verify_calculation.html",
        tax_codes=tax_codes,
        available_years=available_years,
        verification_results=verification_results
    )

@levy_audit_bp.route("/levy-recommendations", methods=["GET", "POST"])
@login_required
def levy_recommendations():
    """
    Generate recommendations for levy optimization and compliance.
    """
    # Get all tax districts for dropdown
    districts = TaxDistrict.query.order_by(TaxDistrict.name).all()
    
    # Get all available years from historical rates
    years_query = db.session.query(
        TaxCodeHistoricalRate.year
    ).distinct().order_by(
        TaxCodeHistoricalRate.year.desc()
    ).all()
    available_years = [year[0] for year in years_query]
    
    # Focus areas for dropdown
    focus_areas = [
        {"value": "compliance", "label": "Compliance & Legal"},
        {"value": "optimization", "label": "Rate Optimization"},
        {"value": "communication", "label": "Public Communication"}
    ]
    
    # Initialize results
    recommendations = None
    
    if request.method == "POST":
        # Get form data
        district_id = request.form.get("district_id")
        year = request.form.get("year")
        focus_area = request.form.get("focus_area")
        
        if not district_id or not year:
            flash("Please provide both district and year", "warning")
            return render_template(
                "levy_audit/levy_recommendations.html",
                districts=districts,
                available_years=available_years,
                focus_areas=focus_areas
            )
        
        try:
            # Convert year to int
            year = int(year)
            
            # Initialize Lev, the levy audit agent
            levy_agent = get_levy_audit_agent()
            if not levy_agent:
                flash("Levy recommendation agent is not available", "warning")
                return render_template(
                    "levy_audit/levy_recommendations.html",
                    districts=districts,
                    available_years=available_years,
                    focus_areas=focus_areas
                )
            
            # Generate recommendations
            recommendations = levy_agent.provide_levy_recommendations(
                district_id=district_id,
                year=year,
                focus_area=focus_area
            )
            
            # Check for errors
            if "error" in recommendations:
                flash(f"Error generating recommendations: {recommendations['error']}", "danger")
                return render_template(
                    "levy_audit/levy_recommendations.html",
                    districts=districts,
                    available_years=available_years,
                    focus_areas=focus_areas
                )
            
            flash("Recommendations generated successfully", "success")
            
        except Exception as e:
            flash(f"Error generating recommendations: {str(e)}", "danger")
    
    return render_template(
        "levy_audit/levy_recommendations.html",
        districts=districts,
        available_years=available_years,
        focus_areas=focus_areas,
        recommendations=recommendations
    )

@levy_audit_bp.route("/explain-levy-law", methods=["GET", "POST"])
@login_required
def explain_levy_law():
    """
    Get expert explanations of property tax and levy laws.
    """
    # Define jurisdictions for dropdown
    jurisdictions = [
        {"value": "WA", "label": "Washington State"},
        {"value": "OR", "label": "Oregon"},
        {"value": "CA", "label": "California"},
        {"value": "ID", "label": "Idaho"},
        {"value": "US", "label": "Federal (United States)"}
    ]
    
    # Define detail levels for dropdown
    detail_levels = [
        {"value": "basic", "label": "Basic (Overview)"},
        {"value": "standard", "label": "Standard (Comprehensive)"},
        {"value": "detailed", "label": "Detailed (Expert)"}
    ]
    
    # Initialize results
    explanation = None
    
    if request.method == "POST":
        # Get form data
        topic = request.form.get("topic")
        jurisdiction = request.form.get("jurisdiction", "WA")
        level_of_detail = request.form.get("level_of_detail", "standard")
        
        if not topic:
            flash("Please provide a topic to explain", "warning")
            return render_template(
                "levy_audit/explain_levy_law.html",
                jurisdictions=jurisdictions,
                detail_levels=detail_levels
            )
        
        try:
            # Initialize Lev, the levy audit agent
            levy_agent = get_levy_audit_agent()
            if not levy_agent:
                flash("Levy explanation agent is not available", "warning")
                return render_template(
                    "levy_audit/explain_levy_law.html",
                    jurisdictions=jurisdictions,
                    detail_levels=detail_levels
                )
            
            # Generate explanation
            explanation = levy_agent.explain_levy_law(
                topic=topic,
                jurisdiction=jurisdiction,
                level_of_detail=level_of_detail
            )
            
            # Check for errors
            if "error" in explanation:
                flash(f"Error generating explanation: {explanation['error']}", "danger")
                return render_template(
                    "levy_audit/explain_levy_law.html",
                    jurisdictions=jurisdictions,
                    detail_levels=detail_levels
                )
            
            flash("Explanation generated successfully", "success")
            
        except Exception as e:
            flash(f"Error generating explanation: {str(e)}", "danger")
    
    return render_template(
        "levy_audit/explain_levy_law.html",
        jurisdictions=jurisdictions,
        detail_levels=detail_levels,
        explanation=explanation
    )

@levy_audit_bp.route("/api/ask-lev", methods=["POST"])
@login_required
def api_ask_lev():
    """
    API endpoint for submitting queries to Lev.
    
    Request body:
    {
        "query": "What is a levy rate?",
        "context": {
            "district_id": "123",
            "year": 2025
        }
    }
    
    Response:
    {
        "query": "What is a levy rate?",
        "answer": "A levy rate is...",
        "citations": [...],
        "practical_implications": [...],
        "additional_context": "...",
        "follow_up_questions": [...]
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        query = data.get("query")
        context = data.get("context")
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        # Initialize Lev, the levy audit agent
        levy_agent = get_levy_audit_agent()
        if not levy_agent:
            return jsonify({"error": "Levy agent is not available"}), 503
        
        # Process the query
        response = levy_agent.process_levy_query(
            query=query,
            context=context,
            add_to_history=True
        )
        
        # If there's an error, format it properly
        if "error" in response:
            return jsonify({"error": response["error"]}), 500
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@levy_audit_bp.route("/api/audit-compliance", methods=["POST"])
@login_required
def api_audit_compliance():
    """
    API endpoint for running a compliance audit.
    
    Request body:
    {
        "district_id": "123",
        "year": 2025,
        "full_audit": true
    }
    
    Response:
    {
        "district_name": "...",
        "audit_year": 2025,
        "audit_type": "comprehensive",
        "compliance_summary": "...",
        "compliance_score": 95.5,
        "findings": [...],
        "overall_recommendations": [...],
        "potential_risks": [...]
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        district_id = data.get("district_id")
        year = data.get("year")
        full_audit = data.get("full_audit", False)
        
        if not district_id or not year:
            return jsonify({"error": "Missing required parameters: district_id, year"}), 400
        
        # Initialize Lev, the levy audit agent
        levy_agent = get_levy_audit_agent()
        if not levy_agent:
            return jsonify({"error": "Levy agent is not available"}), 503
        
        # Run the audit
        audit_results = levy_agent.audit_levy_compliance(
            district_id=district_id,
            year=year,
            full_audit=full_audit
        )
        
        # If there's an error, format it properly
        if "error" in audit_results:
            return jsonify({"error": audit_results["error"]}), 500
        
        return jsonify(audit_results)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def register_levy_audit_routes(app):
    """Initialize levy audit routes with the Flask app."""
    app.register_blueprint(levy_audit_bp)
    app.logger.info('Levy audit routes initialized')
@levy_audit_bp.route("/wa-dor-forms", methods=["GET"])
@login_required
def wa_dor_forms():
    """
    Render the Washington DOR levy forms page.
    """
    # Get all tax districts for dropdown
    districts = TaxDistrict.query.order_by(TaxDistrict.name).all()
    
    # Get all available years from historical rates
    years_query = db.session.query(
        TaxCodeHistoricalRate.year
    ).distinct().order_by(
        TaxCodeHistoricalRate.year.desc()
    ).all()
    available_years = [year[0] for year in years_query]
    
    return render_template(
        "levy_audit/wa_dor_forms.html",
        districts=districts,
        available_years=available_years
    )

@levy_audit_bp.route("/district-data/<int:district_id>/<int:year>", methods=["GET"])
@login_required
def get_district_data(district_id, year):
    """
    Get district data for populating Washington DOR forms.
    """
    try:
        # Get district information
        district = TaxDistrict.query.get_or_404(district_id)
        
        # Get historical rate information for this district
        historical_rates = TaxCodeHistoricalRate.query.join(
            TaxCode
        ).filter(
            TaxCode.tax_district_id == district_id,
            TaxCodeHistoricalRate.year == year
        ).all()
        
        # Calculate levy amount and other values
        total_levy_amount = sum([rate.levy_amount or 0 for rate in historical_rates])
        
        # Get previous year information for levy limit calculation
        prev_year_rates = TaxCodeHistoricalRate.query.join(
            TaxCode
        ).filter(
            TaxCode.tax_district_id == district_id,
            TaxCodeHistoricalRate.year == year - 1
        ).all()
        
        prev_year_levy = sum([rate.levy_amount or 0 for rate in prev_year_rates])
        
        # Prepare response data
        response_data = {
            "status": "success",
            "district": {
                "id": district.id,
                "name": district.name,
                "county": "Benton",  # Default to Benton County
                "type": district.district_type or "Taxing District"
            },
            "levy_amount": total_levy_amount,
            "regular_levy": total_levy_amount,  # Default all to regular levy
            "excess_levy": 0,  # Default to 0
            "highest_lawful_levy": prev_year_levy,
            "limit_factor": prev_year_levy * 1.01,  # 1% increase
            "new_construction_levy": 0,  # Would need real data
            "annexation_levy": 0,  # Would need real data
            "refund_levy": 0  # Would need real data
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error getting district data: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500
