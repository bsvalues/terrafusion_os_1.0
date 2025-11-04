"""
API routes for ETL job scheduling.

This module provides API endpoints to:
1. Manage ETL job schedules (create, read, update, delete)
2. Get schedule execution history
"""

import json
import logging
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from app import db
from models import ETLSchedule
from api.auth import api_key_required

# Create Blueprint
schedule_blueprint = Blueprint('schedule', __name__)
logger = logging.getLogger(__name__)

@schedule_blueprint.route('/schedules', methods=['GET'])
@api_key_required(permissions=['etl:read'])
def get_schedules():
    """
    Get all ETL job schedules.
    
    Query parameters:
        plugin_name (str, optional): Filter by ETL plugin name
        enabled (bool, optional): Filter by enabled status
    
    Returns:
        JSON: List of ETL job schedules
    """
    plugin_name = request.args.get('plugin_name')
    enabled_param = request.args.get('enabled')
    
    query = ETLSchedule.query
    
    if plugin_name:
        query = query.filter(ETLSchedule.plugin_name == plugin_name)
    
    if enabled_param is not None:
        enabled = enabled_param.lower() == 'true'
        query = query.filter(ETLSchedule.enabled == enabled)
    
    schedules = query.order_by(ETLSchedule.next_run.asc()).all()
    
    return jsonify({
        'success': True,
        'schedules': [schedule.to_dict() for schedule in schedules]
    })

@schedule_blueprint.route('/schedules/<int:schedule_id>', methods=['GET'])
@api_key_required(permissions=['etl:read'])
def get_schedule(schedule_id):
    """
    Get a specific ETL job schedule.
    
    Args:
        schedule_id (int): The ID of the schedule
    
    Returns:
        JSON: ETL job schedule
    """
    schedule = ETLSchedule.query.get(schedule_id)
    
    if not schedule:
        return jsonify({
            'success': False,
            'error': f'Schedule with ID {schedule_id} not found'
        }), 404
    
    return jsonify({
        'success': True,
        'schedule': schedule.to_dict()
    })

@schedule_blueprint.route('/schedules', methods=['POST'])
@api_key_required(permissions=['etl:write'])
def create_schedule():
    """
    Create a new ETL job schedule.
    
    Request JSON:
        name (str): Name of the schedule
        plugin_name (str): Name of the ETL plugin to run
        description (str, optional): Description of the schedule
        enabled (bool, optional): Whether the schedule is enabled
        config (dict, optional): Configuration for the ETL plugin
        frequency (str): Frequency of the schedule (hourly, daily, weekly, monthly, custom)
        hour (int, optional): Hour of the day to run (0-23)
        minute (int, optional): Minute of the hour to run (0-59)
        day_of_week (int, optional): Day of the week to run (0=Monday, 6=Sunday)
        day_of_month (int, optional): Day of the month to run (1-31)
        cron_expression (str, optional): Custom cron expression if frequency is custom
    
    Returns:
        JSON: Created ETL job schedule
    """
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'plugin_name', 'frequency']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    # Validate frequency
    valid_frequencies = ['hourly', 'daily', 'weekly', 'monthly', 'custom']
    if data['frequency'] not in valid_frequencies:
        return jsonify({
            'success': False,
            'error': f'Invalid frequency: {data["frequency"]}. Must be one of {valid_frequencies}'
        }), 400
    
    # Validate frequency-specific fields
    if data['frequency'] == 'weekly' and 'day_of_week' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing day_of_week for weekly frequency'
        }), 400
    
    if data['frequency'] == 'monthly' and 'day_of_month' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing day_of_month for monthly frequency'
        }), 400
    
    if data['frequency'] == 'custom' and 'cron_expression' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing cron_expression for custom frequency'
        }), 400
    
    # Create the schedule
    schedule = ETLSchedule(
        name=data['name'],
        plugin_name=data['plugin_name'],
        description=data.get('description'),
        enabled=data.get('enabled', True),
        config=data.get('config'),
        frequency=data['frequency'],
        hour=data.get('hour', 0),
        minute=data.get('minute', 0),
        day_of_week=data.get('day_of_week'),
        day_of_month=data.get('day_of_month'),
        cron_expression=data.get('cron_expression'),
        created_by="API User"
    )
    
    # Calculate the next run time
    schedule.next_run = schedule.calculate_next_run_time()
    
    # Save to database
    db.session.add(schedule)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Schedule created successfully',
        'schedule': schedule.to_dict()
    }), 201

