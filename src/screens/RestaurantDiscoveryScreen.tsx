import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { getTimeOfDay, getWeatherData } from '../utils/contextual';
import { generateMatchExplanation } from '../utils/explanations';
import { calculateHaversineDistance } from '../utils/distance';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'RestaurantDiscovery'>;

type RestaurantCard = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  distance_meters: number | null;
  rating: number;
  price_level: number;
  vibe_tags: string[];
  match_reason?: string;
};

export function RestaurantDiscoveryScreen({ route, navigation }: Props) {
  const { cravingId, cravingText, cuisine } = route.params;
  const { state, setState } = useAppState();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use search location if set, otherwise use device location, fallback to Cebu for testing
        const searchLoc = state.searchLocation || state.location;
        const lat = searchLoc?.latitude ?? 10.3157;
        const lng = searchLoc?.longitude ?? 123.8854;

        // Get time and weather context
        const time = getTimeOfDay();
        const weatherData = await getWeatherData(lat, lng);
        setTimeOfDay(time);
        setWeather(weatherData);

        // eslint-disable-next-line no-console
        console.log('🍽️ Restaurant discovery location:', { lat, lng });
        // eslint-disable-next-line no-console
        console.log('⏰ Time of day:', time);
        // eslint-disable-next-line no-console
        console.log('🌤️ Weather:', weatherData);

        const data = await api.discoverRestaurants({
          craving_id: cravingId,
          craving_text: cravingText,
          cuisine,
          lat,
          lng,
          timeOfDay,
          weather: weatherData || undefined
        });
        // eslint-disable-next-line no-console
        console.log('🍽️ API Response:', data);
        // eslint-disable-next-line no-console
        console.log('🍽️ First restaurant:', data.results?.[0]);
        setRestaurants(data.results);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cravingId, cuisine, state.location, state.searchLocation]);

  const onSelect = (restaurantId: string) => {
    setState((prev) => ({ ...prev, selectedRestaurantId: restaurantId }));
    navigation.navigate('RestaurantDetail', {
      restaurantId,
      cravingId,
      cuisine
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <ScreenContainer>
        <Text style={styles.title}>Matches near you</Text>
        <Text style={styles.subtitle}>{cravingText || cuisine || 'your search'} • based on your craving</Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF6A2A" />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.restaurant_id}
          renderItem={({ item }) => {
            // Calculate distance in km and generate AI explanation
            const distanceKm = item.distance_meters ? item.distance_meters / 1000 : 0;
            const aiExplanation = generateMatchExplanation({
              craving: cravingText || cuisine || 'food',
              restaurantName: item.name,
              timeOfDay,
              weather,
              distanceKm,
              rating: item.rating || 0,
              matchScore: 0.8
            });

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onSelect(item.restaurant_id)}
              >
                {item.hero_photo_url && (
                  <Image
                    source={{ uri: item.hero_photo_url }}
                    style={styles.cardImage}
                  />
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.rating ? `${item.rating.toFixed(1)} ★` : 'New'} •{' '}
                    {item.price_level ? `₱${item.average_price_pesos}` : '$'} • {item.distance_meters ? (item.distance_meters > 1000 ? `${(item.distance_meters / 1000).toFixed(1)}km` : `${item.distance_meters}m`) : '—'}
                  </Text>
                  {aiExplanation && (
                    <Text style={styles.aiExplanation} numberOfLines={1}>
                      ✨ {aiExplanation}
                    </Text>
                  )}
                  {item.vibe_tags?.length ? (
                    <View style={styles.chipRow}>
                      {item.vibe_tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.chip}>
                          <Text style={styles.chipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6A2A'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 16
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0'
  },
  cardBody: {
    padding: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 8
  },
  aiExplanation: {
    fontSize: 13,
    color: '#FF6A2A',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 2
  },
  cardReason: {
    fontSize: 13,
    color: '#FF6A2A',
    fontWeight: '500',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8
  },
  chip: {
    backgroundColor: '#FFF0E6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  chipText: {
    fontSize: 12,
    color: '#FF6A2A',
    fontWeight: '500'
  }
});

