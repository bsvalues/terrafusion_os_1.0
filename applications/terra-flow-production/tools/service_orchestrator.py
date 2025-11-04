#!/usr/bin/env python3
"""
Service Orchestrator for Shared Database Architecture

This script provides orchestration capabilities for services that use the shared database.
It enables:
- Message passing between services
- Task scheduling and coordination
- Event-driven workflows
- Status monitoring across services

Use this to build complex workflows that span multiple services in the shared architecture.
"""

import os
import sys
import logging
import json
import time
import threading
import uuid
import datetime
import argparse
from typing import Dict, Any, List, Optional, Tuple, Callable, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("orchestrator")

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Try to import supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

# Try to import colorama for colored output
try:
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
    HAS_COLORS = True
except ImportError:
    HAS_COLORS = False
    # Stub color objects
    class DummyColor:
        def __getattr__(self, name):
            return ""
    Fore = DummyColor()
    Back = DummyColor()
    Style = DummyColor()

def print_header(title: str) -> None:
    """Print a formatted header."""
    if HAS_COLORS:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 70}")
        print(f"{Fore.CYAN}{Style.BRIGHT}  {title}")
        print(f"{Fore.CYAN}{Style.BRIGHT}{'=' * 70}{Style.RESET_ALL}\n")
    else:
        print(f"\n{'=' * 70}")
        print(f"  {title}")
        print(f"{'=' * 70}\n")

def print_success(message: str) -> None:
    """Print a success message."""
    if HAS_COLORS:
        print(f"{Fore.GREEN}{Style.BRIGHT}✓ {message}{Style.RESET_ALL}")
    else:
        print(f"✓ {message}")

def print_error(message: str) -> None:
    """Print an error message."""
    if HAS_COLORS:
        print(f"{Fore.RED}{Style.BRIGHT}✗ {message}{Style.RESET_ALL}")
    else:
        print(f"✗ {message}")

def print_warning(message: str) -> None:
    """Print a warning message."""
    if HAS_COLORS:
        print(f"{Fore.YELLOW}{Style.BRIGHT}⚠ {message}{Style.RESET_ALL}")
    else:
        print(f"⚠ {message}")

def print_info(message: str) -> None:
    """Print an info message."""
    if HAS_COLORS:
        print(f"{Fore.BLUE}{Style.BRIGHT}ℹ {message}{Style.RESET_ALL}")
    else:
        print(f"ℹ {message}")

def get_supabase_client(url: str, key: str) -> Optional[Client]:
    """Get a Supabase client."""
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase package is not available")
        return None
    
    try:
        client = create_client(url, key)
        
        # Set application name for audit logging
        try:
            client.sql("SET app.service_name TO 'service_orchestrator';").execute()
        except Exception as e:
            logger.warning(f"Could not set app.service_name: {str(e)}")
        
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {str(e)}")
        return None

