# Location Services Setup Guide

This document explains how location services are now integrated into the CRAVR app and how to configure them properly.

## Overview

The CRAVR app now requests user location with explicit consent before the app opens. The location is then used to:

1. **Provide location-based restaurant recommendations** - Restaurants are filtered and sorted based on distance from the user
2. **Enable location-aware craving resolution** - The OpenAI API receives location context when resolving what the user is craving
3. **Enhance dish matching** - Dishes are matched based on what's available nearby

## Setup Instructions

### 1. Google Maps API Key

The app uses Google Maps API for reverse geocoding (converting coordinates to addresses).

#### Get a Google Maps API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android (if building for Android)
   - Maps SDK for iOS (if building for iOS)
   - Geocoding API
4. Create an API key under "Credentials"
5. Restrict the API key to your app (recommended for production)

#### Configure in your project:

Create a `.env.local` file in the `mobile/` directory:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
```

**Important**: Never commit `.env.local` to version control. Use `.env.example` as a template instead.

### 2. Location Permissions

#### iOS

The app now includes location permission requests in `app.json`:

```json
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "CRAVR uses your location to find the best restaurants and dishes around you."
  }
}
```

This message appears when the app requests permission to access location.

#### Android

Location permissions are declared in `app.json`:

```json
"android": {
  "permissions": [
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_FINE_LOCATION"
  ]
}
```

Both coarse and fine location permissions are requested for accurate positioning.

### 3. First-Run Experience

When the app launches:

1. A modal appears asking the user to enable location access
2. Users can choose "Allow" or "Not Now"
3. If they allow:
   - The app fetches the device's current location
   - Location is stored in the app state
   - Reverse geocoding retrieves the address (if Google Maps API is configured)
4. If they deny:
   - The app continues but uses a default location (LA) for restaurant discovery
   - Users can enable location later in device settings

## Location Usage in the App

### Files Modified

1. **App.tsx** - Initializes location on app startup
2. **AppStateContext.tsx** - Stores location in app state
3. **SplashCravingScreen.tsx** - Uses location when resolving craving
4. **RestaurantDiscoveryScreen.tsx** - Uses location for restaurant discovery
5. **api/client.ts** - Passes location to backend APIs

### Backend Integration

The following API endpoints now receive location context:

```typescript
// POST /api/craving/resolve
{
  "text": "spicy ramen",
  "location": { "lat": 34.0522, "lng": -118.2437 }  // optional
}

// POST /api/discovery/restaurants
{
  "craving_id": "...",
  "cuisine": "Japanese",
  "location": { "lat": 34.0522, "lng": -118.2437 },
  "radius_meters": 3000
}

// POST /api/discovery/dishes (new endpoint)
{
  "restaurant_id": "...",
  "craving_id": "...",
  "location": { "lat": 34.0522, "lng": -118.2437 }
}
```

Ensure your backend is configured to:
- Accept location parameters
- Use Google Maps API or your own geocoding service for address retrieval
- Filter restaurants by distance using the location

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for geocoding | `AIzaSyD...` |
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://192.168.1.20:4000` |

## Testing

### Test with Mock Location

On iOS/Android simulators, you can mock a location:

**iOS Simulator:**
1. In Xcode, run the simulator
2. Features → Location → Choose a location (or custom coordinates)

**Android Emulator:**
1. Open emulator settings
2. Extended controls → Location
3. Set latitude/longitude

### Test without Location

The app gracefully handles missing location:
- If permission is denied, it uses a default location
- If Google Maps API is not configured, address won't be reverse-geocoded but location still works

## Security Notes

1. **API Key Restrictions**: For production, restrict your Google Maps API key to:
   - Android apps (with SHA-1 fingerprint)
   - iOS apps (with bundle ID)
   - This prevents unauthorized use of your key

2. **Location Data**:
   - User location is only used for the duration of the session
   - It's not stored permanently in the app
   - Ensure your backend properly secures location data

3. **Privacy**:
   - The permission modal clearly explains why location is needed
   - Users can disable location in device settings at any time

## Troubleshooting

### Location returns null
- Check if location permissions are granted in device settings
- On iOS, ensure the app is running (background location won't work with "When In Use")
- Check console for error messages

### Address is not showing up
- Verify Google Maps API key is correct and Geocoding API is enabled
- Check Google Cloud Console for API quota and errors

### Restaurant discovery returns empty
- Ensure location is being passed to the backend
- Check if there are restaurants in the requested radius
- Verify the radius_meters (currently set to 3000 meters)

## Future Enhancements

1. **Background location tracking** for continuous updates
2. **Location caching** to reduce API calls
3. **Multiple location support** for users checking multiple areas
4. **Location history** for returning users
5. **Integration with device native location services** for better accuracy
