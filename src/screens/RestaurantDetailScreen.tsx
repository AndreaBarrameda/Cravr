import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { api } from '../api/client';
import { calculateHaversineDistance, formatDistance } from '../utils/distance';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'RestaurantDetail'>;

type Dish = {
  dish_id: string;
  name: string;
  description: string;
  photo_url: string | null;
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
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lat = state.location?.latitude ?? 34.0522;
        const lng = state.location?.longitude ?? -118.2437;

        // Extract place_id from restaurant_id (format: rst_<place_id>)
        const placeId = restaurantId.replace(/^rst_/, '');

        // Load details in background (non-blocking)
        api.getRestaurantDetails(placeId).then((detailsData) => {
          if (detailsData) {
            setRestaurantData(detailsData);
            // Calculate distance if we have coordinates
            if (detailsData.latitude && detailsData.longitude) {
              const distance = calculateHaversineDistance(lat, lng, detailsData.latitude, detailsData.longitude);
              setDistanceKm(distance);
            }
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
            // Pre-select the specified dish if provided
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
        // eslint-disable-next-line no-console
        console.error('Failed to fetch restaurant data:', e);
      }
    };

    fetchData();
  }, [restaurantId, cravingId, state.location, dishId]);

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

  return (
    <ScrollView style={styles.container}>
      <ScreenContainer>
        {/* Restaurant Header - shows loading state while details load */}
        {restaurantData ? (
          <>
            {restaurantData.hero_photo_url && (
              <Image
                source={{ uri: restaurantData.hero_photo_url }}
                style={styles.heroImage}
              />
            )}

            <View style={styles.header}>
              <Text style={styles.restaurantName}>{restaurantData.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>
                  {restaurantData.rating} ★ • {'$'.repeat(restaurantData.price_level)}
                </Text>
              </View>
            </View>

            {/* Location & Hours */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Location</Text>
                <Text style={styles.infoValue}>{restaurantData.address}</Text>
              </View>
              {distanceKm !== null && (
                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Text style={styles.infoLabel}>📌 Distance</Text>
                  <Text style={styles.distanceValue}>{formatDistance(distanceKm)} away</Text>
                </View>
              )}
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Text style={styles.infoLabel}>📞 Phone</Text>
                <Text style={styles.infoValue}>{restaurantData.phone}</Text>
              </View>
              {restaurantData.hours && restaurantData.hours.length > 0 && (
                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Text style={styles.infoLabel}>🕐 Hours</Text>
                  <Text style={styles.infoValue}>
                    {restaurantData.hours[new Date().getDay()] || 'See website for hours'}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonInfoCard} />
          </View>
        )}


        {/* Continue Button */}
        <View style={styles.footer}>
          <CravrButton
            label={selectedDish ? 'Continue' : 'Skip Dish Selection'}
            onPress={onContinue}
          />
        </View>
      </ScreenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B6B6B'
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 16
  },
  header: {
    marginBottom: 20
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rating: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6A2A',
    width: '25%'
  },
  infoValue: {
    fontSize: 14,
    color: '#161616',
    flex: 1,
    marginLeft: 12,
    lineHeight: 20
  },
  distanceValue: {
    fontSize: 14,
    color: '#FF6A2A',
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
    lineHeight: 20
  },
  menuSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 12
  },
  dishCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  dishCardSelected: {
    borderColor: '#FF6A2A',
    backgroundColor: '#FFF8F3'
  },
  dishImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E8E8E8'
  },
  dishInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between'
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  dishName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161616',
    flex: 1,
    marginRight: 8
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6A2A'
  },
  dishDescription: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 8,
    lineHeight: 18
  },
  matchScore: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  matchScoreText: {
    fontSize: 12,
    color: '#FF6A2A',
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  emptyText: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center'
  },
  footer: {
    marginTop: 20,
    marginBottom: 40
  },
  skeletonHeader: {
    marginBottom: 20
  },
  skeletonLine: {
    height: 24,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    marginBottom: 12
  },
  skeletonInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    height: 120,
    backgroundColor: '#F5F5F5'
  }
});
