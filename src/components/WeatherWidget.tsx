import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTimeOfDay, getWeatherData, type WeatherData } from '../utils/contextual';
import { tokens } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';

interface WeatherWidgetProps {
  compact?: boolean; // If true, show minimal version
}

export function WeatherWidget({ compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [timeOfDay, setTimeOfDay] = useState('');
  const { state } = useAppState();

  useEffect(() => {
    const initializeContext = async () => {
      const time = getTimeOfDay();
      setTimeOfDay(time);

      if (state.location) {
        const weatherData = await getWeatherData(
          state.location.latitude,
          state.location.longitude
        );
        setWeather(weatherData);
      }
    };

    initializeContext();
  }, [state.location]);

  if (!weather || !timeOfDay) return null;

  const getWeatherEmoji = () => {
    if (weather.condition === 'rainy') return '🌧️';
    if (weather.condition === 'snowy') return '❄️';
    if (weather.condition === 'cloudy' || weather.condition === 'foggy') return '☁️';
    if (weather.temperature > 28) return '☀️';
    return '🌤️';
  };

  const getTimeEmoji = () => {
    if (timeOfDay === 'breakfast') return '🌅';
    if (timeOfDay === 'lunch') return '☀️';
    if (timeOfDay === 'dinner') return '🌙';
    return '⭐';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactEmoji}>{getWeatherEmoji()}</Text>
        <Text style={styles.compactText}>{weather.temperature}°</Text>
        <Text style={styles.compactTime}>{timeOfDay}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.weatherEmoji}>{getWeatherEmoji()}</Text>
        <View style={styles.weatherInfo}>
          <Text style={styles.temperature}>{weather.temperature}°C</Text>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.rightSection}>
        <Text style={styles.timeEmoji}>{getTimeEmoji()}</Text>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>{timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}</Text>
          <Text style={styles.humidity}>💧 {weather.humidity}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.primaryTint,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    marginVertical: tokens.spacing.md,
    ...tokens.shadows.sm
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flex: 1
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flex: 1,
    justifyContent: 'flex-end'
  },
  weatherEmoji: {
    fontSize: 28
  },
  weatherInfo: {
    justifyContent: 'center'
  },
  temperature: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary
  },
  condition: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    textTransform: 'capitalize'
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.md
  },
  timeEmoji: {
    fontSize: 28
  },
  timeInfo: {
    justifyContent: 'center'
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary
  },
  humidity: {
    fontSize: 12,
    color: tokens.colors.textSecondary
  },

  // Compact version
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.primaryTint,
    borderRadius: tokens.radius.md,
    marginRight: tokens.spacing.md
  },
  compactEmoji: {
    fontSize: 16
  },
  compactText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary
  },
  compactTime: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    textTransform: 'capitalize'
  }
});
