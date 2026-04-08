-- Migration: Add editorial planning layer (calendar imports + structured items)

-- ============================================
-- Table: editorial_calendars
-- ============================================
CREATE TABLE IF NOT EXISTS editorial_calendars (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    source_type TEXT NOT NULL DEFAULT 'csv' CHECK (source_type IN ('csv', 'sheet', 'ai')),
    source_file_name TEXT,
    import_hash TEXT,
    total_rows INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: editorial_calendar_items
-- ============================================
CREATE TABLE IF NOT EXISTS editorial_calendar_items (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES editorial_calendars(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    publication_date TIMESTAMPTZ,
    month_label TEXT,
    day_label TEXT,
    title TEXT NOT NULL,
    primary_keyword TEXT,
    brief_url TEXT,
    brief_text TEXT,
    content_seed TEXT,
    raw_status TEXT,
    workflow_status TEXT NOT NULL DEFAULT 'todo' CHECK (workflow_status IN (
        'todo', 'ready', 'scheduled', 'published', 'other'
    )),
    target_editorial_status TEXT NOT NULL DEFAULT 'en attente' CHECK (target_editorial_status IN (
        'en attente', 'à réviser', 'validé', 'publié'
    )),
    source_url TEXT,
    topic TEXT,
    objective TEXT,
    content_type TEXT NOT NULL DEFAULT 'blog' CHECK (content_type IN (
        'newsletter', 'tiktok', 'instagram', 'xtwitter',
        'youtube', 'facebook', 'linkedin', 'blog', 'google my business', 'pinterest'
    )),
    dedup_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (calendar_id, row_number)
);

-- ============================================
-- Link editorial_contents to planning item
-- ============================================
ALTER TABLE editorial_contents
ADD COLUMN IF NOT EXISTS source_calendar_item_id INTEGER REFERENCES editorial_calendar_items(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_editorial_calendars_site_id ON editorial_calendars(site_id);
CREATE INDEX IF NOT EXISTS idx_editorial_calendars_created_at ON editorial_calendars(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_editorial_calendar_items_site_id ON editorial_calendar_items(site_id);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_items_calendar_id ON editorial_calendar_items(calendar_id);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_items_pub_date ON editorial_calendar_items(publication_date);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_items_workflow_status ON editorial_calendar_items(workflow_status);
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_items_dedup_key ON editorial_calendar_items(dedup_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_editorial_calendar_items_site_dedup
    ON editorial_calendar_items(site_id, dedup_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_editorial_calendar_items_site_source_url
    ON editorial_calendar_items(site_id, source_url)
    WHERE source_url IS NOT NULL AND btrim(source_url) <> '';

CREATE INDEX IF NOT EXISTS idx_editorial_contents_source_calendar_item_id
    ON editorial_contents(source_calendar_item_id);

-- ============================================
-- Trigger updated_at
-- ============================================
DROP TRIGGER IF EXISTS editorial_calendars_updated_at ON editorial_calendars;
CREATE TRIGGER editorial_calendars_updated_at BEFORE UPDATE ON editorial_calendars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS editorial_calendar_items_updated_at ON editorial_calendar_items;
CREATE TRIGGER editorial_calendar_items_updated_at BEFORE UPDATE ON editorial_calendar_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
