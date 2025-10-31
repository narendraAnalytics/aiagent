"""Add foreign key between linkedin_posts and user_preferences

Revision ID: 4ef3bc134723
Revises: beaa2c989792
Create Date: 2025-10-31 08:32:30.851827

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ef3bc134723'
down_revision: Union[str, Sequence[str], None] = 'beaa2c989792'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, clean up any orphaned linkedin_posts records
    # (posts where user_id doesn't exist in user_preferences.clerk_user_id)
    op.execute("""
        DELETE FROM linkedin_posts
        WHERE user_id NOT IN (
            SELECT clerk_user_id FROM user_preferences
        )
    """)

    # Now add foreign key constraint from linkedin_posts.user_id to user_preferences.clerk_user_id
    op.create_foreign_key(
        'fk_linkedin_posts_user_id_user_preferences',  # constraint name
        'linkedin_posts',  # source table
        'user_preferences',  # target table
        ['user_id'],  # source column
        ['clerk_user_id']  # target column
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign key constraint
    op.drop_constraint('fk_linkedin_posts_user_id_user_preferences', 'linkedin_posts', type_='foreignkey')
