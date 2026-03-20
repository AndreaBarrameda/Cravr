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
  const [selectedFilter, setSelectedFilter] = useState<'nearest' | 'rated' | 'open' | 'budget'>('nearest');

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

  const cravingLabel = craving_text?.split(' ')[0] || 'your craving';

  const filters = [
    { id: 'nearest', icon: '📍', label: 'Nearest' },
    { id: 'rated', icon: '⭐', label: 'Top Rated' },
    { id: 'open', icon: '✓', label: 'Open Now' },
    { id: 'budget', icon: '💰', label: 'Budget' }
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Main Title Section */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Matches for {cravingLabel}</Text>
          <Text style={styles.headerSubtitle}>
            Top picks near you • Based on your craving
          </Text>
        </View>

        {/* Filter Chips */}
        <FlatList
          data={filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(item.id)}
            >
              <Text style={styles.filterIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.id && styles.filterTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterListContent}
        />

        {/* Restaurant List */}
        <View style={styles.restaurantsList}>
          {restaurants.map((item) => (
            <RestaurantCard
              key={item.restaurant_id}
              restaurantName={item.restaurant_name}
              matchScore={item.match_score}
              matchReason={item.match_reason}
              rating={item.rating}
              price={item.price}
              cuisine={cuisine || 'Mixed'}
              description={item.description}
              onPress={() => {
                const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(item.restaurant_name)}`;
                Linking.openURL(searchUrl);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl
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
  headerTop: {
    marginBottom: tokens.spacing.lg
  },
  backButton: {
    paddingVertical: tokens.spacing.sm
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.primary
  },
  header: {
    marginBottom: tokens.spacing.xl
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  headerSubtitle: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    fontWeight: '500'
  },
  filterListContent: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
    paddingRight: tokens.spacing.xl
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  filterChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary
  },
  filterIcon: {
    fontSize: 14
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textSecondary
  },
  filterTextActive: {
    color: tokens.colors.textInverse
  },
  restaurantsList: {
    gap: tokens.spacing.lg
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
