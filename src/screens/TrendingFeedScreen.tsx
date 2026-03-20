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
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrendingStackParamList } from '../../App';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<TrendingStackParamList, 'TrendingFeed'>;

type TrendingRestaurant = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  rating: number;
  price_level: number;
  review_count: number;
  isHottest: boolean;
  isNew: boolean;
  isFeatured: boolean;
  engagement_score: number;
  vibe_tags?: string[];
};

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.75;

export function TrendingFeedScreen({ navigation }: Props) {
  const { state } = useAppState();
  const [restaurants, setRestaurants] = useState<TrendingRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const lat = state.location?.latitude ?? 10.3157;
        const lng = state.location?.longitude ?? 123.8854;

        const data = await api.getTrendingRestaurants({
          lat,
          lng,
          limit: 30
        });

        setRestaurants(data.results || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch trending:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [state.location]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderCard = ({ item }: { item: TrendingRestaurant }) => (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={1}
      onPress={() =>
        navigation.navigate('RestaurantDetail' as any, {
          restaurantId: item.restaurant_id,
          cravingId: 'trending',
          cuisine: ''
        })
      }
    >
      {/* Hero Image */}
      {item.hero_photo_url ? (
        <Image source={{ uri: item.hero_photo_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Badges */}
        <View style={styles.badgeRow}>
          {item.isHottest && (
            <View style={styles.hotBadge}>
              <Text style={styles.badgeText}>🔥 HOTTEST</Text>
            </View>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.badgeText}>⭐ FEATURED</Text>
            </View>
          )}
          {item.isNew && !item.isFeatured && (
            <View style={styles.newBadge}>
              <Text style={styles.badgeText}>✨ NEW</Text>
            </View>
          )}
        </View>

        {/* Restaurant Name */}
        <Text style={styles.name}>{item.name}</Text>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            ⭐ {item.rating.toFixed(1)} • {'₱'.repeat(item.price_level || 1)}
          </Text>
          <Text style={styles.reviews}>
            {item.review_count.toLocaleString()} reviews
          </Text>
        </View>

        {/* Engagement Score */}
        <View style={styles.engagementBar}>
          <View
            style={[
              styles.engagementFill,
              { width: `${item.engagement_score * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.engagementLabel}>
          {Math.round(item.engagement_score * 100)}% Engagement
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() =>
            navigation.navigate('RestaurantDetail' as any, {
              restaurantId: item.restaurant_id,
              cravingId: 'trending',
              cuisine: ''
            })
          }
        >
          <Text style={styles.ctaText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔥 What's Trending</Text>
        <Text style={styles.headerSubtitle}>Hottest restaurants in Cebu</Text>
      </View>

      {/* Card Stack */}
      <FlatList
        data={restaurants}
        renderItem={renderCard}
        keyExtractor={(item) => item.restaurant_id}
        horizontal
        pagingEnabled
        scrollEnabled
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Dots Indicator */}
      {restaurants.length > 0 && (
        <View style={styles.dotsContainer}>
          {restaurants.slice(0, 5).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
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
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    backgroundColor: tokens.colors.background
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs
  },
  headerSubtitle: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '500'
  },
  listContent: {
    paddingHorizontal: 0
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
    marginHorizontal: 0,
    backgroundColor: tokens.colors.background
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.background
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.xl,
    paddingBottom: 120
  },
  badgeRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
    flexWrap: 'wrap'
  },
  hotBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full
  },
  newBadge: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full
  },
  featuredBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: tokens.spacing.lg,
    lineHeight: 34
  },
  metaRow: {
    flexDirection: 'column',
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm
  },
  meta: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600'
  },
  reviews: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500'
  },
  engagementBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden'
  },
  engagementFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary,
    borderRadius: 3
  },
  engagementLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: tokens.spacing.lg
  },
  cta: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm
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
  }
});
