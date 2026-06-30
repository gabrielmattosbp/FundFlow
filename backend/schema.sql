-- ============================================================
-- FundFlow — Database Schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- 1. users — basic user management
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    password    TEXT NOT NULL,         -- bcrypt hash
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast login lookups
CREATE INDEX idx_users_email ON users (email);

-- 2. accounts — contas manuais
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

CREATE INDEX idx_accounts_user_id ON accounts (user_id);

-- 3. transactions — movimentos financeiros individuais
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

CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_date ON transactions (date DESC);

-- ============================================================
-- Enable Row-Level Security (RLS) for multi-tenant isolation
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies: each user can only see/change their own data
CREATE POLICY user_isolation ON users
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY account_isolation ON accounts
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY transaction_isolation ON transactions
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. password_reset_tokens — tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens (token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
