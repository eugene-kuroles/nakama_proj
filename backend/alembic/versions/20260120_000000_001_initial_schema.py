"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-01-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('ceo', 'sales_director', 'rop', 'manager', 'marketing', 'product', 'admin', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('client_name', sa.String(length=255), nullable=False),
        sa.Column('nakama_project_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Managers table
    op.create_table(
        'managers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('external_id', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Criteria groups table
    op.create_table(
        'criteria_groups',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Criteria table
    op.create_table(
        'criteria',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('in_final_score', sa.Boolean(), nullable=False),
        sa.Column('score_type', sa.Enum('numeric', 'tag', 'recommendation', name='scoretype'), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['criteria_groups.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Calls table
    op.create_table(
        'calls',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('manager_id', sa.Integer(), nullable=False),
        sa.Column('external_id', sa.String(length=255), nullable=False),
        sa.Column('call_date', sa.Date(), nullable=False),
        sa.Column('call_week', sa.String(length=50), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=False),
        sa.Column('final_percent', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('metadata_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['manager_id'], ['managers.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_calls_call_date'), 'calls', ['call_date'], unique=False)
    op.create_index(op.f('ix_calls_external_id'), 'calls', ['external_id'], unique=False)

    # Call scores table
    op.create_table(
        'call_scores',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('call_id', sa.Integer(), nullable=False),
        sa.Column('criteria_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.String(length=100), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('quote', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['call_id'], ['calls.id'], ),
        sa.ForeignKeyConstraint(['criteria_id'], ['criteria.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Call group averages table
    op.create_table(
        'call_group_averages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('call_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('average_percent', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['call_id'], ['calls.id'], ),
        sa.ForeignKeyConstraint(['group_id'], ['criteria_groups.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('call_group_averages')
    op.drop_table('call_scores')
    op.drop_index(op.f('ix_calls_external_id'), table_name='calls')
    op.drop_index(op.f('ix_calls_call_date'), table_name='calls')
    op.drop_table('calls')
    op.drop_table('criteria')
    op.drop_table('criteria_groups')
    op.drop_table('managers')
    op.drop_table('projects')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS scoretype")
