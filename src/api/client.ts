// IMPORTANT:
// - On a real phone, "localhost" is the phone itself (not your computer).
// - Use EXPO_PUBLIC_API_URL to point to your backend (LAN IP or deployed URL).
// Example: EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"
const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';
const BASE_URL = `${API_ORIGIN}/api`;

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
    cuisine: string;
    lat: number;
    lng: number;
  }) {
    return request('/discovery/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        craving_id: params.craving_id,
        cuisine: params.cuisine,
        location: { lat: params.lat, lng: params.lng },
        radius_meters: 3000
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

  getRestaurantDetails(placeId: string) {
    return request(`/discovery/restaurants/${placeId}`);
  },

  discoverDishesByAttributes(params: {
    craving_id: string;
    cuisine: string;
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
        craving_id: params.craving_id,
        cuisine: params.cuisine,
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
  }
};

