"""
API endpoints for AI capabilities
"""
from flask import Blueprint, request, jsonify
import logging
import os
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
ai_api = Blueprint('ai_api', __name__, url_prefix='/api/ai')

def compute_feedback_stats(feedback_data):
    """
    Compute statistics from feedback data.
    
    Args:
        feedback_data (List[Dict[str, Any]]): List of feedback entries
        
    Returns:
        Dict: Statistics dictionary
    """
    # Initialize stats
    stats = {
        "overall": {
            "total_feedback": 0,
            "avg_rating": 0,
            "highest_rating": 0,
            "lowest_rating": 5,  # Start with highest possible
        },
        "by_agent": {}
    }
    
    # Initialize rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    if not feedback_data:
        return {"overall": {"total_feedback": 0, "avg_rating": 0}, "by_agent": {}, "rating_distribution": rating_distribution}
    
    # Process feedback data
    total_rating = 0
    agent_ratings = {}
    
    for item in feedback_data:
        rating = item.get("rating", 0)
        agent_type = item.get("agent_type", "unknown")
        
        # Skip invalid ratings
        if rating < 1 or rating > 5:
            continue
        
        # Update overall stats
        stats["overall"]["total_feedback"] += 1
        total_rating += rating
        
        if rating > stats["overall"]["highest_rating"]:
            stats["overall"]["highest_rating"] = rating
            
        if rating < stats["overall"]["lowest_rating"]:
            stats["overall"]["lowest_rating"] = rating
            
        # Update rating distribution
        rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
        
        # Update agent stats
        if agent_type not in agent_ratings:
            agent_ratings[agent_type] = {"total": 0, "count": 0}
            
        agent_ratings[agent_type]["total"] += rating
        agent_ratings[agent_type]["count"] += 1
    
    # Calculate averages
    if stats["overall"]["total_feedback"] > 0:
        stats["overall"]["avg_rating"] = total_rating / stats["overall"]["total_feedback"]
    
    # Calculate agent averages
    for agent_type, data in agent_ratings.items():
        if data["count"] > 0:
            stats["by_agent"][agent_type] = {
                "avg_rating": data["total"] / data["count"],
                "count": data["count"]
            }
    
    # Add rating distribution to stats
    stats["rating_distribution"] = rating_distribution
    
    return stats

