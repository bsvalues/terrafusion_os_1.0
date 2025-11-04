"""
Application Context Utilities for Sync Service

This module provides utilities for managing Flask application context
for background tasks and scheduled jobs.
"""
# Import from app_context to avoid circular imports
from sync_service.app_context import with_app_context, handle_job_exception

# Simple re-export of the functions
__all__ = ['with_app_context', 'handle_job_exception']