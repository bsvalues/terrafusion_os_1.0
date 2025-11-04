#!/usr/bin/env python3
"""
Data Sync Agent for GeoAssessmentPro

This script implements an asynchronous agent that monitors for changes in the source
SQL Server database and automatically syncs them to the Supabase PostgreSQL database.
It leverages the data_migrator.py module for the actual migration process and provides
scheduling, monitoring, and notification capabilities.

Features:
- Periodic scheduled syncs (full or incremental)
- Change detection in SQL Server
- Robust error handling and logging
- Notification system (log, email, etc.)
- Dry-run capability for testing
- Transaction tracking for rollback
"""

import os
import sys
import json
import time
import logging
import asyncio
import argparse
import datetime
import importlib.util
from typing import Dict, Any, List, Optional, Tuple, Callable, Union
from pathlib import Path

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Try to import required packages
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests package not installed. HTTP notifications will be unavailable.")

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("supabase package not installed. Supabase access will be unavailable.")

try:
    import pyodbc
    SQLSERVER_AVAILABLE = True
except ImportError:
    SQLSERVER_AVAILABLE = False
    logging.warning("pyodbc not installed. SQL Server source monitoring will be unavailable.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'sync_agent.log'))
    ]
)
logger = logging.getLogger("sync_agent")

# Import data_migrator - dynamically to avoid circular imports
def import_data_migrator():
    """Dynamically import the data_migrator module."""
    try:
        module_path = os.path.join(os.path.dirname(__file__), 'data_migrator.py')
        spec = importlib.util.spec_from_file_location("data_migrator", module_path)
        data_migrator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(data_migrator)
        return data_migrator
    except Exception as e:
        logger.error(f"Failed to import data_migrator module: {str(e)}")
        return None


class NotificationChannel:
    """Base class for notification channels."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = "base"
    
    async def send(self, message: str, level: str = "info", context: Dict[str, Any] = None) -> bool:
        """Send a notification."""
        raise NotImplementedError("Subclasses must implement this method")


class LogNotificationChannel(NotificationChannel):
    """Notification channel that logs messages."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.name = "log"
        self.logger = logging.getLogger("sync_agent.notifications")
    
    async def send(self, message: str, level: str = "info", context: Dict[str, Any] = None) -> bool:
        """Log a notification message."""
        if level == "info":
            self.logger.info(message)
        elif level == "warning":
            self.logger.warning(message)
        elif level == "error":
            self.logger.error(message)
        elif level == "debug":
            self.logger.debug(message)
        else:
            self.logger.info(message)
        
        return True