@ai_api.route('/health')
def health_check():
    """Health check endpoint for AI services"""
    try:
        # Check all agents
        agents_status = {
            "summarizer": "available",
            "market_analyzer": "available", 
            "recommender": "available",
            "nl_search": "available"
        }
        
        return jsonify({
            "status": "online",
            "agents": agents_status
        })
    except Exception as e:
        logger.error(f"Error in AI health check: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/summarize', methods=['POST'])
def summarize_text():
    """Summarize property text"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameters"
            }), 400
            
        text = data['text']
        max_length = data.get('max_length', 200)
        
        # In a real implementation, this would call our text_summarizer agent
        # For now, we'll do a simple truncation with ellipsis to simulate
        original_length = len(text)
        
        if original_length <= max_length:
            summary = text
        else:
            summary = text[:max_length-3] + "..."
            
        return jsonify({
            "status": "success",
            "summary": summary,
            "original_length": original_length,
            "summary_length": len(summary)
        })
    except Exception as e:
        logger.error(f"Error summarizing text: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/search', methods=['POST'])
def search_properties():
    """Search properties using natural language"""
    try:
        data = request.json
        if not data or 'query' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameters"
            }), 400
            
        query = data['query']
        limit = data.get('limit', 5)
        
        # In a real implementation, this would call our nl_search_agent
        # For demo purposes, return sample data
        sample_results = {
            "status": "success",
            "explanation": "Based on your search for properties, I found several listings that match your criteria.",
            "result_count": 3,
            "results": [
                {
                    "id": "prop123",
                    "address": "123 Main St, Phoenix, AZ 85001",
                    "price": 425000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "square_feet": 1850,
                    "year_built": 2005
                },
                {
                    "id": "prop456",
                    "address": "456 Oak Ave, Phoenix, AZ 85008",
                    "price": 389000,
                    "bedrooms": 3,
                    "bathrooms": 2.5,
                    "square_feet": 1750,
                    "year_built": 2010
                },
                {
                    "id": "prop789",
                    "address": "789 Pine Blvd, Phoenix, AZ 85016",
                    "price": 475000,
                    "bedrooms": 4,
                    "bathrooms": 3,
                    "square_feet": 2200,
                    "year_built": 2000
                }
            ]
        }
        
        # Customize based on query
        if "under $400,000" in query.lower():
            # Filter results to only show properties under $400K
            sample_results["results"] = [r for r in sample_results["results"] if r["price"] < 400000]
            sample_results["result_count"] = len(sample_results["results"])
            sample_results["explanation"] = f"Found {sample_results['result_count']} properties under $400,000 in Phoenix."
        
        elif "4 bedroom" in query.lower():
            # Filter results to only show 4 bedroom properties
            sample_results["results"] = [r for r in sample_results["results"] if r["bedrooms"] == 4]
            sample_results["result_count"] = len(sample_results["results"])
            sample_results["explanation"] = f"Found {sample_results['result_count']} properties with 4 bedrooms in Phoenix."
            
        return jsonify({
            "status": "success",
            "results": sample_results
        })
    except Exception as e:
        logger.error(f"Error searching properties: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/analyze/market', methods=['POST'])
def analyze_market():
    """Analyze market trends"""
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameters"
            }), 400
            
        location = data.get('location', 'Phoenix, AZ')
        days_back = data.get('days_back', 90)
        
        # In a real implementation, this would call our market_analyzer agent
        # For demo purposes, return sample analysis
        sample_analysis = {
            "status": "success",
            "location": location,
            "time_period": f"Last {days_back} days",
            "data_points": 156,
            "analysis": f"The real estate market in {location} has shown moderate growth over the past {days_back} days. The median home price has increased by approximately 2.3% during this period, slightly slower than the 3.1% growth observed in the previous quarter. Inventory levels have improved by 8.5%, offering more options for buyers but still remaining below historical averages. Properties in the $350,000-$450,000 range are selling the fastest, typically within 15 days of listing. The luxury market (properties above $750,000) has seen a slight slowdown with average days on market increasing to 32 days.",
            "stats": {
                "price_stats": {
                    "min": 285000,
                    "max": 1250000,
                    "mean": 427500,
                    "median": 425000
                },
                "days_on_market": {
                    "min": 3,
                    "max": 95,
                    "mean": 22,
                    "median": 18
                }
            }
        }
        
        # Customize based on location
        if "phoenix" in location.lower():
            sample_analysis["analysis"] = "The Phoenix real estate market has been experiencing steady demand despite rising interest rates. Home prices have stabilized after the rapid growth in 2021-2022, with the median sale price holding at approximately $425,000. Properties in good condition and priced appropriately continue to sell quickly, typically within 2-3 weeks. The most competitive price points are between $300,000-$450,000, where first-time homebuyers and investors are most active. The luxury market has shown increased inventory and slightly longer days on market."
        elif "scottsdale" in location.lower():
            sample_analysis["analysis"] = "Scottsdale's luxury market continues to outperform most other Phoenix metro submarkets. The median home price of $750,000 represents a slight 1.8% increase from the previous quarter. High-end properties in North Scottsdale have seen increasing interest from out-of-state buyers, particularly from California. Properties in the $1M-$2M range are experiencing the strongest demand with an average of 28 days on market. The condo market has shown particular strength, with new luxury developments seeing robust pre-sales."
            sample_analysis["stats"]["price_stats"] = {
                "min": 425000,
                "max": 3250000,
                "mean": 925000,
                "median": 750000
            }
        
        return jsonify({
            "status": "success",
            "analysis": sample_analysis
        })
    except Exception as e:
        logger.error(f"Error analyzing market: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/recommend', methods=['POST'])
def get_recommendations():
    """Get property recommendations"""
    try:
        data = request.json
        if not data or 'preferences' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameters"
            }), 400
            
        preferences = data['preferences']
        limit = data.get('limit', 3)
        
        # Extract the query from preferences
        query = preferences.get('query', '')
        
        # In a real implementation, this would call our recommendation_agent
        # For demo purposes, return sample recommendations
        sample_recommendations = {
            "status": "success",
            "explanation": "Based on your preferences, I've identified several properties that match your criteria.",
            "recommendations": [
                {
                    "property": {
                        "id": "prop123",
                        "address": "123 Main St, Phoenix, AZ 85001",
                        "price": 425000,
                        "bedrooms": 3,
                        "bathrooms": 2,
                        "square_feet": 1850,
                        "year_built": 2005
                    },
                    "match_score": 92,
                    "match_reasons": [
                        "Located in a family-friendly neighborhood",
                        "Close to highly-rated schools",
                        "Recent kitchen renovation",
                        "Large backyard perfect for children"
                    ],
                    "drawbacks": [
                        "Slightly above your budget range",
                        "Smaller primary bathroom than requested"
                    ],
                    "comment": "This property offers exceptional value in a prime location."
                },
                {
                    "property": {
                        "id": "prop456",
                        "address": "456 Oak Ave, Phoenix, AZ 85008",
                        "price": 389000,
                        "bedrooms": 3,
                        "bathrooms": 2.5,
                        "square_feet": 1750,
                        "year_built": 2010
                    },
                    "match_score": 87,
                    "match_reasons": [
                        "Within your budget range",
                        "Modern open floor plan",
                        "Community pool and playground",
                        "Energy-efficient features"
                    ],
                    "drawbacks": [
                        "Smaller yard than your preference",
                        "Slightly longer commute to downtown"
                    ],
                    "comment": "Great value for a well-maintained property in an upcoming neighborhood."
                },
                {
                    "property": {
                        "id": "prop789",
                        "address": "789 Pine Blvd, Phoenix, AZ 85016",
                        "price": 475000,
                        "bedrooms": 4,
                        "bathrooms": 3,
                        "square_feet": 2200,
                        "year_built": 2000
                    },
                    "match_score": 85,
                    "match_reasons": [
                        "Extra bedroom as requested",
                        "Walking distance to parks",
                        "Recently updated bathrooms",
                        "Large kitchen with island"
                    ],
                    "drawbacks": [
                        "At the top of your budget range",
                        "Older HVAC system may need replacement soon"
                    ],
                    "comment": "Excellent space for a growing family with room to entertain."
                }
            ]
        }
        
        # Customize based on query
        if "family" in query.lower() or "kid" in query.lower() or "children" in query.lower():
            sample_recommendations["explanation"] = "Based on your family-focused preferences, I've identified properties in safe neighborhoods with good schools and family-friendly features."
            for rec in sample_recommendations["recommendations"]:
                if "family" not in ' '.join(rec["match_reasons"]).lower():
                    rec["match_reasons"].append("Family-friendly neighborhood with low crime rates")
                    rec["match_reasons"].append("Close to parks and playgrounds")
        
        elif "investment" in query.lower() or "rental" in query.lower():
            sample_recommendations["explanation"] = "Based on your investment criteria, I've found properties with strong rental potential and appreciation prospects."
            for rec in sample_recommendations["recommendations"]:
                rec["match_reasons"] = [
                    "Strong rental market with estimated yield of 5.8%",
                    "Located in area with consistent appreciation",
                    "Low maintenance property with durable finishes",
                    "Close to major employers and transportation"
                ]
                rec["comment"] = "Good investment opportunity with potential for both cash flow and appreciation."
        
        return jsonify({
            "status": "success",
            "recommendations": sample_recommendations
        })
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback for an AI agent response"""
    try:
        data = request.json
        if not data or 'agent_type' not in data or 'rating' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameters"
            }), 400
            
        # Extract data
        agent_type = data.get('agent_type')
        query_data = data.get('query_data', '')
        response_data = data.get('response_data', '')
        rating = data.get('rating')
        comments = data.get('comments', '')
        session_id = data.get('session_id', '')
        
        # Validate rating
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError("Rating must be between 1-5")
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Invalid rating value. Must be integer between 1-5."
            }), 400
            
        # Create feedback entry
        from models import AIFeedback
        from app import db
        
        feedback = AIFeedback(
            agent_type=agent_type,
            query_data=query_data,
            response_data=response_data,
            rating=rating,
            comments=comments,
            session_id=session_id
        )
        
        db.session.add(feedback)
        db.session.commit()
        
        logger.info(f"Feedback recorded: {agent_type} - {rating} stars")
        
        return jsonify({
            "status": "success",
            "message": "Feedback recorded successfully",
            "feedback_id": feedback.id
        })
        
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback/stats', methods=['GET'])
def get_feedback_stats():
    """Get statistics about agent feedback"""
    try:
        from models import AIFeedback
        from sqlalchemy import func
        from app import db
        
        # Get overall stats
        overall_stats = db.session.query(
            func.avg(AIFeedback.rating).label('avg_rating'),
            func.count(AIFeedback.id).label('total_feedback')
        ).first()
        
        # Get stats per agent type
        agent_stats = db.session.query(
            AIFeedback.agent_type,
            func.avg(AIFeedback.rating).label('avg_rating'),
            func.count(AIFeedback.id).label('count')
        ).group_by(AIFeedback.agent_type).all()
        
        # Get rating distribution
        rating_distribution = db.session.query(
            AIFeedback.rating,
            func.count(AIFeedback.id).label('count')
        ).group_by(AIFeedback.rating).all()
        
        # Format rating distribution
        rating_dist_dict = {rating.rating: rating.count for rating in rating_distribution}
        
        # Format results
        stats = {
            "overall": {
                "avg_rating": float(overall_stats.avg_rating) if overall_stats.avg_rating else 0,
                "total_feedback": overall_stats.total_feedback
            },
            "by_agent": {
                stat.agent_type: {
                    "avg_rating": float(stat.avg_rating),
                    "count": stat.count
                } for stat in agent_stats
            }
        }
        
        return jsonify({
            "status": "success",
            "stats": stats,
            "rating_distribution": rating_dist_dict
        })
        
    except Exception as e:
        logger.error(f"Error retrieving feedback stats: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
        
@ai_api.route('/feedback/recent', methods=['GET'])
def get_recent_feedback():
    """Get recent feedback entries"""
    try:
        from models import AIFeedback
        from app import db
        
        # Get recent feedback, limit to 25 entries
        recent_feedback = db.session.query(AIFeedback).order_by(
            AIFeedback.created_at.desc()
        ).limit(25).all()
        
        # Format feedback data
        feedback_data = []
        for feedback in recent_feedback:
            feedback_data.append({
                "id": feedback.id,
                "agent_type": feedback.agent_type,
                "rating": feedback.rating,
                "comments": feedback.comments,
                "created_at": feedback.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "feedback": feedback_data
        })
        
    except Exception as e:
        logger.error(f"Error retrieving recent feedback: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback/export', methods=['GET'])
def export_feedback():
    """Export feedback data in specified format"""
    try:
        from models import AIFeedback
        from app import db
        from utils.feedback_export import generate_csv_response, generate_excel_response
        
        # Get query parameters
        export_format = request.args.get('format', 'csv').lower()
        agent_type = request.args.get('agent_type')
        rating = request.args.get('rating')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = db.session.query(AIFeedback)
        
        # Apply filters if provided
        if agent_type:
            query = query.filter(AIFeedback.agent_type == agent_type)
            
        if rating:
            try:
                rating_value = int(rating)
                query = query.filter(AIFeedback.rating == rating_value)
            except ValueError:
                pass
                
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from)
                query = query.filter(AIFeedback.created_at >= from_date)
            except ValueError:
                pass
                
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to)
                query = query.filter(AIFeedback.created_at <= to_date)
            except ValueError:
                pass
        
        # Get results
        results = query.order_by(AIFeedback.created_at.desc()).all()
        
        # Format feedback data
        feedback_data = []
        for feedback in results:
            feedback_data.append({
                "id": feedback.id,
                "agent_type": feedback.agent_type,
                "rating": feedback.rating,
                "comments": feedback.comments,
                "session_id": feedback.session_id,
                "created_at": feedback.created_at.isoformat(),
                "query_data": feedback.query_data,
                "response_data": feedback.response_data
            })
        
        # Generate appropriate response based on format
        if export_format == 'excel':
            return generate_excel_response(feedback_data)
        else:
            # Default to CSV
            return generate_csv_response(feedback_data)
        
    except Exception as e:
        logger.error(f"Error exporting feedback data: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error exporting feedback data: {str(e)}"
        }), 500
        
