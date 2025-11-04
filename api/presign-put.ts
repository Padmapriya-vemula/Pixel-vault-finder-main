import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';


dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: false,
  maxAttempts: 3,
  retryMode: 'adaptive'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentType, userId } = req.body;
    if (!fileName || !contentType || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    
    const safeName = encodeURIComponent(fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
    const key = `${userId}/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: key,
      ContentType: contentType,
    });

    
    const url = await getSignedUrl(s3, command, { 
      expiresIn: 3600 
    });

    return res.status(200).json({
      url,
      key,
      bucket: process.env.S3_BUCKET_NAME,
    });
  } catch (error) {
    console.error('Presigned PUT URL error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}