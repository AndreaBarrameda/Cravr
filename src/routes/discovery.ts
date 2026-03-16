import { Router } from 'express';
import { mapsClient } from '../services/mapsClient';
import { generateMatchReason, generateRestaurantMenu, GeneratedDish, generateRestaurantDescription, RestaurantDescription } from '../services/openaiClient';
import { getFoodImage } from '../services/foodImageService';

// Cache restaurants to avoid redundant Google Maps API calls
interface CachedRestaurants {
  results: any[];
  timestamp: number;
}

const restaurantCache = new Map<string, CachedRestaurants>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(lat: number, lng: number, cuisine?: string): string {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${cuisine || 'any'}`;
}

function getCachedRestaurants(lat: number, lng: number, cuisine?: string): any[] | null {
  const key = getCacheKey(lat, lng, cuisine);
  const cached = restaurantCache.get(key);

  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    restaurantCache.delete(key);
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`[Cache] Hit for ${key} - returning ${cached.results.length} restaurants`);
  return cached.results;
}

function cacheRestaurants(lat: number, lng: number, cuisine: string | undefined, results: any[]): void {
  const key = getCacheKey(lat, lng, cuisine);
  restaurantCache.set(key, {
    results,
    timestamp: Date.now()
  });
  // eslint-disable-next-line no-console
  console.log(`[Cache] Stored ${results.length} restaurants for ${key}`);
}

// Cache menus per restaurant_id
interface CachedMenu {
  dishes: GeneratedDish[];
  timestamp: number;
}

interface CachedDescription {
  description: RestaurantDescription;
  timestamp: number;
}

const menuCache = new Map<string, CachedMenu>();
const descriptionCache = new Map<string, CachedDescription>();
const MENU_CACHE_TTL = 60 * 60 * 1000; // 60 minutes
const DESCRIPTION_CACHE_TTL = 60 * 60 * 1000; // 60 minutes

function getCachedMenu(id: string): GeneratedDish[] | null {
  const cached = menuCache.get(id);

  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > MENU_CACHE_TTL) {
    menuCache.delete(id);
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`[Menu Cache] Hit for ${id} - returning ${cached.dishes.length} dishes`);
  return cached.dishes;
}

function cacheMenu(id: string, dishes: GeneratedDish[]): void {
  menuCache.set(id, {
    dishes,
    timestamp: Date.now()
  });
  // eslint-disable-next-line no-console
  console.log(`[Menu Cache] Stored ${dishes.length} dishes for ${id}`);
}

function getCachedDescription(id: string): RestaurantDescription | null {
  const cached = descriptionCache.get(id);

  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > DESCRIPTION_CACHE_TTL) {
    descriptionCache.delete(id);
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`[Description Cache] Hit for ${id}`);
  return cached.description;
}

function cacheDescription(id: string, description: RestaurantDescription): void {
  descriptionCache.set(id, {
    description,
    timestamp: Date.now()
  });
  // eslint-disable-next-line no-console
  console.log(`[Description Cache] Stored description for ${id}`);
}

export const discoveryRouter = Router();

discoveryRouter.post('/restaurants', async (req, res) => {
  try {
    const { craving_id, cuisine, location, radius_meters = 3000 } = req.body as {
      craving_id?: string;
      cuisine?: string;
      location?: { lat?: number; lng?: number };
      radius_meters?: number;
    };

    if (!location?.lat || !location?.lng) {
      return res
        .status(400)
        .json({ error: 'location.lat and location.lng are required' });
    }

    const keyword = cuisine ? `${cuisine} restaurant` : 'restaurant';

    const maps = await mapsClient.nearbySearch({
      lat: location.lat,
      lng: location.lng,
      radius: radius_meters,
      keyword
    });

    const restaurants = maps.results ?? [];

    // Generate AI match reasons and descriptions for each restaurant
    const results = await Promise.all(
      restaurants.map(async (r: any) => {
        const match_reason = await generateMatchReason(r.name, cuisine, r.rating || 4, r.price_level || 2);
        const description = await generateRestaurantDescription(
          r.name,
          r.types ?? ['restaurant'],
          r.price_level ?? 2,
          '',
          {},
          r.rating || 4.0
        );

        return {
          restaurant_id: `rst_${r.place_id}`,
          place_id: r.place_id,
          name: r.name,
          hero_photo_url: r.photos?.[0]
            ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=800&photoreference=${
                r.photos[0].photo_reference
              }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
            : null,
          match_reason,
          rating: r.rating,
          price_level: r.price_level,
          vibe_tags: [],
          description: {
            atmosphere: description.atmosphere,
            why_match: description.why_match,
            vibe: description.vibe,
            best_for: description.best_for,
            suggested_dishes: description.suggested_dishes
          }
        };
      })
    );

    return res.json({
      discovery_session_id: `ds_${Date.now()}`,
      results
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in discovery', err);
    return res.status(500).json({ error: 'Failed to discover restaurants' });
  }
});

discoveryRouter.post('/dishes', async (req, res) => {
  try {
    const { restaurant_id, craving_id, location } = req.body as {
      restaurant_id?: string;
      craving_id?: string;
      location?: { lat?: number; lng?: number };
    };

    if (!restaurant_id) {
      return res.status(400).json({ error: 'restaurant_id is required' });
    }

    // Extract place_id from restaurant_id (format: rst_<place_id>)
    const placeId = restaurant_id.replace(/^rst_/, '');

    // Fetch restaurant details from Google Maps
    const details = await mapsClient.placeDetails(placeId);

    if (!details?.result) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const place = details.result;

    // Check menu cache first
    let generatedDishes = getCachedMenu(restaurant_id);

    if (!generatedDishes) {
      // Cache miss - generate menu using OpenAI
      // eslint-disable-next-line no-console
      console.log(`[Menu Cache] Miss for ${restaurant_id} - generating menu`);
      generatedDishes = await generateRestaurantMenu(
        place.name,
        place.types ?? ['restaurant'],
        place.price_level ?? 2,
        '',
        {}
      );
      cacheMenu(restaurant_id, generatedDishes);
    }

    // Map generated dishes to response shape
    const mockMenuItems = await Promise.all(
      generatedDishes.map(async (dish, idx) => {
        const photoUrl = await getFoodImage(dish.name) ??
          (place.photos?.[idx % (place.photos?.length || 1)]
            ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=400&photoreference=${
                place.photos![idx % place.photos!.length].photo_reference
              }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
            : null);
        return {
          dish_id: `dsh_${placeId}_${dish.name.replace(/\s+/g, '_')}`,
          name: dish.name,
          description: dish.description,
          photo_url: photoUrl,
          price: dish.price,
          match_score: 0.9 - (idx * 0.05) // Slight decrease for lower-ranked dishes
        };
      })
    );

    return res.json({
      restaurant_id,
      restaurant_name: place.name,
      results: mockMenuItems
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching dishes:', err);
    return res.status(500).json({ error: 'Failed to fetch dishes' });
  }
});

discoveryRouter.post('/dishes-by-attributes', async (req, res) => {
  try {
    const { craving_text, cuisine, attributes, location } = req.body as {
      craving_text?: string;
      cuisine?: string;
      attributes?: {
        temperature: string | null;
        flavor: string | null;
        texture: string | null;
        intensity: string | null;
        occasion: string | null;
        budget: string | null;
      };
      location?: { lat?: number; lng?: number };
    };

    if (!location?.lat || !location?.lng) {
      return res.status(400).json({ error: 'location is required' });
    }

    // Check cache first to avoid redundant Google Maps API calls
    let restaurants = getCachedRestaurants(location.lat, location.lng, cuisine);

    if (!restaurants) {
      // Cache miss - fetch from Google Maps
      // eslint-disable-next-line no-console
      console.log(`[Cache] Miss for ${cuisine} at ${location.lat},${location.lng} - fetching from Maps API`);
      const keyword = cuisine ? `${cuisine} restaurant` : 'restaurant';
      const maps = await mapsClient.nearbySearch({
        lat: location.lat,
        lng: location.lng,
        radius: 8000,
        keyword
      });

      restaurants = maps.results ?? [];
      // Cache the results for 30 minutes
      cacheRestaurants(location.lat, location.lng, cuisine, restaurants);
    }

    restaurants = restaurants ?? [];

    // Helper function to score how well a dish matches the user's craving text
    function getCravingMatchScore(dishName: string, cravingInput: string): number {
      if (!cravingInput || cravingInput.length === 0) return 0;

      const craving = cravingInput.toLowerCase();
      const dish = dishName.toLowerCase();

      // Exact match: full dish name in craving
      if (craving.includes(dish)) return 1.0;

      // Partial match: dish name contains key craving words
      const cravingWords = craving.split(/\s+/);
      const dishWords = dish.split(/\s+/);

      let matches = 0;
      for (const word of dishWords) {
        if (word.length > 2 && cravingWords.some(cw => cw.includes(word) || word.includes(cw))) {
          matches++;
        }
      }

      // Score based on word matches
      if (matches > 0) {
        return Math.min(matches * 0.3, 0.8);
      }

      return 0;
    }

    // Shuffle restaurants to provide variety even with cached results
    // This ensures different requests return different restaurants/dishes
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
    // Select a random subset (between 15-25 restaurants) to ensure variety
    const randomCount = Math.floor(Math.random() * 11) + 15; // 15-25 restaurants
    const selectedRestaurants = shuffled.slice(0, Math.min(randomCount, shuffled.length));

    // eslint-disable-next-line no-console
    console.log(`[Dishes] Selected ${selectedRestaurants.length} restaurants from ${restaurants.length} cached results. Processing up to 15 in parallel...`);

    // Process restaurants in parallel (limit to 15 at a time to avoid overwhelming the API)
    const allDishes: any[] = [];
    const processLimit = Math.min(15, selectedRestaurants.length);

    for (let i = 0; i < selectedRestaurants.length; i += processLimit) {
      const batch = selectedRestaurants.slice(i, i + processLimit);

      const batchResults = await Promise.all(
        batch.map(async (r: any) => {
          const restaurantId = `rst_${r.place_id}`;

          // Check menu cache first
          let generatedDishes = getCachedMenu(restaurantId);

          if (!generatedDishes) {
            // Cache miss - generate menu using OpenAI
            // eslint-disable-next-line no-console
            console.log(`[Menu Cache] Miss for ${restaurantId} - generating menu`);
            generatedDishes = await generateRestaurantMenu(
              r.name,
              r.types ?? ['restaurant'],
              r.price_level ?? 2,
              craving_text ?? '',
              attributes ?? {}
            );
            cacheMenu(restaurantId, generatedDishes);
          }

          // Check description cache first
          let restaurantDescription = getCachedDescription(restaurantId);

          if (!restaurantDescription) {
            // Cache miss - generate description using OpenAI
            // eslint-disable-next-line no-console
            console.log(`[Description Cache] Miss for ${restaurantId} - generating description`);
            restaurantDescription = await generateRestaurantDescription(
              r.name,
              r.types ?? ['restaurant'],
              r.price_level ?? 2,
              craving_text ?? '',
              attributes ?? {},
              r.rating || 4.0
            );
            cacheDescription(restaurantId, restaurantDescription);
          }

          // Score dishes against user attributes
          const scoredDishes = generatedDishes.map((dish) => {
            let matchScore = 0;

            // PRIORITY: Match against user's original craving text
            const cravingMatch = getCravingMatchScore(dish.name, craving_text ?? '');
            if (cravingMatch > 0) {
              matchScore += cravingMatch * 0.4; // 40% weight to craving match
            }

            // Score based on attribute matches
            if (attributes?.temperature === dish.temperature) matchScore += 0.15;
            if (attributes?.flavor === dish.flavor) matchScore += 0.15;
            if (attributes?.texture === dish.texture) matchScore += 0.15;
            if (attributes?.intensity === dish.intensity) matchScore += 0.1;

            // Budget matching (PHP: ₱300 = budget, ₱600 = upscale)
            if (attributes?.budget === 'budget' && dish.price < 300) matchScore += 0.1;
            if (attributes?.budget === 'casual' && dish.price >= 300 && dish.price < 600) matchScore += 0.1;
            if (attributes?.budget === 'upscale' && dish.price >= 600) matchScore += 0.1;

            // Occasion bonus
            if (attributes?.occasion === 'date' && ['Sushi', 'Grilled Fish', 'Salmon', 'Premium', 'Steak'].some(kw => dish.name.includes(kw))) matchScore += 0.05;
            if (attributes?.occasion === 'group' && ['Hot Pot', 'BBQ', 'Curry', 'Buffet', 'Sharing'].some(kw => dish.name.includes(kw))) matchScore += 0.05;

            return {
              ...dish,
              matchScore: Math.min(matchScore, 1.0) // Cap at 1.0
            };
          })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5); // Top 5 dishes per restaurant

          // Create dish entries for this restaurant
          const restaurantDishes = await Promise.all(
            scoredDishes.map(async (dish, idx) => {
              const foodImageUrl = await getFoodImage(dish.name, cuisine);
              const fallbackUrl = r.photos?.[Math.floor(Math.random() * (r.photos?.length || 1))]
                ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=400&photoreference=${
                    r.photos![Math.floor(Math.random() * r.photos.length)].photo_reference
                  }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
                : null;

              return {
                dish_id: `dsh_${r.place_id}_${dish.name.replace(/\s+/g, '_')}`,
                name: dish.name,
                description: dish.description,
                photo_url: foodImageUrl ?? fallbackUrl,
                price: dish.price,
                restaurant_id: restaurantId,
                restaurant_name: r.name,
                rating: r.rating || 4.0,
                match_score: dish.matchScore,
                match_reason: `${dish.temperature === 'hot' ? '🔥' : '❄️'} ${dish.texture} ${dish.flavor} - ${dish.intensity} intensity`,
                restaurant_description: {
                  atmosphere: restaurantDescription.atmosphere,
                  why_match: restaurantDescription.why_match,
                  vibe: restaurantDescription.vibe,
                  best_for: restaurantDescription.best_for,
                  suggested_dishes: restaurantDescription.suggested_dishes
                }
              };
            })
          );

          return restaurantDishes;
        })
      );

      // Flatten batch results
      allDishes.push(...batchResults.flat());
    }

    // Deduplicate dishes (keep only the best match for each dish name)
    const seenDishes = new Set<string>();
    const uniqueDishes = allDishes.filter(dish => {
      if (seenDishes.has(dish.name)) {
        return false;
      }
      seenDishes.add(dish.name);
      return true;
    });

    // Get top candidates, then shuffle with bias toward higher scores for variety
    const topCandidates = uniqueDishes
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 40); // Get top 40 candidates

    // Weighted shuffle: add randomness but keep quality high
    // This ensures different requests get different dishes while maintaining good matches
    const results = topCandidates
      .map(dish => ({
        ...dish,
        randomBoost: Math.random() * 0.35 // Add 0-35% random variance for more variety
      }))
      .sort((a, b) => {
        const aScore = a.match_score + a.randomBoost;
        const bScore = b.match_score + b.randomBoost;
        return bScore - aScore;
      })
      .map(({ randomBoost, ...dish }) => dish) // Remove randomBoost from result
      .slice(0, 25);

    return res.json({
      discovery_session_id: `dsa_${Date.now()}`,
      attributes_matched: attributes,
      restaurants_searched: restaurants.length,
      results
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error discovering dishes by attributes:', err);
    return res.status(500).json({ error: 'Failed to discover dishes' });
  }
});

discoveryRouter.get('/restaurants/:place_id', async (req, res) => {
  try {
    const { place_id } = req.params;

    if (!place_id) {
      return res.status(400).json({ error: 'place_id is required' });
    }

    // eslint-disable-next-line no-console
    console.log(`Fetching details for place_id: ${place_id}`);
    const details = await mapsClient.placeDetails(place_id);
    // eslint-disable-next-line no-console
    console.log('Google Maps response:', details);

    if (!details?.result) {
      // eslint-disable-next-line no-console
      console.error('No result in details:', details);
      return res.status(404).json({ error: 'Restaurant not found', details });
    }

    const place = details.result;

    return res.json({
      restaurant_id: `rst_${place_id}`,
      place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number || place.international_phone_number || 'N/A',
      website: place.website || null,
      hours: place.opening_hours?.weekday_text || [],
      rating: place.rating,
      review_count: place.user_ratings_total,
      price_level: place.price_level,
      hero_photo_url: place.photos?.[0]
        ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=800&photoreference=${
            place.photos[0].photo_reference
          }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
        : null,
      types: place.types || []
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching restaurant details:', err);
    return res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

