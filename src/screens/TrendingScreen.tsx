import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TrendingStackParamList } from '../../App';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<TrendingStackParamList, 'TrendingHome'>;

interface Restaurant {
  restaurant_id: string;
  name: string;
  hero_photo_url?: string | null;
  rating: number;
  price_level: number;
  distance_meters?: number;
  cuisine?: string;
  vibe_tags?: string[];
  match_reason?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const CATEGORIES = ['All', 'Mall Food', 'Quick Bites', 'Alfresco', 'Rooftop', 'Cozy Cafes', 'Date Night', 'New'];
type TrendingCategoryParam =
  | 'all'
  | 'mall-food'
  | 'quick-bites'
  | 'garden'
  | 'city-view'
  | 'cozy-cafes'
  | 'fine-dining'
  | 'newest';

const getCategoryParam = (category: string): TrendingCategoryParam => {
  const categoryMap: Record<string, TrendingCategoryParam> = {
    'Mall Food': 'mall-food',
    'Quick Bites': 'quick-bites',
    'Alfresco': 'garden',
    'Rooftop': 'city-view',
    'Cozy Cafes': 'cozy-cafes',
    'Date Night': 'fine-dining',
    'New': 'newest'
  };
  return categoryMap[category] || 'all';
};

export function TrendingScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<any>();
  const [trendingRestaurants, setTrendingRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { state } = useAppState();

  const loadTrendingData = React.useCallback(async () => {
    try {
      setLoading(true);
      const searchLoc = state.searchLocation || state.location;
      const location = searchLoc
        ? { lat: searchLoc.latitude, lng: searchLoc.longitude }
        : { lat: 10.3157, lng: 123.8854 };

      const result = await api.getTrendingRestaurants({
        ...location,
        limit: 12,
        category: getCategoryParam(selectedCategory),
      });

      setTrendingRestaurants(result?.results || []);
    } catch (error) {
      console.error('Error loading trending data:', error);
      setTrendingRestaurants([
        {
          restaurant_id: '1',
          name: 'Orizuru Ramen',
          hero_photo_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=400&fit=crop&q=80',
          rating: 4.6,
          price_level: 2,
          distance_meters: 950,
          cuisine: 'Japanese',
          match_reason: 'Popular for late-night comfort bowls nearby.'
        },
        {
          restaurant_id: '2',
          name: 'Via Roma 14',
          hero_photo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=400&fit=crop&q=80',
          rating: 4.5,
          price_level: 3,
          distance_meters: 1500,
          cuisine: 'Italian',
          match_reason: 'A frequent save for date-night plans.'
        },
        {
          restaurant_id: '3',
          name: 'The Hearth Grill',
          hero_photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop&q=80',
          rating: 4.7,
          price_level: 2,
          distance_meters: 1100,
          cuisine: 'Modern European',
          match_reason: 'Getting attention this week for its atmosphere.'
        },
        {
          restaurant_id: '4',
          name: 'Umami Omakase',
          hero_photo_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&h=400&fit=crop&q=80',
          rating: 4.9,
          price_level: 4,
          distance_meters: 2000,
          cuisine: 'Sushi',
          match_reason: 'A top pick for special dinners.'
        },
        {
          restaurant_id: '5',
          name: 'West Village Healthy Eats',
          hero_photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop&q=80',
          rating: 4.8,
          price_level: 2,
          distance_meters: 500,
          cuisine: 'Health',
          match_reason: 'Frequently bookmarked for casual catch-ups.'
        },
        {
          restaurant_id: '6',
          name: 'Creamy Truffle Pasta',
          hero_photo_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&h=400&fit=crop&q=80',
          rating: 4.9,
          price_level: 3,
          distance_meters: 800,
          cuisine: 'Italian',
          match_reason: 'Trending for rich comfort food cravings.'
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [state.searchLocation, state.location, selectedCategory]);

  useFocusEffect(
    React.useCallback(() => {
      loadTrendingData();
    }, [loadTrendingData])
  );

  const formatDistance = (meters?: number) => {
    if (!meters) return '—';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleNavigateToRestaurant = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetail', {
      restaurantId: restaurant.restaurant_id,
      cravingId: 'trending',
      cuisine: restaurant.cuisine || 'all',
    });
  };

  const renderTrendingCard = ({ item, index }: { item: Restaurant; index: number }) => (
    <TouchableOpacity
      key={item.restaurant_id}
      style={styles.trendingCard}
      onPress={() => handleNavigateToRestaurant(item)}
      activeOpacity={0.85}
    >
      {item.hero_photo_url ? (
        <Image source={{ uri: item.hero_photo_url }} style={styles.trendingImage} />
      ) : (
        <View style={[styles.trendingImage, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={40} color={tokens.colors.primary} />
        </View>
      )}
      <View style={styles.trendingOverlay}>
        <Text style={styles.trendingName}>{item.name}</Text>
        <Text style={styles.trendingMeta}>
          {(item.cuisine || 'Cuisine').replace(/_/g, ' ')} • {formatDistance(item.distance_meters)}
        </Text>
        <View style={styles.badgeContainer}>
          {index === 0 && <Text style={styles.badge}>TRENDING NOW</Text>}
          {index === 1 && <Text style={styles.badge}>BUZZING</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSocialProofCard = (restaurant: Restaurant, label: string, caption: string) => (
    <TouchableOpacity
      key={`${label}-${restaurant.restaurant_id}`}
      style={styles.proofCard}
      onPress={() => handleNavigateToRestaurant(restaurant)}
      activeOpacity={0.85}
    >
      {restaurant.hero_photo_url ? (
        <Image source={{ uri: restaurant.hero_photo_url }} style={styles.proofImage} />
      ) : (
        <View style={[styles.proofImage, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={32} color={tokens.colors.primary} />
        </View>
      )}
      <View style={styles.proofContent}>
        <Text style={styles.proofBadge}>{label}</Text>
        <Text style={styles.proofTitle} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.proofCaption} numberOfLines={2}>
          {restaurant.match_reason || caption}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Trending</Text>
            <Text style={styles.headerSubtitle}>What people are saving and noticing nearby.</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={tokens.colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => rootNavigation.navigate('Profile')}>
              <Ionicons
                name="person-circle"
                size={24}
                color={tokens.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryPill,
                selectedCategory === category && { backgroundColor: tokens.colors.primary }
              ]}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && { color: 'white' }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Trending Near You</Text>
            <Ionicons name="flame" size={20} color={tokens.colors.primary} />
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            snapToInterval={CARD_WIDTH + 20}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingListContent}
          >
            {trendingRestaurants.slice(0, 6).map((restaurant, index) =>
              renderTrendingCard({ item: restaurant, index })
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Most Saved This Week</Text>
            <Ionicons name="bookmark" size={18} color={tokens.colors.primary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.proofRow}
          >
            {trendingRestaurants.slice(2, 6).map((restaurant, index) =>
              renderSocialProofCard(
                restaurant,
                index === 0 ? 'MOST SAVED' : 'BUZZING',
                'Getting attention from nearby diners this week.'
              )
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>New & Buzzing</Text>
            <Ionicons name="sparkles" size={18} color={tokens.colors.primary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.proofRow}
          >
            {trendingRestaurants.slice(6, 10).map((restaurant) =>
              renderSocialProofCard(
                restaurant,
                'NEW',
                'Worth a look if you want something fresh nearby.'
              )
            )}
          </ScrollView>
        </View>

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
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: tokens.typography.small.fontSize,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
    maxWidth: 240,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
  },
  iconButton: {
    padding: tokens.spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  categoryPill: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.backgroundLight,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: tokens.spacing.xxl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    color: tokens.colors.textHeading,
  },
  trendingListContent: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.lg,
  },
  trendingCard: {
    width: CARD_WIDTH / 2 - 10,
    height: 220,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colors.backgroundLight,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.primaryTint,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: tokens.spacing.md,
  },
  trendingName: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.sm,
  },
  trendingMeta: {
    fontSize: tokens.typography.caption.fontSize,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: tokens.spacing.sm,
    textTransform: 'capitalize',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  badge: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
    backgroundColor: tokens.colors.textInverse,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
  },
  proofRow: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  proofCard: {
    width: 220,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  proofImage: {
    width: '100%',
    height: 120,
    backgroundColor: tokens.colors.primaryTint,
  },
  proofContent: {
    padding: tokens.spacing.md,
  },
  proofBadge: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: tokens.spacing.xs,
  },
  proofTitle: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '700',
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.xs,
  },
  proofCaption: {
    fontSize: tokens.typography.small.fontSize,
    color: tokens.colors.textSecondary,
    lineHeight: 18,
  },
});
