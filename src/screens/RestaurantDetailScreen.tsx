import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { api } from '../api/client';
import { tokens } from '../theme/tokens';
import { saveBookmarkedRestaurant, removeBookmarkedRestaurant, getBookmarkedRestaurants } from '../services/firebaseClient';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'RestaurantDetail'>;

type Dish = {
  dish_id: string;
  name: string;
  description: string;
  photo_url: string | null;
  restaurant_photo_url?: string | null;
  photo_source?: 'dish' | 'restaurant' | 'none';
  price: number;
  match_score: number;
};

type RestaurantData = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  rating: number;
  price_level: number;
  address: string;
  phone: string;
  hours: string;
  distance_meters: number;
  vibe_tags: string[];
  latitude?: number;
  longitude?: number;
};

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId, cravingId, cuisine, dishId } = route.params;
  const { state, setState } = useAppState();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lat = state.location?.latitude ?? 34.0522;
        const lng = state.location?.longitude ?? -118.2437;

        // Load bookmark state
        if (state.authUser?.id) {
          const result = await getBookmarkedRestaurants(state.authUser.id);
          const bookmarksList = Array.isArray(result) ? result : (result?.bookmarks || []);
          const isCurrentRestaurantBookmarked = bookmarksList.some((b: any) => b.restaurant_id === restaurantId);
          setIsBookmarked(isCurrentRestaurantBookmarked);
        }

        // Extract place_id from restaurant_id (format: rst_<place_id>)
        const placeId = restaurantId.replace(/^rst_/, '');

        // Load details in background (non-blocking)
        api.getRestaurantDetails(placeId).then((detailsData) => {
          if (detailsData) {
            setRestaurantData(detailsData);
          }
        }).catch(() => {
          // Silently fail - details are optional
        });

        // Fetch dishes
        const dishesData = await api.discoverDishes({
          restaurant_id: restaurantId,
          craving_id: cravingId,
          lat,
          lng
        });

        if (dishesData.results && Array.isArray(dishesData.results)) {
          setDishes(dishesData.results);
          if (dishId) {
            const preSelected = dishesData.results.find((d: Dish) => d.dish_id === dishId);
            if (preSelected) {
              setSelectedDish(preSelected);
            } else if (dishesData.results.length > 0) {
              setSelectedDish(dishesData.results[0]);
            }
          } else if (dishesData.results.length > 0) {
            setSelectedDish(dishesData.results[0]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch restaurant data:', e);
      }
    };

    fetchData();
  }, [restaurantId, cravingId, state.location, dishId, state.authUser?.id]);

  const onContinue = () => {
    if (selectedDish) {
      setState((prev) => ({ ...prev, selectedDishId: selectedDish.dish_id }));
      navigation.navigate('SoloCheck', {
        restaurantId,
        dishId: selectedDish.dish_id,
        cravingId,
        cuisine
      });
    }
  };

  const handleToggleBookmark = async () => {
    if (!state.authUser?.id || !restaurantData) return;

    try {
      if (isBookmarked) {
        await removeBookmarkedRestaurant(state.authUser.id, restaurantId);
        setIsBookmarked(false);
      } else {
        await saveBookmarkedRestaurant(state.authUser.id, {
          restaurant_id: restaurantId,
          name: restaurantData.name,
          rating: restaurantData.rating,
          price_level: restaurantData.price_level,
          distance_meters: restaurantData.distance_meters,
          hero_photo_url: restaurantData.hero_photo_url || undefined
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const sortedDishes = [...dishes].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.match_score - a.match_score;
    return 0;
  });

  const getDishImageUrl = (dish: Dish) => dish.photo_url || dish.restaurant_photo_url || null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={tokens.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {restaurantData?.name || 'Restaurant'}
          </Text>
          <TouchableOpacity onPress={handleToggleBookmark}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={tokens.colors.primary}
            />
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

        {/* Featured Match Card */}
        {selectedDish && (
          <View style={styles.featuredCard}>
            <View style={styles.featuredImageContainer}>
              {getDishImageUrl(selectedDish) ? (
                <Image
                  source={{ uri: getDishImageUrl(selectedDish)! }}
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
                  {Math.round(selectedDish.match_score * 100)}% Match
                </Text>
              </View>

              {/* Overlay Content */}
              <View style={styles.cardOverlay}>
                {selectedDish.photo_source === 'restaurant' && (
                  <View style={styles.sourcePill}>
                    <Text style={styles.sourcePillText}>Restaurant photo</Text>
                  </View>
                )}
                <Text style={styles.dishName}>{selectedDish.name}</Text>
                <Text style={styles.dishDescription} numberOfLines={3}>
                  {selectedDish.description || 'Perfect match for your craving'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={onContinue}
            >
              <Text style={styles.bookNowText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Other Top Cravings Section */}
        {dishes.length > 1 && (
          <View style={styles.otherCravingsSection}>
            <Text style={styles.sectionTitle}>Other Top Cravings</Text>

            {sortedDishes.slice(1, 4).map((dish, index) => (
              <TouchableOpacity
                key={dish.dish_id}
                style={styles.cravingCard}
                onPress={() => setSelectedDish(dish)}
              >
                <View style={styles.cravingImageContainer}>
                  {getDishImageUrl(dish) ? (
                    <Image
                      source={{ uri: getDishImageUrl(dish)! }}
                      style={styles.cravingImage}
                    />
                  ) : (
                    <View style={[styles.cravingImage, styles.imagePlaceholder]}>
                      <Ionicons name="restaurant-outline" size={32} color={tokens.colors.primary} />
                    </View>
                  )}

                  {/* Match Badge for craving card */}
                  <View style={styles.cravingMatchBadge}>
                    <Text style={styles.cravingMatchText}>
                      {Math.round(dish.match_score * 100)}% MATCH
                    </Text>
                  </View>
                </View>

                <View style={styles.cravingContent}>
                  <Text style={styles.restaurantNameSmall}>{restaurantData?.name || 'Restaurant'}</Text>
                  <Text style={styles.cravingName}>{dish.name}</Text>
                  <View style={styles.cravingMeta}>
                    <Text style={styles.cravingRating}>
                      ★ {(Math.random() * 0.5 + 4).toFixed(1)}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.cravingDistance}>
                      {restaurantData?.distance_meters
                        ? restaurantData.distance_meters < 1000
                          ? `${Math.round(restaurantData.distance_meters)} m`
                          : `${(restaurantData.distance_meters / 1000).toFixed(1)} km`
                        : '—'}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.cravingTag}>
                      {['Quick Wait', 'Group Favorite', 'Solo Friendly'][index] || 'Popular'}
                    </Text>
                  </View>
                  <Text style={styles.cravingPrice}>
                    {'$'.repeat(dish.price > 20 ? 3 : dish.price > 10 ? 2 : 1)}
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
  headerTitle: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: tokens.typography.h4.fontWeight,
    color: tokens.colors.textHeading,
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
  sourcePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  sourcePillText: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '700',
    color: tokens.colors.textInverse,
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
    left: tokens.spacing.sm,
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
  restaurantNameSmall: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  cravingName: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
    color: tokens.colors.textHeading,
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
  cravingDistance: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  cravingTag: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  cravingPrice: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
});
