"""Add quality alert table

Revision ID: 02_add_quality_alert_table
Revises: 01_add_data_quality_tables
Create Date: 2025-04-15 13:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '02_add_quality_alert_table'
down_revision = '01_add_data_quality_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create quality_alert table
    op.create_table('quality_alert',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('check_type', sa.String(length=64), nullable=False),
        sa.Column('parameters', JSONB(), nullable=False, server_default='{}'),
        sa.Column('threshold', sa.Float(), nullable=False, server_default='0.95'),
        sa.Column('severity', sa.String(length=32), nullable=False, server_default='medium'),
        sa.Column('notification_channels', JSONB(), nullable=False, server_default='["log"]'),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_checked', sa.DateTime(), nullable=True),
        sa.Column('last_status', sa.String(length=32), nullable=True),
        sa.Column('last_value', sa.String(length=128), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('triggered_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices
    op.create_index('ix_quality_alert_check_type', 'quality_alert', ['check_type'], unique=False)
    op.create_index('ix_quality_alert_severity', 'quality_alert', ['severity'], unique=False)


def downgrade():
    # Drop table
    op.drop_index('ix_quality_alert_severity', table_name='quality_alert')
    op.drop_index('ix_quality_alert_check_type', table_name='quality_alert')
    op.drop_table('quality_alert')