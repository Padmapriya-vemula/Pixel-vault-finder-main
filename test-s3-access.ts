import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';


dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

async function testS3Access() {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'image2analysis',
      Key: 'db0c211e-49a5-4028-8647-1e8f9b715d08/1761859021958-Balaji%20Profile.png',
    });

    const response = await s3.send(command);
    console.log('Successfully accessed S3 object:', response);
  } catch (error) {
    console.error('Error accessing S3:', error);
  }
}

testS3Access();