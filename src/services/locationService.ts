import * as Location from 'expo-location';

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
  try {
    console.log('📍 Requesting location permission');
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    console.log('📍 Permission granted:', granted);
    return granted;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    console.log('📍 Getting current location');
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted');
      return DEFAULT_LOCATION;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    const { latitude, longitude } = location.coords;
    console.log(`📍 Got location: ${latitude}, ${longitude}`);

    const address = await reverseGeocodeWithGoogleMaps(latitude, longitude);

    return {
      latitude,
      longitude,
      address
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return DEFAULT_LOCATION;
  }
}

export async function getLocationWithUserConsent(): Promise<LocationData | null> {
  try {
    console.log('📍 Getting location with user consent');

    // Try to request permission first
    const granted = await requestLocationPermission();
    if (!granted) {
      console.warn('User denied location permission');
      return DEFAULT_LOCATION;
    }

    return await getCurrentLocation();
  } catch (error) {
    console.error('Error getting location with consent:', error);
    return DEFAULT_LOCATION;
  }
}
