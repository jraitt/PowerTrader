import { URLImportResult } from '@/types/item';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Scrape Facebook Marketplace listing
 */
export async function scrapeFacebookMarketplace(url: string): Promise<URLImportResult> {
  try {
    console.log(`Scraping Facebook Marketplace URL: ${url}`);
    
    // Add user agent to avoid blocking
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Hybrid Approach: HTML parsing for text data + AI for photos
    console.log('Using hybrid extraction: HTML for text data, AI for photos...');
    
    // Extract text data using HTML parsing (reliable)
    const structuredData = extractStructuredData(html);
    const title = structuredData?.title || extractTitle(html) || 'Facebook Marketplace Item';
    const description = structuredData?.description || extractDescription(html) || 'No description available';
    const price = extractPrice(html);
    const location = extractLocation(html);
    
    // Extract photos using AI (more accurate photo selection)
    let photos: string[] = [];
    if (structuredData?.photos?.length) {
      photos = structuredData.photos;
      console.log('Using structured data photos');
    } else {
      try {
        console.log('Using AI for photo extraction...');
        photos = await extractPhotosWithGeminiAI(html, url);
        console.log(`AI photo extraction successful: ${photos.length} photos`);
      } catch (error) {
        console.warn('AI photo extraction failed, falling back to pattern matching:', error);
        photos = await extractPhotos(html, url);
      }
    }
    
    // Debug logging to understand the extraction
    console.log(`Extracted ${photos.length} photos from Facebook listing`);
    console.log('Data source:', structuredData ? 'Structured Data (GraphQL/JSON-LD)' : 'HTML Pattern Matching');
    if (photos.length > 0) {
      console.log('Sample photo URLs:', photos.slice(0, 3));
      console.log('Photo URL characteristics:', {
        hasT39Images: photos.some(p => p.includes('t39.30808-6')),
        hasT45Images: photos.some(p => p.includes('t45.')),
        hasS960Images: photos.some(p => p.includes('s960x960')),
        hasHighResImages: photos.some(p => p.includes('1080') || p.includes('960') || p.includes('720')),
        avgUrlLength: Math.round(photos.reduce((sum, p) => sum + p.length, 0) / photos.length),
        sampleFormats: photos.slice(0, 2).map(p => {
          const match = p.match(/\/t\d+\.[^\/]+/);
          return match ? match[0] : 'unknown';
        }),
      });
    }
    
    const result: URLImportResult = {
      title,
      description,
      price,
      location,
      photos,
      metadata: {
        source: 'facebook',
        listingId: extractListingId(url),
        extractedAt: new Date().toISOString(),
        extractedYear: extractYear(title, description),
        extractionMethod: 'hybrid-html-ai',
      },
    };

    console.log('Facebook Marketplace scraping result summary:', {
      title: result.title,
      description: result.description?.substring(0, 100) + '...',
      photoCount: result.photos.length,
      price: result.price,
      location: result.location,
    });
    
    return result;

  } catch (error) {
    console.error('Error scraping Facebook Marketplace:', error);
    throw new Error(`Failed to scrape Facebook Marketplace: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Scrape Craigslist listing
 */
export async function scrapeCraigslist(url: string): Promise<URLImportResult> {
  try {
    console.log(`Scraping Craigslist URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    const result: URLImportResult = {
      title: extractCraigslistTitle(html) || 'Craigslist Item',
      description: extractCraigslistDescription(html) || 'No description available',
      price: extractCraigslistPrice(html),
      location: extractCraigslistLocation(html),
      photos: extractCraigslistPhotos(html),
      metadata: {
        source: 'craigslist',
        listingId: extractCraigslistId(url),
        extractedAt: new Date().toISOString(),
      },
    };

    console.log('Craigslist scraping result:', result);
    return result;

  } catch (error) {
    console.error('Error scraping Craigslist:', error);
    throw new Error(`Failed to scrape Craigslist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract structured data from Facebook Marketplace HTML (JSON-LD, GraphQL responses, etc.)
 */
function extractStructuredData(html: string): {
  title: string | null;
  description: string | null;
  photos: string[];
  price: number | null;
  location: string | null;
} | null {
  try {
    // Look for JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        try {
          const data = JSON.parse(jsonContent);
          if (data['@type'] === 'Product' || data.name || data.image) {
            return {
              title: data.name || null,
              description: data.description || null,
              photos: Array.isArray(data.image) ? data.image.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) : 
                      typeof data.image === 'string' ? [data.image] : [],
              price: data.offers?.price || data.price || null,
              location: data.location?.name || data.address?.addressLocality || null,
            };
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Look for Facebook GraphQL or marketplace-specific JSON data
    const graphqlMatches = [
      ...html.matchAll(/__RELAY_STORE__.*?=.*?(\{.*?\});/gs),
      ...html.matchAll(/window\.__RELAY_STORE__.*?=.*?(\{.*?\});/gs),
      ...html.matchAll(/window\.__additionalDataLoaded.*?=.*?(\{.*?\});/gs),
    ];
    
    for (const match of graphqlMatches) {
      try {
        const jsonMatch = match[1];
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch);
          
          // Look for marketplace listing data in the GraphQL response
          const findMarketplaceData = (obj: any): any => {
            if (typeof obj !== 'object' || !obj) return null;
            
            // Look for marketplace listing indicators
            if (obj.marketplace_listing_title || obj.listing_title || 
                (obj.title && obj.primary_listing_photo)) {
              return obj;
            }
            
            // Look for photo arrays that might be listing photos
            if (obj.photos && Array.isArray(obj.photos) && obj.photos.length > 0) {
              const hasListingPhotos = obj.photos.some((photo: any) => 
                photo?.image?.uri || photo?.uri
              );
              if (hasListingPhotos) {
                return obj;
              }
            }
            
            // Recursively search in nested objects
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                const result = findMarketplaceData(obj[key]);
                if (result) return result;
              }
            }
            
            return null;
          };
          
          const marketplaceData = findMarketplaceData(data);
          if (marketplaceData) {
            const photos: string[] = [];
            
            // Extract photos from various possible structures
            if (marketplaceData.photos) {
              marketplaceData.photos.forEach((photo: any) => {
                const uri = photo?.image?.uri || photo?.uri || photo?.url;
                if (uri && typeof uri === 'string') {
                  photos.push(uri.replace(/\\\//g, '/'));
                }
              });
            }
            
            if (marketplaceData.primary_listing_photo?.image?.uri) {
              const uri = marketplaceData.primary_listing_photo.image.uri.replace(/\\\//g, '/');
              if (!photos.includes(uri)) {
                photos.unshift(uri); // Add as first photo
              }
            }
            
            return {
              title: marketplaceData.marketplace_listing_title || marketplaceData.listing_title || marketplaceData.title || null,
              description: marketplaceData.marketplace_listing_description || marketplaceData.listing_description || marketplaceData.description || null,
              photos: photos.slice(0, 10),
              price: marketplaceData.listing_price || marketplaceData.price || null,
              location: marketplaceData.location?.name || marketplaceData.location_text || null,
            };
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error extracting structured data:', error);
    return null;
  }
}

/**
 * Extract title from Facebook Marketplace HTML
 */
function extractTitle(html: string): string | null {
  // Try multiple patterns for Facebook title extraction
  const patterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /"marketplace_listing_title":"([^"]+)"/i,
    /"listing_title":"([^"]+)"/i,
    /property="og:title" content="([^"]+)"/i,
    /name="title" content="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Clean up title
      let title = match[1].trim();
      title = title.replace(/\s*-\s*Facebook\s*Marketplace\s*$/i, '');
      title = title.replace(/\s*\|\s*Facebook\s*$/i, '');
      if (title.length > 0) {
        return title;
      }
    }
  }
  return null;
}

/**
 * Extract description from Facebook Marketplace HTML
 */
function extractDescription(html: string): string | null {
  const patterns = [
    /"marketplace_listing_description":"([^"]+)"/i,
    /"listing_description":"([^"]+)"/i,
    /property="og:description" content="([^"]+)"/i,
    /name="description" content="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract price from Facebook Marketplace HTML with enhanced patterns
 */
function extractPrice(html: string): number | null {
  console.log('Extracting price from Facebook Marketplace HTML...');
  
  // Enhanced patterns for Facebook price extraction
  const patterns = [
    // Facebook-specific price patterns
    /"marketplace_listing_price":(\d+)/i,
    /"listing_price":(\d+)/i,
    /"price":\{"amount":"(\d+)"/i,
    /"price":\{"text":"\$([0-9,]+)"/i,
    /"listing_price":\{"amount":(\d+)/i,
    /"marketplace_listing_price":\{"amount":(\d+)/i,
    
    // JSON-LD structured data price patterns
    /"price":"(\d+)"/i,
    /"price":\s*"([0-9,]+)"/i,
    /"amount":\s*(\d+)/i,
    /"value":\s*(\d+)/i,
    
    // Meta property patterns
    /property="product:price:amount"\s+content="([0-9,]+)"/i,
    /property="og:price:amount"\s+content="([0-9,]+)"/i,
    
    // General dollar amount patterns (more specific)
    /"\$([0-9,]+)"/g,
    /\$\s*([0-9,]+)(?:\s|<|"|')/g,
    /price[^>]*>.*?\$\s*([0-9,]+)/gi,
    /\$([0-9,]+)\s*(?:USD|usd|each|\/)/gi,
    
    // Facebook marketplace specific UI patterns
    /marketplace.*?price.*?\$([0-9,]+)/gi,
    /price.*?marketplace.*?\$([0-9,]+)/gi,
    
    // Aria labels and accessibility text
    /aria-label="[^"]*\$([0-9,]+)[^"]*"/gi,
    /alt="[^"]*\$([0-9,]+)[^"]*"/gi,
  ];

  for (const pattern of patterns) {
    // Use match() for non-global patterns, matchAll() for global patterns
    if (pattern.global) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match && match[1]) {
          const priceStr = match[1].replace(/,/g, '');
          const price = parseInt(priceStr);
          
          if (!isNaN(price) && price > 0 && price < 10000000) { // Reasonable price range
            console.log(`Found price: $${price} using pattern: ${pattern.source.substring(0, 50)}...`);
            return price;
          }
        }
      }
    } else {
      const match = html.match(pattern);
      if (match && match[1]) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseInt(priceStr);
        
        if (!isNaN(price) && price > 0 && price < 10000000) { // Reasonable price range
          console.log(`Found price: $${price} using pattern: ${pattern.source.substring(0, 50)}...`);
          return price;
        }
      }
    }
  }
  
  console.log('No price found using HTML patterns');
  return null;
}

/**
 * Extract location from Facebook Marketplace HTML
 */
function extractLocation(html: string): string | null {
  const patterns = [
    /"marketplace_listing_location":"([^"]+)"/i,
    /"listing_location":"([^"]+)"/i,
    /"location_text":"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract photos from Facebook Marketplace HTML using AI-assisted approach
 */
async function extractPhotos(html: string, url: string): Promise<string[]> {
  console.log('Starting AI-assisted photo extraction for Facebook Marketplace...');
  
  // First try Gemini AI analysis to identify listing photos
  try {
    const aiExtractedImages = await extractPhotosWithGeminiAI(html, url);
    if (aiExtractedImages.length > 0) {
      console.log(`Found ${aiExtractedImages.length} images using Gemini AI analysis`);
      return aiExtractedImages;
    }
  } catch (error) {
    console.warn('Gemini AI extraction failed, falling back to manual methods:', error);
  }
  
  // Fallback to advanced gallery extraction
  const galleryImages = extractFacebookGalleryImages(html);
  if (galleryImages.length > 0) {
    console.log(`Found ${galleryImages.length} images from Facebook image gallery`);
    return galleryImages;
  }
  
  // Final fallback to pattern-based extraction
  console.log('Falling back to pattern-based image extraction');
  return extractPhotosPatternBased(html);
}

/**
 * Use Gemini AI to analyze webpage and extract listing photo URLs
 */
async function extractPhotosWithGeminiAI(html: string, url: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Extract all potential image URLs from HTML
  const allImageUrls = extractAllImageUrls(html);
  if (allImageUrls.length === 0) {
    console.log('No image URLs found in HTML');
    return [];
  }

  console.log(`Found ${allImageUrls.length} total image URLs, asking Gemini to identify listing photos...`);

  const prompt = `You are analyzing a Facebook Marketplace listing page. I have extracted ${allImageUrls.length} image URLs from the HTML.

Your task: Identify which URLs are the actual product/item listing photos (NOT profile pictures, ads, recommended items, or UI elements).

CONTEXT: This is a marketplace listing for a vehicle or equipment item. The listing should have 3-8 main product photos showing the item from different angles.

IMAGE URLS:
${allImageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

ANALYSIS CRITERIA:
- Look for URLs with "t39.30808-6" format (Facebook's marketplace photo format)
- Prefer URLs with quality indicators like "s960x960", "dst-jpg", "p960", "p720"
- Avoid URLs with "profile", "avatar", "cover", "ad", "thumb" indicators
- Group similar URLs (same base image in different sizes) and pick the highest quality

RESPONSE FORMAT:
Return ONLY a JSON array of the URLs that are actual listing photos, ordered by importance:
["url1", "url2", "url3", ...]

Limit to maximum 6 URLs. If unsure, err on the side of caution and return fewer URLs rather than including non-listing images.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini AI response:', text);

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Gemini response');
    }

    const extractedUrls = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(extractedUrls)) {
      throw new Error('Gemini response is not an array');
    }

    // Validate URLs
    const validUrls = extractedUrls.filter(url => 
      typeof url === 'string' && 
      url.startsWith('http') && 
      url.includes('fbcdn.net')
    );

    console.log(`Gemini AI identified ${validUrls.length} listing photos`);
    return validUrls.slice(0, 6); // Limit to 6 max

  } catch (error) {
    console.error('Gemini AI analysis failed:', error);
    throw error;
  }
}

/**
 * Extract all image URLs from HTML for AI analysis
 */
function extractAllImageUrls(html: string): string[] {
  const urls = new Set<string>();
  
  // Find all src attributes in img tags and other image references
  const patterns = [
    /src="([^"]*fbcdn[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/g,
    /"uri":"([^"]*fbcdn[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/g,
    /"url":"([^"]*fbcdn[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        let cleanUrl = match[1]
          .replace(/\\\//g, '/')
          .replace(/\\u002F/g, '/')
          .replace(/\\/g, '');
        
        if (cleanUrl.startsWith('http') && cleanUrl.includes('fbcdn.net')) {
          urls.add(cleanUrl);
        }
      }
    }
  });

  return Array.from(urls);
}

