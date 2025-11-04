import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';


dotenv.config();


console.log('Environment check:', {
  hasEnvVars: {
    AWS_REGION: !!process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME
  }
});


if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are not configured properly');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false, 
  maxAttempts: 3,
  retryMode: 'adaptive',
});


const BUCKET_NAME = 'imagestorageanalysis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }

    
    console.log('AWS Configuration:', {
      region: process.env.AWS_REGION,
      bucket: process.env.S3_BUCKET_NAME,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });

  
    const userSpecificKey = key;
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: userSpecificKey,
      ChecksumMode: "ENABLED"
    });

  
    const url = await getSignedUrl(s3, command, { 
      expiresIn: 3600,
      signableHeaders: new Set([
        'host'
      ]),
      

      unhoistableHeaders: new Set([
        'x-amz-server-side-encryption',
        'x-amz-request-id',
        'x-amz-id-2'
      ])
    });

    
    console.log('Generated presigned URL:', url);

    return res.status(200).json({ 
      url,
      bucket: process.env.S3_BUCKET_NAME,
      key
    });
  } catch (error) {
    console.error('Presigned GET URL error:', {
      message: error.message,
      code: error.Code,
      requestId: error.RequestId,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Failed to generate download URL',
      details: {
        message: error.message,
        code: error.Code,
        requestId: error.RequestId
      }
    });
  }
}