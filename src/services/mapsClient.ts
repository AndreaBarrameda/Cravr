import axios from 'axios';
import { env } from '../config/env';

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';

export const mapsClient = {
  async textSearch(params: { query: string; location?: { lat: number; lng: number }; radius?: number }) {
    const { query, location, radius } = params;
    const url = `${MAPS_BASE}/place/textsearch/json`;

    const queryParams: any = {
      query,
      key: env.mapsApiKey
    };

    if (location) {
      queryParams.location = `${location.lat},${location.lng}`;
      if (radius) {
        queryParams.radius = radius;
      }
    }

    // eslint-disable-next-line no-console
    console.log(`🔍 Text Search params:`, queryParams);

    let res;
    try {
      res = await axios.get(url, { params: queryParams });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error(`❌ Google Maps API error:`, error.response?.data || error.message);
      return { results: [] };
    }

    // eslint-disable-next-line no-console
    console.log(`📍 Text Search returned ${res.data?.results?.length || 0} results, Status: ${res.data?.status}`);

    // Fetch detailed photos for each result
    if (res.data?.results) {
      await Promise.all(
        res.data.results.map(async (restaurant: any) => {
          if (restaurant.place_id) {
            try {
              const detailsRes = await axios.get(url.replace('/textsearch/json', '/details/json'), {
                params: {
                  place_id: restaurant.place_id,
                  key: env.mapsApiKey
                }
              });
              if (detailsRes.data?.result?.photos) {
                restaurant.photos = detailsRes.data.result.photos;
              }
              if (detailsRes.data?.result?.geometry) {
                restaurant.geometry = detailsRes.data.result.geometry;
              }
              if (detailsRes.data?.result?.price_level) {
                restaurant.price_level = detailsRes.data.result.price_level;
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(`❌ Details fetch failed for ${restaurant.place_id}:`, (e as any).message);
            }
          }
        })
      );
    }

    return res.data;
  },

  async nearbySearch(params: { lat: number; lng: number; radius: number; keyword?: string }) {
    const { lat, lng, radius, keyword } = params;
    const url = `${MAPS_BASE}/place/nearbysearch/json`;

    // Build params - use keyword OR type, not both (Google Maps prefers one)
    const queryParams: any = {
      location: `${lat},${lng}`,
      radius,
      key: env.mapsApiKey
    };

    if (keyword) {
      queryParams.keyword = keyword;
      // Don't include type when using keyword
    } else {
      queryParams.type = 'restaurant';
    }

    // eslint-disable-next-line no-console
    console.log(`🔍 Maps search params:`, queryParams);

    let res;
    try {
      res = await axios.get(url, { params: queryParams });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error(`❌ Google Maps API error:`, error.response?.data || error.message);
      return { results: [] };
    }

    // eslint-disable-next-line no-console
    console.log(`📍 Google Maps returned ${res.data?.results?.length || 0} results`);
    // eslint-disable-next-line no-console
    console.log(`📍 Status: ${res.data?.status}`);

    // Fetch photos for each restaurant
    if (res.data?.results) {
      await Promise.all(
        res.data.results.map(async (restaurant: any) => {
          if (restaurant.place_id) {
            try {
              const detailsRes = await axios.get(url.replace('/nearbysearch/json', '/details/json'), {
                params: {
                  place_id: restaurant.place_id,
                  key: env.mapsApiKey
                }
              });
              if (detailsRes.data?.result?.photos) {
                restaurant.photos = detailsRes.data.result.photos;
              }
              if (detailsRes.data?.result?.geometry) {
                restaurant.geometry = detailsRes.data.result.geometry;
                // eslint-disable-next-line no-console
                console.log(`📍 ${restaurant.name}: ${JSON.stringify(restaurant.geometry.location)}`);
              }
              if (detailsRes.data?.result?.price_level) {
                restaurant.price_level = detailsRes.data.result.price_level;
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(`❌ Details fetch failed for ${restaurant.place_id}:`, (e as any).message);
            }
          }
        })
      );
    }

    return res.data;
  },

  async placeDetails(placeId: string) {
    const url = `${MAPS_BASE}/place/details/json`;
    const res = await axios.get(url, {
      params: {
        place_id: placeId,
        key: env.mapsApiKey,
        fields:
          'place_id,name,geometry,formatted_address,formatted_phone_number,international_phone_number,website,price_level,rating,user_ratings_total,opening_hours,photos,types'
      }
    });
    return res.data;
  }
};

