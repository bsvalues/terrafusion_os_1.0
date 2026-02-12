"""
Script to set up PACMLS credentials for the TerraMiner application.

This script updates the .env file with the provided PACMLS credentials.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_pacmls_credentials(username, password):
    """
    Set up PACMLS credentials by adding them to the .env file.
    
    Args:
        username (str): PACMLS username/email
        password (str): PACMLS password
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Load existing environment variables
        load_dotenv()
        
        # Check if credentials are already set
        existing_username = os.environ.get('PACMLS_USERNAME')
        existing_password = os.environ.get('PACMLS_PASSWORD')
        
        if existing_username and existing_password:
            logger.info("PACMLS credentials are already set")
            
            # Confirm if user wants to update
            response = input("PACMLS credentials already exist. Update? (y/n): ").strip().lower()
            if response != 'y':
                logger.info("Keeping existing credentials")
                return True
        
        # Path to .env file
        env_path = os.path.join(os.getcwd(), '.env')
        
        # Read existing content
        env_content = ""
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_content = f.read()
        
        # Check if the variables already exist in the file
        lines = env_content.splitlines()
        new_lines = []
        username_added = False
        password_added = False
        
        for line in lines:
            if line.startswith('PACMLS_USERNAME='):
                new_lines.append(f'PACMLS_USERNAME={username}')
                username_added = True
            elif line.startswith('PACMLS_PASSWORD='):
                new_lines.append(f'PACMLS_PASSWORD={password}')
                password_added = True
            else:
                new_lines.append(line)
        
        # Add credentials if not already in the file
        if not username_added:
            new_lines.append(f'PACMLS_USERNAME={username}')
        if not password_added:
            new_lines.append(f'PACMLS_PASSWORD={password}')
        
        # Write updated content back to .env file
        with open(env_path, 'w') as f:
            f.write('\n'.join(new_lines))
        
        logger.info("PACMLS credentials added to .env file")
        return True
    
    except Exception as e:
        logger.error(f"Error setting up PACMLS credentials: {e}")
        return False

def main():
    """Main function to set up PACMLS credentials."""
    print("PACMLS Credentials Setup")
    print("=======================")
    print("This script sets up your Paragon Connect MLS credentials.")
    print("These credentials will be stored in your .env file.")
    print()
    
    # Get credentials from command line args or prompt
    if len(sys.argv) >= 3:
        username = sys.argv[1]
        password = sys.argv[2]
    else:
        username = input("Enter your PACMLS Username: ").strip()
        password = input("Enter your PACMLS Password: ").strip()
    
    if not username or not password:
        logger.error("Both username and password are required")
        return 1
    
    # Set up credentials
    success = setup_pacmls_credentials(username, password)
    
    if success:
        print("\nPACMLS credentials have been successfully set up!")
        print("You can now use the PACMLS data source in TerraMiner.")
        return 0
    else:
        print("\nFailed to set up PACMLS credentials.")
        print("Please check the logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())