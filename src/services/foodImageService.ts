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
      console.log(`[Image] ✓ Found via Spoonacular: ${dishName}`);
      return response.data.results[0].image;
    }

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Image] ✗ Spoonacular failed`);
    return null;
  }
}

/**
 * Search Pexels API for food photos
 */
async function searchPexels(query: string): Promise<string | null> {
  if (!env.pexelsApiKey) {
    return null;
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: `${query} food`,
        per_page: 1
      },
      headers: {
        Authorization: env.pexelsApiKey
      },
      timeout: 3000
    });

    if (response.data?.photos?.[0]?.src?.medium) {
      // eslint-disable-next-line no-console
      console.log(`[Image] ✓ Found via Pexels: ${query}`);
      return response.data.photos[0].src.medium;
    }

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Image] ✗ Pexels failed`);
    return null;
  }
}

/**
 * Main function: Get food image with fallback chain
 * Priority: Spoonacular → Pexels → null
 *
 * We intentionally avoid generic unsplash-style keyword URLs here because they
 * often return visually plausible but incorrect dishes, which is worse than
 * falling back to a clearly labeled restaurant photo.
 */
export async function getFoodImage(
  dishName: string,
  cuisine?: string
): Promise<string | null> {
  // Check cache first
  const cachedUrl = getFromCache(dishName);
  if (cachedUrl) {
    return cachedUrl;
  }

  let imageUrl: string | null = null;

  // Try Spoonacular
  if (env.spoonacularApiKey && cuisine) {
    imageUrl = await searchSpoonacular(cuisine, dishName);
    if (imageUrl) {
      saveToCache(dishName, imageUrl);
      return imageUrl;
    }
  }

  // Try Pexels
  if (env.pexelsApiKey) {
    imageUrl = await searchPexels(dishName);
    if (imageUrl) {
      saveToCache(dishName, imageUrl);
      return imageUrl;
    }
  }

  return null;
}

/**
 * Utility function to clear cache
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
