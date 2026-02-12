#!/usr/bin/env python3
"""
Easy Connect Script for Shared Supabase Database

This script provides a one-step setup for connecting applications and AI agents
to the shared Supabase database. It handles:

1. Environment setup
2. Service registration
3. Connection testing
4. Basic data access examples

Run this script with:
python easy_connect.py --service your_service_name

The script will guide you through the rest of the process.
"""

import os
import sys
import logging
import json
import argparse
import time
import getpass
from typing import Dict, Any, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("easy_connect")

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

# Try to import supabase
try:
    from supabase import Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed.")
    print("Installing the Supabase package...")
    import subprocess
    subprocess.call([sys.executable, "-m", "pip", "install", "supabase"])
    print("Please restart this script after installation.")
    sys.exit(1)

# Try to import our centralized client management
try:
    from supabase_client import get_supabase_client, release_supabase_client
    CENTRAL_CLIENT_AVAILABLE = True
except ImportError:
    CENTRAL_CLIENT_AVAILABLE = False
    logger.warning("❗ Centralized Supabase client management not available. Falling back to direct client creation.")
    try:
        from supabase import create_client
    except ImportError:
        logger.error("❌ Failed to import create_client from Supabase package.")
        sys.exit(1)

# Valid service types
VALID_SERVICES = [
    "gis_service", 
    "valuation_service", 
    "sync_service", 
    "analytics_service", 
    "external_app",
    "ai_agent"
]

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

def setup_environment(service_name: str) -> bool:
    """
    Set up environment variables for the service.
    
    Returns:
        True if setup was successful, False otherwise
    """
    print_header("Setting Up Environment")
    
    # Check if env vars already exist
    existing_url = os.environ.get("SUPABASE_URL")
    existing_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    
    if existing_url and existing_key:
        print_info("Supabase environment variables are already set.")
        print(f"  SUPABASE_URL: {existing_url}")
        print(f"  SUPABASE_KEY: {'*' * 10 + existing_key[-5:] if existing_key else 'Not set'}")
        
        use_existing = input("\nUse these existing credentials? (y/n): ").lower() == 'y'
        if use_existing:
            return True
    
    # Get new credentials
    print_info("Please enter your Supabase credentials:")
    
    supabase_url = input("Supabase URL (https://your-project-id.supabase.co): ")
    supabase_key = getpass.getpass("Supabase Service Key: ")
    
    if not supabase_url or not supabase_key:
        print_error("URL and key are required.")
        return False
    
    # Set environment variables
    os.environ["SUPABASE_URL"] = supabase_url
    os.environ["SUPABASE_SERVICE_KEY"] = supabase_key
    
    # Set service-specific environment variable
    if service_name:
        env_prefix = service_name.upper().replace("_SERVICE", "")
        os.environ[f"{env_prefix}_SUPABASE_KEY"] = supabase_key
        os.environ["SERVICE_NAME"] = service_name
    
    print_success("Environment variables set successfully.")
    
    # Save to .env file
    save_to_env = input("\nSave these credentials to .env file for future use? (y/n): ").lower() == 'y'
    if save_to_env:
        try:
            with open(".env", "w") as f:
                f.write(f"SUPABASE_URL={supabase_url}\n")
                f.write(f"SUPABASE_SERVICE_KEY={supabase_key}\n")
                if service_name:
                    f.write(f"{env_prefix}_SUPABASE_KEY={supabase_key}\n")
                    f.write(f"SERVICE_NAME={service_name}\n")
            
            print_success("Credentials saved to .env file.")
            
            # Check if python-dotenv is installed
            try:
                import dotenv
                print_info("python-dotenv is installed. You can use it to load the .env file in your application.")
            except ImportError:
                print_warning("python-dotenv is not installed. Install it with 'pip install python-dotenv' to easily load .env files.")
        except Exception as e:
            print_error(f"Error saving to .env file: {str(e)}")
    
    return True

