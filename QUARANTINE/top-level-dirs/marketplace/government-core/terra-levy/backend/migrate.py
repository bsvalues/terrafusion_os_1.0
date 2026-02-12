"""
Database migration CLI for the Levy Calculation Application.

This script provides command-line utilities for managing database migrations
using Flask-Migrate.

Usage:
    flask --app migrate db init      # Initialize migrations repository
    flask --app migrate db migrate   # Generate a migration with message: -m "message"
    flask --app migrate db upgrade   # Apply migrations to the database
    flask --app migrate db downgrade # Revert migrations
    flask --app migrate db --help    # Show available commands
    
    # Shorthand commands:
    python migrate.py init      # Initialize migrations repository
    python migrate.py migrate   # Generate a migration
    python migrate.py upgrade   # Apply migrations to the database
    python migrate.py downgrade # Revert migrations
"""

import os
import sys
import logging
import click
from flask import Flask
from flask_migrate import Migrate

from app import app, db, migrate

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Shorthand commands for common migration tasks
@click.group()
def cli():
    """Manage database migrations for the Levy Calculation Application."""
    pass

@cli.command()
def init():
    """Initialize migrations repository."""
    logger.info("Initializing migrations repository")
    os.system('flask --app migrate db init')

@cli.command()
@click.option('-m', '--message', help='Migration message')
def migrate(message):
    """Generate a migration script."""
    command = 'flask --app migrate db migrate'
    if message:
        command += f' -m "{message}"'
    logger.info(f"Generating migration: {command}")
    os.system(command)

@cli.command()
def upgrade():
    """Apply migrations to the database."""
    logger.info("Applying migrations")
    os.system('flask --app migrate db upgrade')

@cli.command()
def downgrade():
    """Revert migrations."""
    logger.info("Reverting migrations")
    os.system('flask --app migrate db downgrade')

@cli.command()
def current():
    """Display the current migration version."""
    logger.info("Showing current migration version")
    os.system('flask --app migrate db current')

@cli.command()
def history():
    """Display migration history."""
    logger.info("Showing migration history")
    os.system('flask --app migrate db history')

if __name__ == '__main__':
    cli()