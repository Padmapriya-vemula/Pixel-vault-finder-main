DROP POLICY IF EXISTS "Anyone can view images" ON public.images;
DROP POLICY IF EXISTS "Anyone can upload images" ON public.images;
DROP POLICY IF EXISTS "Anyone can update images" ON public.images;
DROP POLICY IF EXISTS "Anyone can delete images" ON public.images;
DROP POLICY IF EXISTS "Anyone can view images in bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images to bucket" ON storage.objects;


CREATE POLICY "Users can view their own images"
ON public.images
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own images"
ON public.images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
ON public.images
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
ON public.images
FOR DELETE
USING (auth.uid() = user_id);


CREATE POLICY "Users can view their own images in bucket"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();