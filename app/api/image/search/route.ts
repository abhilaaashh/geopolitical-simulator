import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Cache to avoid duplicate API calls for the same query
const imageCache = new Map<string, { dataUrl: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ 
        url: cached.dataUrl, 
        cached: true 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured');
      return NextResponse.json({ 
        url: null, 
        error: 'Image service not configured',
        fallback: true 
      });
    }

    // Use Nano Banana (Gemini 2.5 Flash Image) for image generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image',
    });

    // Create a prompt optimized for news article images
    const imagePrompt = createNewsImagePrompt(query);

    const result = await model.generateContent({
      contents: [{ 
        role: 'user',
        parts: [{ text: imagePrompt }] 
      }],
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any, // Type assertion needed for image generation config
    });

    const response = result.response;
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ 
        url: null, 
        error: 'No image generated',
        fallback: true 
      });
    }

    // Find the image part in the response
    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData);
    
    if (imagePart && imagePart.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      const dataUrl = `data:${mimeType};base64,${data}`;
      
      // Cache the result
      imageCache.set(cacheKey, {
        dataUrl,
        timestamp: Date.now(),
      });

      return NextResponse.json({ url: dataUrl });
    }

    return NextResponse.json({ 
      url: null, 
      error: 'No image in response',
      fallback: true 
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { url: null, error: 'Failed to generate image', fallback: true },
      { status: 500 }
    );
  }
}

/**
 * Create an optimized prompt for generating news-style images
 */
function createNewsImagePrompt(description: string): string {
  return `Generate a photorealistic, professional news photograph for this scene: ${description}

Style requirements:
- Photojournalistic style, like a Reuters or AP news photo
- Realistic lighting and composition
- Landscape orientation (16:9 aspect ratio)
- No text, watermarks, or logos in the image
- Professional, editorial quality
- Suitable for a news article header image`;
}
