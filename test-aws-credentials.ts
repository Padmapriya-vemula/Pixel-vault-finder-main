import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';


dotenv.config();

async function testAwsCredentials() {
  console.log('Testing AWS credentials...');
  console.log('AWS Configuration:', {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 5) + '...',
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET_NAME
  });

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: false
  });

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'imagestorageanalysis',
      Key: 'test.txt'
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log('Successfully generated presigned URL:', url);
  } catch (error) {
    console.error('Error testing AWS credentials:', error);
  }
}

testAwsCredentials();