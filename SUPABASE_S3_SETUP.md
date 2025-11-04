# Configure Supabase Storage with Amazon S3 (and migrate existing files)

This document explains how to configure a Supabase project to use an external Amazon S3 bucket for file storage and how to migrate existing files to S3. Use the Supabase Dashboard for managed projects or the Supabase CLI for automation.

---

## 1) Configure an S3 bucket (AWS side)

1. Create a new S3 bucket in your AWS account (e.g. `my-app-images`).
2. Region, ACL: use defaults; do NOT enable public access unless you understand security implications.
3. Add a CORS policy if you plan to upload from the browser directly to S3 (not required if Supabase Storage is the only writer):

```xml
<CORSRule>
  <AllowedOrigin>https://your-app-domain.com</AllowedOrigin>
  <AllowedMethod>GET</AllowedMethod>
  <AllowedMethod>PUT</AllowedMethod>
  <AllowedMethod>POST</AllowedMethod>
  <AllowedHeader>*</AllowedHeader>
  <ExposeHeader>ETag</ExposeHeader>
</CORSRule>
```

4. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` permissions scoped to the bucket. Save the Access Key ID and Secret Access Key.

---

## 2) Configure Supabase to use the S3 bucket

1. Open Supabase Dashboard → Project → Settings → Storage (or Edge Functions → Settings depending on UI).
2. Look for an option to configure external object storage / S3. Provide:
   - S3 endpoint (region-based endpoint or custom endpoint)
   - Bucket name
   - Access Key ID
   - Secret Access Key
   - Region
3. Save the configuration. Supabase will now route storage operations to the S3 bucket behind the scenes.

Note: If your Supabase project does not have this UI (older/newer UI differences), use the Supabase support docs for "external S3" configuration or the Supabase CLI for self-hosted installs.

---

## 3) Apply/verify storage policies

- Make sure storage RLS / policies are configured in Supabase so users can only access their own objects (we added SQL migration in `supabase/migrations/20251024000000_security_update.sql`).
- In Dashboard → Storage → Buckets, confirm the `images` bucket is present and that objects created by Supabase appear in the S3 bucket.

---

## 4) Migrate existing files from Supabase storage to S3 (if needed)

If your current Supabase Storage already stores files in the Supabase-managed backend and you configure external S3 afterwards, new writes will go to S3, but existing objects may remain in the old backend. To migrate:

Option A — Use Supabase-backed copy (recommended, server-side):
- Create a small Node.js script (run server-side with Service Role Key) that:
  1. Lists all objects in the `images` bucket (optionally filtered by folder/user)
  2. Downloads each object via `supabase.storage.from('images').download(path)`
  3. Uploads it to the S3 bucket using AWS SDK or (if Supabase storage now points to S3) re-uploads via Supabase storage API

Example outline (Node.js pseudocode):

```js
// run server-side with service role key
const { createClient } = require('@supabase/supabase-js');
const AWS = require('aws-sdk');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const s3 = new AWS.S3({ accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET, region: AWS_REGION });

// list objects (you may need to page)
const { data: objects } = await supabase.storage.from('images').list('');
for (const obj of objects) {
  const { data } = await supabase.storage.from('images').download(obj.name);
  const arrayBuffer = await data.arrayBuffer();
  await s3.putObject({ Bucket: 'my-app-images', Key: obj.name, Body: Buffer.from(arrayBuffer) }).promise();
}
```

Option B — Reconfigure Supabase to point storage to S3 and re-upload via client:
- After configuring external S3 in Supabase, you can re-upload files through your app so they land in S3 (if the original objects are still reachable, you can programmatically copy). This is less efficient for many objects.

---

## 5) Troubleshooting 400 errors on POST to storage endpoint

If you see `400 Bad Request` when uploading to `https://<project>.supabase.co/storage/v1/object/images/...`:

- Ensure the bucket `images` exists in your Supabase project and is configured to use S3 if desired.
- Ensure the authenticated user (or RLS policy) has permission to insert objects to the bucket. Check storage policies.
- Sanitize object keys: spaces and special characters in filenames can cause unexpected requests. Encode or replace spaces (we added filename sanitization in `src/components/ImageUpload.tsx`).
- If the request shows a JSON error body, inspect it for more details. When uploading with `supabase.storage.upload`, log the `error` object.
- If you switched storage backends (e.g., to S3), confirm credentials were set correctly in Supabase Dashboard and that Supabase can access the S3 bucket.

---

## 6) Quick verification steps

1. In Supabase Dashboard → Storage → Buckets, confirm `images` exists.
2. In the S3 Console, check that objects appear in the bucket after an upload.
3. In your app, upload a small image after signing in; in the browser devtools Network tab, check the response body for the storage upload request.
4. If the upload fails, check Supabase Logs (Edge Functions & Logs) and the S3 access logs (if enabled).

---

If you want, I can:
- Add the migration SQL to ensure bucket exists (we already have that migration in `supabase/migrations`),
- Create a Node.js migration script to copy existing files from Supabase storage to your S3 bucket (I can add it to a `scripts/` folder), or
- Walk you through configuring the S3 connection in the Supabase Dashboard step-by-step.

Which would you like me to do next?
