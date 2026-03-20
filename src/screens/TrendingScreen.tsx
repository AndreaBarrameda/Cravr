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
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Trending'>,
  NativeStackScreenProps<RootStackParamList>
>;

type TrendingRestaurant = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  rating: number;
  price_level: number;
  michelin_stars?: number;
  distance_meters?: number;
  vibe_tags?: string[];
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const getMichelinStars = (stars?: number) => {
  if (!stars) return null;
  if (stars >= 3) return '★★★';
  if (stars === 2) return '★★';
  if (stars === 1) return '★';
  return null;
};

const getMichelinColor = (stars?: number) => {
  if (!stars) return '#999';
  if (stars >= 3) return '#FFD700';
  if (stars === 2) return '#FFA500';
  if (stars === 1) return '#FF6A2A';
  return '#999';
};

export function TrendingScreen({ navigation }: Props) {
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [allRestaurants, setAllRestaurants] = useState<TrendingRestaurant[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const location = state.location
          ? { lat: state.location.latitude, lng: state.location.longitude }
          : { lat: 10.3157, lng: 123.8854 };

        // Create a timeout promise (5 seconds)
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
        console.error('Failed to fetch trending:', e);
        // Show empty state instead of error
        setAllRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [state.location]);

  // Organize restaurants by category
  const michelinRestaurants = allRestaurants.filter((r) => (r.michelin_stars || 0) > 0);
  const topRatedRestaurants = [...allRestaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  const trendingRestaurants = allRestaurants.slice(0, 8);

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
          {item.michelin_stars ? (
            <View
              style={[
                styles.carouselMichelinBadge,
                { backgroundColor: getMichelinColor(item.michelin_stars) }
              ]}
            >
              <Text style={styles.carouselMichelinText}>
                🌟 Michelin {getMichelinStars(item.michelin_stars)}
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
        {item.michelin_stars ? (
          <View
            style={[
              styles.smallMichelinBadge,
              { backgroundColor: getMichelinColor(item.michelin_stars) }
            ]}
          >
            <Text style={styles.smallMichelinText}>
              {getMichelinStars(item.michelin_stars)}
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
          <ActivityIndicator color="#FF6A2A" size="large" />
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
          <Text style={styles.title}>🔥 What's Trending</Text>
          <Text style={styles.subtitle}>In Cebu right now</Text>
        </View>

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

        {/* Michelin Stars Section */}
        {michelinRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌟 Michelin Starred</Text>
            {michelinRestaurants.slice(0, 5).map((restaurant) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* Top Rated Section */}
        {topRatedRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Top Rated</Text>
            {topRatedRestaurants.map((restaurant, idx) => (
              <View key={restaurant.restaurant_id}>
                {renderSmallCard({ item: restaurant })}
              </View>
            ))}
          </View>
        )}

        {/* All Trending Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Trending This Week</Text>
          {trendingRestaurants.slice(0, 8).map((restaurant) => (
            <View key={restaurant.restaurant_id}>
              {renderSmallCard({ item: restaurant })}
            </View>
          ))}
        </View>
      </ScrollView>
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
    fontSize: 14,
    color: '#6B6B6B'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  carouselSection: {
    marginBottom: 32
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 20
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
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
    padding: 20,
    paddingBottom: 24
  },
  carouselContent: {
    gap: 12
  },
  carouselName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  carouselMeta: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500'
  },
  carouselMichelinBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  carouselMichelinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingBottom: 16
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD'
  },
  dotActive: {
    backgroundColor: '#FF6A2A',
    width: 24
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 16
  },
  smallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  smallCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  smallCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 4
  },
  smallCardMeta: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '500'
  },
  smallMichelinBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  smallMichelinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
