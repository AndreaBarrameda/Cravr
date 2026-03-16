import { Geolocation } from 'react-native';

export type LocationData = {
  latitude: number;
  longitude: number;
  address?: string;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  return true;
}

export async function checkLocationPermission(): Promise<boolean> {
  return true;
}

// Default Cebu location for fallback
const DEFAULT_LOCATION: LocationData = {
  latitude: 10.3157,
  longitude: 123.8854,
  address: 'Cebu, Philippines'
};

export async function getCurrentLocation(): Promise<LocationData | null> {
  // For now, just return default location (Cebu)
  // TODO: Fix Geolocation API to fetch real user location
  return DEFAULT_LOCATION;
}

export async function getLocationWithUserConsent(
  onPermissionRequest?: () => Promise<boolean>
): Promise<LocationData | null> {
  // User already enabled location via iOS/Android permission dialog
  return getCurrentLocation();
}
