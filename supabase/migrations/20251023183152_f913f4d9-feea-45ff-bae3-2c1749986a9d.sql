INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);


CREATE TABLE public.images (
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


CREATE POLICY "Anyone can view images"
ON public.images
FOR SELECT
USING (true);

CREATE POLICY "Anyone can upload images"
ON public.images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update images"
ON public.images
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete images"
ON public.images
FOR DELETE
USING (true);


CREATE POLICY "Anyone can view images in bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Anyone can upload images to bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can update images in bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'images');

CREATE POLICY "Anyone can delete images from bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'images');


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;


CREATE TRIGGER update_images_updated_at
BEFORE UPDATE ON public.images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_images_tags ON public.images USING GIN(tags);