-- Supabase SQL Setup for The Gathering
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- Single document store for all site configuration data
CREATE TABLE IF NOT EXISTS site_data (
    id TEXT PRIMARY KEY DEFAULT 'main',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default row if it doesn't exist
INSERT INTO site_data (id, data) VALUES ('main', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (required by Supabase)
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

-- Allow the service_role key full access (our backend uses this key)
CREATE POLICY "Service role has full access" ON site_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create the storage bucket for uploads (if not created via UI)
-- Note: This is handled via Supabase Dashboard -> Storage -> New Bucket -> "uploads" -> Public
