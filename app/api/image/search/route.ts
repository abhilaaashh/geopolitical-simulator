import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// In-memory cache as first-level cache
const memoryCache = new Map<string, { dataUrl: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hour cache (increased from 1 hour)

// Persistent cache directory
const CACHE_DIR = path.join(process.cwd(), '.cache', 'images');

/**
 * Generate a short hash for the cache key
 */
function hashKey(key: string): string {
  return crypto.createHash('md5').update(key).digest('hex').slice(0, 16);
}

/**
 * Read from persistent file cache
 */
async function readFromFileCache(cacheKey: string): Promise<string | null> {
  try {
    const hashedKey = hashKey(cacheKey);
    const cachePath = path.join(CACHE_DIR, `${hashedKey}.json`);
    const data = await fs.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      // Refresh memory cache
      memoryCache.set(cacheKey, {
        dataUrl: parsed.dataUrl,
        timestamp: parsed.timestamp,
      });
      return parsed.dataUrl;
    }
    
    // Cache expired, delete file
    await fs.unlink(cachePath).catch(() => {});
    return null;
  } catch {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Write to persistent file cache
 */
async function writeToFileCache(cacheKey: string, dataUrl: string): Promise<void> {
  try {
    // Ensure cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });
    
    const hashedKey = hashKey(cacheKey);
    const cachePath = path.join(CACHE_DIR, `${hashedKey}.json`);
    const data = JSON.stringify({
      key: cacheKey,
      dataUrl,
      timestamp: Date.now(),
    });
    
    await fs.writeFile(cachePath, data, 'utf-8');
  } catch (error) {
    console.warn('Failed to write to file cache:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const cacheKey = query.toLowerCase().trim();

    // Check memory cache first (fastest)
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_TTL) {
      return NextResponse.json({ 
        url: memoryCached.dataUrl, 
        cached: true,
        cacheType: 'memory'
      });
    }

    // Check file cache second (persistent across restarts)
    const fileCached = await readFromFileCache(cacheKey);
    if (fileCached) {
      return NextResponse.json({ 
        url: fileCached, 
        cached: true,
        cacheType: 'file'
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

    // Use Gemini 2.0 Flash Experimental for image generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
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
      
      // Cache the result in memory
      memoryCache.set(cacheKey, {
        dataUrl,
        timestamp: Date.now(),
      });

      // Also write to file cache (async, don't wait)
      writeToFileCache(cacheKey, dataUrl);

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
