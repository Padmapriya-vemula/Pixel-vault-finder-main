import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';


dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    return res.status(200).json({ images });
  } catch (error) {
    console.error('Error searching images:', error);
    return res.status(500).json({ 
      error: 'Failed to search images',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

