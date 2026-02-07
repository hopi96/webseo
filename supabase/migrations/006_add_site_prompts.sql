-- Migration: Add site-specific prompts table
-- This allows each site to have its own customized prompts per platform
-- Falls back to global prompts if no site-specific prompt exists

-- ============================================
-- Step 1: Create site_prompts table
-- ============================================
CREATE TABLE IF NOT EXISTS site_prompts (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    name TEXT,
    prompt_system TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique prompt per site/platform combination
    UNIQUE(site_id, platform)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_site_prompts_site_id ON site_prompts(site_id);
CREATE INDEX IF NOT EXISTS idx_site_prompts_platform ON site_prompts(platform);
CREATE INDEX IF NOT EXISTS idx_site_prompts_site_platform ON site_prompts(site_id, platform);

-- ============================================
-- Step 2: Create function for updated_at (if not exists)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 3: Add trigger for updated_at
-- ============================================
DROP TRIGGER IF EXISTS site_prompts_updated_at ON site_prompts;
CREATE TRIGGER site_prompts_updated_at 
    BEFORE UPDATE ON site_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 3: Enable RLS
-- ============================================
ALTER TABLE site_prompts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust based on your auth setup)
DROP POLICY IF EXISTS "Allow all operations on site_prompts" ON site_prompts;
CREATE POLICY "Allow all operations on site_prompts"
ON site_prompts FOR ALL 
USING (true);

-- ============================================
-- DONE! 
-- The service will now:
-- 1. First look for a site-specific prompt for the given site_id + platform
-- 2. If not found, fall back to the global prompt from system_prompts
-- ============================================
