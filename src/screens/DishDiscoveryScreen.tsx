import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Linking,
  FlatList
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'DishDiscovery'>;

type RestaurantResult = {
  dish_id: string;
  name: string;
  restaurant_id: string;
  restaurant_name: string;
  description: string;
  price: number;
  rating: number;
  match_score: number;
  match_reason: string;
};

type Attributes = {
  temperature: string | null;
  flavor: string | null;
  texture: string | null;
  intensity: string | null;
  occasion: string | null;
  budget: string | null;
};

export function DishDiscoveryScreen({ route, navigation }: Props) {
  const { cravingId, cuisine, attributes, craving_text } = route.params;
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lat = state.location?.latitude ?? 10.3157;
        const lng = state.location?.longitude ?? 123.8854;

        const data = await api.discoverDishesByAttributes({
          craving_text: craving_text || cravingId || '',
          cuisine,
          attributes: attributes as Attributes,
          location: { lat, lng }
        });

        if (data.results && Array.isArray(data.results)) {
          // Get unique restaurants
          const uniqueRestaurants = Array.from(
            new Map(
              data.results.map((item) => [item.restaurant_id, item])
            ).values()
          );
          setRestaurants(uniqueRestaurants);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch restaurants:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cravingId, cuisine, attributes, craving_text, state.location]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF6A2A" size="large" />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (restaurants.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenContainer>
          <Text style={styles.emptyTitle}>No restaurants found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your preferences to find more options
          </Text>
          <CravrButton label="Go Back" onPress={() => navigation.goBack()} />
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenContainer>
        <Text style={styles.title}>Perfect Restaurants for You</Text>
        <Text style={styles.subtitle}>
          {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} match your craving
        </Text>

        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.restaurant_id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
              <Text style={styles.reason}>{item.match_reason}</Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>⭐ Rating</Text>
                  <Text style={styles.statValue}>{item.rating.toFixed(1)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>💰 Est. Price</Text>
                  <Text style={styles.statValue}>₱{item.price.toFixed(0)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>✨ Match</Text>
                  <Text style={styles.statValue}>{Math.round(item.match_score * 100)}%</Text>
                </View>
              </View>

              <Text style={styles.menuLabel}>View Real Menu:</Text>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(item.restaurant_name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <Text style={styles.menuButtonIcon}>📍</Text>
                <Text style={styles.menuButtonText}>Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  const searchUrl = `https://www.grabfood.com/ph/search?q=${encodeURIComponent(item.restaurant_name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <Text style={styles.menuButtonIcon}>🍽️</Text>
                <Text style={styles.menuButtonText}>GrabFood</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  const searchUrl = `https://www.foodpanda.ph/search?q=${encodeURIComponent(item.restaurant_name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <Text style={styles.menuButtonIcon}>🎯</Text>
                <Text style={styles.menuButtonText}>Foodpanda</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B6B6B'
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
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  reason: {
    fontSize: 13,
    color: '#FF6A2A',
    fontWeight: '500',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  stat: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#161616'
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 8,
    marginTop: 4
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE0CF'
  },
  menuButtonIcon: {
    fontSize: 16,
    marginRight: 8
  },
  menuButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6A2A'
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 24
  }
});
