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
import { saveBookmarkedRestaurant, removeBookmarkedRestaurant, getBookmarkedRestaurants } from '../services/firebaseClient';
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
  const [selectedCategory, setSelectedCategory] = useState<'newest' | 'garden' | 'city-view' | 'cozy-cafes' | 'fine-dining' | 'all'>('newest');
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Load trending restaurants based on selected category
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const searchLoc = state.searchLocation || state.location;
        const location = searchLoc
          ? { lat: searchLoc.latitude, lng: searchLoc.longitude }
          : { lat: 10.3157, lng: 123.8854 };

        // Load bookmarked restaurants
        if (state.authUser?.id) {
          const { bookmarks } = await getBookmarkedRestaurants(state.authUser.id);
          const bookmarkedSet = new Set(bookmarks.map((b: any) => b.restaurant_id));
          setBookmarkedIds(bookmarkedSet);
        }

        // Fetch Michelin Guide
        try {
          const michelinData = await api.getMichelinGuide();
          setMichelinGuide(michelinData);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to load Michelin guide:', e);
        }

        // Fetch trending restaurants for selected category
        const data = await api.getTrendingRestaurants({
          lat: location.lat,
          lng: location.lng,
          limit: 15,
          category: selectedCategory as any
        });

        // eslint-disable-next-line no-console
        console.log(`🔥 Loaded ${data.results?.length || 0} restaurants for category: ${selectedCategory}`);
        setAllRestaurants(data.results?.slice(0, 15) || []);
      } catch (e) {
        const errorMsg = (e as any)?.message || String(e);
        // eslint-disable-next-line no-console
        console.error('🔥 Failed to fetch trending data:', errorMsg);
        setError(errorMsg);
        setAllRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state.location, state.searchLocation, selectedCategory, state.authUser?.id]);

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

  // Handle bookmark
  const handleToggleBookmark = async (restaurant: TrendingRestaurant) => {
    if (!state.authUser?.id) return;

    const isBookmarked = bookmarkedIds.has(restaurant.restaurant_id);

    try {
      if (isBookmarked) {
        await removeBookmarkedRestaurant(state.authUser.id, restaurant.restaurant_id);
        const newSet = new Set(bookmarkedIds);
        newSet.delete(restaurant.restaurant_id);
        setBookmarkedIds(newSet);
      } else {
        await saveBookmarkedRestaurant(state.authUser.id, {
          restaurant_id: restaurant.restaurant_id,
          name: restaurant.name,
          rating: restaurant.rating,
          price_level: restaurant.price_level,
          distance_meters: restaurant.distance_meters,
          hero_photo_url: restaurant.hero_photo_url || undefined
        });
        const newSet = new Set(bookmarkedIds);
        newSet.add(restaurant.restaurant_id);
        setBookmarkedIds(newSet);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Organize restaurants by category
  const michelinRestaurants = allRestaurants.filter((r) => r.michelin_designation);
  const topRatedRestaurants = [...allRestaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  const trendingRestaurants = allRestaurants.slice(0, 8);

  const renderCarouselCard = ({ item }: { item: TrendingRestaurant }) => (
    <View style={styles.carouselCard}>
      <TouchableOpacity
        style={styles.carouselTouchable}
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
      <TouchableOpacity
        style={styles.bookmarkButton}
        onPress={() => handleToggleBookmark(item)}
      >
        <Text style={styles.bookmarkIcon}>
          {bookmarkedIds.has(item.restaurant_id) ? '🔖' : '🔖'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSmallCard = ({ item }: { item: TrendingRestaurant }) => (
    <View>
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
        <View style={styles.smallCardImageContainer}>
          {item.hero_photo_url ? (
            <Image
              source={{ uri: item.hero_photo_url }}
              style={styles.smallCardImage}
            />
          ) : (
            <View style={[styles.smallCardImage, styles.smallCardImagePlaceholder]}>
              <Text style={styles.smallCardImagePlaceholderText}>🍽️</Text>
            </View>
          )}
        </View>

        <View style={styles.smallCardContent}>
          <View style={styles.smallCardInfo}>
            <Text style={styles.smallCardName} numberOfLines={2}>{item.name}</Text>
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
          <View style={styles.smallCardActions}>
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
            <TouchableOpacity
              onPress={() => handleToggleBookmark(item)}
              style={styles.smallBookmarkButton}
            >
              <Text style={styles.smallBookmarkIcon}>
                {bookmarkedIds.has(item.restaurant_id) ? '🔖' : '☐'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.primary} size="large" />
          <Text style={styles.loadingText}>Discovering trending spots...</Text>
          <Text style={styles.loadingText}>{selectedCategory}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: 'red' }]}>ERROR:</Text>
          <Text style={[styles.loadingText, { color: 'red', fontSize: 12 }]}>{error}</Text>
          <Text style={[styles.loadingText, { color: 'gray', fontSize: 12, marginTop: 20 }]}>
            API URL: {process.env.EXPO_PUBLIC_API_URL}
          </Text>
          <Text style={[styles.loadingText, { color: 'gray', fontSize: 12 }]}>
            Category: {selectedCategory}
          </Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
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
            style={[styles.categoryPill, selectedCategory === 'cozy-cafes' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('cozy-cafes')}
          >
            <Text style={[styles.categoryLabel, selectedCategory === 'cozy-cafes' && styles.categoryLabelActive]}>
              ☕ Cozy Cafes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'fine-dining' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('fine-dining')}
          >
            <Text style={[styles.categoryLabel, selectedCategory === 'fine-dining' && styles.categoryLabelActive]}>
              🍽️ Fine Dining
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
        </ScrollView>

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

        {/* Michelin Restaurants Section - Only show for 'all' category */}
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

        {/* Top Rated Section - Only show for 'all' category */}
        {selectedCategory === 'all' && topRatedRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TOP RATED</Text>
            {topRatedRestaurants.map((restaurant) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* Category Results Section */}
        {trendingRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'newest' && '✨ TRENDING & NEWEST'}
              {selectedCategory === 'garden' && '🌿 GARDEN RESTAURANTS'}
              {selectedCategory === 'city-view' && '🏙️ ROOFTOP & CITY VIEWS'}
              {selectedCategory === 'cozy-cafes' && '☕ COZY & INTIMATE CAFES'}
              {selectedCategory === 'fine-dining' && '🍽️ FINE DINING'}
              {selectedCategory === 'all' && '🔥 TRENDING NOW'}
            </Text>
            {trendingRestaurants.map((restaurant) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* Loading or Empty State */}
        {!loading && trendingRestaurants.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyFeedContainer}>
              <Text style={styles.emptyFeedEmoji}>🍽️</Text>
              <Text style={[styles.emptyFeedText, { color: theme.colors.textPrimary }]}>
                No restaurants found
              </Text>
              <Text style={[styles.emptyFeedSubtext, { color: theme.colors.textSecondary }]}>
                Try a different category
              </Text>
            </View>
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
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.md
  },
  categoryPill: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    minHeight: 40
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
    paddingBottom: tokens.spacing.lg
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
    marginBottom: tokens.spacing.sm,
    lineHeight: 40
  },
  subtitle: {
    fontSize: 15,
    color: tokens.colors.textSecondary,
    lineHeight: 20
  },
  carouselSection: {
    marginBottom: tokens.spacing.xxxl,
    marginTop: tokens.spacing.xl
  },
  carouselContent: {
    paddingHorizontal: tokens.spacing.xl,
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.lg,
    position: 'relative'
  },
  carouselTouchable: {
    width: '100%',
    height: '100%'
  },
  carouselImage: {
    width: '100%',
    height: '100%'
  },
  bookmarkButton: {
    position: 'absolute',
    top: tokens.spacing.md,
    right: tokens.spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadows.md
  },
  bookmarkIcon: {
    fontSize: 24
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    paddingTop: tokens.spacing.xxl
  },
  carouselContentGap: {
    gap: tokens.spacing.md
  },
  carouselName: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.xs
  },
  carouselMeta: {
    fontSize: 13,
    color: tokens.colors.textInverse,
    fontWeight: '500',
    opacity: 0.95
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
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.border,
    opacity: 0.5
  },
  dotActive: {
    backgroundColor: tokens.colors.primary,
    width: 20,
    opacity: 1
  },
  section: {
    paddingHorizontal: tokens.spacing.xl,
    marginBottom: tokens.spacing.xxxl,
    marginTop: tokens.spacing.xxl
  },
  sectionTitle: {
    ...tokens.typography.label,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xl,
    fontSize: 14,
    letterSpacing: 0.8,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  smallCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm,
    overflow: 'hidden'
  },
  smallCardImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#E8E8E8'
  },
  smallCardImage: {
    width: '100%',
    height: '100%'
  },
  smallCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.primaryTint
  },
  smallCardImagePlaceholderText: {
    fontSize: 40
  },
  smallCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
    padding: tokens.spacing.lg
  },
  smallCardInfo: {
    flex: 1
  },
  smallCardActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    alignItems: 'center',
    flexShrink: 0
  },
  smallCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm,
    lineHeight: 22
  },
  smallCardMeta: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18
  },
  smallBookmarkButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  smallBookmarkIcon: {
    fontSize: 20
  },
  smallMichelinBadge: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0
  },
  smallMichelinText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.xl,
    letterSpacing: 0.3
  },
  michelinCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm,
    minHeight: 70
  },
  michelinCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacing.md
  },
  michelinCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
    flex: 1
  },
  michelinCardMeta: {
    fontSize: 13,
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
