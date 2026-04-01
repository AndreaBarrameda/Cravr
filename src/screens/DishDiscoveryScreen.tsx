import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Image,
  Linking
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
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
  hero_photo_url?: string;
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
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

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
              data.results.map((item: RestaurantResult) => [item.restaurant_id, item])
            ).values()
          ) as RestaurantResult[];
          setRestaurants(uniqueRestaurants);
        }
      } catch (e) {
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={tokens.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No restaurants found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your preferences to find more options
          </Text>
          <CravrButton label="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const featured = restaurants[0];
  const others = restaurants.slice(1);

  const sortedOthers = [...others].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonRow}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={tokens.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{featured.restaurant_name}</Text>
          <TouchableOpacity>
            <Ionicons name="flag" size={20} color={tokens.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['distance', 'price', 'rating'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                sortBy === tab && styles.filterTabActive
              ]}
              onPress={() => setSortBy(tab)}
            >
              <Text style={[
                styles.filterTabText,
                sortBy === tab && styles.filterTabTextActive
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.filterTab}>
            <Ionicons name="chevron-forward" size={16} color={tokens.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredImageContainer}>
            {featured.hero_photo_url ? (
              <Image
                source={{ uri: featured.hero_photo_url }}
                style={styles.featuredImage}
              />
            ) : (
              <View style={[styles.featuredImage, styles.imagePlaceholder]}>
                <Ionicons name="restaurant-outline" size={48} color={tokens.colors.primary} />
              </View>
            )}

            {/* Match Badge */}
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>
                {Math.round(featured.match_score * 100)}% Match
              </Text>
            </View>

            {/* Overlay Content */}
            <View style={styles.cardOverlay}>
              <Text style={styles.dishName}>{featured.name}</Text>
              <Text style={styles.dishDescription} numberOfLines={3}>
                {featured.description || featured.match_reason}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => {
              const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(featured.restaurant_name)}`;
              Linking.openURL(searchUrl);
            }}
          >
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* Other Top Cravings */}
        {others.length > 0 && (
          <View style={styles.otherCravingsSection}>
            <Text style={styles.sectionTitle}>Other Top Cravings</Text>

            {sortedOthers.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.restaurant_id}
                style={styles.cravingCard}
                onPress={() => {
                  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(restaurant.restaurant_name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <View style={styles.cravingImageContainer}>
                  {restaurant.hero_photo_url ? (
                    <Image
                      source={{ uri: restaurant.hero_photo_url }}
                      style={styles.cravingImage}
                    />
                  ) : (
                    <View style={[styles.cravingImage, styles.imagePlaceholder]}>
                      <Ionicons name="restaurant-outline" size={32} color={tokens.colors.primary} />
                    </View>
                  )}

                  {/* Match Badge */}
                  <View style={styles.cravingMatchBadge}>
                    <Text style={styles.cravingMatchText}>
                      {Math.round(restaurant.match_score * 100)}% MATCH
                    </Text>
                  </View>
                </View>

                <View style={styles.cravingContent}>
                  <Text style={styles.cravingName}>{restaurant.name}</Text>
                  <Text style={styles.cravingRestaurant} numberOfLines={1}>
                    {restaurant.restaurant_name}
                  </Text>
                  <View style={styles.cravingMeta}>
                    <Text style={styles.cravingRating}>
                      ★ {restaurant.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.cravingPrice}>
                      {'$'.repeat(Math.ceil(restaurant.price / 10) || 1)}
                    </Text>
                  </View>
                  <Text style={styles.cravingDescription} numberOfLines={2}>
                    {restaurant.description || restaurant.match_reason}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: tokens.spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  backButtonRow: {
    padding: tokens.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  backText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.primary,
    marginLeft: tokens.spacing.sm,
  },
  headerTitle: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: tokens.typography.h4.fontWeight,
    color: tokens.colors.textHeading,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.md,
  },
  emptyText: {
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xxl,
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  filterTab: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  filterTabActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  filterTabText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  filterTabTextActive: {
    color: tokens.colors.textInverse,
  },
  featuredCard: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadows.lg,
  },
  featuredImageContainer: {
    position: 'relative',
    height: 320,
    width: '100%',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.primaryTint,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: tokens.spacing.lg,
    right: tokens.spacing.lg,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
  },
  matchText: {
    fontSize: tokens.typography.smallBold.fontSize,
    fontWeight: tokens.typography.smallBold.fontWeight,
    color: tokens.colors.textInverse,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  dishName: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: tokens.typography.h4.fontWeight,
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.sm,
  },
  dishDescription: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '400',
    color: tokens.colors.textInverse,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bookNowButton: {
    marginHorizontal: tokens.spacing.lg,
    marginVertical: tokens.spacing.lg,
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
  },
  bookNowText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.textInverse,
  },
  otherCravingsSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.lg,
  },
  cravingCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.lg,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  cravingImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  cravingImage: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.primaryTint,
  },
  cravingMatchBadge: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
  },
  cravingMatchText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textInverse,
  },
  cravingContent: {
    flex: 1,
    padding: tokens.spacing.lg,
    justifyContent: 'space-between',
  },
  cravingName: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.xs,
  },
  cravingRestaurant: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.sm,
  },
  cravingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  cravingRating: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  metaDot: {
    fontSize: tokens.typography.caption.fontSize,
    color: tokens.colors.textTertiary,
  },
  cravingPrice: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  cravingDescription: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
    lineHeight: 14,
  },
});
