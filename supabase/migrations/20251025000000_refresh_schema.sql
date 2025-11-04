SELECT pg_notify('pgrst', 'reload schema');


DROP TABLE IF EXISTS public.images;

CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_description TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


COMMENT ON TABLE public.images IS 'Stores metadata for uploaded images';
COMMENT ON COLUMN public.images.file_name IS 'Original filename of the uploaded image';
COMMENT ON COLUMN public.images.file_path IS 'Storage path including user_id prefix';
COMMENT ON COLUMN public.images.user_id IS 'References the auth.users account that owns this image';


ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
SELECT pg_notify('pgrst', 'reload schema');
DROP POLICY IF EXISTS "Users can select their own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;

CREATE POLICY "Users can select their own images" ON public.images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" ON public.images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" ON public.images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON public.images
  FOR DELETE USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
DROP POLICY IF EXISTS "Users can upload their own images" ON public.images;
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;

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

SELECT pg_notify('pgrst', 'reload schema');