"""
API endpoints for the AI continuous learning system.
"""
import logging
import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

from app import db
# Import models inside functions to avoid circular imports
from ai.continuous_learning_system import ContinuousLearningSystem

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
learning_api = Blueprint('learning_api', __name__, url_prefix='/api/ai/learning')

# Initialize continuous learning system
learning_system = ContinuousLearningSystem()

@learning_api.route('/status', methods=['GET'])
def get_system_status():
    """Get the status of the continuous learning system"""
    try:
        # Import models here to avoid circular imports
        from models import LearningCycle, AgentOptimizationResult, PromptVersion, PromptABTest, AIFeedback
        
        # Get latest cycle
        latest_cycle = LearningCycle.query.order_by(LearningCycle.created_at.desc()).first()
        
        # Get active agent counts
        agent_types = ["summarizer", "market_analyzer", "recommender", "nl_search"]
        agent_counts = {}
        
        for agent_type in agent_types:
            version_count = PromptVersion.query.filter_by(agent_type=agent_type).count()
            latest_version = PromptVersion.query.filter_by(
                agent_type=agent_type
            ).order_by(PromptVersion.version.desc()).first()
            
            agent_counts[agent_type] = {
                "count": version_count,
                "latest_version": latest_version.version if latest_version else 0,
                "is_active": bool(latest_version and latest_version.is_active) if latest_version else False
            }
        
        # Get overall stats
        total_feedback = AIFeedback.query.count()
        total_optimizations = AgentOptimizationResult.query.count()
        total_tests = PromptABTest.query.count()
        
        return jsonify({
            "status": "success",
            "system_status": {
                "is_active": True,  # Continuous learning system is always active
                "last_cycle": {
                    "id": latest_cycle.id if latest_cycle else None,
                    "start_date": latest_cycle.start_date.isoformat() if latest_cycle else None,
                    "end_date": latest_cycle.end_date.isoformat() if latest_cycle and latest_cycle.end_date else None,
                    "status": latest_cycle.status if latest_cycle else None
                } if latest_cycle else None,
                "agent_counts": agent_counts,
                "totals": {
                    "feedback": total_feedback,
                    "optimizations": total_optimizations,
                    "ab_tests": total_tests
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@learning_api.route('/metrics', methods=['GET'])
def get_learning_metrics():
    """Get metrics for the continuous learning system"""
    try:
        # Import models here to avoid circular imports
        from models import LearningCycle, AIFeedback
        
        # Get time range parameter
        days = request.args.get('days', 90, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get all completed learning cycles in the time range
        cycles = LearningCycle.query.filter(
            LearningCycle.status == 'completed',
            LearningCycle.end_date >= start_date
        ).order_by(LearningCycle.end_date).all()
        
        # Format cycles data for charts
        cycle_labels = []
        overall_ratings = []
        
        for cycle in cycles:
            cycle_labels.append(f"Cycle {cycle.id}")
            overall_ratings.append(round(cycle.average_improvement, 2))
        
        # Get latest ratings by agent type
        agent_types = ["summarizer", "market_analyzer", "recommender", "nl_search"]
        agent_labels = ["Summarizer", "Market Analyzer", "Recommender", "NL Search"]
        agent_ratings = []
        
        for agent_type in agent_types:
            # Get average rating from recent feedback
            recent_feedback = AIFeedback.query.filter(
                AIFeedback.agent_type == agent_type,
                AIFeedback.created_at >= start_date
            ).all()
            
            if recent_feedback:
                avg_rating = sum(f.rating for f in recent_feedback) / len(recent_feedback)
                agent_ratings.append(round(avg_rating, 2))
            else:
                agent_ratings.append(0)
        
        return jsonify({
            "status": "success",
            "metrics": {
                "overall_improvement": {
                    "labels": cycle_labels,
                    "data": overall_ratings
                },
                "agent_performance": {
                    "labels": agent_labels,
                    "data": agent_ratings
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting learning metrics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@learning_api.route('/cycles', methods=['GET'])
def get_learning_cycles():
    """Get all learning cycles"""
    try:
        # Import models here to avoid circular imports
        from models import LearningCycle
        
        # Get status parameter
        status = request.args.get('status', None)
        
        # Build query
        query = LearningCycle.query
        
        if status:
            query = query.filter(LearningCycle.status == status)
            
        # Get all cycles
        cycles = query.order_by(LearningCycle.created_at.desc()).all()
        
        # Format cycles
        result = []
        for cycle in cycles:
            result.append({
                "id": cycle.id,
                "start_date": cycle.start_date.isoformat(),
                "end_date": cycle.end_date.isoformat() if cycle.end_date else None,
                "status": cycle.status,
                "agents_processed": cycle.agents_processed,
                "agents_optimized": cycle.agents_optimized,
                "average_improvement": round(cycle.average_improvement, 2) if cycle.average_improvement else 0,
                "error_message": cycle.error_message,
                "created_at": cycle.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "cycles": result
        })
        
    except Exception as e:
        logger.error(f"Error getting learning cycles: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@learning_api.route('/cycles', methods=['POST'])
def start_learning_cycle():
    """Start a new learning cycle"""
    try:
        # Import models here to avoid circular imports
        from models import LearningCycle
        
        # Check if there's already an active cycle
        active_cycle = LearningCycle.query.filter_by(status='in_progress').first()
        
        if active_cycle:
            return jsonify({
                "status": "error",
                "message": f"There's already an active learning cycle (ID: {active_cycle.id})"
            }), 400
        
        # Create new cycle
        new_cycle = LearningCycle(
            start_date=datetime.now(),
            status='in_progress'
        )
        
        db.session.add(new_cycle)
        db.session.commit()
        
        # Start the learning process asynchronously
        # Note: In a real implementation, this would likely be a background task
        # For simplicity, we'll just return the new cycle ID and status
        
        return jsonify({
            "status": "success",
            "message": "Learning cycle started successfully",
            "cycle": {
                "id": new_cycle.id,
                "start_date": new_cycle.start_date.isoformat(),
                "status": new_cycle.status
            }
        })
        
    except Exception as e:
        logger.error(f"Error starting learning cycle: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@learning_api.route('/cycles/<int:cycle_id>', methods=['GET'])
def get_learning_cycle(cycle_id):
    """Get details for a specific learning cycle"""
    try:
        # Get the cycle
        cycle = LearningCycle.query.get(cycle_id)
        
        if not cycle:
            return jsonify({
                "status": "not_found",
                "message": f"Learning cycle with ID {cycle_id} not found"
            }), 404
        
        # Get agent results
        agent_results = []
        for result in cycle.agent_results:
            agent_results.append({
                "id": result.id,
                "agent_type": result.agent_type,
                "original_rating": round(result.original_rating, 2) if result.original_rating else None,
                "new_rating": round(result.new_rating, 2) if result.new_rating else None,
                "improvement_percentage": round(result.improvement_percentage, 2) if result.improvement_percentage else None,
                "tests_run": result.tests_run,
                "successful": result.successful,
                "applied": result.applied,
                "notes": result.notes
            })
        
        # Parse results JSON if available
        cycle_results = {}
        if cycle.results:
            try:
                cycle_results = json.loads(cycle.results)
            except:
                logger.warning(f"Error parsing results JSON for cycle {cycle_id}")
        
        return jsonify({
            "status": "success",
            "cycle": {
                "id": cycle.id,
                "start_date": cycle.start_date.isoformat(),
                "end_date": cycle.end_date.isoformat() if cycle.end_date else None,
                "status": cycle.status,
                "agents_processed": cycle.agents_processed,
                "agents_optimized": cycle.agents_optimized,
                "average_improvement": round(cycle.average_improvement, 2) if cycle.average_improvement else 0,
                "error_message": cycle.error_message,
                "created_at": cycle.created_at.isoformat(),
                "duration_minutes": round((cycle.end_date - cycle.start_date).total_seconds() / 60) if cycle.end_date else None,
                "results": cycle_results,
                "agent_results": agent_results
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting learning cycle: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@learning_api.route('/cycles/<int:cycle_id>/cancel', methods=['POST'])
def cancel_learning_cycle(cycle_id):
    """Cancel an active learning cycle"""
    try:
        # Get the cycle
        cycle = LearningCycle.query.get(cycle_id)
        
        if not cycle:
            return jsonify({
                "status": "not_found",
                "message": f"Learning cycle with ID {cycle_id} not found"
            }), 404
        
        # Check if cycle is active
        if cycle.status != 'in_progress':
            return jsonify({
                "status": "error",
                "message": f"Cannot cancel cycle with status '{cycle.status}'"
            }), 400
        
        # Update cycle
        cycle.status = 'cancelled'
        cycle.end_date = datetime.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Learning cycle {cycle_id} cancelled successfully"
        })
        
    except Exception as e:
        logger.error(f"Error cancelling learning cycle: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def register_endpoints(app):
    """Register all API endpoints with the Flask app"""
    app.register_blueprint(learning_api)