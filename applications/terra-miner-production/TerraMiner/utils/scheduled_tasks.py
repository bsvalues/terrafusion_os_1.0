"""
Scheduled task management for system monitoring, alerts, and reports.
"""
import logging
import threading
import time
from datetime import datetime, timedelta
import schedule

from app import app, db
from models import (
    SystemMetric, ModelsScheduledReport, AIFeedbackReportSettings
)
from utils.monitoring_tasks import collect_system_metrics, check_system_health
from utils.report_generator import ReportGenerator

# Set up logger
logger = logging.getLogger(__name__)

# Global variables
scheduler_thread = None
stop_event = threading.Event()
is_scheduler_running = False

def initialize_schedules():
    """
    Initialize all scheduled tasks.
    """
    logger.info("Initializing scheduled tasks")
    
    # Clear existing schedules
    schedule.clear()
    
    # Schedule system metrics collection every 5 minutes
    schedule.every(5).minutes.do(run_with_app_context, collect_system_metrics)
    logger.info("Scheduled system metrics collection every 5 minutes")
    
    # Schedule system health check every 10 minutes
    schedule.every(10).minutes.do(run_with_app_context, check_system_health)
    logger.info("Scheduled system health check every 10 minutes")
    
    # Schedule report delivery based on settings
    schedule_reports()
    
    # Schedule AI feedback reports based on settings
    initialize_ai_feedback_schedules()

def schedule_reports():
    """
    Schedule report delivery based on database settings.
    """
    try:
        with app.app_context():
            # Get all active scheduled reports
            reports = ModelsScheduledReport.query.filter_by(is_active=True).all()
            
            for report in reports:
                try:
                    # Parse schedule settings
                    if report.schedule_type == 'daily':
                        # Schedule daily report
                        schedule.every().day.at("06:00").do(
                            run_with_app_context, 
                            ReportGenerator.process_scheduled_report, 
                            report.id
                        )
                        logger.info(f"Scheduled daily report {report.name} (ID: {report.id}) at 06:00")
                        
                    elif report.schedule_type == 'weekly':
                        # Schedule weekly report on Monday at 06:00
                        schedule.every().monday.at("06:00").do(
                            run_with_app_context, 
                            ReportGenerator.process_scheduled_report, 
                            report.id
                        )
                        logger.info(f"Scheduled weekly report {report.name} (ID: {report.id}) on Monday at 06:00")
                        
                    elif report.schedule_type == 'monthly':
                        # Schedule monthly report on the 1st at 06:00
                        # Note: This is an approximation since schedule doesn't support exact day-of-month scheduling
                        def run_on_first_day():
                            if datetime.now().day == 1:
                                return run_with_app_context(ReportGenerator.process_scheduled_report, report.id)
                            return None
                            
                        schedule.every().day.at("06:00").do(run_on_first_day)
                        logger.info(f"Scheduled monthly report {report.name} (ID: {report.id}) on 1st day at 06:00")
                        
                    elif report.schedule_type == 'custom':
                        # Parse cron expression (simplified)
                        cron = report.cron_expression
                        if cron and cron.strip():
                            parts = cron.split()
                            if len(parts) >= 5:
                                minute, hour, day, month, weekday = parts[:5]
                                
                                # Very simple cron parsing (only exact values, no ranges/lists/steps)
                                if minute.isdigit() and hour.isdigit():
                                    time_str = f"{hour.zfill(2)}:{minute.zfill(2)}"
                                    
                                    if weekday == "*" and day == "*" and month == "*":
                                        # Every day
                                        schedule.every().day.at(time_str).do(
                                            run_with_app_context, 
                                            ReportGenerator.process_scheduled_report, 
                                            report.id
                                        )
                                        logger.info(f"Scheduled custom report {report.name} (ID: {report.id}) at {time_str}")
                        
                except Exception as e:
                    logger.error(f"Error scheduling report {report.name} (ID: {report.id}): {str(e)}")
                    
    except Exception as e:
        logger.error(f"Error scheduling reports: {str(e)}")

def initialize_ai_feedback_schedules():
    """
    Initialize AI feedback report schedules based on settings.
    """
    try:
        with app.app_context():
            # Get AI feedback report settings
            settings = AIFeedbackReportSettings.get_settings()
            
            if not settings.admin_email:
                logger.warning("No admin email set for AI feedback reports")
                return
                
            initialize_default_schedules(settings.admin_email)
                
    except Exception as e:
        logger.error(f"Error initializing AI feedback schedules: {str(e)}")

