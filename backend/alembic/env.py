"""
Alembic environment configuration for async SQLAlchemy
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool

from alembic import context

# Import database models and configuration
from app.database.connection import Base
from app.database.models import ResearchMemory, UserPreferences, ConversationHistory
from app.config import get_settings

settings = get_settings()

# Alembic Config object
config = context.config

# Override sqlalchemy.url from settings
# Convert async URL to sync URL for Alembic and handle SSL parameters
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

# Handle SSL parameter for psycopg2 (convert ?ssl=require to ?sslmode=require)
if "?ssl=require" in database_url:
    database_url = database_url.replace("?ssl=require", "?sslmode=require")
elif "&ssl=require" in database_url:
    database_url = database_url.replace("&ssl=require", "&sslmode=require")

config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
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
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