/**
 * Use Gemini AI to extract ALL data from Facebook Marketplace listing
 */
async function extractAllDataWithGemini(html: string, url: string): Promise<URLImportResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Extract all image URLs for AI analysis
  const allImageUrls = extractAllImageUrls(html);
  
  console.log(`Analyzing Facebook Marketplace listing with ${allImageUrls.length} potential images...`);

  const prompt = `You are analyzing a Facebook Marketplace listing page. I need you to extract information from the PRIMARY listing for this specific URL.

URL: ${url}

IMPORTANT: This URL leads to a specific Facebook Marketplace listing. The page may contain recommended items, ads, or other content, but you must focus ONLY on the main listing that this URL is for.

TASK: Extract the following information from the PRIMARY listing (the one this URL points to):

1. TITLE: The main listing title/headline of the item
2. DESCRIPTION: The seller's description of the item (full text)
3. PRICE: The asking price in dollars (number only, no $ symbol)
4. LOCATION: Where the item is located (city, state, region)
5. PHOTOS: Select the main product photos for this listing
6. YEAR: Extract the year from title or description if mentioned
7. MAKE: Extract the manufacturer/brand from title or description  
8. MODEL: Extract the model name from title or description

FOR PHOTOS - Select from these URLs (${allImageUrls.length} total):
${allImageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

PHOTO SELECTION CRITERIA:
- Look for URLs with "t39.30808-6" format (Facebook's marketplace photo format)
- Prefer URLs with quality indicators like "s960x960", "dst-jpg", "p960", "p720"
- Avoid URLs with "profile", "avatar", "cover", "ad", "thumb" indicators
- Group similar URLs (same image in different sizes) and pick highest quality
- Select 4-6 photos maximum that show the main item

RESPONSE FORMAT (JSON only):
{
  "title": "string",
  "description": "string", 
  "price": number,
  "location": "string",
  "photos": ["url1", "url2", ...],
  "year": number,
  "make": "string",
  "model": "string"
}

Focus on extracting data from the main listing content, not from recommended items or sidebar content.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini AI comprehensive extraction response:', text.substring(0, 500) + '...');

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Gemini response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!extractedData.title || !extractedData.photos || !Array.isArray(extractedData.photos)) {
      throw new Error('Invalid response structure from Gemini');
    }

    // Clean and validate photos
    const validPhotos = extractedData.photos.filter((url: any) => 
      typeof url === 'string' && 
      url.startsWith('http') && 
      url.includes('fbcdn.net')
    ).slice(0, 6);

    // Build the result
    const aiResult: URLImportResult = {
      title: extractedData.title || 'Facebook Marketplace Item',
      description: extractedData.description || 'No description available',
      price: typeof extractedData.price === 'number' ? extractedData.price : null,
      location: extractedData.location || null,
      photos: validPhotos,
      metadata: {
        source: 'facebook',
        listingId: extractListingId(url),
        extractedAt: new Date().toISOString(),
        extractedYear: extractedData.year || null,
        extractedMake: extractedData.make || null,
        extractedModel: extractedData.model || null,
        extractionMethod: 'gemini-ai',
      },
    };

    console.log(`Gemini AI extracted: ${aiResult.title}, $${aiResult.price}, ${validPhotos.length} photos`);
    return aiResult;

  } catch (error) {
    console.error('Gemini AI comprehensive extraction failed:', error);
    throw error;
  }
}

/**
 * Extract images specifically from Facebook's image gallery/carousel structure using advanced techniques
 */
function extractFacebookGalleryImages(html: string): string[] {
  console.log('Starting advanced Facebook gallery image extraction...');
  
  // Step 1: Find the main listing content area
  const listingContentMatch = html.match(/<div[^>]*(?:marketplace|listing)[^>]*>[\s\S]*?<\/div>/gi);
  if (!listingContentMatch || listingContentMatch.length === 0) {
    console.log('No main listing content found, falling back to full HTML');
  }
  
  // Step 2: Extract all t39.30808-6 images with metadata
  const imagePattern = /src="([^"]*fbcdn[^"]*t39\.30808-6[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g;
  const allImages: Array<{url: string, context: string, score: number}> = [];
  
  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    const imageUrl = match[1]
      .replace(/\\\//g, '/')
      .replace(/\\u002F/g, '/')
      .replace(/\\/g, '');
    
    if (!imageUrl.startsWith('http')) continue;
    
    // Get surrounding context (500 chars before and after)
    const matchIndex = match.index;
    const contextStart = Math.max(0, matchIndex - 500);
    const contextEnd = Math.min(html.length, matchIndex + 500);
    const context = html.slice(contextStart, contextEnd).toLowerCase();
    
    // Calculate image relevance score based on context and URL characteristics
    let score = 0;
    
    // URL quality indicators
    if (imageUrl.includes('s960x960')) score += 50;
    if (imageUrl.includes('dst-jpg')) score += 40;
    if (imageUrl.includes('p960') || imageUrl.includes('p720')) score += 30;
    if (imageUrl.includes('1080') || imageUrl.includes('960')) score += 20;
    
    // Context indicators (positive)
    if (context.includes('photo') || context.includes('image')) score += 15;
    if (context.includes('gallery') || context.includes('carousel')) score += 25;
    if (context.includes('listing') || context.includes('marketplace')) score += 20;
    if (context.includes('media-viewer') || context.includes('photo-viewer')) score += 30;
    
    // Context indicators (negative - likely not listing photos)
    if (context.includes('profile') || context.includes('avatar')) score -= 100;
    if (context.includes('cover') || context.includes('header')) score -= 80;
    if (context.includes('ad') || context.includes('sponsor')) score -= 90;
    if (context.includes('recommendation') || context.includes('suggested')) score -= 70;
    if (context.includes('friend') || context.includes('user')) score -= 60;
    if (context.includes('comment') || context.includes('reaction')) score -= 50;
    if (context.includes('badge') || context.includes('icon')) score -= 40;
    
    // Penalize very small images (likely thumbnails or icons)
    if (imageUrl.includes('50x50') || imageUrl.includes('32x32') || imageUrl.includes('64x64')) {
      score -= 100;
    }
    
    allImages.push({ url: imageUrl, context, score });
  }
  
  console.log(`Found ${allImages.length} total t39.30808-6 images`);
  
  // Step 3: Apply clustering to find the main image group
  // Group images by similar URL patterns (likely from same listing)
  const imageGroups = new Map<string, Array<{url: string, context: string, score: number}>>();
  
  allImages.forEach(img => {
    // Extract base pattern from URL (remove size and cache parameters)
    const basePattern = img.url.split('?')[0].replace(/_(s|p|dst-jpg).*/, '');
    const groupKey = basePattern.split('/').slice(-2, -1)[0]; // Get the image ID part
    
    if (!imageGroups.has(groupKey)) {
      imageGroups.set(groupKey, []);
    }
    imageGroups.get(groupKey)!.push(img);
  });
  
  console.log(`Grouped into ${imageGroups.size} image clusters`);
  
  // Step 4: Find the best group (highest total score, reasonable size)
  let bestGroup: Array<{url: string, context: string, score: number}> = [];
  let bestScore = -Infinity;
  
  imageGroups.forEach((group, key) => {
    const totalScore = group.reduce((sum, img) => sum + img.score, 0);
    const avgScore = totalScore / group.length;
    
    // Prefer groups with 3-8 images (typical for marketplace listings)
    const sizeBonus = group.length >= 3 && group.length <= 8 ? 50 : 0;
    const finalScore = avgScore + sizeBonus;
    
    console.log(`Group ${key}: ${group.length} images, avg score: ${avgScore.toFixed(1)}, final: ${finalScore.toFixed(1)}`);
    
    if (finalScore > bestScore && group.length >= 1) {
      bestScore = finalScore;
      bestGroup = group;
    }
  });
  
  // Step 5: Sort best group by individual scores and return top images
  const sortedImages = bestGroup
    .filter(img => img.score > 0) // Only positive scores
    .sort((a, b) => b.score - a.score)
    .map(img => img.url)
    .slice(0, 6); // Limit to 6 images max
  
  console.log(`Selected ${sortedImages.length} images from best group (score: ${bestScore.toFixed(1)})`);
  
  // Remove duplicates
  const uniqueImages = [...new Set(sortedImages)];
  
  console.log(`Final result: ${uniqueImages.length} unique images`);
  return uniqueImages;
}

/**
 * Pattern-based image extraction (fallback method)
 */
function extractPhotosPatternBased(html: string): string[] {
  const photos: string[] = [];
  
  // More specific patterns for marketplace listing images based on actual Facebook formats
  const patterns = [
    // Primary marketplace image patterns - these are more likely to be listing photos
    /"marketplace_listing_photo":\{"uri":"([^"]+)"/g,
    /"marketplace_photo":\{"uri":"([^"]+)"/g,
    /"listing_photo":\{"uri":"([^"]+)"/g,
    
    // Look for images in marketplace-specific data structures
    /"photos":\[[\s\S]*?"uri":"([^"]+)"[\s\S]*?\]/g,
    /"listing_images":\[[\s\S]*?"uri":"([^"]+)"[\s\S]*?\]/g,
    
    // Photo carousel or gallery patterns
    /"photo_image":\{"uri":"([^"]+)"/g,
    
    // Target actual marketplace image formats (t39.30808-6 for marketplace listings)
    /src="([^"]*fbcdn[^"]*\/t39\.30808-6\/[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g,
    /"uri":"([^"]*fbcdn[^"]*\/t39\.30808-6\/[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g,
    
    // Other marketplace formats (t45 is also used but less common for main listings)
    /src="([^"]*fbcdn[^"]*\/t45\.[^"]*\/[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g,
    /"uri":"([^"]*fbcdn[^"]*\/t45\.[^"]*\/[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g,
    
    // High resolution images with 960x960 or s960x960 (common for marketplace)
    /src="([^"]*fbcdn[^"]*s960x960[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g,
    /"uri":"([^"]*fbcdn[^"]*s960x960[^"]*\.(?:jpg|jpeg|png)[^"]*)"/g,
    
    // Look for high-resolution listing images (usually 720p or larger)
    /src="([^"]*fbcdn[^"]*\.(jpg|jpeg|png)[^"]*(?:1080|960|720|s\d+x\d+)[^"]*)"/g,
    /"uri":"([^"]*fbcdn[^"]*\.(jpg|jpeg|png)[^"]*(?:1080|960|720|s\d+x\d+)[^"]*)"/g,
    
    // Fallback - general FB images but prioritize larger ones
    /"image":\{"uri":"([^"]+fbcdn[^"]+\.(jpg|jpeg|png)[^"]*)"/g,
  ];

  // Track unique images and their likely relevance score
  const imageMap = new Map<string, number>();

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    if (!pattern) continue;
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        // Clean the URL by replacing escaped slashes
        let cleanUrl = match[1]
          .replace(/\\\//g, '/')  // Replace \/ with /
          .replace(/\\u002F/g, '/') // Replace unicode escaped slashes  
          .replace(/\\/g, ''); // Remove any remaining backslashes
        
        // Ensure it's a proper URL and appears to be an image
        if (cleanUrl.startsWith('http') && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(cleanUrl)) {
          // Filter out obviously non-listing images
          const isLikelyListingImage = 
            !cleanUrl.includes('profile') &&
            !cleanUrl.includes('avatar') &&
            !cleanUrl.includes('cover') &&
            !cleanUrl.includes('header') &&
            !cleanUrl.includes('badge') &&
            !cleanUrl.includes('icon') &&
            !cleanUrl.includes('/safe_image') && // Facebook's safe image placeholder
            !cleanUrl.includes('external.') && // External link thumbnails
            // HIGHLY prefer marketplace-specific image formats
            (cleanUrl.includes('t39.30808-6') || // Main marketplace format
             cleanUrl.includes('t45.') || // Secondary marketplace format
             cleanUrl.includes('s960x960') || // High-res square format common in marketplace
             cleanUrl.includes('1080') || cleanUrl.includes('960') || cleanUrl.includes('720') || 
             cleanUrl.includes('p1080') || cleanUrl.includes('p960') || cleanUrl.includes('p720'));

          // Give extremely high scores to marketplace-specific formats
          let score = patterns.length - i;
          
          if (cleanUrl.includes('t39.30808-6')) {
            score += 100; // Highest priority for main marketplace format
          } else if (cleanUrl.includes('s960x960')) {
            score += 80; // High priority for square high-res format
          } else if (cleanUrl.includes('t45.')) {
            score += 60; // Good priority for secondary marketplace format
          } else if (isLikelyListingImage) {
            score += 10; // Lower score for general listing image indicators
          }

          // EXTREMELY STRICT: Only accept t39.30808-6 format (main marketplace format)
          // This is the format confirmed by the user's example image
          const isExactMarketplaceFormat = cleanUrl.includes('t39.30808-6');
          
          // Additional quality checks for t39.30808-6 images
          if (isExactMarketplaceFormat) {
            // Ensure it has reasonable dimensions (not tiny thumbnails)
            const hasGoodDimensions = cleanUrl.includes('s960x960') || 
                                    cleanUrl.includes('dst-jpg') ||
                                    cleanUrl.includes('p960') ||
                                    cleanUrl.includes('p720') ||
                                    cleanUrl.includes('1080');
                                    
            // Only accept if it has the exact format AND good dimensions AND not a profile/system image
            if (hasGoodDimensions && isLikelyListingImage) {
              imageMap.set(cleanUrl, Math.max(imageMap.get(cleanUrl) || 0, score));
            }
          }
        }
      }
    }
  }

  // Sort by relevance score and return top images
  // Only include images with a minimum score to filter out random images
  const MIN_MARKETPLACE_SCORE = 50; // Lowered since we have better filtering now
  
  const allCandidates = Array.from(imageMap.entries()).sort(([,a], [,b]) => b - a);
  const filteredImages = allCandidates.filter(([, score]) => score >= MIN_MARKETPLACE_SCORE);
  
  console.log(`Image filtering results: ${filteredImages.length} passed (from ${imageMap.size} candidates)`);
  console.log('Top 10 candidates with scores:');
  allCandidates.slice(0, 10).forEach(([url, score], i) => {
    const filename = url.split('/').pop()?.split('?')[0] || 'unknown';
    const hasT39 = url.includes('t39.30808-6');
    const hasS960 = url.includes('s960x960');
    const hasT45 = url.includes('t45.');
    console.log(`  ${i + 1}. [${score}] ${filename} - t39:${hasT39}, s960:${hasS960}, t45:${hasT45} ${score >= MIN_MARKETPLACE_SCORE ? '✓' : '✗'}`);
  });
  
  const sortedImages = filteredImages
    .map(([url]) => url)
    .slice(0, 5); // Limit to 5 photos max to reduce chance of extra images

  return sortedImages;
}

/**
 * Extract year from title and description
 */
function extractYear(title: string, description: string): number | null {
  // Combine title and description for year extraction
  const text = `${title} ${description}`.toLowerCase();
  
  // Look for 4-digit years (1900-2025)
  const currentYear = new Date().getFullYear();
  const yearPatterns = [
    // Common patterns for vehicle years
    /\b(19|20)\d{2}\b/g,  // Any 4-digit year
    /year:?\s*(19|20)\d{2}/gi,  // "Year: 2000" or "year 2000"
    /model:?\s*(19|20)\d{2}/gi,  // "Model: 2000" or "model 2000"
    /(19|20)\d{2}\s*model/gi,   // "2000 model"
  ];
  
  const foundYears: number[] = [];
  
  for (const pattern of yearPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const year = parseInt(match[0].replace(/\D/g, ''));
      if (year >= 1900 && year <= currentYear + 1) {
        foundYears.push(year);
      }
    }
  }
  
  // Remove duplicates and find the most likely year
  const uniqueYears = [...new Set(foundYears)];
  
  if (uniqueYears.length === 1) {
    return uniqueYears[0];
  } else if (uniqueYears.length > 1) {
    // If multiple years found, prefer the one that's most likely a model year
    // (not too recent, not too old for the context)
    const validYears = uniqueYears.filter(year => 
      year >= 1980 && year <= currentYear
    );
    return validYears.length > 0 ? validYears[0] : null;
  }
  
  return null;
}

/**
 * Extract listing ID from Facebook Marketplace URL
 */
function extractListingId(url: string): string | null {
  const match = url.match(/\/item\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Craigslist extraction functions
 */
function extractCraigslistTitle(html: string): string | null {
  const patterns = [
    /<span id="titletextonly">([^<]+)<\/span>/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractCraigslistDescription(html: string): string | null {
  const patterns = [
    /<section id="postingbody"[^>]*>(.*?)<\/section>/is,
    /<div class="postinginfos"[^>]*>(.*?)<\/div>/is,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Strip HTML tags and clean up
      return match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return null;
}

function extractCraigslistPrice(html: string): number | null {
  const patterns = [
    /<span class="price">.*?\$([0-9,]+)/i,
    /\$([0-9,]+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseInt(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  return null;
}

function extractCraigslistLocation(html: string): string | null {
  const patterns = [
    /<small>([^<]+)<\/small>/i,
    /<span class="postingtitle">.*?\(([^)]+)\)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractCraigslistPhotos(html: string): string[] {
  const photos: string[] = [];
  
  // Target Craigslist's specific image gallery structure
  const galleryPatterns = [
    // Primary image gallery container
    /<div[^>]*id="thumbs"[^>]*>[\s\S]*?<img[^>]+src="([^"]*images\.craigslist\.org[^"]*)"[^>]*>/g,
    
    // Image thumbnail containers
    /<div[^>]*class="[^"]*thumb[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]*images\.craigslist\.org[^"]*)"[^>]*>/g,
    
    // Gallery images
    /<div[^>]*gallery[^>]*>[\s\S]*?<img[^>]+src="([^"]*images\.craigslist\.org[^"]*)"[^>]*>/g,
    
    // Fallback: any craigslist image in image containers
    /<img[^>]+src="([^"]*images\.craigslist\.org[^"]*)"[^>]*>/g,
  ];

  for (const pattern of galleryPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && !photos.includes(match[1])) {
        // Craigslist images are typically legitimate listing images
        photos.push(match[1]);
      }
    }
  }

  console.log(`Extracted ${photos.length} Craigslist images`);
  return photos.slice(0, 10);
}

function extractCraigslistId(url: string): string | null {
  const match = url.match(/(\d+)\.html$/);
  return match ? match[1] : null;
}

/**
 * Extract eBay listing images from gallery structure
 */
async function scrapeEbay(url: string): Promise<URLImportResult> {
  console.log(`Scraping eBay URL: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  
  return {
    title: extractEbayTitle(html) || 'eBay Item',
    description: extractEbayDescription(html) || 'No description available',
    price: extractEbayPrice(html),
    location: extractEbayLocation(html),
    photos: extractEbayPhotos(html),
    metadata: {
      source: 'ebay',
      listingId: extractEbayId(url),
      extractedAt: new Date().toISOString(),
    },
  };
}

