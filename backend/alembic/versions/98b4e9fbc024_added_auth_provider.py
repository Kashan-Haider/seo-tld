"""
added auth_provider
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '98b4e9fbc024'
down_revision = '335b38eb660e'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Add as nullable with default
    op.add_column('users', sa.Column('auth_provider', sa.String(length=32), nullable=True, server_default='local'))
    # 2. Update all existing rows
    op.execute("UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL")
    # 3. Alter to NOT NULL and remove default
    op.alter_column('users', 'auth_provider', nullable=False, server_default=None)

def downgrade():
    op.drop_column('users', 'auth_provider')
 