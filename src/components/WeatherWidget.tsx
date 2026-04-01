import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const getWeatherIcon = () => {
    if (weather.condition === 'rainy') return 'rainy-outline';
    if (weather.condition === 'snowy') return 'snow-outline';
    if (weather.condition === 'cloudy' || weather.condition === 'foggy') return 'cloudy-outline';
    if (weather.temperature > 28) return 'sunny-outline';
    return 'partly-sunny-outline';
  };

  const getTimeIcon = () => {
    if (timeOfDay === 'breakfast') return 'partly-sunny-outline';
    if (timeOfDay === 'lunch') return 'sunny-outline';
    if (timeOfDay === 'dinner') return 'moon-outline';
    return 'star-outline';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name={getWeatherIcon() as any} size={16} color={tokens.colors.primary} />
        <Text style={styles.compactText}>{weather.temperature}°</Text>
        <Text style={styles.compactTime}>{timeOfDay}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Ionicons name={getWeatherIcon() as any} size={26} color={tokens.colors.primary} />
        <View style={styles.weatherInfo}>
          <Text style={styles.temperature}>{weather.temperature}°C</Text>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.rightSection}>
        <Ionicons name={getTimeIcon() as any} size={26} color={tokens.colors.primary} />
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>{timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}</Text>
          <View style={styles.humidityRow}>
            <Ionicons name="water-outline" size={12} color={tokens.colors.textSecondary} />
            <Text style={styles.humidity}> {weather.humidity}%</Text>
          </View>
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
  humidityRow: {
    flexDirection: 'row',
    alignItems: 'center'
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
