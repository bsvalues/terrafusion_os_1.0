"""
Test script for data quality alerts.

This script simulates different data quality scenarios to trigger alerts
for testing purposes.
"""

import logging
import json
import random
import datetime
from sqlalchemy import and_, func, desc

from app import app, db
from sync_service.models.data_quality import (
    DataQualityReport, DataQualityIssue, DataAnomaly, 
    DataQualityAlert, DataQualityNotification
)
from sync_service.data_quality_notifications import check_data_quality_alerts, send_data_quality_alert

# Set up logging
logger = logging.getLogger(__name__)

def trigger_quality_score_alert():
    """
    Trigger a quality score alert by creating a report with a low score.
    """
    with app.app_context():
        # Create a low quality score report
        report = DataQualityReport(
            report_name='Weekly Quality Report',
            tables_checked=['parcels', 'property_values', 'improvements'],
            overall_score=75.0,  # This is below our 85% threshold
            report_data={
                'overall_score': 75,  # This is below our 85% threshold
                'completeness_score': 70,
                'accuracy_score': 78,
                'consistency_score': 82,
                'tables_checked': 25,
                'fields_checked': 342,
                'records_checked': 15240
            },
            critical_issues=0,
            high_issues=2,
            medium_issues=5,
            low_issues=12
        )
        
        db.session.add(report)
        db.session.commit()
        
        logger.info(f"Created data quality report with low score: {report.id}")
        
        # Manually run alert checks
        check_data_quality_alerts()
        
        return report.id

def create_data_anomalies(count=5):
    """
    Create data anomalies to trigger anomaly alerts.
    
    Args:
        count: Number of anomalies to create
    """
    with app.app_context():
        created_anomalies = []
        
        for i in range(count):
            # Create a data anomaly
            anomaly = DataAnomaly(
                table_name='parcels',
                field_name=f'field_{random.randint(1, 5)}',
                record_id=f'record_{random.randint(100, 999)}',
                anomaly_type='value_change' if i % 2 == 0 else 'outlier',
                severity='error',
                status='open',
                current_value=str(random.randint(1000, 5000)),
                previous_value=str(random.randint(1000, 5000)),
                anomaly_score=random.uniform(0.5, 0.95),
                anomaly_details={
                    'detection_method': 'z_score' if i % 3 == 0 else 'histogram',
                    'threshold': random.uniform(2.0, 4.0),
                    'expected_range': [1000, 3000]
                }
            )
            
            db.session.add(anomaly)
            created_anomalies.append(anomaly)
        
        db.session.commit()
        
        anomaly_ids = [a.id for a in created_anomalies]
        logger.info(f"Created {count} data anomalies with IDs: {anomaly_ids}")
        
        # Manually run alert checks
        check_data_quality_alerts()
        
        return anomaly_ids

def clear_test_data():
    """
    Clear test data created for alert testing.
    """
    with app.app_context():
        # Delete notifications
        notification_count = DataQualityNotification.query.delete()
        
        # Get created reports and anomalies in the last hour
        one_hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        
        # Delete reports
        report_count = DataQualityReport.query.filter(
            DataQualityReport.created_at >= one_hour_ago
        ).delete()
        
        # Delete anomalies
        anomaly_count = DataAnomaly.query.filter(
            DataAnomaly.detected_at >= one_hour_ago
        ).delete()
        
        db.session.commit()
        
        logger.info(f"Cleared test data: {notification_count} notifications, "
                   f"{report_count} reports, {anomaly_count} anomalies")

def check_for_notifications():
    """
    Check for notifications created by the alerts.
    """
    with app.app_context():
        notifications = DataQualityNotification.query.order_by(
            DataQualityNotification.created_at.desc()
        ).limit(10).all()
        
        if not notifications:
            logger.info("No notifications found")
            return []
        
        notification_info = []
        for notification in notifications:
            info = {
                'id': notification.id,
                'title': notification.title,
                'severity': notification.severity,
                'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            notification_info.append(info)
            logger.info(f"Notification: {notification.title} ({notification.severity}) "
                       f"created at {notification.created_at}")
        
        return notification_info

def send_manual_alert():
    """
    Send a manual data quality alert.
    """
    with app.app_context():
        alert_id = 1  # Using our first alert
        
        result = send_data_quality_alert(
            alert_id=alert_id,
            title="Manual Test Alert",
            message="This is a manual test alert from the data quality system.",
            severity="warning"
        )
        
        if result:
            logger.info(f"Successfully sent manual alert for alert_id={alert_id}")
        else:
            logger.error(f"Failed to send manual alert for alert_id={alert_id}")
        
        return result

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Clear previous test data
    clear_test_data()
    
    # Trigger quality score alert
    report_id = trigger_quality_score_alert()
    
    # Create anomalies to trigger anomaly alert
    anomaly_ids = create_data_anomalies(5)
    
    # Send a manual alert
    send_manual_alert()
    
    # Check for notifications
    notifications = check_for_notifications()
    
    logger.info("Test complete!")