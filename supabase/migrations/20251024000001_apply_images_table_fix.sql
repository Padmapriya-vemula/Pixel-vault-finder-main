INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;


CREATE TABLE IF NOT EXISTS public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Anyone can view images" ON public.images;
DROP POLICY IF EXISTS "Anyone can upload images" ON public.images;
DROP POLICY IF EXISTS "Anyone can update images" ON public.images;
DROP POLICY IF EXISTS "Anyone can delete images" ON public.images;


CREATE POLICY "Users can view their own images"
ON public.images
FOR SELECT
USING (CAST(auth.uid() AS uuid) = user_id);

CREATE POLICY "Users can upload their own images"
ON public.images
FOR INSERT
WITH CHECK (CAST(auth.uid() AS uuid) = user_id);

CREATE POLICY "Users can update their own images"
ON public.images
FOR UPDATE
USING (CAST(auth.uid() AS uuid) = user_id);

CREATE POLICY "Users can delete their own images"
ON public.images
FOR DELETE
USING (CAST(auth.uid() AS uuid) = user_id);


DROP POLICY IF EXISTS "Anyone can view images in bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images to bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images in bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images in bucket" ON storage.objects;


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

DROP TRIGGER IF EXISTS update_images_updated_at ON public.images;
CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
