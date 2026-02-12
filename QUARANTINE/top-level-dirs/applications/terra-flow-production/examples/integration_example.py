#!/usr/bin/env python3
"""
Integration Example for Shared Database Architecture

This example demonstrates how to:
1. Connect to the shared database
2. Use service-specific schemas
3. Exchange messages between services
4. Create and process tasks
5. Subscribe to events
6. Maintain service status

You can run this example as different services in separate terminals to see
the interaction between them.
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

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import from tools
from tools.service_orchestrator import ServiceOrchestrator, get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("integration_example")

class IntegrationExample:
    """Example of service integration with shared database."""
    
    def __init__(self, service_name: str, supabase_url: str, supabase_key: str):
        """Initialize the example."""
        # Set the service name in environment
        os.environ["SERVICE_NAME"] = service_name
        self.service_name = service_name
        
        # Connect to Supabase
        self.client = get_supabase_client(supabase_url, supabase_key)
        if not self.client:
            raise RuntimeError("Failed to create Supabase client")
        
        # Create orchestrator
        self.orchestrator = ServiceOrchestrator(self.client)
        
        # Register handlers
        self._register_handlers()
        
        logger.info(f"Integration example initialized for service: {service_name}")
    
    def _register_handlers(self):
        """Register task and event handlers."""
        # Register task handlers
        self.orchestrator.register_task_handler("data_processing", self._handle_data_processing)
        self.orchestrator.register_task_handler("report_generation", self._handle_report_generation)
        
        # Register event handlers
        self.orchestrator.register_event_handler("data_update", self._handle_data_update_event)
        self.orchestrator.register_event_handler("system_alert", self._handle_system_alert_event)
    
    def _handle_data_processing(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a data processing task.
        
        Returns:
            Processing results
        """
        data_id = params.get("data_id")
        logger.info(f"Processing data with ID: {data_id}")
        
        # Simulate processing
        time.sleep(2)
        
        return {
            "status": "success",
            "processed_id": data_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "results": {
                "records_processed": 100,
                "errors": 0
            }
        }
    
    def _handle_report_generation(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a report generation task.
        
        Returns:
            Report generation results
        """
        report_type = params.get("report_type")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        
        logger.info(f"Generating {report_type} report from {start_date} to {end_date}")
        
        # Simulate report generation
        time.sleep(3)
        
        return {
            "status": "success",
            "report_type": report_type,
            "generated_at": datetime.datetime.now().isoformat(),
            "date_range": f"{start_date} to {end_date}",
            "report_url": f"https://example.com/reports/{uuid.uuid4()}.pdf"
        }
    
    def _handle_data_update_event(self, source: str, payload: Dict[str, Any]) -> None:
        """Handle a data update event."""
        data_type = payload.get("data_type")
        record_id = payload.get("record_id")
        
        logger.info(f"Data update from {source}: {data_type} / {record_id}")
        
        # Could perform actions like refreshing caches, updating local data, etc.
    
    def _handle_system_alert_event(self, source: str, payload: Dict[str, Any]) -> None:
        """Handle a system alert event."""
        alert_level = payload.get("level", "info")
        message = payload.get("message", "")
        
        if alert_level == "critical":
            logger.critical(f"CRITICAL ALERT from {source}: {message}")
        elif alert_level == "warning":
            logger.warning(f"WARNING ALERT from {source}: {message}")
        else:
            logger.info(f"System alert from {source}: {message}")
    
    def run_data_query(self) -> None:
        """Run a simple data query example."""
        try:
            # Try to query from core schema
            response = self.client.table("core.properties").select("*").limit(5).execute()
            
            if hasattr(response, 'data') and response.data:
                logger.info(f"Retrieved {len(response.data)} properties from core schema")
                
                # Show a sample record
                if response.data:
                    logger.info(f"Sample property: {json.dumps(response.data[0], indent=2)}")
            else:
                logger.warning("No properties found or query failed")
                
                # Create sample data if schema exists but no data
                try:
                    # Check if table exists
                    schema_query = """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'core' 
                        AND table_name = 'properties'
                    );
                    """
                    
                    schema_response = self.client.sql(schema_query).execute()
                    
                    if hasattr(schema_response, 'data') and schema_response.data and schema_response.data[0]['exists']:
                        logger.info("Creating sample property data...")
                        
                        # Insert sample data
                        sample_data = {
                            "id": str(uuid.uuid4()),
                            "address": "123 Main St",
                            "city": "Anytown",
                            "state": "OR",
                            "zip": "97330",
                            "property_type": "residential",
                            "created_by": self.service_name,
                            "created_at": datetime.datetime.now().isoformat()
                        }
                        
                        self.client.table("core.properties").insert(sample_data).execute()
                        logger.info("Created sample property data")
                except Exception as e:
                    logger.error(f"Error checking or creating sample data: {str(e)}")
        except Exception as e:
            logger.error(f"Error running data query: {str(e)}")
    
    def run_service_specific_query(self) -> None:
        """Run a service-specific schema query example."""
        # Determine schema based on service name
        service_parts = self.service_name.split('_')
        schema_name = service_parts[0] if service_parts else "api"
        
        try:
            # Check if service-specific schema exists
            schema_query = f"""
            SELECT EXISTS (
                SELECT FROM information_schema.schemata 
                WHERE schema_name = '{schema_name}'
            );
            """
            
            schema_response = self.client.sql(schema_query).execute()
            
            if hasattr(schema_response, 'data') and schema_response.data and schema_response.data[0]['exists']:
                logger.info(f"Service-specific schema '{schema_name}' exists")
                
                # Try to create a service-specific table if it doesn't exist
                try:
                    create_table_query = f"""
                    CREATE TABLE IF NOT EXISTS {schema_name}.logs (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        message TEXT NOT NULL,
                        level TEXT NOT NULL,
                        metadata JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                    );
                    """
                    
                    self.client.sql(create_table_query).execute()
                    logger.info(f"Created or verified {schema_name}.logs table")
                    
                    # Insert a log entry
                    log_data = {
                        "message": f"Service {self.service_name} started",
                        "level": "info",
                        "metadata": {
                            "service": self.service_name,
                            "version": "1.0.0",
                            "environment": "development"
                        }
                    }
                    
                    self.client.table(f"{schema_name}.logs").insert(log_data).execute()
                    logger.info("Inserted log entry")
                except Exception as e:
                    logger.error(f"Error creating service-specific table: {str(e)}")
            else:
                logger.warning(f"Service-specific schema '{schema_name}' does not exist")
        except Exception as e:
            logger.error(f"Error checking service-specific schema: {str(e)}")
    
    def start(self) -> None:
        """Start the example."""
        # Start the orchestrator
        self.orchestrator.start()
        
        # Run data query example
        self.run_data_query()
        
        # Run service-specific query example
        self.run_service_specific_query()
        
        logger.info("Integration example started")
    
    def stop(self) -> None:
        """Stop the example."""
        self.orchestrator.stop()
        logger.info("Integration example stopped")
    
    def interactive_loop(self) -> None:
        """Run interactive command loop."""
        print(f"\nService: {self.service_name}")
        print("Type 'help' for available commands")
        
        commands = {
            "help": "Show available commands",
            "status": "Show status of all services",
            "send": "Send a message to another service",
            "task": "Create a task",
            "event": "Emit an event",
            "query": "Run a sample query",
            "quit": "Exit the program"
        }
        
        while True:
            try:
                command = input(f"\n{self.service_name}> ").strip().lower()
                
                if command == "help":
                    print("\nAvailable commands:")
                    for cmd, desc in commands.items():
                        print(f"  {cmd:10} - {desc}")
                
                elif command == "status":
                    statuses = self.orchestrator.get_all_service_statuses()
                    
                    print("\nService Statuses:")
                    for status in statuses:
                        service = status.get("service_name", "Unknown")
                        status_text = status.get("status", "Unknown")
                        last_heartbeat = status.get("last_heartbeat", "Never")
                        
                        print(f"  {service:15} - {status_text} (Last heartbeat: {last_heartbeat})")
                
                elif command == "send":
                    recipient = input("Recipient service: ")
                    subject = input("Subject: ")
                    message = input("Message: ")
                    
                    message_id = self.orchestrator.send_message(
                        [recipient], 
                        subject, 
                        {"message": message}
                    )
                    
                    if message_id:
                        print(f"Message sent with ID: {message_id}")
                    else:
                        print("Failed to send message")
                
                elif command == "task":
                    task_types = ["data_processing", "report_generation"]
                    
                    print("\nAvailable task types:")
                    for i, task_type in enumerate(task_types, 1):
                        print(f"  {i}. {task_type}")
                    
                    choice = input("\nSelect task type (1-2): ")
                    task_type = task_types[int(choice) - 1] if choice.isdigit() and 1 <= int(choice) <= len(task_types) else None
                    
                    if not task_type:
                        print("Invalid task type")
                        continue
                    
                    assigned_to = input("Assigned to service: ")
                    
                    parameters = {}
                    if task_type == "data_processing":
                        parameters["data_id"] = str(uuid.uuid4())
                    elif task_type == "report_generation":
                        parameters["report_type"] = input("Report type (daily/weekly/monthly): ")
                        parameters["start_date"] = input("Start date (YYYY-MM-DD): ")
                        parameters["end_date"] = input("End date (YYYY-MM-DD): ")
                    
                    task_id = self.orchestrator.create_task(
                        task_type,
                        parameters,
                        assigned_to
                    )
                    
                    if task_id:
                        print(f"Task created with ID: {task_id}")
                    else:
                        print("Failed to create task")
                
                elif command == "event":
                    event_types = ["data_update", "system_alert"]
                    
                    print("\nAvailable event types:")
                    for i, event_type in enumerate(event_types, 1):
                        print(f"  {i}. {event_type}")
                    
                    choice = input("\nSelect event type (1-2): ")
                    event_type = event_types[int(choice) - 1] if choice.isdigit() and 1 <= int(choice) <= len(event_types) else None
                    
                    if not event_type:
                        print("Invalid event type")
                        continue
                    
                    payload = {}
                    if event_type == "data_update":
                        payload["data_type"] = input("Data type: ")
                        payload["record_id"] = str(uuid.uuid4())
                        payload["action"] = input("Action (create/update/delete): ")
                    elif event_type == "system_alert":
                        payload["level"] = input("Alert level (info/warning/critical): ")
                        payload["message"] = input("Alert message: ")
                    
                    event_id = self.orchestrator.emit_event(
                        event_type,
                        payload
                    )
                    
                    if event_id:
                        print(f"Event emitted with ID: {event_id}")
                    else:
                        print("Failed to emit event")
                
                elif command == "query":
                    self.run_data_query()
                    self.run_service_specific_query()
                    print("Queries completed - check logs for results")
                
                elif command == "quit":
                    break
                
                else:
                    print(f"Unknown command: {command}")
                    print("Type 'help' for available commands")
            
            except KeyboardInterrupt:
                print("\nUse 'quit' to exit")
            except Exception as e:
                print(f"Error: {str(e)}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Integration Example for Shared Database")
    parser.add_argument("--url", "-u", help="Supabase URL")
    parser.add_argument("--key", "-k", help="Supabase service key")
    parser.add_argument("--service", "-s", required=True, help="Service name")
    args = parser.parse_args()
    
    # Get Supabase credentials
    url = args.url or os.environ.get("SUPABASE_URL")
    key = args.key or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        logger.error(
            "Supabase URL and key are required. "
            "Provide them as arguments or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
        return 1
    
    # Create and run the example
    try:
        example = IntegrationExample(args.service, url, key)
        example.start()
        
        # Run interactive loop
        example.interactive_loop()
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        logger.error(f"Error running example: {str(e)}")
        return 1
    finally:
        if 'example' in locals():
            example.stop()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())