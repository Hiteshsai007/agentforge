-- AI Agent Marketplace + Intent Router
-- Full Database Schema for Supabase (PostgreSQL)
-- IMPORTANT: Run this in your Supabase SQL Editor.
-- If you have an existing database, apply the changes at the end of the file (RLS Section).

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'end_user', 'developer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE agent_status AS ENUM ('active', 'deprecated', 'updating', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────
-- Table: companies
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    company_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255)  NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    settings     JSONB         NOT NULL DEFAULT '{
        "llm_provider": "gemini",
        "llm_model": "gemini-2.0-flash",
        "auto_update_default": true,
        "notification_preferences": {
            "new_agents": true,
            "updates": true,
            "failures": true
        }
    }'::jsonb
);

-- ─────────────────────────────────────────
-- Table: users
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id    UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID       REFERENCES companies(company_id) ON DELETE CASCADE,
    email      VARCHAR(255) UNIQUE NOT NULL,
    full_name  VARCHAR(255),
    role       user_role  NOT NULL DEFAULT 'end_user',
    created_at TIMESTAMP  NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- ─────────────────────────────────────────
-- Table: agents_marketplace
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents_marketplace (
    agent_id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name             VARCHAR(255) NOT NULL,
    version                VARCHAR(50)  NOT NULL,
    capabilities           TEXT[]       NOT NULL DEFAULT '{}',
    description            TEXT,
    provider               VARCHAR(255),
    input_type             VARCHAR(100) DEFAULT 'text',
    output_type            VARCHAR(100) DEFAULT 'text',
    api_endpoint           VARCHAR(500),
    health_check_endpoint  VARCHAR(500),
    pricing_model          VARCHAR(50)  DEFAULT 'free',
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    is_available           BOOLEAN      NOT NULL DEFAULT TRUE,
    changelog              TEXT,

    UNIQUE(agent_name, version)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_capabilities ON agents_marketplace USING GIN(capabilities);
CREATE INDEX IF NOT EXISTS idx_marketplace_available    ON agents_marketplace(is_available);

-- ─────────────────────────────────────────
-- Table: company_agents
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_agents (
    id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id           UUID         NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    agent_id             UUID         NOT NULL REFERENCES agents_marketplace(agent_id),
    added_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    status               agent_status NOT NULL DEFAULT 'active',
    auto_update_enabled  BOOLEAN      NOT NULL DEFAULT TRUE,
    quality_score        DECIMAL(4,3)          DEFAULT 0.500,
    execution_count      INTEGER      NOT NULL DEFAULT 0,
    last_used_at         TIMESTAMP,
    total_execution_time DECIMAL(12,3)         DEFAULT 0,
    total_cost           DECIMAL(10,4)         DEFAULT 0,
    settings             JSONB        NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE(company_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_company_agents_company ON company_agents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_agents_status  ON company_agents(status);

-- ─────────────────────────────────────────
-- Table: execution_history
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS execution_history (
    execution_id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id            UUID          NOT NULL REFERENCES companies(company_id),
    agent_id              UUID          NOT NULL REFERENCES agents_marketplace(agent_id),
    user_id               UUID          REFERENCES users(user_id),
    request_text          TEXT          NOT NULL,
    parsed_intent         JSONB,
    execution_time_seconds DECIMAL(8,3),
    tokens_used           INTEGER,
    success               BOOLEAN       NOT NULL DEFAULT FALSE,
    error_type            VARCHAR(100),
    result_data           JSONB,
    quality_score         DECIMAL(4,3),
    executed_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_company ON execution_history(company_id);
CREATE INDEX IF NOT EXISTS idx_exec_agent   ON execution_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_exec_time    ON execution_history(executed_at DESC);

-- ─────────────────────────────────────────
-- Function: update updated_at automatically
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agents_marketplace_updated_at ON agents_marketplace;
CREATE TRIGGER update_agents_marketplace_updated_at
    BEFORE UPDATE ON agents_marketplace
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- Row Level Security (RLS) - Permissive for Prototype
-- ─────────────────────────────────────────
-- ACTION REQUIRED: Run the following block in Supabase to enable 
-- anonymous access for the marketplace demo.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on companies" ON companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on agents_marketplace" ON agents_marketplace FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on company_agents" ON company_agents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on execution_history" ON execution_history FOR ALL TO anon USING (true) WITH CHECK (true);

