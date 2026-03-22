/**
 * Get time of day period
 * @returns 'breakfast' | 'lunch' | 'dinner' | 'snack'
 */
export function getTimeOfDay(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 23) return 'dinner';
  return 'snack'; // late night
}

export type WeatherData = {
  temperature: number; // Celsius
  condition: string; // 'clear' | 'rainy' | 'hot' | 'cold'
  humidity: number;
  description: string;
};

/**
 * Fetch weather data from Open-Meteo (free, no API key needed)
 */
export async function getWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m&temperature_unit=celsius`
    );
    const data = await response.json();
    const current = data.current;

    if (!current) return null;

    const temp = current.temperature_2m;
    const weatherCode = current.weather_code;
    const humidity = current.relative_humidity_2m;

    let condition = 'clear';
    if (weatherCode === 0) condition = 'clear';
    else if (weatherCode >= 1 && weatherCode <= 3) condition = 'cloudy';
    else if (weatherCode >= 45 && weatherCode <= 48) condition = 'foggy';
    else if (weatherCode >= 51 && weatherCode <= 67) condition = 'rainy';
    else if (weatherCode >= 71 && weatherCode <= 77) condition = 'snowy';
    else if (weatherCode >= 80 && weatherCode <= 82) condition = 'rainy';

    return {
      temperature: temp,
      condition,
      humidity,
      description: `${temp}°C, ${condition}`
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

/**
 * Get food suggestions based on time and weather
 */
export function getFoodSuggestions(
  timeOfDay: string,
  weather: WeatherData | null
): string[] {
  const suggestions: string[] = [];

  // Time-based suggestions
  if (timeOfDay === 'breakfast') {
    suggestions.push('pancakes', 'eggs', 'coffee', 'toast', 'oatmeal');
  } else if (timeOfDay === 'lunch') {
    suggestions.push('sandwich', 'salad', 'pasta', 'rice bowl');
  } else if (timeOfDay === 'dinner') {
    suggestions.push('steak', 'fish', 'curry', 'pasta', 'grilled');
  } else if (timeOfDay === 'snack') {
    suggestions.push('pizza', 'fries', 'burger', 'dessert');
  }

  // Weather-based suggestions
  if (weather) {
    if (weather.temperature > 28) {
      // Hot weather
      suggestions.push('cold', 'refreshing', 'ice cream', 'smoothie', 'salad');
    } else if (weather.temperature < 15) {
      // Cold weather
      suggestions.push('warm', 'soup', 'hot', 'comfort food', 'stew');
    }

    if (weather.condition === 'rainy') {
      suggestions.push('hot', 'comfort', 'indoor', 'cozy');
    }
  }

  return [...new Set(suggestions)]; // Remove duplicates
}
