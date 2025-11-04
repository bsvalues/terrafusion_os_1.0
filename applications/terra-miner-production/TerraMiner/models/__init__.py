# Import models from specific modules
from models.zillow_data import ZillowMarketData, ZillowPriceTrend, ZillowProperty
from models.narrpr_data import NarrprReport, NarrprProperty, NarrprComparableProperty, NarrprMarketActivity
from models.api_keys import APIKey
from models.schedule import ETLSchedule

# Import the db instance from our centralized db_utils module
from db_utils import db
from datetime import datetime
from datetime import date

class SystemMetric(db.Model):
    """Model for storing system performance metrics."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)  # Name of the metric
    metric_value = db.Column(db.Float, nullable=False)  # Numerical value
    metric_unit = db.Column(db.String(50), nullable=True)  # Unit of measurement
    category = db.Column(db.String(50), nullable=False)  # Category (performance, usage, etc.)
    component = db.Column(db.String(50), nullable=False)  # Component (database, api, ai, etc.)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now)  # When the metric was recorded
    
    def __repr__(self):
        return f"<SystemMetric id={self.id} name={self.metric_name} value={self.metric_value} component={self.component}>"

class APIUsageLog(db.Model):
    """Model for tracking API usage."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    endpoint = db.Column(db.String(255), nullable=False)  # API endpoint
    method = db.Column(db.String(10), nullable=False)  # HTTP method
    status_code = db.Column(db.Integer, nullable=False)  # HTTP status code
    response_time = db.Column(db.Float, nullable=False)  # Response time in seconds
    user_agent = db.Column(db.String(255), nullable=True)  # User agent
    ip_address = db.Column(db.String(50), nullable=True)  # IP address
    request_payload = db.Column(db.Text, nullable=True)  # Request payload
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now)  # When the request was made
    
    def __repr__(self):
        return f"<APIUsageLog id={self.id} endpoint={self.endpoint} status={self.status_code}>"

class AIAgentMetrics(db.Model):
    """Model for tracking AI agent performance metrics."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    agent_type = db.Column(db.String(50), nullable=False)  # Type of agent
    prompt_version_id = db.Column(db.Integer, nullable=True)  # Related prompt version
    request_count = db.Column(db.Integer, default=0)  # Number of requests
    average_response_time = db.Column(db.Float, default=0.0)  # Average response time in seconds
    average_rating = db.Column(db.Float, default=0.0)  # Average rating (1-5)
    token_usage = db.Column(db.Integer, default=0)  # Total tokens used
    error_count = db.Column(db.Integer, default=0)  # Number of errors
    date = db.Column(db.Date, nullable=False)  # Date of metrics collection
    
    # Add aliases to match attributes used in the codebase
    @property
    def requests(self):
        return self.request_count
        
    @property
    def tokens_used(self):
        return self.token_usage
        
    @property
    def avg_response_time(self):
        return self.average_response_time
        
    @property
    def avg_rating(self):
        return self.average_rating
        
    @property
    def feedback_count(self):
        # This is a placeholder for backward compatibility
        # In practice this would need to be calculated from feedback table
        return 1 if self.average_rating > 0 else 0
    
    # Relationship code commented out to avoid circular references
    # prompt_version = db.relationship('PromptVersion', backref=db.backref('metrics', lazy=True))
    
    def __repr__(self):
        return f"<AIAgentMetrics id={self.id} agent={self.agent_type} date={self.date}>"

class MonitoringAlert(db.Model):
    """Model for system monitoring alerts."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50), nullable=False)  # Type of alert (threshold, anomaly, etc.)
    component = db.Column(db.String(50), nullable=False)  # Component (database, api, ai, etc.)
    severity = db.Column(db.String(20), nullable=False)  # Severity (info, warning, critical)
    status = db.Column(db.String(20), nullable=False, default='active')  # Status (active, acknowledged, resolved)
    message = db.Column(db.Text, nullable=False)  # Alert message
    details = db.Column(db.Text, nullable=True)  # Additional details
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

class ModelsScheduledReport(db.Model):
    """Model for scheduled monitoring reports."""
    __tablename__ = 'scheduled_report'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    report_type = db.Column(db.String(50), nullable=False)
    schedule_type = db.Column(db.String(20), nullable=False)  # Type of schedule (daily, weekly, etc.)
    recipients = db.Column(db.Text, nullable=False)  # JSON array of recipients
    is_active = db.Column(db.Boolean, default=True)  # Whether the report is active
    last_run = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    cron_expression = db.Column(db.String(100), nullable=True)  # Custom cron expression if needed
    parameters = db.Column(db.Text, nullable=True)  # JSON parameters for the report
    format = db.Column(db.String(20), nullable=True)  # Format (pdf, csv, xlsx, html)

