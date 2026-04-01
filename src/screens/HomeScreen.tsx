import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverStackParamList, RootStackParamList } from '../../App';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';
import { SettingsMenu } from '../components/SettingsMenu';
import { buildTasteProfileInput } from '../utils/tasteProfile';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'DiscoverHome'>;

interface Restaurant {
  restaurant_id: string;
  name: string;
  hero_photo_url?: string;
  rating: number;
  price_level: number;
  distance_meters: number;
  cuisine?: string;
  match_reason?: string;
}

const { width } = Dimensions.get('window');
const DAILY_CARD_WIDTH = width - (tokens.spacing.lg * 2) - 28;

export function HomeScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { state, setState } = useAppState();
  const activeLocation = state.searchLocation || state.location;
  const isUsingSearchLocation = Boolean(state.searchLocation);

  useEffect(() => {
    console.log('HomeScreen mounted, loading recommendations...');
    loadRecommendations();
  }, [state.location, state.searchLocation]);

  useEffect(() => {
    console.log('Restaurants loaded:', restaurants.length);
  }, [restaurants]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const searchLoc = state.searchLocation || state.location;

      // Use fallback coordinates if no location set yet (user hasn't granted permission or context not ready)
      const lat = searchLoc?.latitude ?? 10.3157;
      const lng = searchLoc?.longitude ?? 123.8854;

      // For trending recommendations, use getTrendingRestaurants instead
      const result = await api.getTrendingRestaurants({
        lat,
        lng,
        taste_profile_input: buildTasteProfileInput(state),
        limit: 10,
        category: 'all',
      });

      // API returns { results: [...], discovery_session_id: '...' }
      if (result?.results && result.results.length > 0) {
        setRestaurants(result.results);
      } else {
        throw new Error('No restaurants returned');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback mock data when backend is not available
      const mockRestaurants: Restaurant[] = [
        {
          restaurant_id: '1',
          name: 'Creamy Truffle Pasta',
          hero_photo_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&h=400&fit=crop&q=80',
          rating: 4.9,
          price_level: 3,
          distance_meters: 800,
          cuisine: 'Italian',
        },
        {
          restaurant_id: '2',
          name: 'Smoked Wagyu Sliders',
          hero_photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop&q=80',
          rating: 4.7,
          price_level: 2,
          distance_meters: 1200,
          cuisine: 'American',
        },
        {
          restaurant_id: '3',
          name: 'West Village Healthy Eats',
          hero_photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop&q=80',
          rating: 4.8,
          price_level: 2,
          distance_meters: 500,
          cuisine: 'Health',
        },
        {
          restaurant_id: '4',
          name: 'Orizuru Ramen',
          hero_photo_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=400&fit=crop&q=80',
          rating: 4.6,
          price_level: 2,
          distance_meters: 950,
          cuisine: 'Japanese',
        },
        {
          restaurant_id: '5',
          name: 'Via Roma 14',
          hero_photo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=400&fit=crop&q=80',
          rating: 4.5,
          price_level: 3,
          distance_meters: 1500,
          cuisine: 'Italian',
        },
        {
          restaurant_id: '6',
          name: 'Umami Omakase',
          hero_photo_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&h=400&fit=crop&q=80',
          rating: 4.9,
          price_level: 4,
          distance_meters: 2000,
          cuisine: 'Sushi',
        },
      ];
      setRestaurants(mockRestaurants);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('Search triggered with text:', searchText);
    if (!searchText.trim()) {
      console.log('Search text is empty');
      return;
    }
    try {
      setLoading(true);
      const searchLoc = state.searchLocation || state.location;
      const location = searchLoc
        ? { lat: searchLoc.latitude, lng: searchLoc.longitude }
        : undefined;

      console.log('Calling API with location:', location);

      // Track search in user preferences
      setState((prev) => ({
        ...prev,
        searchHistory: [...(prev.searchHistory || []), searchText.trim()],
      }));

      try {
        const result = await api.resolveCraving(searchText.trim(), location);
        console.log('API result:', result);
        setState((prev) => ({
          ...prev,
          craving: {
            craving_id: result.craving_id,
            normalized: result.normalized,
            tags: result.tags ?? [],
            suggested_cuisines: result.suggested_cuisines ?? []
          }
        }));
      } catch (apiError) {
        console.error('Backend API failed, using fallback craving data:', apiError);
        // Fallback: Create a craving from the search text even if backend fails
        setState((prev) => ({
          ...prev,
          craving: {
            craving_id: `crav_${Date.now()}`,
            normalized: searchText.trim().toLowerCase(),
            tags: [searchText.trim().toLowerCase()],
            suggested_cuisines: []
          }
        }));
      }

      console.log('Navigating to SplashCraving');
      // Navigate to the discover/cuisine selection flow
      navigation.navigate('SplashCraving' as any);
    } catch (error) {
      console.error('Error in search:', error);
      alert('Search error: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (restaurant: Restaurant) => {
    // Navigate to RestaurantDetail
    navigation.navigate('RestaurantDetail' as any, {
      restaurantId: restaurant.restaurant_id,
      cravingId: 'discovery',
      cuisine: restaurant.cuisine || 'all',
    });
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleResetLocation = () => {
    setState((prev) => ({
      ...prev,
      searchLocation: undefined
    }));
  };

  const renderFeaturedCard = (restaurant: Restaurant, compact = false) => (
    <View style={[styles.featuredCard, compact && styles.carouselCard]}>
      <View style={styles.featuredImageContainer}>
        {restaurant.hero_photo_url ? (
          <Image
            source={{ uri: restaurant.hero_photo_url }}
            style={styles.featuredImage}
          />
        ) : (
          <View style={[styles.featuredImage, styles.imagePlaceholder]}>
            <Ionicons name="restaurant-outline" size={48} color={tokens.colors.primary} />
          </View>
        )}
        <TouchableOpacity style={styles.bookmarkIcon}>
          <Ionicons
            name="bookmark-outline"
            size={24}
            color={tokens.colors.textInverse}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle}>{restaurant.name}</Text>

        <View style={styles.cuisineRow}>
          <Text style={styles.cuisineText}>{restaurant.cuisine || 'Cuisine'}</Text>
          <Text style={styles.locationDot}>•</Text>
          <Text style={styles.cuisineText}>
            {formatDistance(restaurant.distance_meters)}
          </Text>
        </View>

        {restaurant.match_reason ? (
          <Text style={styles.recommendationReason} numberOfLines={2}>
            {restaurant.match_reason}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={tokens.colors.primary} />
            <Text style={styles.ratingText}>
              {restaurant.rating.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.priceLevel}>
            {'$'.repeat(restaurant.price_level)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={() => handleBookNow(restaurant)}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSecondaryCard = (restaurant: Restaurant) => (
    <TouchableOpacity
      style={styles.secondaryCard}
      onPress={() => handleBookNow(restaurant)}
    >
      {restaurant.hero_photo_url ? (
        <Image
          source={{ uri: restaurant.hero_photo_url }}
          style={styles.secondaryImage}
        />
      ) : (
        <View style={[styles.secondaryImage, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={24} color={tokens.colors.primary} />
        </View>
      )}

      <View style={styles.secondaryContent}>
        <Text style={styles.secondaryTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.secondaryMeta}>
          <Ionicons name="star" size={12} color={tokens.colors.primary} />
          <Text style={styles.secondaryRating}>
            {restaurant.rating.toFixed(1)}
          </Text>
          <Text style={styles.secondaryPrice}>
            {'$'.repeat(restaurant.price_level)}
          </Text>
        </View>
      </View>

      <Text style={styles.detailsLink}>Details</Text>
    </TouchableOpacity>
  );

  const renderCollectionCard = (restaurant: Restaurant, index: number) => (
    <TouchableOpacity key={restaurant.restaurant_id} style={styles.collectionCard} onPress={() => handleBookNow(restaurant)}>
      {restaurant.hero_photo_url ? (
        <Image
          source={{ uri: restaurant.hero_photo_url }}
          style={styles.collectionImage}
        />
      ) : (
        <View style={[styles.collectionImage, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={32} color={tokens.colors.primary} />
        </View>
      )}
      <Text style={styles.collectionName}>{restaurant.name}</Text>
      <Text style={styles.collectionMeta}>
        {index + 1} Place • {formatDistance(restaurant.distance_meters)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuIcon} onPress={() => setSettingsVisible(true)}>
            <Ionicons
              name="menu"
              size={24}
              color={tokens.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.logo}>CRAVR</Text>
          <TouchableOpacity style={styles.profileIcon} onPress={() => rootNavigation.navigate('Profile')}>
            <Ionicons
              name="person-circle"
              size={28}
              color={tokens.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar with Button */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={18}
              color={tokens.colors.textTertiary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="What are you craving?"
              placeholderTextColor={tokens.colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Ionicons
                name="add"
                size={20}
                color={tokens.colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locationScopeSection}>
          <View style={styles.locationScopeCopy}>
            <Text style={styles.locationScopeLabel}>
              {isUsingSearchLocation ? 'Browsing near selected location' : 'Browsing near your current location'}
            </Text>
            <Text style={styles.locationScopeValue} numberOfLines={1}>
              {activeLocation?.address || 'Cebu, Philippines'}
            </Text>
          </View>
          {isUsingSearchLocation && (
            <TouchableOpacity style={styles.locationResetButton} onPress={handleResetLocation}>
              <Text style={styles.locationResetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Featured Match Card - Show loading or content */}
        {restaurants.length > 0 && (
              <View style={styles.featuredMatchSection}>
                <View style={styles.featuredMatchCard}>
                  <View style={styles.featuredImageContainer}>
                    {restaurants[0].hero_photo_url ? (
                      <Image
                        source={{ uri: restaurants[0].hero_photo_url }}
                        style={styles.featuredImage}
                      />
                    ) : (
                      <View style={[styles.featuredImage, styles.imagePlaceholder]}>
                        <Ionicons name="restaurant-outline" size={48} color={tokens.colors.primary} />
                      </View>
                    )}

                    {/* Match Badge */}
                    <View style={styles.featuredBadge}>
                      <Ionicons name="heart" size={14} color={tokens.colors.primary} />
                      <Text style={styles.featuredBadgeText}>96% MATCH FOR YOU</Text>
                    </View>

                    {/* Overlay */}
                    <View style={styles.featuredOverlay}>
                      <Text style={styles.featuredDishName}>{restaurants[0].name}</Text>
                      <View style={styles.featuredMeta}>
                        <Text style={styles.featuredCuisine}>{restaurants[0].cuisine}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.featuredLocation}>
                          {formatDistance(restaurants[0].distance_meters)}
                        </Text>
                      </View>
                      <View style={styles.featuredRating}>
                        <Ionicons name="star" size={14} color={tokens.colors.primary} />
                        <Text style={styles.featuredRatingText}>
                          {restaurants[0].rating.toFixed(1)} (124 reviews)
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleBookNow(restaurants[0])}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Daily Recommendations Section */}
            {restaurants.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Daily Recommendations</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllLink}>See All</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={restaurants.slice(0, 6)}
                  horizontal
                  pagingEnabled={false}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  snapToInterval={DAILY_CARD_WIDTH + tokens.spacing.lg}
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.restaurant_id}
                  renderItem={({ item }) => renderFeaturedCard(item, true)}
                  contentContainerStyle={styles.dailyCarouselContent}
                  ItemSeparatorComponent={() => <View style={{ width: tokens.spacing.lg }} />}
                />
              </View>
            )}

            {/* Trending Collections Section */}
            {restaurants.length > 2 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending Collections</Text>
                  <Text style={styles.curatedLabel}>CURATED</Text>
                </View>

                <View style={styles.collectionGrid}>
                  {restaurants.slice(2, 6).map((restaurant, index) =>
                    renderCollectionCard(restaurant, index)
                  )}
                </View>

                <TouchableOpacity style={styles.browseMoreButton}>
                  <View style={styles.browseLabelContainer}>
                    <Text style={styles.browseLabel}>
                      {restaurants[2]?.name}
                    </Text>
                    <Text style={styles.browseDistance}>
                      {restaurants[2] && formatDistance(restaurants[2].distance_meters)}{' '}
                      away
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={tokens.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

        <View style={{ height: tokens.spacing.xxxl }} />
      </ScrollView>
      <SettingsMenu
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onLogout={() => {
          setSettingsVisible(false);
          rootNavigation.navigate('Login');
        }}
        onNavigateOnboarding={() => {
          setState((prev) => ({
            ...prev,
            onboardingComplete: false
          }));
          setSettingsVisible(false);
          rootNavigation.navigate('OnboardingWelcome');
        }}
      />
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
  menuIcon: {
    padding: tokens.spacing.sm,
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  profileIcon: {
    padding: tokens.spacing.sm,
  },
  searchSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  locationScopeSection: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  locationScopeCopy: {
    flex: 1,
  },
  locationScopeLabel: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '700',
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: tokens.spacing.xs,
    letterSpacing: 0.4,
  },
  locationScopeValue: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  locationResetButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.primaryTint,
  },
  locationResetText: {
    color: tokens.colors.primary,
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.textPrimary,
  },
  searchButton: {
    backgroundColor: tokens.colors.primary,
    width: 40,
    height: 40,
    borderRadius: tokens.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredMatchSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  featuredMatchCard: {
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadows.lg,
  },
  featuredCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadows.md,
  },
  carouselCard: {
    width: DAILY_CARD_WIDTH,
  },
  featuredImageContainer: {
    position: 'relative',
    height: 260,
    width: '100%',
    backgroundColor: '#1a1a1a',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: tokens.spacing.lg,
    left: tokens.spacing.lg,
    backgroundColor: tokens.colors.primaryTint,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    gap: tokens.spacing.xs,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primary,
    textTransform: 'uppercase',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: tokens.spacing.lg,
  },
  featuredDishName: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: '700',
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.xs,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  featuredCuisine: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textInverse,
  },
  metaDot: {
    color: tokens.colors.textInverse,
    fontSize: 12,
  },
  featuredLocation: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '400',
    color: tokens.colors.textInverse,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  featuredRatingText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textInverse,
  },
  viewButton: {
    backgroundColor: tokens.colors.primary,
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.textInverse,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    color: tokens.colors.textHeading,
  },
  seeAllLink: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  curatedLabel: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.label.fontWeight,
    color: tokens.colors.textTertiary,
    letterSpacing: 0.5,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIcon: {
    position: 'absolute',
    top: tokens.spacing.lg,
    right: tokens.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 40,
    height: 40,
    borderRadius: tokens.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: tokens.spacing.lg,
  },
  featuredTitle: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: tokens.typography.h4.fontWeight,
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.sm,
  },
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  cuisineText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  recommendationReason: {
    fontSize: tokens.typography.small.fontSize,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.md,
    lineHeight: 18,
  },
  locationDot: {
    color: tokens.colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  ratingText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  priceLevel: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  bookNowButton: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  bookNowText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.textInverse,
  },
  dailyCarouselContent: {
    paddingRight: tokens.spacing.xl,
  },
  // Secondary Cards
  secondaryCardsContainer: {
    gap: tokens.spacing.lg,
  },
  secondaryCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  secondaryImage: {
    width: 60,
    height: 60,
    borderRadius: tokens.radius.md,
    marginRight: tokens.spacing.lg,
    backgroundColor: tokens.colors.primaryTint,
  },
  secondaryContent: {
    flex: 1,
  },
  secondaryTitle: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.xs,
  },
  secondaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  secondaryRating: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  secondaryPrice: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  detailsLink: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
    paddingLeft: tokens.spacing.lg,
  },
  // Collection Grid
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  collectionCard: {
    width: '48%',
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  collectionImage: {
    width: '100%',
    height: 120,
    backgroundColor: tokens.colors.primaryTint,
  },
  collectionName: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
    color: tokens.colors.textHeading,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  collectionMeta: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
  },
  browseMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.lg,
  },
  browseLabelContainer: {
    flex: 1,
  },
  browseLabel: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.xs,
  },
  browseDistance: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
  },
});
