# Quick Start: Location-Based Features

## 1. Set Up Environment Variables

Create `.env.local` in the `mobile/` directory:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_from_google_cloud
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
```

Get your Google Maps API key:
- Go to https://console.cloud.google.com/
- Create/select a project
- Enable: Maps SDK for iOS/Android, Geocoding API
- Create API key under Credentials
- Copy the key to `.env.local`

## 2. Install Dependencies

```bash
cd mobile
npm install
```

The `expo-location@^16.5.5` package is already added to package.json.

## 3. Run the App

```bash
npm start        # Start dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
```

## 4. Test Location Features

### First Run
1. App launches and shows location permission modal
2. Tap "Allow" to grant permission
3. App fetches your device location
4. Location is stored and used for all requests

### Enter a Craving
1. Type a craving (e.g., "spicy ramen")
2. Backend receives your location with the craving
3. Craving resolution can be location-aware
4. Select a cuisine

### Discover Restaurants
1. Restaurants near your location appear
2. Distance is calculated from your location
3. Results are sorted by proximity and relevance

## 5. API Changes (Backend Integration)

Your backend should now handle location in these endpoints:

### POST /api/craving/resolve
```json
{
  "text": "spicy ramen",
  "location": { "lat": 34.0522, "lng": -118.2437 }  // ← NEW
}
```

### POST /api/discovery/restaurants
```json
{
  "craving_id": "abc123",
  "cuisine": "Japanese",
  "location": { "lat": 34.0522, "lng": -118.2437 },
  "radius_meters": 3000
}
```

## 6. Verify Setup

Check the console logs:
```
✅ Location: { latitude: 34.0522, longitude: -118.2437, address: "Los Angeles, CA" }
✅ App State: { location: {...}, craving: {...} }
```

If you see errors:
- Missing API key: Google Maps will return 403 (address won't show, location still works)
- Permission denied: App uses fallback location (LA)
- Network error: Check your API URL in .env.local

## 7. Testing Without Real Device

### iOS Simulator
1. Open Xcode → Simulator
2. Features → Location → Choose location or custom

### Android Emulator
1. Open emulator → Settings
2. Apps → Permissions → Location
3. Allow the app

## 8. Files to Review

- `IMPLEMENTATION_SUMMARY.md` - Full technical details
- `LOCATION_SETUP.md` - Complete configuration guide
- `src/services/locationService.ts` - Location service code
- `src/components/LocationPermissionModal.tsx` - Permission UI
- `App.tsx` - How location is initialized

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not found" in console | Create .env.local with EXPO_PUBLIC_GOOGLE_MAPS_API_KEY |
| Location returns null | Check location permission in device Settings |
| Address shows undefined | Verify Google Maps API key and Geocoding API is enabled |
| Restaurants all from LA | Check if location is being passed correctly to backend |
| Permission modal doesn't appear | Force quit app and restart (clear cache) |

## Key Code Locations

```
src/
├── services/
│   └── locationService.ts          ← Location fetching logic
├── components/
│   └── LocationPermissionModal.tsx  ← Permission UI
├── state/
│   └── AppStateContext.tsx          ← App state (now includes location)
├── api/
│   └── client.ts                    ← API with location params
└── screens/
    ├── SplashCravingScreen.tsx      ← Uses location in craving resolve
    └── RestaurantDiscoveryScreen.tsx ← Uses location for discovery

App.tsx                              ← Location initialization
app.json                             ← Permissions config
.env.local                           ← Your secrets (create this)
```

## Next: Backend Integration

Update your backend to:
1. Accept `location` parameter in `/api/craving/resolve`
2. Use location to bias craving resolution with OpenAI API
3. Implement `/api/discovery/dishes` endpoint with location
4. Filter restaurants by distance using the provided coordinates
5. (Optional) Use Google Places API to enrich restaurant data

Example backend usage:
```typescript
// In Node.js/Express backend
app.post('/api/craving/resolve', async (req, res) => {
  const { text, location } = req.body;

  // Use location context with OpenAI
  const prompt = location
    ? `User in ${location.lat},${location.lng} craving: ${text}`
    : `User craving: ${text}`;

  const result = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });

  res.json(result);
});
```

---

✅ **You're all set!** The app now has full location-based functionality with user consent.
