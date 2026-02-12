"""
Test script to run the data quality alerts test
"""

import logging
from app import app
from sync_service.test_data_quality_alerts import (
    trigger_quality_score_alert,
    create_data_anomalies,
    check_for_notifications,
    send_manual_alert,
    clear_test_data
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_test():
    """Run the data quality alerts test"""
    with app.app_context():
        # Clear any existing test data
        clear_test_data()
        logger.info("Cleared existing test data")
        
        # Trigger a quality score alert
        report_id = trigger_quality_score_alert()
        logger.info(f"Triggered quality score alert with report ID: {report_id}")
        
        # Create some anomalies
        anomaly_ids = create_data_anomalies(5)
        logger.info(f"Created {len(anomaly_ids)} data anomalies")
        
        # Send a manual alert
        send_manual_alert()
        logger.info("Sent manual alert")
        
        # Check for notifications
        notifications = check_for_notifications()
        logger.info(f"Found {len(notifications)} notifications:")
        for n in notifications:
            logger.info(f"- {n['title']} ({n['severity']}) at {n['created_at']}")
        
        logger.info("Test completed successfully")
        return notifications

if __name__ == "__main__":
    run_test()