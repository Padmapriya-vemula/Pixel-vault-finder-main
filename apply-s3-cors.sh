BUCKET_NAME="imagestorageanalysis"

echo "Applying CORS configuration to S3 bucket: $BUCKET_NAME"


aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
          "https://pixel-vault-finder.vercel.app",
          "https://pixel-vault-finder.onrender.com",
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
  }'

if [ $? -eq 0 ]; then
    echo "✓ CORS configuration applied successfully"
else
    echo "✗ Failed to apply CORS configuration"
    exit 1
fi


echo ""
echo "Verifying CORS configuration..."
aws s3api get-bucket-cors --bucket "$BUCKET_NAME"

echo ""
echo "Done! Please restart your Render service to apply changes."