function extractEbayPhotos(html: string): string[] {
  const photos: string[] = [];
  
  // Target eBay's specific image gallery structure
  const galleryPatterns = [
    // Main image gallery container
    /data-testid="ux-image-carousel"[^>]*>[\s\S]*?<img[^>]+src="([^"]*ebayimg\.com[^"]*)"[^>]*>/g,
    
    // Picture panel
    /<div[^>]*id="PicturePanel"[^>]*>[\s\S]*?<img[^>]+src="([^"]*ebayimg\.com[^"]*)"[^>]*>/g,
    
    // Image zoom containers
    /<div[^>]*class="[^"]*zoom[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]*ebayimg\.com[^"]*)"[^>]*>/g,
    
    // Thumbnail containers
    /<div[^>]*class="[^"]*thumb[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]*ebayimg\.com[^"]*)"[^>]*>/g,
  ];

  for (const pattern of galleryPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && !photos.includes(match[1])) {
        // Clean up eBay image URL (remove size parameters for full resolution)
        let imageUrl = match[1].replace(/\$_\d+\.JPG$/i, '$_57.JPG'); // Standard size
        photos.push(imageUrl);
      }
    }
  }

  console.log(`Extracted ${photos.length} eBay images`);
  return photos.slice(0, 10);
}

