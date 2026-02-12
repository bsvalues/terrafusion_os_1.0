"""Add data quality alert tables

Revision ID: 01_add_data_quality_tables
Revises: 
Create Date: 2025-04-15 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision = '01_add_data_quality_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create data_quality_alerts table
    op.create_table('data_quality_alert',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('alert_type', sa.String(length=64), nullable=False),
        sa.Column('table_name', sa.String(length=128), nullable=True),
        sa.Column('field_name', sa.String(length=128), nullable=True),
        sa.Column('severity_threshold', sa.String(length=32), default='warning'),
        sa.Column('conditions', JSONB(), nullable=False),
        sa.Column('recipients', JSONB(), nullable=False),
        sa.Column('channels', JSONB(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create data_quality_notifications table
    op.create_table('data_quality_notification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_id', sa.Integer(), nullable=True),
        sa.Column('issue_id', sa.Integer(), nullable=True),
        sa.Column('anomaly_id', sa.Integer(), nullable=True),
        sa.Column('report_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False, default='warning'),
        sa.Column('recipient', sa.String(length=255), nullable=False),
        sa.Column('channel', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, default='sent'),
        sa.Column('notification_data', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['alert_id'], ['data_quality_alert.id'], ),
    )
    
    # Create indices
    op.create_index(op.f('ix_data_quality_alert_alert_type'), 'data_quality_alert', ['alert_type'], unique=False)
    op.create_index(op.f('ix_data_quality_alert_severity_threshold'), 'data_quality_alert', ['severity_threshold'], unique=False)
    op.create_index(op.f('ix_data_quality_notification_alert_id'), 'data_quality_notification', ['alert_id'], unique=False)
    op.create_index(op.f('ix_data_quality_notification_status'), 'data_quality_notification', ['status'], unique=False)


def downgrade():
    # Drop tables
    op.drop_table('data_quality_notification')
    op.drop_table('data_quality_alert')