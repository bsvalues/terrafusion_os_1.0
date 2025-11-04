"""
API endpoints for AI prompt optimization.
"""
import logging
import json
from datetime import datetime
from flask import Blueprint, request, jsonify

from app import db
# Import models when needed to avoid circular imports
# from models import PromptVersion, PromptABTest
from ai.prompt_optimizer import PromptOptimizer

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
prompt_api = Blueprint('prompt_api', __name__, url_prefix='/api/ai/prompts')

# Initialize prompt optimizer
optimizer = PromptOptimizer()

@prompt_api.route('/versions/<agent_type>', methods=['GET'])
def get_prompt_versions(agent_type):
    """Get prompt versions for an agent type"""
    try:
        # Import models here to avoid circular imports
        from models import PromptVersion
        
        # Get all versions
        versions = PromptVersion.query.filter_by(
            agent_type=agent_type
        ).order_by(PromptVersion.version.desc()).all()
        
        if not versions:
            return jsonify({
                "status": "not_found",
                "message": f"No prompt versions found for agent type: {agent_type}"
            }), 404
        
        # Format result
        result = []
        for version in versions:
            result.append({
                "id": version.id,
                "agent_type": version.agent_type,
                "version": version.version,
                "is_active": version.is_active,
                "prompt_text": version.prompt_text,
                "notes": version.notes,
                "created_at": version.created_at.isoformat() if version.created_at else None
            })
        
        return jsonify({
            "status": "success",
            "versions": result
        })
        
    except Exception as e:
        logger.error(f"Error getting prompt versions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/versions', methods=['POST'])
def create_prompt_version():
    """Create a new prompt version"""
    try:
        # Import models here to avoid circular imports
        from models import PromptVersion
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        agent_type = data.get('agent_type')
        prompt_text = data.get('prompt_text')
        notes = data.get('notes')
        
        if not agent_type or not prompt_text:
            return jsonify({
                "status": "error",
                "message": "agent_type and prompt_text are required"
            }), 400
        
        # Get the latest version number for this agent type
        latest_version = PromptVersion.query.filter_by(
            agent_type=agent_type
        ).order_by(PromptVersion.version.desc()).first()
        
        version_number = 1
        if latest_version:
            version_number = latest_version.version + 1
        
        # Create new version
        new_version = PromptVersion(
            agent_type=agent_type,
            version=version_number,
            prompt_text=prompt_text,
            notes=notes,
            is_active=data.get('set_active', False)
        )
        
        # If this version is active, deactivate all others
        if new_version.is_active:
            for version in PromptVersion.query.filter_by(
                agent_type=agent_type,
                is_active=True
            ).all():
                version.is_active = False
        
        db.session.add(new_version)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Prompt version {version_number} created for {agent_type}",
            "version": {
                "id": new_version.id,
                "agent_type": new_version.agent_type,
                "version": new_version.version,
                "is_active": new_version.is_active,
                "created_at": new_version.created_at.isoformat() if new_version.created_at else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating prompt version: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/versions/<int:version_id>/activate', methods=['POST'])
def activate_prompt_version(version_id):
    """Activate a prompt version"""
    try:
        # Import models here to avoid circular imports
        from models import PromptVersion
        
        # Get the version
        version = PromptVersion.query.get(version_id)
        
        if not version:
            return jsonify({
                "status": "not_found",
                "message": f"Prompt version with ID {version_id} not found"
            }), 404
        
        # Deactivate all other versions for this agent type
        for other_version in PromptVersion.query.filter_by(
            agent_type=version.agent_type,
            is_active=True
        ).all():
            other_version.is_active = False
        
        # Activate this version
        version.is_active = True
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Prompt version {version.version} activated for {version.agent_type}"
        })
        
    except Exception as e:
        logger.error(f"Error activating prompt version: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/analysis/<agent_type>', methods=['GET'])
def analyze_feedback(agent_type):
    """Analyze feedback for an agent type"""
    try:
        # Get days parameter (default 30)
        days = request.args.get('days', 30, type=int)
        
        # Run analysis
        suggestions = optimizer.generate_prompt_suggestions(agent_type, days)
        
        return jsonify(suggestions)
        
    except Exception as e:
        logger.error(f"Error analyzing feedback: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/ab-tests', methods=['POST'])
def create_ab_test():
    """Create a new A/B test"""
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        agent_type = data.get('agent_type')
        original_prompt = data.get('original_prompt')
        improved_prompt = data.get('improved_prompt')
        duration_days = data.get('duration_days', 7)
        
        if not agent_type or not original_prompt or not improved_prompt:
            return jsonify({
                "status": "error",
                "message": "agent_type, original_prompt, and improved_prompt are required"
            }), 400
        
        # Run the A/B test
        test_result = optimizer.run_a_b_test(
            agent_type, 
            original_prompt, 
            improved_prompt,
            duration_days
        )
        
        return jsonify(test_result)
        
    except Exception as e:
        logger.error(f"Error creating A/B test: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/ab-tests', methods=['GET'])
def get_ab_tests():
    """Get A/B tests"""
    try:
        # Import models here to avoid circular imports
        from models import PromptABTest
        
        # Get status parameter (default: all)
        status = request.args.get('status', None)
        agent_type = request.args.get('agent_type', None)
        
        # Build query
        query = PromptABTest.query
        
        if status:
            query = query.filter(PromptABTest.status == status)
            
        if agent_type:
            query = query.filter(PromptABTest.agent_type == agent_type)
        
        # Get results
        tests = query.order_by(PromptABTest.created_at.desc()).all()
        
        # Format results
        result = []
        for test in tests:
            # Parse results if available
            test_results = {}
            if test.results:
                try:
                    test_results = json.loads(test.results)
                except:
                    pass
            
            result.append({
                "id": test.id,
                "agent_type": test.agent_type,
                "status": test.status,
                "start_date": test.start_date.isoformat() if test.start_date else None,
                "end_date": test.end_date.isoformat() if test.end_date else None,
                "created_at": test.created_at.isoformat() if test.created_at else None,
                "results": test_results
            })
        
        return jsonify({
            "status": "success",
            "tests": result
        })
        
    except Exception as e:
        logger.error(f"Error getting A/B tests: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/ab-tests/<int:test_id>', methods=['GET'])
def get_ab_test(test_id):
    """Get an A/B test"""
    try:
        # Import models here to avoid circular imports
        from models import PromptABTest
        
        # Get the test
        test = PromptABTest.query.get(test_id)
        
        if not test:
            return jsonify({
                "status": "not_found",
                "message": f"A/B test with ID {test_id} not found"
            }), 404
        
        # Parse results if available
        test_results = {}
        if test.results:
            try:
                test_results = json.loads(test.results)
            except:
                pass
        
        return jsonify({
            "status": "success",
            "test": {
                "id": test.id,
                "agent_type": test.agent_type,
                "status": test.status,
                "original_prompt": test.original_prompt,
                "improved_prompt": test.improved_prompt,
                "start_date": test.start_date.isoformat() if test.start_date else None,
                "end_date": test.end_date.isoformat() if test.end_date else None,
                "created_at": test.created_at.isoformat() if test.created_at else None,
                "results": test_results
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting A/B test: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@prompt_api.route('/ab-tests/<int:test_id>/evaluate', methods=['POST'])
def evaluate_ab_test(test_id):
    """Evaluate an A/B test"""
    try:
        # Run evaluation
        results = optimizer.evaluate_ab_test(test_id)
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error evaluating A/B test: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def register_endpoints(app):
    """Register all API endpoints with the Flask app"""
    app.register_blueprint(prompt_api)