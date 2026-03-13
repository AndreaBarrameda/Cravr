import * as Location from 'expo-location';

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
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Location permission request failed:', error);
    return false;
  }
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Location permission check failed:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('Location permission denied');
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    const { latitude, longitude } = location.coords;

    // Get address from Google Maps if API key is available
    const address = await reverseGeocodeWithGoogleMaps(latitude, longitude);

    return {
      latitude,
      longitude,
      address
    };
  } catch (error) {
    console.error('Failed to get current location:', error);
    return null;
  }
}

export async function getLocationWithUserConsent(
  onPermissionRequest?: () => Promise<boolean>
): Promise<LocationData | null> {
  try {
    const hasPermission = await checkLocationPermission();

    if (!hasPermission) {
      // If custom permission handler is provided, use it
      if (onPermissionRequest) {
        const userConsented = await onPermissionRequest();
        if (!userConsented) {
          console.log('User did not consent to location access');
          return null;
        }
      }

      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('Location permission denied by system');
        return null;
      }
    }

    return getCurrentLocation();
  } catch (error) {
    console.error('Location retrieval with consent failed:', error);
    return null;
  }
}
