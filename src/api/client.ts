// IMPORTANT:
// - On a real phone, "localhost" is the phone itself (not your computer).
// - Use EXPO_PUBLIC_API_URL to point to your backend (LAN IP or deployed URL).
// Example: EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"
const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';
const BASE_URL = `${API_ORIGIN}/api`;

export type TasteProfileInput = {
  liked_dishes: string[];
  favorite_keywords: string[];
  favorite_cuisines: string[];
  search_history: string[];
};

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json();
}

export const api = {
  resolveCraving(text: string, location?: { lat: number; lng: number }) {
    return request('/craving/resolve', {
      method: 'POST',
      body: JSON.stringify({
        text,
        ...(location && { location })
      })
    });
  },

  discoverRestaurants(params: {
    craving_id: string;
    craving_text?: string;
    cuisine: string;
    lat: number;
    lng: number;
    taste_profile_input?: TasteProfileInput;
    timeOfDay?: string;
    weather?: { temperature: number; condition: string };
  }) {
    return request('/discovery/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        craving_id: params.craving_id,
        craving_text: params.craving_text,
        cuisine: params.cuisine,
        taste_profile_input: params.taste_profile_input,
        location: { lat: params.lat, lng: params.lng },
        radius_meters: 3000,
        context: {
          timeOfDay: params.timeOfDay,
          weather: params.weather
        }
      })
    });
  },

  getTrendingRestaurants(params: {
    lat: number;
    lng: number;
    taste_profile_input?: TasteProfileInput;
    limit?: number;
    category?: 'all' | 'garden' | 'city-view' | 'cozy-cafes' | 'fine-dining' | 'newest' | 'mall-food' | 'quick-bites';
  }) {
    return request('/discovery/trending', {
      method: 'POST',
      body: JSON.stringify({
        location: { lat: params.lat, lng: params.lng },
        taste_profile_input: params.taste_profile_input,
        limit: params.limit || 10,
        category: params.category || 'all'
      })
    });
  },

  discoverDishes(params: {
    restaurant_id: string;
    craving_id: string;
    lat: number;
    lng: number;
  }) {
    return request('/discovery/dishes', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: params.restaurant_id,
        craving_id: params.craving_id,
        location: { lat: params.lat, lng: params.lng }
      })
    });
  },

  getRestaurantDetails(placeId: string, location?: { lat: number; lng: number }) {
    const query = location
      ? `?lat=${encodeURIComponent(location.lat)}&lng=${encodeURIComponent(location.lng)}`
      : '';
    return request(`/discovery/restaurants/${placeId}${query}`);
  },

  discoverDishesByAttributes(params: {
    craving_text: string;
    cuisine: string;
    real_only?: boolean;
    attributes: {
      temperature: string | null;
      flavor: string | null;
      texture: string | null;
      intensity: string | null;
      occasion: string | null;
      budget: string | null;
    };
    location: { lat: number; lng: number };
  }) {
    return request('/discovery/dishes-by-attributes', {
      method: 'POST',
      body: JSON.stringify({
        craving_text: params.craving_text,
        cuisine: params.cuisine,
        real_only: params.real_only ?? false,
        attributes: params.attributes,
        location: params.location
      })
    });
  },

  createSoloSession(body: any) {
    return request('/solo-sessions', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  getCraveConnectCards(soloSessionId: string) {
    return request(`/crave-connect/cards?solo_session_id=${encodeURIComponent(soloSessionId)}`);
  },

  swipeCraveConnect(body: any) {
    return request('/crave-connect/swipe', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  createReservation(body: any) {
    return request('/reservations', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  getReservation(id: string) {
    return request(`/reservations/${id}`);
  },

  getMessages(matchId: string) {
    return request(`/chats/${matchId}/messages`);
  },

  sendMessage(matchId: string, text: string) {
    return request(`/chats/${matchId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  getMichelinGuide() {
    return request('/discovery/michelin');
  }
};