@ai_api.route('/feedback/all', methods=['GET'])
def get_all_feedback():
    """Get all feedback entries with optional filtering"""
    try:
        from models import AIFeedback
        from app import db
        
        # Get query parameters
        agent_type = request.args.get('agent_type')
        rating = request.args.get('rating')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = request.args.get('limit', 100)
        offset = request.args.get('offset', 0)
        
        try:
            limit = int(limit)
            offset = int(offset)
        except ValueError:
            limit = 100
            offset = 0
            
        # Build query
        query = db.session.query(AIFeedback)
        
        # Apply filters if provided
        if agent_type:
            query = query.filter(AIFeedback.agent_type == agent_type)
            
        if rating:
            try:
                rating_value = int(rating)
                query = query.filter(AIFeedback.rating == rating_value)
            except ValueError:
                pass
                
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from)
                query = query.filter(AIFeedback.created_at >= from_date)
            except ValueError:
                pass
                
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to)
                query = query.filter(AIFeedback.created_at <= to_date)
            except ValueError:
                pass
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        results = query.order_by(AIFeedback.created_at.desc()).limit(limit).offset(offset).all()
        
        # Format feedback data
        feedback_data = []
        for feedback in results:
            feedback_data.append({
                "id": feedback.id,
                "agent_type": feedback.agent_type,
                "rating": feedback.rating,
                "comments": feedback.comments,
                "session_id": feedback.session_id,
                "created_at": feedback.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "feedback": feedback_data,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_count
            }
        })
        
    except Exception as e:
        logger.error(f"Error retrieving feedback data: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
        
@ai_api.route('/feedback/scheduler/status', methods=['GET'])
def get_scheduler_status():
    """Get the status of the feedback report scheduler"""
    try:
        from utils.scheduled_tasks import check_scheduler_status
        
        # Get the scheduler status
        running = check_scheduler_status()
        
        return jsonify({
            "status": "success",
            "running": running
        })
    except Exception as e:
        logger.error(f"Error checking scheduler status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback/scheduler/jobs', methods=['GET'])
def get_scheduled_jobs():
    """Get list of scheduled jobs"""
    try:
        from utils.scheduled_tasks import get_scheduled_jobs
        from models import AIFeedbackReportSettings
        import json
        
        jobs_list = get_scheduled_jobs()
        settings = AIFeedbackReportSettings.get_settings()
        
        # Format jobs for display
        formatted_jobs = []
        
        for job in jobs_list:
            job_type = "unknown"
            recipients = settings.admin_email or "Not set"
            
            # Determine job type from the job tags
            if hasattr(job, 'tags') and job.tags:
                for tag in job.tags:
                    if tag in ['daily', 'weekly', 'monthly']:
                        job_type = tag
                        break
            
            # Add additional recipients if they exist
            if settings.additional_recipients:
                try:
                    additional_emails = json.loads(settings.additional_recipients)
                    if isinstance(additional_emails, list) and additional_emails:
                        recipients += f" and {len(additional_emails)} others"
                except:
                    pass
            
            formatted_jobs.append({
                "job_type": job_type,
                "schedule": str(job.schedule_info()),
                "recipients": recipients,
                "next_run": job.next_run.strftime("%Y-%m-%d %H:%M:%S") if job.next_run else "Not scheduled"
            })
        
        return jsonify({
            "status": "success",
            "jobs": formatted_jobs
        })
    except Exception as e:
        logger.error(f"Error getting scheduled jobs: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback/scheduler/start', methods=['POST'])
def start_scheduler():
    """Start the feedback report scheduler"""
    try:
        from utils.scheduled_tasks import start_scheduler, initialize_default_schedules
        from models import AIFeedbackReportSettings
        
        # Get settings
        settings = AIFeedbackReportSettings.get_settings()
        
        # Initialize default schedules with admin email
        if settings.admin_email:
            initialize_default_schedules(settings.admin_email)
        
        # Start the scheduler
        success = start_scheduler()
        
        if success:
            logger.info("Feedback report scheduler started successfully")
            return jsonify({
                "status": "success",
                "message": "Scheduler started successfully"
            })
        else:
            logger.warning("Feedback report scheduler was already running")
            return jsonify({
                "status": "success",
                "message": "Scheduler was already running"
            })
    except Exception as e:
        logger.error(f"Error starting scheduler: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback/scheduler/stop', methods=['POST'])
def stop_scheduler():
    """Stop the feedback report scheduler"""
    try:
        from utils.scheduled_tasks import stop_scheduler
        
        # Stop the scheduler
        success = stop_scheduler()
        
        if success:
            logger.info("Feedback report scheduler stopped successfully")
            return jsonify({
                "status": "success",
                "message": "Scheduler stopped successfully"
            })
        else:
            logger.warning("Feedback report scheduler was not running")
            return jsonify({
                "status": "success",
                "message": "Scheduler was not running"
            })
    except Exception as e:
        logger.error(f"Error stopping scheduler: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@ai_api.route('/feedback/report/test', methods=['POST'])
def send_test_report():
    """Send a test feedback report"""
    try:
        from utils.email_reports import send_feedback_report
        import json
        
        # Get request data
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "status": "error",
                "message": "No request data provided"
            }), 400
        
        email = request_data.get('email')
        report_type = request_data.get('report_type', 'weekly')
        
        if not email:
            return jsonify({
                "status": "error",
                "message": "No email address provided"
            }), 400
        
        # Send test report
        success = send_feedback_report(email, report_type)
        
        if success:
            logger.info(f"Test {report_type} report sent successfully to {email}")
            return jsonify({
                "status": "success",
                "message": f"Test {report_type} report sent successfully"
            })
        else:
            logger.warning(f"Failed to send test {report_type} report to {email}")
            return jsonify({
                "status": "error",
                "message": "Failed to send test report. Please check logs for details."
            }), 500
    except Exception as e:
        logger.error(f"Error sending test report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def register_endpoints(app):
    """Register all API endpoints with the Flask app"""
    app.register_blueprint(ai_api)