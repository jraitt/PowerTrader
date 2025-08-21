import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult, URLImportResult, ItemCategoryType } from '@/types/item';

// Get configuration
const model = process.env['GEMINI_MODEL'] || 'gemini-2.5-flash';

// Initialize Gemini AI lazily to avoid build-time errors
function getGenAI() {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenerativeAI(apiKey);
}

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
      const genModel = getGenAI().getGenerativeModel({ model });

      // Convert first photo to base64 for analysis
      const photo = photos[0];
      if (!photo) {
        throw new Error('No photo provided for analysis');
      }
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
            mimeType: photo?.type || 'image/jpeg',
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
export async function importFromURL(url: string, itemId?: string): Promise<URLImportResult> {
  if (!url || !isValidURL(url)) {
    throw new Error('Valid URL is required');
  }

  // Import the scraper module dynamically
  const { scrapeMarketplaceURL } = await import('@/lib/scraper/marketplace');

  return withRetry(async () => {
    return rateLimitedRequest(async () => {
      try {
        // Try web scraping first
        console.log(`Attempting to scrape URL: ${url}`);
        const scrapedResult = await scrapeMarketplaceURL(url);
        
        // Download images if we have photos and an itemId
        let processedResult = scrapedResult;
        if (itemId && scrapedResult.photos && scrapedResult.photos.length > 0) {
          try {
            console.log(`Attempting to download ${scrapedResult.photos.length} images for item ${itemId}`);
            
            // Import the image downloader
            const { downloadAndUploadImages, saveImageRecords } = await import('@/lib/scraper/image-downloader');
            
            // Download and upload images
            const downloadResults = await downloadAndUploadImages(scrapedResult.photos, itemId);
            
            // Save successful images to database
            await saveImageRecords(itemId, downloadResults);
            
            // Update result with downloaded image URLs
            const successfulUploads = downloadResults
              .filter(result => result.supabaseUrl)
              .map(result => result.supabaseUrl!);
            
            if (successfulUploads.length > 0) {
              processedResult = {
                ...scrapedResult,
                photos: successfulUploads,
                metadata: {
                  ...scrapedResult.metadata,
                  downloadedImages: successfulUploads.length,
                  originalImageCount: scrapedResult.photos.length,
                }
              };
              console.log(`Successfully downloaded and stored ${successfulUploads.length} images`);
            }
          } catch (imageError) {
            console.warn('Image download failed, continuing with original URLs:', imageError);
            // Continue with original image URLs if download fails
          }
        }
        
        // Enhance with AI if we have a good description
        if (processedResult.description && processedResult.description.length > 50) {
          try {
            const enhanced = await enhanceWithAI(processedResult);
            return enhanced;
          } catch (aiError) {
            console.warn('AI enhancement failed, returning scraped data:', aiError);
            return processedResult;
          }
        }
        
        return processedResult;
        
      } catch (scrapeError) {
        console.error('Web scraping failed:', scrapeError);
        throw new Error(`Failed to import from URL: ${scrapeError instanceof Error ? scrapeError.message : 'Unknown error'}`);
      }
    });
  });
}

/**
 * Enhance scraped data with AI analysis
 */
async function enhanceWithAI(scrapedData: URLImportResult): Promise<URLImportResult> {
  const genModel = getGenAI().getGenerativeModel({ model });

  const extractedYear = scrapedData.metadata?.extractedYear;
  
  const prompt = `
    Analyze this marketplace listing data and enhance it for PowerTrader inventory:
    
    Original Data:
    - Title: ${scrapedData.title}
    - Description: ${scrapedData.description}
    - Price: ${scrapedData.price || 'Not specified'}
    - Location: ${scrapedData.location || 'Not specified'}
    ${extractedYear ? `- Extracted Year: ${extractedYear}` : ''}
    
    Please enhance this data by:
    1. Extracting manufacturer and model from title/description
    2. Identifying category (ATV, Snowmobile, Trailer, Small Engine)
    3. Extracting the year - look for 4-digit years like 2000, 1995, etc.
    4. Estimating condition (1-10) based on description
    5. Cleaning up and improving the description
    6. Validating the price if it seems reasonable
    
    IMPORTANT: Pay special attention to extracting the YEAR from the title or description.
    Look for patterns like "2000 Yamaha", "Yamaha 2000", "Year: 2000", etc.
    
    Respond in JSON format with enhanced data:
    {
      "title": "cleaned title",
      "description": "enhanced description", 
      "price": number or null,
      "location": "string or null",
      "photos": ["existing photo URLs"],
      "enhancedMetadata": {
        "suggestedCategory": "ATV|Snowmobile|Trailer|Small Engine|Unknown",
        "suggestedManufacturer": "string or Unknown",
        "suggestedModel": "string or Unknown",
        "suggestedYear": number or null,
        "estimatedCondition": number (1-10),
        "priceAnalysis": "brief price assessment"
      },
      "metadata": {
        "source": "${scrapedData.metadata?.source || 'unknown'}",
        "listingId": "${scrapedData.metadata?.listingId || ''}",
        "aiEnhanced": true
      }
    }
  `;

  const result = await genModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If AI enhancement fails, return original data
      return scrapedData;
    }

    const enhanced = JSON.parse(jsonMatch[0]) as URLImportResult & {
      enhancedMetadata?: any;
    };
    
    // Merge enhanced data with original photos
    return {
      ...enhanced,
      photos: scrapedData.photos || [],
      metadata: {
        ...scrapedData.metadata,
        ...enhanced.metadata,
        enhancedMetadata: enhanced.enhancedMetadata,
      },
    };
  } catch (parseError) {
    console.warn('AI enhancement parsing failed, returning original data:', parseError);
    return scrapedData;
  }
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
      const genModel = getGenAI().getGenerativeModel({ model });

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
      const genModel = getGenAI().getGenerativeModel({ model });

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
  return process.env['ENABLE_AI_FEATURES'] === 'true' && !!process.env['GEMINI_API_KEY'];
}

/**
 * Get AI service status for health checks
 */
export async function getAIStatus(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    if (!process.env['GEMINI_API_KEY']) {
      return { status: 'error', message: 'API key not configured' };
    }

    // Simple test request
    await rateLimitedRequest(async () => {
      const genModel = getGenAI().getGenerativeModel({ model });
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