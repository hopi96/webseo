-- Migration: Backfill platform for legacy prompts
-- Run this to insure all system_prompts have a platform

UPDATE system_prompts
SET platform = 'seo'
WHERE platform IS NULL;