function extractEbayTitle(html: string): string | null {
  const patterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<h1[^>]*id="x-ebay-web-app"[^>]*>([^<]+)<\/h1>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/\s*\|\s*eBay\s*$/i, '').trim();
    }
  }
  return null;
}

function extractEbayDescription(html: string): string | null {
  const patterns = [
    /<div[^>]*class="[^"]*desc[^"]*"[^>]*>(.*?)<\/div>/is,
    /<div[^>]*id="desc_div"[^>]*>(.*?)<\/div>/is,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}

function extractEbayPrice(html: string): number | null {
  const patterns = [
    /notranslate">[\$]([0-9,]+\.\d{2})/,
    /price[^>]*>[\$]([0-9,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  return null;
}

function extractEbayLocation(html: string): string | null {
  const patterns = [
    /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i,
    /Ships from[\s]*([^<\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractEbayId(url: string): string | null {
  const match = url.match(/\/itm\/[^\/]*\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Main scraping function that routes to appropriate scraper
 */
export async function scrapeMarketplaceURL(url: string): Promise<URLImportResult> {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('facebook.com') || urlLower.includes('marketplace.facebook.com')) {
    return await scrapeFacebookMarketplace(url);
  } else if (urlLower.includes('craigslist.org')) {
    return await scrapeCraigslist(url);
  } else if (urlLower.includes('ebay.com')) {
    return await scrapeEbay(url);
  } else {
    throw new Error('Unsupported marketplace URL. Currently supports Facebook Marketplace, Craigslist, and eBay.');
  }
}