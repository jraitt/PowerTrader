import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult, URLImportResult, ItemCategoryType } from '@/types/item';

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Rate limiting and retry configuration
 */
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

let lastRequestTime = 0;

/**
 * Simple rate limiting
 */
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return await fn();
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Request failed, retrying in ${RETRY_DELAY}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Analyze photos using Gemini Vision API
 */
export async function analyzePhotos(photos: File[]): Promise<AIAnalysisResult> {
  if (!photos.length) {
    throw new Error('At least one photo is required for analysis');
  }

  return withRetry(async () => {
    return rateLimitedRequest(async () => {
      const genModel = genAI.getGenerativeModel({ model });

      // Convert first photo to base64 for analysis
      const photo = photos[0];
      const buffer = await photo.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const prompt = `
        Analyze this image of small engine machinery and extract the following information:
        
        1. Category: Determine if this is an ATV, Snowmobile, Trailer, or Small Engine
        2. Manufacturer: Identify the brand/manufacturer if visible
        3. Model: Identify the specific model if visible
        4. Condition: Rate the condition from 1-10 based on visible wear, damage, and overall appearance
        5. Description: Provide a detailed description including any notable features, damage, or modifications
        
        Please respond in valid JSON format with the following structure:
        {
          "category": "ATV|Snowmobile|Trailer|Small Engine",
          "manufacturer": "string or 'Unknown'",
          "model": "string or 'Unknown'",
          "condition": number (1-10),
          "description": "detailed description",
          "confidence": number (0-100),
          "suggestions": ["array of helpful suggestions for the listing"]
        }
        
        Be conservative with confidence scores and indicate when information is uncertain.
      `;

      const result = await genModel.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: photo.type,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const analysis = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
        
        // Validate the response structure
        if (!analysis.category || !analysis.condition || !analysis.description) {
          throw new Error('Invalid analysis result structure');
        }

        // Ensure condition is within valid range
        analysis.condition = Math.max(1, Math.min(10, analysis.condition));
        
        // Ensure confidence is within valid range
        analysis.confidence = Math.max(0, Math.min(100, analysis.confidence || 50));

        return analysis;
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        throw new Error('Failed to parse AI analysis result');
      }
    });
  });
}

/**
 * Import item data from URL (Facebook Marketplace, Craigslist, etc.)
 */
export async function importFromURL(url: string): Promise<URLImportResult> {
  if (!url || !isValidURL(url)) {
    throw new Error('Valid URL is required');
  }

  return withRetry(async () => {
    return rateLimitedRequest(async () => {
      const genModel = genAI.getGenerativeModel({ model });

      const prompt = `
        Extract information from this marketplace listing URL: ${url}
        
        Please fetch and analyze the content to extract:
        1. Title/heading of the listing
        2. Description/details
        3. Price (if listed)
        4. Location (if mentioned)
        5. Any image URLs
        6. Additional metadata
        
        Respond in valid JSON format:
        {
          "title": "string",
          "description": "string",
          "price": number or null,
          "location": "string or null",
          "photos": ["array of image URLs"],
          "metadata": {
            "source": "facebook|craigslist|other",
            "listingId": "string if available",
            "contactInfo": "string if available"
          }
        }
        
        Note: This is a mock implementation. In production, you would need to implement proper web scraping with appropriate rate limiting and respect for robots.txt.
      `;

      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const importResult = JSON.parse(jsonMatch[0]) as URLImportResult;
        
        // Validate required fields
        if (!importResult.title) {
          importResult.title = 'Imported Item';
        }
        if (!importResult.description) {
          importResult.description = 'No description available';
        }
        if (!importResult.photos) {
          importResult.photos = [];
        }
        if (!importResult.metadata) {
          importResult.metadata = {};
        }

        return importResult;
      } catch (parseError) {
        console.error('Failed to parse URL import response:', text);
        throw new Error('Failed to parse URL import result');
      }
    });
  });
}

/**
 * Generate optimized description for an item
 */
export async function generateDescription(
  category: ItemCategoryType,
  manufacturer: string,
  model: string,
  condition: number,
  additionalDetails?: string
): Promise<string> {
  return withRetry(async () => {
    return rateLimitedRequest(async () => {
      const genModel = genAI.getGenerativeModel({ model });

      const prompt = `
        Create an engaging and detailed description for a ${category} listing:
        
        Details:
        - Manufacturer: ${manufacturer}
        - Model: ${model}
        - Condition: ${condition}/10
        ${additionalDetails ? `- Additional Details: ${additionalDetails}` : ''}
        
        Write a professional marketplace description that:
        1. Highlights key features and benefits
        2. Mentions the condition appropriately
        3. Uses compelling language to attract buyers
        4. Includes relevant keywords for searchability
        5. Is 100-200 words long
        
        Write in a friendly but professional tone suitable for online marketplaces.
      `;

      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    });
  });
}

/**
 * Get pricing suggestions based on market data
 */
export async function getPricingSuggestions(
  category: ItemCategoryType,
  manufacturer: string,
  model: string,
  year?: number,
  condition?: number
): Promise<{
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  marketInsights: string[];
}> {
  return withRetry(async () => {
    return rateLimitedRequest(async () => {
      const genModel = genAI.getGenerativeModel({ model });

      const prompt = `
        Provide pricing suggestions for this ${category}:
        - Manufacturer: ${manufacturer}
        - Model: ${model}
        ${year ? `- Year: ${year}` : ''}
        ${condition ? `- Condition: ${condition}/10` : ''}
        
        Based on typical market values, provide:
        1. A suggested listing price
        2. A realistic price range (min/max)
        3. Market insights and pricing tips
        
        Respond in JSON format:
        {
          "suggestedPrice": number,
          "priceRange": { "min": number, "max": number },
          "marketInsights": ["array of helpful insights"]
        }
        
        Consider factors like depreciation, condition, market demand, and seasonal variations.
      `;

      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in pricing response');
        }

        const pricing = JSON.parse(jsonMatch[0]);
        
        // Validate and set defaults
        pricing.suggestedPrice = pricing.suggestedPrice || 1000;
        pricing.priceRange = pricing.priceRange || { min: 800, max: 1200 };
        pricing.marketInsights = pricing.marketInsights || ['Market data unavailable'];

        return pricing;
      } catch (parseError) {
        console.error('Failed to parse pricing response:', text);
        // Return default pricing
        return {
          suggestedPrice: 1000,
          priceRange: { min: 800, max: 1200 },
          marketInsights: ['Unable to fetch current market pricing'],
        };
      }
    });
  });
}

/**
 * Validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return process.env.ENABLE_AI_FEATURES === 'true' && !!apiKey;
}

/**
 * Get AI service status for health checks
 */
export async function getAIStatus(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    if (!apiKey) {
      return { status: 'error', message: 'API key not configured' };
    }

    // Simple test request
    await rateLimitedRequest(async () => {
      const genModel = genAI.getGenerativeModel({ model });
      await genModel.generateContent('Test');
    });

    return { status: 'ok', message: 'AI service operational' };
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}