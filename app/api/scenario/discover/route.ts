import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import type { Scenario } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

// Streaming model (for progress updates)
const streamingModel = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
});

// Cache for prompt templates
const promptCache = new Map<string, string>();

async function getPromptTemplate(name: string): Promise<string> {
  if (promptCache.has(name)) {
    return promptCache.get(name)!;
  }
  const promptPath = path.join(process.cwd(), 'resources', 'prompts', `${name}.txt`);
  const content = await fs.readFile(promptPath, 'utf-8');
  promptCache.set(name, content);
  return content;
}

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): { content: string; title?: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  
  if (articleMatch) {
    content = articleMatch[1];
  } else if (mainMatch) {
    content = mainMatch[1];
  }
  
  content = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  return { content, title };
}

/**
 * Extract content from a URL using multiple methods with fallbacks
 */
async function extractUrlContent(url: string): Promise<{ content: string; title?: string; source: string }> {
  const errors: string[] = [];

  // Try Jina Reader first
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaResponse = await fetchWithTimeout(jinaUrl, {
      headers: { 'Accept': 'text/plain', 'X-No-Cache': 'true' },
    });
    
    if (jinaResponse.ok) {
      const content = await jinaResponse.text();
      if (content && content.length > 100 && !content.includes('SecurityCompromiseError') && !content.includes('"code":4')) {
        return { content, source: 'jina' };
      }
      if (content.includes('SecurityCompromiseError') || content.includes('"code":4')) {
        errors.push('Jina: Domain temporarily blocked');
      }
    } else {
      errors.push(`Jina: HTTP ${jinaResponse.status}`);
    }
  } catch (err) {
    errors.push(`Jina: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Try Tavily Extract if available
  if (process.env.TAVILY_API_KEY) {
    try {
      const tavilyResponse = await fetchWithTimeout('https://api.tavily.com/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, urls: [url] }),
      });

      if (tavilyResponse.ok) {
        const data = await tavilyResponse.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const content = result.raw_content || result.content || '';
          if (content.length > 100) {
            return { content, title: result.title, source: 'tavily' };
          }
        }
        errors.push('Tavily: Empty content returned');
      } else {
        errors.push(`Tavily: HTTP ${tavilyResponse.status}`);
      }
    } catch (err) {
      errors.push(`Tavily: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Fallback: Direct fetch
  let httpStatus: number | null = null;
  let pageTitle: string | undefined;
  try {
    const directResponse = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    httpStatus = directResponse.status;

    if (directResponse.ok) {
      const html = await directResponse.text();
      const extracted = extractTextFromHtml(html);
      pageTitle = extracted.title;
      
      const is404Page = pageTitle?.toLowerCase().includes('not found') || 
                        pageTitle?.toLowerCase().includes('404') ||
                        pageTitle?.toLowerCase().includes('error');
      
      if (is404Page) {
        errors.push('Direct: Page not found (404)');
      } else if (extracted.content.length > 200) {
        return { content: extracted.content, title: extracted.title, source: 'direct' };
      } else {
        errors.push('Direct: Content too short');
      }
    } else {
      errors.push(`Direct: HTTP ${directResponse.status}`);
    }
  } catch (err) {
    errors.push(`Direct: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.error('All extraction methods failed:', errors);
  
  if (httpStatus === 404 || pageTitle?.toLowerCase().includes('not found')) {
    throw new Error('PAGE_NOT_FOUND');
  } else if (errors.some(e => e.includes('Domain temporarily blocked'))) {
    throw new Error('DOMAIN_BLOCKED');
  } else if (errors.some(e => e.includes('timeout') || e.includes('abort'))) {
    throw new Error('TIMEOUT');
  }
  
  throw new Error('EXTRACTION_FAILED');
}

/**
 * Run a single Tavily search
 */
async function runTavilySearch(searchQuery: string): Promise<string> {
  if (!process.env.TAVILY_API_KEY) return '';
  
  try {
    const tavilyResponse = await fetchWithTimeout('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'basic',
        max_results: 3,
      }),
    }, 10000);
    
    if (tavilyResponse.ok) {
      const data = await tavilyResponse.json();
      return data?.results?.map((res: any) => `${res.title}: ${res.content}`).join('\n') || '';
    }
  } catch {
    // Silently fail
  }
  return '';
}

function generateDefaultSearchQueries(query: string): string[] {
  const baseQuery = query.slice(0, 100);
  return [
    `${baseQuery} latest news`,
    `${baseQuery} key actors involved`,
    `${baseQuery} timeline events`,
  ];
}

function getActorColor(index: number): string {
  const colors = [
    '#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
  ];
  return colors[index % colors.length];
}

/**
 * Extract JSON from text that might contain markdown code blocks
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Process and normalize scenario data
 */
function processScenario(scenario: Scenario): Scenario {
  scenario.id = scenario.id || crypto.randomUUID();
  scenario.actors = scenario.actors.map((actor, i) => ({
    ...actor,
    id: actor.id || `actor-${i}`,
    color: actor.color || getActorColor(i),
  }));
  scenario.milestones = scenario.milestones.map((milestone, i) => ({
    ...milestone,
    id: milestone.id || `milestone-${i}`,
  }));
  return scenario;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const { query, sourceUrl, timeframe } = await request.json();

    if (!query && !sourceUrl) {
      return NextResponse.json({ error: 'Either query or sourceUrl is required' }, { status: 400 });
    }

    // Check if client wants streaming
    const acceptHeader = request.headers.get('accept') || '';
    const wantsStream = acceptHeader.includes('text/event-stream');

    const isUrlBased = !!sourceUrl;
    
    // Start loading prompt template immediately
    const promptTemplatePromise = getPromptTemplate(
      isUrlBased ? 'url-scenario-discovery' : 'scenario-discovery'
    );

    // STREAMING RESPONSE
    if (wantsStream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let extractedContent = '';
            let searchContext = '';
            let effectiveQuery = query || '';

            // Step 1: Extract content (if URL-based)
            if (isUrlBased) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', step: 'extracting', message: 'Extracting content from URL...' })}\n\n`));
              
              const basicSearchQueries = generateDefaultSearchQueries(sourceUrl);
              
              const [extractionResult, ...basicSearchResults] = await Promise.allSettled([
                extractUrlContent(sourceUrl),
                ...basicSearchQueries.map(q => runTavilySearch(q))
              ]);

              if (extractionResult.status === 'rejected') {
                const errorMessage = extractionResult.reason?.message || '';
                let userMessage = 'Failed to extract content from the provided URL.';
                if (errorMessage === 'PAGE_NOT_FOUND') userMessage = 'The URL returned a "Page Not Found" error.';
                else if (errorMessage === 'DOMAIN_BLOCKED') userMessage = 'This website is temporarily unavailable.';
                else if (errorMessage === 'TIMEOUT') userMessage = 'The request timed out.';
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: userMessage })}\n\n`));
                controller.close();
                return;
              }

              const extracted = extractionResult.value;
              extractedContent = extracted.content;
              effectiveQuery = extractedContent.slice(0, 500);

              searchContext = basicSearchResults
                .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
                .map(r => r.value)
                .join('\n\n');
                
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', step: 'extracted', message: 'Content extracted successfully' })}\n\n`));
            } else {
              // Query-based: Run searches
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', step: 'searching', message: 'Searching for context...' })}\n\n`));
              
              const defaultQueries = generateDefaultSearchQueries(query);
              const searchResults = await Promise.allSettled(defaultQueries.map(q => runTavilySearch(q)));
              
              searchContext = searchResults
                .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
                .map(r => r.value)
                .join('\n\n');
                
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', step: 'searched', message: 'Context gathered' })}\n\n`));
            }

            // Step 2: Generate scenario
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', step: 'generating', message: 'Generating scenario with AI...', progress: 30 })}\n\n`));

            const systemPrompt = await promptTemplatePromise;
            
            let userMessage: string;
            if (isUrlBased) {
              userMessage = `## EXTRACTED CONTENT FROM URL
Source URL: ${sourceUrl}

${extractedContent.slice(0, 8000)}

${searchContext ? `## ADDITIONAL CONTEXT FROM WEB SEARCH\n${searchContext}` : ''}

${timeframe ? `Timeframe: ${timeframe}` : ''}

Based on the above URL content and additional context, create a comprehensive geopolitical scenario. IMPORTANT: Return ONLY valid JSON.`;
            } else {
              userMessage = searchContext 
                ? `Analyze this scenario: "${query}"${timeframe ? ` (timeframe: ${timeframe})` : ''}\n\nHere is current information from web search:\n${searchContext}\n\nIMPORTANT: Return ONLY valid JSON.`
                : `Analyze this scenario: "${query}"${timeframe ? ` (timeframe: ${timeframe})` : ''}\n\nIMPORTANT: Return ONLY valid JSON.`;
            }

            const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
            
            // Use streaming for LLM generation
            const result = await streamingModel.generateContentStream(fullPrompt);
            let fullText = '';
            let chunkCount = 0;

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              fullText += chunkText;
              chunkCount++;

              // Send progress updates
              if (chunkCount % 5 === 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  step: 'generating',
                  message: 'Building scenario...',
                  progress: Math.min(90, 30 + chunkCount * 2)
                })}\n\n`));
              }
            }

            // Parse and process scenario
            const cleanedJson = extractJSON(fullText);
            const scenario: Scenario = JSON.parse(cleanedJson);
            const processed = processScenario(scenario);

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              scenario: processed 
            })}\n\n`));

            controller.close();
          } catch (error) {
            console.error('Streaming scenario discovery error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Failed to discover scenario. Please try again.' 
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // NON-STREAMING RESPONSE (original behavior)
    let extractedContent = '';
    let searchContext = '';
    let effectiveQuery = query || '';

    if (isUrlBased) {
      const basicSearchQueries = generateDefaultSearchQueries(sourceUrl);
      
      const [extractionResult, ...basicSearchResults] = await Promise.allSettled([
        extractUrlContent(sourceUrl),
        ...basicSearchQueries.map(q => runTavilySearch(q))
      ]);

      if (extractionResult.status === 'rejected') {
        const errorMessage = extractionResult.reason?.message || '';
        let userMessage = 'Failed to extract content from the provided URL. Please check the URL and try again.';
        if (errorMessage === 'PAGE_NOT_FOUND') {
          userMessage = 'The URL returned a "Page Not Found" error. Please check that the URL is complete and valid.';
        } else if (errorMessage === 'DOMAIN_BLOCKED') {
          userMessage = 'This website is temporarily unavailable for content extraction. Please try a different URL or try again later.';
        } else if (errorMessage === 'TIMEOUT') {
          userMessage = 'The request timed out. The website may be slow or unavailable. Please try again.';
        }
        return NextResponse.json({ error: userMessage }, { status: 400 });
      }

      const extracted = extractionResult.value;
      extractedContent = extracted.content;
      effectiveQuery = extractedContent.slice(0, 500);
      console.log(`Extracted ${extractedContent.length} chars from URL via ${extracted.source}`);

      searchContext = basicSearchResults
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
        .map(r => r.value)
        .join('\n\n');
    } else {
      const defaultQueries = generateDefaultSearchQueries(query);
      
      const [searchQueryPromptResult, ...defaultSearchResults] = await Promise.allSettled([
        (async () => {
          try {
            const searchQueryPrompt = await getPromptTemplate('web-search-query');
            const queryPrompt = `${searchQueryPrompt.replace('{{USER_QUERY}}', effectiveQuery)}\n\nGenerate search queries for: ${effectiveQuery}`;
            const queryResult = await model.generateContent(queryPrompt);
            const queryResponseText = queryResult.response.text();
            const searchQueries = JSON.parse(queryResponseText || '{}');
            return (searchQueries.queries || []).map((q: { query: string }) => q.query) as string[];
          } catch {
            return [];
          }
        })(),
        ...defaultQueries.map(q => runTavilySearch(q))
      ]);

      searchContext = defaultSearchResults
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
        .map(r => r.value)
        .join('\n\n');

      if (searchQueryPromptResult.status === 'fulfilled' && searchQueryPromptResult.value.length > 0) {
        const llmQueries = searchQueryPromptResult.value;
        const additionalQueries = llmQueries.filter((q: string) => 
          !defaultQueries.some(dq => dq.toLowerCase().includes(q.toLowerCase().slice(0, 20)))
        ).slice(0, 2);

        if (additionalQueries.length > 0) {
          const additionalResults = await Promise.allSettled(
            additionalQueries.map((q: string) => runTavilySearch(q))
          );
          const additionalContext = additionalResults
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
            .map(r => r.value)
            .join('\n\n');
          
          if (additionalContext) {
            searchContext = searchContext ? `${searchContext}\n\n${additionalContext}` : additionalContext;
          }
        }
      }
    }

    const systemPrompt = await promptTemplatePromise;

    let userMessage: string;
    if (isUrlBased) {
      userMessage = `## EXTRACTED CONTENT FROM URL
Source URL: ${sourceUrl}

${extractedContent.slice(0, 8000)}

${searchContext ? `## ADDITIONAL CONTEXT FROM WEB SEARCH\n${searchContext}` : ''}

${timeframe ? `Timeframe: ${timeframe}` : ''}

Based on the above URL content and additional context, create a comprehensive geopolitical scenario.`;
    } else {
      userMessage = searchContext 
        ? `Analyze this scenario: "${query}"${timeframe ? ` (timeframe: ${timeframe})` : ''}\n\nHere is current information from web search:\n${searchContext}`
        : `Analyze this scenario: "${query}"${timeframe ? ` (timeframe: ${timeframe})` : ''}`;
    }

    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    if (!content) {
      throw new Error('No content in response');
    }

    const scenario: Scenario = JSON.parse(content);
    const processed = processScenario(scenario);

    return NextResponse.json({ scenario: processed });
  } catch (error) {
    console.error('Scenario discovery error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('403') || errorMessage.includes('unregistered callers') || errorMessage.includes('API Key')) {
      return NextResponse.json(
        { error: 'Invalid or expired Gemini API key. Please check your GEMINI_API_KEY in .env.local.' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to discover scenario. Please try again.' },
      { status: 500 }
    );
  }
}
