import { Router } from 'express';
import { mapsClient } from '../services/mapsClient';
import { generateMatchReason, generateRestaurantMenu, GeneratedDish, generateRestaurantDescription, RestaurantDescription } from '../services/openaiClient';
import { getFoodImage } from '../services/foodImageService';
import { mapCravingToKeywords, getPrimaryKeyword } from '../services/cravingMapper';
import { getRealMenuItems } from '../services/realMenuService';

// Cache restaurants to avoid redundant Google Maps API calls
interface CachedRestaurants {
  results: any[];
  timestamp: number;
}

const restaurantCache = new Map<string, CachedRestaurants>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(lat: number, lng: number, cuisine?: string, craving?: string): string {
  // Prioritize craving for cache key since that's what we search for
  const searchTerm = (craving && craving.trim()) ? craving.toLowerCase() : (cuisine || 'any');
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${searchTerm}`;
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

function inferDishTraits(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();

  const temperature =
    /salad|halo-halo|iced|cold|sashimi|ceviche/.test(text) ? 'cold'
      : /room temp|ambient/.test(text) ? 'room'
        : 'hot';

  const flavor =
    /sweet|dessert|caramel|honey|banana|chocolate/.test(text) ? 'sweet'
      : /spicy|chili|sili|bicol/.test(text) ? 'spicy'
        : /sour|sinigang|ceviche|vinegar/.test(text) ? 'sour'
          : /umami|miso|mushroom|truffle/.test(text) ? 'umami'
            : 'savory';

  const texture =
    /crispy|crunch|fried|tempura/.test(text) ? 'crunchy'
      : /creamy|carbonara|sauce/.test(text) ? 'creamy'
        : /broth|soup|ramen|sinigang/.test(text) ? 'brothy'
          : /chewy|noodle|pasta/.test(text) ? 'chewy'
            : 'soft';

  const intensity =
    /extra spicy|fiery|very spicy/.test(text) ? 'intense'
      : /spicy|pepper|bold/.test(text) ? 'medium'
        : 'mild';

  return { temperature, flavor, texture, intensity };
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDistanceMeters(
  origin: { lat?: number; lng?: number } | undefined,
  geometry: { location?: { lat?: number; lng?: number } } | undefined
): number | null {
  if (!origin?.lat || !origin?.lng || !geometry?.location?.lat || !geometry?.location?.lng) {
    return null;
  }

  return Math.round(
    getDistanceKm(origin.lat, origin.lng, geometry.location.lat, geometry.location.lng) * 1000
  );
}

function getProximityBoost(distanceMeters: number | null): number {
  if (distanceMeters == null) return 0;
  if (distanceMeters <= 150) return 0.38;
  if (distanceMeters <= 350) return 0.3;
  if (distanceMeters <= 600) return 0.22;
  if (distanceMeters <= 1000) return 0.14;
  if (distanceMeters <= 1800) return 0.08;
  if (distanceMeters <= 3000) return 0.03;
  return 0;
}

function mergeUniquePlaces(...groups: any[][]): any[] {
  return Array.from(
    new Map(groups.flat().map((place) => [place.place_id, place])).values()
  );
}

function getBroadFoodQueries(baseKeyword?: string): string[] {
  const queries = [
    baseKeyword || 'restaurant',
    'restaurants',
    'cafes and restaurants',
    'food places',
    'food stall',
    'food court',
    'restaurants in mall',
    'kiosk food',
    'quick bites'
  ];

  return Array.from(new Set(queries.filter(Boolean)));
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

function hasMeaningfulAttributes(attributes?: {
  temperature: string | null;
  flavor: string | null;
  texture: string | null;
  intensity: string | null;
  occasion: string | null;
  budget: string | null;
}): boolean {
  if (!attributes) return false;
  return Object.values(attributes).some((value) => value !== null);
}

discoveryRouter.post('/restaurants', async (req, res) => {
  try {
    const { craving_id, craving_text, cuisine, location, radius_meters = 3000 } = req.body as {
      craving_id?: string;
      craving_text?: string;
      cuisine?: string;
      location?: { lat?: number; lng?: number };
      radius_meters?: number;
    };

    if (!location?.lat || !location?.lng) {
      return res
        .status(400)
        .json({ error: 'location.lat and location.lng are required' });
    }

    // Build search keyword from craving text and cuisine
    // Prioritize craving text over cuisine if both are provided
    let keyword = 'restaurant';
    if (craving_text && craving_text.trim()) {
      // Map the craving to proper cuisine keywords that Google Maps understands
      keyword = getPrimaryKeyword(craving_text);
    } else if (cuisine && cuisine.trim()) {
      keyword = `${cuisine} restaurant`;
    }

    // eslint-disable-next-line no-console
    console.log(`🔍 Craving: "${craving_text}" -> Mapped keyword: "${keyword}"`);

    // Try initial search
    let maps = await mapsClient.nearbySearch({
      lat: location.lat,
      lng: location.lng,
      radius: radius_meters,
      keyword
    });

    let restaurants = maps.results ?? [];

    // Filter restaurants to ensure they match the craving/keyword
    // Check if restaurant's types include relevant categories
    const relevantTypes = new Set([
      'restaurant', 'food', 'cafe', 'bakery', 'dessert', 'meal_takeaway', 'meal_delivery',
      'food_court', 'store', 'noodle', 'ramen', 'sushi', 'japanese', 'thai', 'indian',
      'mexican', 'pizza', 'burger', 'seafood', 'chinese', 'korean', 'vietnamese',
      'italian', 'breakfast', 'brunch'
    ]);

    restaurants = restaurants.filter((r: any) => {
      const types = (r.types ?? []).map((t: string) => t.toLowerCase());
      // Must be a restaurant/food place
      const isFood = types.some(t => relevantTypes.has(t) || t.includes('restaurant') || t.includes('cafe') || t.includes('food'));
      return isFood;
    });

    if (restaurants.length < 24) {
      const supplementalQueries = getBroadFoodQueries(keyword).slice(1);
      const textResults = await Promise.all(
        supplementalQueries.map(async (query) => {
          try {
            const response = await mapsClient.textSearch({
              query,
              location: { lat: location.lat, lng: location.lng },
              radius: Math.min(radius_meters * 2, 5000)
            });
            return response.results ?? [];
          } catch {
            return [];
          }
        })
      );

      restaurants = mergeUniquePlaces(restaurants, ...textResults);
    }

    restaurants = restaurants.filter((r: any) => {
      const types = (r.types ?? []).map((t: string) => t.toLowerCase());
      return types.some((t) => relevantTypes.has(t) || t.includes('restaurant') || t.includes('cafe') || t.includes('food'));
    });

    restaurants = restaurants
      .map((r: any) => {
        const distanceMeters = getDistanceMeters(location, r.geometry);
        const ratingScore = (r.rating || 0) / 5;
        const reviewScore = Math.min((r.user_ratings_total || 0) / 500, 1) * 0.35;
        const score = ratingScore * 0.55 + reviewScore + getProximityBoost(distanceMeters);
        return { ...r, _distanceMeters: distanceMeters, _rankScore: score };
      })
      .sort((a: any, b: any) => b._rankScore - a._rankScore);

    function getDistanceMetersForPlace(r: any): number | null {
      return r._distanceMeters ?? getDistanceMeters(location, r.geometry);
    }

    // Helper function to map Google Maps price_level to average peso price
    function getPriceInPesos(priceLevel: number | undefined): number {
      // Based on Google Maps price levels: 1=cheap, 2=moderate, 3=expensive, 4=very expensive
      // Mapping to realistic Philippine restaurant prices
      const priceMap: { [key: number]: number } = {
        1: 250,    // Budget: ₱150-350
        2: 450,    // Moderate: ₱350-550
        3: 750,    // Expensive: ₱550-950
        4: 1200    // Very Expensive: ₱950+
      };
      return priceMap[priceLevel || 2] || 450; // Default to moderate
    }

    // Generate AI match reasons and descriptions for each restaurant
    const results = await Promise.all(
      restaurants.map(async (r: any) => {
        // Use actual restaurant types from Google Maps, not the cuisine query
        const restaurantTypes = (r.types ?? ['restaurant']).map((t: string) =>
          t.replace(/_/g, ' ').charAt(0).toUpperCase() + t.replace(/_/g, ' ').slice(1)
        );

        const match_reason = await generateMatchReason(r.name, craving_text || cuisine || 'food', r.rating || 4, r.price_level || 2);
        const description = await generateRestaurantDescription(
          r.name,
          restaurantTypes,
          r.price_level ?? 2,
          craving_text || '',
          {},
          r.rating || 4.0,
          r.user_ratings_total || 0,
          (r.photos?.length || 0) > 0,
          false, // website info not available in nearbySearch
          undefined // open status not available in nearbySearch
        );

        // Calculate distance from user
        const distanceMeters = getDistanceMetersForPlace(r);

        return {
          restaurant_id: `rst_${r.place_id}`,
          place_id: r.place_id,
          name: r.name,
          hero_photo_url: r.photos?.[0]
            ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=800&photoreference=${
                r.photos[0].photo_reference
              }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
            : null,
          distance_meters: distanceMeters,
          match_reason: description.why_match, // Personalized reason why this matches user's craving
          rating: r.rating,
          price_level: r.price_level,
          average_price_pesos: getPriceInPesos(r.price_level),
          vibe_tags: [],
          description: {
            tagline: description.tagline,
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

    const realMenuItems = await getRealMenuItems({
      placeId,
      website: place.website,
      priceLevel: place.price_level ?? 2
    });

    if (realMenuItems.length > 0) {
      const results = realMenuItems.slice(0, 12).map((item, idx) => ({
        dish_id: `real_${placeId}_${item.name.replace(/\s+/g, '_')}`,
        name: item.name,
        description: item.description,
        photo_url: item.photo_url,
        restaurant_photo_url: place.photos?.[idx % (place.photos?.length || 1)]
          ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=400&photoreference=${
              place.photos![idx % place.photos!.length].photo_reference
            }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
          : null,
        photo_source: item.photo_url ? 'dish' : 'restaurant',
        price: item.price,
        match_score: 0.95 - (idx * 0.03),
        data_source: 'real_menu'
      }));

      return res.json({
        restaurant_id,
        restaurant_name: place.name,
        results
      });
    }

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
        const foodPhotoUrl = await getFoodImage(dish.name);
        const restaurantPhotoUrl = place.photos?.[idx % (place.photos?.length || 1)]
          ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=400&photoreference=${
              place.photos![idx % place.photos!.length].photo_reference
            }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
          : null;
        return {
          dish_id: `dsh_${placeId}_${dish.name.replace(/\s+/g, '_')}`,
          name: dish.name,
          description: dish.description,
          photo_url: foodPhotoUrl,
          restaurant_photo_url: restaurantPhotoUrl,
          photo_source: foodPhotoUrl ? 'dish' : restaurantPhotoUrl ? 'restaurant' : 'none',
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
      real_only?: boolean;
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
    const realOnly = Boolean((req.body as { real_only?: boolean }).real_only);

    if (!location?.lat || !location?.lng) {
      return res.status(400).json({ error: 'location is required' });
    }

    // Check cache first to avoid redundant Google Maps API calls
    // Use craving_text for cache key since that's what we actually search for
    let restaurants = getCachedRestaurants(location.lat, location.lng, craving_text || cuisine);

    if (!restaurants) {
      // Cache miss - fetch from Google Maps
      // eslint-disable-next-line no-console
      console.log(`[Cache] Miss for ${cuisine} at ${location.lat},${location.lng} - fetching from Maps API`);

      // Map craving text to proper keywords if available, otherwise use cuisine
      let keyword = 'restaurant';
      let keywordFallback: string | null = null;

      if (craving_text && craving_text.trim()) {
        const mappedKeywords = mapCravingToKeywords(craving_text);
        keyword = mappedKeywords[0];
        keywordFallback = mappedKeywords[1] || null;
        // eslint-disable-next-line no-console
        console.log(`🔍 Craving: "${craving_text}" -> Primary: "${keyword}", Fallback: "${keywordFallback}"`);
      } else if (cuisine && cuisine.trim()) {
        keyword = `${cuisine} restaurant`;
      }

      const maps = await mapsClient.nearbySearch({
        lat: location.lat,
        lng: location.lng,
        radius: 8000,
        keyword
      });

      restaurants = maps.results ?? [];

      // If we got few results and have a fallback keyword, try that
      if (restaurants.length < 8 && keywordFallback) {
        // eslint-disable-next-line no-console
        console.log(`🔍 Got only ${restaurants.length} results, trying fallback keyword: "${keywordFallback}"`);
        const fallbackMaps = await mapsClient.nearbySearch({
          lat: location.lat,
          lng: location.lng,
          radius: 8000,
          keyword: keywordFallback
        });
        restaurants.push(...(fallbackMaps.results ?? []));
      }

      if (restaurants.length < 24) {
        const supplementalQueries = getBroadFoodQueries(keyword);
        const textResults = await Promise.all(
          supplementalQueries.map(async (query) => {
            try {
              const response = await mapsClient.textSearch({
                query,
                location: { lat: location.lat, lng: location.lng },
                radius: 5000
              });
              return response.results ?? [];
            } catch {
              return [];
            }
          })
        );

        restaurants = mergeUniquePlaces(restaurants, ...textResults);
      }

      // Cache the results for 30 minutes (use craving_text for better cache key)
      cacheRestaurants(location.lat, location.lng, craving_text || cuisine, restaurants);
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

    const hasActiveAttributes = hasMeaningfulAttributes(attributes);
    const hasSpecificCravingText = Boolean(craving_text && craving_text.trim() && craving_text.trim().toLowerCase() !== 'popular dishes');

    const rankedRestaurants = restaurants
      .map((restaurant: any) => {
        const distanceMeters = getDistanceMeters(location, restaurant.geometry);
        const qualityScore = ((restaurant.rating || 4) / 5) * 0.45;
        const popularityScore = Math.min((restaurant.user_ratings_total || 0) / 800, 1) * 0.18;
        const proximityScore = getProximityBoost(distanceMeters);
        return {
          ...restaurant,
          _distanceMeters: distanceMeters,
          _selectionScore: qualityScore + popularityScore + proximityScore + Math.random() * 0.06
        };
      })
      .sort((a: any, b: any) => b._selectionScore - a._selectionScore);

    const topRestaurantPool = rankedRestaurants.slice(0, Math.min(24, rankedRestaurants.length));
    const shuffled = [...topRestaurantPool].sort(() => Math.random() - 0.5);
    const selectedRestaurants = shuffled.slice(0, Math.min(12, shuffled.length));

    // eslint-disable-next-line no-console
    console.log(`[Dishes] Selected ${selectedRestaurants.length} restaurants from ${restaurants.length} cached results. Processing up to 12 in parallel...`);

    // Process restaurants in parallel (limit to 12 at a time to avoid overwhelming the API)
    const allDishes: any[] = [];
    const processLimit = Math.min(12, selectedRestaurants.length);

    for (let i = 0; i < selectedRestaurants.length; i += processLimit) {
      const batch = selectedRestaurants.slice(i, i + processLimit);

      const batchResults = await Promise.all(
        batch.map(async (r: any) => {
          const restaurantId = `rst_${r.place_id}`;
          const details = realOnly ? await mapsClient.placeDetails(r.place_id) : null;
          const website = details?.result?.website || r.website;
          const photoCollection = details?.result?.photos || r.photos;
          const restaurantTypes = details?.result?.types || r.types;

          const realMenuItems = await getRealMenuItems({
            placeId: r.place_id,
            website,
            priceLevel: r.price_level ?? 2
          });

          if (realMenuItems.length > 0) {
            const scoredRealItems = realMenuItems
              .map((item) => {
                let matchScore = 0;
                const cravingMatch = getCravingMatchScore(item.name, craving_text ?? '');
                if (cravingMatch > 0) {
                  matchScore += cravingMatch * 0.5;
                }

                const inferred = inferDishTraits(item.name, item.description);
                if (attributes?.temperature === inferred.temperature) matchScore += 0.12;
                if (attributes?.flavor === inferred.flavor) matchScore += 0.12;
                if (attributes?.texture === inferred.texture) matchScore += 0.12;
                if (attributes?.intensity === inferred.intensity) matchScore += 0.08;

                if (!hasSpecificCravingText && !hasActiveAttributes && matchScore === 0) {
                  const ratingBoost = Math.max(0, ((r.rating || 4.0) - 3.5) * 0.12);
                  const popularityBoost = Math.min((r.user_ratings_total || 0) / 5000, 0.12);
                  matchScore = 0.55 + ratingBoost + popularityBoost;
                }

                const distanceMeters = r._distanceMeters ?? getDistanceMeters(location, r.geometry);
                return {
                  dish_id: `real_${r.place_id}_${item.name.replace(/\s+/g, '_')}`,
                  name: item.name,
                  description: item.description,
                  photo_url: item.photo_url,
                  restaurant_photo_url: photoCollection?.[0]
                    ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=400&photoreference=${
                        photoCollection[0].photo_reference
                      }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
                    : null,
                  photo_source: item.photo_url ? 'dish' : 'restaurant',
                  price: item.price,
                  restaurant_id: restaurantId,
                  restaurant_name: r.name,
                  distance_meters: distanceMeters,
                  rating: r.rating || 4.0,
                  match_score: Math.min(matchScore + getProximityBoost(distanceMeters) * 0.35, 1.0),
                  match_reason: 'Real menu item from the restaurant website',
                  data_source: 'real_menu'
                };
              })
              .sort((a, b) => b.match_score - a.match_score)
              .slice(0, 8);

            return scoredRealItems;
          }

          if (realOnly) {
            return [];
          }

          // Check menu cache first
          let generatedDishes = getCachedMenu(restaurantId);

          if (!generatedDishes) {
            // Cache miss - generate menu using OpenAI
            // eslint-disable-next-line no-console
            console.log(`[Menu Cache] Miss for ${restaurantId} - generating menu`);
            generatedDishes = await generateRestaurantMenu(
              r.name,
              restaurantTypes ?? ['restaurant'],
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
              restaurantTypes ?? ['restaurant'],
              r.price_level ?? 2,
              craving_text ?? '',
              attributes ?? {},
              r.rating || 4.0,
              r.user_ratings_total || 0,
              (r.photos?.length || 0) > 0,
              false, // website info not available in nearbySearch
              undefined // open status not available in nearbySearch
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

            // Broad swipe discovery should still show a non-zero confidence score
            // based on the restaurant quality when there is no strong craving input.
            if (!hasSpecificCravingText && !hasActiveAttributes && matchScore === 0) {
              const ratingBoost = Math.max(0, ((r.rating || 4.0) - 3.5) * 0.12);
              const popularityBoost = Math.min((r.user_ratings_total || 0) / 5000, 0.12);
              matchScore = 0.48 + ratingBoost + popularityBoost;
            }

            return {
              ...dish,
              matchScore: Math.min(matchScore, 1.0) // Cap at 1.0
            };
          })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 8); // Keep more dishes per restaurant for larger swipe decks

          // Create dish entries for this restaurant
          const restaurantDishes = await Promise.all(
            scoredDishes.map(async (dish, idx) => {
              const foodImageUrl = await getFoodImage(dish.name, cuisine);
              const fallbackUrl = r.photos?.[Math.floor(Math.random() * (r.photos?.length || 1))]
                ? `${'https://maps.googleapis.com/maps/api/place/photo'}?maxwidth=400&photoreference=${
                    r.photos![Math.floor(Math.random() * r.photos.length)].photo_reference
                  }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
                : null;

              const distanceMeters = r._distanceMeters ?? getDistanceMeters(location, r.geometry);
              return {
                dish_id: `dsh_${r.place_id}_${dish.name.replace(/\s+/g, '_')}`,
                name: dish.name,
                description: dish.description,
                photo_url: foodImageUrl,
                restaurant_photo_url: fallbackUrl,
                photo_source: foodImageUrl ? 'dish' : fallbackUrl ? 'restaurant' : 'none',
                price: dish.price,
                restaurant_id: restaurantId,
                restaurant_name: r.name,
                distance_meters: distanceMeters,
                rating: r.rating || 4.0,
                match_score: Math.min(dish.matchScore + getProximityBoost(distanceMeters) * 0.25, 1.0),
                match_reason: restaurantDescription.tagline, // Use AI tagline as match reason
                restaurant_description: {
                  tagline: restaurantDescription.tagline,
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
      .slice(0, 80); // Keep a broader candidate pool before weighted shuffle

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
      .slice(0, 50);

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
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

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
      distance_meters: Number.isFinite(lat) && Number.isFinite(lng)
        ? getDistanceMeters({ lat, lng }, place.geometry)
        : null,
      latitude: place.geometry?.location?.lat ?? null,
      longitude: place.geometry?.location?.lng ?? null,
      types: place.types || []
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching restaurant details:', err);
    return res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});
// NEW Trending endpoint - Get hottest restaurants in Cebu with engagement scoring
// Featured restaurants for prototype (to be replaced with database later)
const FEATURED_RESTAURANTS = [
  'Din Tai Fung',
  'Manam',
  "Mo' Cookies",
  'Ooma',
  '8Cuts Burgers',
  'House of Lechon',
  'Tales and Feelings',
  'Kaayoo The Filipino Kitchen',
  'KUBU Restaurant + Bar'
];

discoveryRouter.post('/trending', async (req, res) => {
  try {
    const { location, limit = 20, category = 'all' } = req.body as {
      location?: { lat?: number; lng?: number };
      limit?: number;
      category?: 'all' | 'garden' | 'city-view' | 'cozy-cafes' | 'fine-dining' | 'newest' | 'mall-food' | 'quick-bites';
    };

    if (!location?.lat || !location?.lng) {
      return res.status(400).json({ error: 'location.lat and location.lng are required' });
    }

    // Fetch restaurants near user using text search (more reliable than nearbySearch)
    // eslint-disable-next-line no-console
    console.log(`🔥 Trending search at ${location.lat}, ${location.lng} - Category: ${category}`);

    // Different search queries based on category
    let searchQueries: string[] = [];

    if (category === 'garden') {
      searchQueries = ['garden restaurant', 'outdoor dining', 'restaurant with garden', 'garden cafe'];
    } else if (category === 'city-view') {
      searchQueries = ['rooftop restaurant', 'restaurant with view', 'sky lounge', 'observation deck restaurant'];
    } else if (category === 'cozy-cafes') {
      searchQueries = ['cozy cafe', 'intimate restaurant', 'boutique cafe', 'charming cafe'];
    } else if (category === 'fine-dining') {
      searchQueries = ['fine dining', 'upscale restaurant', 'gourmet restaurant', 'michelin restaurant'];
    } else if (category === 'mall-food') {
      searchQueries = ['restaurants in mall', 'mall food', 'food court', 'mall cafe'];
    } else if (category === 'quick-bites') {
      searchQueries = ['quick bites', 'food stall', 'snack kiosk', 'casual eats'];
    } else if (category === 'newest') {
      searchQueries = ['new restaurant', 'recently opened restaurant', 'trending restaurant', 'popular new place'];
    } else {
      searchQueries = [
        'popular restaurants',
        'best restaurants',
        'restaurants',
        'cafes and restaurants',
        'food places',
        'restaurants in mall',
        'quick bites'
      ];
    }

    let restaurants: any[] = [];

    for (const query of searchQueries) {
      if (restaurants.length >= 5) break; // Stop if we already have enough results

      // eslint-disable-next-line no-console
      console.log(`🔥 Trying text search: "${query}"`);

      try {
        const maps = await mapsClient.textSearch({
          query,
          location,
          radius: 3000
        });

        if (maps.results && maps.results.length > 0) {
          restaurants = [...restaurants, ...maps.results];
          // eslint-disable-next-line no-console
          console.log(`🔥 Found ${maps.results.length} places for "${query}"`);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`🔥 Query "${query}" failed, trying next...`);
      }
    }

    // Remove duplicates by place_id
    const uniqueRestaurants = Array.from(
      new Map(restaurants.map(r => [r.place_id, r])).values()
    );

    // eslint-disable-next-line no-console
    console.log(`🔥 Total unique results after all queries: ${uniqueRestaurants.length}`);

    // If still no results, return empty
    if (uniqueRestaurants.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`🔥 No restaurants found after all attempts`);
      return res.json({
        discovery_session_id: `dst_${Date.now()}`,
        results: []
      });
    }

    restaurants = uniqueRestaurants;

    // Score restaurants by engagement + recency
    const scoredRestaurants = restaurants.map((r: any) => {
      const distanceMeters = getDistanceMeters(location, r.geometry);

      // Engagement score: high ratings + lots of reviews
      const rating = r.rating || 0;
      const reviewCount = r.user_ratings_total || 0;

      const ratingScore = rating / 5; // 0-1
      const reviewScore = Math.min(reviewCount / 500, 1); // 0-1, normalize to 500 reviews
      let engagementScore = (ratingScore * 0.52) + (reviewScore * 0.28) + getProximityBoost(distanceMeters); // include proximity

      // Boost featured restaurants
      const isFeatured = FEATURED_RESTAURANTS.some(name => r.name?.includes(name));
      if (isFeatured) {
        engagementScore = Math.min(engagementScore + 0.3, 1); // Boost by 0.3, max 1.0
      }

      return {
        ...r,
        distance_meters: distanceMeters,
        engagementScore,
        isFeatured,
        isNew: reviewCount < 30 && rating >= 4.0, // Newer with decent rating (4.0+)
        isHottest: engagementScore > 0.75 && reviewCount >= 50 // High engagement + established
      };
    });

    // Separate and sort: hottest first, then newest, then by engagement
    const hottest = scoredRestaurants.filter((r: any) => r.isHottest);
    const newest = scoredRestaurants.filter((r: any) => r.isNew && !r.isHottest);
    const others = scoredRestaurants.filter((r: any) => !r.isHottest && !r.isNew);

    // Sort each group by engagement score
    hottest.sort((a: any, b: any) => b.engagementScore - a.engagementScore);
    newest.sort((a: any, b: any) => b.engagementScore - a.engagementScore);
    others.sort((a: any, b: any) => b.engagementScore - a.engagementScore);

    // Combine: hottest first, then newest, then others
    const topRestaurants = [...hottest, ...newest, ...others].slice(0, limit);

    // Format response similar to other discovery endpoints
    const results = topRestaurants.map((r: any) => ({
      restaurant_id: `rst_${r.place_id}`,
      place_id: r.place_id,
      name: r.name,
      hero_photo_url: r.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${
            r.photos[0].photo_reference
          }&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
        : null,
      rating: r.rating || 0,
      price_level: r.price_level || 2,
      review_count: r.user_ratings_total || 0,
      distance_meters: r.distance_meters,
      isNew: r.isNew,
      isHottest: r.isHottest,
      isFeatured: r.isFeatured,
      engagement_score: Number(r.engagementScore.toFixed(2)),
      vibe_tags: r.types?.slice(0, 3) || []
    }));

    return res.json({
      discovery_session_id: `dst_${Date.now()}`,
      results
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching trending restaurants:', err);
    return res.status(500).json({ error: 'Failed to fetch trending restaurants' });
  }
});
