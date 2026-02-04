
-- Enable RLS on tables (if not already enabled, though Supabase enables by default on new tables usually)
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for "sites"
-- Allow full access to anon key (public)
CREATE POLICY "Public Access Sites" 
ON sites FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for "editorial_contents"
-- Allow full access to anon key (public)
CREATE POLICY "Public Access Content" 
ON editorial_contents FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for "system_prompts"
-- Allow full access to anon key (public)
CREATE POLICY "Public Access Prompts" 
ON system_prompts FOR ALL 
USING (true) 
WITH CHECK (true);
