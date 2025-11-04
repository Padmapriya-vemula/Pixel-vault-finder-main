import { GoogleGenerativeAI } from '@google/generative-ai';
import { fallbackAnalysis } from './fallback-analysis';


const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBiIrPO0sVl99L7ZdZUmcw8DeqZj_qow48';
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set - will use fallback analysis only');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface ImageAnalysis {
  description: string;
  tags: string[];
}

export async function analyzeImage(imageData: Uint8Array | File): Promise<ImageAnalysis> {
  try {
    if (genAI && GEMINI_API_KEY) {
      return await analyzeWithGemini(imageData);
    } else {
      console.log('No Gemini API key available, using fallback analysis');
      return await fallbackAnalysis(imageData);
    }
  } catch (error) {
    console.warn('Gemini analysis failed, using fallback:', error);
    return await fallbackAnalysis(imageData);
  }
}

async function analyzeWithGemini(imageData: Uint8Array | File): Promise<ImageAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    let base64Data: string;
    let mimeType: string = 'image/jpeg';

    if (imageData instanceof File) {
      const arrayBuffer = await imageData.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = imageData.type;
    } else {
      base64Data = Buffer.from(imageData).toString('base64');
    }

    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
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
            .map(t => t.replace(/[\s]+/g, ' '))
            .map(t => t.replace(/[^a-z0-9\-\s]/g, ''))
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
        .map(t => t.replace(/[\s]+/g, ' '))
        .map(t => t.replace(/[^a-z0-9\-\s]/g, ''))
        .filter(t => t.length > 0);
      const uniqueTags = Array.from(new Set(tags)).slice(0, 12) as string[];
      return { description, tags: uniqueTags };
    }
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw error; 
  }
}