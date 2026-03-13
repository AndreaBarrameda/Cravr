# CRAVR Mobile (Expo)

## Run

```bash
npm install
npx expo start -c
```

## Backend URL (fixes "Network request failed")

If you run this app on a **real phone**, the app cannot call `http://localhost:4000` because
`localhost` points to the phone itself.

Set `EXPO_PUBLIC_API_URL` to your computer's LAN IP (or a deployed backend):

```bash
EXPO_PUBLIC_API_URL="http://192.168.1.20:4000" npx expo start -c --tunnel
```

Or add it to your shell profile and restart Expo.

