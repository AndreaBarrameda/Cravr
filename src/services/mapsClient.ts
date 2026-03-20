import axios from 'axios';
import { env } from '../config/env';

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';

export const mapsClient = {
  async nearbySearch(params: { lat: number; lng: number; radius: number; keyword?: string }) {
    const { lat, lng, radius, keyword } = params;
    const url = `${MAPS_BASE}/place/nearbysearch/json`;
    const res = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius,
        keyword,
        type: 'restaurant',
        key: env.mapsApiKey
      }
    });

    // Fetch photos for each restaurant
    if (res.data?.results) {
      await Promise.all(
        res.data.results.map(async (restaurant: any) => {
          if (restaurant.place_id) {
            try {
              const detailsRes = await axios.get(url.replace('/nearbysearch/json', '/details/json'), {
                params: {
                  place_id: restaurant.place_id,
                  key: env.mapsApiKey,
                  fields: 'photos'
                }
              });
              if (detailsRes.data?.result?.photos) {
                restaurant.photos = detailsRes.data.result.photos;
              }
            } catch (e) {
              // Silently fail if details fetch fails
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

