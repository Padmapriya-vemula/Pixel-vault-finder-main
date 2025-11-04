# S3 Setup for Vercel Deployment

## Problem
Your app is deployed on Vercel but S3 bucket is not accepting requests, causing "Upstream fetch failed" errors.

## Root Cause
The S3 bucket CORS configuration only allows localhost origins, not your Vercel production domain.

## Solution

### Step 1: Update S3 CORS Configuration

You need to add `https://pixel-vault-finder.vercel.app` to your S3 bucket's allowed origins.

#### Option A: Using AWS Console (Recommended)
1. Go to [AWS Console](https://console.aws.amazon.com) → **S3** → `imagestorageanalysis` bucket
2. Click on **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit** and replace with:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://pixel-vault-finder.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click **Save changes**

#### Option B: Using AWS CLI
```bash
aws s3api put-bucket-cors --bucket imagestorageanalysis --cors-configuration file://apply-s3-cors.json
```

First, create a file `apply-s3-cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://pixel-vault-finder.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173"
      ],
      "ExposeHeaders": [
        "ETag",
        "x-amz-server-side-encryption",
        "x-amz-request-id",
        "x-amz-id-2",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

#### Option C: Using PowerShell Script (Windows)
Run the provided script:
```powershell
.\apply-s3-cors.ps1
```

**Note:** You need to update the script first to add your Vercel domain to `AllowedOrigins`.

### Step 2: Verify Bucket Policy

Ensure your bucket policy allows access. Check in **AWS Console → S3 → imagestorageanalysis → Permissions → Bucket Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicReadAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::imagestorageanalysis/*"
    },
    {
      "Sid": "AllowIAMUserAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::441198203439:user/image2analysis"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::imagestorageanalysis",
        "arn:aws:s3:::imagestorageanalysis/*"
      ]
    }
  ]
}
```

### Step 3: Verify Vercel Environment Variables

In your Vercel dashboard:
1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Ensure these are set:

- `AWS_REGION` → `eu-west-1`
- `AWS_ACCESS_KEY_ID` → `<your-key>`
- `AWS_SECRET_ACCESS_KEY` → `<your-secret>`
- `S3_BUCKET_NAME` → `imagestorageanalysis`
- `SUPABASE_URL` → `<your-url>`
- `SUPABASE_SERVICE_KEY` → `<your-key>`
- `GEMINI_API_KEY` → `<your-key>`
- `VITE_SUPABASE_URL` → `<your-url>` (for frontend)
- `VITE_SUPABASE_PUBLISHABLE_KEY` → `<your-key>` (for frontend)

### Step 4: Redeploy on Vercel

After updating S3 CORS:
1. Go to Vercel dashboard
2. Click **Deployments**
3. Click the **...** menu on the latest deployment
4. Click **Redeploy**

Or simply push a new commit to trigger a new deployment.

## Testing

1. Open your Vercel deployment: https://pixel-vault-finder.vercel.app
2. Try uploading an image
3. Check browser console for any CORS errors
4. Verify images load correctly in the grid

## Current API Routes Created

All Vercel API routes have been created in the `app/api/` directory:

- ✅ `/api/presign-get` - Generate presigned GET URLs for S3
- ✅ `/api/presign-put` - Generate presigned PUT URLs for S3
- ✅ `/api/image-proxy` - Proxy S3 images to avoid CORS issues
- ✅ `/api/delete-s3-object` - Delete objects from S3
- ✅ `/api/analyze-image` - Analyze images with Gemini AI
- ✅ `/api/search-images` - Search images by tags/description

## Troubleshooting

### Still seeing CORS errors?
- Verify the bucket CORS was saved (takes a few seconds to propagate)
- Check that the allowed origin exactly matches: `https://pixel-vault-finder.vercel.app`
- Ensure there are no typos in the domain

### Getting "Access Denied" errors?
- Verify the IAM user has the correct permissions
- Check that the bucket policy matches the IAM user ARN
- Ensure the IAM user access keys are correct in Vercel env vars

### Images still not loading?
- Check Vercel function logs for errors
- Verify presigned URLs are being generated correctly
- Check that the S3 object key format matches what's expected

### API routes returning 404?
- Make sure you've deployed the latest code with the new API routes
- Check that `vercel.json` rewrites `/api/*` correctly
- Verify the routes are in `app/api/` directory (not `pages/api/`)

## Additional Notes

- Bucket name: `imagestorageanalysis`
- Region: `eu-west-1`
- IAM User: `arn:aws:iam::441198203439:user/image2analysis`
- Uses virtual-hosted-style URLs (`forcePathStyle: false`)
- CORS changes may take up to 60 seconds to propagate

## Configuration Files

The following configuration files have been created:

- `s3-production-config.json` - Complete S3 configuration
- `S3_RENDER_FIX.md` - S3 setup for Render (reference)
- `apply-s3-cors.sh` - Bash script to apply CORS
- `apply-s3-cors.ps1` - PowerShell script to apply CORS
- `VERCEL_S3_SETUP.md` - This file

All scripts and configs can be found in the project root directory.


