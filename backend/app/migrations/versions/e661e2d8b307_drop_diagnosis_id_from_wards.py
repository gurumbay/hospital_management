"""drop diagnosis_id from wards

Revision ID: e661e2d8b307
Revises: 20251205_triggers_and_procs
Create Date: 2025-12-06 00:15:55.312431

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e661e2d8b307'
down_revision: Union[str, Sequence[str], None] = '20251205_triggers_and_procs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the foreign key constraint first
    op.drop_constraint('wards_diagnosis_id_fkey', 'wards', type_='foreignkey')
    # Drop the column
    op.drop_column('wards', 'diagnosis_id')


def downgrade() -> None:
    """Downgrade schema."""
    # Add the column back
    op.add_column('wards', sa.Column('diagnosis_id', sa.Integer(), nullable=True))
    # Add the foreign key constraint back
    op.create_foreign_key('wards_diagnosis_id_fkey', 'wards', 'diagnoses', ['diagnosis_id'], ['id'])
