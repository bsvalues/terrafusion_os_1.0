"""
Benton County Data Fetcher

This script connects to the Benton County FTP server (ftp.spatialest.com)
and downloads authentic property assessment data for use in the application.
"""
import os
import sys
import ftplib
import logging
import json
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('benton-county-fetcher')

# Output directory for downloaded files
OUTPUT_DIR = os.path.join(os.getcwd(), 'data', 'benton-county')

def ensure_output_dir():
    """Create the output directory if it doesn't exist."""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        logger.info(f"Created output directory: {OUTPUT_DIR}")

def connect_to_ftp():
    """Connect to the Benton County FTP server and return the FTP object."""
    try:
        # Get credentials from environment variables
        ftp_host = "ftp.spatialest.com"
        ftp_user = os.environ.get("FTP_USERNAME")
        ftp_password = os.environ.get("FTP_PASSWORD")
        
        if not ftp_user or not ftp_password:
            logger.error("FTP credentials not found in environment variables.")
            sys.exit(1)
            
        # Connect to FTP server
        logger.info(f"Connecting to FTP server: {ftp_host}")
        ftp = ftplib.FTP(ftp_host)
        ftp.login(ftp_user, ftp_password)
        logger.info("Successfully connected to FTP server.")
        
        return ftp
    except Exception as e:
        logger.error(f"Failed to connect to FTP server: {str(e)}")
        sys.exit(1)

def download_property_data(ftp):
    """Download all property assessment data files from the FTP server."""
    try:
        # First, attempt to navigate to the default directory
        try:
            ftp.cwd('/path/to/live/data')  # Default path from the example
            logger.info("Changed to default data directory.")
        except ftplib.error_perm:
            logger.warning("Default directory not found. Using root directory.")
        
        # List files in current directory
        files = ftp.nlst()
        logger.info(f"Found {len(files)} files on FTP server.")
        
        for file in files:
            # Skip directories and non-data files
            if file.startswith('.') or '.' not in file:
                continue
                
            # Check for property data files
            if file.endswith('.csv') or file.endswith('.json') or file.endswith('.xml'):
                logger.info(f"Downloading file: {file}")
                local_path = os.path.join(OUTPUT_DIR, file)
                
                with open(local_path, 'wb') as f:
                    ftp.retrbinary(f"RETR {file}", f.write)
                
                logger.info(f"Successfully downloaded: {file}")
        
        return True
    except Exception as e:
        logger.error(f"Error downloading property data: {str(e)}")
        return False

def create_metadata():
    """Create a metadata file with download information."""
    metadata = {
        "source": "Benton County, Washington",
        "source_url": "ftp.spatialest.com",
        "download_date": datetime.now().isoformat(),
        "files": os.listdir(OUTPUT_DIR)
    }
    
    metadata_path = os.path.join(OUTPUT_DIR, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Created metadata file: {metadata_path}")

def main():
    """Main function to fetch Benton County property data."""
    logger.info("Starting Benton County data fetch process.")
    
    ensure_output_dir()
    ftp = connect_to_ftp()
    success = download_property_data(ftp)
    
    try:
        ftp.quit()
        logger.info("FTP connection closed.")
    except:
        pass
    
    if success:
        create_metadata()
        logger.info("Successfully fetched Benton County property data.")
        return True
    else:
        logger.error("Failed to fetch Benton County property data.")
        return False

if __name__ == "__main__":
    main()