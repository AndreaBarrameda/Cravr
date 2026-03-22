// Open-Meteo Geocoding Service - Free geocoding API (no API key needed)

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  address?: string;
}

export async function geocodeLocation(query: string): Promise<GeocodeResult[]> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((result: any) => ({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country,
      admin1: result.admin1,
      address: result.admin1 ? `${result.name}, ${result.admin1}, ${result.country}` : `${result.name}, ${result.country}`
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}
