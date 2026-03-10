-- Migration: Setup User Roles, RLS Policies, and Superadmin
-- Run this in the Supabase SQL Editor

-- ============================================
-- Table: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'site_user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- Table: user_sites (Mapping users to specific sites)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id INTEGER REFERENCES public.sites(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, site_id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing public access policies
-- ============================================
DROP POLICY IF EXISTS "Public Access Sites" ON public.sites;
DROP POLICY IF EXISTS "Public Access Content" ON public.editorial_contents;
DROP POLICY IF EXISTS "Public Access Prompts" ON public.system_prompts;

-- ============================================
-- Helper Function: Get User Role
-- ============================================
-- Utilise "SECURITY DEFINER" pour contourner le RLS et lire directement la table
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.user_roles WHERE user_id = target_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- New RLS Policies
-- ============================================

-- Sites Policies
CREATE POLICY "Superadmin can manage all sites" ON public.sites
    FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Users can view their assigned sites" ON public.sites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_sites 
            WHERE user_sites.site_id = sites.id 
            AND user_sites.user_id = auth.uid()
        )
    );

-- Content Policies
CREATE POLICY "Superadmin can manage all content" ON public.editorial_contents
    FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Users can manage content for their sites" ON public.editorial_contents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_sites 
            WHERE user_sites.site_id = editorial_contents.site_id 
            AND user_sites.user_id = auth.uid()
        )
    );

-- System Prompts Policies
CREATE POLICY "Superadmin can manage prompts" ON public.system_prompts
    FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Users can view prompts" ON public.system_prompts
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- User Roles Policies
CREATE POLICY "Superadmin can manage roles" ON public.user_roles
    FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- User Sites Policies
CREATE POLICY "Superadmin can manage user sites" ON public.user_sites
    FOR ALL USING (public.get_user_role(auth.uid()) = 'superadmin');
CREATE POLICY "Users can read own sites" ON public.user_sites
    FOR SELECT USING (user_id = auth.uid());

-- Trigger pour updated_at
CREATE TRIGGER user_roles_updated_at BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Seed Superadmin User (admin/admin)
-- ============================================
-- Requires pgcrypto extension for crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  superadmin_id uuid;
BEGIN
  -- 1. Check if the user already exists
  SELECT id INTO superadmin_id FROM auth.users WHERE email = 'admin@webseo.local';

  -- 2. If not, insert into auth.users
  IF superadmin_id IS NULL THEN
    superadmin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      superadmin_id,
      'authenticated',
      'authenticated',
      'admin@webseo.local',
      crypt('admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );
  END IF;

  -- 3. Add to user_roles if not already present
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = superadmin_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (superadmin_id, 'superadmin');
  END IF;
END $$;
