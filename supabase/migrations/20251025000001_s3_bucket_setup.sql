INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'image2analysis',  
  'image2analysis',
  false,  
  52428800, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;


CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'image2analysis' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (CASE WHEN owner IS NULL THEN true ELSE auth.uid()::text = owner END)
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'image2analysis' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (CASE WHEN owner IS NULL THEN true ELSE auth.uid()::text = owner END)
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'image2analysis' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (CASE WHEN owner IS NULL THEN true ELSE auth.uid()::text = owner END)
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'image2analysis' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (CASE WHEN owner IS NULL THEN true ELSE auth.uid()::text = owner END)
);
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS owner text;