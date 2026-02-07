-- Migration: Add GEO (Generative Engine Optimization) analysis columns
-- This stores the analysis results for AI search engine optimization

ALTER TABLE sites ADD COLUMN IF NOT EXISTS geo_analysis JSONB;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS geo_score INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN sites.geo_analysis IS 'GEO analysis results: direct answers, structured content, authority signals, etc.';
COMMENT ON COLUMN sites.geo_score IS 'Overall GEO score (0-100) for AI search engine optimization';
