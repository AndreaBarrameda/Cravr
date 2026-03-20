import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Linking
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { ScreenContainer } from '../components/UI';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

type TrendingRestaurant = {
  restaurant_id: string;
  name: string;
  rating: number;
  price_level: number;
  distance_meters: number;
  photo_url?: string;
  address?: string;
  vibe_tags?: string[];
};

export function DiscoveryDashboardScreen({ navigation }: Props) {
  const { state, setState } = useAppState();
  const [trending, setTrending] = useState<TrendingRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const lat = state.location?.latitude ?? 10.3157;
        const lng = state.location?.longitude ?? 123.8854;

        // Fetch nearby restaurants as trending
        const data = await api.discoverRestaurants({
          craving_text: '',
          location: { lat, lng }
        });

        if (data.restaurants && Array.isArray(data.restaurants)) {
          setTrending(data.restaurants.slice(0, 10));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch trending:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [state.location]);

  // Update saved IDs when savedRestaurants changes
  useEffect(() => {
    const ids = new Set(state.savedRestaurants?.map((r) => r.restaurant_id) || []);
    setSavedIds(ids);
  }, [state.savedRestaurants]);

  const handleSaveRestaurant = (restaurant: TrendingRestaurant) => {
    const isSaved = savedIds.has(restaurant.restaurant_id);

    setState((prev) => {
      if (isSaved) {
        return {
          ...prev,
          savedRestaurants: prev.savedRestaurants?.filter(
            (r) => r.restaurant_id !== restaurant.restaurant_id
          ) || []
        };
      } else {
        return {
          ...prev,
          savedRestaurants: [
            ...(prev.savedRestaurants || []),
            {
              restaurant_id: restaurant.restaurant_id,
              name: restaurant.name,
              rating: restaurant.rating,
              price_level: restaurant.price_level,
              distance_meters: restaurant.distance_meters,
              photo_url: restaurant.photo_url,
              address: restaurant.address
            }
          ]
        };
      }
    });
  };

  const trendingCuisines = [
    { emoji: '🍜', name: 'Ramen', label: 'Japanese' },
    { emoji: '🍕', name: 'Pizza', label: 'Italian' },
    { emoji: '🌮', name: 'Tacos', label: 'Mexican' },
    { emoji: '🍱', name: 'Sushi', label: 'Japanese' },
    { emoji: '🍛', name: 'Curry', label: 'Indian' },
    { emoji: '🥟', name: 'Dumplings', label: 'Asian' }
  ];

  const handleCuisinePress = (cuisineName: string) => {
    navigation.navigate('Discover', {
      screen: 'DishDiscovery',
      params: {
        cravingId: '',
        cuisine: cuisineName,
        attributes: {
          temperature: null,
          flavor: null,
          texture: null,
          intensity: null,
          occasion: null,
          budget: null
        },
        craving_text: cuisineName
      }
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenContainer>
          <ActivityIndicator color="#FF6A2A" size="large" />
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>What's trending near you</Text>
        </View>

        {/* Trending Cuisines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Now</Text>
          <View style={styles.cuisineGrid}>
            {trendingCuisines.map((cuisine, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.cuisineCard}
                onPress={() => handleCuisinePress(cuisine.name)}
              >
                <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                <Text style={styles.cuisineName}>{cuisine.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Restaurants - Social Media Style */}
        <View style={styles.feedSection}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Trending Now</Text>
          <FlatList
            data={trending}
            keyExtractor={(item) => item.restaurant_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.socialCard}>
                {/* Card Image/Header */}
                {item.photo_url ? (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Text style={styles.placeholderEmoji}>🍽️</Text>
                  </View>
                )}

                {/* Card Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleSection}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <View style={styles.cardBadges}>
                        <Text style={styles.badge}>⭐ {item.rating.toFixed(1)}</Text>
                        <Text style={styles.badge}>
                          {'💰'.repeat(item.price_level)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions2}>
                      <TouchableOpacity
                        style={styles.saveIconButton}
                        onPress={() => handleSaveRestaurant(item)}
                      >
                        <Text style={styles.saveIcon}>
                          {savedIds.has(item.restaurant_id) ? '❤️' : '🤍'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.cardDistance}>
                        {(item.distance_meters / 1000).toFixed(1)}
                        {'\n'}
                        <Text style={styles.distanceLabel}>km away</Text>
                      </Text>
                    </View>
                  </View>

                  {item.address && (
                    <Text style={styles.cardAddress} numberOfLines={1}>
                      📍 {item.address}
                    </Text>
                  )}

                  {item.vibe_tags && item.vibe_tags.length > 0 && (
                    <View style={styles.vibeTagsContainer}>
                      {item.vibe_tags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={styles.vibeTag}>
                          <Text style={styles.vibeTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        navigation.navigate('RestaurantDetail', {
                          restaurantId: item.restaurant_id,
                          cravingId: '',
                          cuisine: ''
                        });
                      }}
                    >
                      <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={() => {
                        navigation.navigate('SoloCheck', {
                          restaurantId: item.restaurant_id,
                          cravingId: '',
                          cuisine: ''
                        });
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Dine Here 🍽️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 12
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  cuisineCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  cuisineEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  cuisineName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#161616',
    textAlign: 'center'
  },
  feedSection: {
    paddingBottom: 40
  },
  socialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  cardImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#F5F5F5'
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0E6'
  },
  placeholderEmoji: {
    fontSize: 64,
    opacity: 0.5
  },
  cardContent: {
    padding: 20
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12
  },
  cardActions2: {
    alignItems: 'flex-end',
    gap: 8
  },
  saveIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  saveIcon: {
    fontSize: 20
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 8
  },
  badge: {
    backgroundColor: '#FFF0E6',
    color: '#FF6A2A',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden'
  },
  cardDistance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6A2A',
    textAlign: 'right',
    lineHeight: 18
  },
  distanceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B6B6B'
  },
  cardAddress: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 12,
    lineHeight: 18
  },
  vibeTagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  vibeTag: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  vibeTagText: {
    fontSize: 12,
    color: '#161616',
    fontWeight: '500'
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#FFE0CF'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6A2A'
  },
  primaryButton: {
    backgroundColor: '#FF6A2A',
    borderColor: '#FF6A2A'
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});
