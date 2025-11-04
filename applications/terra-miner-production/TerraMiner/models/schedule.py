"""
Database models for ETL job scheduling.
"""
import json
from datetime import datetime, timedelta
from app import db

class ETLSchedule(db.Model):
    """Model for scheduled ETL jobs."""
    __tablename__ = 'etl_schedule'
    
    id = db.Column(db.Integer, primary_key=True)
    plugin_name = db.Column(db.String(100), nullable=False)  # Name of the ETL plugin to run
    name = db.Column(db.String(100), nullable=False)  # Name of the scheduled job
    description = db.Column(db.Text, nullable=True)  # Description of the scheduled job
    enabled = db.Column(db.Boolean, default=True)  # Whether the schedule is enabled
    config = db.Column(db.JSON, nullable=True)  # Configuration for the ETL plugin
    
    # Schedule settings
    frequency = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, hourly, custom
    hour = db.Column(db.Integer, nullable=True)  # Hour of the day to run (0-23)
    minute = db.Column(db.Integer, nullable=True)  # Minute of the hour to run (0-59)
    day_of_week = db.Column(db.Integer, nullable=True)  # Day of the week to run (0=Monday, 6=Sunday)
    day_of_month = db.Column(db.Integer, nullable=True)  # Day of the month to run (1-31)
    cron_expression = db.Column(db.String(100), nullable=True)  # Custom cron expression if needed
    
    # Execution history
    last_run = db.Column(db.DateTime, nullable=True)  # Last time the job was run
    next_run = db.Column(db.DateTime, nullable=True)  # Next time the job will run
    last_status = db.Column(db.String(20), nullable=True)  # success, error, running
    last_error = db.Column(db.Text, nullable=True)  # Error message if last_status is error
    
    # Audit fields
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    created_by = db.Column(db.String(100), nullable=True)  # User or API key who created the schedule
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<ETLSchedule id={self.id} name='{self.name}' plugin='{self.plugin_name}'>"
    
    def to_dict(self):
        """Convert the model instance to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'enabled': self.enabled,
            'plugin_name': self.plugin_name,
            'config': self.config,
            'frequency': self.frequency,
            'hour': self.hour,
            'minute': self.minute,
            'day_of_week': self.day_of_week,
            'day_of_month': self.day_of_month,
            'cron_expression': self.cron_expression,
            'last_run': self.last_run.isoformat() if self.last_run else None,
            'next_run': self.next_run.isoformat() if self.next_run else None,
            'last_status': self.last_status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def calculate_next_run_time(self):
        """Calculate the next run time based on the schedule."""
        now = datetime.now()
        
        if self.frequency == 'hourly':
            # Run at the specified minute of every hour
            minute = self.minute if self.minute is not None else 0
            # Get the next hour that hasn't passed yet
            if now.minute >= minute:
                # If current minute has passed the scheduled minute, go to next hour
                next_run = now.replace(minute=minute, second=0, microsecond=0) + timedelta(hours=1)
            else:
                # If current minute is before the scheduled minute, stay in current hour
                next_run = now.replace(minute=minute, second=0, microsecond=0)
            
        elif self.frequency == 'daily':
            # Run once a day at the specified time
            hour = self.hour if self.hour is not None else 0
            minute = self.minute if self.minute is not None else 0
            
            # Create a datetime for today at the specified time
            today_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # If that time has already passed today, schedule for tomorrow
            if now > today_run:
                next_run = today_run + timedelta(days=1)
            else:
                next_run = today_run
                
        elif self.frequency == 'weekly':
            # Run once a week on the specified day and time
            day = self.day_of_week if self.day_of_week is not None else 0  # Monday by default
            hour = self.hour if self.hour is not None else 0
            minute = self.minute if self.minute is not None else 0
            
            # Get the current day of the week (0=Monday, 6=Sunday)
            current_day = now.weekday()
            
            # Calculate days until next run
            days_until_next = (day - current_day) % 7
            
            # If it's the same day, check if the time has passed
            if days_until_next == 0:
                scheduled_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if now > scheduled_time:
                    # If time has passed, schedule for next week
                    days_until_next = 7
            
            # Calculate the next run date
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0) + timedelta(days=days_until_next)
            
        elif self.frequency == 'monthly':
            # Run once a month on the specified day and time
            day = min(self.day_of_month if self.day_of_month is not None else 1, 28)  # Safely handle all months
            hour = self.hour if self.hour is not None else 0
            minute = self.minute if self.minute is not None else 0
            
            # Create a datetime for this month's run
            try:
                this_month_run = now.replace(day=day, hour=hour, minute=minute, second=0, microsecond=0)
            except ValueError:
                # Handle edge cases (e.g., February 30th)
                last_day = (now.replace(day=1, month=now.month % 12 + 1, year=now.year + now.month // 12) - timedelta(days=1)).day
                this_month_run = now.replace(day=min(day, last_day), hour=hour, minute=minute, second=0, microsecond=0)
            
            # If that date has already passed this month, go to next month
            if now > this_month_run:
                # Calculate first day of next month
                if now.month == 12:
                    next_month = now.replace(year=now.year + 1, month=1, day=1)
                else:
                    next_month = now.replace(month=now.month + 1, day=1)
                
                # Try to set the day, handle edge cases for shorter months
                try:
                    next_run = next_month.replace(day=day, hour=hour, minute=minute, second=0, microsecond=0)
                except ValueError:
                    # Get the last day of the month
                    last_day = (next_month.replace(month=next_month.month % 12 + 1, year=next_month.year + next_month.month // 12) - timedelta(days=1)).day
                    next_run = next_month.replace(day=min(day, last_day), hour=hour, minute=minute, second=0, microsecond=0)
            else:
                next_run = this_month_run
                
        elif self.frequency == 'custom' and self.cron_expression:
            # For custom frequencies, rely on the scheduler's cron parsing
            # Here we just set a placeholder
            next_run = now + timedelta(hours=1)
        else:
            # Default fallback - run daily at midnight
            next_run = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        return next_run
    
    def update_next_run_time(self):
        """Update the next_run field based on the schedule."""
        self.next_run = self.calculate_next_run_time()
        db.session.commit()
        return self.next_run