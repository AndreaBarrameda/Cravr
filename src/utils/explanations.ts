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
    timeOfDay,
    weather,
    distanceKm,
    rating,
    matchScore
  } = params;

  const explanations: string[] = [];

  // Weather-based
  if (weather) {
    if (weather.condition === 'rainy' && (craving.includes('comfort') || craving.includes('soup') || craving.includes('warm'))) {
      explanations.push(`Perfect cozy spot on a rainy day`);
    } else if (weather.temperature > 28 && (craving.includes('refreshing') || craving.includes('cold') || craving.includes('salad'))) {
      explanations.push(`Refreshing ${craving.split(',')[0]} for hot weather`);
    } else if (weather.temperature < 15 && (craving.includes('warm') || craving.includes('hot') || craving.includes('soup'))) {
      explanations.push(`Warm comfort food on a chilly day`);
    }
  }

  // Time-based
  if (timeOfDay === 'breakfast' && distanceKm < 1) {
    explanations.push(`Quick breakfast stop nearby`);
  } else if (timeOfDay === 'lunch' && rating >= 4) {
    explanations.push(`Top-rated lunch spot`);
  } else if (timeOfDay === 'dinner' && (craving.includes('savory') || craving.includes('steak'))) {
    explanations.push(`Perfect dinner match for ${craving.split(',')[0]}`);
  }

  // Distance-based
  if (distanceKm < 0.5) {
    explanations.push(`Walking distance ${distanceKm.toFixed(1)}km`);
  } else if (distanceKm < 2) {
    explanations.push(`Just ${distanceKm.toFixed(1)}km away`);
  }

  // Rating-based
  if (rating >= 4.7) {
    explanations.push(`Highly rated ${rating}★`);
  } else if (rating >= 4.3) {
    explanations.push(`Great reviews ${rating}★`);
  }

  // Match score
  if (matchScore && matchScore > 0.85) {
    explanations.push(`Perfect match for your ${craving.split(',')[0]}`);
  }

  // Default fallback
  if (explanations.length === 0) {
    explanations.push(`Great pick for ${craving.split(',')[0]}`);
  }

  // Return the most relevant explanation
  return explanations[0];
}
