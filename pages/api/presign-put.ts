import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentType, userId } = req.body;
    
    if (!fileName || !contentType || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { fileName, contentType, userId }
      });
    }

    const key = `${userId}/${Date.now()}-${encodeURIComponent(fileName)}`;
    console.log('Generating presigned URL for:', {
      bucket: process.env.S3_BUCKET_NAME,
      key,
      contentType
    });

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME as string,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    
    res.status(200).json({ url, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}