import { Platform } from 'react-native';

let Location: any = null;
if (Platform.OS !== 'web') {
  Location = require('expo-location');
}

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

async function getWebLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using default location');
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocodeWithGoogleMaps(latitude, longitude);
        resolve({
          latitude,
          longitude,
          address
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        resolve(DEFAULT_LOCATION);
      },
      { timeout: 10000 }
    );
  });
}

async function getNativeLocation(): Promise<LocationData | null> {
  try {
    if (!Location) return DEFAULT_LOCATION;

    // Request permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return DEFAULT_LOCATION;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeoutMillis: 5000
    });

    const address = await reverseGeocodeWithGoogleMaps(
      location.coords.latitude,
      location.coords.longitude
    );

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address
    };
  } catch (error) {
    console.error('Error getting native location:', error);
    return DEFAULT_LOCATION;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return true;
    }
    if (!Location) return false;

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return true;
    }
    if (!Location) return false;

    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted, using default location');
      return DEFAULT_LOCATION;
    }

    if (Platform.OS === 'web') {
      return getWebLocation();
    }

    return getNativeLocation();
  } catch (error) {
    console.error('Error getting current location:', error);
    return DEFAULT_LOCATION;
  }
}

export async function getLocationWithUserConsent(
  onPermissionRequest?: () => Promise<boolean>
): Promise<LocationData | null> {
  try {
    const hasPermission = await checkLocationPermission();

    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.warn('User denied location permission, using default location');
        return DEFAULT_LOCATION;
      }
    }

    return getCurrentLocation();
  } catch (error) {
    console.error('Error getting location with user consent:', error);
    return DEFAULT_LOCATION;
  }
}
