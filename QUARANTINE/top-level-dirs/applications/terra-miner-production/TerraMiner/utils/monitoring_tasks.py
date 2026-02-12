"""
Monitoring tasks for system health and performance.
"""
import os
import logging
import datetime
import json
import time
import psutil
import platform
from sqlalchemy import func, text
import uuid

from app import db
from models import (
    SystemMetric, MonitoringAlert, AlertRule, APIUsageLog,
    AIAgentMetrics
)
from utils.notification_service import NotificationService

# Set up logger
logger = logging.getLogger(__name__)

def collect_system_metrics():
    """
    Collect system metrics and store them in the database.
    """
    try:
        # Current timestamp
        now = datetime.datetime.now()
        
        # Collect CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        store_metric('performance', 'cpu', 'usage', cpu_percent, '%')
        
        # Collect memory metrics
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        store_metric('performance', 'memory', 'usage', memory_percent, '%')
        
        # Collect disk metrics
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        store_metric('performance', 'disk', 'usage', disk_percent, '%')
        
        # Collect process metrics for this application
        process = psutil.Process(os.getpid())
        process_cpu = process.cpu_percent(interval=1)
        process_memory = process.memory_info().rss / (1024 * 1024)  # MB
        
        store_metric('application', 'process', 'cpu_usage', process_cpu, '%')
        store_metric('application', 'process', 'memory_usage', process_memory, 'MB')
        
        # Collect database metrics using raw SQL
        try:
            with db.engine.connect() as conn:
                # Get connection count
                result = conn.execute(text("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"))
                connection_count = result.scalar()
                store_metric('database', 'connections', 'count', connection_count, 'connections')
                
                # Get average query time (postgres-specific)
                result = conn.execute(text("""
                    SELECT COALESCE(EXTRACT(EPOCH FROM avg(now() - query_start)), 0) as avg_time
                    FROM pg_stat_activity
                    WHERE datname = current_database()
                    AND state = 'active'
                    AND now() - query_start > interval '0 second'
                """))
                avg_query_time = result.scalar() or 0
                store_metric('database', 'performance', 'query_time_avg', avg_query_time, 's')
                
                # Get table counts
                for table in ['monitoring_alert', 'system_metric', 'api_usage_log', 'ai_agent_metrics']:
                    try:
                        result = conn.execute(text(f"SELECT count(*) FROM {table}"))
                        row_count = result.scalar()
                        store_metric('database', 'table_size', table, row_count, 'rows')
                    except Exception as e:
                        logger.error(f"Error getting table count for {table}: {str(e)}")
                        
        except Exception as e:
            logger.error(f"Error collecting database metrics: {str(e)}")
        
        # Collect API metrics
        try:
            # Get 24 hour request count
            api_requests_24h = db.session.query(func.count(APIUsageLog.id)).filter(
                APIUsageLog.timestamp >= (now - datetime.timedelta(hours=24))
            ).scalar()
            
            # Get error rate
            total_requests = db.session.query(func.count(APIUsageLog.id)).filter(
                APIUsageLog.timestamp >= (now - datetime.timedelta(hours=24))
            ).scalar()
            
            error_requests = db.session.query(func.count(APIUsageLog.id)).filter(
                APIUsageLog.timestamp >= (now - datetime.timedelta(hours=24)),
                APIUsageLog.status_code >= 400
            ).scalar()
            
            error_rate = (error_requests / total_requests * 100) if total_requests > 0 else 0
            
            # Get average response time
            avg_response_time = db.session.query(func.avg(APIUsageLog.response_time)).filter(
                APIUsageLog.timestamp >= (now - datetime.timedelta(hours=24))
            ).scalar() or 0
            
            store_metric('api', 'requests', 'count_24h', api_requests_24h, 'requests')
            store_metric('api', 'errors', 'rate_24h', error_rate, '%')
            store_metric('api', 'performance', 'avg_response_time', avg_response_time, 's')
            
        except Exception as e:
            logger.error(f"Error collecting API metrics: {str(e)}")
        
        # Collect AI metrics
        try:
            # Get 24 hour request count
            ai_requests_24h = db.session.query(func.sum(AIAgentMetrics.request_count)).filter(
                AIAgentMetrics.date >= (now.date() - datetime.timedelta(days=1))
            ).scalar() or 0
            
            # Get average rating
            avg_rating = db.session.query(
                func.sum(AIAgentMetrics.average_rating * AIAgentMetrics.request_count) / 
                func.sum(AIAgentMetrics.request_count)
            ).filter(
                AIAgentMetrics.date >= (now.date() - datetime.timedelta(days=7)),
                AIAgentMetrics.request_count > 0
            ).scalar() or 0
            
            store_metric('ai', 'requests', 'count_24h', ai_requests_24h, 'requests')
            store_metric('ai', 'performance', 'avg_rating', avg_rating, 'rating')
            
        except Exception as e:
            logger.error(f"Error collecting AI metrics: {str(e)}")
        
        logger.debug("System metrics collected successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error collecting system metrics: {str(e)}")
        return False