def test_connection(service_name: str) -> Optional[Client]:
    """
    Test the connection to Supabase.
    
    Returns:
        Supabase client if connection is successful, None otherwise
    """
    print_header("Testing Supabase Connection")
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print_error("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.")
        return None
    
    client = None
    try:
        # Get client using centralized management if available
        print_info(f"Connecting to Supabase as '{service_name}'...")
        try:
            if CENTRAL_CLIENT_AVAILABLE:
                from supabase_client import get_supabase_client as central_get_client
                client = central_get_client('development')
            else:
                # Fallback to direct creation
                from supabase import create_client
                client = create_client(url, key)
        except ImportError as import_error:
            print_warning(f"Import error: {str(import_error)}")
            # Last resort fallback if imports fail
            from supabase import create_client
            client = create_client(url, key)
        
        if not client:
            print_error("Failed to create Supabase client.")
            return None
            
        # Set app name for audit logging
        try:
            client.sql(f"SET app.service_name TO '{service_name}';").execute()
        except Exception as e:
            print_warning(f"Could not set app.service_name (not critical): {str(e)}")
        
        # Test simple query
        print_info("Testing simple query...")
        response = client.table("information_schema.tables").select("table_name").limit(1).execute()
        
        if hasattr(response, 'data'):
            print_success("Connection successful!")
            print(f"  Sample data: {response.data}")
            return client
        else:
            print_error("Connection test failed: Invalid response")
            return None
    except Exception as e:
        print_error(f"Connection test failed: {str(e)}")
        return None
    finally:
        # Only release the client if we're using centralized management and the client was created
        if CENTRAL_CLIENT_AVAILABLE and client:
            try:
                from supabase_client import release_supabase_client as central_release_client
                central_release_client(client)
                print_info("Released Supabase client back to connection pool.")
            except Exception as e_release:
                print_warning(f"Failed to release Supabase client: {str(e_release)}")

