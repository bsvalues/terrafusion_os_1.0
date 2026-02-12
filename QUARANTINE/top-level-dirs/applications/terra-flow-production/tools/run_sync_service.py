#!/usr/bin/env python3
"""
Data Sync Service for GeoAssessmentPro

This script runs the DataSyncAgent as a long-running service, monitoring
the source database for changes and syncing them to Supabase.

Usage:
  python run_sync_service.py --config sync_config.json
"""

import os
import sys
import signal
import asyncio
import logging
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'sync_service.log'))
    ]
)
logger = logging.getLogger("sync_service")

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the sync agent
try:
    from sync_agent import DataSyncAgent
except ImportError:
    logger.error("Failed to import DataSyncAgent. Make sure sync_agent.py is in the same directory.")
    sys.exit(1)

# Global variables
agent = None
stop_event = None

async def run_service(config_path: str):
    """Run the data sync service."""
    global agent
    
    # Create the sync agent
    agent = DataSyncAgent(config_path)
    
    # Initialize the agent
    if not await agent.initialize():
        logger.error("Failed to initialize Data Sync Agent")
        return False
    
    # Run the sync monitor
    logger.info("Starting data sync service...")
    await agent.monitor_and_sync()
    
    return True

async def shutdown(signal_event=None):
    """Gracefully shut down the service."""
    global agent, stop_event
    
    if signal_event:
        logger.info(f"Received signal {signal_event.name}...")
    else:
        logger.info("Shutting down...")
    
    # Stop the sync agent
    if agent:
        await agent.stop()
    
    # Set the stop event
    if stop_event:
        stop_event.set()

def handle_signal(signal_name):
    """Handle signals for graceful shutdown."""
    loop = asyncio.get_running_loop()
    loop.create_task(shutdown(signal_name))

async def main_async():
    """Async main entry point."""
    global stop_event
    
    parser = argparse.ArgumentParser(description="Run the data sync service")
    parser.add_argument("--config", "-c", required=True, help="Path to the configuration file")
    args = parser.parse_args()
    
    # Set up signal handlers
    loop = asyncio.get_running_loop()
    for signal_name in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(signal_name, lambda s=signal_name: handle_signal(s))
    
    # Create a stop event
    stop_event = asyncio.Event()
    
    # Start the service
    run_task = asyncio.create_task(run_service(args.config))
    
    # Wait for the stop event or for the service to exit
    try:
        await asyncio.wait([run_task, asyncio.create_task(stop_event.wait())], return_when=asyncio.FIRST_COMPLETED)
    except asyncio.CancelledError:
        pass
    
    # Clean up
    if not run_task.done():
        run_task.cancel()
        try:
            await run_task
        except asyncio.CancelledError:
            pass
    
    logger.info("Service stopped")
    return 0

def main():
    """Main entry point."""
    try:
        return asyncio.run(main_async())
    except KeyboardInterrupt:
        logger.info("Service interrupted by user")
        return 0
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())