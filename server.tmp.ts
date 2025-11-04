import express from 'express';
import * as dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { analyzeImage } from './src/lib/gemini';

dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
});


const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);


const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'GEMINI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
});

app.post('/api/presign-put', async (req, res) => {
  try {
    console.log('Received presign-put request:', req.body);
    const { fileName, contentType, userId } = req.body;
    
    if (!fileName || !contentType || !userId) {
      console.log('Missing parameters:', { fileName, contentType, userId });
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
      ACL: 'private',
      ChecksumAlgorithm: 'CRC32',
      Metadata: {
        'original-filename': encodeURIComponent(fileName)
      }
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
      signableHeaders: new Set(['content-type']),
    });
    console.log('Successfully generated presigned URL');

    res.json({ url, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/presign-get', async (req, res) => {
  try {
    console.log('Received presign-get request:', { body: req.body });
    
    const { key } = req.body;
    
    if (!key) {
      console.log('Missing key in request body');
      return res.status(400).json({ error: 'Missing key parameter' });
    }

    console.log('Generating presigned URL for:', {
      bucket: process.env.S3_BUCKET_NAME,
      key: key
    });

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated presigned URL successfully');

    res.json({ url });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/delete-s3-object', async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: key
    });

    await s3Client.send(command);
    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ error: 'Failed to delete object' });
  }
});


async function getImageFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  const chunks: Buffer[] = [];
  
  // @ts-ignore - TypeScript doesn't recognize Body.transformToByteArray()
  for await (const chunk of response.Body) {
    chunks.push(Buffer.from(chunk));
  }
  
  return Buffer.concat(chunks);
}


app.post('/api/analyze-image', async (req, res) => {
  try {
    const { key, imageId } = req.body;

    if (!key || !imageId) {
      return res.status(400).json({ error: 'Missing key or imageId parameter' });
    }

  
    const imageBuffer = await getImageFromS3(key);
    const analysis = await analyzeImage(new Uint8Array(imageBuffer));
    const { error: updateError } = await supabase
      .from('images')
      .update({
        ai_description: analysis.description,
        tags: analysis.tags
      })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Image analyzed successfully',
      analysis
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});


app.get('/api/search-images', async (req, res) => {
  try {
    const { query, userId } = req.query;

    if (!query || !userId) {
      return res.status(400).json({ error: 'Missing query or userId parameter' });
    }

    
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .or(`tags.cs.{${query}},ai_description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ images });
  } catch (error) {
    console.error('Error searching images:', error);
    res.status(500).json({ 
      error: 'Failed to search images',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});