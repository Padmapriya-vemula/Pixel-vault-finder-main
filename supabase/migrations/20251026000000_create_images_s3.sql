SELECT pg_notify('pgrst', 'reload schema');


DROP TABLE IF EXISTS public.images;
CREATE TABLE public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  s3_key text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  tags text[] DEFAULT '{}',
  ai_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.images IS 'User uploaded images with AI-generated tags';
COMMENT ON COLUMN public.images.s3_key IS 'Object key in S3 bucket (includes user_id prefix)';
CREATE INDEX IF NOT EXISTS images_user_id_idx ON public.images(user_id);
CREATE INDEX IF NOT EXISTS images_created_at_idx ON public.images(created_at DESC);


DROP POLICY IF EXISTS "Users can select their own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;


CREATE POLICY "Users can select their own images"
ON public.images FOR SELECT
USING (CAST(auth.uid() AS uuid) = user_id);

CREATE POLICY "Users can insert their own images"
ON public.images FOR INSERT
WITH CHECK (CAST(auth.uid() AS uuid) = user_id);

CREATE POLICY "Users can update their own images"
ON public.images FOR UPDATE
USING (CAST(auth.uid() AS uuid) = user_id);

CREATE POLICY "Users can delete their own images"
ON public.images FOR DELETE
USING (CAST(auth.uid() AS uuid) = user_id);
SELECT pg_notify('pgrst', 'reload schema');