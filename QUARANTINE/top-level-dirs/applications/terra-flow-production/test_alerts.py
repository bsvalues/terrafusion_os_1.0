"""
Run data quality alert tests
"""
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

try:
    from app import app
    from sync_service.test_data_quality_alerts import (
        trigger_quality_score_alert, 
        create_data_anomalies, 
        check_for_notifications,
        send_manual_alert,
        clear_test_data
    )
    
    # Clear previous test data
    clear_test_data()
    
    # Trigger quality score alert
    print("==== Testing Quality Score Alert ====")
    report_id = trigger_quality_score_alert()
    print(f"Created report with ID: {report_id}")
    
    # Create anomalies to trigger anomaly alert
    print("\n==== Testing Anomaly Alerts ====")
    anomaly_ids = create_data_anomalies(3)
    print(f"Created anomalies with IDs: {anomaly_ids}")
    
    # Send a manual alert
    print("\n==== Testing Manual Alert ====")
    send_manual_alert()
    
    # Check for notifications
    print("\n==== Checking Notifications ====")
    notifications = check_for_notifications()
    if notifications:
        print(f"Found {len(notifications)} notifications:")
        for n in notifications:
            print(f" - [{n['severity']}] {n['title']} ({n['created_at']})")
    else:
        print("No notifications found")
    
    print("\nTest completed successfully!")
    
except Exception as e:
    print(f"Error running tests: {str(e)}", file=sys.stderr)
    import traceback
    traceback.print_exc()