class ServiceOrchestrator:
    """
    Service orchestrator for shared database architecture.
    
    This class provides:
    - Message passing between services
    - Task scheduling and coordination
    - Event-driven workflows
    - Status monitoring across services
    """
    
    def __init__(self, client: Client):
        """Initialize the orchestrator."""
        self.client = client
        self.running = False
        self.task_handlers = {}
        self.event_handlers = {}
        self.channels = {}
        self.service_statuses = {}
        
        # Create tables if they don't exist
        self._create_orchestration_tables()
    
    def _create_orchestration_tables(self) -> None:
        """Create orchestration tables if they don't exist."""
        try:
            # Messages table
            self.client.sql("""
            CREATE TABLE IF NOT EXISTS sync.messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                sender TEXT NOT NULL,
                recipients TEXT[] NOT NULL,
                subject TEXT NOT NULL,
                payload JSONB,
                priority INTEGER DEFAULT 0,
                read BOOLEAN DEFAULT FALSE,
                read_by TEXT[],
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            """).execute()
            
            # Tasks table
            self.client.sql("""
            CREATE TABLE IF NOT EXISTS sync.tasks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                task_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                creator TEXT NOT NULL,
                assigned_to TEXT,
                priority INTEGER DEFAULT 0,
                parameters JSONB,
                result JSONB,
                error TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE
            );
            """).execute()
            
            # Events table
            self.client.sql("""
            CREATE TABLE IF NOT EXISTS sync.events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                event_type TEXT NOT NULL,
                source TEXT NOT NULL,
                payload JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            """).execute()
            
            # Service status table
            self.client.sql("""
            CREATE TABLE IF NOT EXISTS sync.service_status (
                service_name TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
                info JSONB,
                version TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            """).execute()
            
            logger.info("Orchestration tables created or already exist")
        except Exception as e:
            logger.error(f"Error creating orchestration tables: {str(e)}")
    
    def register_task_handler(self, task_type: str, handler: Callable) -> None:
        """
        Register a task handler.
        
        Args:
            task_type: Type of task to handle
            handler: Function to handle the task
        """
        self.task_handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
    
    def register_event_handler(self, event_type: str, handler: Callable) -> None:
        """
        Register an event handler.
        
        Args:
            event_type: Type of event to handle
            handler: Function to handle the event
        """
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        
        self.event_handlers[event_type].append(handler)
        logger.info(f"Registered handler for event type: {event_type}")
    
    def listen_for_changes(self, channel_name: str, table: str, schema: str = "sync", event: str = "*") -> None:
        """
        Listen for database changes.
        
        Args:
            channel_name: Channel name
            table: Table to monitor
            schema: Schema name
            event: Event type (insert, update, delete, or * for all)
        """
        try:
            # Create the channel if it doesn't exist
            if channel_name not in self.channels:
                channel = self.client.channel(channel_name)
                
                # Configure the channel
                channel.on(
                    'postgres_changes',
                    {
                        "event": event,
                        "schema": schema,
                        "table": table
                    },
                    lambda payload: self._handle_database_change(payload)
                ).subscribe()
                
                self.channels[channel_name] = channel
                logger.info(f"Listening for changes on {schema}.{table} via channel {channel_name}")
        except Exception as e:
            logger.error(f"Error listening for changes: {str(e)}")
    
    def _handle_database_change(self, payload: Dict[str, Any]) -> None:
        """
        Handle a database change notification.
        
        Args:
            payload: Change payload
        """
        try:
            logger.debug(f"Received change notification: {payload}")
            
            # Get relevant information
            schema = payload.get("schema")
            table = payload.get("table")
            event_type = payload.get("eventType")
            new_record = payload.get("new", {})
            old_record = payload.get("old", {})
            
            # Handle based on table
            if schema == "sync" and table == "messages":
                self._process_new_message(new_record)
            elif schema == "sync" and table == "tasks":
                self._process_task_update(new_record, old_record)
            elif schema == "sync" and table == "events":
                self._process_new_event(new_record)
        except Exception as e:
            logger.error(f"Error handling database change: {str(e)}")
    
    def _process_new_message(self, message: Dict[str, Any]) -> None:
        """
        Process a new message.
        
        Args:
            message: Message data
        """
        service_name = os.environ.get("SERVICE_NAME")
        if not service_name:
            logger.warning("SERVICE_NAME environment variable not set")
            return
        
        # Check if this message is for this service
        recipients = message.get("recipients", [])
        if service_name in recipients:
            logger.info(f"Received message: {message.get('subject')}")
            
            # Mark as read by this service
            try:
                message_id = message.get("id")
                if message_id:
                    read_by = message.get("read_by", [])
                    if service_name not in read_by:
                        read_by.append(service_name)
                        
                        self.client.table("sync.messages").update({
                            "read_by": read_by,
                            "read": len(read_by) == len(recipients)
                        }).eq("id", message_id).execute()
            except Exception as e:
                logger.error(f"Error marking message as read: {str(e)}")
    
    def _process_task_update(self, new_task: Dict[str, Any], old_task: Dict[str, Any]) -> None:
        """
        Process a task update.
        
        Args:
            new_task: New task data
            old_task: Old task data
        """
        service_name = os.environ.get("SERVICE_NAME")
        if not service_name:
            logger.warning("SERVICE_NAME environment variable not set")
            return
        
        # Check if this task is assigned to this service
        assigned_to = new_task.get("assigned_to")
        if assigned_to == service_name:
            # Check if the task was just assigned (status changed from null/other to "assigned")
            old_status = old_task.get("status") if old_task else None
            new_status = new_task.get("status")
            
            if new_status == "assigned" and old_status != "assigned":
                logger.info(f"New task assigned: {new_task.get('task_type')}")
                
                # Process the task
                self._process_assigned_task(new_task)
    
    def _process_assigned_task(self, task: Dict[str, Any]) -> None:
        """
        Process an assigned task.
        
        Args:
            task: Task data
        """
        task_id = task.get("id")
        task_type = task.get("task_type")
        parameters = task.get("parameters", {})
        
        # Mark task as in progress
        try:
            self.client.table("sync.tasks").update({
                "status": "in_progress",
                "started_at": datetime.datetime.now().isoformat()
            }).eq("id", task_id).execute()
        except Exception as e:
            logger.error(f"Error updating task status: {str(e)}")
            return
        
        # Check if we have a handler for this task type
        if task_type in self.task_handlers:
            try:
                # Execute the task handler
                handler = self.task_handlers[task_type]
                result = handler(parameters)
                
                # Mark task as completed
                self.client.table("sync.tasks").update({
                    "status": "completed",
                    "result": result,
                    "completed_at": datetime.datetime.now().isoformat()
                }).eq("id", task_id).execute()
                
                logger.info(f"Task {task_id} completed successfully")
            except Exception as e:
                # Mark task as failed
                self.client.table("sync.tasks").update({
                    "status": "failed",
                    "error": str(e),
                    "completed_at": datetime.datetime.now().isoformat()
                }).eq("id", task_id).execute()
                
                logger.error(f"Error processing task {task_id}: {str(e)}")
        else:
            # Mark task as failed - no handler available
            self.client.table("sync.tasks").update({
                "status": "failed",
                "error": f"No handler for task type: {task_type}",
                "completed_at": datetime.datetime.now().isoformat()
            }).eq("id", task_id).execute()
            
            logger.error(f"No handler for task type: {task_type}")
    
    def _process_new_event(self, event: Dict[str, Any]) -> None:
        """
        Process a new event.
        
        Args:
            event: Event data
        """
        event_type = event.get("event_type")
        source = event.get("source")
        payload = event.get("payload", {})
        
        logger.info(f"Received event: {event_type} from {source}")
        
        # Check if we have handlers for this event type
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    # Execute the event handler
                    handler(source, payload)
                except Exception as e:
                    logger.error(f"Error processing event {event_type}: {str(e)}")
    
    def send_message(self, recipients: List[str], subject: str, payload: Dict[str, Any] = None, priority: int = 0) -> Optional[str]:
        """
        Send a message to other services.
        
        Args:
            recipients: List of recipient service names
            subject: Message subject
            payload: Optional message payload
            priority: Message priority (higher = more important)
            
        Returns:
            Message ID if successful, None otherwise
        """
        service_name = os.environ.get("SERVICE_NAME")
        if not service_name:
            logger.warning("SERVICE_NAME environment variable not set")
            service_name = "unknown"
        
        try:
            response = self.client.table("sync.messages").insert({
                "sender": service_name,
                "recipients": recipients,
                "subject": subject,
                "payload": payload or {},
                "priority": priority,
                "read": False,
                "read_by": []
            }).execute()
            
            if hasattr(response, 'data') and response.data:
                message_id = response.data[0].get("id")
                logger.info(f"Message sent: {subject} to {', '.join(recipients)}")
                return message_id
            else:
                logger.error("Error sending message: Invalid response")
                return None
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            return None
    
    def create_task(self, task_type: str, parameters: Dict[str, Any] = None, assigned_to: Optional[str] = None, priority: int = 0) -> Optional[str]:
        """
        Create a new task.
        
        Args:
            task_type: Type of task
            parameters: Task parameters
            assigned_to: Service to assign the task to (optional)
            priority: Task priority (higher = more important)
            
        Returns:
            Task ID if successful, None otherwise
        """
        service_name = os.environ.get("SERVICE_NAME")
        if not service_name:
            logger.warning("SERVICE_NAME environment variable not set")
            service_name = "unknown"
        
        status = "pending"
        if assigned_to:
            status = "assigned"
        
        try:
            response = self.client.table("sync.tasks").insert({
                "task_type": task_type,
                "status": status,
                "creator": service_name,
                "assigned_to": assigned_to,
                "priority": priority,
                "parameters": parameters or {}
            }).execute()
            
            if hasattr(response, 'data') and response.data:
                task_id = response.data[0].get("id")
                logger.info(f"Task created: {task_type}")
                return task_id
            else:
                logger.error("Error creating task: Invalid response")
                return None
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            return None
    
    def emit_event(self, event_type: str, payload: Dict[str, Any] = None) -> Optional[str]:
        """
        Emit an event.
        
        Args:
            event_type: Type of event
            payload: Event payload
            
        Returns:
            Event ID if successful, None otherwise
        """
        service_name = os.environ.get("SERVICE_NAME")
        if not service_name:
            logger.warning("SERVICE_NAME environment variable not set")
            service_name = "unknown"
        
        try:
            response = self.client.table("sync.events").insert({
                "event_type": event_type,
                "source": service_name,
                "payload": payload or {}
            }).execute()
            
            if hasattr(response, 'data') and response.data:
                event_id = response.data[0].get("id")
                logger.info(f"Event emitted: {event_type}")
                return event_id
            else:
                logger.error("Error emitting event: Invalid response")
                return None
        except Exception as e:
            logger.error(f"Error emitting event: {str(e)}")
            return None
    
    def update_service_status(self, status: str, info: Dict[str, Any] = None, version: Optional[str] = None) -> bool:
        """
        Update the service status.
        
        Args:
            status: Service status
            info: Additional status information
            version: Service version
            
        Returns:
            True if successful, False otherwise
        """
        service_name = os.environ.get("SERVICE_NAME")
        if not service_name:
            logger.warning("SERVICE_NAME environment variable not set")
            return False
        
        try:
            # Check if status exists
            response = self.client.table("sync.service_status").select("*").eq("service_name", service_name).execute()
            
            if hasattr(response, 'data') and response.data:
                # Update existing status
                self.client.table("sync.service_status").update({
                    "status": status,
                    "last_heartbeat": datetime.datetime.now().isoformat(),
                    "info": info or {},
                    "version": version,
                    "updated_at": datetime.datetime.now().isoformat()
                }).eq("service_name", service_name).execute()
            else:
                # Create new status
                self.client.table("sync.service_status").insert({
                    "service_name": service_name,
                    "status": status,
                    "last_heartbeat": datetime.datetime.now().isoformat(),
                    "info": info or {},
                    "version": version
                }).execute()
            
            logger.info(f"Service status updated: {status}")
            return True
        except Exception as e:
            logger.error(f"Error updating service status: {str(e)}")
            return False
    
    def get_service_status(self, service_name: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a service.
        
        Args:
            service_name: Service name
            
        Returns:
            Service status or None if not found
        """
        try:
            response = self.client.table("sync.service_status").select("*").eq("service_name", service_name).execute()
            
            if hasattr(response, 'data') and response.data:
                return response.data[0]
            else:
                logger.warning(f"Service status not found: {service_name}")
                return None
        except Exception as e:
            logger.error(f"Error getting service status: {str(e)}")
            return None
    
    def get_all_service_statuses(self) -> List[Dict[str, Any]]:
        """
        Get the status of all services.
        
        Returns:
            List of service statuses
        """
        try:
            response = self.client.table("sync.service_status").select("*").execute()
            
            if hasattr(response, 'data'):
                return response.data
            else:
                logger.warning("Error getting service statuses: Invalid response")
                return []
        except Exception as e:
            logger.error(f"Error getting service statuses: {str(e)}")
            return []
    
    def start_heartbeat(self, interval: int = 60) -> None:
        """
        Start sending heartbeat updates.
        
        Args:
            interval: Heartbeat interval in seconds
        """
        def heartbeat_worker():
            while self.running:
                # Update service status
                self.update_service_status("online")
                
                # Sleep for interval
                time.sleep(interval)
        
        # Start the heartbeat thread
        thread = threading.Thread(target=heartbeat_worker, daemon=True)
        thread.start()
        logger.info(f"Heartbeat started with {interval}s interval")
    
    def start(self) -> None:
        """Start the orchestrator."""
        self.running = True
        
        # Set up listeners
        self.listen_for_changes("messages_channel", "messages")
        self.listen_for_changes("tasks_channel", "tasks")
        self.listen_for_changes("events_channel", "events")
        
        # Start heartbeat
        self.start_heartbeat()
        
        # Update service status
        self.update_service_status("online")
        
        logger.info("Service orchestrator started")
    
    def stop(self) -> None:
        """Stop the orchestrator."""
        self.running = False
        
        # Update service status
        self.update_service_status("offline")
        
        # Close all channels
        for channel_name, channel in self.channels.items():
            try:
                channel.unsubscribe()
                logger.info(f"Unsubscribed from channel: {channel_name}")
            except Exception as e:
                logger.error(f"Error unsubscribing from channel {channel_name}: {str(e)}")
        
        logger.info("Service orchestrator stopped")

def run_orchestrator():
    """Run the orchestrator as a standalone service."""
    parser = argparse.ArgumentParser(description="Service Orchestrator for Shared Database Architecture")
    parser.add_argument("--url", "-u", help="Supabase URL")
    parser.add_argument("--key", "-k", help="Supabase service key")
    parser.add_argument("--service", "-s", help="Service name")
    args = parser.parse_args()
    
    # Set service name if provided
    if args.service:
        os.environ["SERVICE_NAME"] = args.service
    
    # Get Supabase credentials
    url = args.url or os.environ.get("SUPABASE_URL")
    key = args.key or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        logger.error(
            "Supabase URL and key are required. "
            "Provide them as arguments or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
        return 1
    
    # Get service name
    service_name = os.environ.get("SERVICE_NAME")
    if not service_name:
        logger.error("SERVICE_NAME environment variable not set")
        return 1
    
    # Get Supabase client
    client = get_supabase_client(url, key)
    if not client:
        logger.error("Failed to create Supabase client")
        return 1
    
    print_header(f"Service Orchestrator: {service_name}")
    
    # Create orchestrator
    orchestrator = ServiceOrchestrator(client)
    
    # Define some example task handlers
    def handle_echo_task(params):
        message = params.get("message", "No message provided")
        logger.info(f"Echo task: {message}")
        return {"echo": message}
    
    def handle_status_report(params):
        logger.info("Generating status report")
        return {
            "service": service_name,
            "status": "online",
            "timestamp": datetime.datetime.now().isoformat(),
            "memory_usage": "123MB",
            "cpu_usage": "5%"
        }
    
    # Register task handlers
    orchestrator.register_task_handler("echo", handle_echo_task)
    orchestrator.register_task_handler("status_report", handle_status_report)
    
    # Define some example event handlers
    def handle_system_event(source, payload):
        logger.info(f"System event from {source}: {payload}")
    
    def handle_data_update_event(source, payload):
        logger.info(f"Data update event from {source}: {payload}")
    
    # Register event handlers
    orchestrator.register_event_handler("system", handle_system_event)
    orchestrator.register_event_handler("data_update", handle_data_update_event)
    
    # Start the orchestrator
    orchestrator.start()
    
    try:
        # Run until interrupted
        print_info("Orchestrator running. Press Ctrl+C to stop.")
        
        # Display service menu
        while True:
            print("\nAvailable actions:")
            print("1. Send message")
            print("2. Create task")
            print("3. Emit event")
            print("4. View service statuses")
            print("5. Exit")
            
            choice = input("\nEnter your choice (1-5): ")
            
            if choice == "1":
                recipient = input("Recipient service: ")
                subject = input("Subject: ")
                payload = input("Payload (JSON): ")
                
                try:
                    payload_dict = json.loads(payload) if payload else {}
                except Exception:
                    print_error("Invalid JSON. Using empty payload.")
                    payload_dict = {}
                
                message_id = orchestrator.send_message([recipient], subject, payload_dict)
                if message_id:
                    print_success(f"Message sent with ID: {message_id}")
                else:
                    print_error("Failed to send message")
            
            elif choice == "2":
                task_type = input("Task type: ")
                assigned_to = input("Assigned to service: ")
                payload = input("Parameters (JSON): ")
                
                try:
                    payload_dict = json.loads(payload) if payload else {}
                except Exception:
                    print_error("Invalid JSON. Using empty parameters.")
                    payload_dict = {}
                
                task_id = orchestrator.create_task(task_type, payload_dict, assigned_to)
                if task_id:
                    print_success(f"Task created with ID: {task_id}")
                else:
                    print_error("Failed to create task")
            
            elif choice == "3":
                event_type = input("Event type: ")
                payload = input("Payload (JSON): ")
                
                try:
                    payload_dict = json.loads(payload) if payload else {}
                except Exception:
                    print_error("Invalid JSON. Using empty payload.")
                    payload_dict = {}
                
                event_id = orchestrator.emit_event(event_type, payload_dict)
                if event_id:
                    print_success(f"Event emitted with ID: {event_id}")
                else:
                    print_error("Failed to emit event")
            
            elif choice == "4":
                statuses = orchestrator.get_all_service_statuses()
                
                print_header("Service Statuses")
                
                for status in statuses:
                    service = status.get("service_name", "Unknown")
                    status_text = status.get("status", "Unknown")
                    last_heartbeat = status.get("last_heartbeat", "Never")
                    
                    # Check if service is online based on heartbeat
                    try:
                        heartbeat_time = datetime.datetime.fromisoformat(last_heartbeat.replace("Z", "+00:00"))
                        now = datetime.datetime.now(datetime.timezone.utc)
                        age = (now - heartbeat_time).total_seconds()
                        
                        if age > 120 and status_text == "online":
                            status_text = "stale"
                    except Exception:
                        pass
                    
                    # Print status with appropriate color
                    if status_text == "online":
                        print(f"{Fore.GREEN}{service}{Style.RESET_ALL}: {status_text} (Last heartbeat: {last_heartbeat})")
                    elif status_text == "stale":
                        print(f"{Fore.YELLOW}{service}{Style.RESET_ALL}: {status_text} (Last heartbeat: {last_heartbeat})")
                    else:
                        print(f"{Fore.RED}{service}{Style.RESET_ALL}: {status_text} (Last heartbeat: {last_heartbeat})")
            
            elif choice == "5":
                break
    
    except KeyboardInterrupt:
        print_info("\nReceived interrupt, stopping orchestrator...")
    finally:
        orchestrator.stop()
    
    print_success("Orchestrator stopped")
    return 0

def main():
    """Main function."""
    return run_orchestrator()

if __name__ == "__main__":
    sys.exit(main())