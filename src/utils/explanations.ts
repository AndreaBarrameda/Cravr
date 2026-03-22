import { getTimeOfDay, type WeatherData } from './contextual';

export function generateMatchExplanation(params: {
  craving: string;
  restaurantName: string;
  timeOfDay: string;
  weather: WeatherData | null;
  distanceKm: number;
  rating: number;
  matchScore?: number;
}): string {
  const {
    craving,
    restaurantName,
    timeOfDay,
    weather,
    distanceKm,
    rating,
    matchScore
  } = params;

  // Priority scoring system - pick the BEST explanation
  const explanations: { text: string; priority: number }[] = [];

  const cravingLower = craving.toLowerCase();

  // Highest priority: Weather + Craving combination
  if (weather) {
    if (weather.condition === 'rainy') {
      explanations.push({ text: `Cozy haven on a rainy day`, priority: 100 });
    } else if (weather.temperature > 30) {
      explanations.push({ text: `Perfect for beating the heat`, priority: 95 });
    } else if (weather.temperature < 12) {
      explanations.push({ text: `Warm comfort food on a chilly day`, priority: 95 });
    }
  }

  // Time of day + Proximity
  if (timeOfDay === 'breakfast' && distanceKm < 1.5) {
    explanations.push({ text: `Quick & close breakfast spot`, priority: 90 });
  } else if (timeOfDay === 'lunch' && distanceKm < 2) {
    explanations.push({ text: `Perfect lunch break nearby`, priority: 85 });
  } else if (timeOfDay === 'dinner' && rating >= 4.3) {
    explanations.push({ text: `Dinner destination worth the trip`, priority: 85 });
  }

  // Proximity-based
  if (distanceKm < 0.3) {
    explanations.push({ text: `Practically next door`, priority: 80 });
  } else if (distanceKm < 0.8) {
    explanations.push({ text: `Walking distance away`, priority: 75 });
  } else if (distanceKm < 1.5) {
    explanations.push({ text: `Less than 2km away`, priority: 70 });
  }

  // Rating-based (specific to visit context)
  if (rating >= 4.8) {
    explanations.push({ text: `Almost perfect ${rating.toFixed(1)}★`, priority: 82 });
  } else if (rating >= 4.5) {
    explanations.push({ text: `Excellent reviews ${rating.toFixed(1)}★`, priority: 78 });
  } else if (rating >= 4.2) {
    explanations.push({ text: `Well-loved spot ${rating.toFixed(1)}★`, priority: 72 });
  }

  // Craving-specific insights
  if (cravingLower.includes('spicy')) {
    explanations.push({ text: `Known for seriously spicy dishes`, priority: 88 });
  }
  if (cravingLower.includes('fresh') || cravingLower.includes('healthy')) {
    explanations.push({ text: `Fresh & flavorful options`, priority: 85 });
  }
  if (cravingLower.includes('ramen') || cravingLower.includes('noodle')) {
    explanations.push({ text: `Ramen excellence awaits`, priority: 90 });
  }
  if (cravingLower.includes('pizza') || cravingLower.includes('pasta')) {
    explanations.push({ text: `Italian comfort done right`, priority: 87 });
  }
  if (cravingLower.includes('sushi') || cravingLower.includes('japanese')) {
    explanations.push({ text: `Fresh Japanese craftsmanship`, priority: 89 });
  }
  if (cravingLower.includes('burger') || cravingLower.includes('american')) {
    explanations.push({ text: `Juicy burgers, stellar fries`, priority: 86 });
  }

  // Fallback explanations (lowest priority)
  if (explanations.length === 0) {
    explanations.push({ text: `Great match for your craving`, priority: 50 });
    explanations.push({ text: `Popular choice locally`, priority: 45 });
  }

  // Sort by priority and return the best match
  explanations.sort((a, b) => b.priority - a.priority);
  return explanations[0]?.text || `Worth trying`;
}