def create_service_files(service_name: str) -> bool:
    """
    Create service-specific files for easy integration.
    
    Returns:
        True if files were created successfully, False otherwise
    """
    print_header("Creating Service Files")
    
    try:
        # Create a basic service client file
        with open(f"{service_name}_client.py", "w") as f:
            f.write(f"""#!/usr/bin/env python3
\"\"\"
{service_name.replace('_', ' ').title()} Supabase Client

This module provides an easy way to connect to the shared Supabase database
from the {service_name.replace('_', ' ').title()}.
\"\"\"

import os
import logging
import json
from typing import Dict, Any, List, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("{service_name}")

# Try to import supabase
try:
    from supabase import Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("Supabase package not installed. Install with: pip install supabase")

# Try to import centralized client management
try:
    from supabase_client import get_supabase_client, release_supabase_client
    CENTRAL_CLIENT_AVAILABLE = True
except ImportError:
    CENTRAL_CLIENT_AVAILABLE = False
    logger.warning("Centralized client management not available. Using direct connection.")
    try:
        from supabase import create_client
    except ImportError:
        logger.error("Failed to import create_client from supabase")

def get_client() -> Optional[Client]:
    \"\"\"
    Get a Supabase client configured for this service.
    
    Returns:
        Configured Supabase client or None if configuration failed
    \"\"\"
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase package is not available")
        return None
    
    client = None
    try:
        # Try to use centralized client management if available
        if CENTRAL_CLIENT_AVAILABLE:
            # Get the environment from env vars or default to development
            environment = os.environ.get("SUPABASE_ENVIRONMENT", "development")
            logger.info(f"Using centralized client management for environment: {{environment}}")
            client = get_supabase_client(environment)
            
            if client:
                logger.info("Successfully connected to Supabase using centralized client management")
            else:
                logger.warning("Failed to get client from centralized management, falling back to direct creation")
        
        # Fall back to direct client creation if needed
        if not client:
            # Check for service-specific environment variables first
            env_prefix = "{service_name.upper().replace('_SERVICE', '')}"
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get(f"{{env_prefix}}_SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
            
            if not url or not key:
                logger.error("Missing Supabase URL or key")
                return None
            
            try:
                # Create the client directly
                client = create_client(url, key)
            except Exception as e:
                logger.error(f"Error creating Supabase client directly: {{str(e)}}")
                return None
        
        # Set the application name to identify the service in audit logs
        if client:
            try:
                client.postgrest.request_builder.session.headers.update({{
                    "X-Application-Name": "{service_name}"
                }})
                
                # Execute setup query to set the application name in the connection
                client.sql(f"SET app.service_name TO '{service_name}';").execute()
            except Exception as e:
                logger.warning(f"Could not set app.service_name (not critical): {{str(e)}}")
        
        logger.info("Successfully connected to Supabase")
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {{str(e)}}")
        return None
        
def release_client(client: Optional[Client]) -> None:
    \"\"\"
    Release a Supabase client back to the connection pool.
    
    Args:
        client: The client to release
    \"\"\"
    if client and CENTRAL_CLIENT_AVAILABLE:
        try:
            release_supabase_client(client)
            logger.info("Released Supabase client back to connection pool")
        except Exception as e:
            logger.warning(f"Failed to release Supabase client: {{str(e)}}")
            # Continue even if release fails

def execute_with_client(operation, *args, **kwargs):
    \"\"\"
    Execute an operation with a properly managed Supabase client.
    
    Args:
        operation: Function that takes client as first arg
        *args: Additional args for operation
        **kwargs: Additional kwargs for operation
        
    Returns:
        Result of the operation
    \"\"\"
    client = None
    try:
        client = get_client()
        if not client:
            logger.error("Failed to get Supabase client")
            return None
            
        return operation(client, *args, **kwargs)
    except Exception as e:
        logger.error(f"Error executing operation: {{str(e)}}")
        return None
    finally:
        if client:
            try:
                release_client(client)
            except Exception as e:
                logger.error(f"Error releasing client: {{str(e)}}")

# Example usage
def run_example_query():
    \"\"\"Run an example query to demonstrate usage.\"\"\"
    def _query_operation(client):
        # Run a simple query
        response = client.table("core.properties").select("*").limit(5).execute()
        
        if hasattr(response, 'data'):
            logger.info(f"Query returned {{len(response.data)}} results")
            logger.info(f"Sample data: {{json.dumps(response.data[0], indent=2) if response.data else 'No data'}}")
            return response.data
        else:
            logger.error("Query returned invalid response")
            return None
    
    # Execute with proper client lifecycle management
    return execute_with_client(_query_operation)

if __name__ == "__main__":
    # Run the example when the script is executed directly
    run_example_query()
""")
        
        print_success(f"Created {service_name}_client.py")
        
        # Create a starter application file
        with open(f"{service_name}_app.py", "w") as f:
            f.write(f"""#!/usr/bin/env python3
\"\"\"
{service_name.replace('_', ' ').title()} Application

This is a starter application for the {service_name.replace('_', ' ').title()}.
It connects to the shared Supabase database and demonstrates basic operations.
\"\"\"

import os
import logging
import json
import time
import threading
from typing import Dict, Any, List, Optional

# Import the client
from {service_name}_client import get_client, release_client

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("{service_name}_app")

class {service_name.replace('_', ' ').title().replace(' ', '')}App:
    \"\"\"Example application for {service_name}.\"\"\"
    
    def __init__(self):
        \"\"\"Initialize the application.\"\"\"
        self.running = False
        self.channel = None
    
    def start(self):
        \"\"\"Start the application.\"\"\"
        # Application can start without needing to acquire a persistent client
        # We'll use execute_with_client for each individual operation
        self.running = True
        logger.info("Application started")
        
        # Example: Subscribe to changes
        self._setup_realtime_subscription()
        
        # Example: Run a query
        self._run_sample_query()
    
    def stop(self):
        \"\"\"Stop the application.\"\"\"
        self.running = False
        logger.info("Application stopped")
        
        # No need to release client as we're using execute_with_client pattern
        # which handles client lifecycle for each operation
        
        # Clean up any persistent resources
        if hasattr(self, 'channel') and self.channel:
            try:
                # Unsubscribe from realtime channel if exists
                self.channel.unsubscribe()
                logger.info("Unsubscribed from realtime channel")
            except Exception as e:
                logger.error(f"Error unsubscribing from channel: {str(e)}")
    
    def _setup_realtime_subscription(self):
        \"\"\"Set up realtime subscription for database changes.\"\"\"
        from {service_name}_client import execute_with_client
        
        def _subscription_operation(client):
            try:
                channel = client.channel("db-changes")
                channel.on(
                    'postgres_changes',
                    {{'event': '*', 'schema': 'core', 'table': 'properties'}},
                    lambda payload: self._handle_property_change(payload)
                ).subscribe()
                
                logger.info("Subscribed to property changes")
                # Save the channel to the instance
                self.channel = channel
                return channel
            except Exception as e:
                logger.error(f"Error setting up realtime subscription: {{str(e)}}")
                return None
                
        # Execute with proper client lifecycle management
        return execute_with_client(_subscription_operation)
    
    def _handle_property_change(self, payload):
        \"\"\"Handle property change notification.\"\"\"
        logger.info(f"Property change detected: {{payload}}")
        # In a real application, you would process the change here
    
    def _run_sample_query(self):
        \"\"\"Run a sample query to demonstrate database access.\"\"\"
        from {service_name}_client import execute_with_client
        
        # Define operation function for client use
        def _query_operation(client):
            try:
                # Query properties
                response = client.table("core.properties").select("*").limit(5).execute()
                
                if hasattr(response, 'data') and response.data:
                    logger.info(f"Found {{len(response.data)}} properties")
                    
                    # Example: Cross-schema query using a function
                    if response.data:
                        property_id = response.data[0]['id']
                        property_detail = client.rpc('core.get_property_with_valuation', {{'property_id': property_id}}).execute()
                        
                        logger.info(f"Retrieved detailed property information: {{property_detail.data}}")
                    return response.data
                else:
                    logger.warning("No properties found or query failed")
                    return None
            except Exception as e:
                logger.error(f"Error running sample query: {{str(e)}}")
                return None
        
        # Use the client from execute_with_client for proper connection lifecycle
        return execute_with_client(_query_operation)

def execute_with_client(operation, *args, **kwargs):
    \"\"\"
    Execute an operation with a properly managed Supabase client.
    
    Args:
        operation: Function that takes client as first arg
        *args: Additional args for operation
        **kwargs: Additional kwargs for operation
        
    Returns:
        Result of the operation
    \"\"\"
    client = None
    try:
        client = get_client()
        if not client:
            logger.error("Failed to get Supabase client")
            return None
            
        return operation(client, *args, **kwargs)
    except Exception as e:
        logger.error(f"Error executing operation: {str(e)}")
        return None
    finally:
        if client:
            try:
                release_client(client)
            except Exception as e:
                logger.error(f"Error releasing client: {str(e)}")

def main():
    \"\"\"Main application entry point.\"\"\"
    app = {service_name.replace('_', ' ').title().replace(' ', '')}App()
    app.start()
    
    try:
        # Keep running until interrupted
        while app.running:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Received interrupt, stopping application...")
    finally:
        app.stop()
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
""")
        
        print_success(f"Created {service_name}_app.py")
        
        # Create a basic README file
        with open(f"{service_name}_README.md", "w") as f:
            f.write(f"""# {service_name.replace('_', ' ').title()}

This is a starter package for the {service_name.replace('_', ' ').title()} that interacts with the
shared Supabase database.

## Files

- `{service_name}_client.py`: Client module for connecting to the shared database
- `{service_name}_app.py`: Example application demonstrating database operations

## Getting Started

1. Make sure Supabase credentials are set up:
   ```
   export SUPABASE_URL=https://your-project-id.supabase.co
   export SUPABASE_SERVICE_KEY=your-service-key
   ```

2. Run the example application:
   ```
   python {service_name}_app.py
   ```

## Database Access

This service has access to:

- Its own schema: `{service_name.split('_')[0]}.*`
- Core data: `core.*`
- API endpoints: `api.*`
- Cross-schema functions

## Integration with Other Services

This service can interact with other services through:

1. Cross-schema functions in the database
2. Realtime subscription for change notifications
3. Shared API views

For more information, see the [Application Integration Guide](../docs/application_integration_guide.md).
""")
        
        print_success(f"Created {service_name}_README.md")
        
        print_info("\nSuccessfully created service files. To get started:")
        print(f"  1. Review {service_name}_README.md")
        print(f"  2. Run python {service_name}_client.py to test the connection")
        print(f"  3. Run python {service_name}_app.py to start the example application")
        
        return True
    except Exception as e:
        print_error(f"Error creating service files: {str(e)}")
        return False

