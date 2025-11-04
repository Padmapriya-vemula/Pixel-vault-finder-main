import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: key,
    });

    await s3.send(command);
    return res.status(200).json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Delete object error:', error);
    return res.status(500).json({ error: 'Failed to delete object from S3' });
  }
}