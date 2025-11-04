import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';


dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBiIrPO0sVl99L7ZdZUmcw8DeqZj_qow48';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

interface ImageAnalysis {
  description: string;
  tags: string[];
}

async function analyzeWithGemini(imageBuffer: Uint8Array): Promise<ImageAnalysis> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const base64Data = Buffer.from(imageBuffer).toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg'
      }
    };

    const prompt = `Analyze this image and return ONLY a valid JSON object with this exact structure:
{
  "description": "A detailed 2-3 sentence description of what you see in the image, including objects, colors, setting, and style",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Rules:
- Return ONLY the JSON object, no other text
- Description should be 2-3 sentences describing key visual elements
- Tags should be 5-8 relevant, lowercase, searchable keywords
- Focus on objects, colors, emotions, style, setting, actions
- No markdown formatting, no code blocks, just pure JSON`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      const description = String(parsed.description || '').trim();
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
            .map((t: unknown) => String(t).trim().toLowerCase())
            .filter((t: string) => t.length > 0)
        : [];
      
      if (!description) throw new Error('Missing description');
      const uniqueTags = Array.from(new Set(tags)).slice(0, 12) as string[];
      return { description, tags: uniqueTags };
    } catch (_e) {
      
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const descriptionLine = lines.find(l => /^description\s*:/i.test(l)) || lines[0] || '';
      const tagsLine = lines.find(l => /^tags\s*:/i.test(l)) || '';
      const description = descriptionLine.replace(/^description\s*:/i, '').trim();
      const tags = tagsLine
        .replace(/^tags\s*:/i, '')
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);
      const uniqueTags = Array.from(new Set(tags)).slice(0, 12) as string[];
      return { description, tags: uniqueTags };
    }
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { s3Url, imageId } = req.body;

    if (!s3Url || !imageId) {
      return res.status(400).json({ error: 'Missing s3Url or imageId parameter' });
    }

    console.log('Analyze-image request received:', { s3Url, imageId });
    
    
    const imageResponse = await fetch(s3Url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from S3: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();

    
    const analysis = await analyzeWithGemini(new Uint8Array(imageBuffer));
    console.log('Gemini analysis result:', analysis);

    
    const { error: updateError } = await supabase
      .from('images')
      .update({
        ai_description: analysis.description,
        tags: analysis.tags
      })
      .eq('id', imageId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    return res.status(200).json({
      message: 'Image analyzed successfully',
      analysis
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