@schedule_blueprint.route('/schedules/<int:schedule_id>', methods=['PUT'])
@api_key_required(permissions=['etl:write'])
def update_schedule(schedule_id):
    """
    Update an existing ETL job schedule.
    
    Args:
        schedule_id (int): The ID of the schedule to update
    
    Request JSON:
        name (str, optional): Name of the schedule
        plugin_name (str, optional): Name of the ETL plugin to run
        description (str, optional): Description of the schedule
        enabled (bool, optional): Whether the schedule is enabled
        config (dict, optional): Configuration for the ETL plugin
        frequency (str, optional): Frequency of the schedule (hourly, daily, weekly, monthly, custom)
        hour (int, optional): Hour of the day to run (0-23)
        minute (int, optional): Minute of the hour to run (0-59)
        day_of_week (int, optional): Day of the week to run (0=Monday, 6=Sunday)
        day_of_month (int, optional): Day of the month to run (1-31)
        cron_expression (str, optional): Custom cron expression if frequency is custom
    
    Returns:
        JSON: Updated ETL job schedule
    """
    schedule = ETLSchedule.query.get(schedule_id)
    
    if not schedule:
        return jsonify({
            'success': False,
            'error': f'Schedule with ID {schedule_id} not found'
        }), 404
    
    data = request.json
    
    # Update fields if provided
    if 'name' in data:
        schedule.name = data['name']
    
    if 'plugin_name' in data:
        schedule.plugin_name = data['plugin_name']
    
    if 'description' in data:
        schedule.description = data['description']
    
    if 'enabled' in data:
        schedule.enabled = data['enabled']
    
    if 'config' in data:
        schedule.config = data['config']
    
    # Validate frequency if provided
    if 'frequency' in data:
        valid_frequencies = ['hourly', 'daily', 'weekly', 'monthly', 'custom']
        if data['frequency'] not in valid_frequencies:
            return jsonify({
                'success': False,
                'error': f'Invalid frequency: {data["frequency"]}. Must be one of {valid_frequencies}'
            }), 400
        
        schedule.frequency = data['frequency']
        
        # Validate frequency-specific fields
        if data['frequency'] == 'weekly' and 'day_of_week' not in data and schedule.day_of_week is None:
            return jsonify({
                'success': False,
                'error': 'Missing day_of_week for weekly frequency'
            }), 400
        
        if data['frequency'] == 'monthly' and 'day_of_month' not in data and schedule.day_of_month is None:
            return jsonify({
                'success': False,
                'error': 'Missing day_of_month for monthly frequency'
            }), 400
        
        if data['frequency'] == 'custom' and 'cron_expression' not in data and schedule.cron_expression is None:
            return jsonify({
                'success': False,
                'error': 'Missing cron_expression for custom frequency'
            }), 400
    
    # Update schedule fields if provided
    if 'hour' in data:
        schedule.hour = data['hour']
    
    if 'minute' in data:
        schedule.minute = data['minute']
    
    if 'day_of_week' in data:
        schedule.day_of_week = data['day_of_week']
    
    if 'day_of_month' in data:
        schedule.day_of_month = data['day_of_month']
    
    if 'cron_expression' in data:
        schedule.cron_expression = data['cron_expression']
    
    # Update next run time
    schedule.next_run = schedule.calculate_next_run_time()
    
    # Save to database
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Schedule updated successfully',
        'schedule': schedule.to_dict()
    })

@schedule_blueprint.route('/schedules/<int:schedule_id>', methods=['DELETE'])
@api_key_required(permissions=['etl:write'])
def delete_schedule(schedule_id):
    """
    Delete an ETL job schedule.
    
    Args:
        schedule_id (int): The ID of the schedule to delete
    
    Returns:
        JSON: Success status
    """
    schedule = ETLSchedule.query.get(schedule_id)
    
    if not schedule:
        return jsonify({
            'success': False,
            'error': f'Schedule with ID {schedule_id} not found'
        }), 404
    
    db.session.delete(schedule)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Schedule {schedule_id} deleted successfully'
    })

@schedule_blueprint.route('/schedules/<int:schedule_id>/enable', methods=['POST'])
@api_key_required(permissions=['etl:write'])
def enable_schedule(schedule_id):
    """
    Enable an ETL job schedule.
    
    Args:
        schedule_id (int): The ID of the schedule to enable
    
    Returns:
        JSON: Updated ETL job schedule
    """
    schedule = ETLSchedule.query.get(schedule_id)
    
    if not schedule:
        return jsonify({
            'success': False,
            'error': f'Schedule with ID {schedule_id} not found'
        }), 404
    
    schedule.enabled = True
    schedule.next_run = schedule.calculate_next_run_time()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Schedule {schedule_id} enabled successfully',
        'schedule': schedule.to_dict()
    })

@schedule_blueprint.route('/schedules/<int:schedule_id>/disable', methods=['POST'])
@api_key_required(permissions=['etl:write'])
def disable_schedule(schedule_id):
    """
    Disable an ETL job schedule.
    
    Args:
        schedule_id (int): The ID of the schedule to disable
    
    Returns:
        JSON: Updated ETL job schedule
    """
    schedule = ETLSchedule.query.get(schedule_id)
    
    if not schedule:
        return jsonify({
            'success': False,
            'error': f'Schedule with ID {schedule_id} not found'
        }), 404
    
    schedule.enabled = False
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Schedule {schedule_id} disabled successfully',
        'schedule': schedule.to_dict()
    })

@schedule_blueprint.route('/schedules/<int:schedule_id>/run', methods=['POST'])
@api_key_required(permissions=['etl:write'])
def run_schedule_now(schedule_id):
    """
    Run an ETL job schedule immediately.
    
    Args:
        schedule_id (int): The ID of the schedule to run
    
    Returns:
        JSON: Job ID and status information
    """
    from etl.manager import etl_manager
    
    schedule = ETLSchedule.query.get(schedule_id)
    
    if not schedule:
        return jsonify({
            'success': False,
            'error': f'Schedule with ID {schedule_id} not found'
        }), 404
    
    # Start the job with the schedule's configuration
    job_id = etl_manager.start_job(
        plugin_name=schedule.plugin_name,
        config=schedule.config or {},
        async_execution=True,
        scheduled_id=schedule.id
    )
    
    # Update the schedule's last run time
    schedule.last_run = datetime.now()
    schedule.last_status = 'running'
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Schedule {schedule_id} started successfully',
        'job_id': job_id
    })

def register_schedule_blueprint(app):
    """Register the schedule blueprint with the Flask app."""
    app.register_blueprint(schedule_blueprint, url_prefix='/api/etl')
    logger.info("Registered ETL schedule API blueprint")