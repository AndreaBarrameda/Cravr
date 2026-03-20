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
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { RestaurantCard } from '../components/RestaurantCard';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'DishDiscovery'>;

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
          <ActivityIndicator color={tokens.colors.primary} size="large" />
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
          renderItem={({ item, index }) => (
            <View>
              <RestaurantCard
                restaurantName={item.restaurant_name}
                matchScore={item.match_score}
                matchReason={item.match_reason}
                rating={item.rating}
                price={item.price}
                cuisine={cuisine || 'Mixed'}
                onSwipeYes={() => {
                  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(item.restaurant_name)}`;
                  Linking.openURL(searchUrl);
                }}
                onSwipeNo={() => {
                  // Could implement dismissing the card here
                  console.log(`Dismissed: ${item.restaurant_name}`);
                }}
              />

              {/* Secondary action buttons */}
              <View style={styles.secondaryActionsContainer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    const searchUrl = `https://www.grabfood.com/ph/search?q=${encodeURIComponent(item.restaurant_name)}`;
                    Linking.openURL(searchUrl);
                  }}
                >
                  <Text style={styles.secondaryButtonIcon}>🍽️</Text>
                  <Text style={styles.secondaryButtonText}>GrabFood</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    const searchUrl = `https://www.foodpanda.ph/search?q=${encodeURIComponent(item.restaurant_name)}`;
                    Linking.openURL(searchUrl);
                  }}
                >
                  <Text style={styles.secondaryButtonIcon}>🎯</Text>
                  <Text style={styles.secondaryButtonText}>Foodpanda</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: tokens.colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    fontSize: 16,
    color: tokens.colors.textSecondary
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.lg
  },
  listContent: {
    paddingBottom: tokens.spacing.xxl
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.xl
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primaryTint,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  secondaryButtonIcon: {
    fontSize: 14,
    marginRight: tokens.spacing.sm
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.primary
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  emptyText: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xxl
  }
});
