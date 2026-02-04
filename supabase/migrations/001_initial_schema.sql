-- Migration: Create WebSEO Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- Table: sites (remplace "analyse SEO" d'Airtable)
-- ============================================
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    seo_analysis JSONB,           -- Données SEO complètes (JSON)
    social_program TEXT,          -- Programme réseaux sociaux
    social_params JSONB,          -- Paramètres RS (JSON structuré)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: editorial_contents (remplace "content" d'Airtable)
-- ============================================
CREATE TABLE IF NOT EXISTS editorial_contents (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN (
        'newsletter', 'tiktok', 'instagram', 'xtwitter', 
        'youtube', 'facebook', 'blog', 'google my business', 'pinterest'
    )),
    content_text TEXT NOT NULL,
    has_image BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    image_source TEXT CHECK (image_source IS NULL OR image_source IN ('upload', 'ai')),
    status TEXT NOT NULL DEFAULT 'en attente' CHECK (status IN (
        'en attente', 'à réviser', 'validé', 'publié'
    )),
    publication_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: system_prompts (remplace "Gestion prompt" d'Airtable)
-- ============================================
CREATE TABLE IF NOT EXISTS system_prompts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt_system TEXT NOT NULL,
    output_structure TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Index pour performances optimales
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contents_site_id ON editorial_contents(site_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON editorial_contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_publication_date ON editorial_contents(publication_date);
CREATE INDEX IF NOT EXISTS idx_sites_url ON sites(url);
CREATE INDEX IF NOT EXISTS idx_prompts_active ON system_prompts(is_active) WHERE is_active = TRUE;

-- ============================================
-- Trigger pour updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sites_updated_at ON sites;
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS contents_updated_at ON editorial_contents;
CREATE TRIGGER contents_updated_at BEFORE UPDATE ON editorial_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS prompts_updated_at ON system_prompts;
CREATE TRIGGER prompts_updated_at BEFORE UPDATE ON system_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Données initiales (optionnel - prompt par défaut)
-- ============================================
INSERT INTO system_prompts (name, description, prompt_system, output_structure, is_active)
VALUES (
    'Prompt SEO par défaut',
    'Prompt système pour la génération de contenu SEO optimisé',
    'Tu es un expert en création de contenu éditorial et SEO. Réponds toujours en JSON valide avec les champs demandés.',
    '{"title": "Titre accrocheur", "content": "Contenu complet", "suggestions": ["Suggestion 1", "Suggestion 2"]}',
    TRUE
) ON CONFLICT DO NOTHING;

-- ============================================
-- DONE! 
-- ============================================
