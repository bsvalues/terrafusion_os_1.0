#!/usr/bin/env python3
"""
Supabase Storage Setup Script

This script sets up the necessary storage buckets in Supabase for the application.
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("supabase_storage")

# Import Supabase
try:
    from supabase import create_client, Client
except ImportError:
    logger.error("❌ Supabase package not installed. Run: pip install supabase")
    sys.exit(1)

# Import environment setup
from set_supabase_env import ensure_supabase_env

# Storage buckets to create
BUCKETS = [
    {"name": "documents", "public": False},
    {"name": "maps", "public": True},
    {"name": "images", "public": True},
    {"name": "exports", "public": False}
]

def get_supabase_client() -> Optional[Client]:
    """Get Supabase client with credentials from environment."""
    supabase_config = ensure_supabase_env()
    
    if not supabase_config["url"] or not supabase_config["key"]:
        logger.error("❌ Missing Supabase credentials")
        return None
    
    try:
        logger.info(f"Connecting to Supabase at {supabase_config['url']}")
        client = create_client(supabase_config["url"], supabase_config["key"])
        return client
    except Exception as e:
        logger.error(f"❌ Failed to create Supabase client: {str(e)}")
        return None

def create_storage_buckets(client: Client) -> bool:
    """Create storage buckets."""
    success = True
    
    try:
        # List existing buckets
        existing_buckets = client.storage.list_buckets()
        existing_bucket_names = [b["name"] for b in existing_buckets]
        logger.info(f"Found {len(existing_bucket_names)} existing buckets: {', '.join(existing_bucket_names)}")
        
        for bucket in BUCKETS:
            if bucket["name"] in existing_bucket_names:
                logger.info(f"Bucket {bucket['name']} already exists")
                continue
            
            # Create bucket
            logger.info(f"Creating bucket: {bucket['name']} (public: {bucket['public']})")
            try:
                # Format the options differently - plain strings for params
                public_option = "true" if bucket["public"] else "false"
                client.storage.create_bucket(
                    bucket["name"],
                    {"public": public_option}
                )
                logger.info(f"✅ Created bucket {bucket['name']}")
            except Exception as e:
                logger.error(f"Error creating bucket {bucket['name']}: {str(e)}")
                # Try alternative approach
                logger.info(f"Trying alternative approach for bucket {bucket['name']}")
                try:
                    # Try just sending the name
                    client.storage.create_bucket(
                        id=bucket["name"]
                    )
                    logger.info(f"✅ Created bucket {bucket['name']} (without public option)")
                except Exception as e2:
                    logger.error(f"Alternative approach also failed: {str(e2)}")
                    success = False
    
    except Exception as e:
        logger.error(f"❌ Error creating storage buckets: {str(e)}")
        success = False
    
    return success

def setup_storage():
    """Main setup function."""
    logger.info("=== Supabase Storage Setup ===")
    
    # Get Supabase client
    client = get_supabase_client()
    if not client:
        logger.error("Cannot proceed without Supabase client")
        return False
    
    success = create_storage_buckets(client)
    
    if success:
        logger.info("✅ Storage setup completed successfully!")
        return True
    else:
        logger.warning("⚠️ Storage setup completed with errors. Review the log for details.")
        return False

if __name__ == "__main__":
    if setup_storage():
        sys.exit(0)
    else:
        sys.exit(1)