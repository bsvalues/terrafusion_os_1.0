"""
Template Filters Module

This module provides custom Jinja2 template filters for formatting dates, times,
numbers, and other values in templates.
"""

import datetime
import json
from flask import Flask
from typing import Union, Optional, Any, Dict, List


def register_template_filters(app: Flask) -> None:
    """
    Register all template filters with the Flask app
    
    Args:
        app: Flask application instance
    """
    app.jinja_env.filters['format_date'] = format_date
    app.jinja_env.filters['format_datetime'] = format_datetime
    app.jinja_env.filters['format_time'] = format_time
    app.jinja_env.filters['format_currency'] = format_currency
    app.jinja_env.filters['format_number'] = format_number
    app.jinja_env.filters['format_filesize'] = format_filesize
    app.jinja_env.filters['timestamp_to_date'] = timestamp_to_date
    app.jinja_env.filters['relative_time'] = relative_time
    app.jinja_env.filters['dateformat'] = dateformat
    app.jinja_env.filters['datetimeformat'] = datetimeformat
    app.jinja_env.filters['commaformat'] = commaformat
    app.jinja_env.filters['tojson'] = to_json
    app.jinja_env.globals['now'] = now


def format_date(value: Union[datetime.date, datetime.datetime, str, None], format_string: str = '%Y-%m-%d') -> str:
    """
    Format a date value
    
    Args:
        value: Date value to format
        format_string: strftime format string
        
    Returns:
        Formatted date string or empty string if value is None
    """
    if value is None:
        return ''
    
    if isinstance(value, str):
        try:
            value = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return value
    
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.strftime(format_string)
    
    return str(value)


def format_datetime(value: Union[datetime.datetime, str, None], format_string: str = '%Y-%m-%d %H:%M:%S') -> str:
    """
    Format a datetime value
    
    Args:
        value: Datetime value to format
        format_string: strftime format string
        
    Returns:
        Formatted datetime string or empty string if value is None
    """
    return format_date(value, format_string)


def format_time(value: Union[datetime.time, datetime.datetime, str, None], format_string: str = '%H:%M:%S') -> str:
    """
    Format a time value
    
    Args:
        value: Time value to format
        format_string: strftime format string
        
    Returns:
        Formatted time string or empty string if value is None
    """
    if value is None:
        return ''
    
    if isinstance(value, str):
        try:
            value = datetime.datetime.fromisoformat(value.replace('Z', '+00:00')).time()
        except ValueError:
            return value
    
    if isinstance(value, datetime.datetime):
        value = value.time()
    
    if isinstance(value, datetime.time):
        return value.strftime(format_string)
    
    return str(value)


def format_currency(value: Union[float, int, str, None], currency: str = '$', decimals: int = 2) -> str:
    """
    Format a number as currency
    
    Args:
        value: Number to format
        currency: Currency symbol
        decimals: Number of decimal places
        
    Returns:
        Formatted currency string or empty string if value is None
    """
    if value is None:
        return ''
    
    try:
        if isinstance(value, str):
            value = float(value)
        
        return f"{currency}{value:,.{decimals}f}"
    except (ValueError, TypeError):
        return str(value)


def format_number(value: Union[float, int, str, None], decimals: int = 0, thousands_sep: str = ',') -> str:
    """
    Format a number with thousand separators
    
    Args:
        value: Number to format
        decimals: Number of decimal places
        thousands_sep: Thousands separator character
        
    Returns:
        Formatted number string or empty string if value is None
    """
    if value is None:
        return ''
    
    try:
        if isinstance(value, str):
            value = float(value)
        
        if decimals <= 0:
            return f"{int(value):,}".replace(',', thousands_sep)
        else:
            return f"{value:,.{decimals}f}".replace(',', thousands_sep)
    except (ValueError, TypeError):
        return str(value)


def format_filesize(size_bytes: Union[int, float, str, None]) -> str:
    """
    Format a file size in bytes to a human-readable string
    
    Args:
        size_bytes: File size in bytes
        
    Returns:
        Human-readable file size string or empty string if size_bytes is None
    """
    if size_bytes is None:
        return ''
    
    try:
        if isinstance(size_bytes, str):
            size_bytes = float(size_bytes)
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024 or unit == 'TB':
                break
            size_bytes /= 1024
        
        if unit == 'B':
            return f"{int(size_bytes)} {unit}"
        else:
            return f"{size_bytes:.2f} {unit}"
    except (ValueError, TypeError):
        return str(size_bytes)