def store_metric(component, category, metric_name, metric_value, metric_unit):
    """
    Store a metric in the database.
    
    Args:
        component (str): Component name (e.g., 'cpu', 'memory', 'disk')
        category (str): Category (e.g., 'performance', 'usage')
        metric_name (str): Metric name (e.g., 'usage', 'temperature')
        metric_value (float): Metric value
        metric_unit (str): Metric unit (e.g., '%', 'MB', 'GB')
    """
    try:
        metric = SystemMetric(
            component=component,
            category=category,
            metric_name=metric_name,
            metric_value=metric_value,
            metric_unit=metric_unit,
            timestamp=datetime.datetime.now()
        )
        
        db.session.add(metric)
        db.session.commit()
        
    except Exception as e:
        logger.error(f"Error storing metric {component}.{category}.{metric_name}: {str(e)}")
        db.session.rollback()

def check_system_health():
    """
    Check system health and trigger alerts for any issues.
    """
    try:
        logger.debug("Checking system health")
        
        # Get all alert rules
        alert_rules = AlertRule.query.filter_by(is_active=True).all()
        
        for rule in alert_rules:
            try:
                # Parse rule parameters
                params = json.loads(rule.parameters) if rule.parameters else {}
                
                # Process rule based on type
                if rule.alert_type == 'threshold':
                    check_threshold_rule(rule, params)
                elif rule.alert_type == 'availability':
                    check_availability_rule(rule, params)
                elif rule.alert_type == 'pattern':
                    check_pattern_rule(rule, params)
                else:
                    logger.warning(f"Unknown alert rule type: {rule.alert_type}")
                    
            except Exception as e:
                logger.error(f"Error processing alert rule {rule.id}: {str(e)}")
        
        # Calculate system health score
        calculate_health_score()
        
        logger.debug("System health check completed")
        return True
        
    except Exception as e:
        logger.error(f"Error checking system health: {str(e)}")
        return False

