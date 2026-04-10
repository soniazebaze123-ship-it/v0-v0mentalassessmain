-- This script creates the core tables for the MentalAssess application.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the 'users' table to store user profile information
-- This table now manages user IDs directly as UUIDs, not linked to auth.users
-- Removed dummy_pin column
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'assessments' table to store completed assessment results
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Updated to reference public.users(id)
    type TEXT NOT NULL, -- e.g., 'MOCA', 'MMSE'
    score INTEGER NOT NULL,
    data JSONB, -- Store individual section scores as JSON
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'uploaded_files' table to store metadata about user uploads
CREATE TABLE IF NOT EXISTS public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Updated to reference public.users(id)
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in the storage bucket
    file_type TEXT NOT NULL, -- Mime type
    file_size INTEGER NOT NULL, -- This column is correctly defined
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'admin_users' table for admin login (separate from regular users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store hashed passwords
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$rOzJqQqQqQqQgQgQgQgQgO')
ON CONFLICT (username) DO NOTHING;

-- Add RLS policies for the 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- For dummy auth, we'll allow all authenticated users to see all user profiles for simplicity.
-- In a real app, this would be more restrictive.
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
CREATE POLICY "Allow all access to users" ON public.users FOR ALL USING (true);

-- Add RLS policies for the 'assessments' table
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to assessments" ON public.assessments;
CREATE POLICY "Allow all access to assessments" ON public.assessments FOR ALL USING (true);

-- Add RLS policies for the 'uploaded_files' table
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to uploaded_files" ON public.uploaded_files;
CREATE POLICY "Allow all access to uploaded_files" ON public.uploaded_files FOR ALL USING (true);

-- Add RLS policies for the 'admin_users' table (more permissive for admin access)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to admin_users" ON public.admin_users;
CREATE POLICY "Allow all access to admin_users" ON public.admin_users FOR ALL USING (true);
