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

async function getPromptTemplate(name: string): Promise<string> {
  const promptPath = path.join(process.cwd(), 'resources', 'prompts', `${name}.txt`);
  return fs.readFile(promptPath, 'utf-8');
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
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  
  // Remove script and style elements
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // Get article or main content if available
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  
  if (articleMatch) {
    content = articleMatch[1];
  } else if (mainMatch) {
    content = mainMatch[1];
  }
  
  // Remove remaining HTML tags and clean up whitespace
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

  // Try Jina Reader first (free, no API key needed)
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaResponse = await fetchWithTimeout(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-No-Cache': 'true',
      },
    });
    
    if (jinaResponse.ok) {
      const content = await jinaResponse.text();
      // Check for error responses from Jina
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
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          urls: [url],
        }),
      });

      if (tavilyResponse.ok) {
        const data = await tavilyResponse.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const content = result.raw_content || result.content || '';
          if (content.length > 100) {
            return { 
              content, 
              title: result.title,
              source: 'tavily' 
            };
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

  // Fallback: Direct fetch with browser-like headers
  let httpStatus: number | null = null;
  let pageTitle: string | undefined;
  try {
    const directResponse = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    httpStatus = directResponse.status;

    if (directResponse.ok) {
      const html = await directResponse.text();
      const extracted = extractTextFromHtml(html);
      pageTitle = extracted.title;
      
      // Check if this is a 404/error page based on title
      const is404Page = pageTitle?.toLowerCase().includes('not found') || 
                        pageTitle?.toLowerCase().includes('404') ||
                        pageTitle?.toLowerCase().includes('error');
      
      if (is404Page) {
        errors.push('Direct: Page not found (404)');
      } else if (extracted.content.length > 200) {
        return { 
          content: extracted.content, 
          title: extracted.title,
          source: 'direct' 
        };
      } else {
        errors.push('Direct: Content too short after extraction');
      }
    } else {
      errors.push(`Direct: HTTP ${directResponse.status}`);
    }
  } catch (err) {
    errors.push(`Direct: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.error('All extraction methods failed:', errors);
  
  // Provide a more specific error message
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
 * Generate search queries based on extracted content to gather additional context
 */
async function generateSearchQueriesFromContent(content: string): Promise<string[]> {
  const prompt = `Based on this content, generate 3 search queries to find additional context about the key actors, timeline, and background of the events described. Return as JSON: { "queries": ["query1", "query2", "query3"] }

Content:
${content.slice(0, 2000)}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText || '{}');
    return parsed.queries || [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, sourceUrl, timeframe } = await request.json();

    if (!query && !sourceUrl) {
      return NextResponse.json({ error: 'Either query or sourceUrl is required' }, { status: 400 });
    }

    // Determine if this is a URL-based or query-based discovery
    const isUrlBased = !!sourceUrl;
    let extractedContent = '';
    let effectiveQuery = query || '';

    // If URL provided, extract content from it
    if (isUrlBased) {
      try {
        const extracted = await extractUrlContent(sourceUrl);
        extractedContent = extracted.content;
        // Use the first 200 chars of extracted content as a summary for search queries
        effectiveQuery = extractedContent.slice(0, 500);
        console.log(`Extracted ${extractedContent.length} chars from URL via ${extracted.source}`);
      } catch (err) {
        console.error('URL extraction failed:', err);
        const errorMessage = err instanceof Error ? err.message : '';
        
        let userMessage = 'Failed to extract content from the provided URL. Please check the URL and try again.';
        if (errorMessage === 'PAGE_NOT_FOUND') {
          userMessage = 'The URL returned a "Page Not Found" error. Please check that the URL is complete and valid.';
        } else if (errorMessage === 'DOMAIN_BLOCKED') {
          userMessage = 'This website is temporarily unavailable for content extraction. Please try a different URL or try again later.';
        } else if (errorMessage === 'TIMEOUT') {
          userMessage = 'The request timed out. The website may be slow or unavailable. Please try again.';
        }
        
        return NextResponse.json(
          { error: userMessage },
          { status: 400 }
        );
      }
    }

    // Get the appropriate prompt template
    const systemPrompt = await getPromptTemplate(
      isUrlBased ? 'url-scenario-discovery' : 'scenario-discovery'
    );

    // Use web search to gather current information (if available)
    let searchContext = '';
    try {
      let searchQueriesToUse: string[] = [];

      if (isUrlBased && extractedContent) {
        // For URL-based: generate queries from the extracted content
        searchQueriesToUse = await generateSearchQueriesFromContent(extractedContent);
      } else {
        // For query-based: use the existing prompt template
        const searchQueryPrompt = await getPromptTemplate('web-search-query');
        const queryPrompt = `${searchQueryPrompt.replace('{{USER_QUERY}}', effectiveQuery)}\n\nGenerate search queries for: ${effectiveQuery}`;
        
        const queryResult = await model.generateContent(queryPrompt);
        const queryResponseText = queryResult.response.text();
        const searchQueries = JSON.parse(queryResponseText || '{}');
        searchQueriesToUse = (searchQueries.queries || []).map((q: { query: string }) => q.query);
      }
      
      // If Tavily API is available, use it for search
      if (process.env.TAVILY_API_KEY && searchQueriesToUse.length > 0) {
        const searchPromises = searchQueriesToUse.slice(0, 3).map(async (searchQuery: string) => {
          try {
            const tavilyResponse = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: searchQuery,
                search_depth: 'basic',
                max_results: 3,
              }),
            });
            return tavilyResponse.json();
          } catch {
            return null;
          }
        });

        const searchResults = await Promise.all(searchPromises);
        searchContext = searchResults
          .filter(Boolean)
          .map((r: any) => r?.results?.map((res: any) => `${res.title}: ${res.content}`).join('\n'))
          .join('\n\n');
      }
    } catch (err) {
      console.log('Search skipped:', err);
    }

    // Generate the scenario
    let userMessage: string;
    
    if (isUrlBased) {
      // URL-based: provide extracted content as primary source
      userMessage = `## EXTRACTED CONTENT FROM URL
Source URL: ${sourceUrl}

${extractedContent.slice(0, 8000)}

${searchContext ? `## ADDITIONAL CONTEXT FROM WEB SEARCH\n${searchContext}` : ''}

${timeframe ? `Timeframe: ${timeframe}` : ''}

Based on the above URL content and additional context, create a comprehensive geopolitical scenario.`;
    } else {
      // Query-based: existing behavior
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

    // Ensure IDs are set
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

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error('Scenario discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to discover scenario' },
      { status: 500 }
    );
  }
}

function getActorColor(index: number): string {
  const colors = [
    '#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
  ];
  return colors[index % colors.length];
}
