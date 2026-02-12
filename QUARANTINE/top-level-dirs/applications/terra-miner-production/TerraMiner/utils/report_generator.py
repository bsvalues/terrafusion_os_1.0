"""
Report generation utilities for system monitoring and alerts.
"""
import os
import json
import logging
import csv
import tempfile
from datetime import datetime, timedelta
from io import StringIO
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

import pandas as pd
from sqlalchemy import func

from app import db
from models import (
    MonitoringAlert, SystemMetric, APIUsageLog, 
    AIAgentMetrics, JobRun, ScheduledReport,
    NotificationChannel
)
from utils.notification_service import NotificationService

# Set up logger
logger = logging.getLogger(__name__)

class ReportGenerator:
    """
    Report generation for monitoring and alerts.
    """
    
    @staticmethod
    def generate_alerts_report(days=30, severity=None, component=None, status=None):
        """
        Generate a report of alerts.
        
        Args:
            days (int): Number of days to include in the report
            severity (str, optional): Filter by severity
            component (str, optional): Filter by component
            status (str, optional): Filter by status
            
        Returns:
            dict: Report data including metadata and alerts
        """
        try:
            # Build query
            query = MonitoringAlert.query
            
            # Apply filters
            if days > 0:
                cutoff_date = datetime.now() - timedelta(days=days)
                query = query.filter(MonitoringAlert.created_at >= cutoff_date)
                
            if severity:
                query = query.filter(MonitoringAlert.severity == severity)
                
            if component:
                query = query.filter(MonitoringAlert.component == component)
                
            if status:
                query = query.filter(MonitoringAlert.status == status)
            
            # Execute query with sorting
            alerts = query.order_by(MonitoringAlert.created_at.desc()).all()
            
            # Count alerts by severity
            severity_counts = {
                'critical': sum(1 for alert in alerts if alert.severity == 'critical'),
                'error': sum(1 for alert in alerts if alert.severity == 'error'),
                'warning': sum(1 for alert in alerts if alert.severity == 'warning'),
                'info': sum(1 for alert in alerts if alert.severity == 'info')
            }
            
            # Count alerts by status
            status_counts = {
                'active': sum(1 for alert in alerts if alert.status == 'active'),
                'acknowledged': sum(1 for alert in alerts if alert.status == 'acknowledged'),
                'resolved': sum(1 for alert in alerts if alert.status == 'resolved')
            }
            
            # Count alerts by component
            component_counts = {}
            for alert in alerts:
                component_counts[alert.component] = component_counts.get(alert.component, 0) + 1
            
            # Format alerts for report
            alert_data = []
            for alert in alerts:
                alert_data.append({
                    'id': alert.id,
                    'alert_type': alert.alert_type,
                    'severity': alert.severity,
                    'component': alert.component,
                    'message': alert.message,
                    'status': alert.status,
                    'created_at': alert.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'acknowledged_at': alert.acknowledged_at.strftime('%Y-%m-%d %H:%M:%S') if alert.acknowledged_at else None,
                    'resolved_at': alert.resolved_at.strftime('%Y-%m-%d %H:%M:%S') if alert.resolved_at else None
                })
            
            # Build report data
            report_data = {
                'metadata': {
                    'report_type': 'alerts',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'period_days': days,
                    'filters': {
                        'severity': severity,
                        'component': component,
                        'status': status
                    },
                    'total_alerts': len(alerts)
                },
                'summary': {
                    'severity_counts': severity_counts,
                    'status_counts': status_counts,
                    'component_counts': component_counts
                },
                'alerts': alert_data
            }
            
            return report_data
            
        except Exception as e:
            logger.error(f"Error generating alerts report: {str(e)}")
            return {
                'metadata': {
                    'report_type': 'alerts',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'error': str(e)
                },
                'alerts': []
            }
    
    @staticmethod
    def generate_system_metrics_report(days=7, component=None):
        """
        Generate a report of system metrics.
        
        Args:
            days (int): Number of days to include in the report
            component (str, optional): Filter by component
            
        Returns:
            dict: Report data including metadata and metrics
        """
        try:
            # Build query
            query = SystemMetric.query
            
            # Apply filters
            if days > 0:
                cutoff_date = datetime.now() - timedelta(days=days)
                query = query.filter(SystemMetric.timestamp >= cutoff_date)
                
            if component:
                query = query.filter(SystemMetric.component == component)
            
            # Execute query with sorting
            metrics = query.order_by(SystemMetric.timestamp.desc()).all()
            
            # Group metrics by name and component
            metrics_by_name = {}
            for metric in metrics:
                key = f"{metric.component}:{metric.metric_name}"
                if key not in metrics_by_name:
                    metrics_by_name[key] = []
                metrics_by_name[key].append({
                    'value': metric.metric_value,
                    'timestamp': metric.timestamp
                })
            
            # Calculate statistics for each metric
            metrics_summary = {}
            for key, values in metrics_by_name.items():
                component, metric_name = key.split(':', 1)
                metric_values = [v['value'] for v in values]
                
                if not metric_values:
                    continue
                    
                metrics_summary[key] = {
                    'component': component,
                    'metric_name': metric_name,
                    'latest': metric_values[0],
                    'min': min(metric_values),
                    'max': max(metric_values),
                    'avg': sum(metric_values) / len(metric_values),
                    'count': len(metric_values),
                    'unit': next((m.metric_unit for m in metrics if m.component == component and m.metric_name == metric_name), None)
                }
            
            # Format metrics for report
            metric_data = []
            for metric in metrics:
                metric_data.append({
                    'id': metric.id,
                    'metric_name': metric.metric_name,
                    'metric_value': metric.metric_value,
                    'metric_unit': metric.metric_unit,
                    'category': metric.category,
                    'component': metric.component,
                    'timestamp': metric.timestamp.strftime('%Y-%m-%d %H:%M:%S')
                })
            
            # Build report data
            report_data = {
                'metadata': {
                    'report_type': 'system_metrics',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'period_days': days,
                    'filters': {
                        'component': component
                    },
                    'total_metrics': len(metrics)
                },
                'summary': metrics_summary,
                'metrics': metric_data
            }
            
            return report_data
            
        except Exception as e:
            logger.error(f"Error generating system metrics report: {str(e)}")
            return {
                'metadata': {
                    'report_type': 'system_metrics',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'error': str(e)
                },
                'metrics': []
            }
    
    @staticmethod
    def generate_api_usage_report(days=7):
        """
        Generate a report of API usage.
        
        Args:
            days (int): Number of days to include in the report
            
        Returns:
            dict: Report data including metadata and API usage
        """
        try:
            # Build query
            query = APIUsageLog.query
            
            # Apply filters
            if days > 0:
                cutoff_date = datetime.now() - timedelta(days=days)
                query = query.filter(APIUsageLog.timestamp >= cutoff_date)
            
            # Execute query with sorting
            logs = query.order_by(APIUsageLog.timestamp.desc()).all()
            
            # Calculate statistics
            total_requests = len(logs)
            
            # Count requests by status code
            status_counts = {}
            for log in logs:
                status_category = f"{log.status_code // 100}xx"
                status_counts[status_category] = status_counts.get(status_category, 0) + 1
            
            # Count requests by endpoint
            endpoint_counts = {}
            for log in logs:
                endpoint_counts[log.endpoint] = endpoint_counts.get(log.endpoint, 0) + 1
            
            # Calculate average response time
            avg_response_time = sum(log.response_time for log in logs) / len(logs) if logs else 0
            
            # Group logs by day
            logs_by_day = {}
            for log in logs:
                day = log.timestamp.strftime('%Y-%m-%d')
                if day not in logs_by_day:
                    logs_by_day[day] = []
                logs_by_day[day].append(log)
            
            # Calculate daily statistics
            daily_stats = {}
            for day, day_logs in logs_by_day.items():
                daily_stats[day] = {
                    'total_requests': len(day_logs),
                    'avg_response_time': sum(log.response_time for log in day_logs) / len(day_logs),
                    'error_count': sum(1 for log in day_logs if log.status_code >= 400),
                    'error_rate': sum(1 for log in day_logs if log.status_code >= 400) / len(day_logs) * 100
                }
            
            # Format logs for report
            log_data = []
            for log in logs:
                log_data.append({
                    'id': log.id,
                    'endpoint': log.endpoint,
                    'method': log.method,
                    'status_code': log.status_code,
                    'response_time': log.response_time,
                    'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
                })
            
            # Build report data
            report_data = {
                'metadata': {
                    'report_type': 'api_usage',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'period_days': days,
                    'total_requests': total_requests
                },
                'summary': {
                    'status_counts': status_counts,
                    'endpoint_counts': endpoint_counts,
                    'avg_response_time': avg_response_time,
                    'error_rate': status_counts.get('4xx', 0) + status_counts.get('5xx', 0) / total_requests * 100 if total_requests > 0 else 0
                },
                'daily_stats': daily_stats,
                'logs': log_data
            }
            
            return report_data
            
        except Exception as e:
            logger.error(f"Error generating API usage report: {str(e)}")
            return {
                'metadata': {
                    'report_type': 'api_usage',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'error': str(e)
                },
                'logs': []
            }
    
    @staticmethod
    def generate_ai_performance_report(days=30):
        """
        Generate a report of AI performance.
        
        Args:
            days (int): Number of days to include in the report
            
        Returns:
            dict: Report data including metadata and AI performance
        """
        try:
            # Build query
            query = AIAgentMetrics.query
            
            # Apply filters
            if days > 0:
                cutoff_date = datetime.now() - timedelta(days=days)
                query = query.filter(AIAgentMetrics.date >= cutoff_date.date())
            
            # Execute query with sorting
            metrics = query.order_by(AIAgentMetrics.date.desc()).all()
            
            # Group metrics by agent type
            metrics_by_agent = {}
            for metric in metrics:
                if metric.agent_type not in metrics_by_agent:
                    metrics_by_agent[metric.agent_type] = []
                metrics_by_agent[metric.agent_type].append(metric)
            
            # Calculate statistics for each agent
            agent_summary = {}
            for agent_type, agent_metrics in metrics_by_agent.items():
                agent_summary[agent_type] = {
                    'total_requests': sum(m.request_count for m in agent_metrics),
                    'error_count': sum(m.error_count for m in agent_metrics),
                    'avg_response_time': sum(m.average_response_time * m.request_count for m in agent_metrics) / sum(m.request_count for m in agent_metrics) if sum(m.request_count for m in agent_metrics) > 0 else 0,
                    'avg_rating': sum(m.average_rating * m.request_count for m in agent_metrics) / sum(m.request_count for m in agent_metrics) if sum(m.request_count for m in agent_metrics) > 0 else 0,
                    'total_tokens': sum(m.token_usage for m in agent_metrics),
                    'error_rate': sum(m.error_count for m in agent_metrics) / sum(m.request_count for m in agent_metrics) * 100 if sum(m.request_count for m in agent_metrics) > 0 else 0
                }
            
            # Format metrics for report
            metric_data = []
            for metric in metrics:
                metric_data.append({
                    'id': metric.id,
                    'agent_type': metric.agent_type,
                    'date': metric.date.strftime('%Y-%m-%d'),
                    'request_count': metric.request_count,
                    'error_count': metric.error_count,
                    'average_response_time': metric.average_response_time,
                    'average_rating': metric.average_rating,
                    'token_usage': metric.token_usage
                })
            
            # Build report data
            report_data = {
                'metadata': {
                    'report_type': 'ai_performance',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'period_days': days,
                    'total_agents': len(metrics_by_agent)
                },
                'summary': {
                    'agent_summary': agent_summary,
                    'total_requests': sum(m.request_count for m in metrics),
                    'total_tokens': sum(m.token_usage for m in metrics),
                    'overall_avg_rating': sum(m.average_rating * m.request_count for m in metrics) / sum(m.request_count for m in metrics) if sum(m.request_count for m in metrics) > 0 else 0
                },
                'metrics': metric_data
            }
            
            return report_data
            
        except Exception as e:
            logger.error(f"Error generating AI performance report: {str(e)}")
            return {
                'metadata': {
                    'report_type': 'ai_performance',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'error': str(e)
                },
                'metrics': []
            }
    
    @staticmethod
    def generate_report_from_config(report):
        """
        Generate a report based on a ScheduledReport configuration.
        
        Args:
            report (ScheduledReport): The report configuration
            
        Returns:
            dict: The generated report data
        """
        try:
            # Parse parameters
            params = json.loads(report.parameters) if report.parameters else {}
            
            # Default parameters
            days = params.get('days', 30)
            component = params.get('component')
            severity = params.get('severity')
            status = params.get('status')
            
            # Generate the appropriate report based on type
            if report.report_type == 'alerts':
                return ReportGenerator.generate_alerts_report(days, severity, component, status)
            elif report.report_type == 'system_metrics':
                return ReportGenerator.generate_system_metrics_report(days, component)
            elif report.report_type == 'api_usage':
                return ReportGenerator.generate_api_usage_report(days)
            elif report.report_type == 'ai_performance':
                return ReportGenerator.generate_ai_performance_report(days)
            else:
                logger.error(f"Unknown report type: {report.report_type}")
                return {
                    'metadata': {
                        'report_type': report.report_type,
                        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'error': f"Unknown report type: {report.report_type}"
                    },
                    'data': []
                }
                
        except Exception as e:
            logger.error(f"Error generating report from config: {str(e)}")
            return {
                'metadata': {
                    'report_type': report.report_type if report else 'unknown',
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'error': str(e)
                },
                'data': []
            }
    
    @staticmethod
    def format_report_as_html(report_data):
        """
        Format a report as HTML.
        
        Args:
            report_data (dict): The report data
            
        Returns:
            str: HTML content
        """
        try:
            report_type = report_data.get('metadata', {}).get('report_type', 'unknown')
            generated_at = report_data.get('metadata', {}).get('generated_at', '')
            
            # Start with common header
            html = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{report_type.title()} Report</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1, h2, h3 {{ color: #333; }}
                    table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                    tr:nth-child(even) {{ background-color: #f9f9f9; }}
                    .critical {{ color: #d9534f; }}
                    .error {{ color: #d9534f; }}
                    .warning {{ color: #f0ad4e; }}
                    .info {{ color: #5bc0de; }}
                    .success {{ color: #5cb85c; }}
                    .header {{ margin-bottom: 20px; }}
                    .summary {{ margin-bottom: 20px; }}
                    .data {{ margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>{report_type.title()} Report</h1>
                    <p>Generated at: {generated_at}</p>
                </div>
            """
            
            # Add error message if present
            if 'error' in report_data.get('metadata', {}):
                html += f"""
                <div class="error">
                    <h3>Error</h3>
                    <p>{report_data['metadata']['error']}</p>
                </div>
                """
                
                # Close document and return if there's an error
                html += """
                </body>
                </html>
                """
                return html
            
            # Add report-specific content based on type
            if report_type == 'alerts':
                html += ReportGenerator._format_alerts_report_html(report_data)
            elif report_type == 'system_metrics':
                html += ReportGenerator._format_system_metrics_report_html(report_data)
            elif report_type == 'api_usage':
                html += ReportGenerator._format_api_usage_report_html(report_data)
            elif report_type == 'ai_performance':
                html += ReportGenerator._format_ai_performance_report_html(report_data)
            else:
                html += f"""
                <div class="error">
                    <h3>Unknown Report Type</h3>
                    <p>The report type "{report_type}" is not supported.</p>
                </div>
                """
            
            # Close document
            html += """
            </body>
            </html>
            """
            
            return html
            
        except Exception as e:
            logger.error(f"Error formatting report as HTML: {str(e)}")
            return f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Report Error</title>
            </head>
            <body>
                <h1>Error Generating Report</h1>
                <p>{str(e)}</p>
            </body>
            </html>
            """
    
    @staticmethod
    def _format_alerts_report_html(report_data):
        """Format alerts report as HTML."""
        metadata = report_data.get('metadata', {})
        summary = report_data.get('summary', {})
        alerts = report_data.get('alerts', [])
        
        html = """
        <div class="summary">
            <h2>Summary</h2>
            <p>Total Alerts: {}</p>
            
            <h3>Alerts by Severity</h3>
            <table>
                <tr>
                    <th>Severity</th>
                    <th>Count</th>
                </tr>
        """.format(metadata.get('total_alerts', 0))
        
        # Add severity counts
        severity_counts = summary.get('severity_counts', {})
        for severity in ['critical', 'error', 'warning', 'info']:
            html += f"""
            <tr>
                <td class="{severity}">{severity.capitalize()}</td>
                <td>{severity_counts.get(severity, 0)}</td>
            </tr>
            """
        
        html += """
            </table>
            
            <h3>Alerts by Status</h3>
            <table>
                <tr>
                    <th>Status</th>
                    <th>Count</th>
                </tr>
        """
        
        # Add status counts
        status_counts = summary.get('status_counts', {})
        for status in ['active', 'acknowledged', 'resolved']:
            html += f"""
            <tr>
                <td>{status.capitalize()}</td>
                <td>{status_counts.get(status, 0)}</td>
            </tr>
            """
        
        html += """
            </table>
            
            <h3>Alerts by Component</h3>
            <table>
                <tr>
                    <th>Component</th>
                    <th>Count</th>
                </tr>
        """
        
        # Add component counts
        component_counts = summary.get('component_counts', {})
        for component, count in component_counts.items():
            html += f"""
            <tr>
                <td>{component}</td>
                <td>{count}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        
        <div class="data">
            <h2>Alert Details</h2>
            <table>
                <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Component</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Created At</th>
                </tr>
        """
        
        # Add alerts
        for alert in alerts:
            severity_class = alert.get('severity', 'info').lower()
            html += f"""
            <tr>
                <td class="{severity_class}">{alert.get('severity', '').capitalize()}</td>
                <td>{alert.get('alert_type', '')}</td>
                <td>{alert.get('component', '')}</td>
                <td>{alert.get('message', '')}</td>
                <td>{alert.get('status', '').capitalize()}</td>
                <td>{alert.get('created_at', '')}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        """
        
        return html
    
    @staticmethod
    def _format_system_metrics_report_html(report_data):
        """Format system metrics report as HTML."""
        metadata = report_data.get('metadata', {})
        summary = report_data.get('summary', {})
        metrics = report_data.get('metrics', [])
        
        html = """
        <div class="summary">
            <h2>Summary</h2>
            <p>Total Metrics: {}</p>
            
            <h3>Metrics Summary</h3>
            <table>
                <tr>
                    <th>Component</th>
                    <th>Metric</th>
                    <th>Latest</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Avg</th>
                    <th>Unit</th>
                </tr>
        """.format(metadata.get('total_metrics', 0))
        
        # Add metrics summary
        for key, metric_summary in summary.items():
            html += f"""
            <tr>
                <td>{metric_summary.get('component', '')}</td>
                <td>{metric_summary.get('metric_name', '')}</td>
                <td>{metric_summary.get('latest', 0):.2f}</td>
                <td>{metric_summary.get('min', 0):.2f}</td>
                <td>{metric_summary.get('max', 0):.2f}</td>
                <td>{metric_summary.get('avg', 0):.2f}</td>
                <td>{metric_summary.get('unit', '')}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        
        <div class="data">
            <h2>Recent Metrics</h2>
            <table>
                <tr>
                    <th>Component</th>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Category</th>
                    <th>Timestamp</th>
                </tr>
        """
        
        # Add recent metrics (limit to 100 for readability)
        for metric in metrics[:100]:
            html += f"""
            <tr>
                <td>{metric.get('component', '')}</td>
                <td>{metric.get('metric_name', '')}</td>
                <td>{metric.get('metric_value', 0):.2f}</td>
                <td>{metric.get('metric_unit', '')}</td>
                <td>{metric.get('category', '')}</td>
                <td>{metric.get('timestamp', '')}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        """
        
        return html
    
    @staticmethod
    def _format_api_usage_report_html(report_data):
        """Format API usage report as HTML."""
        metadata = report_data.get('metadata', {})
        summary = report_data.get('summary', {})
        daily_stats = report_data.get('daily_stats', {})
        logs = report_data.get('logs', [])
        
        html = """
        <div class="summary">
            <h2>Summary</h2>
            <p>Total Requests: {}</p>
            <p>Average Response Time: {:.3f} seconds</p>
            <p>Error Rate: {:.2f}%</p>
            
            <h3>Status Code Distribution</h3>
            <table>
                <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
        """.format(
            metadata.get('total_requests', 0),
            summary.get('avg_response_time', 0),
            summary.get('error_rate', 0)
        )
        
        # Add status code distribution
        status_counts = summary.get('status_counts', {})
        total_requests = metadata.get('total_requests', 0)
        for status, count in status_counts.items():
            percentage = (count / total_requests * 100) if total_requests > 0 else 0
            html += f"""
            <tr>
                <td>{status}</td>
                <td>{count}</td>
                <td>{percentage:.2f}%</td>
            </tr>
            """
        
        html += """
            </table>
            
            <h3>Top Endpoints</h3>
            <table>
                <tr>
                    <th>Endpoint</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
        """
        
        # Add top endpoints (limit to top 10)
        endpoint_counts = summary.get('endpoint_counts', {})
        sorted_endpoints = sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)
        for endpoint, count in sorted_endpoints[:10]:
            percentage = (count / total_requests * 100) if total_requests > 0 else 0
            html += f"""
            <tr>
                <td>{endpoint}</td>
                <td>{count}</td>
                <td>{percentage:.2f}%</td>
            </tr>
            """
        
        html += """
            </table>
            
            <h3>Daily Statistics</h3>
            <table>
                <tr>
                    <th>Date</th>
                    <th>Requests</th>
                    <th>Avg Response Time</th>
                    <th>Error Count</th>
                    <th>Error Rate</th>
                </tr>
        """
        
        # Add daily statistics
        for day, stats in sorted(daily_stats.items(), reverse=True):
            html += f"""
            <tr>
                <td>{day}</td>
                <td>{stats.get('total_requests', 0)}</td>
                <td>{stats.get('avg_response_time', 0):.3f} s</td>
                <td>{stats.get('error_count', 0)}</td>
                <td>{stats.get('error_rate', 0):.2f}%</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        
        <div class="data">
            <h2>Recent Requests</h2>
            <table>
                <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Timestamp</th>
                </tr>
        """
        
        # Add recent logs (limit to 100 for readability)
        for log in logs[:100]:
            status_class = ''
            status_code = log.get('status_code', 0)
            if status_code >= 500:
                status_class = 'error'
            elif status_code >= 400:
                status_class = 'warning'
            elif status_code >= 300:
                status_class = 'info'
            elif status_code >= 200:
                status_class = 'success'
                
            html += f"""
            <tr>
                <td>{log.get('endpoint', '')}</td>
                <td>{log.get('method', '')}</td>
                <td class="{status_class}">{log.get('status_code', '')}</td>
                <td>{log.get('response_time', 0):.3f} s</td>
                <td>{log.get('timestamp', '')}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        """
        
        return html
    
    @staticmethod
    def _format_ai_performance_report_html(report_data):
        """Format AI performance report as HTML."""
        metadata = report_data.get('metadata', {})
        summary = report_data.get('summary', {})
        metrics = report_data.get('metrics', [])
        
        html = """
        <div class="summary">
            <h2>Summary</h2>
            <p>Total Agents: {}</p>
            <p>Total Requests: {}</p>
            <p>Overall Average Rating: {:.2f}/5.0</p>
            <p>Total Tokens Used: {}</p>
            
            <h3>Agent Performance</h3>
            <table>
                <tr>
                    <th>Agent</th>
                    <th>Requests</th>
                    <th>Errors</th>
                    <th>Error Rate</th>
                    <th>Avg Response Time</th>
                    <th>Avg Rating</th>
                    <th>Tokens Used</th>
                </tr>
        """.format(
            metadata.get('total_agents', 0),
            summary.get('total_requests', 0),
            summary.get('overall_avg_rating', 0),
            summary.get('total_tokens', 0)
        )
        
        # Add agent performance
        agent_summary = summary.get('agent_summary', {})
        for agent, stats in agent_summary.items():
            html += f"""
            <tr>
                <td>{agent}</td>
                <td>{stats.get('total_requests', 0)}</td>
                <td>{stats.get('error_count', 0)}</td>
                <td>{stats.get('error_rate', 0):.2f}%</td>
                <td>{stats.get('avg_response_time', 0):.3f} s</td>
                <td>{stats.get('avg_rating', 0):.2f}/5.0</td>
                <td>{stats.get('total_tokens', 0)}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        
        <div class="data">
            <h2>Daily Metrics</h2>
            <table>
                <tr>
                    <th>Date</th>
                    <th>Agent</th>
                    <th>Requests</th>
                    <th>Errors</th>
                    <th>Avg Response Time</th>
                    <th>Avg Rating</th>
                    <th>Tokens</th>
                </tr>
        """
        
        # Add daily metrics sorted by date and then agent
        sorted_metrics = sorted(metrics, key=lambda x: (x.get('date', ''), x.get('agent_type', '')), reverse=True)
        for metric in sorted_metrics:
            html += f"""
            <tr>
                <td>{metric.get('date', '')}</td>
                <td>{metric.get('agent_type', '')}</td>
                <td>{metric.get('request_count', 0)}</td>
                <td>{metric.get('error_count', 0)}</td>
                <td>{metric.get('average_response_time', 0):.3f} s</td>
                <td>{metric.get('average_rating', 0):.2f}/5.0</td>
                <td>{metric.get('token_usage', 0)}</td>
            </tr>
            """
        
        html += """
            </table>
        </div>
        """
        
        return html
    
    @staticmethod
    def format_report_as_csv(report_data):
        """
        Format a report as CSV.
        
        Args:
            report_data (dict): The report data
            
        Returns:
            str: CSV content
        """
        try:
            report_type = report_data.get('metadata', {}).get('report_type', 'unknown')
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Write header with metadata
            writer.writerow(['# Report Type', report_type])
            writer.writerow(['# Generated At', report_data.get('metadata', {}).get('generated_at', '')])
            writer.writerow(['# Total Items', report_data.get('metadata', {}).get('total_alerts' if report_type == 'alerts' else 'total_metrics' if report_type == 'system_metrics' else 'total_requests' if report_type == 'api_usage' else 'total_agents', 0)])
            writer.writerow([])  # Empty row for separation
            
            # Add report-specific content based on type
            if report_type == 'alerts':
                # Write alerts data
                alerts = report_data.get('alerts', [])
                if alerts:
                    # Write header
                    writer.writerow(['ID', 'Severity', 'Type', 'Component', 'Message', 'Status', 'Created At', 'Acknowledged At', 'Resolved At'])
                    
                    # Write data
                    for alert in alerts:
                        writer.writerow([
                            alert.get('id', ''),
                            alert.get('severity', ''),
                            alert.get('alert_type', ''),
                            alert.get('component', ''),
                            alert.get('message', ''),
                            alert.get('status', ''),
                            alert.get('created_at', ''),
                            alert.get('acknowledged_at', ''),
                            alert.get('resolved_at', '')
                        ])
            
            elif report_type == 'system_metrics':
                # Write system metrics data
                metrics = report_data.get('metrics', [])
                if metrics:
                    # Write header
                    writer.writerow(['ID', 'Component', 'Metric Name', 'Value', 'Unit', 'Category', 'Timestamp'])
                    
                    # Write data
                    for metric in metrics:
                        writer.writerow([
                            metric.get('id', ''),
                            metric.get('component', ''),
                            metric.get('metric_name', ''),
                            metric.get('metric_value', ''),
                            metric.get('metric_unit', ''),
                            metric.get('category', ''),
                            metric.get('timestamp', '')
                        ])
            
            elif report_type == 'api_usage':
                # Write API usage data
                logs = report_data.get('logs', [])
                if logs:
                    # Write header
                    writer.writerow(['ID', 'Endpoint', 'Method', 'Status Code', 'Response Time', 'Timestamp'])
                    
                    # Write data
                    for log in logs:
                        writer.writerow([
                            log.get('id', ''),
                            log.get('endpoint', ''),
                            log.get('method', ''),
                            log.get('status_code', ''),
                            log.get('response_time', ''),
                            log.get('timestamp', '')
                        ])
            
            elif report_type == 'ai_performance':
                # Write AI performance data
                metrics = report_data.get('metrics', [])
                if metrics:
                    # Write header
                    writer.writerow(['ID', 'Agent Type', 'Date', 'Requests', 'Errors', 'Avg Response Time', 'Avg Rating', 'Tokens'])
                    
                    # Write data
                    for metric in metrics:
                        writer.writerow([
                            metric.get('id', ''),
                            metric.get('agent_type', ''),
                            metric.get('date', ''),
                            metric.get('request_count', ''),
                            metric.get('error_count', ''),
                            metric.get('average_response_time', ''),
                            metric.get('average_rating', ''),
                            metric.get('token_usage', '')
                        ])
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error formatting report as CSV: {str(e)}")
            
            # Return error as CSV
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Error', str(e)])
            return output.getvalue()
    
    @staticmethod
    def format_report_as_excel(report_data):
        """
        Format a report as Excel.
        
        Args:
            report_data (dict): The report data
            
        Returns:
            bytes: Excel file content
        """
        try:
            report_type = report_data.get('metadata', {}).get('report_type', 'unknown')
            
            # Create temporary file for Excel
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
                writer = pd.ExcelWriter(tmp.name, engine='xlsxwriter')
                
                # Create metadata sheet
                metadata_df = pd.DataFrame({
                    'Key': ['Report Type', 'Generated At', 'Period (Days)'],
                    'Value': [
                        report_type,
                        report_data.get('metadata', {}).get('generated_at', ''),
                        report_data.get('metadata', {}).get('period_days', '')
                    ]
                })
                metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
                
                # Add report-specific content based on type
                if report_type == 'alerts':
                    # Create summary sheet
                    summary = report_data.get('summary', {})
                    
                    # Severity counts
                    severity_df = pd.DataFrame({
                        'Severity': list(summary.get('severity_counts', {}).keys()),
                        'Count': list(summary.get('severity_counts', {}).values())
                    })
                    severity_df.to_excel(writer, sheet_name='Severity Summary', index=False)
                    
                    # Status counts
                    status_df = pd.DataFrame({
                        'Status': list(summary.get('status_counts', {}).keys()),
                        'Count': list(summary.get('status_counts', {}).values())
                    })
                    status_df.to_excel(writer, sheet_name='Status Summary', index=False)
                    
                    # Component counts
                    component_df = pd.DataFrame({
                        'Component': list(summary.get('component_counts', {}).keys()),
                        'Count': list(summary.get('component_counts', {}).values())
                    })
                    component_df.to_excel(writer, sheet_name='Component Summary', index=False)
                    
                    # Create alerts sheet
                    alerts = report_data.get('alerts', [])
                    if alerts:
                        alerts_df = pd.DataFrame(alerts)
                        alerts_df.to_excel(writer, sheet_name='Alerts', index=False)
                
                elif report_type == 'system_metrics':
                    # Create summary sheet
                    summary = report_data.get('summary', {})
                    summary_list = []
                    
                    for key, metric_summary in summary.items():
                        summary_list.append({
                            'Component': metric_summary.get('component', ''),
                            'Metric': metric_summary.get('metric_name', ''),
                            'Latest': metric_summary.get('latest', 0),
                            'Min': metric_summary.get('min', 0),
                            'Max': metric_summary.get('max', 0),
                            'Avg': metric_summary.get('avg', 0),
                            'Unit': metric_summary.get('unit', '')
                        })
                    
                    if summary_list:
                        summary_df = pd.DataFrame(summary_list)
                        summary_df.to_excel(writer, sheet_name='Metrics Summary', index=False)
                    
                    # Create metrics sheet
                    metrics = report_data.get('metrics', [])
                    if metrics:
                        metrics_df = pd.DataFrame(metrics)
                        metrics_df.to_excel(writer, sheet_name='Metrics', index=False)
                
                elif report_type == 'api_usage':
                    # Create summary sheet
                    summary = report_data.get('summary', {})
                    
                    # Status counts
                    status_counts = summary.get('status_counts', {})
                    status_df = pd.DataFrame({
                        'Status': list(status_counts.keys()),
                        'Count': list(status_counts.values())
                    })
                    status_df.to_excel(writer, sheet_name='Status Summary', index=False)
                    
                    # Endpoint counts
                    endpoint_counts = summary.get('endpoint_counts', {})
                    sorted_endpoints = sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)
                    endpoints = [e[0] for e in sorted_endpoints]
                    counts = [e[1] for e in sorted_endpoints]
                    
                    endpoint_df = pd.DataFrame({
                        'Endpoint': endpoints,
                        'Count': counts
                    })
                    endpoint_df.to_excel(writer, sheet_name='Endpoint Summary', index=False)
                    
                    # Daily stats
                    daily_stats = report_data.get('daily_stats', {})
                    daily_list = []
                    
                    for day, stats in daily_stats.items():
                        daily_list.append({
                            'Date': day,
                            'Requests': stats.get('total_requests', 0),
                            'Avg Response Time': stats.get('avg_response_time', 0),
                            'Error Count': stats.get('error_count', 0),
                            'Error Rate': stats.get('error_rate', 0)
                        })
                    
                    if daily_list:
                        daily_df = pd.DataFrame(daily_list)
                        daily_df.to_excel(writer, sheet_name='Daily Stats', index=False)
                    
                    # Create logs sheet
                    logs = report_data.get('logs', [])
                    if logs:
                        logs_df = pd.DataFrame(logs)
                        logs_df.to_excel(writer, sheet_name='API Logs', index=False)
                
                elif report_type == 'ai_performance':
                    # Create summary sheet
                    summary = report_data.get('summary', {})
                    
                    # Agent summary
                    agent_summary = summary.get('agent_summary', {})
                    agent_list = []
                    
                    for agent, stats in agent_summary.items():
                        agent_list.append({
                            'Agent': agent,
                            'Requests': stats.get('total_requests', 0),
                            'Errors': stats.get('error_count', 0),
                            'Error Rate': stats.get('error_rate', 0),
                            'Avg Response Time': stats.get('avg_response_time', 0),
                            'Avg Rating': stats.get('avg_rating', 0),
                            'Tokens': stats.get('total_tokens', 0)
                        })
                    
                    if agent_list:
                        agent_df = pd.DataFrame(agent_list)
                        agent_df.to_excel(writer, sheet_name='Agent Summary', index=False)
                    
                    # Create metrics sheet
                    metrics = report_data.get('metrics', [])
                    if metrics:
                        metrics_df = pd.DataFrame(metrics)
                        metrics_df.to_excel(writer, sheet_name='Daily Metrics', index=False)
                
                # Save Excel file
                writer.close()
                
                # Read file contents
                with open(tmp.name, 'rb') as f:
                    data = f.read()
                
                # Delete temporary file
                os.unlink(tmp.name)
                
                return data
                
        except Exception as e:
            logger.error(f"Error formatting report as Excel: {str(e)}")
            
            # Create a simple error Excel file
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
                writer = pd.ExcelWriter(tmp.name, engine='xlsxwriter')
                error_df = pd.DataFrame({
                    'Error': [str(e)]
                })
                error_df.to_excel(writer, sheet_name='Error', index=False)
                writer.close()
                
                # Read file contents
                with open(tmp.name, 'rb') as f:
                    data = f.read()
                
                # Delete temporary file
                os.unlink(tmp.name)
                
                return data
    
    @staticmethod
    def send_report_email(subject, html_content, recipients, attachments=None):
        """
        Send a report email.
        
        Args:
            subject (str): Email subject
            html_content (str): HTML content of the email
            recipients (list): List of email addresses
            attachments (dict, optional): Dictionary of attachments with filename and content
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Use SendGrid API if available
            sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
            if sendgrid_api_key:
                notification_service = NotificationService()
                for recipient in recipients:
                    success = notification_service.send_email_notification(
                        subject=subject,
                        message=html_content,
                        recipients=[recipient],
                        severity='info',
                        attachments=attachments
                    )
                    
                    if not success:
                        logger.error(f"Failed to send report email to {recipient} using SendGrid")
                
                return True
            
            # Fall back to SMTP
            smtp_host = os.environ.get('SMTP_HOST')
            smtp_port = os.environ.get('SMTP_PORT')
            smtp_username = os.environ.get('SMTP_USERNAME')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            smtp_from_email = os.environ.get('SMTP_FROM_EMAIL')
            
            if not (smtp_host and smtp_port and smtp_username and smtp_password and smtp_from_email):
                logger.error("SMTP configuration incomplete. Cannot send report email.")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_from_email
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Attach attachments
            if attachments:
                for filename, content in attachments.items():
                    attachment = MIMEApplication(content)
                    attachment['Content-Disposition'] = f'attachment; filename="{filename}"'
                    msg.attach(attachment)
            
            # Connect to SMTP server and send
            smtp = smtplib.SMTP(smtp_host, int(smtp_port))
            smtp.starttls()
            smtp.login(smtp_username, smtp_password)
            
            for recipient in recipients:
                msg['To'] = recipient
                try:
                    smtp.sendmail(smtp_from_email, recipient, msg.as_string())
                    logger.info(f"Sent report email to {recipient}")
                except Exception as e:
                    logger.error(f"Error sending report email to {recipient}: {str(e)}")
                    
            smtp.quit()
            return True
            
        except Exception as e:
            logger.error(f"Error sending report email: {str(e)}")
            return False
    
    @staticmethod
    def process_scheduled_report(report_id):
        """
        Process a scheduled report.
        
        Args:
            report_id (int): ID of the report to process
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get report configuration
            report = ScheduledReport.query.get(report_id)
            if not report:
                logger.error(f"Report with ID {report_id} not found")
                return False
            
            if not report.is_active:
                logger.info(f"Report {report.name} (ID: {report_id}) is not active, skipping")
                return False
            
            # Parse recipients
            recipients = json.loads(report.recipients) if report.recipients else []
            if not recipients:
                logger.error(f"No recipients specified for report {report.name} (ID: {report_id})")
                return False
            
            # Generate report data
            logger.info(f"Generating report {report.name} (ID: {report_id})")
            report_data = ReportGenerator.generate_report_from_config(report)
            
            # Format report as HTML
            html_content = ReportGenerator.format_report_as_html(report_data)
            
            # Prepare attachments
            attachments = {}
            
            if report.format in ['all', 'csv']:
                csv_content = ReportGenerator.format_report_as_csv(report_data)
                attachments[f"{report.name}_{datetime.now().strftime('%Y%m%d')}.csv"] = csv_content.encode('utf-8')
            
            if report.format in ['all', 'excel']:
                excel_content = ReportGenerator.format_report_as_excel(report_data)
                attachments[f"{report.name}_{datetime.now().strftime('%Y%m%d')}.xlsx"] = excel_content
            
            # Send email
            subject = f"{report.report_type.title()} Report: {report.name}"
            result = ReportGenerator.send_report_email(subject, html_content, recipients, attachments)
            
            if result:
                logger.info(f"Successfully sent report {report.name} (ID: {report_id}) to {len(recipients)} recipients")
            else:
                logger.error(f"Failed to send report {report.name} (ID: {report_id})")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing scheduled report {report_id}: {str(e)}")
            return False
    
    @staticmethod
    def process_alert_notification_emails(alert):
        """
        Process email notifications for a new alert.
        
        Args:
            alert (MonitoringAlert): The alert to notify about
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Find email notification channels for this alert
            email_channels = (
                db.session.query(NotificationChannel)
                .join(
                    AlertNotificationMap, 
                    NotificationChannel.id == AlertNotificationMap.channel_id
                )
                .filter(
                    NotificationChannel.channel_type == 'email',
                    NotificationChannel.is_active == True,
                    AlertNotificationMap.is_active == True,
                    AlertNotificationMap.min_severity <= alert.severity
                )
                .filter(
                    (AlertNotificationMap.alert_type == '*') | 
                    (AlertNotificationMap.alert_type == alert.alert_type)
                )
                .all()
            )
            
            if not email_channels:
                logger.debug(f"No email notification channels found for alert {alert.id}")
                return False
            
            # Generate HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Alert Notification</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1, h2, h3 {{ color: #333; }}
                    .alert-header {{ padding: 15px; margin-bottom: 20px; border-radius: 5px; }}
                    .critical {{ background-color: #f8d7da; color: #721c24; }}
                    .error {{ background-color: #f8d7da; color: #721c24; }}
                    .warning {{ background-color: #fff3cd; color: #856404; }}
                    .info {{ background-color: #d1ecf1; color: #0c5460; }}
                    .details {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }}
                    table {{ border-collapse: collapse; width: 100%; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                </style>
            </head>
            <body>
                <div class="alert-header {alert.severity.lower()}">
                    <h1>{alert.severity.upper()} Alert: {alert.message}</h1>
                </div>
                
                <table>
                    <tr>
                        <th>Alert ID</th>
                        <td>{alert.id}</td>
                    </tr>
                    <tr>
                        <th>Type</th>
                        <td>{alert.alert_type}</td>
                    </tr>
                    <tr>
                        <th>Component</th>
                        <td>{alert.component}</td>
                    </tr>
                    <tr>
                        <th>Time</th>
                        <td>{alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td>{alert.status.capitalize()}</td>
                    </tr>
                </table>
            """
            
            if alert.details:
                html_content += f"""
                <div class="details">
                    <h2>Details</h2>
                    <pre>{alert.details}</pre>
                </div>
                """
            
            html_content += """
            </body>
            </html>
            """
            
            # Send emails to each channel
            for channel in email_channels:
                try:
                    # Parse channel config
                    config = json.loads(channel.config)
                    recipients = config.get('recipients', [])
                    
                    if not recipients:
                        logger.warning(f"No recipients configured for email channel {channel.id}")
                        continue
                    
                    # Send email
                    subject = f"[{alert.severity.upper()}] Alert: {alert.message}"
                    notification_service = NotificationService()
                    success = notification_service.send_email_notification(
                        subject=subject,
                        message=html_content,
                        recipients=recipients,
                        severity=alert.severity
                    )
                    
                    if success:
                        logger.info(f"Sent email notification for alert {alert.id} to channel {channel.id}")
                    else:
                        logger.error(f"Failed to send email notification for alert {alert.id} to channel {channel.id}")
                        
                except Exception as e:
                    logger.error(f"Error sending email notification for channel {channel.id}: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing alert notification emails: {str(e)}")
            return False