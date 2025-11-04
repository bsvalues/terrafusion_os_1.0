import os
import sys
import subprocess
import time

def run_migration():
    """
    Run Flask-Migrate commands directly using subprocess
    to avoid circular import issues
    """
    print("Setting up database migration...")
    
    # Check if migrations directory exists
    if not os.path.exists('migrations'):
        print("Initializing Flask-Migrate...")
        subprocess.run(['flask', 'db', 'init'], check=True)
        # Give a moment for the file system to update
        time.sleep(1)
    
    print("Creating migration...")
    result = subprocess.run(
        ['flask', 'db', 'migrate', '-m', 'Initial database schema'],
        capture_output=True,
        text=True
    )
    
    print(f"Migration stdout: {result.stdout}")
    if result.stderr:
        print(f"Migration stderr: {result.stderr}")
    
    print("Running migration...")
    result = subprocess.run(
        ['flask', 'db', 'upgrade'],
        capture_output=True,
        text=True
    )
    
    print(f"Upgrade stdout: {result.stdout}")
    if result.stderr:
        print(f"Upgrade stderr: {result.stderr}")
    
    print("Migration process completed")

if __name__ == "__main__":
    run_migration()