def check_threshold_rule(rule, params):
    """
    Check a threshold alert rule.
    
    Args:
        rule (AlertRule): The alert rule
        params (dict): Rule parameters
    """
    try:
        # Get parameters
        component = params.get('component')
        category = params.get('category')
        metric_name = params.get('metric_name')
        operator = params.get('operator', '>')
        threshold = float(params.get('threshold', 0))
        duration_minutes = int(params.get('duration_minutes', 0))
        
        if not all([component, category, metric_name, threshold]):
            logger.warning(f"Missing required parameters for threshold rule {rule.id}")
            return
        
        # Get latest metric value
        if duration_minutes > 0:
            # Get average over duration
            cutoff = datetime.datetime.now() - datetime.timedelta(minutes=duration_minutes)
            
            metric_avg = db.session.query(func.avg(SystemMetric.metric_value)).filter(
                SystemMetric.component == component,
                SystemMetric.category == category,
                SystemMetric.metric_name == metric_name,
                SystemMetric.timestamp >= cutoff
            ).scalar()
            
            metric_value = metric_avg if metric_avg is not None else 0
            
        else:
            # Get most recent value
            latest_metric = SystemMetric.query.filter_by(
                component=component,
                category=category,
                metric_name=metric_name
            ).order_by(SystemMetric.timestamp.desc()).first()
            
            metric_value = latest_metric.metric_value if latest_metric else 0
        
        # Check threshold condition
        is_triggered = False
        if operator == '>':
            is_triggered = metric_value > threshold
        elif operator == '>=':
            is_triggered = metric_value >= threshold
        elif operator == '<':
            is_triggered = metric_value < threshold
        elif operator == '<=':
            is_triggered = metric_value <= threshold
        elif operator == '==':
            is_triggered = metric_value == threshold
        elif operator == '!=':
            is_triggered = metric_value != threshold
        
        if is_triggered:
            # Check if there's already an active alert for this rule
            existing_alert = MonitoringAlert.query.filter_by(
                alert_rule_id=rule.id,
                status='active'
            ).first()
            
            if not existing_alert:
                # Create alert message
                message = rule.message or f"{component.title()} {metric_name} {operator} {threshold}"
                
                # Format metric value with correct precision based on value magnitude
                if metric_value < 0.01:
                    formatted_value = f"{metric_value:.6f}"
                elif metric_value < 1:
                    formatted_value = f"{metric_value:.4f}"
                else:
                    formatted_value = f"{metric_value:.2f}"
                
                # Build alert details
                details = {
                    'rule_id': rule.id,
                    'rule_name': rule.name,
                    'component': component,
                    'category': category,
                    'metric_name': metric_name,
                    'operator': operator,
                    'threshold': threshold,
                    'current_value': metric_value,
                    'formatted_value': formatted_value,
                    'unit': params.get('unit', ''),
                    'check_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'duration_minutes': duration_minutes
                }
                
                # Create alert
                create_alert(
                    alert_type=rule.alert_type,
                    severity=rule.severity,
                    component=component,
                    message=message.format(value=formatted_value, threshold=threshold),
                    details=json.dumps(details),
                    alert_rule_id=rule.id
                )
                
        elif existing_alert := MonitoringAlert.query.filter_by(
            alert_rule_id=rule.id,
            status='active'
        ).first():
            # Automatically resolve the alert if condition is no longer triggered
            resolve_alert(existing_alert.id, f"Threshold condition no longer met (current: {metric_value}, threshold: {threshold})")
        
    except Exception as e:
        logger.error(f"Error checking threshold rule {rule.id}: {str(e)}")

