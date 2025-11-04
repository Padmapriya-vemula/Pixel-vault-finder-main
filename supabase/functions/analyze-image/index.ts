import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface RequestBody {
  imageUrl: string;
  imageId: string;
}

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const corsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://pixel-vault-finder.onrender.com'
  ];

  const baseHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin'
  };

  
  if (req.method === 'OPTIONS') {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-amz-*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    };
  }

  
  return {
    ...baseHeaders,
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Expose-Headers': 'x-amz-server-side-encryption, x-amz-request-id, x-amz-id-2'
  };
};

const analyzeImage = async (imageUrl: string, retries = 3): Promise<{ description: string; tags: string[] }> => {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide: 1) A brief description, 2) A list of searchable keywords/tags (comma-separated). Format: DESCRIPTION: [description]\nTAGS: [tag1, tag2, tag3, ...]'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
      }

      const analysisText = data.choices[0].message.content;
      const descriptionMatch = analysisText.match(/DESCRIPTION:\s*(.+?)(?=\nTAGS:|$)/s);
      const tagsMatch = analysisText.match(/TAGS:\s*(.+?)$/s);
      
      const description = descriptionMatch ? descriptionMatch[1].trim() : analysisText;
      const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
      const tags = tagsString.split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      return { description, tags };
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Failed to analyze image after all retries');
};

serve(async (req: Request) => {
  const headers = new Headers(corsHeaders(req));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { imageUrl, imageId } = await req.json();
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing image:', imageId);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide: 1) A brief description, 2) A list of searchable keywords/tags (comma-separated). Format: DESCRIPTION: [description]\nTAGS: [tag1, tag2, tag3, ...]'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected AI response format:', data);
      throw new Error('Invalid AI response format');
    }
    const analysisText = data.choices[0].message.content;
    
    console.log('Analysis result:', analysisText);

    
    const descriptionMatch = analysisText.match(/DESCRIPTION:\s*(.+?)(?=\nTAGS:|$)/s);
    const tagsMatch = analysisText.match(/TAGS:\s*(.+?)$/s);
    
    const description = descriptionMatch ? descriptionMatch[1].trim() : analysisText;
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('images')
      .update({
        ai_description: description,
        tags: tags
      })
      .eq('id', imageId);

    if (updateError) {
      console.error('Error updating image:', updateError);
      throw updateError;
    }

    const responseHeaders = new Headers(corsHeaders(req));
    responseHeaders.set('Content-Type', 'application/json');
    
    return new Response(
      JSON.stringify({ description, tags }),
      { headers: responseHeaders }
    );
  } catch (error) {
    console.error('Error in analyze-image function:', error);
    const errorHeaders = new Headers(corsHeaders(req));
    errorHeaders.set('Content-Type', 'application/json');
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: errorHeaders }
    );
  }
});