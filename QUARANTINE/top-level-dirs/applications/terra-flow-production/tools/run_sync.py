#!/usr/bin/env python3
"""
Run Sync Script for GeoAssessmentPro

This script provides a simplified interface to run a data sync operation
using the sync_agent.py module.

Usage:
  python run_sync.py --config sync_config.json [--incremental] [--dry-run]
"""

import os
import sys
import argparse
import asyncio
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger("run_sync")

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the sync agent
try:
    from sync_agent import DataSyncAgent
except ImportError:
    logger.error("Failed to import DataSyncAgent. Make sure sync_agent.py is in the same directory.")
    sys.exit(1)

async def run_sync(config_path: str, incremental: bool = True, dry_run: bool = False):
    """Run a data sync operation."""
    # Create the sync agent
    agent = DataSyncAgent(config_path)
    
    # Initialize the agent
    if not await agent.initialize():
        logger.error("Failed to initialize Data Sync Agent")
        return False
    
    # Run the sync
    mode = "incremental" if incremental else "full"
    status = "DRY RUN" if dry_run else "LIVE"
    logger.info(f"Running {status} {mode} sync...")
    
    results = await agent.run_sync(incremental=incremental, dry_run=dry_run)
    
    # Check results
    if results["success"]:
        if dry_run:
            logger.info(f"[DRY RUN] Would migrate {results['records_migrated']} records")
            if incremental and "records_updated" in results:
                logger.info(f"[DRY RUN] Would update {results.get('records_updated', 0)} records")
        else:
            logger.info(f"Successfully migrated {results['records_migrated']} records")
            if incremental and "records_updated" in results:
                logger.info(f"Updated {results.get('records_updated', 0)} records")
        
        return True
    else:
        logger.error(f"Sync failed: {results.get('error', 'Unknown error')}")
        return False

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run a data sync operation")
    parser.add_argument("--config", "-c", required=True, help="Path to the configuration file")
    parser.add_argument("--incremental", "-i", action="store_true", help="Run incremental sync (default)")
    parser.add_argument("--full", "-f", action="store_true", help="Run full sync")
    parser.add_argument("--dry-run", "-d", action="store_true", help="Dry run (no changes)")
    args = parser.parse_args()
    
    # Determine sync mode
    incremental = True
    if args.full:
        incremental = False
    elif args.incremental:
        incremental = True
    
    # Run the sync
    result = asyncio.run(run_sync(args.config, incremental=incremental, dry_run=args.dry_run))
    
    return 0 if result else 1

if __name__ == "__main__":
    sys.exit(main())