def check_availability_rule(rule, params):
    """
    Check an availability alert rule.
    
    Args:
        rule (AlertRule): The alert rule
        params (dict): Rule parameters
    """
    try:
        # Get parameters
        target_type = params.get('target_type')
        target = params.get('target')
        timeout_seconds = float(params.get('timeout_seconds', 5))
        expected_status = params.get('expected_status')
        
        if not all([target_type, target]):
            logger.warning(f"Missing required parameters for availability rule {rule.id}")
            return
        
        # Check availability based on target type
        is_available = False
        error_message = None
        
        if target_type == 'service':
            # Check if service is running
            try:
                service_status = get_service_status(target)
                is_available = service_status == expected_status if expected_status else service_status in ['running', 'active']
                if not is_available:
                    error_message = f"Service {target} status: {service_status}"
            except Exception as e:
                error_message = f"Error checking service {target}: {str(e)}"
                is_available = False
                
        elif target_type == 'url':
            # Check if URL is accessible
            import requests
            try:
                start_time = time.time()
                response = requests.get(target, timeout=timeout_seconds)
                response_time = time.time() - start_time
                
                expected_codes = params.get('expected_status_codes', [200])
                if isinstance(expected_codes, str):
                    expected_codes = [int(code.strip()) for code in expected_codes.split(',')]
                
                is_available = response.status_code in expected_codes
                if not is_available:
                    error_message = f"URL {target} returned status {response.status_code} (expected {expected_codes})"
                
                # Store response time metric
                store_metric('availability', 'url', target.replace('://', '_').replace('/', '_'), response_time, 's')
                
            except requests.exceptions.RequestException as e:
                error_message = f"Error accessing URL {target}: {str(e)}"
                is_available = False
                
        elif target_type == 'database':
            # Check if database is accessible
            try:
                start_time = time.time()
                with db.engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                response_time = time.time() - start_time
                
                is_available = True
                
                # Store response time metric
                store_metric('availability', 'database', 'connection', response_time, 's')
                
            except Exception as e:
                error_message = f"Error connecting to database: {str(e)}"
                is_available = False
                
        elif target_type == 'port':
            # Check if port is open
            import socket
            try:
                host, port = target.split(':')
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout_seconds)
                result = sock.connect_ex((host, int(port)))
                sock.close()
                
                is_available = result == 0
                if not is_available:
                    error_message = f"Port {target} is closed (error code: {result})"
                
            except Exception as e:
                error_message = f"Error checking port {target}: {str(e)}"
                is_available = False
        
        # Check if there's already an active alert for this rule
        existing_alert = MonitoringAlert.query.filter_by(
            alert_rule_id=rule.id,
            status='active'
        ).first()
        
        if not is_available:
            if not existing_alert:
                # Create alert message
                message = rule.message or f"{target_type.title()} {target} is not available"
                
                # Build alert details
                details = {
                    'rule_id': rule.id,
                    'rule_name': rule.name,
                    'target_type': target_type,
                    'target': target,
                    'error_message': error_message,
                    'check_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                
                # Create alert
                create_alert(
                    alert_type=rule.alert_type,
                    severity=rule.severity,
                    component=target_type,
                    message=message,
                    details=json.dumps(details),
                    alert_rule_id=rule.id
                )
                
        elif existing_alert:
            # Automatically resolve the alert if target is now available
            resolve_alert(existing_alert.id, f"{target_type.title()} {target} is now available")
        
    except Exception as e:
        logger.error(f"Error checking availability rule {rule.id}: {str(e)}")

def check_pattern_rule(rule, params):
    """
    Check a pattern alert rule.
    
    Args:
        rule (AlertRule): The alert rule
        params (dict): Rule parameters
    """
    try:
        # Get parameters
        pattern_type = params.get('pattern_type')
        component = params.get('component')
        time_window_minutes = int(params.get('time_window_minutes', 60))
        threshold = int(params.get('threshold', 5))
        
        if not all([pattern_type, component, time_window_minutes, threshold]):
            logger.warning(f"Missing required parameters for pattern rule {rule.id}")
            return
        
        # Calculate time window
        cutoff = datetime.datetime.now() - datetime.timedelta(minutes=time_window_minutes)
        
        # Check pattern based on type
        if pattern_type == 'frequency':
            # Count events in time window
            query = MonitoringAlert.query.filter(
                MonitoringAlert.created_at >= cutoff
            )
            
            # Apply component filter if not wildcard
            if component != '*':
                query = query.filter(MonitoringAlert.component == component)
            
            # Apply additional filters
            alert_type = params.get('alert_type')
            if alert_type and alert_type != '*':
                query = query.filter(MonitoringAlert.alert_type == alert_type)
                
            severity = params.get('severity')
            if severity and severity != '*':
                query = query.filter(MonitoringAlert.severity == severity)
            
            # Get count
            count = query.count()
            
            # Check if threshold is exceeded
            if count >= threshold:
                # Check if there's already an active alert for this rule
                existing_alert = MonitoringAlert.query.filter_by(
                    alert_rule_id=rule.id,
                    status='active'
                ).first()
                
                if not existing_alert:
                    # Create alert message
                    message = rule.message or f"High frequency of alerts detected ({count} in {time_window_minutes} minutes)"
                    
                    # Build alert details
                    details = {
                        'rule_id': rule.id,
                        'rule_name': rule.name,
                        'pattern_type': pattern_type,
                        'component': component,
                        'time_window_minutes': time_window_minutes,
                        'threshold': threshold,
                        'count': count,
                        'check_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    
                    # Add additional filters to details
                    if alert_type and alert_type != '*':
                        details['alert_type'] = alert_type
                    
                    if severity and severity != '*':
                        details['severity'] = severity
                    
                    # Create alert
                    create_alert(
                        alert_type=rule.alert_type,
                        severity=rule.severity,
                        component=component if component != '*' else 'multiple',
                        message=message,
                        details=json.dumps(details),
                        alert_rule_id=rule.id
                    )
                    
            elif existing_alert := MonitoringAlert.query.filter_by(
                alert_rule_id=rule.id,
                status='active'
            ).first():
                # Automatically resolve the alert if condition is no longer triggered
                resolve_alert(existing_alert.id, f"Alert frequency below threshold (current: {count}, threshold: {threshold})")
                
        elif pattern_type == 'trend':
            # Check metric trend over time
            metric_name = params.get('metric_name')
            category = params.get('category')
            trend_direction = params.get('trend_direction', 'increasing')
            
            if not all([metric_name, category]):
                logger.warning(f"Missing required parameters for trend pattern rule {rule.id}")
                return
            
            # Get metrics in time window
            metrics = SystemMetric.query.filter(
                SystemMetric.component == component,
                SystemMetric.category == category,
                SystemMetric.metric_name == metric_name,
                SystemMetric.timestamp >= cutoff
            ).order_by(SystemMetric.timestamp).all()
            
            if len(metrics) < 2:
                # Not enough data points
                return
            
            # Calculate trend
            start_value = metrics[0].metric_value
            end_value = metrics[-1].metric_value
            
            # Calculate percentage change
            change_pct = ((end_value - start_value) / start_value * 100) if start_value != 0 else 0
            
            # Check if trend matches the expected direction
            is_triggered = False
            if trend_direction == 'increasing' and change_pct >= threshold:
                is_triggered = True
            elif trend_direction == 'decreasing' and change_pct <= -threshold:
                is_triggered = True
            
            # Check if there's already an active alert for this rule
            existing_alert = MonitoringAlert.query.filter_by(
                alert_rule_id=rule.id,
                status='active'
            ).first()
            
            if is_triggered:
                if not existing_alert:
                    # Create alert message
                    message = rule.message or f"{component.title()} {metric_name} {trend_direction} trend detected ({change_pct:.2f}% change)"
                    
                    # Build alert details
                    details = {
                        'rule_id': rule.id,
                        'rule_name': rule.name,
                        'pattern_type': pattern_type,
                        'component': component,
                        'category': category,
                        'metric_name': metric_name,
                        'trend_direction': trend_direction,
                        'threshold': threshold,
                        'start_value': start_value,
                        'end_value': end_value,
                        'change_pct': change_pct,
                        'time_window_minutes': time_window_minutes,
                        'check_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    
                    # Create alert
                    create_alert(
                        alert_type=rule.alert_type,
                        severity=rule.severity,
                        component=component,
                        message=message,
                        details=json.dumps(details),
                        alert_rule_id=rule.id
                    )
                    
            elif existing_alert:
                # Automatically resolve the alert if condition is no longer triggered
                resolve_alert(
                    existing_alert.id, 
                    f"Trend condition no longer met (current change: {change_pct:.2f}%, threshold: {threshold}%)"
                )
        
    except Exception as e:
        logger.error(f"Error checking pattern rule {rule.id}: {str(e)}")

def create_alert(alert_type, severity, component, message, details=None, alert_rule_id=None):
    """
    Create a new alert.
    
    Args:
        alert_type (str): Type of alert
        severity (str): Severity of alert
        component (str): Component that triggered the alert
        message (str): Alert message
        details (str, optional): Alert details as JSON string
        alert_rule_id (int, optional): ID of the alert rule that triggered the alert
    
    Returns:
        MonitoringAlert: The created alert
    """
    try:
        # Create alert
        alert = MonitoringAlert(
            alert_type=alert_type,
            severity=severity,
            component=component,
            message=message,
            details=details,
            alert_rule_id=alert_rule_id,
            status='active',
            created_at=datetime.datetime.now()
        )
        
        db.session.add(alert)
        db.session.commit()
        
        logger.info(f"Created alert: {message} ({severity})")
        
        # Send notifications for new alert
        notification_service = NotificationService()
        notification_service.send_alert_notification(alert)
        
        return alert
        
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        db.session.rollback()
        return None

def resolve_alert(alert_id, resolution_note=None):
    """
    Resolve an alert.
    
    Args:
        alert_id (int): ID of the alert to resolve
        resolution_note (str, optional): Note about resolution
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get alert
        alert = MonitoringAlert.query.get(alert_id)
        if not alert:
            logger.error(f"Alert with ID {alert_id} not found")
            return False
        
        # Update alert
        alert.status = 'resolved'
        alert.resolved_at = datetime.datetime.now()
        alert.resolution_note = resolution_note
        
        db.session.commit()
        
        logger.info(f"Resolved alert {alert_id}: {alert.message}")
        return True
        
    except Exception as e:
        logger.error(f"Error resolving alert {alert_id}: {str(e)}")
        db.session.rollback()
        return False

def acknowledge_alert(alert_id, note=None):
    """
    Acknowledge an alert.
    
    Args:
        alert_id (int): ID of the alert to acknowledge
        note (str, optional): Acknowledgement note
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get alert
        alert = MonitoringAlert.query.get(alert_id)
        if not alert:
            logger.error(f"Alert with ID {alert_id} not found")
            return False
        
        # Update alert
        alert.status = 'acknowledged'
        alert.acknowledged_at = datetime.datetime.now()
        alert.acknowledgement_note = note
        
        db.session.commit()
        
        logger.info(f"Acknowledged alert {alert_id}: {alert.message}")
        return True
        
    except Exception as e:
        logger.error(f"Error acknowledging alert {alert_id}: {str(e)}")
        db.session.rollback()
        return False

def get_service_status(service_name):
    """
    Get the status of a system service.
    
    Args:
        service_name (str): Name of the service
    
    Returns:
        str: Status of the service
    """
    try:
        system = platform.system().lower()
        
        if system == 'linux':
            import subprocess
            
            # Try systemctl first
            try:
                result = subprocess.run(['systemctl', 'is-active', service_name], stdout=subprocess.PIPE, text=True)
                status = result.stdout.strip()
                if status:
                    return status
            except:
                pass
            
            # Try service command
            try:
                result = subprocess.run(['service', service_name, 'status'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                output = result.stdout + result.stderr
                
                if 'running' in output.lower():
                    return 'running'
                elif 'stopped' in output.lower():
                    return 'stopped'
                elif 'not found' in output.lower():
                    return 'not_found'
                else:
                    return 'unknown'
            except:
                pass
            
        elif system == 'windows':
            import subprocess
            
            try:
                result = subprocess.run(['sc', 'query', service_name], stdout=subprocess.PIPE, text=True)
                output = result.stdout
                
                if 'RUNNING' in output:
                    return 'running'
                elif 'STOPPED' in output:
                    return 'stopped'
                elif 'does not exist' in output:
                    return 'not_found'
                else:
                    return 'unknown'
            except:
                pass
        
        # Default if we couldn't determine status
        return 'unknown'
        
    except Exception as e:
        logger.error(f"Error getting service status for {service_name}: {str(e)}")
        return 'error'

def calculate_health_score():
    """
    Calculate overall system health score and store as metrics.
    """
    try:
        # Get active alerts
        active_alerts = MonitoringAlert.query.filter(
            MonitoringAlert.status.in_(['active', 'acknowledged'])
        ).all()
        
        # Get CPU, memory, and disk metrics
        cpu_metric = SystemMetric.query.filter_by(
            component='performance',
            metric_name='usage',
            category='cpu'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        memory_metric = SystemMetric.query.filter_by(
            component='performance',
            metric_name='usage',
            category='memory'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        disk_metric = SystemMetric.query.filter_by(
            component='performance',
            metric_name='usage',
            category='disk'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        # Check API error rate
        api_error_rate = SystemMetric.query.filter_by(
            component='api',
            metric_name='rate_24h',
            category='errors'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        # Calculate base score from metrics (0-100)
        base_score = 100
        
        # Deduct for high resource usage
        if cpu_metric:
            cpu_penalty = max(0, cpu_metric.metric_value - 70) * 0.5
            base_score -= cpu_penalty
        
        if memory_metric:
            memory_penalty = max(0, memory_metric.metric_value - 70) * 0.5
            base_score -= memory_penalty
        
        if disk_metric:
            disk_penalty = max(0, disk_metric.metric_value - 70) * 0.5
            base_score -= disk_penalty
        
        # Deduct for API errors
        if api_error_rate:
            api_penalty = api_error_rate.metric_value * 5  # 5 points per 1% error rate
            base_score -= api_penalty
        
        # Deduct for active alerts based on severity
        alert_penalties = {
            'critical': 15,
            'error': 10,
            'warning': 5,
            'info': 1
        }
        
        for alert in active_alerts:
            penalty = alert_penalties.get(alert.severity, 0)
            
            # Reduce penalty for acknowledged alerts
            if alert.status == 'acknowledged':
                penalty *= 0.5
                
            base_score -= penalty
        
        # Ensure score is between 0 and 100
        health_score = max(0, min(100, base_score))
        
        # Determine health status based on score
        if health_score >= 90:
            health_status = 'excellent'
        elif health_score >= 75:
            health_status = 'good'
        elif health_score >= 50:
            health_status = 'fair'
        elif health_score >= 25:
            health_status = 'poor'
        else:
            health_status = 'critical'
        
        # Store health score and status as metrics
        store_metric('system', 'health', 'score', health_score, '%')
        store_metric('system', 'health', 'status', 0, health_status)
        
    except Exception as e:
        logger.error(f"Error calculating health score: {str(e)}")

def get_alert_metrics():
    """
    Get alert metrics for the dashboard.
    
    Returns:
        dict: Alert metrics
    """
    try:
        now = datetime.datetime.now()
        
        # Count active alerts by severity
        active_counts = {
            'critical': MonitoringAlert.query.filter_by(status='active', severity='critical').count(),
            'error': MonitoringAlert.query.filter_by(status='active', severity='error').count(),
            'warning': MonitoringAlert.query.filter_by(status='active', severity='warning').count(),
            'info': MonitoringAlert.query.filter_by(status='active', severity='info').count()
        }
        
        active_counts['total'] = sum(active_counts.values())
        
        # Count alerts in last 24 hours
        count_24h = MonitoringAlert.query.filter(
            MonitoringAlert.created_at >= (now - datetime.timedelta(hours=24))
        ).count()
        
        # Count alerts in last 7 days
        count_7d = MonitoringAlert.query.filter(
            MonitoringAlert.created_at >= (now - datetime.timedelta(days=7))
        ).count()
        
        # Get latest 5 alerts
        latest_alerts = MonitoringAlert.query.order_by(
            MonitoringAlert.created_at.desc()
        ).limit(5).all()
        
        # Format latest alerts
        latest = []
        for alert in latest_alerts:
            latest.append({
                'id': alert.id,
                'severity': alert.severity,
                'message': alert.message,
                'created_at': alert.created_at
            })
        
        return {
            'active': active_counts,
            'last_24h': count_24h,
            'last_7d': count_7d,
            'latest': latest
        }
        
    except Exception as e:
        logger.error(f"Error getting alert metrics: {str(e)}")
        return {
            'active': {'total': 0, 'critical': 0, 'error': 0, 'warning': 0, 'info': 0},
            'last_24h': 0,
            'last_7d': 0,
            'latest': []
        }