class ReportExecution(db.Model):
    """Model for tracking report execution history."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('scheduled_report.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # Status (success, failure)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    end_time = db.Column(db.DateTime, nullable=True)
    output_file = db.Column(db.String(255), nullable=True)  # Path to the output file
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    
    # Relationship
    report = db.relationship('ModelsScheduledReport', backref=db.backref('executions', lazy=True),
                             overlaps="executions,report")
    
class ReportExecutionLog(db.Model):
    """Model for logging report execution history with more detailed information."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('scheduled_report.id'), nullable=True)
    report_type = db.Column(db.String(50), nullable=False)  # Type of report
    execution_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    completion_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='processing')  # 'success', 'error', 'processing'
    recipient_count = db.Column(db.Integer, default=0)  # Number of recipients
    format = db.Column(db.String(20), nullable=True)  # Report format
    error_message = db.Column(db.Text, nullable=True)  # Error message if status is 'error'
    parameters = db.Column(db.Text, nullable=True)  # JSON of parameters used for the report
    
    # Relationship with report (if associated with a scheduled report)
    report = db.relationship('ModelsScheduledReport', backref=db.backref('execution_logs', lazy=True),
                            overlaps="execution_logs,report")

class ModelsPropertyLocation(db.Model):
    """Model for property location data."""
    __tablename__ = 'property_location'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(255), nullable=False)
    street = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(50), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    price = db.Column(db.String(50), nullable=True)
    price_value = db.Column(db.Integer, nullable=True)
    property_type = db.Column(db.String(50), nullable=True)
    bedrooms = db.Column(db.Integer, nullable=True)
    bathrooms = db.Column(db.Float, nullable=True)
    square_feet = db.Column(db.Integer, nullable=True)
    year_built = db.Column(db.Integer, nullable=True)
    report_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)

class PriceTrend(db.Model):
    """Model for storing price trends by location over time."""
    __tablename__ = 'price_trend'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    location_type = db.Column(db.String(20))  # city, state, zip, etc.
    location_value = db.Column(db.String(100))  # actual city name, state code, zip code
    city = db.Column(db.String(100))
    state = db.Column(db.String(20))
    zip_code = db.Column(db.String(20))
    date = db.Column(db.Date, nullable=False)
    median_price = db.Column(db.Integer)  # Stored as integer (cents)
    avg_price = db.Column(db.Integer)  # Stored as integer (cents)
    average_price = db.Column(db.Integer)
    price_change = db.Column(db.Float)  # Percentage change from previous month
    properties_sold = db.Column(db.Integer)
    total_listings = db.Column(db.Integer)
    new_listings = db.Column(db.Integer)
    days_on_market = db.Column(db.Float)
    price_per_sqft = db.Column(db.Integer)  # Stored as integer (cents)
    created_at = db.Column(db.DateTime, default=datetime.now)

class JobRun(db.Model):
    """Model for tracking execution of scheduled jobs."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    job_name = db.Column(db.String(100), nullable=False)  # Name of the job
    status = db.Column(db.String(20), nullable=False)  # Status (running, success, failure)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    end_time = db.Column(db.DateTime, nullable=True)
    runtime_seconds = db.Column(db.Float, nullable=True)  # Runtime in seconds
    error_message = db.Column(db.Text, nullable=True)  # Error message if failed
    result_summary = db.Column(db.Text, nullable=True)  # Summary of results
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    
    def __repr__(self):
        return f"<JobRun id={self.id} job={self.job_name} status={self.status}>"

class AIFeedbackReportSettings(db.Model):
    """Model for storing AI feedback report settings."""
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Recipients
    admin_email = db.Column(db.String(255), nullable=True)  # Primary admin email for reports
    additional_recipients = db.Column(db.Text, nullable=True)  # JSON array of additional email addresses
    
    # Schedule settings
    send_daily_reports = db.Column(db.Boolean, default=False)
    send_weekly_reports = db.Column(db.Boolean, default=True)
    send_monthly_reports = db.Column(db.Boolean, default=True)
    
    # Weekly report day (0-6, Monday to Sunday)
    weekly_report_day = db.Column(db.Integer, default=0)
    
    # Monthly report day (1-31)
    monthly_report_day = db.Column(db.Integer, default=1)
    
    # Report content settings
    include_detailed_feedback = db.Column(db.Boolean, default=True)
    include_csv_attachment = db.Column(db.Boolean, default=True)
    include_excel_attachment = db.Column(db.Boolean, default=True)
    
    # Updated timestamp
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<AIFeedbackReportSettings id={self.id}>"
    
    @staticmethod
    def get_settings():
        """Get the current settings, creating default settings if none exist."""
        # Using the already imported db instance
        
        settings = AIFeedbackReportSettings.query.first()
        if not settings:
            settings = AIFeedbackReportSettings()
            db.session.add(settings)
            db.session.commit()
        return settings

# Re-export all models so they can be imported from models directly
__all__ = [
    # Zillow models
    'ZillowMarketData', 'ZillowPriceTrend', 'ZillowProperty',
    
    # NARRPR models
    'NarrprReport', 'NarrprProperty', 'NarrprComparableProperty', 'NarrprMarketActivity',
    
    # Monitoring models
    'SystemMetric', 'APIUsageLog', 'MonitoringAlert', 'ModelsScheduledReport',
    'ReportExecution', 'AIAgentMetrics', 'JobRun', 'ReportExecutionLog',
    'AIFeedbackReportSettings',
    
    # Geographical models
    'ModelsPropertyLocation', 'PriceTrend'
]