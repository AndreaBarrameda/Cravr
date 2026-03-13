import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDiscovery'>;

type RestaurantCard = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  distance_meters: number | null;
  rating: number;
  price_level: number;
  vibe_tags: string[];
};

export function RestaurantDiscoveryScreen({ route, navigation }: Props) {
  const { cravingId, cuisine } = route.params;
  const { state, setState } = useAppState();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use device location from app state, fallback to LA for testing
        const lat = state.location?.latitude ?? 34.0522;
        const lng = state.location?.longitude ?? -118.2437;

        const data = await api.discoverRestaurants({
          craving_id: cravingId,
          cuisine,
          lat,
          lng
        });
        setRestaurants(data.results);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cravingId, cuisine, state.location]);

  const onSelect = (restaurantId: string) => {
    setState((prev) => ({ ...prev, selectedRestaurantId: restaurantId }));
    navigation.navigate('RestaurantDetail', {
      restaurantId,
      cravingId,
      cuisine
    });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Matches near you</Text>
      <Text style={styles.subtitle}>{cuisine} • based on your craving</Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF6A2A" />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.restaurant_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelect(item.restaurant_id)}
            >
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.rating ? `${item.rating.toFixed(1)} ★` : 'New'} •{' '}
                  {'$'.repeat(item.price_level || 1)}
                </Text>
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
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  cardBody: {},
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

