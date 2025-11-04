ALTER TABLE public.images ADD COLUMN s3_url text;
COMMENT ON COLUMN public.images.s3_url IS 'Presigned S3 URL for direct image access';
SELECT pg_notify('pgrst', 'reload schema');
