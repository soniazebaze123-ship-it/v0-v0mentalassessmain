-- This script sets up storage buckets and ensures RLS is enabled for storage.objects.
-- RLS policies for tables are now handled in their respective creation scripts (01-create-tables.sql, 04-create-user-progress-table.sql).

-- Removed: DROP POLICY IF EXISTS statements, as they require ownership of the policies.
-- Removed: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; as RLS is typically enabled by default on storage.objects
-- and attempting to re-enable it without ownership causes an error.

-- Create storage bucket with proper settings or update if it exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

-- Create more permissive storage policies for objects within the bucket for dummy authentication.
-- IMPORTANT SECURITY NOTE: Since we are bypassing Supabase's built-in authentication (auth.uid()),
-- the 'owner' column in storage.objects will not be reliably linked to our public.users.id.
-- Therefore, these policies grant broad access to any *authenticated* user (meaning, any user
-- who has successfully logged in via our dummy system) to files in the 'user-files' bucket.
-- In a production environment, you would need a more secure mechanism to link file ownership
-- to your custom user table, possibly using custom security definer functions or a different storage solution.

-- Policy for INSERT (upload)
CREATE POLICY "Users can upload files to user-files bucket" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-files');

-- Policy for SELECT (view/download)
CREATE POLICY "Users can view files from user-files bucket" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'user-files');

-- Policy for DELETE
CREATE POLICY "Users can delete files from user-files bucket" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-files');

-- Policy for UPDATE (if needed, though less common for files)
CREATE POLICY "Users can update files in user-files bucket" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-files');
