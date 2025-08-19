import { createSupabaseServiceClient } from '@/lib/supabase/client';

interface DownloadResult {
  originalUrl: string;
  supabaseUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Download image from URL and upload to Supabase Storage
 */
export async function downloadAndUploadImage(
  imageUrl: string, 
  itemId: string, 
  index: number
): Promise<DownloadResult> {
  try {
    console.log(`Downloading image ${index + 1}: ${imageUrl}`);
    
    // Determine if this is a Facebook image and add appropriate headers
    const isFacebookImage = imageUrl.includes('fbcdn.net') || imageUrl.includes('facebook.com');
    
    // Download the image with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'DNT': '1',
        ...(isFacebookImage && {
          'Referer': 'https://www.facebook.com/',
          'Origin': 'https://www.facebook.com',
        }),
      },
    });

    if (!response.ok) {
      // For Facebook images, try a different approach if we get 403
      if (isFacebookImage && response.status === 403) {
        console.log(`Facebook image blocked (403), attempting retry with cleaned URL...`);
        const cleanedUrl = cleanImageUrl(imageUrl);
        if (cleanedUrl !== imageUrl) {
          // Retry with cleaned URL
          const retryResponse = await fetch(cleanedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/*,*/*;q=0.8',
              'Referer': 'https://www.facebook.com/',
            },
          });
          
          if (retryResponse.ok) {
            const arrayBuffer = await retryResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 0) {
              console.log(`Facebook image retry successful: ${buffer.length} bytes`);
              // Continue with successful response
              const contentType = retryResponse.headers.get('content-type') || 'image/jpeg';
              const extension = getExtensionFromContentType(contentType);
              const fileName = `${itemId}_${index + 1}_${Date.now()}.${extension}`;

              const supabase = createSupabaseServiceClient();
              const { data, error } = await supabase.storage
                .from('powertrader-images')
                .upload(fileName, buffer, {
                  contentType,
                  cacheControl: '3600',
                  upsert: false,
                });

              if (error) {
                throw new Error(`Supabase upload failed: ${error.message}`);
              }

              const { data: publicUrlData } = supabase.storage
                .from('powertrader-images')
                .getPublicUrl(fileName);

              return {
                originalUrl: imageUrl,
                supabaseUrl: publicUrlData.publicUrl,
                fileName,
              };
            }
          }
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get image data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) {
      throw new Error('Empty image data received');
    }

    console.log(`Downloaded image ${index + 1}: ${buffer.length} bytes`);

    // Determine file extension from URL or content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = getExtensionFromContentType(contentType);
    const fileName = `${itemId}_${index + 1}_${Date.now()}.${extension}`;

    // Upload to Supabase Storage
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from('powertrader-images')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('powertrader-images')
      .getPublicUrl(fileName);

    console.log(`Image ${index + 1} uploaded successfully: ${publicUrlData.publicUrl}`);

    return {
      originalUrl: imageUrl,
      supabaseUrl: publicUrlData.publicUrl,
      fileName,
    };

  } catch (error) {
    console.error(`Failed to download image ${index + 1}:`, error);
    return {
      originalUrl: imageUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download multiple images and upload to Supabase
 */
export async function downloadAndUploadImages(
  imageUrls: string[], 
  itemId: string
): Promise<DownloadResult[]> {
  console.log(`Starting download of ${imageUrls.length} images for item ${itemId}`);
  
  const results: DownloadResult[] = [];
  
  // Download images sequentially to avoid rate limiting
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const result = await downloadAndUploadImage(url, itemId, i);
    results.push(result);
    
    // Add small delay between downloads to be respectful
    if (i < imageUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successful = results.filter(r => r.supabaseUrl).length;
  const failed = results.filter(r => r.error).length;
  
  console.log(`Image download complete: ${successful} successful, ${failed} failed`);
  
  return results;
}

/**
 * Save image records to database
 */
export async function saveImageRecords(
  itemId: string, 
  downloadResults: DownloadResult[]
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  
  const imageRecords = downloadResults
    .filter(result => result.supabaseUrl)
    .map((result, index) => ({
      item_id: itemId,
      url: result.supabaseUrl!,
      is_primary: index === 0,
      order_index: index,
      created_at: new Date().toISOString(),
    }));

  if (imageRecords.length === 0) {
    console.log('No images to save to database');
    return;
  }

  const { error } = await supabase
    .from('item_photos')
    .insert(imageRecords);

  if (error) {
    console.error('Failed to save image records:', error);
    throw new Error(`Failed to save image records: ${error.message}`);
  }

  console.log(`Saved ${imageRecords.length} image records to database`);
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  
  return typeMap[contentType.toLowerCase()] || 'jpg';
}

/**
 * Clean and validate image URL
 */
export function cleanImageUrl(url: string): string {
  try {
    // Remove Facebook's tracking parameters but keep essential ones
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes('fbcdn.net')) {
      // For Facebook CDN URLs, keep only essential parameters
      const essentialParams = ['stp', '_nc_cat', '_nc_sid', '_nc_ohc', '_nc_ht', '_nc_gid', 'oh', 'oe'];
      
      // Create new URL with only essential params
      const cleanUrl = new URL(urlObj.origin + urlObj.pathname);
      essentialParams.forEach(param => {
        const value = urlObj.searchParams.get(param);
        if (value) {
          cleanUrl.searchParams.set(param, value);
        }
      });
      
      return cleanUrl.toString();
    }
    
    return url; // Return original if not Facebook
  } catch {
    return url; // Return original if parsing fails
  }
}

/**
 * Test if image URL is accessible
 */
export async function testImageAccess(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}