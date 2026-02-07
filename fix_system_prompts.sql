-- FIX: Add missing columns and tables for System Prompts
-- Run this in the Supabase SQL Editor

-- 1. Add site_id to system_prompts
ALTER TABLE system_prompts 
ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_prompts_site_id ON system_prompts(site_id);

-- 2. Add platform to system_prompts
ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS platform TEXT;

CREATE INDEX IF NOT EXISTS idx_prompts_platform ON system_prompts(platform) WHERE platform IS NOT NULL;

-- 3. Create site_prompts table
CREATE TABLE IF NOT EXISTS site_prompts (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    name TEXT,
    prompt_system TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_site_prompts_site_id ON site_prompts(site_id);
CREATE INDEX IF NOT EXISTS idx_site_prompts_platform ON site_prompts(platform);
CREATE INDEX IF NOT EXISTS idx_site_prompts_site_platform ON site_prompts(site_id, platform);

-- 4. Enable RLS on site_prompts (optional but good practice)
ALTER TABLE site_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on site_prompts" ON site_prompts;
CREATE POLICY "Allow all operations on site_prompts"
ON site_prompts FOR ALL 
USING (true);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_prompts_updated_at ON site_prompts;
CREATE TRIGGER site_prompts_updated_at 
    BEFORE UPDATE ON site_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
