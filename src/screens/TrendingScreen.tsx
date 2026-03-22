import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList, TrendingStackParamList } from '../../App';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/useTheme';
import { PostCard } from '../components/PostCard';
import { ReviewCard } from '../components/ReviewCard';
import { getAuth } from 'firebase/auth';
import { getFirestore, collectionGroup, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { tokens } from '../theme/tokens';
import type { FoodPost, FoodReview } from '../services/firebaseClient';
import { WeatherWidget } from '../components/WeatherWidget';

type Props = NativeStackScreenProps<TrendingStackParamList, 'TrendingHome'>;

type TrendingRestaurant = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  rating: number;
  price_level: number;
  michelin_stars?: number;
  michelin_designation?: 'plate' | 'bibGourmand' | '1-star' | '2-star' | '3-star';
  michelin_label?: string;
  distance_meters?: number;
  vibe_tags?: string[];
};

type MichelinRestaurant = {
  name: string;
  designation: 'plate' | 'bibGourmand';
  cuisine?: string;
  price_level?: number;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const getMichelinBadge = (designation?: string, label?: string) => {
  if (!designation) return null;

  let icon = '';
  let color = tokens.colors.textTertiary;

  switch (designation) {
    case 'bibGourmand':
      icon = '🤤 Bib Gourmand';
      color = tokens.colors.primary;
      break;
    case 'plate':
      icon = '🍽️ Michelin Selection';
      color = tokens.colors.textSecondary;
      break;
    case '1-star':
      icon = '⭐ Michelin ★';
      color = tokens.colors.primary;
      break;
    case '2-star':
      icon = '⭐⭐ Michelin ★★';
      color = '#FFA500';
      break;
    case '3-star':
      icon = '⭐⭐⭐ Michelin ★★★';
      color = '#FFD700';
      break;
    default:
      return null;
  }

  return { icon, color };
};

export function TrendingScreen({ navigation }: Props) {
  const { state } = useAppState();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [allRestaurants, setAllRestaurants] = useState<TrendingRestaurant[]>([]);
  const [michelinGuide, setMichelinGuide] = useState<{ bib_gourmand: MichelinRestaurant[]; michelin_selection: MichelinRestaurant[] }>({ bib_gourmand: [], michelin_selection: [] });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [liveFeed, setLiveFeed] = useState<(FoodPost | FoodReview)[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'newest' | 'garden' | 'city-view' | 'all'>('all');

  // Load trending restaurants and data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const searchLoc = state.searchLocation || state.location;
        const location = searchLoc
          ? { lat: searchLoc.latitude, lng: searchLoc.longitude }
          : { lat: 10.3157, lng: 123.8854 };

        // Fetch Michelin Guide (fast, no timeout needed)
        const michelinData = await api.getMichelinGuide();
        // eslint-disable-next-line no-console
        console.log('🏆 Michelin data loaded:', michelinData.total, 'restaurants');
        setMichelinGuide(michelinData);

        // Create a timeout promise for trending (5 seconds)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );

        const data = await Promise.race([
          api.getTrendingRestaurants({
            lat: location.lat,
            lng: location.lng,
            limit: 15
          }),
          timeoutPromise
        ]);

        // eslint-disable-next-line no-console
        console.log('🔥 Trending data loaded:', data.results?.length, 'restaurants');

        setAllRestaurants(data.results?.slice(0, 15) || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch data:', e);
        // Show empty state instead of error
        setAllRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state.location, state.searchLocation]);

  // Load live feed (posts and reviews from all users)
  useFocusEffect(
    React.useCallback(() => {
      const loadLiveFeed = async () => {
        try {
          setLoadingFeed(true);
          const db = getFirestore();

          // Query all posts from all users using collectionGroup
          let posts: (FoodPost & { id: string })[] = [];
          let reviews: (FoodReview & { id: string })[] = [];

          try {
            // Try with orderBy first
            const postsQuery = query(
              collectionGroup(db, 'posts'),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            const postsSnapshot = await getDocs(postsQuery);
            posts = postsSnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id
            })) as (FoodPost & { id: string })[];
            // eslint-disable-next-line no-console
            console.log('📝 Loaded posts with orderBy:', posts.length);
          } catch (postError: any) {
            // eslint-disable-next-line no-console
            console.warn('OrderBy not available, trying without:', postError.message);
            try {
              // Fallback: query without orderBy
              const postsSnapshot = await getDocs(collectionGroup(db, 'posts'));
              posts = postsSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
              })) as (FoodPost & { id: string })[];
              // eslint-disable-next-line no-console
              console.log('📝 Loaded posts without orderBy:', posts.length);
            } catch (fallbackError) {
              // eslint-disable-next-line no-console
              console.error('Failed to load posts:', fallbackError);
            }
          }

          try {
            // Try with orderBy first
            const reviewsQuery = query(
              collectionGroup(db, 'reviews'),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            reviews = reviewsSnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id
            })) as (FoodReview & { id: string })[];
            // eslint-disable-next-line no-console
            console.log('⭐ Loaded reviews with orderBy:', reviews.length);
          } catch (reviewError: any) {
            // eslint-disable-next-line no-console
            console.warn('OrderBy not available, trying without:', reviewError.message);
            try {
              // Fallback: query without orderBy
              const reviewsSnapshot = await getDocs(collectionGroup(db, 'reviews'));
              reviews = reviewsSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
              })) as (FoodReview & { id: string })[];
              // eslint-disable-next-line no-console
              console.log('⭐ Loaded reviews without orderBy:', reviews.length);
            } catch (fallbackError) {
              // eslint-disable-next-line no-console
              console.error('Failed to load reviews:', fallbackError);
            }
          }

          // Merge and sort by timestamp
          const combined = [...posts, ...reviews].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

          // eslint-disable-next-line no-console
          console.log('🔥 Combined feed items:', combined.length);
          setLiveFeed(combined.slice(0, 30));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to load live feed:', e);
          setLiveFeed([]);
        } finally {
          setLoadingFeed(false);
        }
      };

      loadLiveFeed();
    }, [])
  );

  // Filter restaurants based on selected category
  const filterRestaurantsByCategory = (restaurants: TrendingRestaurant[]) => {
    if (selectedCategory === 'all') return restaurants;
    if (selectedCategory === 'newest') return restaurants.slice(0, 8); // Assume first results are newest
    if (selectedCategory === 'garden') {
      const filtered = restaurants.filter((r) =>
        r.vibe_tags?.some((tag) => tag.toLowerCase().includes('garden') || tag.toLowerCase().includes('outdoor'))
      );
      return filtered.length > 0 ? filtered : restaurants; // Show all if no garden matches
    }
    if (selectedCategory === 'city-view') {
      const filtered = restaurants.filter((r) =>
        r.vibe_tags?.some((tag) => tag.toLowerCase().includes('view') || tag.toLowerCase().includes('city') || tag.toLowerCase().includes('rooftop'))
      );
      return filtered.length > 0 ? filtered : restaurants; // Show all if no view matches
    }
    return restaurants;
  };

  // Organize restaurants by category
  const michelinRestaurants = allRestaurants.filter((r) => r.michelin_designation);
  const topRatedRestaurants = [...allRestaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  const trendingRestaurants = filterRestaurantsByCategory(allRestaurants).slice(0, 8);

  const renderCarouselCard = ({ item }: { item: TrendingRestaurant }) => (
    <TouchableOpacity
      style={styles.carouselCard}
      onPress={() => {
        navigation.navigate('RestaurantDetail' as any, {
          restaurantId: item.restaurant_id,
          cravingId: 'trending',
          cuisine: ''
        });
      }}
      activeOpacity={0.9}
    >
      {item.hero_photo_url && (
        <Image
          source={{ uri: item.hero_photo_url }}
          style={styles.carouselImage}
        />
      )}
      <View style={styles.carouselOverlay}>
        <View style={styles.carouselContent}>
          <Text style={styles.carouselName}>{item.name}</Text>
          <Text style={styles.carouselMeta}>
            {item.rating.toFixed(1)} ★ • {'$'.repeat(item.price_level || 1)}
          </Text>
          {item.michelin_designation && getMichelinBadge(item.michelin_designation) ? (
            <View
              style={[
                styles.carouselMichelinBadge,
                { backgroundColor: getMichelinBadge(item.michelin_designation)?.color }
              ]}
            >
              <Text style={styles.carouselMichelinText}>
                {getMichelinBadge(item.michelin_designation)?.icon}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSmallCard = ({ item }: { item: TrendingRestaurant }) => (
    <TouchableOpacity
      style={styles.smallCard}
      onPress={() => {
        navigation.navigate('RestaurantDetail' as any, {
          restaurantId: item.restaurant_id,
          cravingId: 'trending',
          cuisine: ''
        });
      }}
    >
      <View style={styles.smallCardContent}>
        <View>
          <Text style={styles.smallCardName}>{item.name}</Text>
          <Text style={styles.smallCardMeta}>
            {item.rating.toFixed(1)} ★ •{'$'.repeat(item.price_level || 1)}
            {item.distance_meters && (
              <>
                {' '}
                • {item.distance_meters > 1000
                  ? `${(item.distance_meters / 1000).toFixed(1)}km`
                  : `${item.distance_meters}m`}
              </>
            )}
          </Text>
        </View>
        {item.michelin_designation && getMichelinBadge(item.michelin_designation) ? (
          <View
            style={[
              styles.smallMichelinBadge,
              { backgroundColor: getMichelinBadge(item.michelin_designation)?.color }
            ]}
          >
            <Text style={styles.smallMichelinText}>
              {getMichelinBadge(item.michelin_designation)?.icon}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.primary} size="large" />
          <Text style={styles.loadingText}>Discovering trending spots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>🔥 What's Trending</Text>
              <Text style={styles.subtitle}>
                In {state.searchLocation?.address?.split(',')[0] || 'Cebu'} right now
              </Text>
            </View>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'newest' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('newest')}
          >
            <Text style={[styles.categoryLabel, selectedCategory === 'newest' && styles.categoryLabelActive]}>
              ✨ Newest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'garden' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('garden')}
          >
            <Text style={[styles.categoryLabel, selectedCategory === 'garden' && styles.categoryLabelActive]}>
              🌿 Garden
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'city-view' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('city-view')}
          >
            <Text style={[styles.categoryLabel, selectedCategory === 'city-view' && styles.categoryLabelActive]}>
              🏙️ City View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'all' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryLabel, selectedCategory === 'all' && styles.categoryLabelActive]}>
              All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weather Widget */}
        <WeatherWidget />

        {/* Michelin Guide Section */}
        {(michelinGuide.bib_gourmand.length > 0 || michelinGuide.michelin_selection.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MICHELIN GUIDE</Text>

            {michelinGuide.bib_gourmand.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>🤤 Bib Gourmand</Text>
                {michelinGuide.bib_gourmand.map((restaurant) => (
                  <View key={restaurant.name} style={styles.michelinCard}>
                    <View style={styles.michelinCardContent}>
                      <View>
                        <Text style={styles.michelinCardName}>{restaurant.name}</Text>
                        <Text style={styles.michelinCardMeta}>
                          {restaurant.cuisine} • {'$'.repeat(restaurant.price_level || 1)}
                        </Text>
                      </View>
                      <View style={[styles.michelinBadge, { backgroundColor: '#FF6A2A' }]}>
                        <Text style={styles.michelinBadgeText}>🤤</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {michelinGuide.michelin_selection.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>🍽️ Michelin Selection</Text>
                {michelinGuide.michelin_selection.map((restaurant) => (
                  <View key={restaurant.name} style={styles.michelinCard}>
                    <View style={styles.michelinCardContent}>
                      <View>
                        <Text style={styles.michelinCardName}>{restaurant.name}</Text>
                        <Text style={styles.michelinCardMeta}>
                          {restaurant.cuisine} • {'$'.repeat(restaurant.price_level || 1)}
                        </Text>
                      </View>
                      <View style={[styles.michelinBadge, { backgroundColor: '#6B6B6B' }]}>
                        <Text style={styles.michelinBadgeText}>🍽️</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Carousel Section */}
        {trendingRestaurants.length > 0 && (
          <View style={styles.carouselSection}>
            <FlatList
              horizontal
              data={trendingRestaurants}
              keyExtractor={(item) => item.restaurant_id}
              renderItem={renderCarouselCard}
              snapToInterval={CARD_WIDTH + 20}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / (CARD_WIDTH + 20)
                );
                setCarouselIndex(index);
              }}
            />
            {/* Carousel Dots */}
            <View style={styles.dotsContainer}>
              {trendingRestaurants.slice(0, 5).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === carouselIndex % trendingRestaurants.length &&
                      styles.dotActive
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Michelin Restaurants Section */}
        {selectedCategory === 'all' && michelinRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MICHELIN HONORED</Text>
            {michelinRestaurants.slice(0, 5).map((restaurant) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* Top Rated Section */}
        {selectedCategory === 'all' && topRatedRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TOP RATED</Text>
            {topRatedRestaurants.map((restaurant, idx) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* Category Results Section */}
        {selectedCategory !== 'all' && trendingRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'newest' && '✨ NEWEST'}
              {selectedCategory === 'garden' && '🌿 GARDEN SETTING'}
              {selectedCategory === 'city-view' && '🏙️ CITY VIEWS'}
            </Text>
            {trendingRestaurants.map((restaurant) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* Live Feed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIVE FEED</Text>
          {loadingFeed ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={tokens.colors.primary} size="small" />
            </View>
          ) : liveFeed.length === 0 ? (
            <View style={styles.emptyFeedContainer}>
              <Text style={[styles.emptyFeedEmoji]}>🍽️</Text>
              <Text style={[styles.emptyFeedText, { color: theme.colors.textPrimary }]}>No posts yet</Text>
              <Text style={[styles.emptyFeedSubtext, { color: theme.colors.textSecondary }]}>
                Be the first to share your food experience!
              </Text>
            </View>
          ) : (
            liveFeed.map((item) => {
              if ('emoji' in item && 'text' in item) {
                // It's a post
                const post = item as FoodPost & { id: string };
                return (
                  <View key={post.id} style={styles.feedItem}>
                    <PostCard
                      emoji={post.emoji}
                      text={post.text}
                      restaurantName={post.restaurantName}
                      createdAt={post.createdAt}
                    />
                  </View>
                );
              } else {
                // It's a review
                const review = item as FoodReview & { id: string };
                return (
                  <View key={review.id} style={styles.feedItem}>
                    <ReviewCard
                      restaurantName={review.restaurantName}
                      rating={review.rating}
                      text={review.text}
                      createdAt={review.createdAt}
                    />
                  </View>
                );
              }
            })
          )}
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
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.xl,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm
  },
  categoryPill: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  categoryPillActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary
  },
  categoryLabelActive: {
    color: tokens.colors.textInverse
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    fontSize: 14,
    color: tokens.colors.textSecondary
  },
  header: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xxl
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.textSecondary
  },
  carouselSection: {
    marginBottom: tokens.spacing.xxxl
  },
  carouselContent: {
    paddingHorizontal: tokens.spacing.xl,
    gap: tokens.spacing.xl
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.lg
  },
  carouselImage: {
    width: '100%',
    height: '100%'
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xxl
  },
  carouselContentGap: {
    gap: tokens.spacing.md
  },
  carouselName: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  carouselMeta: {
    fontSize: 14,
    color: tokens.colors.textInverse,
    fontWeight: '500'
  },
  carouselMichelinBadge: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    alignSelf: 'flex-start'
  },
  carouselMichelinText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.border
  },
  dotActive: {
    backgroundColor: tokens.colors.primary,
    width: 24
  },
  section: {
    paddingHorizontal: tokens.spacing.xl,
    marginBottom: tokens.spacing.xxxl
  },
  sectionTitle: {
    ...tokens.typography.label,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.lg
  },
  smallCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  smallCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  smallCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs
  },
  smallCardMeta: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    fontWeight: '500'
  },
  smallMichelinBadge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.sm
  },
  smallMichelinText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.primary,
    marginBottom: tokens.spacing.md,
    marginTop: tokens.spacing.lg
  },
  michelinCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  michelinCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  michelinCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs
  },
  michelinCardMeta: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    fontWeight: '500'
  },
  michelinBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  michelinBadgeText: {
    fontSize: 20
  },
  feedItem: {
    marginBottom: tokens.spacing.md
  },
  emptyFeedContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxxl
  },
  emptyFeedEmoji: {
    fontSize: 48,
    marginBottom: tokens.spacing.lg
  },
  emptyFeedText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: tokens.spacing.sm
  },
  emptyFeedSubtext: {
    fontSize: 14,
    textAlign: 'center'
  }
});
