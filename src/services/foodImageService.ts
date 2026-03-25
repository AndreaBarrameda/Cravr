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
 * Search TheMealDB - FREE API with real food images
 * No API key required, no rate limits for basic usage
 */
async function searchTheMealDB(dishName: string): Promise<string | null> {
  try {
    // First try exact search
    let response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php', {
      params: {
        s: dishName
      },
      timeout: 3000
    });

    if (response.data?.meals?.[0]?.strMealThumb) {
      // eslint-disable-next-line no-console
      console.log(`[Image] ✓ Found via TheMealDB: ${dishName}`);
      return response.data.meals[0].strMealThumb;
    }

    // If exact match fails, try first word
    const firstWord = dishName.split(' ')[0];
    if (firstWord && firstWord.length > 3) {
      response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php', {
        params: {
          s: firstWord
        },
        timeout: 3000
      });

      if (response.data?.meals?.[0]?.strMealThumb) {
        // eslint-disable-next-line no-console
        console.log(`[Image] ✓ Found via TheMealDB (partial): ${dishName}`);
        return response.data.meals[0].strMealThumb;
      }
    }

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Image] ✗ TheMealDB failed`);
    return null;
  }
}

/**
 * Generate a Unsplash CDN URL that should work for most dishes
 * Uses actual Unsplash image URLs instead of the redirect service
 */
function generateUnsplashURL(dishName: string): string {
  // Create a more detailed search query
  const keywords = dishName.split(' ').slice(0, 2).join('+');

  // Use Unsplash's direct image search URL format
  // These URLs point directly to Unsplash images with specific search keywords
  const baseUrl = 'https://images.unsplash.com/photo-';

  // Map ingredients and Filipino dishes to Unsplash photo IDs
  const ingredientMap: { [key: string]: string } = {
    // Proteins
    'chicken': '1598103442107-4da1926d3f90?w=500&h=400&fit=crop',
    'pork': '1624621326534-e12d4195c8e4?w=500&h=400&fit=crop',
    'fish': '1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    'beef': '1568901346375-23c9450c58cd?w=500&h=400&fit=crop',
    'shrimp': '1621996346565-411f5569b72a?w=500&h=400&fit=crop',
    'seafood': '1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    // Starches & Sides
    'rice': '1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    'noodle': '1612874742207-db826c56e537?w=500&h=400&fit=crop',
    'pasta': '1495195134373-f2fb2fe326f3?w=500&h=400&fit=crop',
    'bread': '1509042239623-ea266f8d4d4b?w=500&h=400&fit=crop',
    // Cooking styles
    'soup': '1512621776951-a57141f2eefd?w=500&h=400&fit=crop',
    'curry': '1555939594-58d7cb561404?w=500&h=400&fit=crop',
    'fried': '1615521692214-9d0887c0e1e8?w=500&h=400&fit=crop',
    'adobo': '1624621326534-e12d4195c8e4?w=500&h=400&fit=crop',
    'sinigang': '1512621776951-a57141f2eefd?w=500&h=400&fit=crop',
    'lumpia': '1615521692214-9d0887c0e1e8?w=500&h=400&fit=crop',
    'pancit': '1612874742207-db826c56e537?w=500&h=400&fit=crop',
    'kare': '1555939594-58d7cb561404?w=500&h=400&fit=crop',
    'pinakbet': '1540189549336-e6e99c3679fe?w=500&h=400&fit=crop',
    'lechon': '1624621326534-e12d4195c8e4?w=500&h=400&fit=crop',
    // Vegetables & Fruits
    'mango': '1559827260-dc66d52bef19?w=500&h=400&fit=crop',
    'fruit': '1599599810694-b5ac4dd5e3d5?w=500&h=400&fit=crop',
    'vegetable': '1540189549336-e6e99c3679fe?w=500&h=400&fit=crop',
    'salad': '1540189549336-e6e99c3679fe?w=500&h=400&fit=crop',
    // Sweets
    'dessert': '1541519227354-08fa5d50c44d?w=500&h=400&fit=crop',
    'cake': '1578985545062-ec3fb1691f25?w=500&h=400&fit=crop',
    'ice cream': '1585080736029-e3eb3faf3c5f?w=500&h=400&fit=crop',
    'turon': '1541519227354-08fa5d50c44d?w=500&h=400&fit=crop',
  };

  // Check if any ingredient keyword matches
  const dishLower = dishName.toLowerCase();
  for (const [ingredient, photoId] of Object.entries(ingredientMap)) {
    if (dishLower.includes(ingredient)) {
      // eslint-disable-next-line no-console
      console.log(`[Image] Generated Unsplash URL for: ${dishName} (matched: ${ingredient})`);
      return baseUrl + photoId;
    }
  }

  // Default to a generic food image
  // eslint-disable-next-line no-console
  console.log(`[Image] Generated Unsplash fallback URL for: ${dishName}`);
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop'; // Generic Asian food
}

/**
 * Main function: Get food image
 * Priority: Spoonacular → Pexels → TheMealDB (FREE!) → Fallback
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

  // Try TheMealDB (free, no auth needed, REAL FOOD IMAGES)
  imageUrl = await searchTheMealDB(dishName);
  if (imageUrl) {
    saveToCache(dishName, imageUrl);
    return imageUrl;
  }

  // Use intelligent fallback - matches dish ingredients to Unsplash images
  imageUrl = generateUnsplashURL(dishName);
  saveToCache(dishName, imageUrl);
  return imageUrl;
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
