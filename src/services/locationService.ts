export type LocationData = {
  latitude: number;
  longitude: number;
  address?: string;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Default Cebu location for fallback
const DEFAULT_LOCATION: LocationData = {
  latitude: 10.3157,
  longitude: 123.8854,
  address: 'Cebu, Philippines'
};

async function reverseGeocodeWithGoogleMaps(
  latitude: number,
  longitude: number
): Promise<string | undefined> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured');
    return undefined;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
  }

  return undefined;
}

export async function requestLocationPermission(): Promise<boolean> {
  console.log('📍 Requesting location permission via browser geolocation');
  return true;
}

export async function checkLocationPermission(): Promise<boolean> {
  return true;
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    console.log('📍 Getting current location via navigator.geolocation');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation not supported, using default location');
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Got location: ${latitude}, ${longitude}`);
        const address = await reverseGeocodeWithGoogleMaps(latitude, longitude);
        resolve({
          latitude,
          longitude,
          address
        });
      },
      (error) => {
        console.warn('📍 Geolocation error:', error.message);
        resolve(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export async function getLocationWithUserConsent(
  onPermissionRequest?: () => Promise<boolean>
): Promise<LocationData | null> {
  try {
    console.log('📍 Getting location with user consent');
    return await getCurrentLocation();
  } catch (error) {
    console.error('Error getting location with user consent:', error);
    return DEFAULT_LOCATION;
  }
}
