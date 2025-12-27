-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-files');

CREATE POLICY "Users can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'user-files');

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'user-files');