class EmailNotificationChannel(NotificationChannel):
    """Notification channel that sends email messages."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.name = "email"
        self.recipients = config.get("recipients", [])
        self.from_address = config.get("from_address", "sync_agent@example.com")
        self.smtp_server = config.get("smtp_server", "localhost")
        self.smtp_port = config.get("smtp_port", 25)
        self.smtp_username = config.get("smtp_username")
        self.smtp_password = config.get("smtp_password")
        self.use_tls = config.get("use_tls", False)
    
    async def send(self, message: str, level: str = "info", context: Dict[str, Any] = None) -> bool:
        """Send an email notification."""
        # This is a placeholder implementation
        # In a real implementation, you would use smtplib or an email service API
        logger.info(f"Would send email to {self.recipients}: {message}")
        return True


class WebhookNotificationChannel(NotificationChannel):
    """Notification channel that sends HTTP webhook notifications."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.name = "webhook"
        self.url = config.get("url")
        self.headers = config.get("headers", {})
        self.method = config.get("method", "POST")
    
    async def send(self, message: str, level: str = "info", context: Dict[str, Any] = None) -> bool:
        """Send a webhook notification."""
        if not REQUESTS_AVAILABLE:
            logger.warning("Cannot send webhook notification: requests package not installed")
            return False
        
        if not self.url:
            logger.warning("Cannot send webhook notification: URL not configured")
            return False
        
        try:
            payload = {
                "message": message,
                "level": level,
                "timestamp": datetime.datetime.now().isoformat(),
                "context": context or {}
            }
            
            response = requests.request(
                self.method,
                self.url,
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code >= 200 and response.status_code < 300:
                logger.debug(f"Webhook notification sent successfully to {self.url}")
                return True
            else:
                logger.warning(f"Failed to send webhook notification: {response.status_code} {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error sending webhook notification: {str(e)}")
            return False


class NotificationManager:
    """Manages notification channels and sends notifications."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.channels: Dict[str, NotificationChannel] = {}
        self._init_channels()
    
    def _init_channels(self):
        """Initialize notification channels from config."""
        # Always add log channel
        self.channels["log"] = LogNotificationChannel({})
        logger.info(f"Registered notification channel: log")
        
        # Add configured channels
        channel_configs = self.config.get("channels", [])
        for channel_config in channel_configs:
            channel_type = channel_config.get("type")
            if channel_type == "email":
                self.channels["email"] = EmailNotificationChannel(channel_config)
                logger.info(f"Registered notification channel: email")
            elif channel_type == "webhook":
                self.channels["webhook"] = WebhookNotificationChannel(channel_config)
                logger.info(f"Registered notification channel: webhook")
    
    async def notify(self, message: str, level: str = "info", channels: List[str] = None, context: Dict[str, Any] = None) -> None:
        """Send a notification to the specified channels."""
        if channels is None:
            # Use all channels by default
            channels = list(self.channels.keys())
        
        for channel_name in channels:
            if channel_name in self.channels:
                channel = self.channels[channel_name]
                try:
                    await channel.send(message, level, context)
                except Exception as e:
                    logger.error(f"Error sending notification via {channel_name}: {str(e)}")


class DataSyncAgent:
    """
    Data Sync Agent monitors the source SQL Server database for changes
    and synchronizes them to the target Supabase PostgreSQL database.
    """

    def __init__(self, config_path: str):
        """Initialize the Data Sync Agent."""
        self.config_path = config_path
        self.config = self._load_config()
        self.notification_manager = NotificationManager(self.config.get("notifications", {}))
        self.data_migrator = import_data_migrator()
        self.is_running = False
        self.last_sync_time = None
        self.supabase_client = None
        self.sqlserver_conn = None
    
    def _load_config(self) -> Dict[str, Any]:
        """Load the configuration from the config file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return config
        except Exception as e:
            logger.error(f"Error loading configuration from {self.config_path}: {str(e)}")
            return {}
    
    async def initialize(self) -> bool:
        """Initialize connections and verify configuration."""
        if not self.data_migrator:
            await self.notify("Failed to import data_migrator module", "error")
            return False
        
        # Initialize Supabase client
        supabase_url = self.config.get("supabase_url") or os.environ.get("SUPABASE_URL")
        supabase_key = self.config.get("supabase_key") or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            await self.notify("Supabase URL and key are required", "error")
            return False
        
        if not SUPABASE_AVAILABLE:
            await self.notify("Supabase package not installed", "error")
            return False
        
        try:
            self.supabase_client = create_client(supabase_url, supabase_key)
            await self.notify("Successfully connected to Supabase", "info")
        except Exception as e:
            await self.notify(f"Failed to connect to Supabase: {str(e)}", "error")
            return False
        
        # Initialize SQL Server connection if needed
        source_type = self.config.get("source_type", "").lower()
        if source_type == "sqlserver":
            if not SQLSERVER_AVAILABLE:
                await self.notify("pyodbc not installed. SQL Server sync will not be available.", "error")
                return False
            
            conn_string = self.config.get("source_path", "")
            if not conn_string:
                await self.notify("SQL Server connection string is required", "error")
                return False
            
            try:
                self.sqlserver_conn = pyodbc.connect(conn_string)
                await self.notify("Successfully connected to SQL Server", "info")
            except Exception as e:
                await self.notify(f"Failed to connect to SQL Server: {str(e)}", "error")
                return False
        
        return True
    
    async def notify(self, message: str, level: str = "info", channels: List[str] = None, context: Dict[str, Any] = None) -> None:
        """Send a notification."""
        if context is None:
            context = {}
        
        context.update({
            "agent": "DataSyncAgent",
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        await self.notification_manager.notify(message, level, channels, context)
    
    async def run_sync(self, incremental: bool = True, dry_run: bool = False) -> Dict[str, Any]:
        """Run a data sync operation."""
        if not self.data_migrator:
            await self.notify("Cannot run sync: data_migrator module not loaded", "error")
            return {"success": False, "error": "data_migrator module not loaded"}
        
        source_type = self.config.get("source_type", "").lower()
        if source_type != "sqlserver":
            await self.notify(f"Unsupported source type for sync: {source_type}", "error")
            return {"success": False, "error": f"Unsupported source type: {source_type}"}
        
        # Ensure SQL Server connection is active
        if not self.sqlserver_conn:
            await self.notify("SQL Server connection not established", "error")
            return {"success": False, "error": "SQL Server connection not established"}
        
        try:
            # Update sync options
            if "sync" not in self.config:
                self.config["sync"] = {}
            
            self.config["sync"]["dry_run"] = dry_run
            self.config["sync"]["incremental"] = incremental
            
            # Execute migration
            mode = "INCREMENTAL" if incremental else "FULL"
            status = "DRY RUN" if dry_run else "LIVE"
            msg = f"Starting {status} {mode} SYNC from SQL Server to Supabase"
            await self.notify(msg, "info")
            
            start_time = time.time()
            self.last_sync_time = datetime.datetime.now()
            
            # Use the data_migrator to perform the sync
            results = self.data_migrator.migrate_sqlserver_to_supabase(
                self.sqlserver_conn,
                self.supabase_client,
                self.config,
                dry_run=dry_run,
                incremental=incremental
            )
            
            end_time = time.time()
            duration = round(end_time - start_time, 2)
            
            # Send notification with results
            if results["success"]:
                if dry_run:
                    msg = (f"[DRY RUN] Would migrate {results['records_migrated']} records in "
                           f"{results['tables_migrated']} tables ({duration}s)")
                    if incremental and results.get("records_updated", 0) > 0:
                        msg += f", would update {results['records_updated']} records"
                else:
                    msg = (f"Successfully migrated {results['records_migrated']} records in "
                           f"{results['tables_migrated']} tables ({duration}s)")
                    if incremental and results.get("records_updated", 0) > 0:
                        msg += f", updated {results['records_updated']} records"
                
                await self.notify(msg, "info")
            else:
                await self.notify(f"Sync failed in {duration}s", "error", context={"errors": results.get("errors", [])})
            
            return results
        except Exception as e:
            await self.notify(f"Error during sync operation: {str(e)}", "error")
            return {"success": False, "error": str(e)}
    
    async def check_for_changes(self) -> bool:
        """Check if there are changes in the source database that need to be synced."""
        if not self.sqlserver_conn:
            await self.notify("SQL Server connection not established", "error")
            return False
        
        try:
            # This is a simplified implementation.
            # In a real scenario, you might:
            # 1. Query change tracking in SQL Server
            # 2. Check modification timestamps
            # 3. Compare record counts
            # 4. Use database triggers or CDC (Change Data Capture)
            
            # For now, we'll just return True to trigger a sync
            return True
        except Exception as e:
            await self.notify(f"Error checking for changes: {str(e)}", "error")
            return False
    
    async def monitor_and_sync(self):
        """Continuously monitor for changes and trigger syncs."""
        self.is_running = True
        
        # Get sync interval from config (defaults to 15 minutes)
        sync_interval = self.config.get("sync_interval", 15 * 60)  # seconds
        
        await self.notify(f"Starting sync monitor with interval {sync_interval}s", "info")
        
        while self.is_running:
            try:
                # Check for changes
                changes_detected = await self.check_for_changes()
                
                if changes_detected:
                    # Get sync options from config
                    incremental = self.config.get("sync", {}).get("incremental", True)
                    dry_run = self.config.get("sync", {}).get("dry_run", False)
                    
                    # Run the sync
                    await self.run_sync(incremental=incremental, dry_run=dry_run)
                else:
                    await self.notify("No changes detected", "debug")
                
                # Wait for next check
                await asyncio.sleep(sync_interval)
            except Exception as e:
                await self.notify(f"Error in monitor_and_sync: {str(e)}", "error")
                await asyncio.sleep(60)  # Wait a bit before trying again
    
    async def stop(self):
        """Stop the sync monitor."""
        self.is_running = False
        await self.notify("Stopping sync monitor", "info")
        
        # Close connections
        if self.sqlserver_conn:
            try:
                self.sqlserver_conn.close()
            except Exception:
                pass
        
        await self.notify("Sync monitor stopped", "info")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Data Sync Agent for GeoAssessmentPro")
    parser.add_argument("--config", "-c", required=True, help="Path to the configuration file")
    parser.add_argument("--once", "-o", action="store_true", help="Run sync once and exit")
    parser.add_argument("--incremental", "-i", action="store_true", help="Run incremental sync")
    parser.add_argument("--full", "-f", action="store_true", help="Run full sync")
    parser.add_argument("--dry-run", "-d", action="store_true", help="Dry run (no changes)")
    args = parser.parse_args()
    
    # Create and initialize the agent
    agent = DataSyncAgent(args.config)
    if not await agent.initialize():
        logger.error("Failed to initialize Data Sync Agent")
        return 1
    
    # Run once or monitor continuously
    if args.once:
        # Determine sync mode
        incremental = True
        if args.full:
            incremental = False
        elif args.incremental:
            incremental = True
        
        # Run sync once
        results = await agent.run_sync(incremental=incremental, dry_run=args.dry_run)
        return 0 if results["success"] else 1
    else:
        # Start monitoring
        await agent.monitor_and_sync()
        return 0


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Sync agent interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        sys.exit(1)