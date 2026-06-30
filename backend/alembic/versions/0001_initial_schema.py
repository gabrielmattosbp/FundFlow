"""initial schema from schema.sql

Revision ID: 0001
Revises:
Create Date: 2026-06-30

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email       TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            password    TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);")

    op.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            institution     TEXT NOT NULL,
            account_type    TEXT NOT NULL DEFAULT 'checking',
            currency        TEXT NOT NULL DEFAULT 'EUR',
            balance         NUMERIC(14,2) NOT NULL DEFAULT 0.00,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts (user_id);")

    op.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            description     TEXT NOT NULL,
            amount          NUMERIC(14,2) NOT NULL,
            type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            category        TEXT NOT NULL DEFAULT 'other',
            date            DATE NOT NULL,
            currency        TEXT NOT NULL DEFAULT 'EUR',
            is_subscription BOOLEAN NOT NULL DEFAULT false,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date DESC);")

    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;")

    op.execute("""
        CREATE POLICY IF NOT EXISTS user_isolation ON users
            USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    """)
    op.execute("""
        CREATE POLICY IF NOT EXISTS account_isolation ON accounts
            USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    """)
    op.execute("""
        CREATE POLICY IF NOT EXISTS transaction_isolation ON transactions
            USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS transactions CASCADE;")
    op.execute("DROP TABLE IF EXISTS accounts CASCADE;")
    op.execute("DROP TABLE IF EXISTS users CASCADE;")
