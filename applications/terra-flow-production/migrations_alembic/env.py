from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
import os
import sys
from logging.config import fileConfig

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from app import db
    from models import *
    print("Successfully imported models")
except Exception as e:
    print(f"Error importing models: {e}")
    raise

target_metadata = db.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url() -> str:
    """Get the appropriate database URL based on the environment"""
    # Check for environment mode
    env_mode = os.environ.get("ENV_MODE", "development").lower()
    
    # Try environment-specific URLs first
    if env_mode == "training":
        url = os.environ.get("DATABASE_URL_TRAINING")
        if url:
            print(f"Using DATABASE_URL_TRAINING for {env_mode} environment")
            return url
    elif env_mode == "production":
        url = os.environ.get("DATABASE_URL_PRODUCTION")
        if url:
            print(f"Using DATABASE_URL_PRODUCTION for {env_mode} environment")
            return url
    
    # Try environment-specific suffix next
    env_suffix = "_" + env_mode.upper() if env_mode != "development" else ""
    url = os.environ.get(f"DATABASE_URL{env_suffix}")
    if url:
        print(f"Using DATABASE_URL{env_suffix} for {env_mode} environment")
        return url
    
    # Fall back to generic DATABASE_URL
    url = os.environ.get("DATABASE_URL")
    if url:
        print(f"Using DATABASE_URL for {env_mode} environment")
        return url
    
    # Last resort - use the URL from alembic.ini
    url = config.get_main_option("sqlalchemy.url")
    print(f"Using sqlalchemy.url from alembic.ini for {env_mode} environment")
    return url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Override sqlalchemy.url with the appropriate database URL
    configuration = config.get_section(config.config_ini_section, {})
    configuration['sqlalchemy.url'] = get_database_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            compare_type=True,  # Compare column types on autogenerate
            compare_server_default=True  # Compare server defaults on autogenerate
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
