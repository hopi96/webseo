-- Migration: Add site_id to system_prompts
-- Description: Linked prompts to specific sites to allow customization.

ALTER TABLE system_prompts 
ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prompts_site_id ON system_prompts(site_id);

-- Update existing prompts to be global (site_id IS NULL), which is the default behavior for nullable columns anyway.
