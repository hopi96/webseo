-- Migration: Add publication logs for monitoring failed/successful posts

-- ============================================
-- Table: publication_logs
-- ============================================
CREATE TABLE IF NOT EXISTS publication_logs (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES editorial_contents(id) ON DELETE CASCADE,
    site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    message TEXT,
    external_id TEXT,
    publication_date TIMESTAMPTZ,
    content_excerpt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS + public policy (match existing tables)
ALTER TABLE publication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Publication Logs"
ON publication_logs FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pub_logs_content_id ON publication_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_pub_logs_site_id ON publication_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_pub_logs_status ON publication_logs(status);
CREATE INDEX IF NOT EXISTS idx_pub_logs_created_at ON publication_logs(created_at);
