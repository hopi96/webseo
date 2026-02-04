-- Migration: MSG - Update content_type check constraint to include linkedin
-- Run this in the Supabase SQL Editor

ALTER TABLE editorial_contents DROP CONSTRAINT IF EXISTS editorial_contents_content_type_check;

ALTER TABLE editorial_contents ADD CONSTRAINT editorial_contents_content_type_check 
    CHECK (content_type IN (
        'newsletter', 
        'tiktok', 
        'instagram', 
        'xtwitter', 
        'youtube', 
        'facebook', 
        'blog', 
        'google my business', 
        'pinterest', 
        'linkedin'
    ));
