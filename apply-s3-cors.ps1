$BUCKET_NAME = "imagestorageanalysis"

Write-Host "Applying CORS configuration to S3 bucket: $BUCKET_NAME" -ForegroundColor Cyan

$corsConfig = @{
    CORSRules = @(
        @{
            AllowedHeaders = @("*")
            AllowedMethods = @("GET", "PUT", "POST", "DELETE", "HEAD")
            AllowedOrigins = @(
                "https://pixel-vault-finder.vercel.app",
                "https://pixel-vault-finder.onrender.com",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173"
            )
            ExposeHeaders = @(
                "ETag",
                "x-amz-server-side-encryption",
                "x-amz-request-id",
                "x-amz-id-2",
                "Content-Length",
                "Content-Type"
            )
            MaxAgeSeconds = 3600
        }
    )
}


$corsJson = $corsConfig | ConvertTo-Json -Depth 10
$tempFile = "temp-cors-config.json"
$corsJson | Out-File -FilePath $tempFile -Encoding utf8

try {
    Write-Host "`nApplying CORS configuration..." -ForegroundColor Yellow
    aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://$tempFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ CORS configuration applied successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to apply CORS configuration" -ForegroundColor Red
        exit 1
    }
    
    
    Write-Host "`nVerifying CORS configuration..." -ForegroundColor Yellow
    aws s3api get-bucket-cors --bucket $BUCKET_NAME
    
    Write-Host "`nDone! Please restart your Render service to apply changes." -ForegroundColor Green
} finally {
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