def timestamp_to_date(timestamp: Union[float, int, str, None], format_string: str = '%Y-%m-%d %H:%M:%S') -> str:
    """
    Convert a Unix timestamp to a formatted date string
    
    Args:
        timestamp: Unix timestamp (seconds since epoch)
        format_string: strftime format string
        
    Returns:
        Formatted date string or empty string if timestamp is None
    """
    if timestamp is None:
        return ''
    
    try:
        if isinstance(timestamp, str):
            timestamp = float(timestamp)
        
        dt = datetime.datetime.fromtimestamp(timestamp)
        return dt.strftime(format_string)
    except (ValueError, TypeError, OSError):
        return str(timestamp)


def relative_time(value: Union[datetime.datetime, str, float, int, None]) -> str:
    """
    Format a datetime as a relative time string (e.g. "3 hours ago")
    
    Args:
        value: Datetime value to format
        
    Returns:
        Relative time string or empty string if value is None
    """
    if value is None:
        return ''
    
    now = datetime.datetime.now()
    dt = None
    
    if isinstance(value, datetime.datetime):
        dt = value
    elif isinstance(value, (int, float)):
        try:
            dt = datetime.datetime.fromtimestamp(value)
        except (ValueError, OSError):
            return str(value)
    elif isinstance(value, str):
        try:
            dt = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            try:
                dt = datetime.datetime.fromtimestamp(float(value))
            except (ValueError, OSError):
                return value
    
    if dt is None:
        return str(value)
    
    diff = now - dt
    
    if diff.days < 0:
        # Future date
        if diff.days < -365:
            return f"in {-diff.days // 365} years"
        elif diff.days < -30:
            return f"in {-diff.days // 30} months"
        elif diff.days < -7:
            return f"in {-diff.days // 7} weeks"
        elif diff.days < -1:
            return f"in {-diff.days} days"
        elif diff.seconds < -3600:
            return f"in {-diff.seconds // 3600} hours"
        elif diff.seconds < -60:
            return f"in {-diff.seconds // 60} minutes"
        else:
            return "just now"
    else:
        # Past date
        if diff.days > 365:
            return f"{diff.days // 365} years ago"
        elif diff.days > 30:
            return f"{diff.days // 30} months ago"
        elif diff.days > 7:
            return f"{diff.days // 7} weeks ago"
        elif diff.days > 1:
            return f"{diff.days} days ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600} hours ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60} minutes ago"
        else:
            return "just now"


def dateformat(value: Union[datetime.date, datetime.datetime, str, None], format_string: str = '%Y-%m-%d') -> str:
    """
    Format a date value (shorthand alias for format_date)
    
    Args:
        value: Date value to format
        format_string: strftime format string
        
    Returns:
        Formatted date string or empty string if value is None
    """
    return format_date(value, format_string)


def datetimeformat(value: Union[datetime.datetime, str, None], format_string: str = '%Y-%m-%d %H:%M:%S') -> str:
    """
    Format a datetime value (shorthand alias for format_datetime)
    
    Args:
        value: Datetime value to format
        format_string: strftime format string
        
    Returns:
        Formatted datetime string or empty string if value is None
    """
    return format_datetime(value, format_string)


def commaformat(value: Union[float, int, str, None], decimals: int = 2) -> str:
    """
    Format a number with thousand separators (shorthand alias for format_number)
    
    Args:
        value: Number to format
        decimals: Number of decimal places
        
    Returns:
        Formatted number string with commas or empty string if value is None
    """
    return format_number(value, decimals)


def to_json(value: Any) -> str:
    """
    Convert a Python object to a JSON string
    
    Args:
        value: Python object to convert
        
    Returns:
        JSON string representation of the object
    """
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return '{}'


def now() -> datetime.datetime:
    """
    Get the current datetime
    
    Returns:
        Current datetime object
    """
    return datetime.datetime.now()