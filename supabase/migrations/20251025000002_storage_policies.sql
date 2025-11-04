INSERT INTO storage.buckets (id, name, public)
VALUES ('imagestorageanalysis', 'imagestorageanalysis', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can view their own images in bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;


CREATE POLICY "Users can view their own images in bucket"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'imagestorageanalysis' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'imagestorageanalysis' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'imagestorageanalysis' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'imagestorageanalysis' AND
  (storage.foldername(name))[1] = auth.uid()::text
);