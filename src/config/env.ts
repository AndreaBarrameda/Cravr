import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 4000,
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  mapsApiKey: process.env.GOOGLE_MAPS_SERVER_API_KEY ?? '',
  spoonacularApiKey: process.env.SPOONACULAR_API_KEY ?? '',
  pexelsApiKey: process.env.PEXELS_API_KEY ?? '',
  unsplashApiKey: process.env.UNSPLASH_API_KEY ?? ''
};

if (!env.openaiApiKey) {
  // eslint-disable-next-line no-console
  console.warn('[CRAVR] OPENAI_API_KEY is not set. Craving resolution will not work until configured.');
}

if (!env.mapsApiKey) {
  // eslint-disable-next-line no-console
  console.warn('[CRAVR] GOOGLE_MAPS_SERVER_API_KEY is not set. Discovery will not work until configured.');
}

if (!env.spoonacularApiKey && !env.pexelsApiKey) {
  // eslint-disable-next-line no-console
  console.warn('[CRAVR] No food image APIs configured. Using direct Unsplash URLs as fallback.');
}
