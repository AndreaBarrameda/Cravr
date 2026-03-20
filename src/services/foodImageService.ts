import axios from 'axios';
import { env } from '../config/env';

// Simple in-memory cache with TTL
interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

function getCacheKey(dishName: string): string {
  return dishName.toLowerCase().trim();
}

function getFromCache(dishName: string): string | null {
  const key = getCacheKey(dishName);
  const entry = imageCache.get(key);

  if (!entry) return null;

  // Check if cache entry has expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    imageCache.delete(key);
    return null;
  }

  return entry.url;
}

function saveToCache(dishName: string, url: string): void {
  const key = getCacheKey(dishName);
  imageCache.set(key, {
    url,
    timestamp: Date.now()
  });
}

/**
 * Search Spoonacular API for recipe images
 * Free tier: 150 requests/day, 1 request/second
 */
async function searchSpoonacular(cuisine: string, dishName: string): Promise<string | null> {
  if (!env.spoonacularApiKey) {
    return null;
  }

  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: {
        apiKey: env.spoonacularApiKey,
        query: dishName,
        cuisine: cuisine,
        number: 1,
        addRecipeInformation: true
      },
      timeout: 3000
    });

    if (response.data?.results?.[0]?.image) {
      // eslint-disable-next-line no-console
      console.log(`[Image] Found via Spoonacular: ${dishName}`);
      return response.data.results[0].image;
    }

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Image] Spoonacular search failed for "${dishName}":`, (e as any).message);
    return null;
  }
}

/**
 * Search Pexels API for food photos
 * Free tier: Unlimited
 */
async function searchPexels(query: string): Promise<string | null> {
  if (!env.pexelsApiKey) {
    return null;
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: query,
        per_page: 1
      },
      headers: {
        Authorization: env.pexelsApiKey
      },
      timeout: 3000
    });

    if (response.data?.photos?.[0]?.src?.medium) {
      // eslint-disable-next-line no-console
      console.log(`[Image] Found via Pexels: ${query}`);
      return response.data.photos[0].src.medium;
    }

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Image] Pexels search failed for "${query}":`, (e as any).message);
    return null;
  }
}

/**
 * Generate Unsplash image URL directly (no API key needed)
 * Uses Unsplash's public search endpoint with food keywords
 */
function getDirectUnsplashUrl(dishName: string): string | null {
  if (!dishName) {
    return null;
  }

  try {
    // Use source.unsplash.com with specific dimensions for mobile compatibility
    // Format: https://source.unsplash.com/400x300/?keyword,food
    const encoded = encodeURIComponent(dishName);
    const url = `https://source.unsplash.com/400x300/?${encoded},food`;
    // eslint-disable-next-line no-console
    console.log(`[Image] Generated Unsplash URL for ${dishName}: ${url}`);
    return url;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Image] Failed to generate URL for "${dishName}":`, (e as any).message);
    return null;
  }
}

/**
 * Main function: Get food image with fallback chain
 * Priority: Spoonacular → Pexels → Unsplash Direct → null
 */
export async function getFoodImage(
  dishName: string,
  cuisine?: string
): Promise<string | null> {
  // Check cache first
  const cachedUrl = getFromCache(dishName);
  if (cachedUrl) {
    // eslint-disable-next-line no-console
    console.log(`[Image] Cache hit: ${dishName}`);
    return cachedUrl;
  }

  let imageUrl: string | null = null;

  // Try Spoonacular first (best quality with cuisine matching)
  if (env.spoonacularApiKey && cuisine) {
    imageUrl = await searchSpoonacular(cuisine, dishName);
    if (imageUrl) {
      saveToCache(dishName, imageUrl);
      return imageUrl;
    }
  }

  // Try Pexels second (high quality, unlimited free)
  if (env.pexelsApiKey) {
    imageUrl = await searchPexels(dishName);
    if (imageUrl) {
      saveToCache(dishName, imageUrl);
      return imageUrl;
    }
  }

  // Fall back to Unsplash direct URL
  imageUrl = getDirectUnsplashUrl(dishName);
  if (imageUrl) {
    saveToCache(dishName, imageUrl);
  }
  return imageUrl;
}

/**
 * Utility function to clear cache (useful for testing)
 */
export function clearCache(): void {
  imageCache.clear();
  // eslint-disable-next-line no-console
  console.log('[Image] Cache cleared');
}

/**
 * Utility function to get cache stats
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: imageCache.size,
    entries: Array.from(imageCache.keys())
  };
}
