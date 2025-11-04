# Deployment Checklist

## ✅ All Fixes Completed

### 1. API Routes Created/Updated
All routes in `api/` directory:
- ✅ `presign-get.ts` - Already existed, enhanced
- ✅ `presign-put.ts` - Already existed, enhanced  
- ✅ `image-proxy.ts` - Already existed, enhanced logging
- ✅ `delete-s3-object.ts` - Already existed, fixed region & config
- ✅ `analyze-image.ts` - **NEW** - Created with Gemini AI integration
- ✅ `search-images.ts` - **NEW** - Created for search functionality

### 2. Environment Configuration
All API routes now have:
- ✅ `dotenv.config()` for local development
- ✅ Proper S3 client configuration with retries
- ✅ Enhanced error logging
- ✅ Correct region (eu-west-1)
- ✅ TypeScript definitions updated

### 3. Development Server
- ✅ Vite proxy configured for localhost:3000
- ✅ Server.ts CORS updated for localhost:3001
- ✅ Enhanced debugging logs

## 📋 Pre-Deployment Steps

### Step 1: Update S3 CORS (CRITICAL)

**DO THIS FIRST** before deploying to Vercel:

1. Go to https://console.aws.amazon.com/s3/
2. Navigate to bucket `imagestorageanalysis`
3. Go to **Permissions** → **Cross-origin resource sharing (CORS)**
4. Click **Edit**
5. Replace entire content with:

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

6. Click **Save changes**

### Step 2: Verify Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

**Frontend (VITE_***):**
- `VITE_SUPABASE_URL` = Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Your Supabase anon/public key

**Backend (API routes):**
- `AWS_REGION` = `eu-west-1`
- `AWS_ACCESS_KEY_ID` = Your AWS access key
- `AWS_SECRET_ACCESS_KEY` = Your AWS secret key
- `S3_BUCKET_NAME` = `imagestorageanalysis`
- `SUPABASE_URL` = Your Supabase project URL (same as VITE)
- `SUPABASE_SERVICE_KEY` = Your Supabase service_role key
- `GEMINI_API_KEY` = Your Google Gemini API key

**Important:**
- Variables prefixed with `VITE_` are exposed to the browser
- Variables without `VITE_` are only available in serverless functions
- Make sure to set them for all environments (Production, Preview, Development)

### Step 3: Deploy to Vercel

#### Option A: Automatic Deployment (Recommended)
```bash
git add .
git commit -m "Add missing API routes: analyze-image, search-images. Fix S3 configuration."
git push origin main
```

Vercel will automatically deploy if connected to your Git repo.

#### Option B: Manual Deployment
1. Go to Vercel Dashboard
2. Click your project
3. Click **Deployments**
4. Click **...** on the latest deployment
5. Click **Redeploy**

### Step 4: Verify Deployment

1. **Check Build Logs**
   - Go to Vercel → Deployments → Latest deployment
   - Verify build completed successfully
   - Check for any warnings about environment variables

2. **Check Function Logs**
   - Go to Vercel → Functions tab
   - Verify all 6 API routes are listed:
     - presign-get
     - presign-put
     - image-proxy
     - delete-s3-object
     - analyze-image
     - search-images

3. **Test the App**
   - Open https://pixel-vault-finder.vercel.app
   - Sign in/Sign up
   - Upload an image
   - Wait for processing
   - Try clicking "Analyze" on an image
   - Try searching for an image

4. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any errors
   - Should see NO CORS errors

5. **Check Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Try uploading/analyzing
   - Verify all `/api/*` requests return 200 OK

## 🐛 Troubleshooting

### "Failed to fetch" errors?

**Possible causes:**
1. API route not deployed → Check Vercel Functions
2. Environment variables missing → Check Vercel Settings
3. CORS not updated → Wait 60 seconds for S3 propagation
4. Network issue → Check internet connection

**Solution:**
```bash
# Check if routes exist
ls api/

# Verify environment variables in Vercel
# Check Vercel deployment logs
```

### "Upstream fetch failed" errors?

**Possible causes:**
1. S3 CORS not allowing Vercel domain
2. Presigned URL expired or invalid
3. Bucket doesn't exist or wrong name

**Solution:**
1. Verify S3 CORS includes `https://pixel-vault-finder.vercel.app`
2. Check bucket name is exactly `imagestorageanalysis`
3. Verify IAM user has correct permissions

### API returning 404?

**Possible causes:**
1. Route not deployed
2. Wrong path in frontend
3. vercel.json misconfigured

**Solution:**
1. Verify file exists in `api/` directory
2. Check frontend uses `/api/route-name` (not `app/api`)
3. Verify vercel.json rewrites to `/api/*`

### Images not analyzing?

**Possible causes:**
1. GEMINI_API_KEY not set
2. analyze-image route not deployed
3. Image URL invalid

**Solution:**
1. Check Vercel env var GEMINI_API_KEY exists
2. Check Vercel function logs for analyze-image
3. Verify presigned URL is valid

## 📁 File Structure

```
pixel-vault-finder/
├── api/                          ← Vercel serverless functions
│   ├── analyze-image.ts         ← NEW: Image analysis
│   ├── delete-s3-object.ts      ← Delete images
│   ├── image-proxy.ts           ← Proxy S3 images
│   ├── presign-get.ts           ← GET presigned URLs
│   ├── presign-put.ts           ← PUT presigned URLs
│   └── search-images.ts         ← NEW: Search functionality
├── app/                          ← Empty (not used)
├── pages/                        ← Not used
├── src/                          ← React frontend
│   ├── components/
│   ├── config/
│   ├── pages/
│   └── ...
├── vercel.json                   ← Vercel config
├── vite.config.ts               ← Vite dev server config
└── server.ts                     ← Local Express server (dev only)
```

## ✅ Final Checklist

Before considering deployment complete:

- [ ] S3 CORS updated to allow Vercel domain
- [ ] All Vercel environment variables set
- [ ] Code pushed to Git
- [ ] Vercel deployment successful
- [ ] Can upload images
- [ ] Can view uploaded images
- [ ] Can analyze images (no "Failed to fetch" error)
- [ ] Can search images
- [ ] Can delete images
- [ ] No console errors
- [ ] No CORS errors
- [ ] Images load correctly

## 📞 Next Steps

If everything works:
- ✅ Mark deployment as successful
- ✅ Test all features thoroughly
- ✅ Monitor Vercel function usage
- ✅ Check AWS S3 costs

If issues persist:
- 📋 Check Vercel function logs
- 📋 Check AWS CloudWatch logs
- 📋 Review browser console errors
- 📋 Verify environment variables

---

**Last Updated:** 2025-01-01  
**Deployment:** Vercel  
**Bucket:** imagestorageanalysis  
**Region:** eu-west-1