def show_example_queries(client: Client, service_name: str) -> None:
    """Show example queries for this service."""
    print_header("Example Database Queries")
    
    print_info("Here are some example queries you can run with this service:")
    
    # Determine examples based on service type
    service_type = service_name.split('_')[0] if '_' in service_name else service_name
    
    try:
        # Core data example
        print("\n1. Query core data:")
        response = client.table("core.properties").select("*").limit(3).execute()
        print(f"   client.table(\"core.properties\").select(\"*\").limit(3)")
        if hasattr(response, 'data'):
            print(f"   Result: {len(response.data)} records found")
        
        # Schema-specific example
        print(f"\n2. Access {service_type}-specific data:")
        
        if service_type == "gis":
            print(f"   client.table(\"gis.property_geometries\").select(\"*\").limit(3)")
        elif service_type == "valuation":
            print(f"   client.table(\"valuation.assessments\").select(\"*\").limit(3)")
        elif service_type == "analytics":
            print(f"   client.table(\"analytics.reports\").select(\"*\").limit(3)")
        elif service_type == "sync":
            print(f"   client.table(\"sync.jobs\").select(\"*\").limit(3)")
        else:
            print(f"   client.table(\"api.properties\").select(\"*\").limit(3)")
        
        # Cross-schema function example
        print("\n3. Use cross-schema function:")
        print(f"   client.rpc(\"core.get_property_with_valuation\", {{\"property_id\": \"some-id\"}})")
        
        # Realtime subscription example
        print("\n4. Subscribe to database changes:")
        print("""   channel = client.channel("db-changes")
   channel.on(
       'postgres_changes',
       {'event': '*', 'schema': 'core', 'table': 'properties'},
       lambda payload: print(f"Change received: {payload}")
   ).subscribe()""")
        
    except Exception as e:
        print_warning(f"Error running example queries: {str(e)}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Easy setup for connecting to the shared Supabase database")
    parser.add_argument("--service", "-s", required=True, help="Service name (e.g., gis_service, valuation_service)")
    parser.add_argument("--env-only", "-e", action="store_true", help="Only set up environment variables")
    parser.add_argument("--skip-files", "-f", action="store_true", help="Skip creating service files")
    args = parser.parse_args()
    
    service_name = args.service.lower()
    
    # Check if service name is valid
    if service_name not in VALID_SERVICES and not service_name.endswith('_service'):
        close_matches = [s for s in VALID_SERVICES if service_name in s]
        if close_matches:
            print_warning(f"Service name '{service_name}' is not recognized. Did you mean one of these? {', '.join(close_matches)}")
        else:
            print_warning(f"Service name '{service_name}' is not one of the standard services: {', '.join(VALID_SERVICES)}")
        
        proceed = input("Continue anyway? (y/n): ").lower() == 'y'
        if not proceed:
            return 1
    
    print_header(f"Easy Connect: {service_name.replace('_', ' ').title()}")
    
    # Step 1: Set up environment
    env_success = setup_environment(service_name)
    if not env_success:
        print_error("Failed to set up environment variables.")
        return 1
    
    if args.env_only:
        print_success("Environment setup completed successfully.")
        return 0
    
    # Step 2: Test connection
    client = test_connection(service_name)
    if not client:
        print_error("Failed to connect to Supabase.")
        return 1
    
    # Step 3: Show example queries
    show_example_queries(client, service_name)
    
    # Step 4: Create service files
    if not args.skip_files:
        files_success = create_service_files(service_name)
        if not files_success:
            print_warning("Failed to create service files.")
    
    print_header("Setup Complete")
    print_success(f"Your {service_name.replace('_', ' ').title()} is now connected to the shared database!")
    print_info("You can now start building your application using the Supabase client.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())