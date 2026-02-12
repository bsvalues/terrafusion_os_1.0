"""
API endpoints for AI integration and automation functionality.
"""
import logging
import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

from app import db
# Import models inside functions to avoid circular imports

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
integration_api = Blueprint('integration_api', __name__, url_prefix='/api/ai/integrations')
automation_api = Blueprint('automation_api', __name__, url_prefix='/api/ai/automations')

#
# Integration Endpoints
#

@integration_api.route('/', methods=['GET'])
def get_integrations():
    """Get all integrations or filtered by type/agent"""
    try:
        # Import models inside function to avoid circular imports
        from models import AIIntegration
        
        integration_type = request.args.get('type')
        agent_type = request.args.get('agent')
        is_active = request.args.get('active', default=None, type=lambda v: v.lower() == 'true' if v else None)
        
        # Build query
        query = AIIntegration.query
        
        if integration_type:
            query = query.filter(AIIntegration.integration_type == integration_type)
        if agent_type:
            query = query.filter(AIIntegration.agent_type == agent_type)
        if is_active is not None:
            query = query.filter(AIIntegration.is_active == is_active)
            
        # Execute query
        integrations = query.order_by(AIIntegration.name).all()
        
        # Format result
        result = []
        for integration in integrations:
            result.append({
                "id": integration.id,
                "name": integration.name,
                "integration_type": integration.integration_type,
                "agent_type": integration.agent_type,
                "is_active": integration.is_active,
                "last_executed": integration.last_executed.isoformat() if integration.last_executed else None,
                "execution_count": integration.execution_count,
                "created_at": integration.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "integrations": result
        })
        
    except Exception as e:
        logger.error(f"Error getting integrations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@integration_api.route('/<int:integration_id>', methods=['GET'])
def get_integration(integration_id):
    """Get a specific integration by ID"""
    try:
        # Import models inside function to avoid circular imports
        from models import AIIntegration
        
        integration = AIIntegration.query.get(integration_id)
        
        if not integration:
            return jsonify({
                "status": "not_found",
                "message": f"Integration with ID {integration_id} not found"
            }), 404
        
        # Parse config
        config = {}
        if integration.config:
            try:
                config = json.loads(integration.config)
            except:
                logger.warning(f"Error parsing config JSON for integration {integration_id}")
        
        return jsonify({
            "status": "success",
            "integration": {
                "id": integration.id,
                "name": integration.name,
                "integration_type": integration.integration_type,
                "agent_type": integration.agent_type,
                "config": config,
                "is_active": integration.is_active,
                "last_executed": integration.last_executed.isoformat() if integration.last_executed else None,
                "execution_count": integration.execution_count,
                "created_at": integration.created_at.isoformat(),
                "updated_at": integration.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting integration {integration_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@integration_api.route('/', methods=['POST'])
def create_integration():
    """Create a new integration"""
    try:
        # Import models inside function to avoid circular imports
        from models import AIIntegration
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        name = data.get('name')
        integration_type = data.get('integration_type')
        agent_type = data.get('agent_type')
        config = data.get('config')
        is_active = data.get('is_active', True)
        
        if not name or not integration_type or not agent_type or not config:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: name, integration_type, agent_type, config"
            }), 400
        
        # Convert config to JSON string if it's a dict
        if isinstance(config, dict):
            config = json.dumps(config)
        
        # Create new integration
        integration = AIIntegration(
            name=name,
            integration_type=integration_type,
            agent_type=agent_type,
            config=config,
            is_active=is_active
        )
        
        db.session.add(integration)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Integration created successfully",
            "integration": {
                "id": integration.id,
                "name": integration.name,
                "integration_type": integration.integration_type,
                "agent_type": integration.agent_type,
                "is_active": integration.is_active,
                "created_at": integration.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating integration: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@integration_api.route('/<int:integration_id>', methods=['PUT'])
def update_integration(integration_id):
    """Update an existing integration"""
    try:
        integration = AIIntegration.query.get(integration_id)
        
        if not integration:
            return jsonify({
                "status": "not_found",
                "message": f"Integration with ID {integration_id} not found"
            }), 404
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        # Update fields
        if 'name' in data:
            integration.name = data['name']
        if 'integration_type' in data:
            integration.integration_type = data['integration_type']
        if 'agent_type' in data:
            integration.agent_type = data['agent_type']
        if 'config' in data:
            config = data['config']
            # Convert config to JSON string if it's a dict
            if isinstance(config, dict):
                config = json.dumps(config)
            integration.config = config
        if 'is_active' in data:
            integration.is_active = data['is_active']
        
        integration.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Integration updated successfully",
            "integration": {
                "id": integration.id,
                "name": integration.name,
                "integration_type": integration.integration_type,
                "agent_type": integration.agent_type,
                "is_active": integration.is_active,
                "updated_at": integration.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating integration {integration_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@integration_api.route('/<int:integration_id>', methods=['DELETE'])
def delete_integration(integration_id):
    """Delete an integration"""
    try:
        integration = AIIntegration.query.get(integration_id)
        
        if not integration:
            return jsonify({
                "status": "not_found",
                "message": f"Integration with ID {integration_id} not found"
            }), 404
        
        # Delete the integration
        db.session.delete(integration)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Integration {integration_id} deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting integration {integration_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@integration_api.route('/<int:integration_id>/execute', methods=['POST'])
def execute_integration(integration_id):
    """Execute an integration"""
    try:
        integration = AIIntegration.query.get(integration_id)
        
        if not integration:
            return jsonify({
                "status": "not_found",
                "message": f"Integration with ID {integration_id} not found"
            }), 404
        
        # Check if integration is active
        if not integration.is_active:
            return jsonify({
                "status": "error",
                "message": f"Integration {integration_id} is not active"
            }), 400
        
        # In a real implementation, this would execute the integration
        # For now, we'll simulate successful execution
        integration.last_executed = datetime.now()
        integration.execution_count += 1
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Integration {integration_id} executed successfully",
            "execution": {
                "integration_id": integration.id,
                "executed_at": integration.last_executed.isoformat(),
                "execution_count": integration.execution_count
            }
        })
        
    except Exception as e:
        logger.error(f"Error executing integration {integration_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

#
# Automation Endpoints
#

@automation_api.route('/', methods=['GET'])
def get_automations():
    """Get all automations or filtered by trigger/action"""
    try:
        trigger_type = request.args.get('trigger_type')
        action_type = request.args.get('action_type')
        is_active = request.args.get('active', default=None, type=lambda v: v.lower() == 'true' if v else None)
        
        # Build query
        query = AIAutomation.query
        
        if trigger_type:
            query = query.filter(AIAutomation.trigger_type == trigger_type)
        if action_type:
            query = query.filter(AIAutomation.action_type == action_type)
        if is_active is not None:
            query = query.filter(AIAutomation.is_active == is_active)
            
        # Execute query
        automations = query.order_by(AIAutomation.name).all()
        
        # Format result
        result = []
        for automation in automations:
            result.append({
                "id": automation.id,
                "name": automation.name,
                "description": automation.description,
                "trigger_type": automation.trigger_type,
                "action_type": automation.action_type,
                "is_active": automation.is_active,
                "last_triggered": automation.last_triggered.isoformat() if automation.last_triggered else None,
                "execution_count": automation.execution_count,
                "created_at": automation.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "automations": result
        })
        
    except Exception as e:
        logger.error(f"Error getting automations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@automation_api.route('/<int:automation_id>', methods=['GET'])
def get_automation(automation_id):
    """Get a specific automation by ID"""
    try:
        automation = AIAutomation.query.get(automation_id)
        
        if not automation:
            return jsonify({
                "status": "not_found",
                "message": f"Automation with ID {automation_id} not found"
            }), 404
        
        # Parse config
        trigger_config = {}
        action_config = {}
        
        if automation.trigger_config:
            try:
                trigger_config = json.loads(automation.trigger_config)
            except:
                logger.warning(f"Error parsing trigger config JSON for automation {automation_id}")
        
        if automation.action_config:
            try:
                action_config = json.loads(automation.action_config)
            except:
                logger.warning(f"Error parsing action config JSON for automation {automation_id}")
        
        return jsonify({
            "status": "success",
            "automation": {
                "id": automation.id,
                "name": automation.name,
                "description": automation.description,
                "trigger_type": automation.trigger_type,
                "trigger_config": trigger_config,
                "action_type": automation.action_type,
                "action_config": action_config,
                "is_active": automation.is_active,
                "last_triggered": automation.last_triggered.isoformat() if automation.last_triggered else None,
                "execution_count": automation.execution_count,
                "created_at": automation.created_at.isoformat(),
                "updated_at": automation.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting automation {automation_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@automation_api.route('/', methods=['POST'])
def create_automation():
    """Create a new automation"""
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        name = data.get('name')
        description = data.get('description')
        trigger_type = data.get('trigger_type')
        trigger_config = data.get('trigger_config')
        action_type = data.get('action_type')
        action_config = data.get('action_config')
        is_active = data.get('is_active', True)
        
        if not name or not trigger_type or not trigger_config or not action_type or not action_config:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: name, trigger_type, trigger_config, action_type, action_config"
            }), 400
        
        # Convert configs to JSON strings if they're dicts
        if isinstance(trigger_config, dict):
            trigger_config = json.dumps(trigger_config)
        if isinstance(action_config, dict):
            action_config = json.dumps(action_config)
        
        # Create new automation
        automation = AIAutomation(
            name=name,
            description=description,
            trigger_type=trigger_type,
            trigger_config=trigger_config,
            action_type=action_type,
            action_config=action_config,
            is_active=is_active
        )
        
        db.session.add(automation)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Automation created successfully",
            "automation": {
                "id": automation.id,
                "name": automation.name,
                "trigger_type": automation.trigger_type,
                "action_type": automation.action_type,
                "is_active": automation.is_active,
                "created_at": automation.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating automation: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@automation_api.route('/<int:automation_id>', methods=['PUT'])
def update_automation(automation_id):
    """Update an existing automation"""
    try:
        automation = AIAutomation.query.get(automation_id)
        
        if not automation:
            return jsonify({
                "status": "not_found",
                "message": f"Automation with ID {automation_id} not found"
            }), 404
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        # Update fields
        if 'name' in data:
            automation.name = data['name']
        if 'description' in data:
            automation.description = data['description']
        if 'trigger_type' in data:
            automation.trigger_type = data['trigger_type']
        if 'trigger_config' in data:
            trigger_config = data['trigger_config']
            if isinstance(trigger_config, dict):
                trigger_config = json.dumps(trigger_config)
            automation.trigger_config = trigger_config
        if 'action_type' in data:
            automation.action_type = data['action_type']
        if 'action_config' in data:
            action_config = data['action_config']
            if isinstance(action_config, dict):
                action_config = json.dumps(action_config)
            automation.action_config = action_config
        if 'is_active' in data:
            automation.is_active = data['is_active']
        
        automation.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Automation updated successfully",
            "automation": {
                "id": automation.id,
                "name": automation.name,
                "trigger_type": automation.trigger_type,
                "action_type": automation.action_type,
                "is_active": automation.is_active,
                "updated_at": automation.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating automation {automation_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@automation_api.route('/<int:automation_id>', methods=['DELETE'])
def delete_automation(automation_id):
    """Delete an automation"""
    try:
        automation = AIAutomation.query.get(automation_id)
        
        if not automation:
            return jsonify({
                "status": "not_found",
                "message": f"Automation with ID {automation_id} not found"
            }), 404
        
        # Delete the automation
        db.session.delete(automation)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Automation {automation_id} deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting automation {automation_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@automation_api.route('/<int:automation_id>/execute', methods=['POST'])
def execute_automation(automation_id):
    """Execute an automation"""
    try:
        automation = AIAutomation.query.get(automation_id)
        
        if not automation:
            return jsonify({
                "status": "not_found",
                "message": f"Automation with ID {automation_id} not found"
            }), 404
        
        # Check if automation is active
        if not automation.is_active:
            return jsonify({
                "status": "error",
                "message": f"Automation {automation_id} is not active"
            }), 400
        
        # In a real implementation, this would execute the automation
        # For now, we'll simulate successful execution
        start_time = datetime.now()
        
        # Create a log entry
        log = AutomationLog(
            automation_id=automation.id,
            status='success',
            execution_start=start_time,
            execution_end=datetime.now(),
            result=json.dumps({
                "message": "Automation executed successfully",
                "timestamp": datetime.now().isoformat()
            })
        )
        
        # Update automation
        automation.last_triggered = start_time
        automation.execution_count += 1
        
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Automation {automation_id} executed successfully",
            "execution": {
                "automation_id": automation.id,
                "log_id": log.id,
                "executed_at": automation.last_triggered.isoformat(),
                "execution_count": automation.execution_count
            }
        })
        
    except Exception as e:
        logger.error(f"Error executing automation {automation_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@automation_api.route('/logs', methods=['GET'])
def get_automation_logs():
    """Get automation execution logs"""
    try:
        automation_id = request.args.get('automation_id', type=int)
        status = request.args.get('status')
        days = request.args.get('days', default=7, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Build query
        query = AutomationLog.query.filter(AutomationLog.execution_start >= start_date)
        
        if automation_id:
            query = query.filter(AutomationLog.automation_id == automation_id)
        if status:
            query = query.filter(AutomationLog.status == status)
            
        # Execute query with order by most recent first
        logs = query.order_by(AutomationLog.execution_start.desc()).all()
        
        # Format result
        result = []
        for log in logs:
            # Calculate execution duration if end time is available
            duration = None
            if log.execution_end:
                duration = (log.execution_end - log.execution_start).total_seconds()
            
            # Parse result JSON if available
            log_result = {}
            if log.result:
                try:
                    log_result = json.loads(log.result)
                except:
                    pass
            
            result.append({
                "id": log.id,
                "automation_id": log.automation_id,
                "automation_name": log.automation.name if log.automation else None,
                "status": log.status,
                "execution_start": log.execution_start.isoformat(),
                "execution_end": log.execution_end.isoformat() if log.execution_end else None,
                "duration_seconds": duration,
                "result": log_result,
                "error": log.error
            })
        
        return jsonify({
            "status": "success",
            "logs": result
        })
        
    except Exception as e:
        logger.error(f"Error getting automation logs: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def register_endpoints(app):
    """Register all API endpoints with the Flask app"""
    app.register_blueprint(integration_api)
    app.register_blueprint(automation_api)