def initialize_default_schedules(admin_email):
    """
    Initialize default schedules for AI feedback reports.
    
    Args:
        admin_email (str): Admin email address for reports
    """
    try:
        with app.app_context():
            # Get AI feedback report settings
            settings = AIFeedbackReportSettings.get_settings()
            
            # Parse additional recipients
            recipients = [admin_email]
            if settings.additional_recipients:
                try:
                    import json
                    additional = json.loads(settings.additional_recipients)
                    if isinstance(additional, list):
                        recipients.extend(additional)
                except:
                    pass
            
            # Clear existing AI feedback schedules
            schedule.clear('ai_feedback')
            
            # Schedule daily reports if enabled
            if settings.send_daily_reports:
                schedule.every().day.at("07:00").tag('ai_feedback').do(
                    run_with_app_context,
                    send_ai_feedback_report,
                    'daily',
                    recipients
                )
                logger.info(f"Scheduled daily AI feedback report at 07:00 for {admin_email}")
            
            # Schedule weekly reports if enabled
            if settings.send_weekly_reports:
                # Map weekday number to schedule function (0=Monday, 6=Sunday)
                weekdays = [
                    schedule.every().monday,
                    schedule.every().tuesday,
                    schedule.every().wednesday,
                    schedule.every().thursday,
                    schedule.every().friday,
                    schedule.every().saturday,
                    schedule.every().sunday
                ]
                
                day_idx = min(max(settings.weekly_report_day, 0), 6)
                weekdays[day_idx].at("07:00").tag('ai_feedback').do(
                    run_with_app_context,
                    send_ai_feedback_report,
                    'weekly',
                    recipients
                )
                
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_idx]
                logger.info(f"Scheduled weekly AI feedback report on {day_name} at 07:00 for {admin_email}")
            
            # Schedule monthly reports if enabled
            if settings.send_monthly_reports:
                # Schedule monthly report on the specified day at 07:00
                # Note: This is an approximation since schedule doesn't support exact day-of-month scheduling
                day = min(max(settings.monthly_report_day, 1), 31)
                
                def run_on_specified_day():
                    if datetime.now().day == day:
                        return run_with_app_context(send_ai_feedback_report, 'monthly', recipients)
                    return None
                    
                schedule.every().day.at("07:00").tag('ai_feedback').do(run_on_specified_day)
                logger.info(f"Scheduled monthly AI feedback report on day {day} at 07:00 for {admin_email}")
                
    except Exception as e:
        logger.error(f"Error initializing default schedules: {str(e)}")

def send_ai_feedback_report(report_type, recipients):
    """
    Send an AI feedback report.
    
    Args:
        report_type (str): Type of report ('daily', 'weekly', 'monthly')
        recipients (list): List of email addresses
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Determine date range based on report type
        now = datetime.now()
        if report_type == 'daily':
            start_date = now - timedelta(days=1)
            period_str = f"for {start_date.strftime('%Y-%m-%d')}"
        elif report_type == 'weekly':
            start_date = now - timedelta(days=7)
            period_str = f"for {start_date.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}"
        elif report_type == 'monthly':
            start_date = now - timedelta(days=30)
            period_str = f"for {start_date.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}"
        else:
            return False
        
        # Generate AI performance report
        days = 1 if report_type == 'daily' else 7 if report_type == 'weekly' else 30
        report_data = ReportGenerator.generate_ai_performance_report(days)
        
        # Format report as HTML
        html_content = ReportGenerator.format_report_as_html(report_data)
        
        # Get report settings
        settings = AIFeedbackReportSettings.get_settings()
        
        # Prepare attachments
        attachments = {}
        
        if settings.include_csv_attachment:
            csv_content = ReportGenerator.format_report_as_csv(report_data)
            attachments[f"ai_performance_{report_type}_{now.strftime('%Y%m%d')}.csv"] = csv_content.encode('utf-8')
        
        if settings.include_excel_attachment:
            excel_content = ReportGenerator.format_report_as_excel(report_data)
            attachments[f"ai_performance_{report_type}_{now.strftime('%Y%m%d')}.xlsx"] = excel_content
        
        # Send email
        subject = f"AI Performance {report_type.title()} Report {period_str}"
        result = ReportGenerator.send_report_email(subject, html_content, recipients, attachments)
        
        if result:
            logger.info(f"Successfully sent AI {report_type} report to {len(recipients)} recipients")
        else:
            logger.error(f"Failed to send AI {report_type} report")
        
        return result
        
    except Exception as e:
        logger.error(f"Error sending AI feedback report: {str(e)}")
        return False

def run_with_app_context(func, *args, **kwargs):
    """
    Run a function within the Flask app context.
    
    Args:
        func: Function to run
        *args: Arguments to pass to the function
        **kwargs: Keyword arguments to pass to the function
        
    Returns:
        The return value of the function
    """
    with app.app_context():
        return func(*args, **kwargs)

def scheduler_worker():
    """
    Worker function for scheduler thread.
    """
    logger.info("Starting scheduler worker")
    
    # Initialize schedules
    with app.app_context():
        initialize_schedules()
    
    # Main loop
    while not stop_event.is_set():
        schedule.run_pending()
        time.sleep(1)
    
    logger.info("Scheduler worker stopped")

def start_scheduler():
    """
    Start the scheduler thread.
    
    Returns:
        bool: True if started successfully, False otherwise
    """
    global scheduler_thread, stop_event, is_scheduler_running
    
    if scheduler_thread and scheduler_thread.is_alive():
        logger.warning("Scheduler thread already running")
        return False
    
    stop_event.clear()
    scheduler_thread = threading.Thread(target=scheduler_worker)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    is_scheduler_running = True
    logger.info("Scheduler started")
    return True

def stop_scheduler():
    """
    Stop the scheduler thread.
    
    Returns:
        bool: True if stopped successfully, False otherwise
    """
    global scheduler_thread, stop_event, is_scheduler_running
    
    if not scheduler_thread or not scheduler_thread.is_alive():
        logger.warning("Scheduler thread not running")
        return False
    
    stop_event.set()
    scheduler_thread.join(timeout=10)
    scheduler_thread = None
    
    is_scheduler_running = False
    logger.info("Scheduler stopped")
    return True

def check_scheduler_status():
    """
    Check if the scheduler is running.
    
    Returns:
        bool: True if running, False otherwise
    """
    global is_scheduler_running, scheduler_thread
    
    # Update status if thread has died
    if is_scheduler_running and (not scheduler_thread or not scheduler_thread.is_alive()):
        is_scheduler_running = False
    
    return is_scheduler_running